import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, Users, FileText, Download, Calendar,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { KPICard } from '@/components/dashboard/KPICard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { DataTable } from '@/components/tables/DataTable';
import { CHART_COLORS } from '@/utils/constants';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { useFetch } from '@/hooks/useFetch';
import api from '@/services/api';
import { toast } from 'sonner';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const mockRevenueTrend = (() => {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: +(3500 + Math.random() * 3000).toFixed(0),
      cost: +(2200 + Math.random() * 1800).toFixed(0),
    });
  }
  return data;
})();

const mockCostBreakdown = [
  { name: 'Produce Purchase', value: 62000 },
  { name: 'Logistics', value: 12000 },
  { name: 'Labor', value: 18000 },
  { name: 'Waste', value: 4500 },
  { name: 'Overhead', value: 8500 },
];

const mockGradeRevenue = [
  { week: 'W1', extra: 18400, qualityA: 24200, qualityC: 12500 },
  { week: 'W2', extra: 21100, qualityA: 22800, qualityC: 14200 },
  { week: 'W3', extra: 19800, qualityA: 26500, qualityC: 11800 },
  { week: 'W4', extra: 22200, qualityA: 23600, qualityC: 15100 },
];

const mockTopClients = [
  { name: 'Al Mandaloun', revenue: 28400 },
  { name: 'Le Petit Chef', revenue: 25600 },
  { name: 'Karam Beirut', revenue: 23100 },
  { name: 'Fresh Market', revenue: 21000 },
  { name: 'Phoenicia Hotel', revenue: 19500 },
  { name: 'Souq Express', revenue: 18900 },
  { name: 'Green Basket', revenue: 17200 },
  { name: 'Byblos Bay', revenue: 14800 },
];

const mockTransactions = [
  { id: 1, date: '2026-04-08', client: 'Al Mandaloun', orderNum: '#1847', amount: 3240, cost: 2180, margin: 32.7 },
  { id: 2, date: '2026-04-08', client: 'Le Petit Chef', orderNum: '#1846', amount: 2850, cost: 1920, margin: 32.6 },
  { id: 3, date: '2026-04-08', client: 'Karam Beirut', orderNum: '#1845', amount: 4120, cost: 2780, margin: 32.5 },
  { id: 4, date: '2026-04-07', client: 'Fresh Market', orderNum: '#1844', amount: 1890, cost: 1340, margin: 29.1 },
  { id: 5, date: '2026-04-07', client: 'Souq Express', orderNum: '#1843', amount: 2560, cost: 1720, margin: 32.8 },
  { id: 6, date: '2026-04-07', client: 'Phoenicia Hotel', orderNum: '#1841', amount: 5480, cost: 3650, margin: 33.4 },
  { id: 7, date: '2026-04-06', client: 'Green Basket', orderNum: '#1840', amount: 1650, cost: 1180, margin: 28.5 },
  { id: 8, date: '2026-04-06', client: 'Byblos Bay', orderNum: '#1839', amount: 2340, cost: 1580, margin: 32.5 },
  { id: 9, date: '2026-04-05', client: 'Al Mandaloun', orderNum: '#1838', amount: 2980, cost: 2010, margin: 32.6 },
  { id: 10, date: '2026-04-05', client: 'Le Petit Chef', orderNum: '#1837', amount: 3150, cost: 2120, margin: 32.7 },
];

const mockInvoices = [
  { id: 1, invoiceNum: 'INV-4821', client: 'Al Mandaloun', amount: 12480, date: '2026-04-01', dueDate: '2026-04-15', status: 'Paid' },
  { id: 2, invoiceNum: 'INV-4822', client: 'Le Petit Chef', amount: 9640, date: '2026-04-01', dueDate: '2026-04-15', status: 'Sent' },
  { id: 3, invoiceNum: 'INV-4823', client: 'Karam Beirut', amount: 14200, date: '2026-04-01', dueDate: '2026-04-15', status: 'Paid' },
  { id: 4, invoiceNum: 'INV-4824', client: 'Fresh Market', amount: 7850, date: '2026-04-01', dueDate: '2026-04-15', status: 'Overdue' },
  { id: 5, invoiceNum: 'INV-4825', client: 'Souq Express', amount: 11200, date: '2026-04-01', dueDate: '2026-04-15', status: 'Draft' },
  { id: 6, invoiceNum: 'INV-4826', client: 'Phoenicia Hotel', amount: 18400, date: '2026-04-01', dueDate: '2026-04-15', status: 'Sent' },
];

const transactionColumns = [
  { accessorKey: 'date', header: 'Date' },
  { accessorKey: 'client', header: 'Client' },
  { accessorKey: 'orderNum', header: 'Order #' },
  { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => formatCurrency(row.original.amount) },
  { accessorKey: 'cost', header: 'Cost', cell: ({ row }) => formatCurrency(row.original.cost) },
  {
    accessorKey: 'margin',
    header: 'Margin %',
    cell: ({ row }) => (
      <span className={row.original.margin >= 30 ? 'text-brand-success font-semibold' : 'text-brand-warning font-semibold'}>
        {row.original.margin}%
      </span>
    ),
  },
];

const invoiceColumns = [
  { accessorKey: 'invoiceNum', header: 'Invoice #' },
  { accessorKey: 'client', header: 'Client' },
  { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => formatCurrency(row.original.amount) },
  { accessorKey: 'date', header: 'Issue Date' },
  { accessorKey: 'dueDate', header: 'Due Date' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const s = row.original.status;
      const variant = s === 'Paid' ? 'success' : s === 'Sent' ? 'accent' : s === 'Overdue' ? 'error' : 'default';
      return <Badge variant={variant}>{s}</Badge>;
    },
  },
];

function Reports() {
  const [dateRange, setDateRange] = useState('month');

  const { data: dashboardData } = useFetch('/reports/dashboard');
  const { data: revenueData } = useFetch('/reports/revenue?days=30');
  const { data: costVsRevenueData } = useFetch('/reports/cost-vs-revenue');
  const { data: topClientsData } = useFetch('/reports/top-clients?limit=10');
  const { data: invoicesData } = useFetch('/reports/invoices');

  const dashboard = dashboardData || {};

  const revenueTrend = revenueData
    ? revenueData.map((r) => ({
        date: r.period,
        revenue: r.revenue || 0,
        cost: 0,
      }))
    : mockRevenueTrend;

  const gradeRevenue = costVsRevenueData
    ? costVsRevenueData
    : mockGradeRevenue;

  const topClients = topClientsData
    ? topClientsData.map((c) => ({
        name: c.client?.businessName || '',
        revenue: c.totalRevenue || 0,
      }))
    : mockTopClients;

  const invoices = invoicesData?.data
    ? invoicesData.data.map((inv) => ({
        id: inv.id,
        invoiceNum: inv.invoiceNumber || `INV-${inv.id}`,
        client: inv.client?.businessName || '',
        amount: inv.totalAmount || 0,
        date: inv.issueDate ? inv.issueDate.split('T')[0] : '',
        dueDate: inv.dueDate ? inv.dueDate.split('T')[0] : '',
        status: inv.status || 'Draft',
      }))
    : mockInvoices;

  const totalRevenue = dashboard.totalRevenue ?? mockTransactions.reduce((s, t) => s + t.amount, 0);
  const totalCost = dashboard.totalCost ?? mockTransactions.reduce((s, t) => s + t.cost, 0);
  const grossMargin = dashboard.grossMargin ?? ((totalRevenue - totalCost) / totalRevenue * 100).toFixed(1);
  const invoicesOutstanding = dashboard.invoicesOutstanding ?? invoices.filter((i) => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-6"
    >
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Reports & Analytics</h1>
          <p className="text-brand-secondary text-sm mt-1">Financial performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} trend="up" trendValue={14.2} />
        <KPICard title="Total Cost" value={formatCurrency(totalCost)} icon={DollarSign} trend="up" trendValue={8.5} />
        <KPICard title="Gross Margin" value={`${grossMargin}%`} icon={TrendingUp} trend="up" trendValue={3.1} />
        <KPICard title="Invoices Outstanding" value={formatCurrency(invoicesOutstanding)} icon={FileText} trend="down" trendValue={5.2} />
      </motion.div>

      {/* Row 2: Revenue Trend + Cost Breakdown */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue Trend" subtitle="Daily revenue for selected period">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4EECD3" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4EECD3" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EC8A4E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EC8A4E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A3F3F" />
              <XAxis dataKey="date" tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <RechartsTooltip contentStyle={{ backgroundColor: '#143535', border: '1px solid #1A3F3F', borderRadius: '8px', color: '#E8F5F3' }} formatter={(v) => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#4EECD3" fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="cost" stroke="#EC8A4E" fill="url(#costGrad)" strokeWidth={2} name="Cost" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cost Breakdown" subtitle="By category">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={mockCostBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {mockCostBreakdown.map((entry, i) => (
                  <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ backgroundColor: '#143535', border: '1px solid #1A3F3F', borderRadius: '8px', color: '#E8F5F3' }} formatter={(v) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* Row 3: Revenue by Grade + Top Clients */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue by Quality Grade" subtitle="Weekly stacked breakdown">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={gradeRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A3F3F" />
              <XAxis dataKey="week" tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <RechartsTooltip contentStyle={{ backgroundColor: '#143535', border: '1px solid #1A3F3F', borderRadius: '8px', color: '#E8F5F3' }} formatter={(v) => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="extra" name="Extra" fill={CHART_COLORS[0]} stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="qualityA" name="Quality A" fill={CHART_COLORS[1]} stackId="a" />
              <Bar dataKey="qualityC" name="Quality C" fill={CHART_COLORS[2]} stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Clients" subtitle="By revenue this month">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topClients} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A3F3F" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#8AABA6', fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
              <RechartsTooltip contentStyle={{ backgroundColor: '#143535', border: '1px solid #1A3F3F', borderRadius: '8px', color: '#E8F5F3' }} formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="revenue" name="Revenue" fill="#4EECD3" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* Transaction Log */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-brand-primary mb-4">Transaction Log</h3>
            <DataTable
              columns={transactionColumns}
              data={mockTransactions}

              searchPlaceholder="Search transactions..."
              searchColumn="client"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Invoices */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-brand-primary mb-4">Invoices</h3>
            <DataTable
              columns={invoiceColumns}
              data={invoices}
              searchPlaceholder="Search invoices..."
              searchColumn="client"
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export { Reports };
export default Reports;
