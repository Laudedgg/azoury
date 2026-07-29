import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/utils/helpers';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-base disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-brand-accent text-brand-base hover:bg-brand-accent-hover shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_2px_8px_-2px_rgba(78,236,211,0.35)] hover:shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_4px_16px_-4px_rgba(78,236,211,0.5)]',
        secondary: 'bg-brand-elevated text-brand-primary hover:bg-brand-elevated/70 border border-brand-border hover:border-brand-accent/40',
        outline: 'border border-brand-border bg-transparent text-brand-primary hover:bg-brand-elevated hover:border-brand-accent/40',
        ghost: 'text-brand-secondary hover:bg-brand-elevated hover:text-brand-primary',
        destructive: 'bg-brand-error text-white hover:bg-brand-error/90 shadow-sm',
        link: 'text-brand-accent underline-offset-4 hover:underline p-0 h-auto',
        soft: 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20 hover:bg-brand-accent/15',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        xs: 'h-7 rounded-md px-2.5 text-[11px]',
        lg: 'h-12 rounded-lg px-8 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;
