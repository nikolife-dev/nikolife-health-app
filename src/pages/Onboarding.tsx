import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface OnboardingData {
  goal: string;
  activityLevel: string;
  age: string;
  weight: string;
  height: string;
  dietPreference: string;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    goal: '',
    activityLevel: '',
    age: '',
    weight: '',
    height: '',
    dietPreference: ''
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Сохраняем данные онбординга в базу
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const response = await fetch('https://functions.poehali.dev/85f035ff-be32-471e-ad21-ad58c128096c', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ onboarding_data: data })
          });

          if (response.ok) {
            localStorage.setItem('onboarding_completed', 'true');
            navigate('/pricing');
          }
        }
      } catch (error) {
        console.error('Failed to save onboarding data:', error);
        // Даже если ошибка, переходим дальше
        localStorage.setItem('onboarding_completed', 'true');
        navigate('/pricing');
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canContinue = () => {
    switch (step) {
      case 1:
        return data.goal !== '';
      case 2:
        return data.activityLevel !== '';
      case 3:
        return data.age !== '' && data.weight !== '' && data.height !== '';
      case 4:
        return data.dietPreference !== '';
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-600">Шаг {step} из {totalSteps}</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/pricing')}>
              Пропустить
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#e8e6dc] to-[#d8d5c5] rounded-full flex items-center justify-center mb-4">
                <Icon name="Target" size={40} className="text-[#748c6d]" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Какова ваша главная цель?</h1>
              <p className="text-gray-600">Мы создадим персональный план для достижения вашей цели</p>
            </div>

            <RadioGroup value={data.goal} onValueChange={(value) => setData({ ...data, goal: value })}>
              <div className="space-y-3">
                {[
                  { value: 'lose_weight', label: 'Снижение веса', icon: 'TrendingDown' },
                  { value: 'gain_muscle', label: 'Набор мышечной массы', icon: 'Dumbbell' },
                  { value: 'maintain', label: 'Поддержание формы', icon: 'Heart' },
                  { value: 'improve_health', label: 'Улучшение общего здоровья', icon: 'Activity' }
                ].map((option) => (
                  <Card
                    key={option.value}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      data.goal === option.value ? 'border-[#748c6d] border-2 bg-[#e8e6dc]' : ''
                    }`}
                    onClick={() => setData({ ...data, goal: option.value })}
                  >
                    <div className="flex items-center space-x-4">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Icon name={option.icon as 'TrendingDown' | 'Dumbbell' | 'Heart' | 'Activity'} size={24} className="text-[#748c6d]" />
                      <Label htmlFor={option.value} className="flex-1 cursor-pointer text-base">
                        {option.label}
                      </Label>
                    </div>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#e8e6dc] to-[#d8d5c5] rounded-full flex items-center justify-center mb-4">
                <Icon name="Activity" size={40} className="text-[#748c6d]" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Ваш уровень активности?</h1>
              <p className="text-gray-600">Это поможет рассчитать оптимальную нагрузку</p>
            </div>

            <RadioGroup value={data.activityLevel} onValueChange={(value) => setData({ ...data, activityLevel: value })}>
              <div className="space-y-3">
                {[
                  { value: 'sedentary', label: 'Малоактивный', desc: 'Офисная работа, мало движения' },
                  { value: 'light', label: 'Легкая активность', desc: '1-2 тренировки в неделю' },
                  { value: 'moderate', label: 'Умеренная активность', desc: '3-4 тренировки в неделю' },
                  { value: 'active', label: 'Активный', desc: '5-6 тренировок в неделю' },
                  { value: 'very_active', label: 'Очень активный', desc: 'Ежедневные интенсивные тренировки' }
                ].map((option) => (
                  <Card
                    key={option.value}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      data.activityLevel === option.value ? 'border-[#748c6d] border-2 bg-[#e8e6dc]' : ''
                    }`}
                    onClick={() => setData({ ...data, activityLevel: option.value })}
                  >
                    <div className="flex items-center space-x-4">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <div className="flex-1">
                        <Label htmlFor={option.value} className="cursor-pointer text-base font-semibold block">
                          {option.label}
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">{option.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#e8e6dc] to-[#d8d5c5] rounded-full flex items-center justify-center mb-4">
                <Icon name="User" size={40} className="text-[#748c6d]" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Расскажите о себе</h1>
              <p className="text-gray-600">Эти данные нужны для точного расчета плана</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Возраст (лет)</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={data.age}
                    onChange={(e) => setData({ ...data, age: e.target.value })}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Вес (кг)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={data.weight}
                    onChange={(e) => setData({ ...data, weight: e.target.value })}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Рост (см)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="175"
                    value={data.height}
                    onChange={(e) => setData({ ...data, height: e.target.value })}
                    className="h-12"
                  />
                </div>
              </div>

              <Card className="p-6 bg-[#e8e6dc] border-[#c9c6b5]">
                <div className="flex gap-3">
                  <Icon name="Info" size={20} className="text-[#748c6d] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-900 font-semibold mb-1">Почему мы спрашиваем?</p>
                    <p className="text-sm text-gray-700">
                      Эти данные используются для расчета базового метаболизма и создания персонального плана питания и тренировок. Ваша информация защищена.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#e8e6dc] to-[#d8d5c5] rounded-full flex items-center justify-center mb-4">
                <Icon name="Utensils" size={40} className="text-[#748c6d]" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Предпочтения в питании</h1>
              <p className="text-gray-600">Мы учтем это при составлении плана питания</p>
            </div>

            <RadioGroup value={data.dietPreference} onValueChange={(value) => setData({ ...data, dietPreference: value })}>
              <div className="space-y-3">
                {[
                  { value: 'no_preference', label: 'Без ограничений', desc: 'Ем всё' },
                  { value: 'vegetarian', label: 'Вегетарианство', desc: 'Без мяса и рыбы' },
                  { value: 'vegan', label: 'Веганство', desc: 'Без продуктов животного происхождения' },
                  { value: 'pescatarian', label: 'Пескетарианство', desc: 'Рыба и морепродукты, без мяса' },
                  { value: 'keto', label: 'Кето-диета', desc: 'Низкоуглеводная диета' },
                  { value: 'paleo', label: 'Палео-диета', desc: 'Натуральные необработанные продукты' }
                ].map((option) => (
                  <Card
                    key={option.value}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      data.dietPreference === option.value ? 'border-[#748c6d] border-2 bg-[#e8e6dc]' : ''
                    }`}
                    onClick={() => setData({ ...data, dietPreference: option.value })}
                  >
                    <div className="flex items-center space-x-4">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <div className="flex-1">
                        <Label htmlFor={option.value} className="cursor-pointer text-base font-semibold block">
                          {option.label}
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">{option.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} className="flex-1 h-12">
              <Icon name="ChevronLeft" size={20} className="mr-2" />
              Назад
            </Button>
          )}
          <Button 
            onClick={handleNext} 
            disabled={!canContinue()}
            className="flex-1 h-12 text-lg"
          >
            {step === totalSteps ? 'Завершить' : 'Продолжить'}
            {step < totalSteps && <Icon name="ChevronRight" size={20} className="ml-2" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}