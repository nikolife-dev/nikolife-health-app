import json
import os
import psycopg2
from datetime import datetime, timedelta
import random

def get_week_start(date_str=None):
    """Получить понедельник текущей или указанной недели"""
    if date_str:
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
    else:
        date = datetime.now().date()
    
    # Находим понедельник (weekday() возвращает 0 для понедельника)
    days_since_monday = date.weekday()
    monday = date - timedelta(days=days_since_monday)
    return monday

def handler(event: dict, context) -> dict:
    """
    API для управления меню на неделю:
    GET / - получить меню текущего пользователя с датами
    POST /?action=generate - автоматически сгенерировать меню на неделю (1-5 рецептов на прием)
    POST /?action=clear - очистить меню пользователя на неделю
    POST /?action=swap - поменять местами два рецепта
    DELETE /?id={menu_id} - удалить один рецепт из меню
    """
    method = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters', {}) or {}
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        # Получаем токен авторизации
        auth_token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
        
        if not auth_token:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Требуется авторизация'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        
        cur.execute(f"SELECT id, is_admin FROM {schema}.users WHERE auth_token = %s", (auth_token,))
        user_data = cur.fetchone()
        
        if not user_data:
            cur.close()
            conn.close()
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Невалидный токен'}),
                'isBase64Encoded': False
            }
        
        current_user_id = user_data[0]
        is_admin = user_data[1] if len(user_data) > 1 else False
        
        # Определяем action из query параметров
        action = query_params.get('action')
        menu_id = query_params.get('id')
        
        # Парсим menu_id если он есть
        if menu_id:
            try:
                menu_id = int(menu_id)
            except (ValueError, TypeError):
                menu_id = None
        
        # POST /?action=clear - очистить меню
        if method == 'POST' and action == 'clear':
            body = json.loads(event.get('body', '{}'))
            week_start = get_week_start(body.get('week_start_date'))
            
            cur.execute(f"DELETE FROM {schema}.weekly_menus WHERE user_id = %s AND week_start_date = %s", 
                       (current_user_id, week_start))
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Меню очищено'}),
                'isBase64Encoded': False
            }
        
        # POST /?action=swap - поменять местами два рецепта
        if method == 'POST' and action == 'swap':
            body = json.loads(event.get('body', '{}'))
            source_id = body.get('source_id')
            target_id = body.get('target_id')
            target_day = body.get('target_day')
            target_meal = body.get('target_meal')
            
            if not source_id or not target_day or not target_meal:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Необходимы параметры source_id, target_day, target_meal'}),
                    'isBase64Encoded': False
                }
            
            # Получаем данные source рецепта
            cur.execute(f"""
                SELECT day_of_week, meal_type, recipe_id 
                FROM {schema}.weekly_menus 
                WHERE id = %s AND user_id = %s
            """, (source_id, current_user_id))
            source_data = cur.fetchone()
            
            if not source_data:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Исходный рецепт не найден'}),
                    'isBase64Encoded': False
                }
            
            source_day, source_meal, source_recipe_id = source_data
            
            # Если есть target_id, делаем полный swap
            if target_id:
                cur.execute(f"""
                    SELECT recipe_id 
                    FROM {schema}.weekly_menus 
                    WHERE id = %s AND user_id = %s
                """, (target_id, current_user_id))
                target_data = cur.fetchone()
                
                if not target_data:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Целевой рецепт не найден'}),
                        'isBase64Encoded': False
                    }
                
                target_recipe_id = target_data[0]
                
                # Меняем местами
                cur.execute(f"""
                    UPDATE {schema}.weekly_menus 
                    SET day_of_week = %s, meal_type = %s 
                    WHERE id = %s
                """, (target_day, target_meal, source_id))
                
                cur.execute(f"""
                    UPDATE {schema}.weekly_menus 
                    SET day_of_week = %s, meal_type = %s 
                    WHERE id = %s
                """, (source_day, source_meal, target_id))
            else:
                # Просто перемещаем source в target слот
                cur.execute(f"""
                    UPDATE {schema}.weekly_menus 
                    SET day_of_week = %s, meal_type = %s 
                    WHERE id = %s
                """, (target_day, target_meal, source_id))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        # POST /?action=generate - автоматическая генерация меню
        if method == 'POST' and action == 'generate':
            body = json.loads(event.get('body', '{}'))
            week_start = get_week_start(body.get('week_start_date'))
            use_user_id = body.get('user_id', current_user_id)
            
            # Админ может генерировать для любого пользователя
            if use_user_id != current_user_id and not is_admin:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нет прав для генерации меню другого пользователя'}),
                    'isBase64Encoded': False
                }
            
            # Получаем все активные рецепты с калориями
            cur.execute(f"SELECT id, category, calories FROM {schema}.recipes WHERE is_active = true")
            all_recipes = cur.fetchall()
            
            if not all_recipes:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нет доступных рецептов для генерации меню'}),
                    'isBase64Encoded': False
                }
            
            # Группируем рецепты по категориям с данными о калориях
            recipes_by_category = {}
            for recipe_id, category, calories in all_recipes:
                if category not in recipes_by_category:
                    recipes_by_category[category] = []
                recipes_by_category[category].append({
                    'id': recipe_id,
                    'calories': calories or 300  # если нет данных, ставим среднее
                })
            
            # Удаляем старое меню на эту неделю
            cur.execute(f"DELETE FROM {schema}.weekly_menus WHERE user_id = %s AND week_start_date = %s", 
                       (use_user_id, week_start))
            
            # Генерируем меню на 7 дней
            meal_types = {
                'breakfast': recipes_by_category.get('завтрак', []),
                'lunch': recipes_by_category.get('обед', []),
                'dinner': recipes_by_category.get('ужин', [])
            }
            
            # Если нет рецептов по категориям, используем все
            all_recipes_list = [{'id': r[0], 'calories': r[2] or 300} for r in all_recipes]
            for meal_type in meal_types:
                if not meal_types[meal_type]:
                    meal_types[meal_type] = all_recipes_list
            
            generated_count = 0
            target_calories = 600  # Целевая калорийность на прием пищи
            
            for day in range(1, 8):  # 1-7 (Пн-Вс)
                for meal_type, recipes_pool in meal_types.items():
                    if not recipes_pool:
                        continue
                    
                    # Подбираем рецепты так, чтобы суммарно было ~600 ккал
                    selected_recipes = []
                    total_calories = 0
                    available = recipes_pool.copy()
                    random.shuffle(available)
                    
                    # Пытаемся набрать ~600 ккал, но не более
                    for recipe in available:
                        if len(selected_recipes) >= 5:  # Максимум 5 рецептов
                            break
                        
                        # Если добавление этого рецепта не превысит 600 ккал
                        if total_calories + recipe['calories'] <= target_calories:
                            selected_recipes.append(recipe['id'])
                            total_calories += recipe['calories']
                        
                        # Если мы близко к цели (±100 ккал), останавливаемся
                        if abs(total_calories - target_calories) <= 100:
                            break
                    
                    # Если ничего не набрали, берем хотя бы один рецепт с наименьшими калориями
                    if not selected_recipes and available:
                        min_cal_recipe = min(available, key=lambda r: r['calories'])
                        selected_recipes.append(min_cal_recipe['id'])
                    
                    # Сохраняем выбранные рецепты
                    for position, recipe_id in enumerate(selected_recipes, start=1):
                        cur.execute(f"""
                            INSERT INTO {schema}.weekly_menus 
                            (user_id, week_start_date, day_of_week, meal_type, recipe_id, position)
                            VALUES (%s, %s, %s, %s, %s, %s)
                        """, (use_user_id, week_start, day, meal_type, recipe_id, position))
                        generated_count += 1
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'generated_count': generated_count}),
                'isBase64Encoded': False
            }
        
        # GET / или GET /user/{id} - получить меню пользователя
        if method == 'GET' and not menu_id:
            params = event.get('queryStringParameters') or {}
            week_start = get_week_start(params.get('week_start_date'))
            
            # Получаем меню с деталями рецептов
            cur.execute(f"""
                SELECT 
                    wm.id, wm.day_of_week, wm.meal_type, wm.notes, wm.position,
                    r.id, r.title, r.description, r.cooking_time, r.servings, 
                    r.calories, r.image_url, r.category
                FROM {schema}.weekly_menus wm
                INNER JOIN {schema}.recipes r ON wm.recipe_id = r.id
                WHERE wm.user_id = %s AND wm.week_start_date = %s
                ORDER BY wm.day_of_week, 
                    CASE wm.meal_type 
                        WHEN 'breakfast' THEN 1 
                        WHEN 'lunch' THEN 2 
                        WHEN 'dinner' THEN 3 
                    END,
                    wm.position
            """, (current_user_id, week_start))
            
            menu_items = []
            for row in cur.fetchall():
                menu_items.append({
                    'id': row[0],
                    'day_of_week': row[1],
                    'meal_type': row[2],
                    'notes': row[3],
                    'position': row[4],
                    'recipe': {
                        'id': row[5],
                        'title': row[6],
                        'description': row[7],
                        'cooking_time': row[8],
                        'servings': row[9],
                        'calories': row[10],
                        'image_url': row[11],
                        'category': row[12]
                    }
                })
            
            # Добавляем календарные даты для каждого дня
            week_dates = []
            for i in range(7):
                date = week_start + timedelta(days=i)
                week_dates.append({
                    'day_number': i + 1,
                    'date': str(date),
                    'day_name': ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'][i]
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'week_start_date': week_start.isoformat(),
                    'week_dates': week_dates,
                    'menu': menu_items,
                    'user_id': current_user_id
                }),
                'isBase64Encoded': False
            }
        
        # POST / - создать/обновить запись меню
        if method == 'POST' and not action:
            body = json.loads(event.get('body', '{}'))
            
            required_fields = ['day_of_week', 'meal_type', 'recipe_id']
            for field in required_fields:
                if field not in body:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': f'Поле {field} обязательно'}),
                        'isBase64Encoded': False
                    }
            
            week_start = get_week_start(body.get('week_start_date'))
            use_user_id = body.get('user_id', current_user_id)
            
            # Админ может редактировать меню любого пользователя
            if use_user_id != current_user_id and not is_admin:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нет прав для редактирования меню другого пользователя'}),
                    'isBase64Encoded': False
                }
            
            # Находим следующую доступную позицию для этого приема пищи
            cur.execute(f"""
                SELECT COALESCE(MAX(position), 0) + 1
                FROM {schema}.weekly_menus
                WHERE user_id = %s AND week_start_date = %s AND day_of_week = %s AND meal_type = %s
            """, (use_user_id, week_start, body.get('day_of_week'), body.get('meal_type')))
            
            next_position = cur.fetchone()[0]
            
            # Ограничиваем до 5 рецептов на прием пищи
            if next_position > 5:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Максимум 5 рецептов на один прием пищи'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                INSERT INTO {schema}.weekly_menus 
                (user_id, week_start_date, day_of_week, meal_type, recipe_id, position, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                use_user_id,
                week_start,
                body.get('day_of_week'),
                body.get('meal_type'),
                body.get('recipe_id'),
                next_position,
                body.get('notes')
            ))
            
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'id': new_id}),
                'isBase64Encoded': False
            }
        
        # DELETE /{id} - удалить запись меню
        if method == 'DELETE' and menu_id:
            # Проверяем права (админ или владелец)
            cur.execute(f"SELECT user_id FROM {schema}.weekly_menus WHERE id = %s", (menu_id,))
            menu_item = cur.fetchone()
            
            if not menu_item:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Запись меню не найдена'}),
                    'isBase64Encoded': False
                }
            
            if not is_admin and menu_item[0] != current_user_id:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нет прав для удаления'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"DELETE FROM {schema}.weekly_menus WHERE id = %s", (menu_id,))
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }