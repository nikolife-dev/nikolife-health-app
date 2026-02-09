import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface MentalHealthSectionProps {
  favoritePodcasts: number[];
  setFavoritePodcasts: (podcasts: number[]) => void;
}

export default function MentalHealthSection({ 
  favoritePodcasts, 
  setFavoritePodcasts 
}: MentalHealthSectionProps) {
  const podcasts = [
    {
      id: 1,
      title: 'Утренняя медитация для начинающих',
      description: 'Простая практика для спокойного начала дня',
      duration: '12:30',
      category: 'Медитация'
    },
    {
      id: 2,
      title: 'Дыхательные техники для снятия стресса',
      description: 'Эффективные методы управления тревожностью',
      duration: '8:45',
      category: 'Дыхание'
    },
    {
      id: 3,
      title: 'Глубокое расслабление перед сном',
      description: 'Настройтесь на качественный отдых',
      duration: '18:20',
      category: 'Сон'
    },
    {
      id: 4,
      title: 'Практика осознанности',
      description: 'Присутствуйте в моменте здесь и сейчас',
      duration: '15:00',
      category: 'Медитация'
    },
    {
      id: 5,
      title: 'Управление эмоциями через дыхание',
      description: 'Научитесь контролировать свои реакции',
      duration: '10:15',
      category: 'Дыхание'
    },
    {
      id: 6,
      title: 'Сканирование тела',
      description: 'Освободите напряжение в каждой части тела',
      duration: '20:00',
      category: 'Расслабление'
    },
    {
      id: 7,
      title: 'Благодарность и позитивное мышление',
      description: 'Практика для улучшения настроения',
      duration: '7:30',
      category: 'Позитив'
    },
    {
      id: 8,
      title: 'Преодоление тревожности',
      description: 'Техники борьбы с беспокойством',
      duration: '14:45',
      category: 'Стресс'
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Ментальное Здоровье</h2>
        <p className="text-sm sm:text-base text-gray-600">Аудио-подкасты для медитации и расслабления</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {podcasts.map((podcast) => (
          <Card key={podcast.id} className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                <Icon name="Headphones" className="text-emerald-600" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-2">{podcast.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{podcast.description}</p>
                    <Badge variant="secondary" className="inline-flex items-center gap-1 text-xs">
                      <Icon name="Clock" size={12} />
                      {podcast.duration}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (favoritePodcasts.includes(podcast.id)) {
                        setFavoritePodcasts(favoritePodcasts.filter(id => id !== podcast.id));
                      } else {
                        setFavoritePodcasts([...favoritePodcasts, podcast.id]);
                      }
                    }}
                    className="flex-shrink-0 min-w-[40px] min-h-[40px] p-2"
                  >
                    <Icon
                      name={favoritePodcasts.includes(podcast.id) ? 'Heart' : 'Heart'}
                      size={18}
                      className={favoritePodcasts.includes(podcast.id) ? 'fill-emerald-600 text-emerald-600' : 'text-gray-400'}
                    />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 min-h-[44px] w-full sm:w-auto">
                    <Icon name="Play" size={16} className="mr-1" />
                    <span className="text-sm sm:text-base">Слушать</span>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}