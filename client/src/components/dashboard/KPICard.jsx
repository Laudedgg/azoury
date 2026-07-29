import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/helpers';

function KPICard({ title, value, icon: Icon, trend, trendValue, loading, className, accent = 'accent' }) {
  const isPositive = trend === 'up';
  const accentClasses = {
    accent:  'bg-brand-accent/10 text-brand-accent',
    success: 'bg-brand-success/10 text-brand-success',
    warning: 'bg-brand-warning/10 text-brand-warning',
    error:   'bg-brand-error/10 text-brand-error',
  }[accent] || 'bg-brand-accent/10 text-brand-accent';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -2 }}
    >
      <Card className={cn('relative overflow-hidden group hover:border-brand-accent/40 hover:shadow-md hover:shadow-brand-accent/5 transition-all', className)}>
        <div className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-semibold text-brand-secondary uppercase tracking-wider truncate">{title}</p>
              {loading ? (
                <Skeleton className="h-6 sm:h-8 w-24 mt-1.5" />
              ) : (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-brand-primary text-lg sm:text-2xl font-bold tracking-tight mt-0.5 mono truncate"
                >
                  {value ?? '—'}
                </motion.p>
              )}
              {trendValue !== undefined && (
                <div className="flex items-center gap-1 mt-1.5">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-brand-success" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-brand-error" />
                  )}
                  <span className={cn('text-[11px] font-semibold', isPositive ? 'text-brand-success' : 'text-brand-error')}>
                    {trendValue}%
                  </span>
                  <span className="hidden sm:inline text-[10px] text-brand-muted">vs last</span>
                </div>
              )}
            </div>
            {Icon && (
              <div className={cn('flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center', accentClasses)}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export { KPICard };
export default KPICard;
