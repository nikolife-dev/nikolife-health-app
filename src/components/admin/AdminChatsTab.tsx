import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

type Channel = 'telegram' | 'email' | 'broadcast';

interface ChatMessage {
  id: number;
  text: string;
  channel: Channel;
  direction: 'in' | 'out';
  timestamp: string;
}

interface ChatUser {
  id: number;
  name: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  channels: Channel[];
}

const CHANNEL_META: Record<Channel, { label: string; icon: string; color: string }> = {
  telegram: { label: 'Telegram', icon: 'Send', color: 'bg-blue-500/10 text-blue-700' },
  email: { label: 'E-mail', icon: 'Mail', color: 'bg-orange-500/10 text-orange-700' },
  broadcast: { label: 'Рассылка', icon: 'Megaphone', color: 'bg-purple-500/10 text-purple-700' },
};

const MOCK_USERS: ChatUser[] = [
  { id: 25, name: 'Андрей Николаев', lastMessage: 'Спасибо за напоминание!', lastTime: '10:40', unread: 1, channels: ['telegram'] },
  { id: 27, name: 'Матвей', lastMessage: 'Как изменить план питания?', lastTime: '09:55', unread: 2, channels: ['telegram'] },
  { id: 28, name: 'Кирилл Николаев', lastMessage: 'Понял, спасибо', lastTime: 'Вчера', unread: 0, channels: ['telegram'] },
  { id: 29, name: 'Матвей', lastMessage: 'Получил письмо, всё ок', lastTime: 'Вчера', unread: 0, channels: ['email'] },
  { id: 26, name: 'Новый', lastMessage: 'Привет, подскажите по подписке', lastTime: '12 фев', unread: 0, channels: ['email'] },
];

const MOCK_MESSAGES: Record<number, ChatMessage[]> = {
  25: [
    { id: 1, text: 'Проверка рассылки из Nikolife', channel: 'broadcast', direction: 'out', timestamp: '14 фев, 09:09' },
    { id: 2, text: 'Проверка рассылки из Nikolife', channel: 'email', direction: 'out', timestamp: '14 фев, 09:09' },
    { id: 3, text: 'Получил, всё работает!', channel: 'telegram', direction: 'in', timestamp: '14 фев, 09:15' },
    { id: 4, text: 'Андрей, я верю в тебя', channel: 'broadcast', direction: 'out', timestamp: '14 фев, 09:43' },
    { id: 5, text: 'Спасибо за напоминание!', channel: 'telegram', direction: 'in', timestamp: '14 фев, 10:40' },
  ],
  27: [
    { id: 1, text: 'Привет! Подскажите, как тренировки настроить?', channel: 'telegram', direction: 'in', timestamp: '13 фев, 18:30' },
    { id: 2, text: 'Привет! Зайдите в раздел "Тренировки" в меню', channel: 'telegram', direction: 'out', timestamp: '13 фев, 19:00' },
    { id: 3, text: 'Матвей, я верю в тебя', channel: 'broadcast', direction: 'out', timestamp: '14 фев, 09:43' },
    { id: 4, text: 'Как изменить план питания?', channel: 'telegram', direction: 'in', timestamp: '14 фев, 09:55' },
  ],
  28: [
    { id: 1, text: 'Проверка рассылки из Nikolife', channel: 'broadcast', direction: 'out', timestamp: '14 фев, 09:09' },
    { id: 2, text: 'Понял, спасибо', channel: 'telegram', direction: 'in', timestamp: '14 фев, 09:20' },
  ],
  29: [
    { id: 1, text: 'Проверка рассылки из Nikolife', channel: 'email', direction: 'out', timestamp: '14 фев, 09:09' },
    { id: 2, text: 'Получил письмо, всё ок', channel: 'email', direction: 'in', timestamp: '14 фев, 11:00' },
  ],
  26: [
    { id: 1, text: 'Привет, подскажите по подписке', channel: 'email', direction: 'in', timestamp: '12 фев, 14:22' },
  ],
};

