-- sha256('password123') = ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
UPDATE users SET password_hash = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
WHERE email IN ('admin@nikolife.ru', 'anna@example.com', 'mikhail@example.com', 'kate@example.com');
