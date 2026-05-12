import { useState, useEffect } from 'react';
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import AdminLibraryTab from '@/components/admin/AdminLibraryTab';
import AdminWorkoutsTab from '@/components/admin/AdminWorkoutsTab';
import AdminMentalHealthTab from '@/components/admin/AdminMentalHealthTab';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import AdminRecipesTab from '@/components/admin/AdminRecipesTab';
import AdminNotificationsTab from '@/components/admin/AdminNotificationsTab';
import AdminChatsTab from '@/components/admin/AdminChatsTab';
import funcUrls from '../../backend/func2url.json';

interface AdminStats {
  total_users: number;
  active_subscriptions: number;
  monthly_revenue: number;
  new_this_week: number;
  week_change: number | null;
}

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetch(`${funcUrls['admin-users']}?action=stats`)
      .then(r => r.json())
      .then(setAdminStats)
      .catch(() => {});
  }, []);

  const formatRevenue = (val: number) => `₽${val.toLocaleString('ru-RU')}`;
  const formatWeekChange = (val: number | null) =>
    val !== null ? `${val > 0 ? '+' : ''}${val}% от пред. недели` : 'нет данных';

  const stats = [
    {
      title: 'Всего пользователей',
      value: adminStats ? adminStats.total_users.toLocaleString('ru-RU') : '—',
      change: null,
      icon: 'Users',
    },
    {
      title: 'Активные подписки',
      value: adminStats ? adminStats.active_subscriptions.toLocaleString('ru-RU') : '—',
      change: null,
      icon: 'CreditCard',
    },
    {
      title: 'Доход за месяц',
      value: adminStats ? formatRevenue(adminStats.monthly_revenue) : '—',
      change: null,
      icon: 'TrendingUp',
    },
    {
      title: 'Новые за неделю',
      value: adminStats ? adminStats.new_this_week.toLocaleString('ru-RU') : '—',
      change: adminStats ? formatWeekChange(adminStats.week_change) : null,
      icon: 'UserPlus',
    },
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

  const tabs = [
    { value: 'users', label: 'Пользователи', icon: 'Users' },
    { value: 'subscriptions', label: 'Подписки', icon: 'CreditCard' },
    { value: 'analytics', label: 'Аналитика', icon: 'BarChart3' },
    { value: 'library', label: 'Библиотека', icon: 'BookOpen' },
    { value: 'trainings', label: 'Тренировки', icon: 'Dumbbell' },
    { value: 'nutrition', label: 'Питание', icon: 'Apple' },
    { value: 'mental', label: 'Ментальное здоровье', icon: 'Brain' },
    { value: 'notifications', label: 'Уведомления', icon: 'Bell' },
    { value: 'chats', label: 'Чаты', icon: 'MessageSquare' },
  ];

  const TabNavigation = ({ className = '' }: { className?: string }) => (
    <nav className={className}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => {
            setActiveTab(tab.value);
            setIsMobileMenuOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left min-h-[44px] ${
            activeTab === tab.value
              ? 'bg-[#748c6d] text-white'
              : 'text-[#4a5446] hover:bg-white/50'
          }`}
        >
          <Icon name={tab.icon} size={20} />
          <span className="font-medium">{tab.label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5]">
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-white/80 backdrop-blur border-r border-[#748c6d]/20 p-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#748c6d] mb-1">Админ-панель</h2>
            <p className="text-sm text-[#4a5446]/70">Управление контентом</p>
          </div>
          <ScrollArea className="flex-1">
            <TabNavigation />
          </ScrollArea>
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2 mt-4 w-full justify-start min-h-[44px]"
          >
            <Icon name="ArrowLeft" size={20} />
            На главную
          </Button>
        </aside>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-[#748c6d]/20">
          <div className="flex items-center justify-between p-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px]">
                  <Icon name="Menu" size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] bg-white/95 backdrop-blur p-0">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-[#748c6d] mb-1">Админ-панель</h2>
                  <p className="text-sm text-[#4a5446]/70 mb-6">Управление контентом</p>
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <TabNavigation className="space-y-2" />
                  </ScrollArea>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/')}
                    className="gap-2 mt-6 w-full justify-start min-h-[44px]"
                  >
                    <Icon name="ArrowLeft" size={20} />
                    На главную
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-bold text-[#748c6d]">
              {tabs.find(t => t.value === activeTab)?.label || 'Админ-панель'}
            </h1>
            <div className="w-[44px]" />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 mt-[72px] lg:mt-0">
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-[#748c6d] mb-2">
                  Панель администратора
                </h1>
                <p className="text-[#4a5446]">
                  Управление пользователями и подписками
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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
                {stat.change && (
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                    <Icon name="TrendingUp" size={14} />
                    {stat.change}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

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
                <div className="overflow-x-auto">
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
                </div>
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
          <AdminNotificationsTab />
          <AdminChatsTab />
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}