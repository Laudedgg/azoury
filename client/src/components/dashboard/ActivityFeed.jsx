import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Truck, Trash2, PackageCheck, AlertTriangle,
  UserPlus, Settings2,
} from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { cn, relativeTime } from '@/utils/helpers';

const typeConfig = {
  order: { icon: ShoppingCart, color: 'border-brand-accent', bg: 'bg-brand-accent/10', iconColor: 'text-brand-accent' },
  dispatch: { icon: Truck, color: 'border-brand-success', bg: 'bg-brand-success/10', iconColor: 'text-brand-success' },
  waste: { icon: Trash2, color: 'border-brand-error', bg: 'bg-brand-error/10', iconColor: 'text-brand-error' },
  receiving: { icon: PackageCheck, color: 'border-brand-accent', bg: 'bg-brand-accent/10', iconColor: 'text-brand-accent' },
  alert: { icon: AlertTriangle, color: 'border-brand-warning', bg: 'bg-brand-warning/10', iconColor: 'text-brand-warning' },
  user: { icon: UserPlus, color: 'border-brand-accent', bg: 'bg-brand-accent/10', iconColor: 'text-brand-accent' },
  system: { icon: Settings2, color: 'border-brand-muted', bg: 'bg-brand-surface', iconColor: 'text-brand-muted' },
};

function ActivityFeed({ initialActivities = [] }) {
  const [activities, setActivities] = useState(initialActivities);
  const socket = useSocket();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleActivity = (activity) => {
      setActivities((prev) => {
        const next = [activity, ...prev];
        return next.slice(0, 50);
      });
    };

    socket.on('activity', handleActivity);
    return () => {
      socket.off('activity', handleActivity);
    };
  }, [socket]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Activity Feed</CardTitle>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-success animate-pulse" />
            <span className="text-xs text-brand-muted">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]" ref={scrollRef}>
          <div className="px-6 pb-4 space-y-1">
            <AnimatePresence initial={false}>
              {activities.length === 0 ? (
                <div className="text-center py-12 text-brand-muted text-sm">
                  No recent activity
                </div>
              ) : (
                activities.map((activity, index) => {
                  const config = typeConfig[activity.type] || typeConfig.system;
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={activity.id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'flex items-start gap-3 py-3 border-l-2 pl-3',
                        config.color
                      )}
                    >
                      <div className={cn('p-1.5 rounded-lg shrink-0 mt-0.5', config.bg)}>
                        <Icon className={cn('h-3.5 w-3.5', config.iconColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-brand-primary leading-snug">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {activity.user && (
                            <span className="text-xs font-medium text-brand-secondary">
                              {activity.user}
                            </span>
                          )}
                          <span className="text-xs text-brand-muted">
                            {relativeTime(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export { ActivityFeed };
export default ActivityFeed;
