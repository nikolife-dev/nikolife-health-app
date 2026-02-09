import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Checkbox } from '@/components/ui/checkbox';

const USERS_API = 'https://functions.poehali.dev/56005ce0-e77d-47e1-937e-21f0247bf260';

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  last_login: string | null;
  telegram_username: string | null;
  selected_plan: string;
  is_admin: boolean;
  auth_type: 'email' | 'telegram';
}

export default function AdminUsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    selected_plan: 'free',
    is_admin: false
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch(USERS_API);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      selected_plan: user.selected_plan || 'free',
      is_admin: user.is_admin || false
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`${USERS_API}?id=${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setEditingUser(null);
        loadUsers();
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Удалить пользователя? Это действие нельзя отменить.')) return;

    try {
      const response = await fetch(`${USERS_API}?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadUsers();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
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

  const getAuthBadge = (authType: string) => {
    if (authType === 'telegram') {
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
    <TabsContent value="users" className="space-y-4">
      <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[#748c6d]">Пользователи</CardTitle>
              <CardDescription>Управление пользователями системы</CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              Всего: {users.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Имя</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Авторизация</TableHead>
                <TableHead>План</TableHead>
                <TableHead>Telegram</TableHead>
                <TableHead>Регистрация</TableHead>
                <TableHead>Последний вход</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-[#4a5446]/60">
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
                      {getAuthBadge(user.auth_type)}
                    </TableCell>
                    <TableCell>
                      {getPlanBadge(user.selected_plan)}
                    </TableCell>
                    <TableCell className="text-[#4a5446]/80">
                      {user.telegram_username ? `@${user.telegram_username}` : '—'}
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
                          onClick={() => handleEditClick(user)}
                          className="min-w-[44px] min-h-[44px]"
                        >
                          <Icon name="Pencil" size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
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
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
            <DialogDescription>
              Измените данные пользователя
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Имя</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Имя пользователя"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-plan">Тарифный план</Label>
              <Select
                value={editForm.selected_plan}
                onValueChange={(value) => setEditForm({ ...editForm, selected_plan: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Бесплатный</SelectItem>
                  <SelectItem value="basic">Базовый</SelectItem>
                  <SelectItem value="premium">Премиум</SelectItem>
                  <SelectItem value="family">Семейный</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-admin"
                checked={editForm.is_admin}
                onCheckedChange={(checked) => 
                  setEditForm({ ...editForm, is_admin: checked === true })
                }
              />
              <Label htmlFor="edit-admin" className="cursor-pointer">
                Права администратора
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={!editForm.name.trim() || !editForm.email.trim()}
              className="bg-[#748c6d] hover:bg-[#5f7459]"
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}