import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
import ChatList from '@/components/admin/chats/ChatList';
import ChatWindow from '@/components/admin/chats/ChatWindow';
import { useChats } from '@/components/admin/chats/useChats';

export default function Messenger() {
  const navigate = useNavigate();
  const c = useChats();

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#d8d5c5] via-[#e8e6dc] to-[#c9c6b5]">
      <header className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur border-b border-[#748c6d]/20 shrink-0">
        <div className="flex items-center gap-2">
          <Icon name="MessageSquare" size={22} className="text-[#748c6d]" />
          <h1 className="text-lg font-bold text-[#748c6d]">Мессенджер</h1>
          <span className="text-sm text-[#4a5446]/60 ml-1">{c.users.length} диалогов</span>
        </div>
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="gap-2 min-h-[44px]"
        >
          <Icon name="LayoutDashboard" size={18} />
          <span className="hidden sm:inline">Админ-панель</span>
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className={`w-full lg:w-80 border-r border-[#748c6d]/10 bg-white/40 ${c.showMobileChat ? 'hidden lg:block' : 'block'}`}>
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
    </div>
  );
}
