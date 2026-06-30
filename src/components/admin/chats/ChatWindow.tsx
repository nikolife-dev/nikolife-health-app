import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import { ChatUser, ChatMessage, AvailableChannel, CHANNEL_META, ChannelBadge } from './chatsShared';

interface ChatWindowProps {
  selectedUser: ChatUser | null;
  messages: ChatMessage[];
  messagesLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  availableChannels: AvailableChannel[];
  hasEnabledChannel: boolean;
  selectedChannel: string;
  setSelectedChannel: (value: string) => void;
  messageText: string;
  setMessageText: (value: string) => void;
  sending: boolean;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleSendMessage: () => void;
  setShowMobileChat: (value: boolean) => void;
  setConfirmAction: (action: { type: 'clear' | 'delete'; userId: number; userName: string } | null) => void;
}

export default function ChatWindow({
  selectedUser,
  messages,
  messagesLoading,
  messagesEndRef,
  availableChannels,
  hasEnabledChannel,
  selectedChannel,
  setSelectedChannel,
  messageText,
  setMessageText,
  sending,
  handleKeyDown,
  handleSendMessage,
  setShowMobileChat,
  setConfirmAction,
}: ChatWindowProps) {
  return (
    <div className="flex flex-col h-full">
      {selectedUser ? (
        <>
          <div className="p-3 border-b border-[#748c6d]/10 flex items-center gap-3">
            <button onClick={() => setShowMobileChat(false)} className="lg:hidden p-1">
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
              <div className="flex items-center justify-center h-full text-[#4a5446]/50 text-sm">Загрузка...</div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[#4a5446]/40 text-sm">Нет сообщений</div>
            ) : (
              <div className="space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
                      msg.direction === 'out'
                        ? 'bg-[#748c6d] text-white rounded-br-md'
                        : 'bg-white border border-[#748c6d]/15 text-[#4a5446] rounded-bl-md'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      <div className={`flex items-center gap-1.5 mt-1 ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                        <ChannelBadge channel={msg.channel} />
                        <span className={`text-[10px] ${msg.direction === 'out' ? 'text-white/60' : 'text-[#4a5446]/40'}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <div className="p-3 border-t border-[#748c6d]/10">
            {availableChannels.length > 0 ? (
              <>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] text-[#4a5446]/50 mr-1">Канал:</span>
                  {availableChannels.map(ch => {
                    const meta = CHANNEL_META[ch.id] || { label: ch.id, icon: 'Circle', color: '' };
                    const isSelected = selectedChannel === ch.id;
                    const isDisabled = !ch.enabled;
                    return (
                      <button
                        key={ch.id}
                        onClick={() => !isDisabled && setSelectedChannel(ch.id)}
                        disabled={isDisabled}
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border transition-all ${
                          isDisabled
                            ? 'opacity-40 cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                            : isSelected
                              ? 'border-[#748c6d] bg-[#748c6d]/10 text-[#748c6d]'
                              : 'border-[#748c6d]/20 bg-white hover:bg-[#748c6d]/5 text-[#4a5446]'
                        }`}
                        title={isDisabled ? 'Уведомления отключены пользователем' : meta.label}
                      >
                        <Icon name={meta.icon} size={12} />
                        {meta.label}
                        {isDisabled && <Icon name="BellOff" size={10} className="ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Написать сообщение..."
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-white/50 border-[#748c6d]/20 h-10"
                    disabled={!hasEnabledChannel || sending}
                  />
                  <Button
                    size="icon"
                    className="bg-[#748c6d] hover:bg-[#5f7a59] h-10 w-10 shrink-0"
                    disabled={!messageText.trim() || !hasEnabledChannel || sending}
                    onClick={handleSendMessage}
                  >
                    <Icon name="SendHorizontal" size={18} />
                  </Button>
                </div>
                {!hasEnabledChannel && (
                  <p className="text-[10px] text-orange-500/80 mt-1.5 text-center">
                    Пользователь отключил уведомления
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-1">
                <p className="text-[11px] text-[#4a5446]/40">
                  Нет доступных каналов для отправки
                </p>
              </div>
            )}
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
}
