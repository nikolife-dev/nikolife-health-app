import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

const MENTAL_HEALTH_API = 'https://functions.poehali.dev/54ce433a-6275-4e38-a7e6-935c9865f8f6';

interface MentalHealthPodcast {
  id: number;
  title: string;
  description: string;
  duration: string;
  audio_url: string | null;
  popularity_count: number;
  created_at: string;
}

export default function AdminMentalHealthTab() {
  const [podcasts, setPodcasts] = useState<MentalHealthPodcast[]>([]);
  const [isAddPodcastDialogOpen, setIsAddPodcastDialogOpen] = useState(false);
  const [isEditPodcastDialogOpen, setIsEditPodcastDialogOpen] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState<MentalHealthPodcast | null>(null);
  const [newPodcast, setNewPodcast] = useState({
    title: '',
    description: '',
    duration: '',
    audio_base64: ''
  });

  useEffect(() => {
    loadPodcasts();
  }, []);

  const loadPodcasts = async () => {
    try {
      const response = await fetch(MENTAL_HEALTH_API);
      const data = await response.json();
      setPodcasts(data);
    } catch (error) {
      console.error('Failed to load podcasts:', error);
    }
  };

  const handleAddPodcast = async () => {
    try {
      const response = await fetch(MENTAL_HEALTH_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPodcast)
      });
      
      if (response.ok) {
        setIsAddPodcastDialogOpen(false);
        setNewPodcast({ title: '', description: '', duration: '', audio_base64: '' });
        loadPodcasts();
      }
    } catch (error) {
      console.error('Failed to add podcast:', error);
    }
  };

  const handleEditPodcast = (podcast: MentalHealthPodcast) => {
    setEditingPodcast(podcast);
    setNewPodcast({
      title: podcast.title,
      description: podcast.description,
      duration: podcast.duration,
      audio_base64: ''
    });
    setIsEditPodcastDialogOpen(true);
  };

  const handleUpdatePodcast = async () => {
    if (!editingPodcast) return;

    try {
      const response = await fetch(MENTAL_HEALTH_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPodcast.id,
          ...newPodcast
        })
      });

      if (response.ok) {
        setIsEditPodcastDialogOpen(false);
        setEditingPodcast(null);
        setNewPodcast({ title: '', description: '', duration: '', audio_base64: '' });
        loadPodcasts();
      }
    } catch (error) {
      console.error('Failed to update podcast:', error);
    }
  };

  const handleDeletePodcast = async (id: number) => {
    if (!confirm('Удалить подкаст?')) return;

    try {
      const response = await fetch(MENTAL_HEALTH_API, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        loadPodcasts();
      }
    } catch (error) {
      console.error('Failed to delete podcast:', error);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result?.toString().split(',')[1] || '';
        setNewPodcast({ ...newPodcast, audio_base64: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <TabsContent value="mental" className="space-y-4">
      <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[#748c6d]">Ментальное здоровье</CardTitle>
              <CardDescription>Управление аудио-подкастами</CardDescription>
            </div>
            <Dialog open={isAddPodcastDialogOpen} onOpenChange={setIsAddPodcastDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#748c6d] hover:bg-[#5f7459]">
                  <Icon name="Plus" size={18} className="mr-2" />
                  Добавить подкаст
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Добавить подкаст</DialogTitle>
                  <DialogDescription>Заполните информацию о новом подкасте</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="podcast-title">Название</Label>
                    <Input
                      id="podcast-title"
                      placeholder="Утренняя медитация"
                      value={newPodcast.title}
                      onChange={(e) => setNewPodcast({ ...newPodcast, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="podcast-description">Описание</Label>
                    <Textarea
                      id="podcast-description"
                      placeholder="Краткое описание подкаста"
                      value={newPodcast.description}
                      onChange={(e) => setNewPodcast({ ...newPodcast, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="podcast-duration">Длительность (мм:сс)</Label>
                    <Input
                      id="podcast-duration"
                      placeholder="10:30"
                      value={newPodcast.duration}
                      onChange={(e) => setNewPodcast({ ...newPodcast, duration: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="podcast-audio">Аудиофайл</Label>
                    <Input
                      id="podcast-audio"
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioUpload}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddPodcastDialogOpen(false)}>
                      Отмена
                    </Button>
                    <Button
                      className="bg-[#748c6d] hover:bg-[#5f7459]"
                      onClick={handleAddPodcast}
                      disabled={!newPodcast.title || !newPodcast.duration}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="text-right">Длительность</TableHead>
                <TableHead className="text-right">Популярность</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {podcasts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[#4a5446]/60">
                    Нет подкастов
                  </TableCell>
                </TableRow>
              ) : (
                podcasts.map((podcast) => (
                  <TableRow key={podcast.id}>
                    <TableCell className="font-medium text-[#4a5446]">
                      {podcast.title}
                    </TableCell>
                    <TableCell className="max-w-md truncate text-[#4a5446]/80">
                      {podcast.description}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="border-[#748c6d]/30">
                        {podcast.duration}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">
                        <Icon name="Heart" size={14} className="mr-1" />
                        {podcast.popularity_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPodcast(podcast)}
                        >
                          <Icon name="Pencil" size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePodcast(podcast.id)}
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
        </CardContent>
      </Card>

      <Dialog open={isEditPodcastDialogOpen} onOpenChange={setIsEditPodcastDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать подкаст</DialogTitle>
            <DialogDescription>Измените информацию о подкасте</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-podcast-title">Название</Label>
              <Input
                id="edit-podcast-title"
                value={newPodcast.title}
                onChange={(e) => setNewPodcast({ ...newPodcast, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-podcast-description">Описание</Label>
              <Textarea
                id="edit-podcast-description"
                value={newPodcast.description}
                onChange={(e) => setNewPodcast({ ...newPodcast, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-podcast-duration">Длительность (мм:сс)</Label>
              <Input
                id="edit-podcast-duration"
                value={newPodcast.duration}
                onChange={(e) => setNewPodcast({ ...newPodcast, duration: e.target.value })}
              />
            </div>

            {editingPodcast?.audio_url && (
              <div className="p-4 bg-emerald-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="Music" size={20} className="text-emerald-600" />
                    <span className="text-sm text-emerald-700">Аудиофайл загружен</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="edit-podcast-audio">Загрузить новый аудиофайл</Label>
              <Input
                id="edit-podcast-audio"
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditPodcastDialogOpen(false)}>
                Отмена
              </Button>
              <Button
                className="bg-[#748c6d] hover:bg-[#5f7459]"
                onClick={handleUpdatePodcast}
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
