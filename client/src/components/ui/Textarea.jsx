import React from 'react';
import { cn } from '@/utils/helpers';

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-primary placeholder:text-brand-muted',
      'focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-1 focus:ring-offset-brand-base',
      'disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export { Textarea };
export default Textarea;
