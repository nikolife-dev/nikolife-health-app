import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

interface Article {
  id: number;
  title: string;
  category: 'nutrition' | 'training' | 'health';
  content: string;
  published_date: string;
  view_count: number;
}

interface LibrarySectionProps {
  articles: Article[];
  selectedArticle: Article | null;
  setSelectedArticle: (article: Article | null) => void;
  articleCategory: string;
  setArticleCategory: (category: string) => void;
}

export default function LibrarySection({
  articles,
  selectedArticle,
  setSelectedArticle,
  articleCategory,
  setArticleCategory
}: LibrarySectionProps) {
  return (
    <div className="space-y-6">
      {!selectedArticle ? (
        <>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Библиотека знаний</h2>
            <p className="text-gray-600">Статьи о здоровье, питании и тренировках</p>
          </div>

          <Tabs value={articleCategory} onValueChange={setArticleCategory} className="w-full">
            <TabsList>
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="nutrition">Питание</TabsTrigger>
              <TabsTrigger value="training">Тренировки</TabsTrigger>
              <TabsTrigger value="health">Здоровье</TabsTrigger>
            </TabsList>

            <TabsContent value={articleCategory} className="space-y-4 mt-6">
              {articles.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center text-gray-500">
                    <Icon name="BookOpen" size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Статей пока нет</p>
                  </div>
                </Card>
              ) : (
                articles.map((article) => (
                  <Card 
                    key={article.id} 
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon name="BookOpen" className="text-purple-600" size={24} />
                      </div>
                      <div className="flex-1">
                        <Badge variant="secondary" className="mb-2">
                          {article.category === 'nutrition' && 'Питание'}
                          {article.category === 'training' && 'Тренировки'}
                          {article.category === 'health' && 'Здоровье'}
                        </Badge>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{article.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Icon name="Calendar" size={14} />
                            {new Date(article.published_date).toLocaleDateString('ru-RU')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="Eye" size={14} />
                            {article.view_count} просмотров
                          </span>
                        </div>
                      </div>
                      <Icon name="ChevronRight" className="text-gray-400" size={24} />
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="space-y-6">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedArticle(null)}
            className="mb-4"
          >
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            Назад к списку
          </Button>

          <Card className="p-8">
            <Badge variant="secondary" className="mb-4">
              {selectedArticle.category === 'nutrition' && 'Питание'}
              {selectedArticle.category === 'training' && 'Тренировки'}
              {selectedArticle.category === 'health' && 'Здоровье'}
            </Badge>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {selectedArticle.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-8">
              <span className="flex items-center gap-1">
                <Icon name="Calendar" size={14} />
                {new Date(selectedArticle.published_date).toLocaleDateString('ru-RU')}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Eye" size={14} />
                {selectedArticle.view_count} просмотров
              </span>
            </div>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {selectedArticle.content}
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
