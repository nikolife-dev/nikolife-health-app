import json
import os
import psycopg2

DSN = os.environ.get('DATABASE_URL')

def handler(event: dict, context) -> dict:
    '''API для получения шаблонов привычек'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(DSN)
    cur = conn.cursor()
    
    try:
        category = event.get('queryStringParameters', {}).get('category', '') if event.get('queryStringParameters') else ''
        
        if category:
            cur.execute("""
                SELECT id, title, category, description 
                FROM public.habit_templates
                WHERE category = %s
                ORDER BY title
            """, (category,))
        else:
            cur.execute("""
                SELECT id, title, category, description 
                FROM public.habit_templates
                ORDER BY category, title
            """)
        
        templates = []
        for row in cur.fetchall():
            templates.append({
                'id': row[0],
                'title': row[1],
                'category': row[2],
                'description': row[3]
            })
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'templates': templates}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
