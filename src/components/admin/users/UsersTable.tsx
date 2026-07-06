import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { User } from './types';

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (id: number, userName: string) => void;
  onSaveLimit: (id: number, limit: number) => Promise<void> | void;
}

export default function UsersTable({ users, onEdit, onDelete, onSaveLimit }: UsersTableProps) {
  const [limits, setLimits] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    setLimits((prev) => {
      const next = { ...prev };
      users.forEach((u) => {
        if (next[u.id] === undefined) {
          next[u.id] = String(u.message_limit ?? 2);
        }
      });
      return next;
    });
  }, [users]);

  const handleSave = async (user: User) => {
    const raw = limits[user.id];
    const value = Math.max(0, parseInt(raw, 10) || 0);
    setSavingId(user.id);
    try {
      await onSaveLimit(user.id, value);
    } finally {
      setSavingId(null);
    }
  };
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Никогда';
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAuthBadge = (telegram_username: string | null) => {
    if (telegram_username) {
      return (
        <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
          <Icon name="MessageCircle" size={12} className="mr-1" />
          Telegram
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-gray-300 text-gray-700">
        <Icon name="Mail" size={12} className="mr-1" />
        Email
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const plans: { [key: string]: { label: string; className: string } } = {
      free: { label: 'Бесплатный', className: 'bg-gray-100 text-gray-700' },
      basic: { label: 'Базовый', className: 'bg-blue-100 text-blue-700' },
      premium: { label: 'Премиум', className: 'bg-gradient-to-r from-[#748c6d] to-[#5a7052] text-white' },
      family: { label: 'Семейный', className: 'bg-purple-100 text-purple-700' }
    };
    const planInfo = plans[plan] || plans.free;
    return <Badge className={planInfo.className}>{planInfo.label}</Badge>;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Имя</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Авторизация</TableHead>
            <TableHead>План</TableHead>
            <TableHead>Telegram</TableHead>
            <TableHead>Рассылка</TableHead>
            <TableHead>Лимит сообщений</TableHead>
            <TableHead>Регистрация</TableHead>
            <TableHead>Последний вход</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-[#4a5446]/60">
                Нет пользователей
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium text-[#4a5446]">
                  <div className="flex items-center gap-2">
                    {user.name}
                    {user.is_admin && (
                      <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">
                        <Icon name="Shield" size={12} className="mr-1" />
                        Админ
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-[#4a5446]/80">
                  {user.email}
                </TableCell>
                <TableCell>
                  {getAuthBadge(user.telegram_username)}
                </TableCell>
                <TableCell>
                  {getPlanBadge(user.selected_plan)}
                </TableCell>
                <TableCell className="text-[#4a5446]/80">
                  {user.telegram_username ? `@${user.telegram_username}` : '—'}
                </TableCell>
                <TableCell>
                  {user.receive_notifications !== false ? (
                    <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 gap-1">
                      <Icon name="BellRing" size={12} />
                      Вкл
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-gray-300 text-gray-500 bg-gray-50 gap-1">
                      <Icon name="BellOff" size={12} />
                      Выкл
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      value={limits[user.id] ?? ''}
                      onChange={(e) =>
                        setLimits((prev) => ({ ...prev, [user.id]: e.target.value }))
                      }
                      className="w-16 h-9"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSave(user)}
                      disabled={savingId === user.id}
                      title="Сохранить лимит"
                      className="min-w-[40px] min-h-[40px] text-[#748c6d] hover:text-[#5a7052] hover:bg-[#748c6d]/10"
                    >
                      <Icon name={savingId === user.id ? 'Loader2' : 'Save'} size={16} className={savingId === user.id ? 'animate-spin' : ''} />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-[#4a5446]/80 text-sm">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell className="text-[#4a5446]/80 text-sm">
                  {formatDate(user.last_login)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(user)}
                      className="min-w-[44px] min-h-[44px]"
                    >
                      <Icon name="Pencil" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(user.id, user.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 min-w-[44px] min-h-[44px]"
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}