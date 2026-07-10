import json
import os
import base64
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import boto3

def handler(event: dict, context) -> dict:
    '''API для управления тренировками'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = (os.environ.get('SUPABASE_DB_URL') or os.environ.get('DATABASE_URL'))
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database connection not configured'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    
    try:
        if method == 'GET':
            return get_workouts(conn, event)
        elif method == 'POST':
            return create_workout(conn, event)
        elif method == 'PUT':
            return update_workout(conn, event)
        elif method == 'DELETE':
            return delete_workout(conn, event)
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    finally:
        conn.close()

def get_workouts(conn, event: dict) -> dict:
    query_params = event.get('queryStringParameters') or {}
    workout_id = query_params.get('id')
    category = query_params.get('category')
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if workout_id:
            cur.execute(
                'UPDATE public.workouts SET view_count = view_count + 1 WHERE id = %s',
                (workout_id,)
            )
            cur.execute(
                '''SELECT id, title, description, category, published_date, duration_minutes, 
                   difficulty, calories, video_url, view_count, created_at 
                   FROM public.workouts WHERE id = %s''',
                (workout_id,)
            )
            workout = cur.fetchone()
            
            if workout:
                cur.execute(
                    '''SELECT exercise_name, sets, rest_seconds 
                       FROM public.workout_exercises 
                       WHERE workout_id = %s ORDER BY exercise_order''',
                    (workout_id,)
                )
                exercises = cur.fetchall()
                
                workout['published_date'] = workout['published_date'].isoformat() if workout['published_date'] else None
                workout['created_at'] = workout['created_at'].isoformat() if workout['created_at'] else None
                workout['exercises'] = exercises
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(workout),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Workout not found'}),
                    'isBase64Encoded': False
                }
        else:
            if category:
                cur.execute(
                    '''SELECT id, title, description, category, published_date, duration_minutes, 
                       difficulty, calories, video_url, view_count, created_at 
                       FROM public.workouts 
                       WHERE category = %s ORDER BY published_date DESC''',
                    (category,)
                )
            else:
                cur.execute(
                    '''SELECT id, title, description, category, published_date, duration_minutes, 
                       difficulty, calories, video_url, view_count, created_at 
                       FROM public.workouts 
                       ORDER BY published_date DESC'''
                )
            
            workouts = cur.fetchall()
            for workout in workouts:
                workout['published_date'] = workout['published_date'].isoformat() if workout['published_date'] else None
                workout['created_at'] = workout['created_at'].isoformat() if workout['created_at'] else None
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(workouts),
                'isBase64Encoded': False
            }

def create_workout(conn, event: dict) -> dict:
    body = json.loads(event.get('body', '{}'))
    title = body.get('title')
    description = body.get('description', '')
    category = body.get('category')
    published_date = body.get('published_date', datetime.now().date().isoformat())
    duration_minutes = body.get('duration_minutes')
    difficulty = body.get('difficulty')
    calories = body.get('calories')
    video_base64 = body.get('video_base64')
    exercises = body.get('exercises', [])
    
    if not title or not category or not duration_minutes or not difficulty or not calories:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Required fields: title, category, duration_minutes, difficulty, calories'}),
            'isBase64Encoded': False
        }
    
    if category not in ['cardio', 'strength', 'flexibility']:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid category'}),
            'isBase64Encoded': False
        }
    
    if difficulty not in ['beginner', 'intermediate', 'advanced']:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid difficulty'}),
            'isBase64Encoded': False
        }
    
    video_url = None
    if video_base64:
        try:
            video_url = upload_video_to_s3(video_base64, title)
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Failed to upload video: {str(e)}'}),
                'isBase64Encoded': False
            }
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            '''INSERT INTO public.workouts 
               (title, description, category, published_date, duration_minutes, difficulty, calories, video_url) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s) 
               RETURNING id, title, description, category, published_date, duration_minutes, difficulty, calories, video_url, view_count, created_at''',
            (title, description, category, published_date, duration_minutes, difficulty, calories, video_url)
        )
        workout = cur.fetchone()
        workout_id = workout['id']
        
        for i, exercise in enumerate(exercises):
            cur.execute(
                '''INSERT INTO public.workout_exercises 
                   (workout_id, exercise_name, sets, rest_seconds, exercise_order) 
                   VALUES (%s, %s, %s, %s, %s)''',
                (workout_id, exercise['name'], exercise['sets'], exercise['rest_seconds'], i)
            )
        
        workout['published_date'] = workout['published_date'].isoformat() if workout['published_date'] else None
        workout['created_at'] = workout['created_at'].isoformat() if workout['created_at'] else None
        workout['exercises'] = exercises
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(workout),
            'isBase64Encoded': False
        }

def upload_video_to_s3(video_base64: str, title: str) -> str:
    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    
    video_data = base64.b64decode(video_base64)
    timestamp = int(datetime.now().timestamp())
    key = f'workouts/{timestamp}_{title.replace(" ", "_")}.mp4'
    
    s3.put_object(
        Bucket='files',
        Key=key,
        Body=video_data,
        ContentType='video/mp4'
    )
    
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return cdn_url

def update_workout(conn, event: dict) -> dict:
    query_params = event.get('queryStringParameters') or {}
    workout_id = query_params.get('id')
    
    if not workout_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Workout ID is required'}),
            'isBase64Encoded': False
        }
    
    body = json.loads(event.get('body', '{}'))
    
    updates = []
    params = []
    
    for field in ['title', 'description', 'category', 'published_date', 'duration_minutes', 'difficulty', 'calories']:
        if field in body:
            updates.append(f'{field} = %s')
            params.append(body[field])
    
    if not updates:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No fields to update'}),
            'isBase64Encoded': False
        }
    
    updates.append('updated_at = CURRENT_TIMESTAMP')
    params.append(workout_id)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f'''UPDATE public.workouts 
                SET {', '.join(updates)} 
                WHERE id = %s 
                RETURNING id, title, description, category, published_date, duration_minutes, difficulty, calories, video_url, view_count, created_at''',
            params
        )
        workout = cur.fetchone()
        
        if workout:
            workout['published_date'] = workout['published_date'].isoformat() if workout['published_date'] else None
            workout['created_at'] = workout['created_at'].isoformat() if workout['created_at'] else None
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(workout),
                'isBase64Encoded': False
            }
        else:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Workout not found'}),
                'isBase64Encoded': False
            }

def delete_workout(conn, event: dict) -> dict:
    query_params = event.get('queryStringParameters') or {}
    workout_id = query_params.get('id')
    
    if not workout_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Workout ID is required'}),
            'isBase64Encoded': False
        }
    
    with conn.cursor() as cur:
        cur.execute(
            'SELECT id FROM public.workouts WHERE id = %s',
            (workout_id,)
        )
        
        if not cur.fetchone():
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Workout not found'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'To delete, use database interface'}),
            'isBase64Encoded': False
        }
