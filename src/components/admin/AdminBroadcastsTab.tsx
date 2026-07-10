import { useState, useEffect, useCallback } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import funcUrls from '../../../backend/func2url.json';

const API = funcUrls['broadcasts'];

interface Broadcast {
  id: number;
  title: string;
  message: string;
  channels: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  sent_telegram: number;
  sent_email: number;
  failed_count: number;
  created_at: string;
  sent_at: string | null;
}

interface Audience {
  total_users: number;
  opted_in: number;
  telegram_reach: number;
  email_reach: number;
}

export default function AdminBroadcastsTab() {
  const { toast } = useToast();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [audience, setAudience] = useState<Audience | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Broadcast | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [confirmSend, setConfirmSend] = useState<Broadcast | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Broadcast | null>(null);

  const [form, setForm] = useState({ title: '', message: '', telegram: true, email: false });

  const token = localStorage.getItem('auth_token') || '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API, { headers: { 'X-Auth-Token': token } });
      const data = await res.json();
      if (res.ok) {
        setBroadcasts(data.broadcasts || []);
        setAudience(data.audience || null);
      }
    } catch {
      toast({ title: 'Ошибка загрузки рассылок', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', message: '', telegram: true, email: false });
    setDialogOpen(true);
  };

  const openEdit = (b: Broadcast) => {
    setEditing(b);
    setForm({
      title: b.title,
      message: b.message,
      telegram: b.channels.includes('telegram'),
      email: b.channels.includes('email'),
    });
    setDialogOpen(true);
  };

  const openDuplicate = (b: Broadcast) => {
    setEditing(null);
    setForm({
      title: `${b.title} (копия)`,
      message: b.message,
      telegram: b.channels.includes('telegram'),
      email: b.channels.includes('email'),
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast({ title: 'Заполните заголовок и текст', variant: 'destructive' });
      return;
    }
    if (!form.telegram && !form.email) {
      toast({ title: 'Выберите хотя бы один канал', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const channels = [
      ...(form.telegram ? ['telegram'] : []),
      ...(form.email ? ['email'] : []),
    ];
    try {
      const url = editing ? `${API}?id=${editing.id}` : API;
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'X-Auth-Token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, message: form.message, channels }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: editing ? 'Рассылка обновлена' : 'Рассылка создана' });
        setDialogOpen(false);
        load();
      } else {
        toast({ title: data.error || 'Ошибка сохранения', variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  const doSend = async (b: Broadcast) => {
    setConfirmSend(null);
    setSendingId(b.id);
    try {
      const res = await fetch(`${API}?id=${b.id}&action=send`, {
        method: 'POST',
        headers: { 'X-Auth-Token': token, 'Content-Type': 'application/json' },
        body: '{}',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const errs: string[] = data.errors || [];
        if (data.sent_count === 0 && data.failed_count > 0) {
          toast({
            title: 'Никому не доставлено',
            description: errs.length
              ? `Причина: ${errs[0]}. Часто это значит, что получатель не начал диалог с ботом.`
              : `Не доставлено: ${data.failed_count}. Проверьте, что получатели написали боту.`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Рассылка отправлена',
            description:
              `Доставлено: ${data.sent_count} (TG: ${data.sent_telegram}, Email: ${data.sent_email})` +
              (data.failed_count ? ` · не доставлено: ${data.failed_count}` : ''),
          });
        }
        load();
      } else {
        toast({ title: data.error || 'Ошибка отправки', variant: 'destructive' });
      }
    } finally {
      setSendingId(null);
    }
  };

  const doDelete = async (b: Broadcast) => {
    setConfirmDelete(null);
    const res = await fetch(`${API}?id=${b.id}`, {
      method: 'DELETE',
      headers: { 'X-Auth-Token': token },
    });
    const data = await res.json();
    if (res.ok && data.success) {
      toast({ title: 'Рассылка удалена' });
      load();
    } else {
      toast({ title: data.error || 'Ошибка удаления', variant: 'destructive' });
    }
  };

  const formatDate = (v: string | null) => {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime()) ? '—' : d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
  };

  const channelBadges = (channels: string) => (
    <div className="flex gap-1">
      {channels.includes('telegram') && (
        <Badge className="bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 gap-1">
          <Icon name="Send" size={12} /> TG
        </Badge>
      )}
      {channels.includes('email') && (
        <Badge className="bg-violet-500/10 text-violet-700 hover:bg-violet-500/20 gap-1">
          <Icon name="Mail" size={12} /> Email
        </Badge>
      )}
    </div>
  );

  return (
    <TabsContent value="broadcasts" className="space-y-4">
      {/* Карточки охвата */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Всего пользователей', value: audience?.total_users, icon: 'Users' },
          { label: 'Согласны на рассылки', value: audience?.opted_in, icon: 'BellRing' },
          { label: 'Доступно в Telegram', value: audience?.telegram_reach, icon: 'Send' },
          { label: 'Доступно по Email', value: audience?.email_reach, icon: 'Mail' },
        ].map((s) => (
          <Card key={s.label} className="bg-white/80 backdrop-blur border-[#748c6d]/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-[#4a5446]/70 text-xs mb-1">
                <Icon name={s.icon} size={14} />
                {s.label}
              </div>
              <div className="text-2xl font-bold text-[#748c6d]">
                {s.value != null ? s.value.toLocaleString('ru-RU') : '—'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-[#748c6d]">Рассылки</CardTitle>
              <p className="text-sm text-[#4a5446]/70 mt-1">
                Отправляются только тем, кто согласен получать рассылки
              </p>
            </div>
            <Button onClick={openCreate} className="bg-[#748c6d] hover:bg-[#5a7052] gap-2">
              <Icon name="Plus" size={18} /> Новая рассылка
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Icon name="Loader2" size={40} className="animate-spin text-[#748c6d]" />
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="text-center py-12 text-[#4a5446]/60">
              <Icon name="Mails" size={48} className="mx-auto mb-3 opacity-50" />
              <p>Рассылок пока нет. Создайте первую!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {broadcasts.map((b) => (
                <div
                  key={b.id}
                  className="border border-[#748c6d]/15 rounded-lg p-4 bg-white/60"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[#4a5446]">{b.title}</h3>
                        {b.status === 'sent' ? (
                          <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20">Отправлена</Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20">Черновик</Badge>
                        )}
                        {channelBadges(b.channels)}
                      </div>
                      <p className="text-sm text-[#4a5446]/70 mt-1 line-clamp-2 whitespace-pre-wrap">
                        {b.message}
                      </p>
                      <div className="text-xs text-[#4a5446]/50 mt-2 flex gap-3 flex-wrap">
                        <span>Создана: {formatDate(b.created_at)}</span>
                        {b.sent_at && <span>Отправлена: {formatDate(b.sent_at)}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {b.status !== 'sent' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => setConfirmSend(b)}
                            disabled={sendingId === b.id}
                            className="bg-[#748c6d] hover:bg-[#5a7052] gap-1"
                          >
                            {sendingId === b.id ? (
                              <Icon name="Loader2" size={14} className="animate-spin" />
                            ) : (
                              <Icon name="Send" size={14} />
                            )}
                            Отправить
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openEdit(b)}>
                            <Icon name="Pencil" size={14} />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        title="Дублировать"
                        onClick={() => openDuplicate(b)}
                      >
                        <Icon name="Copy" size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => setConfirmDelete(b)}
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>
                    </div>
                  </div>

                  {/* Статистика доставки */}
                  <div className="mt-3 pt-3 border-t border-[#748c6d]/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-[#4a5446]/50">Получателей</div>
                      <div className="font-semibold text-[#4a5446]">{b.total_recipients}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#4a5446]/50">Доставлено</div>
                      <div className="font-semibold text-green-700">{b.sent_count}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#4a5446]/50">TG / Email</div>
                      <div className="font-semibold text-[#4a5446]">{b.sent_telegram} / {b.sent_email}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#4a5446]/50">Не доставлено</div>
                      <div className={`font-semibold ${b.failed_count > 0 ? 'text-red-600' : 'text-[#4a5446]/40'}`}>
                        {b.failed_count}
                      </div>
                    </div>
                  </div>
                  {b.status === 'sent' && b.total_recipients > 0 && (
                    <div className="mt-2 h-1.5 bg-[#748c6d]/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#748c6d]"
                        style={{ width: `${Math.min(100, Math.round((b.sent_count / b.total_recipients) * 100))}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог создания/редактирования */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактировать рассылку' : 'Новая рассылка'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Заголовок</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Например: Новые рецепты недели"
                maxLength={255}
              />
            </div>
            <div>
              <Label>Текст сообщения</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Текст рассылки..."
                rows={6}
              />
            </div>
            <div>
              <Label className="mb-2 block">Каналы отправки</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={form.telegram}
                    onCheckedChange={(c) => setForm({ ...form, telegram: !!c })}
                  />
                  <span className="text-sm flex items-center gap-1">
                    <Icon name="Send" size={14} /> Telegram
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={form.email}
                    onCheckedChange={(c) => setForm({ ...form, email: !!c })}
                  />
                  <span className="text-sm flex items-center gap-1">
                    <Icon name="Mail" size={14} /> Email
                  </span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button onClick={save} disabled={saving} className="bg-[#748c6d] hover:bg-[#5a7052]">
              {saving && <Icon name="Loader2" size={16} className="animate-spin mr-1" />}
              {editing ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Подтверждение отправки */}
      <AlertDialog open={!!confirmSend} onOpenChange={(o) => !o && setConfirmSend(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отправить рассылку?</AlertDialogTitle>
            <AlertDialogDescription>
              «{confirmSend?.title}» будет отправлена {confirmSend?.total_recipients} получателям,
              которые согласились получать рассылки. Действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#748c6d] hover:bg-[#5a7052]"
              onClick={() => confirmSend && doSend(confirmSend)}
            >
              Отправить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Подтверждение удаления */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить рассылку?</AlertDialogTitle>
            <AlertDialogDescription>
              «{confirmDelete?.title}» будет удалена безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => confirmDelete && doDelete(confirmDelete)}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TabsContent>
  );
}