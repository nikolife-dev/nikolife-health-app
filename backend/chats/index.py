import json
import os
import psycopg2
import psycopg2.extras
import urllib.request


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def send_telegram_message(chat_id, text):
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    if not token:
        return False
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    data = json.dumps({'chat_id': chat_id, 'text': text}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        urllib.request.urlopen(req, timeout=10)
        return True
    except Exception:
        return False


def notify_admin_telegram(user, text):
    """Дублирует обращение пользователя в групповой чат поддержки в Telegram"""
    admin_chat_id = os.environ.get('TELEGRAM_ADMIN_CHAT_ID', '')
    if not admin_chat_id:
        return False
    name = user.get('name') or f"Пользователь #{user.get('id')}"
    tg = user.get('telegram_username')
    tg_line = f"\nTelegram: @{tg}" if tg else ""
    msg = f"💬 Новое обращение\n\nОт: {name} (ID {user.get('id')}){tg_line}\n\n{text}"
    return send_telegram_message(admin_chat_id, msg)


FREE_MESSAGE_LIMIT = 2


def get_user_by_token(token):
    if not token:
        return None
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id, name, selected_plan, telegram_username FROM users WHERE auth_token = %s", (token,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    return user


def handler(event, context):
    """API чатов: список диалогов, сообщения, отправка, очистка и удаление"""
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
    action = params.get('action', '')
    headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}
    req_headers = event.get('headers') or {}
    auth_token = req_headers.get('X-Auth-Token') or req_headers.get('x-auth-token')

    # Пользовательские эндпоинты — определяем пользователя по токену
    if action == 'user_messages' and method == 'GET':
        user = get_user_by_token(auth_token)
        if not user:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Требуется авторизация'})}
        return get_user_chat(user, headers)

    if action == 'user_send' and method == 'POST':
        user = get_user_by_token(auth_token)
        if not user:
            return {'statusCode': 401, 'headers': headers, 'body': json.dumps({'error': 'Требуется авторизация'})}
        body = json.loads(event.get('body') or '{}')
        return user_send_message(user, body, headers)

    if method == 'GET':
        user_id = params.get('user_id')
        if user_id:
            return get_messages(int(user_id), headers)
        return get_chat_list(headers)

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        return send_message(body, headers)

    if method == 'DELETE':
        user_id = params.get('user_id')
        action = params.get('action', 'delete')
        if not user_id:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'user_id is required'})}
        if action == 'clear':
            return clear_chat(int(user_id), headers)
        return delete_chat(int(user_id), headers)

    return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Method not allowed'})}


def get_chat_list(headers):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT
            u.id,
            u.name,
            u.email,
            u.telegram_id,
            u.telegram_username,
            u.receive_notifications,
            m.text AS last_message,
            m.created_at AS last_time,
            m.channel AS last_channel,
            COALESCE(unread.cnt, 0) AS unread,
            channels.list AS channels
        FROM users u
        INNER JOIN LATERAL (
            SELECT text, created_at, channel
            FROM chat_messages
            WHERE user_id = u.id
            ORDER BY created_at DESC
            LIMIT 1
        ) m ON true
        LEFT JOIN LATERAL (
            SELECT COUNT(*) AS cnt
            FROM chat_messages
            WHERE user_id = u.id AND direction = 'in'
        ) unread ON true
        LEFT JOIN LATERAL (
            SELECT ARRAY_AGG(DISTINCT channel) AS list
            FROM chat_messages
            WHERE user_id = u.id
        ) channels ON true
        ORDER BY m.created_at DESC
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    result = []
    for r in rows:
        # Внутренний канал "Сайт" всегда доступен — ответ показывается пользователю прямо в чате
        available_channels = [{'id': 'support', 'enabled': True}]
        if r['telegram_id']:
            available_channels.append({
                'id': 'telegram',
                'enabled': bool(r['receive_notifications']),
            })
        email = r['email'] or ''
        if email and not email.endswith('.temp'):
            available_channels.append({
                'id': 'email',
                'enabled': bool(r['receive_notifications']),
            })

        result.append({
            'id': r['id'],
            'name': r['name'],
            'telegram_username': r['telegram_username'],
            'lastMessage': r['last_message'] or '',
            'lastTime': r['last_time'].strftime('%d.%m %H:%M') if r['last_time'] else '',
            'lastTimeIso': r['last_time'].isoformat() if r['last_time'] else '',
            'unread': r['unread'] or 0,
            'channels': r['channels'] or [],
            'availableChannels': available_channels,
        })
    return {'statusCode': 200, 'headers': headers, 'body': json.dumps(result)}


