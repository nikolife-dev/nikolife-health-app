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

interface HealthParameters {
  goal: string;
  activity_level: string;
  age: string;
  weight: string;
  height: string;
  diet_preference: string;
}

interface UserDetail extends User {
  goal?: string;
  activity_level?: string;
  age?: number;
  weight?: number;
  height?: number;
  diet_preference?: string;
}

export default function AdminUsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    telegram_username: '',
    selected_plan: 'free',
    is_admin: false,
    password: 'temp123',
    health_parameters: {
      goal: '',
      activity_level: '',
      age: '',
      weight: '',
      height: '',
      diet_preference: ''
    }
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

  const handleAddClick = () => {
    setEditForm({
      name: '',
      email: '',
      telegram_username: '',
      selected_plan: 'free',
      is_admin: false,
      password: 'temp123',
      health_parameters: {
        goal: '',
        activity_level: '',
        age: '',
        weight: '',
        height: '',
        diet_preference: ''
      }
    });
    setIsAddDialogOpen(true);
  };

  const handleEditClick = async (user: User) => {
    try {
      const response = await fetch(`${USERS_API}?id=${user.id}`);
      const userDetail: UserDetail = await response.json();
      
      setEditingUser(user);
      setEditForm({
        name: userDetail.name,
        email: userDetail.email,
        telegram_username: userDetail.telegram_username || '',
        selected_plan: userDetail.selected_plan || 'free',
        is_admin: userDetail.is_admin || false,
        password: '',
        health_parameters: {
          goal: userDetail.goal || '',
          activity_level: userDetail.activity_level || '',
          age: userDetail.age ? String(userDetail.age) : '',
          weight: userDetail.weight ? String(userDetail.weight) : '',
          height: userDetail.height ? String(userDetail.height) : '',
          diet_preference: userDetail.diet_preference || ''
        }
      });
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error('Failed to load user details:', error);
    }
  };

  const handleAddUser = async () => {
    try {
      const response = await fetch(USERS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        setIsAddDialogOpen(false);
        loadUsers();
      }
    } catch (error) {
      console.error('Failed to add user:', error);
    }
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
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-lg px-4 py-2">
                Всего: {users.length}
              </Badge>
              <Button
                onClick={handleAddClick}
                className="bg-gradient-to-r from-[#748c6d] to-[#5a7052] hover:from-[#5a7052] hover:to-[#4a5f42] min-h-[44px]"
              >
                <Icon name="Plus" size={16} className="mr-2" />
                Добавить
              </Button>
            </div>
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

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Добавить пользователя</DialogTitle>
            <DialogDescription>
              Создайте нового пользователя системы
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Имя</Label>
              <Input
                id="add-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Введите имя"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Введите email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-password">Пароль (временный)</Label>
              <Input
                id="add-password"
                type="text"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="Введите пароль"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-telegram">Telegram Username</Label>
              <Input
                id="add-telegram"
                value={editForm.telegram_username}
                onChange={(e) => setEditForm({ ...editForm, telegram_username: e.target.value })}
                placeholder="@username (необязательно)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="add-plan">Тарифный план</Label>
              <Select
                value={editForm.selected_plan}
                onValueChange={(value) => setEditForm({ ...editForm, selected_plan: value })}
              >
                <SelectTrigger id="add-plan">
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
                id="add-admin"
                checked={editForm.is_admin}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_admin: checked as boolean })}
              />
              <Label htmlFor="add-admin" className="cursor-pointer">
                Администратор
              </Label>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3">Параметры здоровья (необязательно)</h4>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="add-goal">Цель</Label>
                  <Select
                    value={editForm.health_parameters.goal}
                    onValueChange={(value) => setEditForm({ ...editForm, health_parameters: { ...editForm.health_parameters, goal: value } })}
                  >
                    <SelectTrigger id="add-goal">
                      <SelectValue placeholder="Выберите цель" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lose_weight">Снижение веса</SelectItem>
                      <SelectItem value="gain_muscle">Набор мышечной массы</SelectItem>
                      <SelectItem value="maintain">Поддержание формы</SelectItem>
                      <SelectItem value="improve_health">Улучшение здоровья</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-activity">Уровень активности</Label>
                  <Select
                    value={editForm.health_parameters.activity_level}
                    onValueChange={(value) => setEditForm({ ...editForm, health_parameters: { ...editForm.health_parameters, activity_level: value } })}
                  >
                    <SelectTrigger id="add-activity">
                      <SelectValue placeholder="Выберите уровень" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Малоактивный</SelectItem>
                      <SelectItem value="light">Легкая активность</SelectItem>
                      <SelectItem value="moderate">Умеренная</SelectItem>
                      <SelectItem value="active">Активный</SelectItem>
                      <SelectItem value="very_active">Очень активный</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="add-age">Возраст</Label>
                    <Input
                      id="add-age"
                      type="number"
                      value={editForm.health_parameters.age}
                      onChange={(e) => setEditForm({ ...editForm, health_parameters: { ...editForm.health_parameters, age: e.target.value } })}
                      placeholder="25"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-weight">Вес (кг)</Label>
                    <Input
                      id="add-weight"
                      type="number"
                      value={editForm.health_parameters.weight}
                      onChange={(e) => setEditForm({ ...editForm, health_parameters: { ...editForm.health_parameters, weight: e.target.value } })}
                      placeholder="70"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-height">Рост (см)</Label>
                    <Input
                      id="add-height"
                      type="number"
                      value={editForm.health_parameters.height}
                      onChange={(e) => setEditForm({ ...editForm, health_parameters: { ...editForm.health_parameters, height: e.target.value } })}
                      placeholder="175"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-diet">Питание</Label>
                  <Select
                    value={editForm.health_parameters.diet_preference}
                    onValueChange={(value) => setEditForm({ ...editForm, health_parameters: { ...editForm.health_parameters, diet_preference: value } })}
                  >
                    <SelectTrigger id="add-diet">
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_preference">Без ограничений</SelectItem>
                      <SelectItem value="vegetarian">Вегетарианство</SelectItem>
                      <SelectItem value="vegan">Веганство</SelectItem>
                      <SelectItem value="pescatarian">Пескетарианство</SelectItem>
                      <SelectItem value="keto">Кето-диета</SelectItem>
                      <SelectItem value="paleo">Палео-диета</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={!editForm.name || !editForm.email}
              className="bg-gradient-to-r from-[#748c6d] to-[#5a7052] hover:from-[#5a7052] hover:to-[#4a5f42]"
            >
              <Icon name="Plus" size={16} className="mr-2" />
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
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
              <Label htmlFor="edit-telegram">Telegram Username</Label>
              <Input
                id="edit-telegram"
                value={editForm.telegram_username}
                onChange={(e) => setEditForm({ ...editForm, telegram_username: e.target.value })}
                placeholder="@username (необязательно)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-plan">Тарифный план</Label>
              <Select
                value={editForm.selected_plan}
                onValueChange={(value) => setEditForm({ ...editForm, selected_plan: value })}
              >
                <SelectTrigger id="edit-plan">
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

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3">Параметры здоровья</h4>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-goal">Цель</Label>
                  <Select
                    value={editForm.health_parameters.goal}
                    onValueChange={(value) => setEditForm({ ...editForm, health_parameters: { ...editForm.health_parameters, goal: value } })}
                  >
                    <SelectTrigger id="edit-goal">
                      <SelectValue placeholder="Выберите цель" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lose_weight">Снижение веса</SelectItem>
                      <SelectItem value="gain_muscle">Набор мышечной массы</SelectItem>
                      <SelectItem value="maintain">Поддержание формы</SelectItem>
                      <SelectItem value="improve_health">Улучшение здоровья</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-activity">Уровень активности</Label>
                  <Select
                    value={editForm.health_parameters.activity_level}
                    onValueChange={(value) => setEditForm({ ...editForm, health_parameters: { ...editForm.health_parameters, activity_level: value } })}
                  >
                    <SelectTrigger id="edit-activity">
                      <SelectValue placeholder="Выберите уровень" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Малоактивный</SelectItem>
                      <SelectItem value="light">Легкая активность</SelectItem>
                      <SelectItem value="moderate">Умеренная</SelectItem>
                      <SelectItem value="active">Активный</SelectItem>
                      <SelectItem value="very_active">Очень активный</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-age">Возраст</Label>
                    <Input
                      id="edit-age"
                      type="number"
                      value={editForm.health_parameters.age}
                      onChange={(e) => setEditForm({ ...editForm, health_parameters: { ...editForm.health_parameters, age: e.target.value } })}
                      placeholder="25"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-weight">Вес (кг)</Label>
                    <Input
                      id="edit-weight"
                      type="number"
                      value={editForm.health_parameters.weight}
                      onChange={(e) => setEditForm({ ...editForm, health_parameters: { ...editForm.health_parameters, weight: e.target.value } })}
                      placeholder="70"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-height">Рост (см)</Label>
                    <Input
                      id="edit-height"
                      type="number"
                      value={editForm.health_parameters.height}
                      onChange={(e) => setEditForm({ ...editForm, health_parameters: { ...editForm.health_parameters, height: e.target.value } })}
                      placeholder="175"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-diet">Питание</Label>
                  <Select
                    value={editForm.health_parameters.diet_preference}
                    onValueChange={(value) => setEditForm({ ...editForm, health_parameters: { ...editForm.health_parameters, diet_preference: value } })}
                  >
                    <SelectTrigger id="edit-diet">
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_preference">Без ограничений</SelectItem>
                      <SelectItem value="vegetarian">Вегетарианство</SelectItem>
                      <SelectItem value="vegan">Веганство</SelectItem>
                      <SelectItem value="pescatarian">Пескетарианство</SelectItem>
                      <SelectItem value="keto">Кето-диета</SelectItem>
                      <SelectItem value="paleo">Палео-диета</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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