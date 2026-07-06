import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { ChatUser, ChannelBadge } from './chatsShared';

interface ChatListProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  loading: boolean;
  filteredUsers: ChatUser[];
  users: ChatUser[];
  selectedUserId: number | null;
  handleSelectUser: (user: ChatUser) => void;
}

export default function ChatList({
  searchQuery,
  setSearchQuery,
  loading,
  filteredUsers,
  users,
  selectedUserId,
  handleSelectUser,
}: ChatListProps) {
  return (
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
                    {user.messageLimit === null ? (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-[#5a7052]">
                        <Icon name="Infinity" size={12} />
                        Обращений: без лимита
                      </span>
                    ) : (
                      user.messagesRemaining !== undefined && user.messagesRemaining !== null && (
                        <span
                          className={`inline-flex items-center gap-1 mt-1 text-[10px] font-medium ${
                            user.messagesRemaining === 0 ? 'text-red-600' : 'text-[#5a7052]'
                          }`}
                        >
                          <Icon name="MessageCircle" size={12} />
                          Осталось обращений: {user.messagesRemaining} из {user.messageLimit}
                        </span>
                      )
                    )}
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
}