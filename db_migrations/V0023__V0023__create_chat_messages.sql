CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    text TEXT NOT NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'telegram',
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('in', 'out')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Переносим данные из старой таблицы chats
INSERT INTO chat_messages (user_id, text, channel, direction, created_at)
SELECT 
    user_id,
    content AS text,
    'telegram' AS channel,
    CASE WHEN role = 'user' THEN 'in' ELSE 'out' END AS direction,
    created_at
FROM chats;
