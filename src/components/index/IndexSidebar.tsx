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
    <aside className="w-20 lg:w-64 bg-white border-r border-gray-200 flex flex-col items-center lg:items-stretch p-4 space-y-2">
      <div className="mb-8 text-center lg:text-left">
        <h1 className="text-2xl font-bold text-emerald-600 hidden lg:block">Nikolife</h1>
        <span className="text-2xl lg:hidden">🌿</span>
      </div>

      <nav className="flex-1 space-y-2">
        <Button
          variant={activeSection === 'dashboard' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => setActiveSection('dashboard')}
        >
          <Icon name="Home" className="lg:mr-2" size={20} />
          <span className="hidden lg:inline">Главная</span>
        </Button>

        <Button
          variant={activeSection === 'library' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => setActiveSection('library')}
        >
          <Icon name="BookOpen" className="lg:mr-2" size={20} />
          <span className="hidden lg:inline">Библиотека</span>
        </Button>

        <Button
          variant={activeSection === 'workouts' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => setActiveSection('workouts')}
        >
          <Icon name="Dumbbell" className="lg:mr-2" size={20} />
          <span className="hidden lg:inline">Тренировки</span>
        </Button>

        <Button
          variant={activeSection === 'nutrition' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => setActiveSection('nutrition')}
        >
          <Icon name="Apple" className="lg:mr-2" size={20} />
          <span className="hidden lg:inline">Питание</span>
        </Button>

        <Button
          variant={activeSection === 'community' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => setActiveSection('community')}
        >
          <Icon name="Users" className="lg:mr-2" size={20} />
          <span className="hidden lg:inline">Сообщество</span>
        </Button>

        <Button
          variant={activeSection === 'progress' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => setActiveSection('progress')}
        >
          <Icon name="TrendingUp" className="lg:mr-2" size={20} />
          <span className="hidden lg:inline">Прогресс</span>
        </Button>
      </nav>

      <div className="pt-4 border-t border-gray-200">
        <Button 
          variant="ghost" 
          className="w-full justify-start"
          onClick={() => navigate('/profile')}
        >
          <Avatar className="h-8 w-8 lg:mr-2">
            <AvatarImage src="" />
            <AvatarFallback>АН</AvatarFallback>
          </Avatar>
          <span className="hidden lg:inline">Профиль</span>
        </Button>
      </div>
    </aside>
  );
}