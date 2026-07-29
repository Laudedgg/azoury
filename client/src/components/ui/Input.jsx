import * as React from 'react';
import { cn } from '@/utils/helpers';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-brand-border bg-brand-surface/80 px-3 py-2 text-sm text-brand-primary placeholder:text-brand-muted',
        'hover:border-brand-accent/30',
        'focus:outline-none focus:border-brand-accent/60 focus:ring-2 focus:ring-brand-accent/20 focus:ring-offset-0',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
export default Input;
