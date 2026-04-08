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

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.08 } } };

const generateOrderTrend = () => {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      orders: Math.floor(150 + Math.random() * 150),
    });
  }
  return data;
};

const revenueByGrade = [
  { grade: 'Week 1', extra: 12400, qualityA: 18200, qualityC: 8500 },
  { grade: 'Week 2', extra: 14100, qualityA: 16800, qualityC: 9200 },
  { grade: 'Week 3', extra: 11800, qualityA: 19500, qualityC: 7800 },
  { grade: 'Week 4', extra: 15200, qualityA: 17600, qualityC: 10100 },
];

const deliveryPerformance = [
  { name: 'On Time', value: 85, color: '#4EEC90' },
  { name: 'Late', value: 10, color: '#ECD34E' },
  { name: 'Failed', value: 5, color: '#EC4E4E' },
];

const topClients = [
  { name: 'Al Mandaloun', volume: 2840 },
  { name: 'Le Petit Chef', volume: 2560 },
  { name: 'Karam Beirut', volume: 2310 },
  { name: 'Fresh Market', volume: 2100 },
  { name: 'Souq Express', volume: 1890 },
  { name: 'Green Basket', volume: 1720 },
  { name: 'Phoenicia Hotel', volume: 1650 },
  { name: 'Byblos Bay', volume: 1480 },
  { name: 'Beirut Bites', volume: 1320 },
  { name: 'Chez Michel', volume: 1150 },
];

const sampleActivities = [
  { id: 1, type: 'order', description: 'New order #1847 from Al Mandaloun - 24 items', user: 'System', timestamp: new Date(Date.now() - 2 * 60000).toISOString() },
  { id: 2, type: 'dispatch', description: 'Dispatch #D-392 marked as delivered to Le Petit Chef', user: 'Driver Ali', timestamp: new Date(Date.now() - 8 * 60000).toISOString() },
  { id: 3, type: 'alert', description: 'Low stock alert: Roma Tomatoes below threshold (15kg remaining)', user: 'System', timestamp: new Date(Date.now() - 12 * 60000).toISOString() },
  { id: 4, type: 'order', description: 'Order #1846 from Fresh Market updated - added 3 items', user: 'Client', timestamp: new Date(Date.now() - 18 * 60000).toISOString() },
  { id: 5, type: 'waste', description: 'Weight discrepancy flagged on PO #P-1204 from Farm Fresh Co.', user: 'QC Team', timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
  { id: 6, type: 'dispatch', description: 'Route R-14 dispatched with 6 stops - Driver: Ahmad K.', user: 'Operations', timestamp: new Date(Date.now() - 31 * 60000).toISOString() },
  { id: 7, type: 'receiving', description: 'Invoice #INV-4821 paid by Karam Beirut - $3,240.00', user: 'Accounting', timestamp: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: 8, type: 'order', description: 'New order #1845 from Phoenicia Hotel - 38 items', user: 'System', timestamp: new Date(Date.now() - 52 * 60000).toISOString() },
  { id: 9, type: 'alert', description: 'Supplier rating dropped: Valley Farms now at 3.2/5', user: 'System', timestamp: new Date(Date.now() - 60 * 60000).toISOString() },
  { id: 10, type: 'waste', description: 'Spot check completed - 2 discrepancies found in cold storage', user: 'QC Team', timestamp: new Date(Date.now() - 90 * 60000).toISOString() },
];

function Dashboard() {
  const { data: kpis } = useFetch('/reports/kpis');
  const orderTrend = useMemo(() => generateOrderTrend(), []);

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-6">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl font-bold text-brand-primary">Executive Dashboard</h1>
        <p className="text-brand-secondary mt-1">Real-time overview of operations</p>
      </motion.div>

      {/* Row 1: KPI Cards */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard title="Total Active Orders" value={kpis?.activeOrders || 247} icon={ShoppingCart} trend="up" trendValue={12.5} />
        <KPICard title="Revenue Today" value={formatCurrency(kpis?.revenue || 48250)} icon={DollarSign} trend="up" trendValue={8.3} />
        <KPICard title="Pending Dispatches" value={kpis?.pendingDispatches || 34} icon={Truck} trend="down" trendValue={5.2} />
        <KPICard title="Active Clients" value={89} icon={Users} trend="up" trendValue={3.1} />
        <KPICard title="Inventory Value" value={formatCurrency(182400)} icon={Package} trend="up" trendValue={1.8} />
        <KPICard title="Waste % Today" value="2.4%" icon={Trash2} trend="down" trendValue={0.6} />
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
            <BarChart data={revenueByGrade}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A3F3F" />
              <XAxis dataKey="grade" tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <RechartsTooltip contentStyle={{ backgroundColor: '#143535', border: '1px solid #1A3F3F', borderRadius: '8px', color: '#E8F5F3' }} formatter={(v) => formatCurrency(v)} />
              <Legend wrapperStyle={{ color: '#8AABA6', fontSize: 12 }} />
              <Bar dataKey="extra" name="Extra" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="qualityA" name="Quality A" fill={CHART_COLORS[1]} stackId="a" />
              <Bar dataKey="qualityC" name="Quality C" fill={CHART_COLORS[2]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* Row 3: Delivery Performance + Top Clients */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Delivery Performance" subtitle="This month">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={deliveryPerformance} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={3} dataKey="value">
                {deliveryPerformance.map((entry, i) => (
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
            <BarChart data={topClients} layout="vertical" margin={{ left: 20 }}>
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
        <ActivityFeed initialActivities={sampleActivities} />
      </motion.div>
    </motion.div>
  );
}

export { Dashboard };
export default Dashboard;
