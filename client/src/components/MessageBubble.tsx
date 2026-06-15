import { cn, formatTime } from '@/lib/utils';
import { Icons } from '@/lib/icons';
import { useState } from 'react';

interface MessageBubbleProps {
  message: any;
  isSent: boolean;
  showSender?: boolean;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  onReact?: (id: string, emoji: string) => void;
}

const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export function MessageBubble({ message, isSent, showSender, onEdit, onDelete, onReact }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);

  if (message.is_deleted) {
    return (
      <div className={cn('flex', isSent ? 'justify-end' : 'justify-start')}>
        <div className="max-w-[75%] rounded-2xl px-4 py-2 bg-muted/50 italic text-muted-foreground text-sm">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex group', isSent ? 'justify-end' : 'justify-start')} onMouseEnter={() => setShowActions(true)} onMouseLeave={() => { setShowActions(false); setShowEmojis(false); }}>
      <div className="max-w-[75%] relative">
        {showSender && !isSent && (
          <p className="text-xs font-medium text-primary mb-1 ml-1">{message.sender?.display_name}</p>
        )}
        <div className={cn('rounded-2xl px-4 py-2.5 relative', isSent ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-secondary rounded-bl-md')}>
          {message.type === 'image' && message.attachment_url && (
            <img src={message.attachment_url} alt="" className="rounded-lg max-w-full mb-1 max-h-64 object-cover" />
          )}
          {message.content && <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>}
          <div className={cn('flex items-center gap-1 mt-1', isSent ? 'justify-end' : 'justify-start')}>
            <span className="text-[10px] opacity-60">{formatTime(message.created_at)}</span>
            {isSent && (
              <span className="opacity-60 [&>svg]:w-3 [&>svg]:h-3" dangerouslySetInnerHTML={{ __html: message.is_edited ? Icons.doubleCheck : Icons.check }} />
            )}
            {message.is_edited && <span className="text-[10px] opacity-60">(edited)</span>}
          </div>
        </div>

        {showActions && isSent && (
          <div className="absolute -top-2 right-0 flex gap-1 bg-background border rounded-lg p-1 shadow-lg z-10">
            <button onClick={() => setShowEmojis(!showEmojis)} className="p-1 hover:bg-accent rounded text-xs">😀</button>
            {onEdit && <button onClick={() => onEdit(message.id, message.content)} className="p-1 hover:bg-accent rounded [&>svg]:w-3 [&>svg]:h-3" dangerouslySetInnerHTML={{ __html: Icons.edit }} />}
            {onDelete && <button onClick={() => onDelete(message.id)} className="p-1 hover:bg-accent rounded text-destructive [&>svg]:w-3 [&>svg]:h-3" dangerouslySetInnerHTML={{ __html: Icons.trash }} />}
          </div>
        )}

        {showEmojis && (
          <div className="absolute -top-10 right-0 flex gap-1 bg-background border rounded-full p-1.5 shadow-lg z-20">
            {quickEmojis.map(emoji => (
              <button key={emoji} onClick={() => { onReact?.(message.id, emoji); setShowEmojis(false); }} className="text-sm hover:scale-125 transition-transform">{emoji}</button>
            ))}
          </div>
        )}

        {message.reactions?.length > 0 && (
          <div className={cn('flex gap-1 mt-1', isSent ? 'justify-end' : 'justify-start')}>
            {[...new Set(message.reactions.map((r: any) => r.emoji))].map((emoji: any) => (
              <span key={emoji} className="text-xs bg-secondary rounded-full px-2 py-0.5 cursor-pointer hover:bg-secondary/80">{emoji}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
