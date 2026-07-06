import json
import os
import hmac
import hashlib
import urllib.request
import urllib.error
import psycopg2
from datetime import datetime, timedelta

TRIBUTE_API_URL = 'https://tribute.tg/api/v1/shop/orders'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, trbt-signature',
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


def _get_tribute_settings() -> dict:
    """Читает настройки Tribute из админ-панели (таблица payment_gateways)."""
    try:
        conn = _get_conn()
        cur = conn.cursor()
        cur.execute("SELECT settings FROM payment_gateways WHERE provider = 'tribute'")
        row = cur.fetchone()
        cur.close()
        conn.close()
        return (row[0] if row and row[0] else {}) or {}
    except Exception:
        return {}


def _create_tribute_order(amount_rub: int, plan_id: str, is_yearly: bool, user_id: str) -> dict:
    """Создаёт заказ в Tribute и возвращает данные с ссылкой на оплату."""
    settings = _get_tribute_settings()
    api_key = settings.get('api_key') or os.environ.get('TRIBUTE_API_KEY')
    if not api_key:
        raise RuntimeError('TRIBUTE_API_KEY not configured')

    site_url = os.environ.get('SITE_URL', '').rstrip('/')
    payload = {
        'amount': int(amount_rub) * 100,  # Tribute принимает сумму в копейках
        'currency': 'rub',
        'name': f'Подписка {plan_id}',
        'period': 'yearly' if is_yearly else 'monthly',
        'externalId': f'{user_id}:{plan_id}:{int(datetime.now().timestamp())}',
        'successUrl': f'{site_url}/?payment=success',
        'failUrl': f'{site_url}/pricing?payment=failed',
    }

    req = urllib.request.Request(
        TRIBUTE_API_URL,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Api-Key': api_key},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        return json.loads(resp.read().decode('utf-8'))


def _verify_webhook(body_raw: str, signature: str) -> bool:
    settings = _get_tribute_settings()
    secret = settings.get('webhook_secret') or os.environ.get('TRIBUTE_WEBHOOK_SECRET')
    if not secret:
        return True
    if not signature:
        return False
    expected = hmac.new(secret.encode('utf-8'), body_raw.encode('utf-8'), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def _apply_promo_code(code: str, user_id, plan_id):
    """Проверяет и применяет промокод (free_access). Возвращает (row, error)."""
    conn = _get_conn()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT id, is_active, max_uses, used_count, once_per_user, expires_at
            FROM promo_codes
            WHERE LOWER(code) = LOWER(%s)
        """, (code.strip(),))
        row = cur.fetchone()
        if not row:
            return None, 'Промокод не найден'
        promo_id, is_active, max_uses, used_count, once_per_user, expires_at = row
        if not is_active:
            return None, 'Промокод отключён'
        if expires_at and expires_at < datetime.now():
            return None, 'Срок действия промокода истёк'
        if max_uses is not None and used_count >= max_uses:
            return None, 'Лимит применений исчерпан'
        if once_per_user:
            cur.execute("""
                SELECT 1 FROM promo_code_uses
                WHERE promo_code_id = %s AND user_id = %s LIMIT 1
            """, (promo_id, user_id))
            if cur.fetchone():
                return None, 'Вы уже использовали этот промокод'

        cur.execute("""
            INSERT INTO promo_code_uses (promo_code_id, user_id, plan_id)
            VALUES (%s, %s, %s)
        """, (promo_id, user_id, plan_id))
        cur.execute("""
            UPDATE promo_codes SET used_count = used_count + 1, updated_at = NOW()
            WHERE id = %s
        """, (promo_id,))
        conn.commit()
        return {'id': promo_id}, None
    finally:
        cur.close()
        conn.close()


def _activate_subscription(user_id, plan_id, amount, is_yearly, order_id):
    expires_at = datetime.now() + timedelta(days=365 if is_yearly else 30)
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO subscriptions
            (user_id, plan_id, status, amount, payment_method, provider,
             provider_order_id, is_yearly, expires_at, created_at)
        VALUES (%s, %s, 'active', %s, 'tribute', 'tribute', %s, %s, %s, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET
            plan_id = EXCLUDED.plan_id,
            status = 'active',
            amount = EXCLUDED.amount,
            payment_method = 'tribute',
            provider = 'tribute',
            provider_order_id = EXCLUDED.provider_order_id,
            is_yearly = EXCLUDED.is_yearly,
            expires_at = EXCLUDED.expires_at,
            updated_at = NOW()
    """, (user_id, plan_id, amount, order_id, is_yearly, expires_at))
    conn.commit()
    cur.close()
    conn.close()
    return expires_at


def handler(event: dict, context) -> dict:
    """Платежи через Tribute: создание заказа, вебхук оплаты и статус подписки"""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': '', 'isBase64Encoded': False}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    headers = event.get('headers') or {}

    # Вебхук от Tribute об изменении статуса заказа
    if method == 'POST' and action == 'webhook':
        body_raw = event.get('body', '') or ''
        signature = headers.get('trbt-signature') or headers.get('Trbt-Signature') or ''
        if not _verify_webhook(body_raw, signature):
            return _json(403, {'error': 'Invalid signature'})

        data = json.loads(body_raw or '{}')
        payload = data.get('payload', data)
        status = payload.get('status')
        external_id = payload.get('externalId', '') or ''
        order_id = str(payload.get('id', '') or payload.get('orderId', ''))
        amount = int(payload.get('amount', 0)) // 100

        if status == 'paid' and external_id:
            parts = external_id.split(':')
            user_id = parts[0] if len(parts) > 0 else None
            plan_id = parts[1] if len(parts) > 1 else 'premium'
            period = payload.get('period', '')
            is_yearly = period == 'yearly'
            if user_id:
                _activate_subscription(user_id, plan_id, amount, is_yearly, order_id)

        return _json(200, {'success': True})

    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        plan_id = body.get('planId')
        amount = body.get('amount')
        is_yearly = body.get('isYearly', False)

        promo_code = (body.get('promoCode') or '').strip()

        user_id = headers.get('X-User-Id') or headers.get('x-user-id')
        if not user_id:
            return _json(401, {'success': False, 'error': 'Требуется авторизация'})
        if not plan_id or amount is None:
            return _json(400, {'success': False, 'error': 'Неверные данные'})

        # Промокод: даёт бесплатный доступ (100% скидка)
        if promo_code:
            promo, err = _apply_promo_code(promo_code, user_id, plan_id)
            if err:
                return _json(200, {'success': False, 'error': err})
            _activate_subscription(user_id, plan_id, 0, is_yearly, None)
            return _json(200, {
                'success': True,
                'planId': plan_id,
                'promoApplied': True,
                'message': 'Промокод применён, подписка активирована',
            })

        # Бесплатный план активируется сразу
        if plan_id == 'free' or int(amount) == 0:
            _activate_subscription(user_id, plan_id, 0, is_yearly, None)
            return _json(200, {
                'success': True,
                'planId': plan_id,
                'message': 'Бесплатный план активирован',
            })

        try:
            order = _create_tribute_order(int(amount), plan_id, is_yearly, str(user_id))
        except urllib.error.HTTPError as e:
            return _json(502, {'success': False, 'error': f'Tribute error: {e.code}'})
        except Exception as e:
            return _json(500, {'success': False, 'error': str(e)})

        payment_url = order.get('paymentUrl') or order.get('webappPaymentUrl') or order.get('url')
        order_id = str(order.get('id', '') or order.get('orderId', ''))

        # Сохраняем ожидающий заказ, чтобы дождаться подтверждения по вебхуку
        conn = _get_conn()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO subscriptions
                (user_id, plan_id, status, amount, payment_method, provider,
                 provider_order_id, payment_url, is_yearly, created_at)
            VALUES (%s, %s, 'pending', %s, 'tribute', 'tribute', %s, %s, %s, NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET
                plan_id = EXCLUDED.plan_id,
                status = 'pending',
                amount = EXCLUDED.amount,
                payment_method = 'tribute',
                provider = 'tribute',
                provider_order_id = EXCLUDED.provider_order_id,
                payment_url = EXCLUDED.payment_url,
                is_yearly = EXCLUDED.is_yearly,
                updated_at = NOW()
        """, (user_id, plan_id, int(amount), order_id, payment_url, is_yearly))
        conn.commit()
        cur.close()
        conn.close()

        return _json(200, {
            'success': True,
            'planId': plan_id,
            'orderId': order_id,
            'paymentUrl': payment_url,
        })

    if method == 'GET':
        user_id = headers.get('X-User-Id') or headers.get('x-user-id')
        if not user_id:
            return _json(401, {'error': 'Требуется авторизация'})

        conn = _get_conn()
        cur = conn.cursor()
        cur.execute("""
            SELECT plan_id, status, amount, expires_at, created_at, payment_url, provider_order_id
            FROM subscriptions
            WHERE user_id = %s
        """, (user_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if row:
            return _json(200, {
                'planId': row[0],
                'status': row[1],
                'amount': row[2],
                'expiresAt': row[3].isoformat() if row[3] else None,
                'createdAt': row[4].isoformat() if row[4] else None,
                'paymentUrl': row[5],
                'orderId': row[6],
            })
        return _json(200, {'planId': 'free', 'status': 'active', 'amount': 0})

    return _json(405, {'error': 'Method not allowed'})