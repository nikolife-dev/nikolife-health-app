import json
import os
import psycopg2
import boto3
import base64
import uuid

def handler(event: dict, context) -> dict:
    """
    API для управления рецептами
    """
    print(f"[RECIPES] Входящий запрос: method={event.get('httpMethod')}")
    print(f"[RECIPES] Event keys: {list(event.keys())}")
    print(f"[RECIPES] Full event: {event}")
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        print("[RECIPES] OPTIONS запрос - возвращаю CORS headers")
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
    
    try:
        # Получаем токен
        auth_token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
        print(f"[RECIPES] Токен: {'найден' if auth_token else 'НЕ найден'}")
        user_id = None
        is_admin = False
        
        if auth_token:
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            cur = conn.cursor()
            schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
            
            cur.execute(f"SELECT id, is_admin FROM {schema}.users WHERE auth_token = %s", (auth_token,))
            user_data = cur.fetchone()
            
            if user_data:
                user_id = user_data[0]
                is_admin = user_data[1] if len(user_data) > 1 else False
                print(f"[RECIPES] Пользователь: id={user_id}, is_admin={is_admin}")
            else:
                print("[RECIPES] ⚠️ Пользователь с таким токеном не найден в БД")
            
            cur.close()
            conn.close()
        
        # Получаем ID рецепта из query параметров (т.к. прокси не поддерживает path params)
        params = event.get('queryStringParameters') or {}
        recipe_id = None
        if params.get('id'):
            try:
                recipe_id = int(params['id'])
            except:
                pass
        
        action = params.get('action')
        
        print(f"[RECIPES] Параметры: recipe_id={recipe_id}, action={action}")
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        
        # GET /favorites
        if method == 'GET' and action == 'favorites':
            if not user_id:
                return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}
            
            cur.execute(f"""
                SELECT r.* FROM {schema}.recipes r
                INNER JOIN {schema}.user_favorites uf ON r.id = uf.recipe_id
                WHERE uf.user_id = %s AND r.is_active = true
                ORDER BY uf.created_at DESC
            """, (user_id,))
            
            recipes = []
            for row in cur.fetchall():
                recipes.append({
                    'id': row[0], 'title': row[1], 'description': row[2], 'ingredients': row[3],
                    'instructions': row[4], 'cooking_time': row[5], 'servings': row[6], 'calories': row[7],
                    'protein': float(row[8]) if row[8] else None, 'carbs': float(row[9]) if row[9] else None,
                    'fats': float(row[10]) if row[10] else None, 'image_url': row[11], 'category': row[12],
                    'tags': row[13], 'is_favorite': True
                })
            
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'recipes': recipes})}
        
        # POST /{id}/favorite
        if method == 'POST' and action == 'favorite' and recipe_id:
            if not user_id:
                return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}
            
            cur.execute(f"SELECT id FROM {schema}.user_favorites WHERE user_id = %s AND recipe_id = %s", (user_id, recipe_id))
            existing = cur.fetchone()
            
            if existing:
                cur.execute(f"DELETE FROM {schema}.user_favorites WHERE user_id = %s AND recipe_id = %s", (user_id, recipe_id))
                is_favorite = False
            else:
                cur.execute(f"INSERT INTO {schema}.user_favorites (user_id, recipe_id) VALUES (%s, %s)", (user_id, recipe_id))
                is_favorite = True
            
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True, 'is_favorite': is_favorite}), 'isBase64Encoded': False}
        
        # GET /{id}
        if method == 'GET' and recipe_id:
            cur.execute(f"SELECT * FROM {schema}.recipes WHERE id = %s AND is_active = true", (recipe_id,))
            row = cur.fetchone()
            
            if not row:
                cur.close()
                conn.close()
                return {'statusCode': 404, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Рецепт не найден'}), 'isBase64Encoded': False}
            
            is_favorite = False
            if user_id:
                cur.execute(f"SELECT id FROM {schema}.user_favorites WHERE user_id = %s AND recipe_id = %s", (user_id, recipe_id))
                is_favorite = cur.fetchone() is not None
            
            recipe = {
                'id': row[0], 'title': row[1], 'description': row[2], 'ingredients': row[3],
                'instructions': row[4], 'cooking_time': row[5], 'servings': row[6], 'calories': row[7],
                'protein': float(row[8]) if row[8] else None, 'carbs': float(row[9]) if row[9] else None,
                'fats': float(row[10]) if row[10] else None, 'image_url': row[11], 'category': row[12],
                'tags': row[13], 'is_favorite': is_favorite
            }
            
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(recipe), 'isBase64Encoded': False}
        
        # GET /
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            category = params.get('category')
            search = params.get('search')
            limit = int(params.get('limit', 50))
            offset = int(params.get('offset', 0))
            
            query = f"SELECT * FROM {schema}.recipes WHERE is_active = true"
            query_params = []
            
            if category:
                query += " AND category = %s"
                query_params.append(category)
            
            if search:
                query += " AND (title ILIKE %s OR description ILIKE %s)"
                search_pattern = f"%{search}%"
                query_params.extend([search_pattern, search_pattern])
            
            query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
            query_params.extend([limit, offset])
            
            cur.execute(query, query_params)
            
            recipes = []
            recipe_ids = []
            for row in cur.fetchall():
                recipe_ids.append(row[0])
                recipes.append({
                    'id': row[0], 'title': row[1], 'description': row[2], 'ingredients': row[3],
                    'instructions': row[4], 'cooking_time': row[5], 'servings': row[6], 'calories': row[7],
                    'protein': float(row[8]) if row[8] else None, 'carbs': float(row[9]) if row[9] else None,
                    'fats': float(row[10]) if row[10] else None, 'image_url': row[11], 'category': row[12],
                    'tags': row[13], 'is_favorite': False
                })
            
            if user_id and recipe_ids:
                placeholders = ','.join(['%s'] * len(recipe_ids))
                cur.execute(f"SELECT recipe_id FROM {schema}.user_favorites WHERE user_id = %s AND recipe_id IN ({placeholders})", [user_id] + recipe_ids)
                favorite_ids = {row[0] for row in cur.fetchall()}
                for recipe in recipes:
                    if recipe['id'] in favorite_ids:
                        recipe['is_favorite'] = True
            
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'recipes': recipes}), 'isBase64Encoded': False}
        
        # POST /
        if method == 'POST' and not recipe_id:
            if not user_id:
                return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}
            
            body = json.loads(event.get('body', '{}'))
            
            if not body.get('title') or not body.get('ingredients') or not body.get('instructions'):
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Отсутствуют обязательные поля'}), 'isBase64Encoded': False}
            
            cur.execute(f"""
                INSERT INTO {schema}.recipes 
                (title, description, ingredients, instructions, cooking_time, servings, calories, protein, carbs, fats, image_url, category, tags, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                body.get('title'), body.get('description'), json.dumps(body.get('ingredients')),
                body.get('instructions'), body.get('cooking_time'), body.get('servings', 1),
                body.get('calories'), body.get('protein'), body.get('carbs'), body.get('fats'),
                body.get('image_url'), body.get('category'), json.dumps(body.get('tags', [])), user_id
            ))
            
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 201, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True, 'id': new_id}), 'isBase64Encoded': False}
        
        # PUT /{id}
        if method == 'PUT' and recipe_id:
            print(f"[RECIPES] PUT запрос для рецепта #{recipe_id}, user_id={user_id}, is_admin={is_admin}")
            if not user_id:
                print("[RECIPES] ❌ Пользователь не авторизован")
                return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}
            
            cur.execute(f"SELECT created_by FROM {schema}.recipes WHERE id = %s", (recipe_id,))
            recipe = cur.fetchone()
            
            if not recipe:
                print(f"[RECIPES] ❌ Рецепт #{recipe_id} не найден")
                return {'statusCode': 404, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Рецепт не найден'}), 'isBase64Encoded': False}
            
            if not is_admin and recipe[0] != user_id:
                print(f"[RECIPES] ❌ Нет прав: создатель={recipe[0]}, текущий юзер={user_id}")
                return {'statusCode': 403, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Нет прав'}), 'isBase64Encoded': False}
            
            body = json.loads(event.get('body', '{}'))
            print(f"[RECIPES] Body получен, размер: {len(event.get('body', ''))} байт")
            
            image_url = body.get('image_url')
            
            # Загрузка изображения в S3, если передан base64
            if body.get('image_base64'):
                try:
                    s3 = boto3.client('s3',
                        endpoint_url='https://bucket.poehali.dev',
                        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
                    )
                    
                    base64_data = body['image_base64']
                    if ',' in base64_data:
                        base64_data = base64_data.split(',')[1]
                    
                    image_data = base64.b64decode(base64_data)
                    file_ext = 'jpg'
                    if body['image_base64'].startswith('data:image/png'):
                        file_ext = 'png'
                    elif body['image_base64'].startswith('data:image/webp'):
                        file_ext = 'webp'
                    
                    filename = f"recipes/{uuid.uuid4()}.{file_ext}"
                    s3.put_object(
                        Bucket='files',
                        Key=filename,
                        Body=image_data,
                        ContentType=f'image/{file_ext}'
                    )
                    
                    image_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{filename}"
                    print(f"[RECIPES] Изображение загружено: {image_url}")
                except Exception as e:
                    print(f"[RECIPES] ⚠️ Ошибка загрузки изображения: {e}")
            
            # Если изменен статус is_active на false - удаляем из всех меню
            if 'is_active' in body and not body['is_active']:
                print(f"[RECIPES] Рецепт #{recipe_id} деактивирован, удаляю из меню")
                cur.execute(f"DELETE FROM {schema}.weekly_menu WHERE recipe_id = %s", (recipe_id,))
            
            cur.execute(f"""
                UPDATE {schema}.recipes SET
                    title = COALESCE(%s, title), description = COALESCE(%s, description),
                    ingredients = COALESCE(%s, ingredients), instructions = COALESCE(%s, instructions),
                    cooking_time = COALESCE(%s, cooking_time), servings = COALESCE(%s, servings),
                    calories = COALESCE(%s, calories), protein = COALESCE(%s, protein),
                    carbs = COALESCE(%s, carbs), fats = COALESCE(%s, fats),
                    image_url = COALESCE(%s, image_url), category = COALESCE(%s, category),
                    tags = COALESCE(%s, tags), is_active = COALESCE(%s, is_active), updated_at = NOW()
                WHERE id = %s
            """, (
                body.get('title'), body.get('description'),
                json.dumps(body.get('ingredients')) if body.get('ingredients') else None,
                body.get('instructions'), body.get('cooking_time'), body.get('servings'),
                body.get('calories'), body.get('protein'), body.get('carbs'), body.get('fats'),
                image_url, body.get('category'),
                json.dumps(body.get('tags')) if body.get('tags') else None, 
                body.get('is_active') if 'is_active' in body else None,
                recipe_id
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}
        
        # DELETE /{id}
        if method == 'DELETE' and recipe_id:
            print(f"[RECIPES] DELETE запрос для рецепта #{recipe_id}, is_admin={is_admin}, user_id={user_id}")
            if not is_admin:
                print(f"[RECIPES] ❌ Доступ запрещен: пользователь не администратор")
                return {'statusCode': 403, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Только администратор'}), 'isBase64Encoded': False}
            
            print(f"[RECIPES] Помечаю рецепт #{recipe_id} как неактивный")
            cur.execute(f"UPDATE {schema}.recipes SET is_active = false WHERE id = %s", (recipe_id,))
            conn.commit()
            cur.close()
            conn.close()
            print(f"[RECIPES] ✅ Рецепт #{recipe_id} успешно удален")
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}
        
        cur.close()
        conn.close()
        print(f"[RECIPES] ⚠️ Неподдерживаемый метод или путь: method={method}, recipe_id={recipe_id}, action={action}")
        return {'statusCode': 405, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Method not allowed'}), 'isBase64Encoded': False}
        
    except Exception as e:
        print(f"[RECIPES] ❌ КРИТИЧЕСКАЯ ОШИБКА: {str(e)}")
        import traceback
        traceback.print_exc()
        return {'statusCode': 500, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': str(e)}), 'isBase64Encoded': False}