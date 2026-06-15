import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useChatStore } from '@/stores';
import { getSocket } from '@/services/socket';
import { ChatListItem } from '@/components/ChatListItem';
import { MessageBubble } from '@/components/MessageBubble';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Icons } from '@/lib/icons';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const { user, logout } = useAuthStore();
  const { users, groups, currentChat, messages, typingUsers, loadUsers, loadGroups, setCurrentChat, loadMessages, loadGroupMessages, sendMessage, addMessage, setTyping } = useChatStore();
  const [messageInput, setMessageInput] = useState('');
  const [search, setSearch] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadUsers();
    loadGroups();

    const socket = getSocket();
    socket.on('message:new', (msg: any) => {
      if (currentChat && (msg.sender_id === currentChat.id || msg.receiver_id === currentChat.id || msg.group_id === currentChat.id)) {
        addMessage(msg);
      }
    });
    socket.on('typing:start', (data: { userId: string }) => setTyping(data.userId, true));
    socket.on('typing:stop', (data: { userId: string }) => setTyping(data.userId, false));
    socket.on('message:edited', (data: any) => {
      // handled via reload
    });
    socket.on('message:deleted', (data: any) => {
      // handled via reload
    });

    return () => {
      socket.off('message:new');
      socket.off('typing:start');
      socket.off('typing:stop');
    };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleChatSelect = (chat: any) => {
    setCurrentChat(chat);
    if (chat.type === 'group') {
      loadGroupMessages(chat.id);
    } else {
      loadMessages(chat.id);
    }
  };

  const handleSend = () => {
    if (!messageInput.trim() || !currentChat) return;
    const isGroup = currentChat.type === 'group';
    sendMessage({
      content: messageInput,
      receiverId: isGroup ? undefined : currentChat.id,
      groupId: isGroup ? currentChat.id : undefined,
    });
    setMessageInput('');
    setIsTyping(false);
    const socket = getSocket();
    socket.emit('typing:stop', { receiverId: isGroup ? undefined : currentChat.id, groupId: isGroup ? currentChat.id : undefined });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }
    if (!isTyping && currentChat) {
      setIsTyping(true);
      const socket = getSocket();
      socket.emit('typing:start', { receiverId: currentChat.id });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      if (currentChat) {
        const socket = getSocket();
        socket.emit('typing:stop', { receiverId: currentChat.id });
      }
    }, 2000);
  };

  const filteredUsers = users.filter(u =>
    u.display_name?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={cn('w-full md:w-80 lg:w-96 border-r border-border flex flex-col flex-shrink-0', currentChat && 'hidden md:flex')}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatar_url} fallback={getInitials(user?.display_name || 'U')} />
            <span className="font-semibold">{user?.display_name}</span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')} dangerouslySetInnerHTML={{ __html: Icons.bell }} />
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} dangerouslySetInnerHTML={{ __html: Icons.settings }} />
            <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/login'); }} dangerouslySetInnerHTML={{ __html: Icons.logout }} />
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&>svg]:w-4 [&>svg]:h-4" dangerouslySetInnerHTML={{ __html: Icons.search }} />
            <input placeholder="Search chats..." className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-secondary text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Groups */}
        {groups.length > 0 && (
          <div className="px-4 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase">Groups</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 [&>svg]:w-3.5 [&>svg]:h-3.5" dangerouslySetInnerHTML={{ __html: Icons.plus }} />
            </div>
            {groups.map(group => (
              <ChatListItem key={group.id} name={group.name} avatar={group.avatar_url} isGroup isActive={currentChat?.id === group.id} onClick={() => handleChatSelect({ ...group, type: 'group' })} />
            ))}
          </div>
        )}

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2">
            <span className="text-xs font-medium text-muted-foreground uppercase">Messages</span>
          </div>
          {filteredUsers.map(u => (
            <ChatListItem key={u.id} name={u.display_name} avatar={u.avatar_url} isOnline={u.is_online} isActive={currentChat?.id === u.id} onClick={() => handleChatSelect(u)} />
          ))}
          {filteredUsers.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">No chats found</p>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn('flex-1 flex flex-col', !currentChat && 'hidden md:flex')}>
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
              <Button variant="ghost" size="icon" className="md:hidden [&>svg]:w-5 [&>svg]:h-5" dangerouslySetInnerHTML={{ __html: Icons.arrowLeft }} onClick={() => setCurrentChat(null)} />
              <Avatar src={currentChat.avatar_url} fallback={getInitials(currentChat.display_name || currentChat.name || '?')} isOnline={currentChat.is_online} />
              <div className="flex-1">
                <h3 className="font-semibold">{currentChat.display_name || currentChat.name}</h3>
                {typingUsers.get(currentChat.id) ? (
                  <p className="text-xs text-primary animate-pulse">typing...</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{currentChat.is_online ? 'Online' : currentChat.status || 'Offline'}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" dangerouslySetInnerHTML={{ __html: Icons.phone }} />
                <Button variant="ghost" size="icon" dangerouslySetInnerHTML={{ __html: Icons.video }} />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg: any) => (
                <MessageBubble key={msg.id} message={msg} isSent={msg.sender_id === user?.id} showSender={msg.sender_id !== user?.id} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" dangerouslySetInnerHTML={{ __html: Icons.image }} />
                <Button variant="ghost" size="icon" dangerouslySetInnerHTML={{ __html: Icons.smile }} />
                <Input placeholder="Type a message..." value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={handleKeyDown} className="flex-1" />
                <Button size="icon" onClick={handleSend} disabled={!messageInput.trim()} dangerouslySetInnerHTML={{ __html: Icons.send }} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 [&>svg]:w-10 [&>svg]:h-10 [&>svg]:text-primary" dangerouslySetInnerHTML={{ __html: Icons.chat }} />
              <h2 className="text-2xl font-bold mb-2">Welcome to ChatSphere</h2>
              <p className="text-muted-foreground">Select a conversation or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
