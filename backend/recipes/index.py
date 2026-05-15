import json
import os
import psycopg2
import psycopg2.extras
import boto3
import base64
import uuid

def row_to_recipe(row, is_favorite=False) -> dict:
    return {
        'id': row[0], 'title': row[1], 'description': row[2], 'ingredients': row[3],
        'instructions': row[4], 'cooking_time': row[5], 'servings': row[6], 'calories': row[7],
        'protein': float(row[8]) if row[8] is not None else None,
        'carbs': float(row[9]) if row[9] is not None else None,
        'fats': float(row[10]) if row[10] is not None else None,
        'image_url': row[11], 'category': parse_category(row[12]),
        'tags': row[13], 'is_active': row[14],
        'weight_per_serving': row[18] if len(row) > 18 else None,
        'calories_100': row[19] if len(row) > 19 else None,
        'protein_100': float(row[20]) if len(row) > 20 and row[20] is not None else None,
        'fats_100': float(row[21]) if len(row) > 21 and row[21] is not None else None,
        'carbs_100': float(row[22]) if len(row) > 22 and row[22] is not None else None,
        'user_groups': row[23] if len(row) > 23 else None,
        'is_favorite': is_favorite,
    }


def parse_category(raw) -> list:
    """Превращает строку категорий или список в список строк."""
    if not raw:
        return []
    if isinstance(raw, list):
        return [x.strip() for x in raw if str(x).strip()]
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [x.strip() for x in parsed if str(x).strip()]
    except Exception:
        pass
    return [x.strip() for x in str(raw).split(',') if x.strip()]


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
        
        user_plan = None
        if auth_token:
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            psycopg2.extras.register_default_jsonb(conn)
            cur = conn.cursor()
            schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
            
            cur.execute(f"SELECT id, is_admin, selected_plan FROM {schema}.users WHERE auth_token = %s", (auth_token,))
            user_data = cur.fetchone()
            
            if user_data:
                user_id = user_data[0]
                is_admin = user_data[1] if len(user_data) > 1 else False
                user_plan = user_data[2] if len(user_data) > 2 else None
                print(f"[RECIPES] Пользователь: id={user_id}, is_admin={is_admin}, plan={user_plan}")
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
        psycopg2.extras.register_default_jsonb(conn)
        cur = conn.cursor()
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        
        # GET settings (для админки)
        if method == 'GET' and action == 'get_settings':
            cur.execute(f"SELECT key, value, description FROM {schema}.app_settings WHERE key LIKE 'basic_plan_%'")
            settings = {row[0]: {'value': row[1], 'description': row[2]} for row in cur.fetchall()}
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'settings': settings}), 'isBase64Encoded': False}

        # POST update_settings (только для администратора)
        if method == 'POST' and action == 'update_settings':
            if not is_admin:
                return {'statusCode': 403, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Только администратор'}), 'isBase64Encoded': False}
            body = json.loads(event.get('body', '{}'))
            for key, value in body.items():
                cur.execute(f"UPDATE {schema}.app_settings SET value = %s, updated_at = NOW() WHERE key = %s", (str(value), key))
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}

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
            
            recipes = [row_to_recipe(row, is_favorite=True) for row in cur.fetchall()]
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
            
            recipe = row_to_recipe(row, is_favorite=is_favorite)
            
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(recipe), 'isBase64Encoded': False}
        
        # GET /
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            category = params.get('category')
            search = params.get('search')
            limit = int(params.get('limit', 200))
            offset = int(params.get('offset', 0))

            # Определяем лимит для базового тарифа из настроек
            is_basic = (user_plan == 'free' or user_plan is None) and not is_admin
            basic_limit_per_category = 3
            if is_basic:
                cur.execute(f"SELECT value FROM {schema}.app_settings WHERE key = 'basic_plan_recipes_per_category'")
                row_setting = cur.fetchone()
                if row_setting:
                    basic_limit_per_category = int(row_setting[0])

            query = f"SELECT * FROM {schema}.recipes WHERE is_active = true"
            query_params = []
            
            if category:
                query += " AND (category = %s OR category ILIKE %s OR category ILIKE %s OR category ILIKE %s)"
                query_params.extend([category, f"{category},%", f"%, {category}", f"%, {category},%"])
            
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
                recipes.append(row_to_recipe(row))

            # Для базового тарифа помечаем рецепты сверх лимита в каждой категории
            if is_basic:
                category_counts: dict = {}
                for recipe in recipes:
                    cats = recipe['category'] if isinstance(recipe['category'], list) else [recipe['category']]
                    primary_cat = cats[0] if cats else 'other'
                    count = category_counts.get(primary_cat, 0)
                    if count >= basic_limit_per_category:
                        recipe['is_locked'] = True
                    else:
                        recipe['is_locked'] = False
                        category_counts[primary_cat] = count + 1
            
            if user_id and recipe_ids:
                placeholders = ','.join(['%s'] * len(recipe_ids))
                cur.execute(f"SELECT recipe_id FROM {schema}.user_favorites WHERE user_id = %s AND recipe_id IN ({placeholders})", [user_id] + recipe_ids)
                favorite_ids = {row[0] for row in cur.fetchall()}
                for recipe in recipes:
                    if recipe['id'] in favorite_ids:
                        recipe['is_favorite'] = True
            
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'recipes': recipes, 'basic_limit_per_category': basic_limit_per_category if is_basic else None}), 'isBase64Encoded': False}
        
        # POST check_duplicates — проверка дублей по названию
        if method == 'POST' and action == 'check_duplicates':
            if not is_admin:
                return {'statusCode': 403, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Только администратор'}), 'isBase64Encoded': False}

            body = json.loads(event.get('body', '{}'))
            titles = body.get('titles', [])
            if not titles:
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'duplicates': []}), 'isBase64Encoded': False}

            placeholders = ','.join(['%s'] * len(titles))
            cur.execute(f"SELECT id, title FROM {schema}.recipes WHERE lower(title) IN ({placeholders}) AND is_active = true", [t.lower() for t in titles])
            rows = cur.fetchall()
            duplicates = [{'id': r[0], 'title': r[1]} for r in rows]
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'duplicates': duplicates}), 'isBase64Encoded': False}

        # POST bulk import
        if method == 'POST' and action == 'bulk_import':
            if not is_admin:
                return {'statusCode': 403, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Только администратор'}), 'isBase64Encoded': False}
            
            body = json.loads(event.get('body', '{}'))
            recipes_data = body.get('recipes', [])
            
            if not recipes_data:
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Нет рецептов для импорта'}), 'isBase64Encoded': False}
            
            inserted = 0
            errors = []
            
            # decisions: dict title -> 'replace' | 'skip' | 'add'
            decisions = body.get('decisions', {})

            for i, r in enumerate(recipes_data):
                try:
                    if not r.get('title'):
                        errors.append(f"Строка {i+1}: нет названия")
                        continue

                    decision = decisions.get(r['title'], 'add')
                    if decision == 'skip':
                        continue

                    ingredients = r.get('ingredients', [])
                    if isinstance(ingredients, str):
                        ingredients = [x.strip() for x in ingredients.split(';') if x.strip()]

                    category_raw = r.get('category', '')
                    if isinstance(category_raw, list):
                        cats = [x.strip() for x in category_raw if str(x).strip()]
                    else:
                        cats = [x.strip() for x in str(category_raw).replace(';', ',').split(',') if x.strip()]
                    category_str = ', '.join(cats)[:100]

                    if decision == 'replace':
                        cur.execute(f"SELECT id FROM {schema}.recipes WHERE lower(title) = lower(%s) AND is_active = true LIMIT 1", (r['title'],))
                        existing = cur.fetchone()
                        if existing:
                            cur.execute(f"""
                                UPDATE {schema}.recipes SET
                                description=%s, ingredients=%s, instructions=%s, cooking_time=%s,
                                servings=%s, calories=%s, protein=%s, carbs=%s, fats=%s,
                                image_url=%s, category=%s, weight_per_serving=%s,
                                calories_100=%s, protein_100=%s, fats_100=%s, carbs_100=%s, user_groups=%s
                                WHERE id=%s
                            """, (
                                r.get('description', ''), json.dumps(ingredients),
                                r.get('instructions', ''), r.get('cooking_time'), r.get('servings', 1),
                                r.get('calories'), r.get('protein'), r.get('carbs'), r.get('fats'),
                                r.get('image_url'), category_str,
                                r.get('weight_per_serving'), r.get('calories_100'),
                                r.get('protein_100'), r.get('fats_100'), r.get('carbs_100'),
                                r.get('user_groups'), existing[0]
                            ))
                            inserted += 1
                            continue

                    cur.execute(f"""
                        INSERT INTO {schema}.recipes
                        (title, description, ingredients, instructions, cooking_time, servings, calories, protein, carbs, fats, image_url, category, tags, created_by, weight_per_serving, calories_100, protein_100, fats_100, carbs_100, user_groups)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        r.get('title'), r.get('description', ''), json.dumps(ingredients),
                        r.get('instructions', ''), r.get('cooking_time'), r.get('servings', 1),
                        r.get('calories'), r.get('protein'), r.get('carbs'), r.get('fats'),
                        r.get('image_url'), category_str, json.dumps([]), user_id,
                        r.get('weight_per_serving'), r.get('calories_100'),
                        r.get('protein_100'), r.get('fats_100'), r.get('carbs_100'),
                        r.get('user_groups')
                    ))
                    inserted += 1
                except Exception as e:
                    errors.append(f"Строка {i+1}: {str(e)}")
                    conn.rollback()
                    conn = psycopg2.connect(os.environ['DATABASE_URL'])
                    psycopg2.extras.register_default_jsonb(conn)
                    cur = conn.cursor()
            
            conn.commit()
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True, 'inserted': inserted, 'errors': errors}), 'isBase64Encoded': False}
        
        # POST /
        if method == 'POST' and not recipe_id:
            if not user_id:
                return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}
            
            body = json.loads(event.get('body', '{}'))
            
            if not body.get('title') or not body.get('ingredients') or not body.get('instructions'):
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Отсутствуют обязательные поля'}), 'isBase64Encoded': False}
            
            post_image_url = body.get('image_url')
            
            if body.get('image_url_import'):
                try:
                    import urllib.request
                    ext_url = body['image_url_import']
                    req = urllib.request.Request(ext_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req, timeout=15) as resp:
                        img_data = resp.read()
                        content_type = resp.headers.get('Content-Type', 'image/jpeg')
                    file_ext = 'jpg'
                    if 'png' in content_type: file_ext = 'png'
                    elif 'webp' in content_type: file_ext = 'webp'
                    s3 = boto3.client('s3', endpoint_url='https://bucket.poehali.dev',
                        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'], aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
                    filename = f"recipes/{uuid.uuid4()}.{file_ext}"
                    s3.put_object(Bucket='files', Key=filename, Body=img_data, ContentType=f'image/{file_ext}')
                    post_image_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{filename}"
                except Exception as e:
                    print(f"[RECIPES] ⚠️ Ошибка копирования изображения из URL: {e}")
            
            if body.get('image_base64'):
                try:
                    s3 = boto3.client('s3', endpoint_url='https://bucket.poehali.dev',
                        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'], aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])
                    b64 = body['image_base64']
                    if ',' in b64: b64 = b64.split(',')[1]
                    img_data = base64.b64decode(b64)
                    file_ext = 'jpg'
                    if body['image_base64'].startswith('data:image/png'): file_ext = 'png'
                    elif body['image_base64'].startswith('data:image/webp'): file_ext = 'webp'
                    filename = f"recipes/{uuid.uuid4()}.{file_ext}"
                    s3.put_object(Bucket='files', Key=filename, Body=img_data, ContentType=f'image/{file_ext}')
                    post_image_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{filename}"
                    print(f"[RECIPES] Изображение загружено при создании: {post_image_url}")
                except Exception as e:
                    print(f"[RECIPES] ⚠️ Ошибка загрузки изображения при создании: {e}")
            
            cur.execute(f"""
                INSERT INTO {schema}.recipes 
                (title, description, ingredients, instructions, cooking_time, servings, calories, protein, carbs, fats, image_url, category, tags, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s)
                RETURNING id
            """, (
                body.get('title'), body.get('description'), json.dumps(body.get('ingredients')),
                body.get('instructions'), body.get('cooking_time'), body.get('servings', 1),
                body.get('calories'), body.get('protein'), body.get('carbs'), body.get('fats'),
                post_image_url, json.dumps(body.get('category', [])), json.dumps(body.get('tags', [])), user_id
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
            
            # Скачивание изображения из внешнего URL в S3
            if body.get('image_url_import'):
                try:
                    import urllib.request
                    ext_url = body['image_url_import']
                    req = urllib.request.Request(ext_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req, timeout=15) as resp:
                        img_data = resp.read()
                        content_type = resp.headers.get('Content-Type', 'image/jpeg')
                    file_ext = 'jpg'
                    if 'png' in content_type:
                        file_ext = 'png'
                    elif 'webp' in content_type:
                        file_ext = 'webp'
                    elif 'gif' in content_type:
                        file_ext = 'gif'
                    s3 = boto3.client('s3',
                        endpoint_url='https://bucket.poehali.dev',
                        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
                    )
                    filename = f"recipes/{uuid.uuid4()}.{file_ext}"
                    s3.put_object(Bucket='files', Key=filename, Body=img_data, ContentType=f'image/{file_ext}')
                    image_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{filename}"
                    print(f"[RECIPES] Изображение скопировано из URL в S3: {image_url}")
                except Exception as e:
                    print(f"[RECIPES] ⚠️ Ошибка копирования изображения из URL: {e}")
            
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
                    image_url = COALESCE(%s, image_url), category = COALESCE(%s::jsonb, category),
                    tags = COALESCE(%s, tags), is_active = COALESCE(%s, is_active), updated_at = NOW()
                WHERE id = %s
            """, (
                body.get('title'), body.get('description'),
                json.dumps(body.get('ingredients')) if body.get('ingredients') else None,
                body.get('instructions'), body.get('cooking_time'), body.get('servings'),
                body.get('calories'), body.get('protein'), body.get('carbs'), body.get('fats'),
                image_url, json.dumps(body.get('category')) if body.get('category') else None,
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