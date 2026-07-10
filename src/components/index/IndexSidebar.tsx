import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import funcUrls from '../../../backend/func2url.json';

interface IndexSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export default function IndexSidebar({ activeSection, setActiveSection }: IndexSidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user?.is_admin) return;
    const load = async () => {
      try {
        const res = await fetch(`${funcUrls.chats}?action=unread_total`);
        const data = await res.json();
        setUnread(data.unread || 0);
      } catch {
        // ignore
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [user?.is_admin]);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-6 h-full">
      <div className="mb-8">
        <img src="/logo-emerald.png" alt="Nikolife" className="h-12 w-auto" />
      </div>

      <nav className="flex-1 space-y-2">
        <Button
          variant={activeSection === 'dashboard' ? 'default' : 'ghost'}
          className="w-full justify-start min-h-[44px]"
          onClick={() => setActiveSection('dashboard')}
        >
          <Icon name="Home" className="mr-3" size={20} />
          <span>Главная</span>
        </Button>

        <Button
          variant={activeSection === 'library' ? 'default' : 'ghost'}
          className="w-full justify-start min-h-[44px]"
          onClick={() => setActiveSection('library')}
        >
          <Icon name="BookOpen" className="mr-3" size={20} />
          <span>Библиотека</span>
        </Button>

        <Button
          variant={activeSection === 'workouts' ? 'default' : 'ghost'}
          className="w-full justify-start min-h-[44px]"
          onClick={() => setActiveSection('workouts')}
        >
          <Icon name="Dumbbell" className="mr-3" size={20} />
          <span>Тренировки</span>
        </Button>

        <Button
          variant={activeSection === 'nutrition' ? 'default' : 'ghost'}
          className="w-full justify-start min-h-[44px]"
          onClick={() => setActiveSection('nutrition')}
        >
          <Icon name="Apple" className="mr-3" size={20} />
          <span>Питание</span>
        </Button>

        <Button
          variant={activeSection === 'mental' ? 'default' : 'ghost'}
          className="w-full justify-start min-h-[44px] h-auto py-2 whitespace-normal text-left"
          onClick={() => setActiveSection('mental')}
        >
          <Icon name="Brain" className="mr-3 shrink-0" size={20} />
          <span className="leading-tight">Ментальное Здоровье</span>
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start min-h-[44px]"
          onClick={() => navigate('/habits')}
        >
          <Icon name="CheckCircle2" className="mr-3" size={20} />
          <span>Привычки</span>
        </Button>

        <Button
          variant={activeSection === 'support' ? 'default' : 'ghost'}
          className="w-full justify-start min-h-[44px] h-auto py-2 whitespace-normal text-left"
          onClick={() => setActiveSection('support')}
        >
          <Icon name="MessageCircle" className="mr-3 shrink-0" size={20} />
          <span className="leading-tight">Помощник по Здоровью</span>
        </Button>

        {user?.is_admin && (
          <Button
            variant="ghost"
            className="w-full justify-start min-h-[44px] text-emerald-700"
            onClick={() => navigate('/messenger')}
          >
            <Icon name="MessageSquare" className="mr-3" size={20} />
            <span>Мессенджер</span>
            {unread > 0 && (
              <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
                {unread}
              </span>
            )}
          </Button>
        )}
      </nav>

      <div className="pt-4 border-t border-gray-200">
        <Button 
          variant="ghost" 
          className="w-full justify-start min-h-[44px]"
          onClick={() => navigate('/profile')}
        >
          <Avatar className="h-8 w-8 mr-3">
            <AvatarImage src="" />
            <AvatarFallback>АН</AvatarFallback>
          </Avatar>
          <span>Профиль</span>
        </Button>
      </div>
    </aside>
  );
}