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
    GET /user/{user_id} - получить меню пользователя на неделю (админ может любого)
    GET / - получить меню текущего пользователя с датами
    POST / - добавить рецепт в меню
    POST /generate - автоматически сгенерировать меню на неделю (1-5 рецептов на прием)
    DELETE /{id} - удалить один рецепт из меню
    """
    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    
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
        
        # Разбираем путь
        path_parts = [p for p in path.split('/') if p]
        action = None
        target_user_id = current_user_id
        menu_id = None
        
        if len(path_parts) >= 1:
            if path_parts[0] == 'generate':
                action = 'generate'
            elif path_parts[0] == 'user' and len(path_parts) >= 2:
                if not is_admin:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Только администратор может просматривать меню других пользователей'}),
                        'isBase64Encoded': False
                    }
                target_user_id = int(path_parts[1])
            elif path_parts[0].isdigit():
                menu_id = int(path_parts[0])
        
        # POST /generate - автоматическая генерация меню
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
            
            # Получаем все активные рецепты
            cur.execute(f"SELECT id, category FROM {schema}.recipes WHERE is_active = true")
            all_recipes = cur.fetchall()
            
            if not all_recipes:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нет доступных рецептов для генерации меню'}),
                    'isBase64Encoded': False
                }
            
            # Группируем рецепты по категориям
            recipes_by_category = {}
            for recipe_id, category in all_recipes:
                if category not in recipes_by_category:
                    recipes_by_category[category] = []
                recipes_by_category[category].append(recipe_id)
            
            # Удаляем старое меню на эту неделю
            cur.execute(f"DELETE FROM {schema}.weekly_menus WHERE user_id = %s AND week_start_date = %s", 
                       (use_user_id, week_start))
            
            # Генерируем меню на 7 дней (1-5 рецептов на каждый прием пищи)
            meal_types = {
                'breakfast': recipes_by_category.get('завтрак', recipes_by_category.get('breakfast', [])),
                'lunch': recipes_by_category.get('обед', recipes_by_category.get('lunch', [])),
                'dinner': recipes_by_category.get('ужин', recipes_by_category.get('dinner', []))
            }
            
            # Если нет рецептов по категориям, используем все
            for meal_type in meal_types:
                if not meal_types[meal_type]:
                    meal_types[meal_type] = [r[0] for r in all_recipes]
            
            generated_count = 0
            for day in range(1, 8):  # 1-7 (Пн-Вс)
                for meal_type, recipe_ids in meal_types.items():
                    if recipe_ids:
                        # Генерируем от 1 до 3 рецептов на прием пищи
                        num_recipes = random.randint(1, min(3, len(recipe_ids)))
                        selected_recipes = random.sample(recipe_ids, num_recipes)
                        
                        for position, recipe_id in enumerate(selected_recipes, start=1):
                            cur.execute(f"""
                                INSERT INTO {schema}.weekly_menus 
                                (user_id, week_start_date, day_of_week, meal_type, recipe_id, position)
                                VALUES (%s, %s, %s, %s, %s, %s)
                                ON CONFLICT (user_id, week_start_date, day_of_week, meal_type, position) 
                                DO UPDATE SET recipe_id = EXCLUDED.recipe_id
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
            """, (target_user_id, week_start))
            
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
                    'user_id': target_user_id
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