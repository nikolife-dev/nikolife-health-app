import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''Заполнение базы тренировками'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Only POST allowed'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    
    cardio_workouts = [
        ('HIIT тренировка', 'Высокоинтенсивная интервальная тренировка для быстрого сжигания калорий', 20, 'intermediate', 280, [
            ('Прыжки с разведением', '3x20', 15), ('Берпи', '3x15', 20), ('Высокие колени', '3x30 сек', 15), ('Планка с прыжками', '3x15', 20)
        ]),
        ('Бег на месте', 'Классическая кардио тренировка для дома', 30, 'beginner', 250, [
            ('Легкий бег', '5 мин', 0), ('Бег с высоким подъемом колен', '3 мин', 30), ('Бег с захлестом', '3 мин', 30), ('Интервальный бег', '5 мин', 60)
        ]),
        ('Прыжки со скакалкой', 'Эффективная кардио тренировка для всего тела', 15, 'intermediate', 200, [
            ('Обычные прыжки', '3 мин', 30), ('Двойные прыжки', '2 мин', 45), ('Прыжки на одной ноге', '2 мин', 30), ('Скоростные прыжки', '3 мин', 60)
        ]),
        ('Танцевальное кардио', 'Веселая танцевальная тренировка под музыку', 40, 'beginner', 320, [
            ('Разминка', '5 мин', 0), ('Базовые шаги', '10 мин', 30), ('Танцевальная комбинация', '15 мин', 30), ('Заминка', '5 мин', 0)
        ]),
        ('Табата', 'Интенсивная 4-минутная тренировка', 25, 'advanced', 300, [
            ('Приседания', '20 сек работа / 10 сек отдых', 10), ('Отжимания', '20 сек работа / 10 сек отдых', 10), ('Берпи', '20 сек работа / 10 сек отдых', 10), ('Планка', '20 сек работа / 10 сек отдых', 10)
        ]),
        ('Кардио бокс', 'Боксерская тренировка для выносливости', 35, 'intermediate', 350, [
            ('Джебы', '3x30 сек', 20), ('Кроссы', '3x30 сек', 20), ('Апперкоты', '3x30 сек', 20), ('Комбинации', '5 мин', 30)
        ]),
        ('Берпи челлендж', 'Комплекс из берпи и прыжков', 20, 'advanced', 280, [
            ('Классические берпи', '3x10', 30), ('Берпи с отжиманием', '3x8', 30), ('Берпи с прыжком вверх', '3x10', 30), ('Берпи широким прыжком', '3x8', 30)
        ]),
        ('Степ аэробика', 'Классическая аэробика с платформой', 45, 'beginner', 300, [
            ('Базовый шаг', '5 мин', 0), ('V-шаг', '5 мин', 30), ('Переменный шаг', '10 мин', 30), ('Комбинации', '15 мин', 30)
        ]),
        ('Интервальный бег', 'Чередование темпа для максимального эффекта', 30, 'intermediate', 320, [
            ('Разминка', '5 мин', 0), ('Спринт 30 сек', '10 повторений', 30), ('Легкий бег', '2 мин', 0), ('Заминка', '5 мин', 0)
        ]),
        ('Кардио микс', 'Разнообразные кардио упражнения', 35, 'beginner', 280, [
            ('Прыжки', '5 мин', 30), ('Бег на месте', '5 мин', 30), ('Джампинг Джек', '5 мин', 30), ('Скакалка', '5 мин', 30)
        ])
    ]
    
    strength_workouts = [
        ('Силовая тренировка всего тела', 'Комплексная тренировка на все группы мышц', 45, 'intermediate', 380, [
            ('Приседания', '3x12', 60), ('Отжимания', '3x15', 60), ('Выпады', '3x10', 60), ('Тяга в наклоне', '3x12', 60)
        ]),
        ('Грудь и трицепсы', 'Проработка верхней части тела', 40, 'intermediate', 320, [
            ('Жим лежа', '4x10', 90), ('Отжимания на брусьях', '3x12', 60), ('Разводка гантелей', '3x12', 60), ('Французский жим', '3x15', 60)
        ]),
        ('Спина и бицепсы', 'Тренировка для спины и рук', 40, 'intermediate', 340, [
            ('Подтягивания', '4x8', 90), ('Тяга штанги', '4x10', 90), ('Сгибания на бицепс', '3x12', 60), ('Молотки', '3x12', 60)
        ]),
        ('Ноги и ягодицы', 'Тренировка нижней части тела', 50, 'advanced', 420, [
            ('Приседания со штангой', '4x10', 120), ('Румынская тяга', '4x12', 90), ('Выпады с гантелями', '3x12', 60), ('Ягодичный мост', '3x15', 60)
        ]),
        ('Плечи и пресс', 'Дельты и мышцы кора', 35, 'beginner', 280, [
            ('Жим гантелей стоя', '3x12', 60), ('Махи в стороны', '3x15', 45), ('Скручивания', '3x20', 30), ('Планка', '3x60 сек', 30)
        ]),
        ('Функциональный тренинг', 'Упражнения с собственным весом', 40, 'beginner', 300, [
            ('Отжимания', '3x15', 45), ('Приседания', '3x20', 45), ('Планка', '3x45 сек', 30), ('Выпады', '3x12', 45)
        ]),
        ('Силовая выносливость', 'Круговая тренировка', 35, 'intermediate', 360, [
            ('Приседания с прыжком', '3x15', 30), ('Отжимания', '3x20', 30), ('Берпи', '3x12', 30), ('Планка с касанием', '3x16', 30)
        ]),
        ('Пауэрлифтинг база', 'Базовые упражнения со штангой', 60, 'advanced', 450, [
            ('Приседания', '5x5', 180), ('Жим лежа', '5x5', 180), ('Становая тяга', '5x5', 180), ('Разминка', '10 мин', 0)
        ]),
        ('Домашняя силовая', 'Тренировка без оборудования', 30, 'beginner', 250, [
            ('Отжимания от пола', '3x12', 45), ('Приседания', '3x15', 45), ('Планка', '3x30 сек', 30), ('Супермен', '3x15', 45)
        ]),
        ('Кроссфит WOD', 'Высокоинтенсивная силовая тренировка', 45, 'advanced', 480, [
            ('Трастеры', '3x15', 60), ('Подтягивания', '3x10', 60), ('Берпи', '3x15', 60), ('Двойные прыжки на скакалке', '3x50', 60)
        ])
    ]
    
    flexibility_workouts = [
        ('Йога для начинающих', 'Базовый комплекс асан', 30, 'beginner', 150, [
            ('Поза горы', '2 мин', 0), ('Собака мордой вниз', '3 мин', 30), ('Поза воина', '2 мин на сторону', 30), ('Шавасана', '5 мин', 0)
        ]),
        ('Йога для спины', 'Комплекс для укрепления и расслабления спины', 35, 'beginner', 160, [
            ('Поза кошки-коровы', '3 мин', 30), ('Поза ребенка', '3 мин', 30), ('Скрутка лежа', '2 мин на сторону', 30), ('Поза кобры', '2 мин', 30)
        ]),
        ('Утренняя растяжка', 'Мягкая растяжка для начала дня', 20, 'beginner', 100, [
            ('Потягивания', '2 мин', 0), ('Наклоны в стороны', '2 мин', 30), ('Растяжка ног', '3 мин', 30), ('Круговые движения', '3 мин', 30)
        ]),
        ('Вечерняя йога', 'Расслабляющая практика перед сном', 25, 'beginner', 120, [
            ('Поза бабочки', '3 мин', 30), ('Наклон вперед сидя', '3 мин', 30), ('Скручивание', '2 мин на сторону', 30), ('Шавасана', '5 мин', 0)
        ]),
        ('Пилатес', 'Упражнения для гибкости и баланса', 40, 'intermediate', 200, [
            ('Сотня', '3 подхода', 30), ('Перекаты', '2 мин', 30), ('Растяжка ног', '5 мин', 30), ('Мост', '3x15', 30)
        ]),
        ('Стретчинг', 'Глубокая растяжка всего тела', 35, 'intermediate', 180, [
            ('Шпагат', '5 мин на ногу', 60), ('Мост', '3 мин', 60), ('Растяжка плеч', '3 мин', 30), ('Складка', '5 мин', 60)
        ]),
        ('Йога для гибкости', 'Асаны на развитие гибкости', 45, 'intermediate', 220, [
            ('Наклоны вперед', '5 мин', 60), ('Раскрытие бедер', '5 мин на сторону', 60), ('Прогибы назад', '5 мин', 60), ('Шпагаты', '5 мин на ногу', 60)
        ]),
        ('Мобильность суставов', 'Улучшение подвижности', 30, 'beginner', 140, [
            ('Круговые движения плечами', '2 мин', 30), ('Вращение бедер', '3 мин', 30), ('Растяжка голеностопа', '2 мин', 30), ('Кошка-корова', '3 мин', 30)
        ]),
        ('Йога-флоу', 'Динамичная практика', 50, 'advanced', 280, [
            ('Приветствие солнцу', '10 мин', 30), ('Виньяса', '15 мин', 30), ('Балансы', '10 мин', 60), ('Шавасана', '5 мин', 0)
        ]),
        ('Растяжка после тренировки', 'Восстановительный комплекс', 20, 'beginner', 100, [
            ('Растяжка квадрицепсов', '2 мин на ногу', 30), ('Растяжка задней поверхности', '3 мин', 30), ('Растяжка спины', '2 мин', 30), ('Расслабление', '3 мин', 0)
        ])
    ]
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            inserted_count = 0
            
            for workout_data in cardio_workouts:
                title, desc, duration, diff, cal, exercises = workout_data
                cur.execute(
                    '''INSERT INTO t_p76837068_nikolife_health_app.workouts 
                       (title, description, category, duration_minutes, difficulty, calories, published_date)
                       VALUES (%s, %s, %s, %s, %s, %s, CURRENT_DATE) RETURNING id''',
                    (title, desc, 'cardio', duration, diff, cal)
                )
                workout_id = cur.fetchone()['id']
                
                for i, (ex_name, ex_sets, ex_rest) in enumerate(exercises):
                    cur.execute(
                        '''INSERT INTO t_p76837068_nikolife_health_app.workout_exercises
                           (workout_id, exercise_name, sets, rest_seconds, exercise_order)
                           VALUES (%s, %s, %s, %s, %s)''',
                        (workout_id, ex_name, ex_sets, ex_rest, i)
                    )
                inserted_count += 1
            
            for workout_data in strength_workouts:
                title, desc, duration, diff, cal, exercises = workout_data
                cur.execute(
                    '''INSERT INTO t_p76837068_nikolife_health_app.workouts 
                       (title, description, category, duration_minutes, difficulty, calories, published_date)
                       VALUES (%s, %s, %s, %s, %s, %s, CURRENT_DATE) RETURNING id''',
                    (title, desc, 'strength', duration, diff, cal)
                )
                workout_id = cur.fetchone()['id']
                
                for i, (ex_name, ex_sets, ex_rest) in enumerate(exercises):
                    cur.execute(
                        '''INSERT INTO t_p76837068_nikolife_health_app.workout_exercises
                           (workout_id, exercise_name, sets, rest_seconds, exercise_order)
                           VALUES (%s, %s, %s, %s, %s)''',
                        (workout_id, ex_name, ex_sets, ex_rest, i)
                    )
                inserted_count += 1
            
            for workout_data in flexibility_workouts:
                title, desc, duration, diff, cal, exercises = workout_data
                cur.execute(
                    '''INSERT INTO t_p76837068_nikolife_health_app.workouts 
                       (title, description, category, duration_minutes, difficulty, calories, published_date)
                       VALUES (%s, %s, %s, %s, %s, %s, CURRENT_DATE) RETURNING id''',
                    (title, desc, 'flexibility', duration, diff, cal)
                )
                workout_id = cur.fetchone()['id']
                
                for i, (ex_name, ex_sets, ex_rest) in enumerate(exercises):
                    cur.execute(
                        '''INSERT INTO t_p76837068_nikolife_health_app.workout_exercises
                           (workout_id, exercise_name, sets, rest_seconds, exercise_order)
                           VALUES (%s, %s, %s, %s, %s)''',
                        (workout_id, ex_name, ex_sets, ex_rest, i)
                    )
                inserted_count += 1
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': f'Successfully added {inserted_count} workouts'}),
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
        conn.close()
