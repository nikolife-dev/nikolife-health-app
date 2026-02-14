import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import funcUrls from '../../../backend/func2url.json';

const API_URL = funcUrls.chats;

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
  telegram_username: string | null;
  lastMessage: string;
  lastTime: string;
  unread: number;
  channels: Channel[];
}

const CHANNEL_META: Record<string, { label: string; icon: string; color: string }> = {
  telegram: { label: 'Telegram', icon: 'Send', color: 'bg-blue-500/10 text-blue-700' },
  email: { label: 'E-mail', icon: 'Mail', color: 'bg-orange-500/10 text-orange-700' },
  broadcast: { label: 'Рассылка', icon: 'Megaphone', color: 'bg-purple-500/10 text-purple-700' },
};

function ChannelBadge({ channel }: { channel: string }) {
  const meta = CHANNEL_META[channel] || { label: channel, icon: 'Circle', color: 'bg-gray-500/10 text-gray-700' };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${meta.color}`}>
      <Icon name={meta.icon} size={10} />
      {meta.label}
    </span>
  );
}

export default function AdminChatsTab() {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'clear' | 'delete'; userId: number; userName: string } | null>(null);

  const fetchChatList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setUsers(data);
    } catch {
      toast.error('Ошибка загрузки чатов');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (userId: number) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`${API_URL}?user_id=${userId}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      toast.error('Ошибка загрузки сообщений');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChatList();
  }, [fetchChatList]);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId);
    }
  }, [selectedUserId, fetchMessages]);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectUser = (user: ChatUser) => {
    setSelectedUserId(user.id);
    setSelectedUser(user);
    setShowMobileChat(true);
  };

  const handleClearChat = async () => {
    if (!confirmAction) return;
    try {
      const res = await fetch(`${API_URL}?user_id=${confirmAction.userId}&action=clear`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Чат очищен');
      setMessages([]);
      fetchChatList();
    } catch {
      toast.error('Ошибка очистки чата');
    } finally {
      setConfirmAction(null);
    }
  };

  const handleDeleteChat = async () => {
    if (!confirmAction) return;
    try {
      const res = await fetch(`${API_URL}?user_id=${confirmAction.userId}&action=delete`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Чат удалён');
      setSelectedUserId(null);
      setSelectedUser(null);
      setMessages([]);
      setShowMobileChat(false);
      fetchChatList();
    } catch {
      toast.error('Ошибка удаления чата');
    } finally {
      setConfirmAction(null);
    }
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
        {loading ? (
          <div className="p-6 text-center text-[#4a5446]/50 text-sm">Загрузка...</div>
        ) : (
          <div className="divide-y divide-[#748c6d]/10">
            {filteredUsers.map(user => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
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
            {filteredUsers.length === 0 && !loading && (
              <div className="p-6 text-center text-[#4a5446]/50 text-sm">
                {users.length === 0 ? 'Нет чатов. Отправьте рассылку, чтобы начать.' : 'Ничего не найдено'}
              </div>
            )}
          </div>
        )}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Icon name="MoreVertical" size={18} className="text-[#4a5446]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setConfirmAction({ type: 'clear', userId: selectedUser.id, userName: selectedUser.name })}
                  className="gap-2"
                >
                  <Icon name="Eraser" size={16} />
                  Очистить чат
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setConfirmAction({ type: 'delete', userId: selectedUser.id, userName: selectedUser.name })}
                  className="gap-2 text-red-600 focus:text-red-600"
                >
                  <Icon name="Trash2" size={16} />
                  Удалить чат
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <ScrollArea className="flex-1 p-4">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full text-[#4a5446]/50 text-sm">
                Загрузка...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[#4a5446]/40 text-sm">
                Нет сообщений
              </div>
            ) : (
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
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
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
            )}
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
              {users.length} диалогов
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t border-[#748c6d]/10 h-[600px] flex">
            <div className={`w-full lg:w-80 border-r border-[#748c6d]/10 ${showMobileChat ? 'hidden lg:block' : 'block'}`}>
              <ChatList />
            </div>
            <div className={`flex-1 ${showMobileChat ? 'block' : 'hidden lg:block'}`}>
              <ChatWindow />
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'clear' ? 'Очистить чат?' : 'Удалить чат?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'clear'
                ? `Все сообщения с ${confirmAction?.userName} будут удалены. Это действие нельзя отменить.`
                : `Чат с ${confirmAction?.userName} будет полностью удалён. Это действие нельзя отменить.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction?.type === 'clear' ? handleClearChat : handleDeleteChat}
              className="bg-red-600 hover:bg-red-700"
            >
              {confirmAction?.type === 'clear' ? 'Очистить' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TabsContent>
  );
}
