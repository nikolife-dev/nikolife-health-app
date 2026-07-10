import json
import os
import hmac
import hashlib
import psycopg2


def verify_telegram_auth(auth_data: dict, bot_token: str) -> bool:
    '''Проверяет подлинность данных Telegram Login Widget по HMAC-SHA256'''
    if not bot_token:
        return False
    check_hash = auth_data.pop('hash', None)
    if not check_hash:
        return False
    # Оставляем только поля, пришедшие от Telegram
    allowed = ('id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date')
    pairs = []
    for k in sorted(auth_data.keys()):
        if k in allowed and auth_data[k] is not None and auth_data[k] != '':
            pairs.append(f"{k}={auth_data[k]}")
    data_check_string = '\n'.join(pairs)
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    calc_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(calc_hash, str(check_hash))


def handler(event: dict, context) -> dict:
    '''API для управления профилем пользователя'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    auth_token = event.get('headers', {}).get('X-Authorization') or event.get('headers', {}).get('x-authorization')
    
    if not auth_token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется авторизация'}),
            'isBase64Encoded': False
        }
    
    if auth_token.startswith('Bearer '):
        auth_token = auth_token[7:]
    
    database_url = (os.environ.get('SUPABASE_DB_URL') or os.environ.get('DATABASE_URL'))
    schema = ('public' if os.environ.get('SUPABASE_DB_URL') else os.environ.get('MAIN_DB_SCHEMA', 'public'))
    
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database configuration missing'}),
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        
        cur.execute(f"SELECT id, name, email, telegram_id, telegram_username, selected_plan, onboarding_completed, receive_notifications FROM {schema}.users WHERE auth_token = %s", (auth_token,))
        user = cur.fetchone()
        
        if not user:
            cur.close()
            conn.close()
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Невалидный токен'}),
                'isBase64Encoded': False
            }
        
        user_id, current_name, current_email, telegram_id, telegram_username, selected_plan, onboarding_completed, receive_notifications = user
        
        query_params = event.get('queryStringParameters') or {}
        action = query_params.get('action', '')
        
        # Привязка Telegram к текущему аккаунту
        if method == 'POST' and action == 'link_telegram':
            body = json.loads(event.get('body', '{}'))
            tg_id = body.get('id')
            tg_username = body.get('username')
            bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
            
            if not verify_telegram_auth(dict(body), bot_token):
                cur.close(); conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Не удалось проверить данные Telegram'}),
                    'isBase64Encoded': False
                }
            
            if not tg_id:
                cur.close(); conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нет данных Telegram'}),
                    'isBase64Encoded': False
                }
            
            # Проверяем, не привязан ли этот Telegram к другому аккаунту
            cur.execute(f"SELECT id FROM {schema}.users WHERE telegram_id = %s AND id <> %s", (tg_id, user_id))
            if cur.fetchone():
                cur.close(); conn.close()
                return {
                    'statusCode': 409,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Этот Telegram уже привязан к другому аккаунту'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"UPDATE {schema}.users SET telegram_id = %s, telegram_username = %s WHERE id = %s",
                (tg_id, tg_username, user_id)
            )
            conn.commit()
            cur.close(); conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'telegram_id': tg_id, 'telegram_username': tg_username}),
                'isBase64Encoded': False
            }
        
        # Отвязка Telegram
        if method == 'POST' and action == 'unlink_telegram':
            cur.execute(
                f"UPDATE {schema}.users SET telegram_id = NULL, telegram_username = NULL WHERE id = %s",
                (user_id,)
            )
            conn.commit()
            cur.close(); conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        if method == 'GET':
            initials = ''.join([word[0] for word in current_name.split()[:2]]).upper()
            
            # Получаем параметры здоровья из отдельной таблицы
            cur.execute(f"SELECT goal, activity_level, age, weight, height, diet_preference FROM {schema}.health_parameters WHERE user_id = %s", (user_id,))
            health_params = cur.fetchone()
            
            onboarding_data = None
            if health_params:
                goal, activity_level, age, weight, height, diet_preference = health_params
                onboarding_data = {
                    'goal': goal,
                    'activityLevel': activity_level,
                    'age': str(age) if age else '',
                    'weight': str(weight) if weight else '',
                    'height': str(height) if height else '',
                    'dietPreference': diet_preference
                }
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'user': {
                        'id': user_id,
                        'name': current_name,
                        'email': current_email,
                        'avatar': initials,
                        'telegram_id': telegram_id,
                        'telegram_username': telegram_username,
                        'selected_plan': selected_plan,
                        'onboarding_completed': onboarding_completed,
                        'onboarding_data': onboarding_data,
                        'receive_notifications': receive_notifications if receive_notifications is not None else True
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            new_name = body.get('name', '').strip() if body.get('name') else current_name
            new_email = body.get('email', '').strip() if body.get('email') else current_email
            new_telegram_id = body.get('telegram_id')
            new_telegram_username = body.get('telegram_username')
            new_selected_plan = body.get('selected_plan')
            new_receive_notifications = body.get('receive_notifications')
            
            # Обработка данных онбординга
            onboarding_data = body.get('onboarding_data')
            if onboarding_data:
                # Сохраняем в таблицу health_parameters
                cur.execute(f"""
                    INSERT INTO {schema}.health_parameters 
                    (user_id, goal, activity_level, age, weight, height, diet_preference, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                    ON CONFLICT (user_id) 
                    DO UPDATE SET 
                        goal = EXCLUDED.goal,
                        activity_level = EXCLUDED.activity_level,
                        age = EXCLUDED.age,
                        weight = EXCLUDED.weight,
                        height = EXCLUDED.height,
                        diet_preference = EXCLUDED.diet_preference,
                        updated_at = NOW()
                """, (
                    user_id,
                    onboarding_data.get('goal'),
                    onboarding_data.get('activityLevel'),
                    int(onboarding_data.get('age')) if onboarding_data.get('age') else None,
                    float(onboarding_data.get('weight')) if onboarding_data.get('weight') else None,
                    int(onboarding_data.get('height')) if onboarding_data.get('height') else None,
                    onboarding_data.get('dietPreference')
                ))
                
                # Обновляем флаг onboarding_completed в users
                cur.execute(f"UPDATE {schema}.users SET onboarding_completed = TRUE WHERE id = %s", (user_id,))
                
                conn.commit()
                cur.close()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'onboarding_completed': True}),
                    'isBase64Encoded': False
                }
            
            
            # Если передан только selected_plan, обновляем только его
            if new_selected_plan is not None and not body.get('name') and not body.get('email'):
                cur.execute(f"UPDATE {schema}.users SET selected_plan = %s WHERE id = %s", (new_selected_plan, user_id))
                conn.commit()
                cur.close()
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'selected_plan': new_selected_plan}),
                    'isBase64Encoded': False
                }
            
            if not new_name or not new_email:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Имя и email обязательны'}),
                    'isBase64Encoded': False
                }
            
            if new_email != current_email:
                cur.execute(f"SELECT id FROM {schema}.users WHERE email = %s AND id != %s", (new_email, user_id))
                if cur.fetchone():
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email уже используется'}),
                        'isBase64Encoded': False
                    }
            
            update_fields = ['name = %s', 'email = %s']
            update_values = [new_name, new_email]
            
            if new_telegram_id is not None:
                update_fields.append('telegram_id = %s')
                update_values.append(new_telegram_id)
            if new_telegram_username is not None:
                update_fields.append('telegram_username = %s')
                update_values.append(new_telegram_username)
            if new_selected_plan is not None:
                update_fields.append('selected_plan = %s')
                update_values.append(new_selected_plan)
            if new_receive_notifications is not None:
                update_fields.append('receive_notifications = %s')
                update_values.append(bool(new_receive_notifications))
            
            update_values.append(user_id)
            
            cur.execute(
                f"UPDATE {schema}.users SET {', '.join(update_fields)} WHERE id = %s",
                tuple(update_values)
            )
            conn.commit()
            
            initials = ''.join([word[0] for word in new_name.split()[:2]]).upper()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'user': {
                        'id': user_id,
                        'name': new_name,
                        'email': new_email,
                        'avatar': initials
                    }
                }),
                'isBase64Encoded': False
            }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }