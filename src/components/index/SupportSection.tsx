import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import funcUrls from '../../../backend/func2url.json';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: number;
  text: string;
  channel: string;
  direction: 'in' | 'out';
  timestamp: string;
}

const CHATS_API = funcUrls.chats;

export default function SupportSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [limit, setLimit] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${CHATS_API}?action=user_messages`, {
        headers: { 'X-Auth-Token': token || '' },
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        setIsFree(!!data.isFree);
        setLimit(data.limit ?? null);
        setRemaining(data.remaining ?? null);
      }
    } catch {
      /* ignore */
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(() => loadMessages(true), 10000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const limitReached = isFree && remaining !== null && remaining <= 0;

  const handleSend = async () => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${CHATS_API}?action=user_send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token || '' },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data.message]);
        setText('');
        setRemaining(data.remaining ?? null);
        setLimit(data.limit ?? null);
      } else if (data.error === 'limit_reached') {
        setRemaining(0);
        toast({ title: 'Лимит обращений исчерпан', description: data.message, variant: 'destructive' });
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось отправить', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось отправить сообщение', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Помощник по Здоровью</h2>
          <p className="text-sm sm:text-base text-gray-600">Задайте вопрос — мы поможем</p>
        </div>
        {isFree && limit !== null && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#748c6d]/10 px-3 py-1 text-xs sm:text-sm font-medium text-[#5a7052]">
            <Icon name="MessageCircle" size={14} />
            Осталось обращений: {Math.max(0, remaining ?? 0)} из {limit}
          </span>
        )}
      </div>

      <Card className="flex flex-col h-[520px] overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Icon name="Loader2" size={40} className="animate-spin text-[#748c6d]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
              <Icon name="MessagesSquare" size={48} className="mb-3 opacity-50" />
              <p>Здесь появятся ваши сообщения с менеджером</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.direction === 'in' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
                      msg.direction === 'in'
                        ? 'bg-[#748c6d] text-white rounded-br-md'
                        : 'bg-white border border-[#748c6d]/15 text-[#4a5446] rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <span className={`block text-[10px] mt-1 ${msg.direction === 'in' ? 'text-white/60 text-right' : 'text-[#4a5446]/40'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={scrollEndRef} />
            </div>
          )}
        </ScrollArea>

        {limitReached ? (
          <div className="border-t bg-[#e8e6dc]/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-start gap-2 text-sm text-[#4a5446]">
              <Icon name="Lock" size={18} className="text-[#748c6d] mt-0.5" />
              <span>В бесплатном тарифе доступно {limit} обращения. Оформите подписку для безлимитного общения.</span>
            </div>
            <Button onClick={() => navigate('/pricing')} className="bg-[#748c6d] hover:bg-[#5a7052] shrink-0">
              <Icon name="Sparkles" size={18} className="mr-2" />
              Улучшить тариф
            </Button>
          </div>
        ) : (
          <div className="border-t p-3 flex items-center gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишите сообщение..."
              className="flex-1"
              disabled={isSending}
            />
            <Button
              onClick={handleSend}
              disabled={isSending || !text.trim()}
              className="bg-[#748c6d] hover:bg-[#5a7052] min-w-[44px]"
            >
              {isSending ? (
                <Icon name="Loader2" size={18} className="animate-spin" />
              ) : (
                <Icon name="Send" size={18} />
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}