import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import funcUrls from '../../../../backend/func2url.json';
import { AvailableChannel, ChatMessage, ChatUser, UserDetail } from './chatsShared';

const API_URL = funcUrls.chats;

export type ConfirmAction = { type: 'clear' | 'delete'; userId: number; userName: string } | null;

export function useChats() {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatList = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      if (!silent) toast.error('Ошибка загрузки чатов');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (userId: number, silent = false) => {
    if (!silent) setMessagesLoading(true);
    try {
      const res = await fetch(`${API_URL}?user_id=${userId}`);
      const data = await res.json();
      const newMessages = data.messages || [];
      setMessages(prev => {
        if (silent && prev.length === newMessages.length) return prev;
        return newMessages;
      });
      if (data.user) {
        setUserDetail(data.user);
        if (!silent) {
          const enabledCh = (data.user.availableChannels || []).find((c: AvailableChannel) => c.enabled);
          if (enabledCh) {
            setSelectedChannel(enabledCh.id);
          } else {
            const anyCh = (data.user.availableChannels || [])[0];
            setSelectedChannel(anyCh?.id || '');
          }
        }
      }
    } catch {
      if (!silent) toast.error('Ошибка загрузки сообщений');
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChatList();
  }, [fetchChatList]);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId);
    }
  }, [selectedUserId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const selectedUserIdRef = useRef(selectedUserId);
  selectedUserIdRef.current = selectedUserId;

  useEffect(() => {
    const interval = setInterval(() => {
      fetchChatList(true);
      if (selectedUserIdRef.current) {
        fetchMessages(selectedUserIdRef.current, true);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchChatList, fetchMessages]);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectUser = (user: ChatUser) => {
    setSelectedUserId(user.id);
    setSelectedUser(user);
    setMessageText('');
    setShowMobileChat(true);
  };

  const handleSendMessage = async () => {
    if (!selectedUserId || !messageText.trim() || !selectedChannel) return;

    const channelInfo = userDetail?.availableChannels.find(c => c.id === selectedChannel);
    if (channelInfo && !channelInfo.enabled) {
      toast.error('Этот канал отключён пользователем');
      return;
    }

    setSending(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUserId,
          text: messageText.trim(),
          channel: selectedChannel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      setMessages(prev => [...prev, data.message]);
      setMessageText('');
      fetchChatList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = async () => {
    if (!confirmAction) return;
    try {
      const res = await fetch(`${API_URL}?user_id=${confirmAction.userId}&action=clear`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Чат очищен');
      setMessages([]);
      fetchChatList();
    } catch {
      toast.error('Ошибка очистки чата');
    } finally {
      setConfirmAction(null);
    }
  };

  const handleDeleteChat = async () => {
    if (!confirmAction) return;
    try {
      const res = await fetch(`${API_URL}?user_id=${confirmAction.userId}&action=delete`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Чат удалён');
      setSelectedUserId(null);
      setSelectedUser(null);
      setUserDetail(null);
      setMessages([]);
      setShowMobileChat(false);
      fetchChatList();
    } catch {
      toast.error('Ошибка удаления чата');
    } finally {
      setConfirmAction(null);
    }
  };

  const availableChannels = userDetail?.availableChannels || [];
  const hasEnabledChannel = availableChannels.some(c => c.enabled);

  return {
    users,
    messages,
    selectedUserId,
    selectedUser,
    userDetail,
    searchQuery,
    setSearchQuery,
    showMobileChat,
    setShowMobileChat,
    loading,
    messagesLoading,
    messageText,
    setMessageText,
    selectedChannel,
    setSelectedChannel,
    sending,
    confirmAction,
    setConfirmAction,
    messagesEndRef,
    filteredUsers,
    availableChannels,
    hasEnabledChannel,
    handleSelectUser,
    handleSendMessage,
    handleKeyDown,
    handleClearChat,
    handleDeleteChat,
  };
}
