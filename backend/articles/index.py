import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для управления статьями библиотеки'''
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
    
    dsn = os.environ.get('DATABASE_URL')
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
            return get_articles(conn, event)
        elif method == 'POST':
            return create_article(conn, event)
        elif method == 'PUT':
            return update_article(conn, event)
        elif method == 'DELETE':
            return delete_article(conn, event)
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    finally:
        conn.close()

def get_articles(conn, event: dict) -> dict:
    query_params = event.get('queryStringParameters') or {}
    article_id = query_params.get('id')
    category = query_params.get('category')
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if article_id:
            cur.execute(
                'UPDATE public.articles SET view_count = view_count + 1 WHERE id = %s',
                (article_id,)
            )
            cur.execute(
                'SELECT id, title, category, content, published_date, view_count, created_at FROM public.articles WHERE id = %s',
                (article_id,)
            )
            article = cur.fetchone()
            if article:
                article['published_date'] = article['published_date'].isoformat() if article['published_date'] else None
                article['created_at'] = article['created_at'].isoformat() if article['created_at'] else None
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(article),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Article not found'}),
                    'isBase64Encoded': False
                }
        else:
            if category:
                cur.execute(
                    'SELECT id, title, category, content, published_date, view_count, created_at FROM public.articles WHERE category = %s ORDER BY published_date DESC',
                    (category,)
                )
            else:
                cur.execute(
                    'SELECT id, title, category, content, published_date, view_count, created_at FROM public.articles ORDER BY published_date DESC'
                )
            
            articles = cur.fetchall()
            for article in articles:
                article['published_date'] = article['published_date'].isoformat() if article['published_date'] else None
                article['created_at'] = article['created_at'].isoformat() if article['created_at'] else None
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(articles),
                'isBase64Encoded': False
            }

def create_article(conn, event: dict) -> dict:
    body = json.loads(event.get('body', '{}'))
    title = body.get('title')
    category = body.get('category')
    content = body.get('content')
    published_date = body.get('published_date', datetime.now().date().isoformat())
    
    if not title or not category or not content:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Title, category and content are required'}),
            'isBase64Encoded': False
        }
    
    if category not in ['nutrition', 'training', 'health']:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid category. Must be: nutrition, training, or health'}),
            'isBase64Encoded': False
        }
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            '''INSERT INTO public.articles 
               (title, category, content, published_date) 
               VALUES (%s, %s, %s, %s) 
               RETURNING id, title, category, content, published_date, view_count, created_at''',
            (title, category, content, published_date)
        )
        article = cur.fetchone()
        article['published_date'] = article['published_date'].isoformat() if article['published_date'] else None
        article['created_at'] = article['created_at'].isoformat() if article['created_at'] else None
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(article),
            'isBase64Encoded': False
        }

def update_article(conn, event: dict) -> dict:
    query_params = event.get('queryStringParameters') or {}
    article_id = query_params.get('id')
    
    if not article_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Article ID is required'}),
            'isBase64Encoded': False
        }
    
    body = json.loads(event.get('body', '{}'))
    title = body.get('title')
    category = body.get('category')
    content = body.get('content')
    published_date = body.get('published_date')
    
    updates = []
    params = []
    
    if title:
        updates.append('title = %s')
        params.append(title)
    if category:
        if category not in ['nutrition', 'training', 'health']:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid category'}),
                'isBase64Encoded': False
            }
        updates.append('category = %s')
        params.append(category)
    if content:
        updates.append('content = %s')
        params.append(content)
    if published_date:
        updates.append('published_date = %s')
        params.append(published_date)
    
    if not updates:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No fields to update'}),
            'isBase64Encoded': False
        }
    
    updates.append('updated_at = CURRENT_TIMESTAMP')
    params.append(article_id)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            f'''UPDATE public.articles 
                SET {', '.join(updates)} 
                WHERE id = %s 
                RETURNING id, title, category, content, published_date, view_count, created_at''',
            params
        )
        article = cur.fetchone()
        
        if article:
            article['published_date'] = article['published_date'].isoformat() if article['published_date'] else None
            article['created_at'] = article['created_at'].isoformat() if article['created_at'] else None
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(article),
                'isBase64Encoded': False
            }
        else:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Article not found'}),
                'isBase64Encoded': False
            }

def delete_article(conn, event: dict) -> dict:
    query_params = event.get('queryStringParameters') or {}
    article_id = query_params.get('id')
    
    if not article_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Article ID is required'}),
            'isBase64Encoded': False
        }
    
    with conn.cursor() as cur:
        cur.execute(
            'DELETE FROM public.articles WHERE id = %s',
            (article_id,)
        )
        
        if cur.rowcount > 0:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Article deleted successfully'}),
                'isBase64Encoded': False
            }
        else:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Article not found'}),
                'isBase64Encoded': False
            }
