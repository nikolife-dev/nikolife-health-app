import json
import os
import smtplib
import ssl
import urllib.request
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
import psycopg2
import psycopg2.extras


def get_conn():
    return psycopg2.connect(os.environ.get('SUPABASE_DB_URL') or os.environ['DATABASE_URL'])


def get_schema():
    return 'public' if os.environ.get('SUPABASE_DB_URL') else os.environ.get('MAIN_DB_SCHEMA', 'public')


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}


def resp(status, body):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(body, default=str), 'isBase64Encoded': False}


def ensure_table(cur, schema):
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS {schema}.broadcasts (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            channels VARCHAR(50) NOT NULL DEFAULT 'telegram',
            status VARCHAR(20) NOT NULL DEFAULT 'draft',
            total_recipients INTEGER NOT NULL DEFAULT 0,
            sent_count INTEGER NOT NULL DEFAULT 0,
            sent_telegram INTEGER NOT NULL DEFAULT 0,
            sent_email INTEGER NOT NULL DEFAULT 0,
            failed_count INTEGER NOT NULL DEFAULT 0,
            created_by INTEGER,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
            sent_at TIMESTAMP
        )
    """)


def get_admin(cur, schema, token):
    if not token:
        return None
    cur.execute(f"SELECT id, is_admin FROM {schema}.users WHERE auth_token = %s", (token,))
    row = cur.fetchone()
    if not row:
        return None
    return {'id': row[0], 'is_admin': bool(row[1])}


def send_telegram(chat_id, text):
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    if not token:
        return False
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    data = json.dumps({'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML', 'disable_web_page_preview': True}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        urllib.request.urlopen(req, timeout=10)
        return True
    except Exception:
        return False


def send_email_batch(recipients, subject, html_body):
    host = os.environ.get('SMTP_HOST', '')
    if not host or not recipients:
        return 0, ['smtp_not_configured'] if not host else []
    port = int(os.environ.get('SMTP_PORT', '465'))
    user = os.environ.get('SMTP_USER', '')
    password = os.environ.get('SMTP_PASSWORD', '')
    sender = os.environ.get('SMTP_FROM', user)
    sent = 0
    errors = []
    try:
        context = ssl.create_default_context()
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, context=context, timeout=30)
        else:
            server = smtplib.SMTP(host, port, timeout=30)
            server.starttls(context=context)
        if user and password:
            server.login(user, password)
        for name, email in recipients:
            try:
                msg = MIMEMultipart('alternative')
                msg['Subject'] = subject
                msg['From'] = formataddr(('Nikolife', sender)) if '<' not in sender else sender
                msg['To'] = email
                greeting = f"<p>Здравствуйте, {name}!</p>" if name else ""
                html = f"<div style='font-family:sans-serif;font-size:15px;color:#333'>{greeting}{html_body}</div>"
                msg.attach(MIMEText(html, 'html', 'utf-8'))
                server.sendmail(sender, [email], msg.as_string())
                sent += 1
            except Exception as e:
                errors.append(str(e)[:120])
        server.quit()
    except Exception as e:
        errors.append(str(e)[:200])
    return sent, errors


def count_recipients(cur, schema, channels):
    want_tg = 'telegram' in channels
    want_email = 'email' in channels
    conds = []
    if want_tg:
        conds.append("telegram_id IS NOT NULL")
    if want_email:
        conds.append("(email IS NOT NULL AND email <> '' AND email NOT LIKE '%@nikolife.temp')")
    if not conds:
        return 0
    cur.execute(f"""
        SELECT COUNT(*) FROM {schema}.users
        WHERE receive_notifications = TRUE AND ({' OR '.join(conds)})
    """)
    return cur.fetchone()[0]


def handler(event, context):
    """API модуля рассылок: список, создание, редактирование, удаление и отправка рассылок клиентам по Telegram и email с учётом согласия пользователя."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token')

    conn = get_conn()
    cur = conn.cursor()
    schema = get_schema()
    ensure_table(cur, schema)
    conn.commit()

    admin = get_admin(cur, schema, token)
    if not admin or not admin['is_admin']:
        cur.close()
        conn.close()
        return resp(403, {'error': 'Только администратор'})

    params = event.get('queryStringParameters') or {}
    bid = None
    if params.get('id'):
        try:
            bid = int(params['id'])
        except Exception:
            bid = None
    action = params.get('action')

    # GET список рассылок + общая статистика аудитории
    if method == 'GET' and not bid:
        cur.execute(f"""
            SELECT id, title, message, channels, status, total_recipients,
                   sent_count, sent_telegram, sent_email, failed_count,
                   created_at, sent_at
            FROM {schema}.broadcasts ORDER BY created_at DESC
        """)
        cols = ['id', 'title', 'message', 'channels', 'status', 'total_recipients',
                'sent_count', 'sent_telegram', 'sent_email', 'failed_count', 'created_at', 'sent_at']
        broadcasts = [dict(zip(cols, r)) for r in cur.fetchall()]

        cur.execute(f"SELECT COUNT(*) FROM {schema}.users")
        total_users = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {schema}.users WHERE receive_notifications = TRUE")
        opted_in = cur.fetchone()[0]
        tg_reach = count_recipients(cur, schema, ['telegram'])
        email_reach = count_recipients(cur, schema, ['email'])

        cur.close()
        conn.close()
        return resp(200, {
            'broadcasts': broadcasts,
            'audience': {
                'total_users': total_users,
                'opted_in': opted_in,
                'telegram_reach': tg_reach,
                'email_reach': email_reach,
            },
        })

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            body = {}

    # POST — создать рассылку (draft)
    if method == 'POST' and action != 'send':
        title = (body.get('title') or '').strip()
        message = (body.get('message') or '').strip()
        channels = body.get('channels') or ['telegram']
        if not title or not message:
            cur.close(); conn.close()
            return resp(400, {'error': 'Заполните заголовок и текст'})
        ch = ','.join([c for c in channels if c in ('telegram', 'email')]) or 'telegram'
        try:
            total = count_recipients(cur, schema, ch.split(','))
            cur.execute(f"""
                INSERT INTO {schema}.broadcasts (title, message, channels, status, total_recipients, created_by)
                VALUES (%s, %s, %s, 'draft', %s, %s) RETURNING id
            """, (title, message, ch, total, admin['id']))
            new_id = cur.fetchone()[0]
            conn.commit()
        except Exception as e:
            conn.rollback()
            import traceback
            print('[BROADCASTS] POST error:', traceback.format_exc())
            cur.close(); conn.close()
            return resp(500, {'error': f'Ошибка БД: {str(e)[:200]}'})
        cur.close(); conn.close()
        return resp(200, {'success': True, 'id': new_id})

    # PUT — редактировать draft
    if method == 'PUT' and bid:
        cur.execute(f"SELECT status FROM {schema}.broadcasts WHERE id = %s", (bid,))
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return resp(404, {'error': 'Рассылка не найдена'})
        if row[0] == 'sent':
            cur.close(); conn.close()
            return resp(400, {'error': 'Отправленную рассылку нельзя редактировать'})
        title = (body.get('title') or '').strip()
        message = (body.get('message') or '').strip()
        channels = body.get('channels') or ['telegram']
        ch = ','.join([c for c in channels if c in ('telegram', 'email')]) or 'telegram'
        total = count_recipients(cur, schema, ch.split(','))
        cur.execute(f"""
            UPDATE {schema}.broadcasts
            SET title = %s, message = %s, channels = %s, total_recipients = %s, updated_at = NOW()
            WHERE id = %s
        """, (title, message, ch, total, bid))
        conn.commit()
        cur.close(); conn.close()
        return resp(200, {'success': True})

    # DELETE
    if method == 'DELETE' and bid:
        cur.execute(f"DELETE FROM {schema}.broadcasts WHERE id = %s", (bid,))
        conn.commit()
        cur.close(); conn.close()
        return resp(200, {'success': True})

    # POST ?action=send — отправить
    if method == 'POST' and action == 'send' and bid:
        cur.execute(f"SELECT title, message, channels, status FROM {schema}.broadcasts WHERE id = %s", (bid,))
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return resp(404, {'error': 'Рассылка не найдена'})
        title, message, channels, status = row
        if status == 'sent':
            cur.close(); conn.close()
            return resp(400, {'error': 'Рассылка уже отправлена'})
        ch = channels.split(',')

        sent_tg = 0
        sent_email = 0
        failed = 0

        if 'telegram' in ch:
            cur.execute(f"""
                SELECT name, telegram_id FROM {schema}.users
                WHERE receive_notifications = TRUE AND telegram_id IS NOT NULL
            """)
            for name, tg_id in cur.fetchall():
                text = f"<b>{title}</b>\n\n{message}"
                if send_telegram(tg_id, text):
                    sent_tg += 1
                else:
                    failed += 1

        if 'email' in ch:
            cur.execute(f"""
                SELECT name, email FROM {schema}.users
                WHERE receive_notifications = TRUE
                  AND email IS NOT NULL AND email <> '' AND email NOT LIKE '%%@nikolife.temp'
            """)
            recipients = [(r[0], r[1]) for r in cur.fetchall()]
            html_body = f"<h2 style='color:#748c6d'>{title}</h2><p>{message}</p>"
            sent_email, errs = send_email_batch(recipients, title, html_body)
            failed += max(0, len(recipients) - sent_email)

        total_sent = sent_tg + sent_email
        cur.execute(f"""
            UPDATE {schema}.broadcasts
            SET status = 'sent', sent_count = %s, sent_telegram = %s, sent_email = %s,
                failed_count = %s, sent_at = NOW(), updated_at = NOW()
            WHERE id = %s
        """, (total_sent, sent_tg, sent_email, failed, bid))
        conn.commit()
        cur.close(); conn.close()
        return resp(200, {'success': True, 'sent_count': total_sent, 'sent_telegram': sent_tg, 'sent_email': sent_email, 'failed_count': failed})

    cur.close()
    conn.close()
    return resp(400, {'error': 'Некорректный запрос'})