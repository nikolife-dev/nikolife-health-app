import json
import os
import psycopg2
import hashlib
import secrets
from datetime import datetime, timedelta

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_urlsafe(32)

def handler(event: dict, context) -> dict:
    """
    Авторизация и регистрация пользователей
    """
    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            name = body.get('name')
            email = body.get('email')
            password = body.get('password')
            
            if not name or not email or not password:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': False, 'error': 'Все поля обязательны'}),
                    'isBase64Encoded': False
                }
            
            password_hash = hash_password(password)
            token = generate_token()
            
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            cur = conn.cursor()
            
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': False, 'error': 'Email уже используется'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                INSERT INTO users (name, email, password_hash, auth_token, created_at)
                VALUES (%s, %s, %s, %s, NOW())
                RETURNING id
            """, (name, email, password_hash, token))
            
            user_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'X-Set-Cookie': f'auth_token={token}; Path=/; HttpOnly; Max-Age=2592000; SameSite=Lax'
                },
                'body': json.dumps({
                    'success': True,
                    'user': {
                        'id': user_id,
                        'name': name,
                        'email': email
                    },
                    'token': token
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
    

        try:
            body = json.loads(event.get('body', '{}'))
            email = body.get('email')
            password = body.get('password')
            
            if not email or not password:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': False, 'error': 'Email и пароль обязательны'}),
                    'isBase64Encoded': False
                }
            
            password_hash = hash_password(password)
            
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            cur = conn.cursor()
            
            cur.execute("""
                SELECT id, name, email, password_hash FROM users WHERE email = %s
            """, (email,))
            
            row = cur.fetchone()
            
            if not row or row[3] != password_hash:
                cur.close()
                conn.close()
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': False, 'error': 'Неверный email или пароль'}),
                    'isBase64Encoded': False
                }
            
            token = generate_token()
            user_id, name, email_db = row[0], row[1], row[2]
            
            cur.execute("""
                UPDATE users SET auth_token = %s, last_login = NOW() WHERE id = %s
            """, (token, user_id))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'X-Set-Cookie': f'auth_token={token}; Path=/; HttpOnly; Max-Age=2592000; SameSite=Lax'
                },
                'body': json.dumps({
                    'success': True,
                    'user': {
                        'id': user_id,
                        'name': name,
                        'email': email_db
                    },
                    'token': token
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
            auth_token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
            
            if not auth_token:
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
                SELECT id, name, email, created_at FROM users WHERE auth_token = %s
            """, (auth_token,))
            
            row = cur.fetchone()
            cur.close()
            conn.close()
            
            if not row:
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Невалидный токен'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'id': row[0],
                    'name': row[1],
                    'email': row[2],
                    'createdAt': row[3].isoformat() if row[3] else None
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
        'statusCode': 404,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Not found'}),
        'isBase64Encoded': False
    }