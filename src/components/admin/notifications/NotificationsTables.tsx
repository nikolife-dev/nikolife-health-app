import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Notification, getStatusBadge, getChannelBadge } from './notificationsShared';

interface NotificationsTablesProps {
  innerTab: string;
  setInnerTab: (value: string) => void;
  loading: boolean;
  notifications: Notification[];
  history: Notification[];
  openEdit: (notification: Notification) => void;
  handleDelete: (id: number) => void;
  requestConfirm: (action: () => void) => void;
  handleSend: (notification: Notification) => void;
}

export default function NotificationsTables({
  innerTab,
  setInnerTab,
  loading,
  notifications,
  history,
  openEdit,
  handleDelete,
  requestConfirm,
  handleSend,
}: NotificationsTablesProps) {
  return (
    <Tabs value={innerTab} onValueChange={setInnerTab}>
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="all">Все рассылки</TabsTrigger>
        <TabsTrigger value="history">История</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-[#4a5446]/60">
            <Icon name="Loader2" size={32} className="mx-auto mb-4 animate-spin opacity-50" />
            <p>Загрузка...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-[#4a5446]/60">
            <Icon name="Bell" size={48} className="mx-auto mb-4 opacity-50" />
            <p>Рассылок пока нет</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Каналы</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-[#4a5446]">{n.title}</p>
                        <p className="text-xs text-[#4a5446]/60 mt-0.5 line-clamp-1">{n.text}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {n.channels.map(ch => getChannelBadge(ch))}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(n.status)}</TableCell>
                    <TableCell className="text-[#4a5446]/80 text-sm">{n.createdAt}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(n)}
                          className="min-h-[36px] min-w-[36px] p-0"
                          title="Редактировать"
                        >
                          <Icon name="Edit" size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="min-h-[36px] min-w-[36px] p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Удалить"
                          onClick={() => handleDelete(n.id)}
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="min-h-[36px] min-w-[36px] p-0 text-[#748c6d] hover:text-[#5f7a59] hover:bg-[#748c6d]/10"
                          title="Запустить рассылку"
                          onClick={() => requestConfirm(() => handleSend(n))}
                        >
                          <Icon name="Play" size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      <TabsContent value="history" className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-[#4a5446]/60">
            <Icon name="Loader2" size={32} className="mx-auto mb-4 animate-spin opacity-50" />
            <p>Загрузка...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-[#4a5446]/60">
            <Icon name="Clock" size={48} className="mx-auto mb-4 opacity-50" />
            <p>История рассылок пуста</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Каналы</TableHead>
                  <TableHead>Получатели</TableHead>
                  <TableHead>Отправлена</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-[#4a5446]">{n.title}</p>
                        <p className="text-xs text-[#4a5446]/60 mt-0.5 line-clamp-1">{n.text}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {n.channels.map(ch => getChannelBadge(ch))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-[#748c6d]">{n.recipients}</span>
                      <span className="text-[#4a5446]/60 text-sm"> чел.</span>
                    </TableCell>
                    <TableCell className="text-[#4a5446]/80 text-sm">{n.sentAt}</TableCell>
                    <TableCell>{getStatusBadge(n.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
