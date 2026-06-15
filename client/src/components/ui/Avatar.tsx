import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-xl',
};

export function Avatar({ src, fallback, size = 'md', isOnline, className }: AvatarProps) {
  return (
    <div className={cn('relative inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 font-semibold text-primary-foreground overflow-hidden', sizes[size], className)}>
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{fallback || '?'}</span>
      )}
      {isOnline !== undefined && (
        <span className={cn('absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-background', isOnline ? 'bg-green-500' : 'bg-muted-foreground')} />
      )}
    </div>
  );
}
