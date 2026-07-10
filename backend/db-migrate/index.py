import json
import os
import psycopg2
import psycopg2.extras

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p76837068_nikolife_health_app')

TABLES_ORDER = [
    'app_settings', 'users', 'health_parameters', 'articles',
    'mental_health_podcasts', 'payment_gateways', 'promo_codes',
    'promo_code_uses', 'subscriptions', 'habit_templates', 'habits',
    'habit_completions', 'chats', 'chat_messages', 'recipes',
    'user_favorites', 'weekly_menus', 'workouts', 'workout_exercises',
    'notifications',
]


def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    }


def get_ddl(src_cur, table):
    src_cur.execute(f"""
        SELECT column_name, data_type, udt_name, character_maximum_length,
               numeric_precision, numeric_scale, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = %s AND table_name = %s
        ORDER BY ordinal_position
    """, (SCHEMA, table))
    cols = src_cur.fetchall()
    col_defs = []
    for c in cols:
        name, dtype, udt, charlen, nprec, nscale, nullable, default = c
        if dtype == 'ARRAY':
            base = udt.lstrip('_')
            typ = f'{base}[]'
        elif dtype == 'character varying':
            typ = f'varchar({charlen})' if charlen else 'varchar'
        elif dtype == 'numeric' and nprec:
            typ = f'numeric({nprec},{nscale})'
        elif dtype == 'USER-DEFINED':
            typ = 'text'
        else:
            typ = dtype
        parts = [f'"{name}"', typ]
        if default is not None and 'nextval' not in str(default):
            parts.append(f'DEFAULT {default}')
        if nullable == 'NO':
            parts.append('NOT NULL')
        col_defs.append(' '.join(parts))
    return cols, col_defs


def get_pk(src_cur, table):
    src_cur.execute("""
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = %s::regclass AND i.indisprimary
    """, (f'"{SCHEMA}".{table}',))
    return [r[0] for r in src_cur.fetchall()]


def handler(event, context):
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    action = (event.get('queryStringParameters') or {}).get('action', 'ping')

    src = psycopg2.connect(os.environ['DATABASE_URL'])
    src.autocommit = True
    scur = src.cursor()

    dst = psycopg2.connect(os.environ['SUPABASE_DB_URL'])
    dst.autocommit = False
    dcur = dst.cursor()

    result = {}

    if action == 'ping':
        scur.execute('SELECT 1')
        dcur.execute('SELECT version()')
        result['source'] = 'ok'
        result['dest_version'] = dcur.fetchone()[0][:40]

    elif action == 'whereami':
        dburl = os.environ.get('DATABASE_URL', '')
        supurl = os.environ.get('SUPABASE_DB_URL', '')
        def host(u):
            try:
                return u.split('@')[1].split('/')[0]
            except Exception:
                return 'unknown'
        result['database_url_host'] = host(dburl)
        result['supabase_url_host'] = host(supurl)
        result['main_db_schema'] = os.environ.get('MAIN_DB_SCHEMA', 'NOT_SET')
        result['is_supabase'] = 'supabase.com' in dburl

    elif action == 'check_users':
        dcur.execute('SELECT id, email, LEFT(password_hash,12), LENGTH(password_hash), telegram_id FROM public."users" ORDER BY id')
        result['dst_users'] = [list(r) for r in dcur.fetchall()]
        scur.execute(f'SELECT id, email, LEFT(password_hash,12), LENGTH(password_hash), telegram_id FROM "{SCHEMA}"."users" ORDER BY id')
        result['src_users'] = [list(r) for r in scur.fetchall()]

    elif action == 'schema':
        dcur.execute('CREATE SCHEMA IF NOT EXISTS public')
        created = []
        for t in TABLES_ORDER:
            cols, col_defs = get_ddl(scur, t)
            pk = get_pk(scur, t)
            ddl = f'CREATE TABLE IF NOT EXISTS public."{t}" (\n  '
            ddl += ',\n  '.join(col_defs)
            if pk:
                ddl += ',\n  PRIMARY KEY (' + ', '.join(f'"{p}"' for p in pk) + ')'
            ddl += '\n)'
            dcur.execute(ddl)
            created.append(t)
        dst.commit()
        result['created'] = created

    elif action == 'data':
        table = (event.get('queryStringParameters') or {}).get('table')
        offset = int((event.get('queryStringParameters') or {}).get('offset', 0))
        limit = int((event.get('queryStringParameters') or {}).get('limit', 200))
        scur2 = src.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        scur2.execute(f'SELECT * FROM "{SCHEMA}"."{table}" ORDER BY 1 OFFSET {offset} LIMIT {limit}')
        rows = scur2.fetchall()
        if rows:
            colnames = list(rows[0].keys())
            cols_sql = ', '.join(f'"{c}"' for c in colnames)
            ph = ', '.join(['%s'] * len(colnames))
            insert = f'INSERT INTO public."{table}" ({cols_sql}) VALUES ({ph}) ON CONFLICT DO NOTHING'
            for r in rows:
                vals = [json.dumps(v) if isinstance(v, (dict, list)) else v for v in r.values()]
                dcur.execute(insert, vals)
            dst.commit()
        result['table'] = table
        result['inserted'] = len(rows)
        result['offset'] = offset

    elif action == 'seq':
        for t in TABLES_ORDER:
            pk = get_pk(scur, t)
            if len(pk) == 1 and pk[0] == 'id':
                try:
                    dcur.execute(f'SELECT setval(pg_get_serial_sequence(\'public."{t}"\', \'id\'), COALESCE((SELECT MAX(id) FROM public."{t}"), 1))')
                except Exception:
                    dst.rollback()
        dst.commit()
        result['seq'] = 'done'

    elif action == 'verify':
        counts = {}
        for t in TABLES_ORDER:
            scur.execute(f'SELECT COUNT(*) FROM "{SCHEMA}"."{t}"')
            src_c = scur.fetchone()[0]
            dcur.execute(f'SELECT COUNT(*) FROM public."{t}"')
            dst_c = dcur.fetchone()[0]
            counts[t] = {'src': src_c, 'dst': dst_c, 'ok': src_c == dst_c}
        result['counts'] = counts
        result['all_ok'] = all(c['ok'] for c in counts.values())

    scur.close()
    src.close()
    dcur.close()
    dst.close()
    return {'statusCode': 200, 'headers': cors(), 'body': json.dumps(result, default=str), 'isBase64Encoded': False}