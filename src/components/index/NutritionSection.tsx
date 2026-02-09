import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

interface Recipe {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  time: string;
  cookTime: string;
  difficulty: string;
  ingredients: string[];
  steps: string[];
}

interface NutritionSectionProps {
  recipes: Recipe[];
  selectedRecipe: number | null;
  setSelectedRecipe: (id: number | null) => void;
  mealPlan: {[key: string]: number};
  setMealPlan: (plan: {[key: string]: number}) => void;
}

export default function NutritionSection({
  recipes,
  selectedRecipe,
  setSelectedRecipe,
  mealPlan,
  setMealPlan
}: NutritionSectionProps) {
  const handleGenerateMealPlan = () => {
    const breakfast = recipes.filter(r => r.time === 'Завтрак')[0]?.id || 0;
    const lunch = recipes.filter(r => r.time === 'Обед')[0]?.id || 1;
    const dinner = recipes.filter(r => r.time === 'Ужин')[0]?.id || 2;
    setMealPlan({ breakfast, lunch, dinner });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {selectedRecipe === null ? (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">План питания</h2>
              <p className="text-gray-600">Создайте персональное меню из рецептов</p>
            </div>
            <Button onClick={handleGenerateMealPlan}>
              <Icon name="Sparkles" size={18} className="mr-2" />
              Сгенерировать меню
            </Button>
          </div>

          <Card className="p-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">1850</h3>
                <p className="opacity-90">ккал/день</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">89г</h3>
                <p className="opacity-90">Белков</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">220г</h3>
                <p className="opacity-90">Углеводов</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">65г</h3>
                <p className="opacity-90">Жиров</p>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="plan" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="plan">Моё меню</TabsTrigger>
              <TabsTrigger value="recipes">Все рецепты</TabsTrigger>
            </TabsList>

            <TabsContent value="plan" className="space-y-4">
              {Object.keys(mealPlan).length === 0 ? (
                <Card className="p-12 text-center">
                  <Icon name="UtensilsCrossed" size={64} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Создайте своё меню</h3>
                  <p className="text-gray-600 mb-6">Нажмите "Сгенерировать меню" или выберите рецепты вручную</p>
                  <Button onClick={handleGenerateMealPlan}>
                    <Icon name="Sparkles" size={18} className="mr-2" />
                    Сгенерировать меню
                  </Button>
                </Card>
              ) : (
                <>
                  {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                    const recipeId = mealPlan[mealType];
                    const recipe = recipes.find(r => r.id === recipeId);
                    if (!recipe) return null;
                    
                    return (
                      <Card key={mealType} className="p-6 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Badge variant="secondary" className="mb-3">
                              {recipe.time}
                            </Badge>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{recipe.name}</h3>
                            <div className="flex gap-6 text-sm text-gray-600 mb-4">
                              <span className="flex items-center gap-1">
                                <Icon name="Flame" size={14} />
                                {recipe.calories} ккал
                              </span>
                              <span>Б: {recipe.protein}г</span>
                              <span>Ж: {recipe.fats}г</span>
                              <span>У: {recipe.carbs}г</span>
                              <span className="flex items-center gap-1">
                                <Icon name="Clock" size={14} />
                                {recipe.cookTime}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedRecipe(recipe.id)}
                              >
                                Посмотреть рецепт
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  const newPlan = { ...mealPlan };
                                  delete newPlan[mealType];
                                  setMealPlan(newPlan);
                                }}
                              >
                                <Icon name="X" size={16} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                  
                  <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Итого за день</h4>
                        <p className="text-sm text-gray-600">Сбалансированный план питания</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {Object.values(mealPlan).reduce((sum, id) => {
                            const recipe = recipes.find(r => r.id === id);
                            return sum + (recipe?.calories || 0);
                          }, 0)} ккал
                        </p>
                        <p className="text-sm text-gray-600">
                          Белка: {Object.values(mealPlan).reduce((sum, id) => {
                            const recipe = recipes.find(r => r.id === id);
                            return sum + (recipe?.protein || 0);
                          }, 0)}г
                        </p>
                      </div>
                    </div>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="recipes" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {recipes.map((recipe) => (
                  <Card 
                    key={recipe.id} 
                    className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedRecipe(recipe.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary">{recipe.time}</Badge>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                        {recipe.difficulty}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{recipe.name}</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Icon name="Flame" size={16} className="text-orange-500" />
                        <span>{recipe.calories} ккал</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Icon name="Clock" size={16} className="text-blue-500" />
                        <span>{recipe.cookTime}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm pt-4 border-t">
                      <div>
                        <p className="text-gray-500">Белки</p>
                        <p className="font-semibold text-gray-900">{recipe.protein}г</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Жиры</p>
                        <p className="font-semibold text-gray-900">{recipe.fats}г</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Углеводы</p>
                        <p className="font-semibold text-gray-900">{recipe.carbs}г</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <>
          {(() => {
            const recipe = recipes.find(r => r.id === selectedRecipe);
            if (!recipe) return null;

            return (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" onClick={() => setSelectedRecipe(null)}>
                    <Icon name="ArrowLeft" size={20} className="mr-2" />
                    Назад
                  </Button>
                </div>

                <Card className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="secondary">{recipe.time}</Badge>
                        <Badge className="bg-emerald-100 text-emerald-700">{recipe.difficulty}</Badge>
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">{recipe.name}</h2>
                      <div className="flex gap-6 text-gray-600">
                        <div className="flex items-center gap-2">
                          <Icon name="Clock" size={20} className="text-blue-500" />
                          <span>{recipe.cookTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="Flame" size={20} className="text-orange-500" />
                          <span>{recipe.calories} ккал</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{recipe.protein}г</p>
                        <p className="text-sm text-gray-600">Белки</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{recipe.fats}г</p>
                        <p className="text-sm text-gray-600">Жиры</p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{recipe.carbs}г</p>
                        <p className="text-sm text-gray-600">Углеводы</p>
                      </div>
                    </div>
                  </div>

                  <div className="aspect-video bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center mb-6">
                    <Icon name="Image" size={64} className="text-orange-300" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Ингредиенты</h3>
                      <ul className="space-y-3">
                        {recipe.ingredients.map((ingredient, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <Icon name="CheckCircle2" size={20} className="text-emerald-500 flex-shrink-0" />
                            <span className="text-gray-700">{ingredient}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Приготовление</h3>
                      <ol className="space-y-4">
                        {recipe.steps.map((step, i) => (
                          <li key={i} className="flex gap-4">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                              <span className="font-bold text-emerald-600">{i + 1}</span>
                            </div>
                            <p className="text-gray-700 pt-1">{step}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </Card>

                <div className="flex gap-4">
                  <Button className="flex-1" size="lg">
                    <Icon name="Plus" size={20} className="mr-2" />
                    Добавить в план питания
                  </Button>
                  <Button variant="outline" size="lg">
                    <Icon name="Heart" size={20} />
                  </Button>
                  <Button variant="outline" size="lg">
                    <Icon name="Share2" size={20} />
                  </Button>
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
