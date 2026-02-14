import json
import os
import psycopg2
import psycopg2.extras


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event, context):
    """CRUD API для управления рассылками уведомлений"""
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

    result = []
    for r in rows:
        result.append({
            'id': r['id'],
            'title': r['title'],
            'text': r['text'],
            'channels': r['channels'] if r['channels'] else [],
            'status': r['status'],
            'recipients': r['recipients'] or 0,
            'createdAt': r['created_at'].strftime('%d.%m.%Y') if r['created_at'] else '',
            'sentAt': r['sent_at'].strftime('%d.%m.%Y %H:%M') if r['sent_at'] else None,
        })

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps(result)}


def handle_create(body, headers):
    title = body.get('title', '').strip()
    text = body.get('text', '').strip()
    channels = body.get('channels', [])
    status = body.get('status', 'draft')

    if not title or not text:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'title and text are required'})}

    if status not in ('draft', 'sent'):
        status = 'draft'

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    if status == 'sent':
        cur.execute(
            "INSERT INTO notifications (title, text, channels, status, sent_at) VALUES (%s, %s, %s, 'sent', NOW()) RETURNING *",
            (title, text, channels)
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

    result = {
        'id': row['id'],
        'title': row['title'],
        'text': row['text'],
        'channels': row['channels'] if row['channels'] else [],
        'status': row['status'],
        'recipients': row['recipients'] or 0,
        'createdAt': row['created_at'].strftime('%d.%m.%Y') if row['created_at'] else '',
        'sentAt': row['sent_at'].strftime('%d.%m.%Y %H:%M') if row['sent_at'] else None,
    }

    return {'statusCode': 201, 'headers': headers, 'body': json.dumps(result)}


def handle_update(body, headers):
    notif_id = body.get('id')
    if not notif_id:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'id is required'})}

    title = body.get('title', '').strip()
    text = body.get('text', '').strip()
    channels = body.get('channels', [])
    status = body.get('status')

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    if status == 'sent':
        cur.execute(
            "UPDATE notifications SET title=%s, text=%s, channels=%s, status='sent', sent_at=NOW(), updated_at=NOW() WHERE id=%s RETURNING *",
            (title, text, channels, notif_id)
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

    result = {
        'id': row['id'],
        'title': row['title'],
        'text': row['text'],
        'channels': row['channels'] if row['channels'] else [],
        'status': row['status'],
        'recipients': row['recipients'] or 0,
        'createdAt': row['created_at'].strftime('%d.%m.%Y') if row['created_at'] else '',
        'sentAt': row['sent_at'].strftime('%d.%m.%Y %H:%M') if row['sent_at'] else None,
    }

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps(result)}


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