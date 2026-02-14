import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LiveLogs, useLiveLogs } from '@/components/LiveLogs';
import { useToast } from '@/hooks/use-toast';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import UsersTable from './users/UsersTable';
import UserFormDialog from './users/UserFormDialog';
import { USERS_API, User, UserDetail, UserFormData } from './users/types';

export default function AdminUsersTab() {
  const { logs, clearLogs, logInfo, logSuccess, logError, logWarning } = useLiveLogs();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<UserFormData>({
    name: '',
    email: '',
    telegram_username: '',
    selected_plan: 'free',
    is_admin: false,
    receive_notifications: true,
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
    logInfo('Загрузка списка пользователей...');
    try {
      const response = await fetch(USERS_API);
      logInfo(`Ответ GET ${USERS_API}: status=${response.status}`);
      const data = await response.json();
      logSuccess(`Загружено ${data.length} пользователей`);
      setUsers(data);
    } catch (error) {
      logError(`Ошибка загрузки: ${error instanceof Error ? error.message : 'unknown'}`);
      console.error('Failed to load users:', error);
    }
  };

  const handleAddClick = () => {
    logInfo('Открытие диалога добавления пользователя');
    setEditForm({
      name: '',
      email: '',
      telegram_username: '',
      selected_plan: 'free',
      is_admin: false,
      receive_notifications: true,
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
    logInfo(`Открытие редактирования: user_id=${user.id}, name="${user.name}"`);
    try {
      logInfo(`GET ${USERS_API}?id=${user.id}`);
      const response = await fetch(`${USERS_API}?id=${user.id}`);
      logInfo(`Ответ: status=${response.status}`);
      const userDetail: UserDetail = await response.json();
      logSuccess('Детальные данные пользователя загружены');
      
      setEditingUser(user);
      setEditForm({
        name: userDetail.name,
        email: userDetail.email,
        telegram_username: userDetail.telegram_username || '',
        selected_plan: userDetail.selected_plan || 'free',
        is_admin: userDetail.is_admin || false,
        receive_notifications: userDetail.receive_notifications !== false,
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
      logError(`Ошибка загрузки деталей: ${error instanceof Error ? error.message : 'unknown'}`);
      console.error('Failed to load user details:', error);
    }
  };

  const handleAddUser = async () => {
    logInfo('Создание нового пользователя...');
    logInfo(`Данные: email="${editForm.email}", name="${editForm.name}", plan=${editForm.selected_plan}`);
    try {
      const response = await fetch(USERS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      logInfo(`Ответ POST: status=${response.status}`);
      const data = await response.json();

      if (response.ok) {
        logSuccess(`Пользователь создан: id=${data.user?.id}`);
        toast({ title: 'Успешно', description: 'Пользователь добавлен' });
        setIsAddDialogOpen(false);
        loadUsers();
      } else {
        const errorMsg = data.code ? `[${data.code}] ${data.error}` : data.error || 'Не удалось создать пользователя';
        logError(`Ошибка создания: ${errorMsg}`);
        toast({ title: 'Ошибка', description: errorMsg, variant: 'destructive' });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'unknown';
      logError(`Критическая ошибка: ${errorMsg}`);
      console.error('Failed to add user:', error);
      toast({ title: 'Ошибка', description: `Критическая ошибка: ${errorMsg}`, variant: 'destructive' });
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    logInfo(`Обновление пользователя: user_id=${editingUser.id}`);
    logInfo(`Новые данные: name="${editForm.name}", email="${editForm.email}"`);
    try {
      const response = await fetch(`${USERS_API}?id=${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      logInfo(`Ответ PUT: status=${response.status}`);
      const data = await response.json();

      if (response.ok) {
        logSuccess('Пользователь успешно обновлён');
        toast({ title: 'Успешно', description: 'Данные обновлены' });
        setIsEditDialogOpen(false);
        setEditingUser(null);
        loadUsers();
      } else {
        const errorMsg = data.code ? `[${data.code}] ${data.error}` : data.error || 'Не удалось обновить';
        logError(`Ошибка обновления: ${errorMsg}`);
        toast({ title: 'Ошибка', description: errorMsg, variant: 'destructive' });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'unknown';
      logError(`Критическая ошибка: ${errorMsg}`);
      console.error('Failed to update user:', error);
      toast({ title: 'Ошибка', description: `Критическая ошибка: ${errorMsg}`, variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (id: number, userName: string) => {
    logWarning(`Попытка удаления: user_id=${id}, name="${userName}"`);
    if (!confirm(`Удалить пользователя "${userName}"? Это действие нельзя отменить.`)) {
      logInfo('Удаление отменено пользователем');
      return;
    }

    logInfo(`DELETE ${USERS_API}?id=${id}`);
    try {
      const response = await fetch(`${USERS_API}?id=${id}`, {
        method: 'DELETE'
      });
      logInfo(`Ответ DELETE: status=${response.status}`);
      const data = await response.json();
      logInfo(`Данные ответа: ${JSON.stringify(data)}`);

      if (response.ok) {
        logSuccess(`Пользователь id=${id} успешно удалён`);
        toast({ title: 'Успешно', description: 'Пользователь удалён' });
        loadUsers();
      } else {
        const errorMsg = data.code ? `[${data.code}] ${data.error}` : data.error || 'Не удалось удалить';
        logError(`Ошибка удаления: ${errorMsg}`);
        toast({ title: 'Ошибка', description: errorMsg, variant: 'destructive' });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'unknown';
      logError(`Критическая ошибка удаления: ${errorMsg}`);
      console.error('Failed to delete user:', error);
      toast({ title: 'Ошибка', description: `Критическая ошибка: ${errorMsg}`, variant: 'destructive' });
    }
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
          <UsersTable 
            users={users} 
            onEdit={handleEditClick} 
            onDelete={handleDeleteUser} 
          />
        </CardContent>
      </Card>

      <UserFormDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleAddUser}
        formData={editForm}
        onFormChange={setEditForm}
        mode="add"
      />

      <UserFormDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleUpdateUser}
        formData={editForm}
        onFormChange={setEditForm}
        mode="edit"
      />

      <LiveLogs logs={logs} onClear={clearLogs} position="bottom-right" />
    </TabsContent>
  );
}