def get_messages(user_id, headers):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT id, text, channel, direction, created_at
        FROM chat_messages
        WHERE user_id = %s
        ORDER BY created_at ASC
    """, (user_id,))
    rows = cur.fetchall()

    cur.execute("""
        SELECT id, name, email, telegram_id, telegram_username, receive_notifications
        FROM users WHERE id = %s
    """, (user_id,))
    user = cur.fetchone()
    cur.close()
    conn.close()

    messages = []
    for r in rows:
        messages.append({
            'id': r['id'],
            'text': r['text'],
            'channel': r['channel'],
            'direction': r['direction'],
            'timestamp': r['created_at'].strftime('%d %b, %H:%M') if r['created_at'] else '',
            'timestampIso': r['created_at'].isoformat() if r['created_at'] else '',
        })

    user_data = None
    if user:
        # Внутренний канал "Сайт" всегда доступен — ответ показывается пользователю прямо в чате
        available_channels = [{'id': 'support', 'enabled': True}]
        if user['telegram_id']:
            available_channels.append({
                'id': 'telegram',
                'enabled': bool(user['receive_notifications']),
            })
        email = user['email'] or ''
        if email and not email.endswith('.temp'):
            available_channels.append({
                'id': 'email',
                'enabled': bool(user['receive_notifications']),
            })

        user_data = {
            'id': user['id'],
            'name': user['name'],
            'telegram_username': user['telegram_username'],
            'telegram_id': user['telegram_id'],
            'availableChannels': available_channels,
        }

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'user': user_data,
            'messages': messages,
        }),
    }


def send_message(body, headers):
    user_id = body.get('user_id')
    text = (body.get('text') or '').strip()
    channel = body.get('channel', 'telegram')

    if not user_id or not text:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'user_id and text are required'})}

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id, telegram_id, email FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()

    if not user:
        cur.close()
        conn.close()
        return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'User not found'})}

    sent = False
    if channel == 'support':
        # Внутренний чат на сайте — доставка не требуется, пользователь видит ответ в приложении
        sent = True
    elif channel == 'telegram':
        if not user['telegram_id']:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'User has no telegram_id'})}
        sent = send_telegram_message(user['telegram_id'], text)
    elif channel == 'email':
        sent = True

    if sent:
        cur.execute(
            "INSERT INTO chat_messages (user_id, text, channel, direction) VALUES (%s, %s, %s, 'out') RETURNING id, created_at",
            (user_id, text, channel)
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'message': {
                    'id': row['id'],
                    'text': text,
                    'channel': channel,
                    'direction': 'out',
                    'timestamp': row['created_at'].strftime('%d %b, %H:%M') if row['created_at'] else '',
                    'timestampIso': row['created_at'].isoformat() if row['created_at'] else '',
                },
            }),
        }

    cur.close()
    conn.close()
    return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': 'Failed to send message'})}


def get_user_chat(user, headers):
    """История чата для самого пользователя + инфо о лимите обращений"""
    user_id = user['id']
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT id, text, channel, direction, created_at
        FROM chat_messages
        WHERE user_id = %s
        ORDER BY created_at ASC
    """, (user_id,))
    rows = cur.fetchall()

    cur.execute(
        "SELECT COUNT(*) AS cnt FROM chat_messages WHERE user_id = %s AND direction = 'in'",
        (user_id,)
    )
    used = cur.fetchone()['cnt']
    cur.close()
    conn.close()

    messages = []
    for r in rows:
        messages.append({
            'id': r['id'],
            'text': r['text'],
            'channel': r['channel'],
            'direction': r['direction'],
            'timestamp': r['created_at'].strftime('%d %b, %H:%M') if r['created_at'] else '',
            'timestampIso': r['created_at'].isoformat() if r['created_at'] else '',
        })

    is_free = (user.get('selected_plan') or 'free') == 'free'
    limit = FREE_MESSAGE_LIMIT if is_free else None
    remaining = None if limit is None else max(0, limit - used)

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'messages': messages,
            'plan': user.get('selected_plan') or 'free',
            'isFree': is_free,
            'limit': limit,
            'used': used,
            'remaining': remaining,
        }),
    }


def user_send_message(user, body, headers):
    """Отправка сообщения от пользователя менеджеру (direction='in') с лимитом для free"""
    user_id = user['id']
    text = (body.get('text') or '').strip()
    if not text:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Введите сообщение'})}

    is_free = (user.get('selected_plan') or 'free') == 'free'

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    if is_free:
        cur.execute(
            "SELECT COUNT(*) AS cnt FROM chat_messages WHERE user_id = %s AND direction = 'in'",
            (user_id,)
        )
        used = cur.fetchone()['cnt']
        if used >= FREE_MESSAGE_LIMIT:
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': headers,
                'body': json.dumps({
                    'error': 'limit_reached',
                    'message': f'В бесплатном тарифе доступно только {FREE_MESSAGE_LIMIT} обращения. Оформите подписку для безлимитного общения с менеджером.',
                    'limit': FREE_MESSAGE_LIMIT,
                    'used': used,
                }),
            }

    cur.execute(
        "INSERT INTO chat_messages (user_id, text, channel, direction) VALUES (%s, %s, 'support', 'in') RETURNING id, created_at",
        (user_id, text)
    )
    row = cur.fetchone()

    cur.execute(
        "SELECT COUNT(*) AS cnt FROM chat_messages WHERE user_id = %s AND direction = 'in'",
        (user_id,)
    )
    used = cur.fetchone()['cnt']
    conn.commit()
    cur.close()
    conn.close()

    # Дублируем обращение в групповой чат поддержки в Telegram (если настроен)
    notify_admin_telegram(user, text)

    limit = FREE_MESSAGE_LIMIT if is_free else None
    remaining = None if limit is None else max(0, limit - used)

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'success': True,
            'message': {
                'id': row['id'],
                'text': text,
                'channel': 'support',
                'direction': 'in',
                'timestamp': row['created_at'].strftime('%d %b, %H:%M') if row['created_at'] else '',
                'timestampIso': row['created_at'].isoformat() if row['created_at'] else '',
            },
            'used': used,
            'limit': limit,
            'remaining': remaining,
        }),
    }


def clear_chat(user_id, headers):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM chat_messages WHERE user_id = %s", (user_id,))
    deleted = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'success': True, 'deleted': deleted}),
    }


def delete_chat(user_id, headers):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM chat_messages WHERE user_id = %s", (user_id,))
    deleted = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'success': True, 'deleted': deleted}),
    }