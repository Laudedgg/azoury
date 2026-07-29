import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent } from './Card';
import { Skeleton } from './Skeleton';
import { cn } from '@/utils/helpers';

// Higher-density KPI card — smaller by default, works in 2/3/4/6 column grids.
function StatCard({
  label,
  value,
  icon: Icon,
  trend,          // 'up' | 'down'
  trendValue,     // number %
  hint,
  loading,
  accent = 'accent', // 'accent' | 'success' | 'warning' | 'error'
  className = '',
}) {
  const accentClasses = {
    accent:  'bg-brand-accent/10 text-brand-accent',
    success: 'bg-brand-success/10 text-brand-success',
    warning: 'bg-brand-warning/10 text-brand-warning',
    error:   'bg-brand-error/10 text-brand-error',
  }[accent] || 'bg-brand-accent/10 text-brand-accent';

  return (
    <Card className={cn('relative overflow-hidden group transition-all hover:border-brand-accent/40 hover:shadow-md hover:shadow-brand-accent/5', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-brand-secondary text-[11px] font-medium uppercase tracking-wider truncate">{label}</p>
            {loading ? (
              <Skeleton className="h-7 w-24 mt-2" />
            ) : (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-brand-primary text-lg sm:text-xl lg:text-2xl font-bold mt-1 tracking-tight"
              >
                {value ?? '—'}
              </motion.p>
            )}
            {(hint || trendValue != null) && (
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px]">
                {trendValue != null && (
                  <span className={cn(
                    'inline-flex items-center gap-0.5 font-semibold',
                    trend === 'down' ? 'text-brand-error' : 'text-brand-success'
                  )}>
                    {trend === 'down' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                    {trendValue}%
                  </span>
                )}
                {hint && <span className="text-brand-muted truncate">{hint}</span>}
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', accentClasses)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { StatCard };
export default StatCard;
