import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

export default function Admin() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const stats: Array<{
    title: string;
    value: string;
    change: string;
    icon: string;
    trend: string;
  }> = [
    {
      title: 'Всего пользователей',
      value: '1,284',
      change: '+12.5%',
      icon: 'Users',
      trend: 'up'
    },
    {
      title: 'Активных подписок',
      value: '847',
      change: '+8.2%',
      icon: 'CreditCard',
      trend: 'up'
    },
    {
      title: 'Доход (месяц)',
      value: '₽838,530',
      change: '+15.3%',
      icon: 'TrendingUp',
      trend: 'up'
    },
    {
      title: 'Новые за 7 дней',
      value: '156',
      change: '+23.1%',
      icon: 'UserPlus',
      trend: 'up'
    }
  ];

  const recentUsers = [
    {
      id: 1,
      name: 'Алексей Иванов',
      email: 'alexey@example.com',
      plan: 'Премиум',
      status: 'active',
      joinedDate: '15.02.2026',
      lastActive: '2 часа назад'
    },
    {
      id: 2,
      name: 'Мария Петрова',
      email: 'maria@example.com',
      plan: 'Стандарт',
      status: 'active',
      joinedDate: '14.02.2026',
      lastActive: '5 часов назад'
    },
    {
      id: 3,
      name: 'Дмитрий Сидоров',
      email: 'dmitry@example.com',
      plan: 'Премиум',
      status: 'active',
      joinedDate: '13.02.2026',
      lastActive: '1 день назад'
    },
    {
      id: 4,
      name: 'Елена Васильева',
      email: 'elena@example.com',
      plan: 'Базовый',
      status: 'inactive',
      joinedDate: '12.02.2026',
      lastActive: '3 дня назад'
    },
    {
      id: 5,
      name: 'Сергей Козлов',
      email: 'sergey@example.com',
      plan: 'Стандарт',
      status: 'active',
      joinedDate: '11.02.2026',
      lastActive: '6 часов назад'
    }
  ];

  const subscriptions = [
    {
      id: 1,
      user: 'Алексей Иванов',
      plan: 'Премиум',
      amount: '₽990',
      status: 'active',
      nextBilling: '15.03.2026',
      startDate: '15.01.2026'
    },
    {
      id: 2,
      user: 'Мария Петрова',
      plan: 'Стандарт',
      amount: '₽690',
      status: 'active',
      nextBilling: '14.03.2026',
      startDate: '14.01.2026'
    },
    {
      id: 3,
      user: 'Дмитрий Сидоров',
      plan: 'Премиум',
      amount: '₽990',
      status: 'active',
      nextBilling: '13.03.2026',
      startDate: '13.01.2026'
    },
    {
      id: 4,
      user: 'Елена Васильева',
      plan: 'Базовый',
      amount: '₽390',
      status: 'cancelled',
      nextBilling: '-',
      startDate: '12.01.2026'
    }
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20">Активен</Badge>;
    }
    if (status === 'cancelled') {
      return <Badge variant="secondary">Отменена</Badge>;
    }
    return <Badge variant="secondary">Неактивен</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5]">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#748c6d] mb-2">
              Панель администратора
            </h1>
            <p className="text-[#4a5446]">
              Управление пользователями и подписками
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <Icon name="ArrowLeft" size={20} />
            На главную
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-white/80 backdrop-blur border-[#748c6d]/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#4a5446]">
                  {stat.title}
                </CardTitle>
                <Icon name={stat.icon} size={20} className="text-[#748c6d]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#748c6d]">{stat.value}</div>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                  <Icon name="TrendingUp" size={14} />
                  {stat.change} от прошлого месяца
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur">
            <TabsTrigger value="users" className="gap-2">
              <Icon name="Users" size={18} />
              Пользователи
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <Icon name="CreditCard" size={18} />
              Подписки
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Icon name="BarChart3" size={18} />
              Аналитика
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-2">
              <Icon name="BookOpen" size={18} />
              Библиотека
            </TabsTrigger>
            <TabsTrigger value="trainings" className="gap-2">
              <Icon name="Dumbbell" size={18} />
              Тренировки
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="gap-2">
              <Icon name="Apple" size={18} />
              Питание
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[#748c6d]">Пользователи</CardTitle>
                    <CardDescription>
                      Управление учетными записями пользователей
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Поиск..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                    <Button className="bg-[#748c6d] hover:bg-[#5f7459]">
                      <Icon name="UserPlus" size={18} className="mr-2" />
                      Добавить
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>План</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата регистрации</TableHead>
                      <TableHead>Последняя активность</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-[#748c6d]">{user.name}</div>
                            <div className="text-sm text-[#4a5446]/60">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-[#748c6d]/20">
                            {user.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell className="text-[#4a5446]/80">{user.joinedDate}</TableCell>
                        <TableCell className="text-[#4a5446]/80">{user.lastActive}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Icon name="MoreHorizontal" size={18} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
              <CardHeader>
                <CardTitle className="text-[#748c6d]">Подписки</CardTitle>
                <CardDescription>
                  Активные и отмененные подписки
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>План</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Следующий платеж</TableHead>
                      <TableHead>Дата начала</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium text-[#748c6d]">
                          {sub.user}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-[#748c6d]/20">
                            {sub.plan}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-[#748c6d]">
                          {sub.amount}
                        </TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell className="text-[#4a5446]/80">{sub.nextBilling}</TableCell>
                        <TableCell className="text-[#4a5446]/80">{sub.startDate}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Icon name="MoreHorizontal" size={18} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
              <CardHeader>
                <CardTitle className="text-[#748c6d]">Аналитика</CardTitle>
                <CardDescription>
                  Графики и статистика (в разработке)
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-[#4a5446]/60">
                  <Icon name="BarChart3" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Раздел аналитики будет добавлен позже</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
              <CardHeader>
                <CardTitle className="text-[#748c6d]">Библиотека</CardTitle>
                <CardDescription>
                  Управление контентом библиотеки
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-[#4a5446]/60">
                  <Icon name="BookOpen" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Раздел библиотеки будет настроен позже</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trainings" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
              <CardHeader>
                <CardTitle className="text-[#748c6d]">Тренировки</CardTitle>
                <CardDescription>
                  Управление программами тренировок
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-[#4a5446]/60">
                  <Icon name="Dumbbell" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Раздел тренировок будет настроен позже</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nutrition" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
              <CardHeader>
                <CardTitle className="text-[#748c6d]">Питание</CardTitle>
                <CardDescription>
                  Управление рецептами и планами питания
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-[#4a5446]/60">
                  <Icon name="Apple" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Раздел питания будет настроен позже</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}