import React, { useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart, DollarSign, Truck, Users, Package, Trash2,
  LayoutDashboard, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { KPICard } from '@/components/dashboard/KPICard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { DashboardBackdrop } from '@/components/dashboard/DashboardBackdrop';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { CHART_COLORS } from '@/utils/constants';
import { formatCurrency } from '@/utils/helpers';
import { useFetch } from '@/hooks/useFetch';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

function Dashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const { data: kpis, loading: kpisLoading, refetch: refetchKpis } = useFetch('/reports/dashboard');
  const { data: revenueTrend, refetch: refetchTrend } = useFetch('/reports/revenue?days=30');
  const { data: apiTopClients, refetch: refetchClients } = useFetch('/reports/top-clients?limit=10');
  const { data: deliveryPerf, refetch: refetchDelivery } = useFetch('/reports/delivery-performance');
  const { data: activityData, refetch: refetchActivity } = useFetch('/reports/activity?limit=20');

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchKpis?.(),
        refetchTrend?.(),
        refetchClients?.(),
        refetchDelivery?.(),
        refetchActivity?.(),
      ]);
    } finally {
      setTimeout(() => setRefreshing(false), 350);
    }
  }, [refetchKpis, refetchTrend, refetchClients, refetchDelivery, refetchActivity]);

  const orderTrend = useMemo(() => {
    return (revenueTrend || []).map((item) => ({
      date: item.period,
      orders: item.orderCount,
      revenue: item.revenue,
    }));
  }, [revenueTrend]);

  // Sparkline series for the primary KPIs (from revenueTrend if available)
  const revenueSpark = useMemo(
    () => orderTrend.slice(-14).map((d) => ({ v: d.revenue || 0 })),
    [orderTrend]
  );
  const ordersSpark = useMemo(
    () => orderTrend.slice(-14).map((d) => ({ v: d.orders || 0 })),
    [orderTrend]
  );

  const topClientsData = useMemo(() => {
    return (apiTopClients || []).map((item) => ({
      name: item.client?.businessName || 'Unknown',
      volume: item.totalRevenue,
    }));
  }, [apiTopClients]);

  const deliveryData = useMemo(() => {
    if (deliveryPerf && deliveryPerf.totalDispatches > 0) {
      const completed = deliveryPerf.completedDispatches || 0;
      const total = deliveryPerf.totalDispatches || 1;
      const failed = total - completed;
      const onTimeRate = deliveryPerf.completionRate || 0;
      const lateRate = Math.max(0, 100 - onTimeRate - Math.round((failed / total) * 100));
      return [
        { name: 'On Time', value: onTimeRate, color: '#4EEC90' },
        { name: 'Late', value: lateRate, color: '#ECD34E' },
        { name: 'Failed', value: Math.round((failed / total) * 100), color: '#EC4E4E' },
      ];
    }
    return [];
  }, [deliveryPerf]);

  const activityFeedItems = useMemo(() => {
    return (activityData || []).map((item) => {
      const actionMap = { CREATE: 'order', UPDATE: 'order', DISPATCH: 'dispatch', WASTE: 'waste', RECEIVE: 'receiving', ALERT: 'alert' };
      const entityMap = { ORDER: 'order', DISPATCH: 'dispatch', WASTE: 'waste', INVENTORY: 'receiving', USER: 'user' };
      const type = actionMap[item.action] || entityMap[item.entityType] || 'system';
      const userName = item.user ? `${item.user.firstName} ${item.user.lastName}` : 'System';
      return {
        id: item.id,
        type,
        description: `${userName} - ${item.action} ${item.entityType} #${item.entityId}`,
        user: userName,
        timestamp: item.createdAt,
      };
    });
  }, [activityData]);

  const headerActions = (
    <>
      <div className="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-full border border-brand-success/25 bg-brand-success/5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-brand-success opacity-60 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-success" />
        </span>
        <span className="text-brand-success text-[11px] font-semibold uppercase tracking-wider">Live</span>
      </div>
      <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </>
  );

  return (
    <div className="relative -m-4 lg:-m-6 pb-20 lg:pb-6">
      <DashboardBackdrop />

      <motion.div
        initial="initial"
        animate="animate"
        variants={stagger}
        className="relative z-10 p-4 lg:p-6 space-y-5 lg:space-y-6"
      >
        <motion.div variants={fadeInUp}>
          <PageHeader
            icon={LayoutDashboard}
            title="Executive Dashboard"
            subtitle="Real-time overview across every step of the chain"
            actions={headerActions}
          />
        </motion.div>

        {/* Primary metrics — bigger, with sparklines */}
        <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <KPICard
            title="Revenue Today"
            value={formatCurrency(kpis?.todaysRevenue ?? 0)}
            icon={DollarSign}
            trend="up"
            trendValue={8.3}
            loading={kpisLoading}
            sparkline={revenueSpark}
            accent="success"
          />
          <KPICard
            title="Active Orders"
            value={kpis?.activeOrders ?? 0}
            icon={ShoppingCart}
            trend="up"
            trendValue={12.5}
            loading={kpisLoading}
            sparkline={ordersSpark}
            accent="accent"
          />
          <KPICard
            title="Pending Dispatches"
            value={kpis?.pendingDispatches ?? 0}
            icon={Truck}
            trend="down"
            trendValue={5.2}
            loading={kpisLoading}
            accent="warning"
          />
        </motion.div>

        {/* Secondary metrics — compact */}
        <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <KPICard
            title="Active Clients"
            value={kpis?.activeClients ?? 0}
            icon={Users}
            trend="up"
            trendValue={3.1}
            loading={kpisLoading}
          />
          <KPICard
            title="Inventory Value"
            value={formatCurrency(kpis?.inventoryValue ?? 0)}
            icon={Package}
            trend="up"
            trendValue={1.8}
            loading={kpisLoading}
          />
          <KPICard
            title="Waste % Today"
            value={kpis?.wastePercent != null ? `${kpis.wastePercent}%` : '0%'}
            icon={Trash2}
            trend="down"
            trendValue={0.6}
            loading={kpisLoading}
            accent="error"
          />
        </motion.div>

        {/* Row: Order Volume + Revenue by Grade */}
        <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <ChartCard title="Order Volume Trend" subtitle="Last 30 days">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={orderTrend}>
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4EECD3" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#4EECD3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A3F3F" />
                <XAxis dataKey="date" tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#143535', border: '1px solid #1A3F3F', borderRadius: '8px', color: '#E8F5F3' }} />
                <Area type="monotone" dataKey="orders" stroke="#4EECD3" strokeWidth={2} fill="url(#orderGrad)" name="Orders" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Revenue vs Cost by Week" subtitle="By quality grade">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A3F3F" />
                <XAxis dataKey="grade" tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#143535', border: '1px solid #1A3F3F', borderRadius: '8px', color: '#E8F5F3' }} formatter={(v) => formatCurrency(v)} />
                <Legend wrapperStyle={{ color: '#8AABA6', fontSize: 12 }} />
                <Bar dataKey="extra" name="Extra" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="qualityA" name="Quality A" fill={CHART_COLORS[1]} stackId="a" />
                <Bar dataKey="qualityC" name="Cooking" fill={CHART_COLORS[2]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        {/* Row: Delivery Performance + Top Clients */}
        <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <ChartCard title="Delivery Performance" subtitle="This month">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={deliveryData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={3} dataKey="value">
                  {deliveryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#143535', border: '1px solid #1A3F3F', borderRadius: '8px', color: '#E8F5F3' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => <span style={{ color: '#8AABA6' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top 10 Clients by Volume" subtitle="Units ordered this month">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topClientsData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A3F3F" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#8AABA6', fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#143535', border: '1px solid #1A3F3F', borderRadius: '8px', color: '#E8F5F3' }} />
                <Bar dataKey="volume" name="Volume" fill="#4EECD3" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        {/* Activity Feed */}
        <motion.div variants={fadeInUp}>
          <ActivityFeed initialActivities={activityFeedItems} />
        </motion.div>
      </motion.div>
    </div>
  );
}

export { Dashboard };
export default Dashboard;
