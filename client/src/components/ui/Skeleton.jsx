import { cn } from '@/utils/helpers';

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-brand-surface', className)}
      {...props}
    />
  );
}

export { Skeleton };
export default Skeleton;
