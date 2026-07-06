import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';

interface IndexSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export default function IndexSidebar({ activeSection, setActiveSection }: IndexSidebarProps) {
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-6 h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-emerald-600">Nikolife</h1>
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
          className="w-full justify-start min-h-[44px]"
          onClick={() => setActiveSection('mental')}
        >
          <Icon name="Brain" className="mr-3" size={20} />
          <span>Ментальное Здоровье</span>
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
          className="w-full justify-start min-h-[44px]"
          onClick={() => setActiveSection('support')}
        >
          <Icon name="MessageCircle" className="mr-3" size={20} />
          <span>Помощник по Здоровью</span>
        </Button>
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