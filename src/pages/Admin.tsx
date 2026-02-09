import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import AdminLibraryTab from '@/components/admin/AdminLibraryTab';
import AdminWorkoutsTab from '@/components/admin/AdminWorkoutsTab';
import AdminMentalHealthTab from '@/components/admin/AdminMentalHealthTab';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import AdminRecipesTab from '@/components/admin/AdminRecipesTab';

export default function Admin() {
  const navigate = useNavigate();

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
      change: '+12%',
      icon: 'Users',
      trend: 'up'
    },
    {
      title: 'Активные подписки',
      value: '892',
      change: '+8%',
      icon: 'CreditCard',
      trend: 'up'
    },
    {
      title: 'Доход за месяц',
      value: '₽127,420',
      change: '+23%',
      icon: 'TrendingUp',
      trend: 'up'
    },
    {
      title: 'Новые за неделю',
      value: '47',
      change: '+5%',
      icon: 'UserPlus',
      trend: 'up'
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
    },
    {
      id: 5,
      user: 'Сергей Козлов',
      plan: 'Стандарт',
      amount: '₽690',
      status: 'active',
      nextBilling: '11.03.2026',
      startDate: '11.01.2026'
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
          <TabsList className="bg-white/80 backdrop-blur flex-wrap h-auto">
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
            <TabsTrigger value="mental" className="gap-2">
              <Icon name="Brain" size={18} />
              Ментальное здоровье
            </TabsTrigger>
          </TabsList>

          <AdminUsersTab />

          <TabsContent value="subscriptions" className="space-y-4">
            <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[#748c6d]">Подписки</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>План</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Начало</TableHead>
                      <TableHead className="text-right">Следующий платеж</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium text-[#4a5446]">
                          {sub.user}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-[#748c6d]/30">
                            {sub.plan}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-[#748c6d]">
                          {sub.amount}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(sub.status)}
                        </TableCell>
                        <TableCell className="text-[#4a5446]/80">
                          {sub.startDate}
                        </TableCell>
                        <TableCell className="text-right text-[#4a5446]/80">
                          {sub.nextBilling}
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
              </CardHeader>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-[#4a5446]/60">
                  <Icon name="BarChart3" size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Раздел аналитики будет настроен позже</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <AdminLibraryTab />
          <AdminWorkoutsTab />
          <AdminRecipesTab />

          <AdminMentalHealthTab />
        </Tabs>
      </div>
    </div>
  );
}