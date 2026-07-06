import json
import os
import psycopg2
import hashlib
import secrets
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для управления пользователями в админ-панели'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
            params = event.get('queryStringParameters') or {}
            action = params.get('action')

            if action == 'stats':
                schema = 't_p76837068_nikolife_health_app'
                cur.execute(f"SELECT COUNT(*) as total FROM {schema}.users")
                total_users = cur.fetchone()['total']

                cur.execute(f"SELECT COUNT(*) as total FROM {schema}.subscriptions WHERE status = 'active'")
                active_subs = cur.fetchone()['total']

                cur.execute(f"""
                    SELECT COALESCE(SUM(amount), 0) as total
                    FROM {schema}.subscriptions
                    WHERE status = 'active'
                    AND created_at >= date_trunc('month', NOW())
                """)
                monthly_revenue = cur.fetchone()['total']

                cur.execute(f"""
                    SELECT COUNT(*) as total FROM {schema}.users
                    WHERE created_at >= NOW() - INTERVAL '7 days'
                """)
                new_week = cur.fetchone()['total']

                cur.execute(f"""
                    SELECT COUNT(*) as total FROM {schema}.users
                    WHERE created_at >= NOW() - INTERVAL '14 days'
                    AND created_at < NOW() - INTERVAL '7 days'
                """)
                prev_week = cur.fetchone()['total']

                week_change = None
                if prev_week > 0:
                    week_change = round((new_week - prev_week) / prev_week * 100)

                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'total_users': total_users,
                        'active_subscriptions': active_subs,
                        'monthly_revenue': monthly_revenue,
                        'new_this_week': new_week,
                        'week_change': week_change
                    }),
                    'isBase64Encoded': False
                }

            user_id = params.get('id')
            
            if user_id:
                cur.execute("""
                    SELECT 
                        u.id, 
                        u.name, 
                        u.email, 
                        u.created_at, 
                        u.last_login,
                        u.telegram_username,
                        u.selected_plan,
                        u.is_admin,
                        u.onboarding_completed,
                        u.receive_notifications,
                        u.message_limit,
                        CASE 
                            WHEN u.telegram_username IS NOT NULL THEN 'telegram'
                            ELSE 'email'
                        END as auth_type,
                        hp.goal,
                        hp.activity_level,
                        hp.age,
                        hp.weight,
                        hp.height,
                        hp.diet_preference
                    FROM t_p76837068_nikolife_health_app.users u
                    LEFT JOIN t_p76837068_nikolife_health_app.health_parameters hp ON u.id = hp.user_id
                    WHERE u.id = %s
                """, (user_id,))
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User not found'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(user), default=str),
                    'isBase64Encoded': False
                }
            else:
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
                        receive_notifications,
                        message_limit,
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

        elif method == 'POST':
            try:
                data = json.loads(event.get('body', '{}'))
                name = data.get('name', '').strip()
                email = data.get('email', '').strip()
                password = data.get('password', 'temp123')
                selected_plan = data.get('selected_plan', 'free')
                is_admin = data.get('is_admin', False)
                telegram_username = data.get('telegram_username', '').strip() or None
                
                health_params = data.get('health_parameters', {})
                goal = health_params.get('goal', '').strip() or None
                activity_level = health_params.get('activity_level', '').strip() or None
                age_str = health_params.get('age', '').strip()
                weight_str = health_params.get('weight', '').strip()
                height_str = health_params.get('height', '').strip()
                diet_preference = health_params.get('diet_preference', '').strip() or None

                if not name or not email:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Имя и email обязательны', 'code': 400}),
                        'isBase64Encoded': False
                    }

                age = int(age_str) if age_str else None
                weight = float(weight_str) if weight_str else None
                height = float(height_str) if height_str else None

                cur.execute("""
                    SELECT id FROM t_p76837068_nikolife_health_app.users WHERE email = %s
                """, (email,))
                existing = cur.fetchone()
                
                if existing:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': f'Email {email} уже существует', 'code': 400}),
                        'isBase64Encoded': False
                    }

                password_hash = hashlib.sha256(password.encode()).hexdigest()
                auth_token = secrets.token_urlsafe(32)

                cur.execute("""
                    INSERT INTO t_p76837068_nikolife_health_app.users 
                    (name, email, password_hash, auth_token, selected_plan, is_admin, telegram_username, onboarding_completed)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, name, email, selected_plan, is_admin, telegram_username
                """, (name, email, password_hash, auth_token, selected_plan, is_admin, telegram_username, True))
                
                new_user = cur.fetchone()
                user_id = new_user['id']
                
                if any([goal, activity_level, age, weight, height, diet_preference]):
                    cur.execute("""
                        INSERT INTO t_p76837068_nikolife_health_app.health_parameters
                        (user_id, goal, activity_level, age, weight, height, diet_preference)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (user_id, goal, activity_level, age, weight, height, diet_preference))
                
                conn.commit()

                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'user': dict(new_user)}, default=str),
                    'isBase64Encoded': False
                }
            except ValueError as e:
                conn.rollback()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Некорректные данные: {str(e)}', 'code': 400}),
                    'isBase64Encoded': False
                }
            except Exception as e:
                conn.rollback()
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Ошибка сервера: {str(e)}', 'code': 500}),
                    'isBase64Encoded': False
                }

        elif method == 'PUT':
            try:
                params = event.get('queryStringParameters') or {}
                user_id = params.get('id')
                if not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'ID пользователя обязателен', 'code': 400}),
                        'isBase64Encoded': False
                    }

                data = json.loads(event.get('body', '{}'))

                if params.get('action') == 'message_limit':
                    limit_raw = data.get('message_limit')
                    try:
                        new_limit = int(limit_raw)
                    except (TypeError, ValueError):
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Некорректное значение лимита', 'code': 400}),
                            'isBase64Encoded': False
                        }
                    if new_limit < 0:
                        new_limit = 0
                    cur.execute("""
                        UPDATE t_p76837068_nikolife_health_app.users
                        SET message_limit = %s
                        WHERE id = %s
                        RETURNING id, message_limit
                    """, (new_limit, user_id))
                    row = cur.fetchone()
                    conn.commit()
                    if not row:
                        return {
                            'statusCode': 404,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'User not found', 'code': 404}),
                            'isBase64Encoded': False
                        }
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'message_limit': row['message_limit']}),
                        'isBase64Encoded': False
                    }

                name = data.get('name', '').strip()
                email = data.get('email', '').strip()
                selected_plan = data.get('selected_plan')
                is_admin = data.get('is_admin', False)
                receive_notifications = data.get('receive_notifications', True)
                telegram_username = data.get('telegram_username', '').strip() or None
                
                health_params = data.get('health_parameters', {})
                goal = health_params.get('goal', '').strip() or None
                activity_level = health_params.get('activity_level', '').strip() or None
                age_str = health_params.get('age', '').strip()
                weight_str = health_params.get('weight', '').strip()
                height_str = health_params.get('height', '').strip()
                diet_preference = health_params.get('diet_preference', '').strip() or None

                if not name or not email:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Имя и email обязательны', 'code': 400}),
                        'isBase64Encoded': False
                    }

                age = int(age_str) if age_str else None
                weight = float(weight_str) if weight_str else None
                height = float(height_str) if height_str else None

                cur.execute("""
                    UPDATE t_p76837068_nikolife_health_app.users 
                    SET name = %s, email = %s, selected_plan = %s, is_admin = %s, telegram_username = %s, receive_notifications = %s
                    WHERE id = %s
                    RETURNING id, name, email, selected_plan, is_admin, telegram_username, receive_notifications
                """, (name, email, selected_plan, is_admin, telegram_username, bool(receive_notifications), user_id))
                
                updated_user = cur.fetchone()
                
                if any([goal, activity_level, age, weight, height, diet_preference]):
                    cur.execute("""
                        INSERT INTO t_p76837068_nikolife_health_app.health_parameters
                        (user_id, goal, activity_level, age, weight, height, diet_preference)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (user_id) 
                        DO UPDATE SET 
                            goal = EXCLUDED.goal,
                            activity_level = EXCLUDED.activity_level,
                            age = EXCLUDED.age,
                            weight = EXCLUDED.weight,
                            height = EXCLUDED.height,
                            diet_preference = EXCLUDED.diet_preference,
                            updated_at = NOW()
                    """, (user_id, goal, activity_level, age, weight, height, diet_preference))
                
                conn.commit()

                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'user': dict(updated_user)}, default=str),
                    'isBase64Encoded': False
                }
            except ValueError as e:
                conn.rollback()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Некорректные данные: {str(e)}', 'code': 400}),
                    'isBase64Encoded': False
                }
            except Exception as e:
                conn.rollback()
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Ошибка сервера: {str(e)}', 'code': 500}),
                    'isBase64Encoded': False
                }

        elif method == 'DELETE':
            try:
                user_id = event.get('queryStringParameters', {}).get('id')
                if not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'ID пользователя обязателен', 'code': 400}),
                        'isBase64Encoded': False
                    }

                print(f'[DELETE] Attempting to delete user_id={user_id}')
                
                cur.execute("""
                    DELETE FROM t_p76837068_nikolife_health_app.user_favorites 
                    WHERE user_id = %s
                """, (user_id,))
                print(f'[DELETE] Deleted {cur.rowcount} user_favorites records')
                
                cur.execute("""
                    DELETE FROM t_p76837068_nikolife_health_app.subscriptions 
                    WHERE user_id = %s
                """, (user_id,))
                print(f'[DELETE] Deleted {cur.rowcount} subscriptions records')
                
                cur.execute("""
                    DELETE FROM t_p76837068_nikolife_health_app.weekly_menus 
                    WHERE user_id = %s
                """, (user_id,))
                print(f'[DELETE] Deleted {cur.rowcount} weekly_menus records')
                
                cur.execute("""
                    DELETE FROM t_p76837068_nikolife_health_app.health_parameters 
                    WHERE user_id = %s
                """, (user_id,))
                print(f'[DELETE] Deleted {cur.rowcount} health_parameters records')
                
                cur.execute("""
                    DELETE FROM t_p76837068_nikolife_health_app.chat_messages 
                    WHERE user_id = %s
                """, (user_id,))
                print(f'[DELETE] Deleted {cur.rowcount} chat_messages records')
                
                cur.execute("""
                    DELETE FROM t_p76837068_nikolife_health_app.chats 
                    WHERE user_id = %s
                """, (user_id,))
                print(f'[DELETE] Deleted {cur.rowcount} chats records')
                
                cur.execute("""
                    DELETE FROM t_p76837068_nikolife_health_app.notifications 
                    WHERE user_id = %s
                """, (user_id,))
                print(f'[DELETE] Deleted {cur.rowcount} notifications records')
                
                cur.execute("""
                    DELETE FROM t_p76837068_nikolife_health_app.habit_completions 
                    WHERE user_id = %s
                """, (user_id,))
                print(f'[DELETE] Deleted {cur.rowcount} habit_completions records')
                
                cur.execute("""
                    DELETE FROM t_p76837068_nikolife_health_app.habits 
                    WHERE user_id = %s
                """, (user_id,))
                print(f'[DELETE] Deleted {cur.rowcount} habits records')
                
                cur.execute("""
                    UPDATE t_p76837068_nikolife_health_app.recipes 
                    SET created_by = NULL 
                    WHERE created_by = %s
                """, (user_id,))
                print(f'[DELETE] Unlinked {cur.rowcount} recipes from user')
                
                cur.execute("""
                    DELETE FROM t_p76837068_nikolife_health_app.users 
                    WHERE id = %s
                """, (user_id,))
                deleted_user = cur.rowcount
                print(f'[DELETE] Deleted {deleted_user} user records')
                
                conn.commit()
                print(f'[DELETE] Successfully deleted user_id={user_id}')

                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'deleted': deleted_user > 0}),
                    'isBase64Encoded': False
                }
            except Exception as e:
                conn.rollback()
                print(f'[DELETE ERROR] {str(e)}')
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Ошибка при удалении: {str(e)}', 'code': 500}),
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