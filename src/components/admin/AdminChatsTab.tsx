import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import ChatList from './chats/ChatList';
import ChatWindow from './chats/ChatWindow';
import { useChats } from './chats/useChats';

export default function AdminChatsTab() {
  const c = useChats();

  return (
    <TabsContent value="chats" className="space-y-4">
      <Card className="bg-white/80 backdrop-blur border-[#748c6d]/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[#748c6d]">Чаты</CardTitle>
              <p className="text-sm text-[#4a5446]/70 mt-1">Переписка с пользователями по всем каналам</p>
            </div>
            <Badge variant="outline" className="border-[#748c6d]/30 gap-1">
              <Icon name="MessageSquare" size={14} />
              {c.users.length} диалогов
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t border-[#748c6d]/10 h-[600px] flex">
            <div className={`w-full lg:w-80 border-r border-[#748c6d]/10 ${c.showMobileChat ? 'hidden lg:block' : 'block'}`}>
              <ChatList
                searchQuery={c.searchQuery}
                setSearchQuery={c.setSearchQuery}
                loading={c.loading}
                filteredUsers={c.filteredUsers}
                users={c.users}
                selectedUserId={c.selectedUserId}
                handleSelectUser={c.handleSelectUser}
              />
            </div>
            <div className={`flex-1 ${c.showMobileChat ? 'block' : 'hidden lg:block'}`}>
              <ChatWindow
                selectedUser={c.selectedUser}
                messages={c.messages}
                messagesLoading={c.messagesLoading}
                messagesEndRef={c.messagesEndRef}
                availableChannels={c.availableChannels}
                hasEnabledChannel={c.hasEnabledChannel}
                selectedChannel={c.selectedChannel}
                setSelectedChannel={c.setSelectedChannel}
                messageText={c.messageText}
                setMessageText={c.setMessageText}
                sending={c.sending}
                handleKeyDown={c.handleKeyDown}
                handleSendMessage={c.handleSendMessage}
                setShowMobileChat={c.setShowMobileChat}
                setConfirmAction={c.setConfirmAction}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!c.confirmAction} onOpenChange={(open) => !open && c.setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {c.confirmAction?.type === 'clear' ? 'Очистить чат?' : 'Удалить чат?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {c.confirmAction?.type === 'clear'
                ? `Все сообщения с ${c.confirmAction?.userName} будут удалены. Это действие нельзя отменить.`
                : `Чат с ${c.confirmAction?.userName} будет полностью удалён. Это действие нельзя отменить.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={c.confirmAction?.type === 'clear' ? c.handleClearChat : c.handleDeleteChat}
              className="bg-red-600 hover:bg-red-700"
            >
              {c.confirmAction?.type === 'clear' ? 'Очистить' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TabsContent>
  );
}
