import json
import os
import base64
import psycopg2
import boto3
from datetime import datetime

def handler(event: dict, context) -> dict:
    """API для управления подкастами ментального здоровья"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    dsn = (os.environ.get('SUPABASE_DB_URL') or os.environ.get('DATABASE_URL'))
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            podcast_id = event.get('queryStringParameters', {}).get('id')
            
            if podcast_id:
                cur.execute(
                    "SELECT id, title, description, duration, audio_url, popularity_count, created_at "
                    "FROM mental_health_podcasts WHERE id = %s",
                    (podcast_id,)
                )
                row = cur.fetchone()
                if row:
                    podcast = {
                        'id': row[0],
                        'title': row[1],
                        'description': row[2],
                        'duration': row[3],
                        'audio_url': row[4],
                        'popularity_count': row[5],
                        'created_at': row[6].isoformat() if row[6] else None
                    }
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps(podcast)
                    }
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Podcast not found'})
                }
            
            cur.execute(
                "SELECT id, title, description, duration, audio_url, popularity_count, created_at "
                "FROM mental_health_podcasts ORDER BY created_at DESC"
            )
            rows = cur.fetchall()
            podcasts = []
            for row in rows:
                podcasts.append({
                    'id': row[0],
                    'title': row[1],
                    'description': row[2],
                    'duration': row[3],
                    'audio_url': row[4],
                    'popularity_count': row[5],
                    'created_at': row[6].isoformat() if row[6] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(podcasts)
            }
        
        elif method == 'POST':
            data = json.loads(event.get('body', '{}'))
            title = data.get('title')
            description = data.get('description')
            duration = data.get('duration')
            audio_base64 = data.get('audio_base64', '')
            
            audio_url = None
            if audio_base64:
                s3 = boto3.client('s3',
                    endpoint_url='https://bucket.poehali.dev',
                    aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                    aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
                )
                
                audio_data = base64.b64decode(audio_base64)
                file_key = f'mental-health/{datetime.now().timestamp()}.mp3'
                
                s3.put_object(
                    Bucket='files',
                    Key=file_key,
                    Body=audio_data,
                    ContentType='audio/mpeg'
                )
                
                audio_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{file_key}"
            
            cur.execute(
                "INSERT INTO mental_health_podcasts (title, description, duration, audio_url, popularity_count) "
                "VALUES (%s, %s, %s, %s, 0) RETURNING id",
                (title, description, duration, audio_url)
            )
            podcast_id = cur.fetchone()[0]
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': podcast_id, 'message': 'Podcast created'})
            }
        
        elif method == 'PUT':
            data = json.loads(event.get('body', '{}'))
            podcast_id = data.get('id')
            title = data.get('title')
            description = data.get('description')
            duration = data.get('duration')
            audio_base64 = data.get('audio_base64', '')
            
            cur.execute("SELECT audio_url FROM mental_health_podcasts WHERE id = %s", (podcast_id,))
            row = cur.fetchone()
            if not row:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Podcast not found'})
                }
            
            audio_url = row[0]
            
            if audio_base64:
                s3 = boto3.client('s3',
                    endpoint_url='https://bucket.poehali.dev',
                    aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                    aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
                )
                
                audio_data = base64.b64decode(audio_base64)
                file_key = f'mental-health/{datetime.now().timestamp()}.mp3'
                
                s3.put_object(
                    Bucket='files',
                    Key=file_key,
                    Body=audio_data,
                    ContentType='audio/mpeg'
                )
                
                audio_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{file_key}"
            
            cur.execute(
                "UPDATE mental_health_podcasts SET title = %s, description = %s, duration = %s, audio_url = %s, updated_at = CURRENT_TIMESTAMP "
                "WHERE id = %s",
                (title, description, duration, audio_url, podcast_id)
            )
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Podcast updated'})
            }
        
        elif method == 'DELETE':
            data = json.loads(event.get('body', '{}'))
            podcast_id = data.get('id')
            
            cur.execute("DELETE FROM mental_health_podcasts WHERE id = %s", (podcast_id,))
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Podcast deleted'})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()
