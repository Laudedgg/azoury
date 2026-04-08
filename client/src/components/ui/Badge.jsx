import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/utils/helpers';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand-accent/15 text-brand-accent border border-brand-accent/20',
        success: 'bg-brand-success/15 text-brand-success border border-brand-success/20',
        warning: 'bg-brand-warning/15 text-brand-warning border border-brand-warning/20',
        error: 'bg-brand-error/15 text-brand-error border border-brand-error/20',
        outline: 'border border-brand-border text-brand-secondary',
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
    className={cn(badgeVariants({ variant }), className)}
    {...props}
  />
));
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
export default Badge;
