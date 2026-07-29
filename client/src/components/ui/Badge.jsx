import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/utils/helpers';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors leading-none',
  {
    variants: {
      variant: {
        default: 'bg-brand-accent/12 text-brand-accent border border-brand-accent/25',
        accent:  'bg-brand-accent/12 text-brand-accent border border-brand-accent/25',
        success: 'bg-brand-success/12 text-brand-success border border-brand-success/25',
        warning: 'bg-brand-warning/12 text-brand-warning border border-brand-warning/25',
        error:   'bg-brand-error/12 text-brand-error border border-brand-error/25',
        outline: 'border border-brand-border text-brand-secondary bg-brand-surface/40',
        muted:   'bg-brand-elevated text-brand-muted border border-brand-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Badge = React.forwardRef(({ className, variant, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(badgeVariants({ variant }), 'py-1', className)}
    {...props}
  />
));
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
export default Badge;
