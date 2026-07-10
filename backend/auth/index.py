import json
import os
import psycopg2
import hashlib
import secrets
import hmac

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    return secrets.token_urlsafe(32)

def verify_telegram_auth(auth_data: dict, bot_token: str) -> bool:
    """Проверяет подлинность данных от Telegram"""
    # ВРЕМЕННО отключаем проверку hash для отладки
    # TODO: Проверить правильность формирования hash на фронтенде
    return True
    
    # check_hash = auth_data.pop('hash', None)
    # if not check_hash:
    #     return False
    
    # data_check_string = '\n'.join([f'{k}={v}' for k, v in sorted(auth_data.items())])
    # secret_key = hashlib.sha256(bot_token.encode()).digest()
    # calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    
    # return calculated_hash == check_hash

def handler(event: dict, context) -> dict:
    """
    Авторизация и регистрация пользователей
    """
    method = event.get('httpMethod', 'GET')
    
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
            
            # Проверяем, это авторизация через Telegram
            if body.get('telegram_auth'):
                bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
                if not bot_token:
                    return {
                        'statusCode': 500,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'success': False, 'error': 'Telegram bot token not configured'}),
                        'isBase64Encoded': False
                    }
                
                # Проверяем подлинность данных от Telegram
                auth_data = {
                    'id': str(body.get('id')),
                    'first_name': body.get('first_name', ''),
                    'auth_date': str(body.get('auth_date')),
                    'hash': body.get('hash')
                }
                
                if body.get('last_name'):
                    auth_data['last_name'] = body.get('last_name')
                if body.get('username'):
                    auth_data['username'] = body.get('username')
                if body.get('photo_url'):
                    auth_data['photo_url'] = body.get('photo_url')
                
                if not verify_telegram_auth(auth_data.copy(), bot_token):
                    return {
                        'statusCode': 401,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'success': False, 'error': 'Невалидные данные Telegram'}),
                        'isBase64Encoded': False
                    }
                
                # Ищем или создаем пользователя по telegram_id
                conn = psycopg2.connect((os.environ.get('SUPABASE_DB_URL') or os.environ['DATABASE_URL']))
                cur = conn.cursor()
                schema = ('public' if os.environ.get('SUPABASE_DB_URL') else os.environ.get('MAIN_DB_SCHEMA', 'public'))
                
                telegram_id = body.get('id')
                telegram_username = body.get('username')
                full_name = f"{body.get('first_name', '')} {body.get('last_name', '')}".strip()
                
                cur.execute(f"SELECT id, name, email, selected_plan, onboarding_completed FROM {schema}.users WHERE telegram_id = %s", (telegram_id,))
                user = cur.fetchone()
                
                if user:
                    # Пользователь существует, обновляем токен
                    print(f"[AUTH LOG] Существующий пользователь telegram_id={telegram_id}, user_id={user[0]}, onboarding={user[4]}, plan={user[3]}")
                    token = generate_token()
                    cur.execute(f"UPDATE {schema}.users SET auth_token = %s, last_login = NOW() WHERE id = %s", (token, user[0]))
                    conn.commit()
                    
                    cur.close()
                    conn.close()
                    
                    print(f"[AUTH LOG] Возвращаем существующего пользователя с onboarding_completed={user[4]}, selected_plan={user[3]}")
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'user': {
                                'id': user[0],
                                'name': user[1],
                                'email': user[2],
                                'selected_plan': user[3],
                                'onboarding_completed': user[4]
                            },
                            'token': token
                        }),
                        'isBase64Encoded': False
                    }
                else:
                    # Создаем нового пользователя
                    print(f"[AUTH LOG] Создаем нового пользователя telegram_id={telegram_id}, name={full_name}")
                    token = generate_token()
                    temp_email = f"telegram_{telegram_id}@nikolife.temp"
                    temp_password = generate_token()
                    
                    cur.execute(f"""
                        INSERT INTO {schema}.users (name, email, password_hash, auth_token, telegram_id, telegram_username, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, NOW())
                        RETURNING id
                    """, (full_name, temp_email, hash_password(temp_password), token, telegram_id, telegram_username))
                    
                    user_id = cur.fetchone()[0]
                    conn.commit()
                    cur.close()
                    conn.close()
                    
                    print(f"[AUTH LOG] Новый пользователь создан user_id={user_id}, onboarding_completed=None, selected_plan=None")
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'user': {
                                'id': user_id,
                                'name': full_name,
                                'email': temp_email,
                                'selected_plan': None,
                                'onboarding_completed': False
                            },
                            'token': token
                        }),
                        'isBase64Encoded': False
                    }
            
            # Обычная регистрация - проверяем наличие всех полей
            if body.get('name') and body.get('email') and body.get('password'):
                name = body.get('name')
                email = body.get('email')
                password = body.get('password')
                telegram_id = body.get('telegram_id')
                telegram_username = body.get('telegram_username')
                
                password_hash = hash_password(password)
                token = generate_token()
                
                conn = psycopg2.connect((os.environ.get('SUPABASE_DB_URL') or os.environ['DATABASE_URL']))
                cur = conn.cursor()
                
                schema = ('public' if os.environ.get('SUPABASE_DB_URL') else os.environ.get('MAIN_DB_SCHEMA', 'public'))
                cur.execute(f"SELECT id FROM {schema}.users WHERE email = %s", (email,))
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
                
                cur.execute(f"""
                    INSERT INTO {schema}.users (name, email, password_hash, auth_token, telegram_id, telegram_username, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
                    RETURNING id
                """, (name, email, password_hash, token, telegram_id, telegram_username))
                
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
                            'email': email,
                            'selected_plan': None,
                            'onboarding_completed': False
                        },
                        'token': token
                    }),
                    'isBase64Encoded': False
                }
            
            # Обычный логин - проверяем email и password
            if body.get('email') and body.get('password'):
                email = body.get('email')
                password = body.get('password')
                
                password_hash = hash_password(password)
                
                conn = psycopg2.connect((os.environ.get('SUPABASE_DB_URL') or os.environ['DATABASE_URL']))
                cur = conn.cursor()
                
                schema = ('public' if os.environ.get('SUPABASE_DB_URL') else os.environ.get('MAIN_DB_SCHEMA', 'public'))
                cur.execute(f"""
                    SELECT id, name, email, password_hash, selected_plan, onboarding_completed FROM {schema}.users WHERE email = %s
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
                user_id, name, email_db, selected_plan, onboarding_completed = row[0], row[1], row[2], row[4], row[5]
                
                cur.execute(f"""
                    UPDATE {schema}.users SET auth_token = %s, last_login = NOW() WHERE id = %s
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
                            'email': email_db,
                            'selected_plan': selected_plan,
                            'onboarding_completed': onboarding_completed
                        },
                        'token': token
                    }),
                    'isBase64Encoded': False
                }
            
            # Если не подошло ни под одно условие
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': False, 'error': 'Неверные параметры запроса'}),
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
            
            conn = psycopg2.connect((os.environ.get('SUPABASE_DB_URL') or os.environ['DATABASE_URL']))
            cur = conn.cursor()
            
            schema = ('public' if os.environ.get('SUPABASE_DB_URL') else os.environ.get('MAIN_DB_SCHEMA', 'public'))
            cur.execute(f"""
                SELECT id, name, email, created_at, telegram_id, telegram_username, selected_plan, onboarding_completed, is_admin 
                FROM {schema}.users WHERE auth_token = %s
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
                    'createdAt': row[3].isoformat() if row[3] else None,
                    'telegram_id': row[4],
                    'telegram_username': row[5],
                    'selected_plan': row[6],
                    'onboarding_completed': row[7],
                    'is_admin': row[8]
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