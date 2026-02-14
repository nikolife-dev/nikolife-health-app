import json
import os
import psycopg2
import psycopg2.extras
import urllib.request
import urllib.parse


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def send_telegram_message(chat_id, text):
    """Отправка сообщения в Telegram через Bot API"""
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    if not token:
        return False
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    data = json.dumps({
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML',
    }).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        urllib.request.urlopen(req, timeout=10)
        return True
    except Exception:
        return False


def broadcast_telegram(title, text):
    """Рассылка сообщения всем пользователям с telegram_id. Возвращает количество успешных отправок."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    message = f"<b>{title}</b>\n\n{text}"
    sent_count = 0
    for (chat_id,) in rows:
        if send_telegram_message(chat_id, message):
            sent_count += 1
    return sent_count


def format_row(r):
    return {
        'id': r['id'],
        'title': r['title'],
        'text': r['text'],
        'channels': r['channels'] if r['channels'] else [],
        'status': r['status'],
        'recipients': r['recipients'] or 0,
        'createdAt': r['created_at'].strftime('%d.%m.%Y') if r['created_at'] else '',
        'sentAt': r['sent_at'].strftime('%d.%m.%Y %H:%M') if r['sent_at'] else None,
    }


def handler(event, context):
    """CRUD API для управления рассылками с отправкой через Telegram"""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

    if method == 'GET':
        return handle_list(params, headers)
    elif method == 'POST':
        body = json.loads(event.get('body') or '{}')
        return handle_create(body, headers)
    elif method == 'PUT':
        body = json.loads(event.get('body') or '{}')
        return handle_update(body, headers)
    elif method == 'DELETE':
        return handle_delete(params, headers)

    return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Method not allowed'})}


def handle_list(params, headers):
    status_filter = params.get('status')
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    if status_filter == 'sent':
        cur.execute("SELECT * FROM notifications WHERE status = 'sent' ORDER BY sent_at DESC")
    elif status_filter:
        cur.execute("SELECT * FROM notifications WHERE status = %s ORDER BY created_at DESC", (status_filter,))
    else:
        cur.execute("SELECT * FROM notifications WHERE status != 'sent' ORDER BY created_at DESC")

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps([format_row(r) for r in rows])}


def handle_create(body, headers):
    title = body.get('title', '').strip()
    text = body.get('text', '').strip()
    channels = body.get('channels', [])
    status = body.get('status', 'draft')

    if not title or not text:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'title and text are required'})}

    if status not in ('draft', 'sent'):
        status = 'draft'

    recipients = 0
    if status == 'sent' and 'telegram' in channels:
        recipients = broadcast_telegram(title, text)

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    if status == 'sent':
        cur.execute(
            "INSERT INTO notifications (title, text, channels, status, sent_at, recipients) VALUES (%s, %s, %s, 'sent', NOW(), %s) RETURNING *",
            (title, text, channels, recipients)
        )
    else:
        cur.execute(
            "INSERT INTO notifications (title, text, channels, status) VALUES (%s, %s, %s, %s) RETURNING *",
            (title, text, channels, status)
        )

    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return {'statusCode': 201, 'headers': headers, 'body': json.dumps(format_row(row))}


def handle_update(body, headers):
    notif_id = body.get('id')
    if not notif_id:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'id is required'})}

    title = body.get('title', '').strip()
    text = body.get('text', '').strip()
    channels = body.get('channels', [])
    status = body.get('status')

    recipients = 0
    if status == 'sent' and 'telegram' in channels:
        recipients = broadcast_telegram(title, text)

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    if status == 'sent':
        cur.execute(
            "UPDATE notifications SET title=%s, text=%s, channels=%s, status='sent', sent_at=NOW(), updated_at=NOW(), recipients=%s WHERE id=%s RETURNING *",
            (title, text, channels, recipients, notif_id)
        )
    else:
        cur.execute(
            "UPDATE notifications SET title=%s, text=%s, channels=%s, status=%s, updated_at=NOW() WHERE id=%s RETURNING *",
            (title, text, channels, status or 'draft', notif_id)
        )

    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not row:
        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Notification not found'})}

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps(format_row(row))}


def handle_delete(params, headers):
    notif_id = params.get('id')
    if not notif_id:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'id is required'})}

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("DELETE FROM notifications WHERE id = %s RETURNING id", (notif_id,))
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if not row:
        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Notification not found'})}

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}
