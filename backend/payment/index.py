import json
import os
import psycopg2
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    """
    Обработка платежей и управление подписками
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            plan_id = body.get('planId')
            amount = body.get('amount')
            is_yearly = body.get('isYearly', False)
            payment_method = body.get('paymentMethod', 'card')
            
            user_id = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': False, 'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            if not plan_id or amount is None:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': False, 'error': 'Неверные данные'}),
                    'isBase64Encoded': False
                }
            
            transaction_id = f"txn_{user_id}_{int(datetime.now().timestamp())}"
            
            if plan_id == 'free':
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'transactionId': transaction_id,
                        'planId': plan_id,
                        'message': 'Бесплатный план активирован'
                    }),
                    'isBase64Encoded': False
                }
            
            expires_at = datetime.now() + timedelta(days=365 if is_yearly else 30)
            
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            cur = conn.cursor()
            
            cur.execute("""
                INSERT INTO subscriptions (user_id, plan_id, status, amount, payment_method, transaction_id, expires_at, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (user_id) 
                DO UPDATE SET 
                    plan_id = EXCLUDED.plan_id,
                    status = EXCLUDED.status,
                    amount = EXCLUDED.amount,
                    payment_method = EXCLUDED.payment_method,
                    transaction_id = EXCLUDED.transaction_id,
                    expires_at = EXCLUDED.expires_at,
                    updated_at = NOW()
            """, (user_id, plan_id, 'active', amount, payment_method, transaction_id, expires_at))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'transactionId': transaction_id,
                    'planId': plan_id,
                    'expiresAt': expires_at.isoformat(),
                    'message': 'Платеж успешно обработан'
                }),
                'isBase64Encoded': False
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': False, 'error': str(e)}),
                'isBase64Encoded': False
            }
    
    if method == 'GET':
        try:
            user_id = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            cur = conn.cursor()
            
            cur.execute("""
                SELECT plan_id, status, amount, expires_at, created_at
                FROM subscriptions
                WHERE user_id = %s
            """, (user_id,))
            
            row = cur.fetchone()
            cur.close()
            conn.close()
            
            if row:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'planId': row[0],
                        'status': row[1],
                        'amount': row[2],
                        'expiresAt': row[3].isoformat() if row[3] else None,
                        'createdAt': row[4].isoformat() if row[4] else None
                    }),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'planId': 'free',
                        'status': 'active',
                        'amount': 0
                    }),
                    'isBase64Encoded': False
                }
                
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': str(e)}),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
