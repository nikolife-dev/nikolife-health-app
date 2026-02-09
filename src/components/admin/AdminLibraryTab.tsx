import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

const ARTICLES_API = 'https://functions.poehali.dev/cea33162-065b-4e11-8767-9b4ffd23fa04';

interface Article {
  id: number;
  title: string;
  category: 'nutrition' | 'training' | 'health';
  content: string;
  published_date: string;
  view_count: number;
  created_at: string;
}

export default function AdminLibraryTab() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [newArticle, setNewArticle] = useState({
    title: '',
    category: 'nutrition' as 'nutrition' | 'training' | 'health',
    content: '',
    published_date: new Date().toISOString().split('T')[0]
  });
  const [editForm, setEditForm] = useState({
    title: '',
    category: 'nutrition' as 'nutrition' | 'training' | 'health',
    content: '',
    published_date: ''
  });

  useEffect(() => {
    loadArticles();
  }, [selectedCategory]);

  const loadArticles = async () => {
    try {
      const url = selectedCategory === 'all' 
        ? ARTICLES_API 
        : `${ARTICLES_API}?category=${selectedCategory}`;
      const response = await fetch(url);
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Failed to load articles:', error);
    }
  };

  const handleAddArticle = async () => {
    try {
      const response = await fetch(ARTICLES_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArticle)
      });
      
      if (response.ok) {
        setIsAddDialogOpen(false);
        setNewArticle({
          title: '',
          category: 'nutrition',
          content: '',
          published_date: new Date().toISOString().split('T')[0]
        });
        loadArticles();
      }
    } catch (error) {
      console.error('Failed to add article:', error);
    }
  };

  const handleEditClick = (article: Article) => {
    setEditingArticle(article);
    setEditForm({
      title: article.title,
      category: article.category,
      content: article.content,
      published_date: article.published_date
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateArticle = async () => {
    if (!editingArticle) return;
    
    try {
      const response = await fetch(`${ARTICLES_API}?id=${editingArticle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (response.ok) {
        setIsEditDialogOpen(false);
        setEditingArticle(null);
        loadArticles();
      }
    } catch (error) {
      console.error('Failed to update article:', error);
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!confirm('Удалить статью?')) return;
    
    try {
      const response = await fetch(`${ARTICLES_API}?id=${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadArticles();
      }
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  };

  const filteredArticles = selectedCategory === 'all' 
    ? articles 
    : articles.filter(article => article.category === selectedCategory);

  return (
    <TabsContent value="library" className="space-y-4">
      <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[#748c6d]">Библиотека статей</CardTitle>
              <CardDescription>Управление статьями о здоровье и фитнесе</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#748c6d] hover:bg-[#5f7459]">
                  <Icon name="Plus" size={18} className="mr-2" />
                  Добавить статью
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle>Добавить новую статью</DialogTitle>
                  <DialogDescription>
                    Заполните информацию о новой статье
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Название</Label>
                    <Input
                      id="title"
                      placeholder="Название статьи"
                      value={newArticle.title}
                      onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Категория</Label>
                    <Select
                      value={newArticle.category}
                      onValueChange={(value) => setNewArticle({ ...newArticle, category: value as 'nutrition' | 'training' | 'health' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nutrition">Питание</SelectItem>
                        <SelectItem value="training">Тренировки</SelectItem>
                        <SelectItem value="health">Здоровье</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="content">Содержание</Label>
                    <Textarea
                      id="content"
                      placeholder="Текст статьи"
                      value={newArticle.content}
                      onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                      rows={8}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="published_date">Дата публикации</Label>
                    <Input
                      id="published_date"
                      type="date"
                      value={newArticle.published_date}
                      onChange={(e) => setNewArticle({ ...newArticle, published_date: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Отмена
                    </Button>
                    <Button 
                      className="bg-[#748c6d] hover:bg-[#5f7459]"
                      onClick={handleAddArticle}
                      disabled={!newArticle.title || !newArticle.content}
                    >
                      Добавить
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                <SelectItem value="nutrition">Питание</SelectItem>
                <SelectItem value="training">Тренировки</SelectItem>
                <SelectItem value="health">Здоровье</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Дата публикации</TableHead>
                <TableHead className="text-right">Просмотры</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArticles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[#4a5446]/60">
                    Нет статей
                  </TableCell>
                </TableRow>
              ) : (
                filteredArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium text-[#4a5446]">
                      {article.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-[#748c6d]/30">
                        {article.category === 'nutrition' && 'Питание'}
                        {article.category === 'training' && 'Тренировки'}
                        {article.category === 'health' && 'Здоровье'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#4a5446]/80">
                      {new Date(article.published_date).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{article.view_count}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(article)}
                          className="min-w-[44px] min-h-[44px]"
                        >
                          <Icon name="Pencil" size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteArticle(article.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 min-w-[44px] min-h-[44px]"
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Редактировать статью</DialogTitle>
            <DialogDescription>
              Внесите изменения в статью
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Название</Label>
              <Input
                id="edit-title"
                placeholder="Название статьи"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-category">Категория</Label>
              <Select
                value={editForm.category}
                onValueChange={(value) => setEditForm({ ...editForm, category: value as 'nutrition' | 'training' | 'health' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nutrition">Питание</SelectItem>
                  <SelectItem value="training">Тренировки</SelectItem>
                  <SelectItem value="health">Здоровье</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-content">Содержание</Label>
              <Textarea
                id="edit-content"
                placeholder="Текст статьи"
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows={8}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-published_date">Дата публикации</Label>
              <Input
                id="edit-published_date"
                type="date"
                value={editForm.published_date}
                onChange={(e) => setEditForm({ ...editForm, published_date: e.target.value })}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Отмена
              </Button>
              <Button 
                className="bg-[#748c6d] hover:bg-[#5f7459]"
                onClick={handleUpdateArticle}
                disabled={!editForm.title || !editForm.content}
              >
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}