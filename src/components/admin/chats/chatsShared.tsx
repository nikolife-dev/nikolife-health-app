import Icon from '@/components/ui/icon';

export interface AvailableChannel {
  id: string;
  enabled: boolean;
}

export interface ChatMessage {
  id: number;
  text: string;
  channel: string;
  direction: 'in' | 'out';
  timestamp: string;
}

export interface ChatUser {
  id: number;
  name: string;
  telegram_username: string | null;
  lastMessage: string;
  lastTime: string;
  unread: number;
  channels: string[];
  availableChannels?: AvailableChannel[];
}

export interface UserDetail {
  id: number;
  name: string;
  telegram_username: string | null;
  telegram_id: number | null;
  availableChannels: AvailableChannel[];
}

export const CHANNEL_META: Record<string, { label: string; icon: string; color: string }> = {
  support: { label: 'Чат на сайте', icon: 'MessageCircle', color: 'bg-[#748c6d]/10 text-[#5a7052]' },
  telegram: { label: 'Telegram', icon: 'Send', color: 'bg-blue-500/10 text-blue-700' },
  email: { label: 'E-mail', icon: 'Mail', color: 'bg-orange-500/10 text-orange-700' },
  broadcast: { label: 'Рассылка', icon: 'Megaphone', color: 'bg-purple-500/10 text-purple-700' },
};

export function ChannelBadge({ channel }: { channel: string }) {
  const meta = CHANNEL_META[channel] || { label: channel, icon: 'Circle', color: 'bg-gray-500/10 text-gray-700' };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${meta.color}`}>
      <Icon name={meta.icon} size={10} />
      {meta.label}
    </span>
  );
}