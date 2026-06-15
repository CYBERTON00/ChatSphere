import { cn, formatDate, truncate, getInitials } from '@/lib/utils';
import { Avatar } from './ui/Avatar';

interface ChatListItemProps {
  name: string;
  avatar?: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
  isOnline?: boolean;
  isGroup?: boolean;
  unreadCount?: number;
  isActive?: boolean;
  onClick?: () => void;
}

export function ChatListItem({ name, avatar, lastMessage, lastMessageTime, isOnline, isGroup, unreadCount = 0, isActive, onClick }: ChatListItemProps) {
  return (
    <button onClick={onClick} className={cn('w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left', isActive && 'bg-accent')}>
      <Avatar src={avatar} fallback={getInitials(name)} isOnline={isOnline} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm truncate">{name}</span>
          {lastMessageTime && <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{formatDate(lastMessageTime)}</span>}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground truncate">{lastMessage ? truncate(lastMessage, 40) : 'Start chatting'}</p>
          {unreadCount > 0 && (
            <span className="ml-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
