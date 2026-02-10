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
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token'
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
        path = event.get('path', '')
        
        if method == 'GET':
            cur.execute("""
                SELECT h.id, h.title, h.category, h.goal, h.goal_days, h.days_of_week, 
                       h.times_per_day, h.created_at,
                       (SELECT COUNT(*) FROM t_p76837068_nikolife_health_app.habit_completions 
                        WHERE habit_id = h.id AND DATE(completed_at) = CURRENT_DATE) as completed_today,
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
                    SELECT DATE(completed_at) 
                    FROM t_p76837068_nikolife_health_app.habit_completions 
                    WHERE habit_id = %s 
                    ORDER BY completed_at DESC
                """, (row[0],))
                
                completion_dates = [str(r[0]) for r in cur.fetchall()]
                current_streak = calculate_streak(completion_dates)
                
                habits.append({
                    'id': row[0],
                    'title': row[1],
                    'category': row[2],
                    'goal': row[3],
                    'goal_days': row[4],
                    'days_of_week': days_of_week,
                    'times_per_day': row[6],
                    'created_at': row[7].isoformat() if row[7] else None,
                    'completed_today': row[8] > 0,
                    'current_streak': current_streak,
                    'total_completions': row[9]
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'habits': habits}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and '/complete' in path:
            habit_id = path.split('/')[-2]
            
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
                SELECT COUNT(*) FROM t_p76837068_nikolife_health_app.habit_completions 
                WHERE habit_id = %s AND DATE(completed_at) = CURRENT_DATE
            """, (habit_id,))
            
            count = cur.fetchone()[0]
            
            if count > 0:
                completed = False
            else:
                cur.execute("""
                    INSERT INTO t_p76837068_nikolife_health_app.habit_completions (habit_id) 
                    VALUES (%s)
                """, (habit_id,))
                completed = True
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'completed': completed}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            title = body.get('title')
            category = body.get('category')
            goal = body.get('goal')
            goal_days = body.get('goal_days', 30)
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
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
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