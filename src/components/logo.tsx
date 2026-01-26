import { Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({
  className,
  iconClassName,
  textClassName,
}: {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 font-headline', className)}>
      <Scale
        className={cn(
          'h-6 w-6 text-primary dark:text-primary-foreground',
          iconClassName
        )}
      />
      <span
        className={cn(
          'text-xl font-semibold text-primary dark:text-primary-foreground',
          textClassName
        )}
      >
        Athena Justice
      </span>
    </div>
  );
}
