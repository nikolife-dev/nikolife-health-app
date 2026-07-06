import { useEffect, useState } from 'react';
import funcUrls from '../../../backend/func2url.json';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API = funcUrls['promo-codes'];

interface PromoCode {
  id: number;
  code: string;
  is_active: boolean;
  max_uses: number | null;
  used_count: number;
  once_per_user: boolean;
  expires_at: string | null;
  created_at: string | null;
}

export default function PromoCodesManager() {
  const { toast } = useToast();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [code, setCode] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [oncePerUser, setOncePerUser] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      setCodes(data.promo_codes || []);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить промокоды', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!code.trim()) {
      toast({ title: 'Введите код', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          max_uses: maxUses ? Number(maxUses) : null,
          once_per_user: oncePerUser,
          expires_at: expiresAt || null,
          is_active: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Создано', description: `Промокод «${code.trim()}» добавлен` });
        setCode('');
        setMaxUses('');
        setExpiresAt('');
        setOncePerUser(true);
        load();
      } else {
        throw new Error(data.error || 'Ошибка создания');
      }
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: e instanceof Error ? e.message : 'Не удалось создать',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (promo: PromoCode) => {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: promo.id,
          code: promo.code,
          max_uses: promo.max_uses,
          once_per_user: promo.once_per_user,
          expires_at: promo.expires_at,
          is_active: !promo.is_active,
        }),
      });
      const data = await res.json();
      if (data.success) {
        load();
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: e instanceof Error ? e.message : 'Не удалось изменить',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return '—';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ru-RU');
  };

  return (
    <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#748c6d]/10 flex items-center justify-center">
            <Icon name="Ticket" size={22} className="text-[#748c6d]" />
          </div>
          <div>
            <CardTitle className="text-[#748c6d]">Промокоды</CardTitle>
            <p className="text-sm text-[#4a5446]/70">Дают бесплатный доступ к подписке</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-sm text-[#4a5446]">Код</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="FREE2026"
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-[#4a5446]">Лимит применений</Label>
            <Input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="без лимита"
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-[#4a5446]">Действует до</Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="flex items-center justify-between gap-2 h-10">
            <Label className="text-sm text-[#4a5446]">Один раз на юзера</Label>
            <Switch checked={oncePerUser} onCheckedChange={setOncePerUser} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleCreate} disabled={isSaving} className="bg-[#748c6d] hover:bg-[#5a7052]">
            {isSaving ? (
              <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
            ) : (
              <Icon name="Plus" size={16} className="mr-2" />
            )}
            Создать промокод
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Icon name="Loader2" size={32} className="animate-spin text-[#748c6d]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Код</TableHead>
                  <TableHead>Применений</TableHead>
                  <TableHead>Один раз/юзер</TableHead>
                  <TableHead>Действует до</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Вкл/выкл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-[#4a5446]/60">
                      Промокодов пока нет
                    </TableCell>
                  </TableRow>
                ) : (
                  codes.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell className="font-mono font-semibold text-[#4a5446]">
                        {promo.code}
                      </TableCell>
                      <TableCell className="text-[#4a5446]/80">
                        {promo.used_count}
                        {promo.max_uses != null ? ` / ${promo.max_uses}` : ' / ∞'}
                      </TableCell>
                      <TableCell className="text-[#4a5446]/80">
                        {promo.once_per_user ? 'Да' : 'Нет'}
                      </TableCell>
                      <TableCell className="text-[#4a5446]/80">
                        {formatDate(promo.expires_at)}
                      </TableCell>
                      <TableCell>
                        {promo.is_active ? (
                          <Badge className="bg-green-500/10 text-green-700">Активен</Badge>
                        ) : (
                          <Badge variant="secondary">Отключён</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={promo.is_active}
                          onCheckedChange={() => toggleActive(promo)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
