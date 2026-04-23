import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, Users, FileText, Download, Calendar, Printer, AlertTriangle,
} from 'lucide-react';
import { printTable } from '@/utils/print';
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
  const { data: missingItemsData } = useFetch('/reports/missing-items');
  const missingRows = (missingItemsData || []).map((m) => ({
    ...m,
    orderedFmt: `${m.ordered} ${m.unit === 'kg' ? 'Kg' : (m.unit || '').charAt(0).toUpperCase() + (m.unit || '').slice(1)}`,
    stockFmt: `${m.currentStock} ${m.unit === 'kg' ? 'Kg' : (m.unit || '').charAt(0).toUpperCase() + (m.unit || '').slice(1)}`,
    missingFmt: `${m.missing} ${m.unit === 'kg' ? 'Kg' : (m.unit || '').charAt(0).toUpperCase() + (m.unit || '').slice(1)}`,
  }));
  const missingColumns = [
    { accessorKey: 'productName', header: 'Product' },
    { accessorKey: 'grade', header: 'Grade', cell: ({ row }) => <Badge variant="outline">{row.original.grade}</Badge> },
    { accessorKey: 'ordered', header: 'Ordered (open)', cell: ({ row }) => row.original.orderedFmt },
    { accessorKey: 'currentStock', header: 'In stock', cell: ({ row }) => row.original.stockFmt },
    {
      accessorKey: 'missing',
      header: 'Missing',
      cell: ({ row }) => (
        <span className={row.original.missing > 0 ? 'text-brand-error font-semibold' : 'text-brand-success'}>
          {row.original.missingFmt}
        </span>
      ),
    },
  ];
  const missingCount = missingRows.filter((r) => r.missing > 0).length;

  const handlePrintMissing = () => {
    printTable({
      title: 'Missing Items Report',
      subtitle: 'Open orders vs inventory stock',
      columns: [
        { key: 'productName', label: 'Product' },
        { key: 'grade', label: 'Grade' },
        { key: 'orderedFmt', label: 'Ordered (open)', align: 'right' },
        { key: 'stockFmt', label: 'In Stock', align: 'right' },
        { key: 'missingFmt', label: 'Missing', align: 'right' },
      ],
      rows: missingRows,
    });
  };

  const dashboard = dashboardData || {};

  const revenueTrend = (revenueData || []).map((r) => ({
    date: r.period,
    revenue: r.revenue || 0,
    cost: 0,
  }));

  const gradeRevenue = costVsRevenueData || [];

  const topClients = (topClientsData || []).map((c) => ({
    name: c.client?.businessName || '',
    revenue: c.totalRevenue || 0,
  }));

  const invoices = (invoicesData?.data || []).map((inv) => ({
    id: inv.id,
    invoiceNum: inv.invoiceNumber || `INV-${inv.id}`,
    client: inv.client?.businessName || '',
    amount: inv.totalAmount || 0,
    date: inv.issueDate ? inv.issueDate.split('T')[0] : '',
    dueDate: inv.dueDate ? inv.dueDate.split('T')[0] : '',
    status: inv.status || 'Draft',
  }));

  const totalRevenue = dashboard.totalRevenue ?? 0;
  const totalCost = dashboard.totalCost ?? 0;
  const grossMargin = dashboard.grossMargin ?? (totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100).toFixed(1) : '0.0');
  const invoicesOutstanding = dashboard.invoicesOutstanding ?? invoices.filter((i) => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-4 lg:space-y-6"
    >
      <motion.div variants={fadeInUp} className="flex flex-col-reverse gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold text-brand-primary">Reports & Analytics</h1>
          <p className="text-brand-secondary text-sm mt-1">Financial performance and insights</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-40">
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
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button variant="outline" className="w-full sm:w-auto">
            <FileText className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
              <Pie data={[]} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
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
              <Bar dataKey="qualityC" name="Cooking" fill={CHART_COLORS[2]} stackId="a" radius={[4, 4, 0, 0]} />
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
              data={[]}
              searchPlaceholder="Search transactions..."
              searchColumn="client"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Missing Items (orders combined vs stock) */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${missingCount > 0 ? 'text-brand-error' : 'text-brand-muted'}`} />
                <h3 className="text-lg font-semibold text-brand-primary">Missing Items</h3>
                {missingCount > 0 && <Badge variant="error" className="text-[10px]">{missingCount} short</Badge>}
              </div>
              <Button variant="outline" size="sm" className="no-print w-full sm:w-auto" onClick={handlePrintMissing}>
                <Printer className="w-3 h-3 mr-1" /> Print
              </Button>
            </div>
            <p className="text-brand-secondary text-xs mb-3">
              Sum of open-order quantities per product/grade compared against current inventory.
              Positive "Missing" means you need to procure more.
            </p>
            <DataTable
              columns={missingColumns}
              data={missingRows}
              searchPlaceholder="Search product..."
              searchColumn="productName"
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