function ChannelBadge({ channel }: { channel: Channel }) {
  const meta = CHANNEL_META[channel];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${meta.color}`}>
      <Icon name={meta.icon} size={10} />
      {meta.label}
    </span>
  );
}

export default function AdminChatsTab() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);

  const filteredUsers = MOCK_USERS.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUser = MOCK_USERS.find(u => u.id === selectedUserId);
  const messages = selectedUserId ? MOCK_MESSAGES[selectedUserId] || [] : [];

  const handleSelectUser = (userId: number) => {
    setSelectedUserId(userId);
    setShowMobileChat(true);
  };

  const ChatList = () => (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-[#748c6d]/10">
        <div className="relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5446]/40" />
          <Input
            placeholder="Поиск по имени..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/50 border-[#748c6d]/20 h-10"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y divide-[#748c6d]/10">
          {filteredUsers.map(user => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user.id)}
              className={`w-full text-left p-3 hover:bg-white/60 transition-colors ${
                selectedUserId === user.id ? 'bg-[#748c6d]/10' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#748c6d]/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-[#748c6d]">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[#4a5446] text-sm truncate">{user.name}</span>
                    <span className="text-[10px] text-[#4a5446]/50 shrink-0">{user.lastTime}</span>
                  </div>
                  <p className="text-xs text-[#4a5446]/60 truncate mt-0.5">{user.lastMessage}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {user.channels.map(ch => (
                      <ChannelBadge key={ch} channel={ch} />
                    ))}
                  </div>
                </div>
                {user.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#748c6d] text-white text-[10px] flex items-center justify-center shrink-0">
                    {user.unread}
                  </span>
                )}
              </div>
            </button>
          ))}
          {filteredUsers.length === 0 && (
            <div className="p-6 text-center text-[#4a5446]/50 text-sm">
              Ничего не найдено
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const ChatWindow = () => (
    <div className="flex flex-col h-full">
      {selectedUser ? (
        <>
          <div className="p-3 border-b border-[#748c6d]/10 flex items-center gap-3">
            <button
              onClick={() => setShowMobileChat(false)}
              className="lg:hidden p-1"
            >
              <Icon name="ArrowLeft" size={20} className="text-[#4a5446]" />
            </button>
            <div className="w-9 h-9 rounded-full bg-[#748c6d]/20 flex items-center justify-center">
              <span className="text-sm font-semibold text-[#748c6d]">
                {selectedUser.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[#4a5446] text-sm">{selectedUser.name}</div>
              <div className="flex items-center gap-1">
                {selectedUser.channels.map(ch => (
                  <ChannelBadge key={ch} channel={ch} />
                ))}
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
                      msg.direction === 'out'
                        ? 'bg-[#748c6d] text-white rounded-br-md'
                        : 'bg-white border border-[#748c6d]/15 text-[#4a5446] rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <div className={`flex items-center gap-1.5 mt-1 ${
                      msg.direction === 'out' ? 'justify-end' : 'justify-start'
                    }`}>
                      <ChannelBadge channel={msg.channel} />
                      <span className={`text-[10px] ${
                        msg.direction === 'out' ? 'text-white/60' : 'text-[#4a5446]/40'
                      }`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-[#748c6d]/10">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Написать сообщение..."
                className="flex-1 bg-white/50 border-[#748c6d]/20 h-10"
                disabled
              />
              <Button size="icon" className="bg-[#748c6d] hover:bg-[#5f7a59] h-10 w-10 shrink-0" disabled>
                <Icon name="SendHorizontal" size={18} />
              </Button>
            </div>
            <p className="text-[10px] text-[#4a5446]/40 mt-1.5 text-center">
              Отправка сообщений будет доступна после подключения каналов
            </p>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-[#4a5446]/50">
            <Icon name="MessageSquare" size={48} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Выберите чат из списка</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <TabsContent value="chats" className="space-y-4">
      <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[#748c6d]">Чаты</CardTitle>
              <p className="text-sm text-[#4a5446]/70 mt-1">Переписка с пользователями по всем каналам</p>
            </div>
            <Badge variant="outline" className="border-[#748c6d]/30 gap-1">
              <Icon name="MessageSquare" size={14} />
              {MOCK_USERS.length} диалогов
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t border-[#748c6d]/10 h-[600px] flex">
            {/* Chat list — desktop always, mobile when chat not open */}
            <div className={`w-full lg:w-80 border-r border-[#748c6d]/10 ${showMobileChat ? 'hidden lg:block' : 'block'}`}>
              <ChatList />
            </div>
            {/* Chat window — desktop always, mobile when chat open */}
            <div className={`flex-1 ${showMobileChat ? 'block' : 'hidden lg:block'}`}>
              <ChatWindow />
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
