import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TabsContent as OuterTabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

interface Notification {
  id: number;
  title: string;
  text: string;
  channels: string[];
  status: 'draft' | 'scheduled' | 'sent';
  createdAt: string;
  sentAt?: string;
  recipients?: number;
}

const CHANNELS = [
  { id: 'telegram', label: 'Телеграм', icon: 'Send' },
  { id: 'email', label: 'E-mail', icon: 'Mail' },
  { id: 'vk', label: 'ВКонтакте', icon: 'MessageCircle' },
];

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: 'Новогодняя акция',
    text: 'Скидка 30% на все подписки до конца января!',
    channels: ['telegram', 'email'],
    status: 'draft',
    createdAt: '14.02.2026',
  },
  {
    id: 2,
    title: 'Обновление приложения',
    text: 'Мы добавили новые тренировки и рецепты. Обновите приложение!',
    channels: ['telegram', 'email', 'vk'],
    status: 'scheduled',
    createdAt: '13.02.2026',
  },
  {
    id: 3,
    title: 'Напоминание о тренировке',
    text: 'Не забудьте про тренировку сегодня!',
    channels: ['telegram'],
    status: 'draft',
    createdAt: '12.02.2026',
  },
];

const MOCK_HISTORY: Notification[] = [
  {
    id: 101,
    title: 'Февральская распродажа',
    text: 'Скидка 20% на годовую подписку!',
    channels: ['telegram', 'email'],
    status: 'sent',
    createdAt: '10.02.2026',
    sentAt: '10.02.2026 14:30',
    recipients: 843,
  },
  {
    id: 102,
    title: 'Новый раздел: Ментальное здоровье',
    text: 'Мы запустили раздел ментального здоровья с медитациями и практиками.',
    channels: ['telegram', 'email', 'vk'],
    status: 'sent',
    createdAt: '05.02.2026',
    sentAt: '05.02.2026 10:00',
    recipients: 1128,
  },
  {
    id: 103,
    title: 'Приветственная рассылка',
    text: 'Добро пожаловать в NikoLife! Начните с выбора привычек.',
    channels: ['email'],
    status: 'sent',
    createdAt: '01.02.2026',
    sentAt: '01.02.2026 09:00',
    recipients: 256,
  },
];

