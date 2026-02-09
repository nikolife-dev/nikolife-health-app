import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для управления пользователями в админ-панели'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'}),
            'isBase64Encoded': False
        }

    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == 'GET':
            cur.execute("""
                SELECT 
                    id, 
                    name, 
                    email, 
                    created_at, 
                    last_login,
                    telegram_username,
                    selected_plan,
                    is_admin,
                    CASE 
                        WHEN telegram_username IS NOT NULL THEN 'telegram'
                        ELSE 'email'
                    END as auth_type
                FROM t_p76837068_nikolife_health_app.users 
                ORDER BY created_at DESC
            """)
            users = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(users, default=str),
                'isBase64Encoded': False
            }

        elif method == 'PUT':
            user_id = event.get('queryStringParameters', {}).get('id')
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User ID required'}),
                    'isBase64Encoded': False
                }

            data = json.loads(event.get('body', '{}'))
            name = data.get('name')
            email = data.get('email')
            selected_plan = data.get('selected_plan')
            is_admin = data.get('is_admin', False)

            if not name or not email:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Name and email required'}),
                    'isBase64Encoded': False
                }

            cur.execute("""
                UPDATE t_p76837068_nikolife_health_app.users 
                SET name = %s, email = %s, selected_plan = %s, is_admin = %s
                WHERE id = %s
                RETURNING id, name, email, selected_plan, is_admin
            """, (name, email, selected_plan, is_admin, user_id))
            
            updated_user = cur.fetchone()
            conn.commit()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'user': dict(updated_user)}, default=str),
                'isBase64Encoded': False
            }

        elif method == 'DELETE':
            user_id = event.get('queryStringParameters', {}).get('id')
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User ID required'}),
                    'isBase64Encoded': False
                }

            cur.execute("""
                DELETE FROM t_p76837068_nikolife_health_app.users 
                WHERE id = %s
            """, (user_id,))
            conn.commit()

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }

    finally:
        cur.close()
        conn.close()

    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
