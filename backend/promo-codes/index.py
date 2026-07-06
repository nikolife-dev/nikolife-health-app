import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

SCHEMA = 't_p76837068_nikolife_health_app'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
}


def _json(status: int, payload) -> dict:
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', **CORS_HEADERS},
        'body': json.dumps(payload, default=str),
        'isBase64Encoded': False,
    }


def _get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _validate_code(cur, code: str, user_id):
    """Проверяет промокод. Возвращает (row, error). row=None если невалиден."""
    cur.execute(f"""
        SELECT id, code, discount_type, is_active, max_uses, used_count,
               once_per_user, expires_at
        FROM {SCHEMA}.promo_codes
        WHERE LOWER(code) = LOWER(%s)
    """, (code.strip(),))
    row = cur.fetchone()
    if not row:
        return None, 'Промокод не найден'
    if not row['is_active']:
        return None, 'Промокод отключён'
    if row['expires_at'] and row['expires_at'] < datetime.now():
        return None, 'Срок действия промокода истёк'
    if row['max_uses'] is not None and row['used_count'] >= row['max_uses']:
        return None, 'Лимит применений исчерпан'
    if row['once_per_user'] and user_id:
        cur.execute(f"""
            SELECT 1 FROM {SCHEMA}.promo_code_uses
            WHERE promo_code_id = %s AND user_id = %s
            LIMIT 1
        """, (row['id'], user_id))
        if cur.fetchone():
            return None, 'Вы уже использовали этот промокод'
    return row, None


def handler(event: dict, context) -> dict:
    """Промокоды: управление в админке (CRUD) и проверка кода пользователем"""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': '', 'isBase64Encoded': False}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    headers = event.get('headers') or {}

    conn = _get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Проверка промокода пользователем перед оплатой
        if action == 'validate' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            code = body.get('code', '')
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            if not code:
                return _json(400, {'valid': False, 'error': 'Введите промокод'})
            row, err = _validate_code(cur, code, user_id)
            if err:
                return _json(200, {'valid': False, 'error': err})
            return _json(200, {
                'valid': True,
                'code': row['code'],
                'discount_type': row['discount_type'],
            })

        # Список промокодов (админка)
        if method == 'GET':
            cur.execute(f"""
                SELECT id, code, discount_type, is_active, max_uses, used_count,
                       once_per_user, expires_at, created_at
                FROM {SCHEMA}.promo_codes
                ORDER BY created_at DESC
            """)
            return _json(200, {'promo_codes': cur.fetchall()})

        # Создание / обновление промокода (админка)
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            promo_id = body.get('id')
            code = (body.get('code') or '').strip()
            max_uses = body.get('max_uses')
            once_per_user = bool(body.get('once_per_user', True))
            is_active = bool(body.get('is_active', True))
            expires_at = body.get('expires_at') or None

            if max_uses in ('', None):
                max_uses = None
            else:
                max_uses = int(max_uses)

            if promo_id:
                cur.execute(f"""
                    UPDATE {SCHEMA}.promo_codes
                    SET code = %s, max_uses = %s, once_per_user = %s,
                        is_active = %s, expires_at = %s, updated_at = NOW()
                    WHERE id = %s
                    RETURNING id
                """, (code, max_uses, once_per_user, is_active, expires_at, promo_id))
                if not cur.fetchone():
                    return _json(404, {'success': False, 'error': 'Промокод не найден'})
                conn.commit()
                return _json(200, {'success': True})

            if not code:
                return _json(400, {'success': False, 'error': 'Введите код'})

            cur.execute(f"SELECT 1 FROM {SCHEMA}.promo_codes WHERE LOWER(code) = LOWER(%s)", (code,))
            if cur.fetchone():
                return _json(400, {'success': False, 'error': 'Такой промокод уже существует'})

            cur.execute(f"""
                INSERT INTO {SCHEMA}.promo_codes
                    (code, discount_type, is_active, max_uses, once_per_user, expires_at)
                VALUES (%s, 'free_access', %s, %s, %s, %s)
                RETURNING id
            """, (code, is_active, max_uses, once_per_user, expires_at))
            conn.commit()
            return _json(200, {'success': True, 'id': cur.fetchone()['id']})

        # Удаление промокода (админка)
        if method == 'DELETE':
            promo_id = params.get('id')
            if not promo_id:
                return _json(400, {'success': False, 'error': 'Не указан id'})
            cur.execute(f"UPDATE {SCHEMA}.promo_codes SET is_active = FALSE, updated_at = NOW() WHERE id = %s", (promo_id,))
            conn.commit()
            return _json(200, {'success': True})

        return _json(405, {'error': 'Method not allowed'})
    finally:
        cur.close()
        conn.close()
