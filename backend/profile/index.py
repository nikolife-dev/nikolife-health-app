import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    '''API для управления профилем пользователя'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
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
    
    database_url = os.environ.get('DATABASE_URL')
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    
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
        
        cur.execute(f"SELECT id, name, email, telegram_id, telegram_username, selected_plan FROM {schema}.users WHERE auth_token = %s", (auth_token,))
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
        
        user_id, current_name, current_email, telegram_id, telegram_username, selected_plan = user
        
        if method == 'GET':
            initials = ''.join([word[0] for word in current_name.split()[:2]]).upper()
            
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
                        'selected_plan': selected_plan
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            new_name = body.get('name', '').strip()
            new_email = body.get('email', '').strip()
            new_telegram_id = body.get('telegram_id')
            new_telegram_username = body.get('telegram_username')
            new_selected_plan = body.get('selected_plan')
            
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