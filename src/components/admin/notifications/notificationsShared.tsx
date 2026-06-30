import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

export interface Notification {
  id: number;
  title: string;
  text: string;
  channels: string[];
  status: 'draft' | 'scheduled' | 'sent';
  createdAt: string;
  sentAt?: string | null;
  recipients?: number;
}

export const CHANNELS = [
  { id: 'telegram', label: 'Телеграм', icon: 'Send' },
  { id: 'email', label: 'E-mail', icon: 'Mail' },
  { id: 'vk', label: 'ВКонтакте', icon: 'MessageCircle' },
];

export const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft':
      return <Badge variant="secondary">Черновик</Badge>;
    case 'scheduled':
      return <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20">Запланирована</Badge>;
    case 'sent':
      return <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20">Отправлена</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export const getChannelBadge = (channelId: string) => {
  const ch = CHANNELS.find(c => c.id === channelId);
  if (!ch) return null;
  return (
    <Badge key={channelId} variant="outline" className="border-[#748c6d]/30 gap-1">
      <Icon name={ch.icon} size={12} />
      {ch.label}
    </Badge>
  );
};
