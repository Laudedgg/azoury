import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/utils/helpers';

const accentMap = {
  accent:  { pillClass: 'bg-brand-accent/10 text-brand-accent',   stroke: '#4EECD3' },
  success: { pillClass: 'bg-brand-success/10 text-brand-success', stroke: '#4EEC90' },
  warning: { pillClass: 'bg-brand-warning/10 text-brand-warning', stroke: '#ECD34E' },
  error:   { pillClass: 'bg-brand-error/10 text-brand-error',     stroke: '#EC4E6F' },
};

function Sparkline({ data, stroke = '#4EECD3', gradientId }) {
  if (!data || data.length < 2) return null;
  const gid = gradientId || `spark-${stroke.replace('#', '')}`;
  return (
    <div className="h-9 -mx-1 -mb-1 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={1.75}
            fill={`url(#${gid})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  loading,
  className,
  accent = 'accent',
  sparkline,          // optional: array of numbers or {v: number}
}) {
  const isPositive = trend === 'up';
  const a = accentMap[accent] || accentMap.accent;

  // Normalize sparkline data
  const sparkData = React.useMemo(() => {
    if (!sparkline || sparkline.length === 0) return null;
    return sparkline.map((v) => (typeof v === 'number' ? { v } : v));
  }, [sparkline]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -2 }}
    >
      <Card
        className={cn(
          'relative overflow-hidden group transition-all',
          'hover:border-brand-accent/40 hover:shadow-md hover:shadow-brand-accent/5',
          className
        )}
      >
        <div className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-[11px] font-semibold text-brand-secondary uppercase tracking-wider truncate">
                {title}
              </p>
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
                  <span
                    className={cn(
                      'text-[11px] font-semibold',
                      isPositive ? 'text-brand-success' : 'text-brand-error'
                    )}
                  >
                    {trendValue}%
                  </span>
                  <span className="hidden sm:inline text-[10px] text-brand-muted">vs last</span>
                </div>
              )}
            </div>
            {Icon && (
              <div
                className={cn(
                  'flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center',
                  a.pillClass
                )}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            )}
          </div>

          {sparkData && (
            <Sparkline data={sparkData} stroke={a.stroke} />
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export { KPICard };
export default KPICard;
