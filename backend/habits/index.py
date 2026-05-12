import json
import os
import psycopg2
from datetime import datetime, timedelta

DSN = os.environ.get('DATABASE_URL')

def handler(event: dict, context) -> dict:
    '''API для управления привычками пользователя'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-User-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    token = event.get('headers', {}).get('X-Auth-Token', '')
    if not token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(DSN)
    cur = conn.cursor()
    
    try:
        cur.execute(
            "SELECT id FROM t_p76837068_nikolife_health_app.users WHERE auth_token = %s",
            (token,)
        )
        user_row = cur.fetchone()
        if not user_row:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid token'}),
                'isBase64Encoded': False
            }
        
        user_id = user_row[0]
        query_params = event.get('queryStringParameters', {})
        habit_id_param = query_params.get('habit_id', '') if query_params else ''
        is_complete = query_params.get('action', '') == 'complete' if query_params else False
        
        if method == 'GET':
            cur.execute("""
                SELECT h.id, h.title, h.category, h.goal, h.goal_days, h.days_of_week, 
                       h.times_per_day, h.created_at,
                       (SELECT COUNT(*) FROM t_p76837068_nikolife_health_app.habit_completions 
                        WHERE habit_id = h.id AND completed_date = CURRENT_DATE) as completed_today,
                       (SELECT COUNT(*) FROM t_p76837068_nikolife_health_app.habit_completions 
                        WHERE habit_id = h.id) as total_completions
                FROM t_p76837068_nikolife_health_app.habits h
                WHERE h.user_id = %s
                ORDER BY h.created_at DESC
            """, (user_id,))
            
            habits = []
            for row in cur.fetchall():
                days_of_week_str = row[5] if row[5] else '[]'
                days_of_week = json.loads(days_of_week_str) if days_of_week_str.startswith('[') else []
                
                cur.execute("""
                    SELECT completed_date 
                    FROM t_p76837068_nikolife_health_app.habit_completions 
                    WHERE habit_id = %s 
                    ORDER BY completed_date DESC
                """, (row[0],))
                
                completion_dates = [str(r[0]) for r in cur.fetchall()]
                current_streak = calculate_streak(completion_dates)
                
                cur.execute("""
                    SELECT COUNT(*) 
                    FROM t_p76837068_nikolife_health_app.habit_completions 
                    WHERE habit_id = %s AND completed_date = CURRENT_DATE
                """, (row[0],))
                completions_today = cur.fetchone()[0]
                
                cur.execute("""
                    SELECT completed_date, COUNT(*) 
                    FROM t_p76837068_nikolife_health_app.habit_completions 
                    WHERE habit_id = %s AND completed_date >= CURRENT_DATE - INTERVAL '7 days'
                    GROUP BY completed_date
                """, (row[0],))
                week_completions = cur.fetchall()
                
                cur.execute("""
                    SELECT completed_date, COUNT(*) 
                    FROM t_p76837068_nikolife_health_app.habit_completions 
                    WHERE habit_id = %s AND completed_date >= CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY completed_date
                """, (row[0],))
                month_completions = cur.fetchall()
                
                times_per_day = row[6]
                selected_days_count = len(days_of_week)
                
                week_progress = calculate_week_progress(
                    week_completions, days_of_week, times_per_day
                )
                
                month_progress = calculate_month_progress(
                    month_completions, days_of_week, times_per_day
                )
                
                habits.append({
                    'id': row[0],
                    'title': row[1],
                    'category': row[2],
                    'goal': row[3],
                    'goal_days': row[4],
                    'days_of_week': days_of_week,
                    'times_per_day': times_per_day,
                    'created_at': row[7].isoformat() if row[7] else None,
                    'completed_today': row[8] > 0,
                    'current_streak': current_streak,
                    'total_completions': row[9],
                    'completions_today': completions_today,
                    'day_progress': min(100, (completions_today / times_per_day) * 100) if times_per_day > 0 else 0,
                    'week_progress': week_progress,
                    'month_progress': month_progress
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'habits': habits}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and is_complete:
            habit_id = habit_id_param
            
            cur.execute("""
                SELECT id FROM t_p76837068_nikolife_health_app.habits 
                WHERE id = %s AND user_id = %s
            """, (habit_id, user_id))
            
            if not cur.fetchone():
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Habit not found'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                INSERT INTO t_p76837068_nikolife_health_app.habit_completions (habit_id, user_id) 
                VALUES (%s, %s)
            """, (habit_id, user_id))
            
            cur.execute("""
                SELECT COUNT(*) FROM t_p76837068_nikolife_health_app.habit_completions 
                WHERE habit_id = %s AND completed_date = CURRENT_DATE
            """, (habit_id,))
            
            completions_today = cur.fetchone()[0]
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True, 
                    'completions_today': completions_today
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            title = body.get('title')
            category = body.get('category')
            goal = body.get('goal')
            goal_days = max(body.get('goal_days', 30), 30)
            days_of_week = body.get('days_of_week', [])
            times_per_day = body.get('times_per_day', 1)
            
            if not title or not category or not goal or not days_of_week:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields'}),
                    'isBase64Encoded': False
                }
            
            days_of_week_json = json.dumps(days_of_week)
            
            cur.execute("""
                INSERT INTO t_p76837068_nikolife_health_app.habits 
                (user_id, title, category, goal, goal_days, days_of_week, times_per_day)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (user_id, title, category, goal, goal_days, days_of_week_json, times_per_day))
            
            habit_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'id': habit_id}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            habit_id = habit_id_param
            if not habit_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'habit_id required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                SELECT id FROM t_p76837068_nikolife_health_app.habits 
                WHERE id = %s AND user_id = %s
            """, (habit_id, user_id))
            
            if not cur.fetchone():
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Habit not found'}),
                    'isBase64Encoded': False
                }
            
            body = json.loads(event.get('body', '{}'))
            title = body.get('title')
            category = body.get('category')
            goal = body.get('goal')
            goal_days = max(body.get('goal_days', 30), 30)
            days_of_week = body.get('days_of_week', [])
            times_per_day = body.get('times_per_day', 1)
            
            if not title or not category or not goal or not days_of_week:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields'}),
                    'isBase64Encoded': False
                }
            
            days_of_week_json = json.dumps(days_of_week)
            
            cur.execute("""
                UPDATE t_p76837068_nikolife_health_app.habits 
                SET title = %s, category = %s, goal = %s, goal_days = %s, 
                    days_of_week = %s, times_per_day = %s
                WHERE id = %s AND user_id = %s
            """, (title, category, goal, goal_days, days_of_week_json, times_per_day, habit_id, user_id))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            habit_id = habit_id_param
            if not habit_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'habit_id required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                DELETE FROM t_p76837068_nikolife_health_app.habits 
                WHERE id = %s AND user_id = %s
            """, (habit_id, user_id))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        import traceback
        print(f"[HABITS ERROR] {str(e)}")
        print(traceback.format_exc())
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()


def calculate_week_progress(week_completions, days_of_week, times_per_day):
    '''Рассчитывает процент выполнения за неделю'''
    selected_days = len(days_of_week)
    total_required = selected_days * times_per_day
    
    if total_required == 0:
        return 0
    
    total_completed = 0
    for date_obj, count in week_completions:
        weekday = date_obj.weekday()
        weekday_map = {0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 0}
        if weekday_map[weekday] in days_of_week:
            total_completed += min(count, times_per_day)
    
    return min(100, (total_completed / total_required) * 100)


def calculate_month_progress(month_completions, days_of_week, times_per_day):
    '''Рассчитывает процент выполнения за месяц'''
    from datetime import datetime, timedelta
    
    today = datetime.now().date()
    month_start = today - timedelta(days=30)
    
    days_in_period = 0
    current = month_start
    while current <= today:
        weekday = current.weekday()
        weekday_map = {0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 0}
        if weekday_map[weekday] in days_of_week:
            days_in_period += 1
        current += timedelta(days=1)
    
    total_required = days_in_period * times_per_day
    
    if total_required == 0:
        return 0
    
    total_completed = 0
    for date_obj, count in month_completions:
        weekday = date_obj.weekday()
        weekday_map = {0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 0}
        if weekday_map[weekday] in days_of_week:
            total_completed += min(count, times_per_day)
    
    return min(100, (total_completed / total_required) * 100)


def calculate_streak(completion_dates):
    '''Рассчитывает текущую серию выполнений'''
    if not completion_dates:
        return 0
    
    dates = sorted([datetime.strptime(d, '%Y-%m-%d').date() for d in completion_dates], reverse=True)
    
    today = datetime.now().date()
    if dates[0] != today and dates[0] != today - timedelta(days=1):
        return 0
    
    streak = 0
    expected_date = today
    
    for date in dates:
        if date == expected_date or date == expected_date - timedelta(days=1):
            streak += 1
            expected_date = date - timedelta(days=1)
        else:
            break
    
    return streak