UPDATE t_p76837068_nikolife_health_app.users
SET password_hash = encode(sha256('123123'), 'hex')
WHERE email = 'admin@nikolife.ru';