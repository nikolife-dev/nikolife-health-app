import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { TabsContent as OuterTabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import funcUrls from '../../../backend/func2url.json';
import { Notification } from './notifications/notificationsShared';
import NotificationsTables from './notifications/NotificationsTables';
import NotificationFormFields from './notifications/NotificationFormFields';

const API_URL = funcUrls.notifications;

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
      setNotifications(Array.isArray(drafts) ? drafts : (drafts.notifications || drafts.items || []));
      setHistory(Array.isArray(sent) ? sent : (sent.notifications || sent.items || []));
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
          <NotificationsTables
            innerTab={innerTab}
            setInnerTab={setInnerTab}
            loading={loading}
            notifications={notifications}
            history={history}
            openEdit={openEdit}
            handleDelete={handleDelete}
            requestConfirm={requestConfirm}
            handleSend={handleSend}
          />
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Новая рассылка</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <NotificationFormFields
              formTitle={formTitle}
              setFormTitle={setFormTitle}
              formText={formText}
              setFormText={setFormText}
              selectedChannels={selectedChannels}
              toggleChannel={toggleChannel}
              titlePlaceholder="Заголовок рассылки"
              textPlaceholder="Привет, {имя}! Твоя привычка «{привычка}» ждёт тебя..."
            />
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
              <NotificationFormFields
                formTitle={formTitle}
                setFormTitle={setFormTitle}
                formText={formText}
                setFormText={setFormText}
                selectedChannels={selectedChannels}
                toggleChannel={toggleChannel}
              />
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
