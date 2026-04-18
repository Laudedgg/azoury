import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/helpers';

function KPICard({ title, value, icon: Icon, trend, trendValue, className }) {
  const isPositive = trend === 'up';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <Card className={cn('p-4 sm:p-6 hover:border-brand-accent/30 transition-all duration-300', className)}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
            <p className="text-[11px] sm:text-sm font-medium text-brand-secondary truncate">{title}</p>
            <p className="text-lg sm:text-3xl font-bold text-brand-primary tracking-tight truncate">{value}</p>
            {trendValue !== undefined && (
              <div className="flex items-center gap-1 sm:gap-1.5">
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-brand-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-brand-error" />
                )}
                <span
                  className={cn(
                    'text-xs sm:text-sm font-medium',
                    isPositive ? 'text-brand-success' : 'text-brand-error'
                  )}
                >
                  {trendValue}%
                </span>
                <span className="hidden sm:inline text-xs text-brand-muted">vs last period</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="flex-shrink-0 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-brand-accent/10">
              <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-brand-accent" />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export { KPICard };
export default KPICard;
