import json
import os
import smtplib
import ssl
import requests
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
import psycopg2

DSN = os.environ.get('SUPABASE_DB_URL') or os.environ['DATABASE_URL']

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
}

# Окно, в течение которого напоминание считается «пора отправить» (минуты).
# Должно быть >= интервала запуска планировщика.
WINDOW_MINUTES = 15


def parse_offset(tz_str):
    """'+03:00' -> timedelta. По умолчанию МСК (+3)."""
    try:
        sign = 1 if tz_str[0] == '+' else -1
        hh = int(tz_str[1:3])
        mm = int(tz_str[4:6])
        return timedelta(hours=sign * hh, minutes=sign * mm)
    except Exception:
        return timedelta(hours=3)


def send_telegram(session, chat_id, text):
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    if not token or not chat_id:
        return False
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML', 'disable_web_page_preview': True}
    for _ in range(2):
        try:
            r = session.post(url, json=payload, timeout=(5, 7))
            if r.status_code == 200:
                return True
            return False
        except Exception:
            continue
    return False


def send_email(to_email, subject, html_body):
    host = os.environ.get('SMTP_HOST', '')
    if not host or not to_email:
        return False
    port = int(os.environ.get('SMTP_PORT', '465'))
    user = os.environ.get('SMTP_USER', '')
    password = os.environ.get('SMTP_PASSWORD', '')
    sender = os.environ.get('SMTP_FROM', user)
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = formataddr(('NIKOLIFE', sender))
        msg['To'] = to_email
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        ctx = ssl.create_default_context()
        if port == 465:
            with smtplib.SMTP_SSL(host, port, context=ctx, timeout=15) as s:
                s.login(user, password)
                s.sendmail(sender, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=15) as s:
                s.starttls(context=ctx)
                s.login(user, password)
                s.sendmail(sender, [to_email], msg.as_string())
        return True
    except Exception as e:
        print(f"[REMINDERS] email error {to_email}: {e}")
        return False


def handler(event, context):
    """Планировщик напоминаний о привычках. Запускается по расписанию (каждые ~10-15 минут)."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    now_utc = datetime.now(timezone.utc)
    conn = psycopg2.connect(DSN)
    cur = conn.cursor()

    cur.execute("""
        SELECT h.id, h.title, h.goal, h.days_of_week, h.reminder_time,
               h.reminder_channel, h.reminder_timezone, h.reminder_last_sent,
               u.telegram_id, u.email, u.name
        FROM public.habits h
        JOIN public.users u ON u.id = h.user_id
        WHERE h.reminder_enabled = TRUE
          AND h.reminder_time IS NOT NULL
    """)
    rows = cur.fetchall()

    session = requests.Session()
    sent = 0
    checked = 0
    details = []

    for r in rows:
        checked += 1
        (hid, title, goal, days_json, rtime, channel, tz_str,
         last_sent, telegram_id, email, name) = r

        offset = parse_offset(tz_str or '+03:00')
        local_now = now_utc + offset
        local_date = local_now.date()

        # Уже отправляли сегодня (по локальной дате)?
        if last_sent == local_date:
            continue

        # День недели: в проекте Вс=0, Пн=1..Сб=6
        py_wd = local_now.weekday()  # Пн=0..Вс=6
        proj_wd = 0 if py_wd == 6 else py_wd + 1
        try:
            days = json.loads(days_json) if days_json and days_json.startswith('[') else []
        except Exception:
            days = []
        if proj_wd not in days:
            continue

        # Время: попадаем ли в окно [reminder_time, reminder_time + WINDOW)
        try:
            hh, mm = int(rtime[:2]), int(rtime[3:5])
        except Exception:
            continue
        target = local_now.replace(hour=hh, minute=mm, second=0, microsecond=0)
        diff = (local_now - target).total_seconds() / 60.0
        if diff < 0 or diff >= WINDOW_MINUTES:
            continue

        # Отправляем
        text = f"🔔 Напоминание: <b>{title}</b>"
        if goal:
            text += f"\n{goal}"
        ok = False
        if channel == 'email':
            html = f"<h2 style='color:#748c6d'>🔔 Напоминание</h2><p><b>{title}</b></p>"
            if goal:
                html += f"<p>{goal}</p>"
            ok = send_email(email if email and not email.endswith('@nikolife.temp') else None, f"Напоминание: {title}", html)
        else:
            ok = send_telegram(session, telegram_id, text)

        if ok:
            cur.execute(
                "UPDATE public.habits SET reminder_last_sent = %s WHERE id = %s",
                (local_date, hid)
            )
            conn.commit()
            sent += 1
            details.append({'habit_id': hid, 'channel': channel, 'ok': True})
        else:
            details.append({'habit_id': hid, 'channel': channel, 'ok': False})

    session.close()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': CORS,
        'body': json.dumps({'checked': checked, 'sent': sent, 'details': details}),
        'isBase64Encoded': False,
    }
