import { useState, useEffect, useCallback } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TabsContent as OuterTabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import funcUrls from '../../../backend/func2url.json';

const API_URL = funcUrls.notifications;

interface Notification {
  id: number;
  title: string;
  text: string;
  channels: string[];
  status: 'draft' | 'scheduled' | 'sent';
  createdAt: string;
  sentAt?: string | null;
  recipients?: number;
}

const CHANNELS = [
  { id: 'telegram', label: 'Телеграм', icon: 'Send' },
  { id: 'email', label: 'E-mail', icon: 'Mail' },
  { id: 'vk', label: 'ВКонтакте', icon: 'MessageCircle' },
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [history, setHistory] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formText, setFormText] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSendAction, setPendingSendAction] = useState<(() => void) | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [draftRes, sentRes] = await Promise.all([
        fetch(API_URL),
        fetch(`${API_URL}?status=sent`),
      ]);
      const drafts = await draftRes.json();
      const sent = await sentRes.json();
      setNotifications(drafts);
      setHistory(sent);
    } catch {
      toast.error('Ошибка загрузки уведомлений');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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
    setFormTitle(notification.title);
    setFormText(notification.text);
    setIsEditOpen(true);
  };

  const openCreate = () => {
    setSelectedChannels([]);
    setFormTitle('');
    setFormText('');
    setIsCreateOpen(true);
  };

  const requestConfirm = (action: () => void) => {
    setPendingSendAction(() => action);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    if (pendingSendAction) {
      pendingSendAction();
      setPendingSendAction(null);
    }
  };

  const handleCreate = async (status: 'draft' | 'sent') => {
    if (!formTitle.trim() || !formText.trim()) {
      toast.error('Заполните название и текст');
      return;
    }
    if (selectedChannels.length === 0) {
      toast.error('Выберите хотя бы один канал');
      return;
    }
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          text: formText.trim(),
          channels: selectedChannels,
          status,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(status === 'sent' ? 'Рассылка запущена' : 'Черновик сохранён');
      setIsCreateOpen(false);
      fetchNotifications();
    } catch {
      toast.error('Ошибка создания рассылки');
    }
  };

  const handleUpdate = async (status?: 'sent') => {
    if (!selectedNotification) return;
    if (!formTitle.trim() || !formText.trim()) {
      toast.error('Заполните название и текст');
      return;
    }
    try {
      const res = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedNotification.id,
          title: formTitle.trim(),
          text: formText.trim(),
          channels: selectedChannels,
          status: status || selectedNotification.status,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(status === 'sent' ? 'Рассылка запущена' : 'Рассылка обновлена');
      setIsEditOpen(false);
      fetchNotifications();
    } catch {
      toast.error('Ошибка обновления');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Рассылка удалена');
      fetchNotifications();
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  const handleSend = async (notification: Notification) => {
    try {
      const res = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: notification.id,
          title: notification.title,
          text: notification.text,
          channels: notification.channels,
          status: 'sent',
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Рассылка запущена');
      fetchNotifications();
    } catch {
      toast.error('Ошибка запуска рассылки');
    }
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
              {loading ? (
                <div className="text-center py-12 text-[#4a5446]/60">
                  <Icon name="Loader2" size={32} className="mx-auto mb-4 animate-spin opacity-50" />
                  <p>Загрузка...</p>
                </div>
              ) : notifications.length === 0 ? (
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
                                onClick={() => handleDelete(n.id)}
                              >
                                <Icon name="Trash2" size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="min-h-[36px] min-w-[36px] p-0 text-[#748c6d] hover:text-[#5f7a59] hover:bg-[#748c6d]/10"
                                title="Запустить рассылку"
                                onClick={() => requestConfirm(() => handleSend(n))}
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
              {loading ? (
                <div className="text-center py-12 text-[#4a5446]/60">
                  <Icon name="Loader2" size={32} className="mx-auto mb-4 animate-spin opacity-50" />
                  <p>Загрузка...</p>
                </div>
              ) : history.length === 0 ? (
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
              <Input
                placeholder="Заголовок рассылки"
                maxLength={60}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Текст сообщения</Label>
              <Textarea
                placeholder="Привет, {имя}! Твоя привычка «{привычка}» ждёт тебя..."
                rows={4}
                maxLength={1000}
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
              />
              <div className="mt-2 p-3 bg-[#748c6d]/5 rounded-lg border border-[#748c6d]/15">
                <p className="text-xs font-medium text-[#4a5446]/80 mb-1.5">Доступные теги (подставятся для каждого получателя):</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { tag: '{имя}', desc: 'имя пользователя' },
                    { tag: '{привычка}', desc: 'название привычки' },
                    { tag: '{цель}', desc: 'цель привычки' },
                  ].map(t => (
                    <button
                      key={t.tag}
                      type="button"
                      onClick={() => setFormText(prev => prev + t.tag)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-[#748c6d]/20 text-xs text-[#748c6d] hover:bg-[#748c6d]/10 transition-colors cursor-pointer"
                      title={`Вставить ${t.tag} — ${t.desc}`}
                    >
                      <code className="font-mono font-semibold">{t.tag}</code>
                      <span className="text-[#4a5446]/50">— {t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
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
                onClick={() => handleCreate('draft')}
              >
                Сохранить черновик
              </Button>
              <Button
                variant="outline"
                className="min-h-[44px] gap-2 border-[#748c6d] text-[#748c6d] hover:bg-[#748c6d]/10"
                onClick={() => requestConfirm(() => handleCreate('sent'))}
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
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  maxLength={60}
                />
              </div>
              <div>
                <Label>Текст сообщения</Label>
                <Textarea
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
                <div className="mt-2 p-3 bg-[#748c6d]/5 rounded-lg border border-[#748c6d]/15">
                  <p className="text-xs font-medium text-[#4a5446]/80 mb-1.5">Доступные теги (подставятся для каждого получателя):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { tag: '{имя}', desc: 'имя пользователя' },
                      { tag: '{привычка}', desc: 'название привычки' },
                      { tag: '{цель}', desc: 'цель привычки' },
                    ].map(t => (
                      <button
                        key={t.tag}
                        type="button"
                        onClick={() => setFormText(prev => prev + t.tag)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-[#748c6d]/20 text-xs text-[#748c6d] hover:bg-[#748c6d]/10 transition-colors cursor-pointer"
                        title={`Вставить ${t.tag} — ${t.desc}`}
                      >
                        <code className="font-mono font-semibold">{t.tag}</code>
                        <span className="text-[#4a5446]/50">— {t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
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
                  onClick={() => handleUpdate()}
                >
                  Сохранить
                </Button>
                <Button
                  variant="outline"
                  className="min-h-[44px] gap-2 border-[#748c6d] text-[#748c6d] hover:bg-[#748c6d]/10"
                  onClick={() => requestConfirm(() => handleUpdate('sent'))}
                >
                  <Icon name="Play" size={16} />
                  Запустить
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердите отправку</AlertDialogTitle>
            <AlertDialogDescription>
              Рассылка будет отправлена всем пользователям с привязанным Telegram. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-[44px] bg-[#748c6d] hover:bg-[#5f7a59]"
              onClick={handleConfirm}
            >
              Отправить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OuterTabsContent>
  );
}