import json
import os
import psycopg2

CORS = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}


def handler(event, context):
    """Одноразовая проверка привычек Андрея (user_id=7) в Supabase."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}
    result = {}
    conn = psycopg2.connect(os.environ['SUPABASE_DB_URL'])
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM public.habits")
    result['habits_total'] = cur.fetchone()[0]

    cur.execute("SELECT user_id, COUNT(*) FROM public.habits GROUP BY user_id ORDER BY user_id")
    result['habits_by_user'] = [{'user_id': r[0], 'count': r[1]} for r in cur.fetchall()]

    cur.execute("""
        SELECT id, title, category, goal, goal_days, days_of_week, times_per_day, created_at
        FROM public.habits WHERE user_id = 7 ORDER BY id
    """)
    result['andrey_habits'] = [
        {'id': r[0], 'title': r[1], 'category': r[2], 'goal': r[3],
         'goal_days': r[4], 'days_of_week': r[5], 'times_per_day': r[6], 'created_at': r[7]}
        for r in cur.fetchall()
    ]

    cur.execute("SELECT COUNT(*) FROM public.habit_completions")
    result['completions_total'] = cur.fetchone()[0]

    cur.close()
    conn.close()
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(result, default=str), 'isBase64Encoded': False}