const getStatusBadge = (status: string) => {
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

const getChannelBadge = (channelId: string) => {
  const ch = CHANNELS.find(c => c.id === channelId);
  if (!ch) return null;
  return (
    <Badge key={channelId} variant="outline" className="border-[#748c6d]/30 gap-1">
      <Icon name={ch.icon} size={12} />
      {ch.label}
    </Badge>
  );
};

export default function AdminNotificationsTab() {
  const [innerTab, setInnerTab] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [notifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [history] = useState<Notification[]>(MOCK_HISTORY);

  const toggleChannel = (channelId: string) => {
    setSelectedChannels(prev =>
      prev.includes(channelId)
        ? prev.filter(c => c !== channelId)
        : [...prev, channelId]
    );
  };

  const openEdit = (notification: Notification) => {
    setSelectedNotification(notification);
    setSelectedChannels(notification.channels);
    setIsEditOpen(true);
  };

  const openCreate = () => {
    setSelectedChannels([]);
    setIsCreateOpen(true);
  };

  return (
    <OuterTabsContent value="notifications" className="space-y-4">
      <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-[#748c6d]">Уведомления</CardTitle>
              <p className="text-sm text-[#4a5446]/70 mt-1">Рассылки пользователям по каналам</p>
            </div>
            <Button onClick={openCreate} className="bg-[#748c6d] hover:bg-[#5f7a59] min-h-[44px] gap-2">
              <Icon name="Plus" size={18} />
              Создать рассылку
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={innerTab} onValueChange={setInnerTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="all">Все рассылки</TabsTrigger>
              <TabsTrigger value="history">История</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-[#4a5446]/60">
                  <Icon name="Bell" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Рассылок пока нет</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Название</TableHead>
                        <TableHead>Каналы</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notifications.map((n) => (
                        <TableRow key={n.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-[#4a5446]">{n.title}</p>
                              <p className="text-xs text-[#4a5446]/60 mt-0.5 line-clamp-1">{n.text}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {n.channels.map(ch => getChannelBadge(ch))}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(n.status)}</TableCell>
                          <TableCell className="text-[#4a5446]/80 text-sm">{n.createdAt}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEdit(n)}
                                className="min-h-[36px] min-w-[36px] p-0"
                                title="Редактировать"
                              >
                                <Icon name="Edit" size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="min-h-[36px] min-w-[36px] p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Удалить"
                              >
                                <Icon name="Trash2" size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="min-h-[36px] min-w-[36px] p-0 text-[#748c6d] hover:text-[#5f7a59] hover:bg-[#748c6d]/10"
                                title="Запустить рассылку"
                              >
                                <Icon name="Play" size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-12 text-[#4a5446]/60">
                  <Icon name="Clock" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>История рассылок пуста</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Название</TableHead>
                        <TableHead>Каналы</TableHead>
                        <TableHead>Получатели</TableHead>
                        <TableHead>Отправлена</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((n) => (
                        <TableRow key={n.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-[#4a5446]">{n.title}</p>
                              <p className="text-xs text-[#4a5446]/60 mt-0.5 line-clamp-1">{n.text}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {n.channels.map(ch => getChannelBadge(ch))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-[#748c6d]">{n.recipients}</span>
                            <span className="text-[#4a5446]/60 text-sm"> чел.</span>
                          </TableCell>
                          <TableCell className="text-[#4a5446]/80 text-sm">{n.sentAt}</TableCell>
                          <TableCell>{getStatusBadge(n.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Новая рассылка</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Название</Label>
              <Input placeholder="Заголовок рассылки" maxLength={60} />
            </div>
            <div>
              <Label>Текст сообщения</Label>
              <Textarea placeholder="Текст, который получат пользователи..." rows={4} maxLength={1000} />
            </div>
            <div>
              <Label>Каналы рассылки</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => toggleChannel(ch.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all min-h-[44px] ${
                      selectedChannels.includes(ch.id)
                        ? 'border-[#748c6d] bg-[#748c6d]/10 text-[#748c6d]'
                        : 'border-gray-200 bg-white text-[#4a5446]/60 hover:border-gray-300'
                    }`}
                  >
                    <Icon name={ch.icon} size={18} />
                    <span className="font-medium text-sm">{ch.label}</span>
                    {selectedChannels.includes(ch.id) && (
                      <Icon name="Check" size={16} className="text-[#748c6d]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-[#748c6d] hover:bg-[#5f7a59] min-h-[44px]"
                onClick={() => setIsCreateOpen(false)}
              >
                Сохранить черновик
              </Button>
              <Button
                variant="outline"
                className="min-h-[44px] gap-2 border-[#748c6d] text-[#748c6d] hover:bg-[#748c6d]/10"
                onClick={() => setIsCreateOpen(false)}
              >
                <Icon name="Play" size={16} />
                Запустить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать рассылку</DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div>
                <Label>Название</Label>
                <Input defaultValue={selectedNotification.title} maxLength={60} />
              </div>
              <div>
                <Label>Текст сообщения</Label>
                <Textarea defaultValue={selectedNotification.text} rows={4} maxLength={1000} />
              </div>
              <div>
                <Label>Каналы рассылки</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CHANNELS.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => toggleChannel(ch.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all min-h-[44px] ${
                        selectedChannels.includes(ch.id)
                          ? 'border-[#748c6d] bg-[#748c6d]/10 text-[#748c6d]'
                          : 'border-gray-200 bg-white text-[#4a5446]/60 hover:border-gray-300'
                      }`}
                    >
                      <Icon name={ch.icon} size={18} />
                      <span className="font-medium text-sm">{ch.label}</span>
                      {selectedChannels.includes(ch.id) && (
                        <Icon name="Check" size={16} className="text-[#748c6d]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 bg-[#748c6d] hover:bg-[#5f7a59] min-h-[44px]"
                  onClick={() => setIsEditOpen(false)}
                >
                  Сохранить
                </Button>
                <Button
                  variant="outline"
                  className="min-h-[44px] gap-2 border-[#748c6d] text-[#748c6d] hover:bg-[#748c6d]/10"
                  onClick={() => setIsEditOpen(false)}
                >
                  <Icon name="Play" size={16} />
                  Запустить
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </OuterTabsContent>
  );
}
