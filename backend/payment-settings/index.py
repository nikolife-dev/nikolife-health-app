import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
}

# Описание провайдеров и их полей. secret=True — значение маскируется при чтении.
PROVIDERS = {
    'tribute': {
        'title': 'Tribute',
        'status': 'active',
        'fields': [
            {'key': 'api_key', 'label': 'API-ключ (Api-Key)', 'secret': True},
            {'key': 'webhook_secret', 'label': 'Секрет вебхука', 'secret': True},
        ],
    },
    'tbank': {
        'title': 'Т-Банк (Tinkoff)',
        'status': 'soon',
        'fields': [
            {'key': 'terminal_key', 'label': 'Terminal Key', 'secret': False},
            {'key': 'password', 'label': 'Пароль терминала', 'secret': True},
        ],
    },
    'sberbank': {
        'title': 'Сбербанк',
        'status': 'soon',
        'fields': [
            {'key': 'username', 'label': 'Логин API', 'secret': False},
            {'key': 'password', 'label': 'Пароль API', 'secret': True},
        ],
    },
    'yoomoney': {
        'title': 'ЮMoney (Yandex Money)',
        'status': 'soon',
        'fields': [
            {'key': 'shop_id', 'label': 'Shop ID', 'secret': False},
            {'key': 'secret_key', 'label': 'Секретный ключ', 'secret': True},
        ],
    },
}


def _json(status: int, payload: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', **CORS_HEADERS},
        'body': json.dumps(payload),
        'isBase64Encoded': False,
    }


def _get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _mask(value: str) -> str:
    if not value:
        return ''
    if len(value) <= 4:
        return '•' * len(value)
    return '•' * (len(value) - 4) + value[-4:]


def _load_gateways():
    conn = _get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT provider, is_enabled, settings FROM payment_gateways")
    rows = {r['provider']: r for r in cur.fetchall()}
    cur.close()
    conn.close()

    result = []
    for provider, meta in PROVIDERS.items():
        row = rows.get(provider)
        stored = (row['settings'] if row else {}) or {}
        is_enabled = bool(row['is_enabled']) if row else False
        fields = []
        for f in meta['fields']:
            raw = stored.get(f['key'], '') or ''
            fields.append({
                'key': f['key'],
                'label': f['label'],
                'secret': f['secret'],
                'filled': bool(raw),
                'value': '' if f['secret'] else raw,
                'masked': _mask(raw) if f['secret'] else raw,
            })
        result.append({
            'provider': provider,
            'title': meta['title'],
            'status': meta['status'],
            'is_enabled': is_enabled,
            'fields': fields,
        })
    return result


def handler(event: dict, context) -> dict:
    """Настройки платёжных шлюзов в админ-панели: чтение и сохранение параметров"""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': '', 'isBase64Encoded': False}

    if method == 'GET':
        return _json(200, {'gateways': _load_gateways()})

    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        provider = body.get('provider')
        if provider not in PROVIDERS:
            return _json(400, {'success': False, 'error': 'Неизвестный провайдер'})

        meta = PROVIDERS[provider]
        incoming = body.get('settings', {}) or {}
        is_enabled = bool(body.get('is_enabled', False))

        conn = _get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT settings FROM payment_gateways WHERE provider = %s", (provider,))
        row = cur.fetchone()
        current = (row['settings'] if row else {}) or {}

        new_settings = dict(current)
        for f in meta['fields']:
            key = f['key']
            if key in incoming:
                val = incoming.get(key)
                # Пустое значение секрета — не затираем ранее сохранённое
                if f['secret'] and (val is None or val == ''):
                    continue
                new_settings[key] = val

        cur.execute("""
            INSERT INTO payment_gateways (provider, is_enabled, settings, updated_at)
            VALUES (%s, %s, %s, NOW())
            ON CONFLICT (provider)
            DO UPDATE SET is_enabled = EXCLUDED.is_enabled,
                          settings = EXCLUDED.settings,
                          updated_at = NOW()
        """, (provider, is_enabled, json.dumps(new_settings)))
        conn.commit()
        cur.close()
        conn.close()

        return _json(200, {'success': True, 'gateways': _load_gateways()})

    return _json(405, {'error': 'Method not allowed'})
