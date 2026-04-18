import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart, DollarSign, Truck, Users, Package, Trash2,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { KPICard } from '@/components/dashboard/KPICard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { CHART_COLORS } from '@/utils/constants';
import { formatCurrency } from '@/utils/helpers';
import { useFetch } from '@/hooks/useFetch';
import { Skeleton } from '@/components/ui/Skeleton';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.08 } } };

function Dashboard() {
  const { data: kpis, loading: kpisLoading } = useFetch('/reports/dashboard');
  const { data: revenueTrend } = useFetch('/reports/revenue?days=30');
  const { data: apiTopClients } = useFetch('/reports/top-clients?limit=10');
  const { data: deliveryPerf } = useFetch('/reports/delivery-performance');
  const { data: activityData } = useFetch('/reports/activity?limit=20');

  const orderTrend = useMemo(() => {
    return (revenueTrend || []).map((item) => ({
      date: item.period,
      orders: item.orderCount,
      revenue: item.revenue,
    }));
  }, [revenueTrend]);

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

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl font-bold text-brand-primary">Executive Dashboard</h1>
        <p className="text-brand-secondary mt-1">Real-time overview of operations</p>
      </motion.div>

      {/* Row 1: KPI Cards */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard title="Total Active Orders" value={kpis?.activeOrders ?? 0} icon={ShoppingCart} trend="up" trendValue={12.5} loading={kpisLoading} />
        <KPICard title="Revenue Today" value={formatCurrency(kpis?.todaysRevenue ?? 0)} icon={DollarSign} trend="up" trendValue={8.3} loading={kpisLoading} />
        <KPICard title="Pending Dispatches" value={kpis?.pendingDispatches ?? 0} icon={Truck} trend="down" trendValue={5.2} loading={kpisLoading} />
        <KPICard title="Active Clients" value={kpis?.activeClients ?? 0} icon={Users} trend="up" trendValue={3.1} loading={kpisLoading} />
        <KPICard title="Inventory Value" value={formatCurrency(kpis?.inventoryValue ?? 0)} icon={Package} trend="up" trendValue={1.8} loading={kpisLoading} />
        <KPICard title="Waste % Today" value={kpis?.wastePercent != null ? `${kpis.wastePercent}%` : '0%'} icon={Trash2} trend="down" trendValue={0.6} loading={kpisLoading} />
      </motion.div>

      {/* Row 2: Order Volume + Revenue by Grade */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Order Volume Trend" subtitle="Last 30 days">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={orderTrend}>
              <defs>
                <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4EECD3" stopOpacity={0.3} />
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
          <ResponsiveContainer width="100%" height={280}>
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

      {/* Row 3: Delivery Performance + Top Clients */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Delivery Performance" subtitle="This month">
          <ResponsiveContainer width="100%" height={280}>
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
          <ResponsiveContainer width="100%" height={280}>
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

      {/* Row 4: Activity Feed */}
      <motion.div variants={fadeInUp}>
        <ActivityFeed initialActivities={activityFeedItems} />
      </motion.div>
    </motion.div>
  );
}

export { Dashboard };
export default Dashboard;
