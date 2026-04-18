import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, AlertTriangle, Plus, Check, Clock } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { KPICard } from '@/components/dashboard/KPICard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { DataTable } from '@/components/tables/DataTable';
import { CHART_COLORS } from '@/utils/constants';
import { formatCurrency } from '@/utils/helpers';
import { useFetch } from '@/hooks/useFetch';
import api from '@/services/api';
import { toast } from 'sonner';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const receivingColumns = [
  { accessorKey: 'product', header: 'Product' },
  { accessorKey: 'grade', header: 'Grade' },
  { accessorKey: 'qty', header: 'Qty (kg)' },
  { accessorKey: 'supplier', header: 'Supplier' },
  { accessorKey: 'cost', header: 'Cost', cell: ({ row }) => formatCurrency(row.original.cost) },
  { accessorKey: 'reason', header: 'Reason' },
  { accessorKey: 'date', header: 'Date' },
  {
    accessorKey: 'status',
    header: 'Authorization',
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'Authorized' ? 'success' : 'warning'}>{row.original.status}</Badge>
    ),
  },
];

const agingColumns = [
  { accessorKey: 'product', header: 'Product' },
  { accessorKey: 'grade', header: 'Grade' },
  { accessorKey: 'qty', header: 'Qty (kg)' },
  { accessorKey: 'daysAged', header: 'Days Aged', cell: ({ row }) => <span className="text-brand-warning font-semibold">{row.original.daysAged}d</span> },
  { accessorKey: 'supplier', header: 'Supplier' },
  { accessorKey: 'cost', header: 'Cost', cell: ({ row }) => formatCurrency(row.original.cost) },
  { accessorKey: 'reason', header: 'Reason' },
  {
    accessorKey: 'status',
    header: 'Authorization',
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'Authorized' ? 'success' : 'warning'}>{row.original.status}</Badge>
    ),
  },
];

function Waste() {
  const [wasteDialog, setWasteDialog] = useState(false);
  const [wasteForm, setWasteForm] = useState({ productId: '', qualityGradeId: '', quantity: '', wasteType: '', reason: '', cost: '' });
  const [submitting, setSubmitting] = useState(false);

  const { data: receivingData, refetch: refetchReceiving } = useFetch('/waste?wasteType=RECEIVING_WASTE&page=1');
  const { data: agingData, refetch: refetchAging } = useFetch('/waste?wasteType=AGING_WASTE&page=1');
  const { data: analyticsData } = useFetch('/waste/analytics');
  const { data: productsData } = useFetch('/products');

  const products = productsData?.data || productsData || [];

  const receivingWaste = (receivingData?.data || []).map((w) => ({
    id: w.id,
    product: w.product?.name || '',
    grade: w.qualityGrade?.clientFacingGrade || w.qualityGrade?.grade || '',
    qty: w.quantity,
    supplier: '',
    cost: w.cost || 0,
    date: w.createdAt ? w.createdAt.split('T')[0] : '',
    reason: w.reason || '',
    authorizedBy: w.authorizedBy?.name || null,
    status: w.authorizedBy ? 'Authorized' : 'Pending',
  }));

  const agingWaste = (agingData?.data || []).map((w) => ({
    id: w.id,
    product: w.product?.name || '',
    grade: w.qualityGrade?.clientFacingGrade || w.qualityGrade?.grade || '',
    qty: w.quantity,
    supplier: '',
    cost: w.cost || 0,
    date: w.createdAt ? w.createdAt.split('T')[0] : '',
    reason: w.reason || '',
    authorizedBy: w.authorizedBy?.name || null,
    status: w.authorizedBy ? 'Authorized' : 'Pending',
    daysAged: 0,
  }));

  const pendingAuth = [...receivingWaste, ...agingWaste].filter((w) => w.status === 'Pending');

  const analytics = analyticsData || {};
  const todayCost = analytics.daily?.totalCost ?? 0;
  const weekCost = analytics.weekly?.totalCost ?? 0;
  const topWasteProduct = analytics.topWasteProducts?.[0]?.product?.name || '';

  const selectedProduct = products.find((p) => p.id === wasteForm.productId);

  const handleSubmitWaste = async () => {
    if (!wasteForm.productId || !wasteForm.qualityGradeId || !wasteForm.quantity || !wasteForm.wasteType) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/waste', {
        productId: wasteForm.productId,
        qualityGradeId: wasteForm.qualityGradeId,
        quantity: Number(wasteForm.quantity),
        wasteType: wasteForm.wasteType,
        reason: wasteForm.reason,
        cost: Number(wasteForm.cost) || 0,
      });
      toast.success('Waste entry logged');
      setWasteForm({ productId: '', qualityGradeId: '', quantity: '', wasteType: '', reason: '', cost: '' });
      refetchReceiving();
      refetchAging();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log waste');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAuthorize = async (id) => {
    try {
      await api.patch(`/waste/${id}/authorize`);
      toast.success('Waste entry authorized');
      refetchReceiving();
      refetchAging();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to authorize');
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-4 lg:space-y-6"
    >
      <motion.div variants={fadeInUp} className="flex flex-col-reverse gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold text-brand-primary">Waste Management</h1>
          <p className="text-brand-secondary text-sm mt-1">Track, authorize, and analyze product waste</p>
        </div>
        <Button variant="destructive" className="w-full lg:w-auto" onClick={() => setWasteDialog(true)}>
          <Plus className="w-4 h-4 mr-2" /> Log Waste Entry
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard title="Today's Waste Cost" value={formatCurrency(todayCost)} icon={Trash2} trend="down" trendValue={8} />
        <KPICard title="This Week's Waste" value={formatCurrency(weekCost)} icon={Trash2} trend="down" trendValue={12} />
        <KPICard title="Waste % of Inventory" value="2.1%" icon={AlertTriangle} trend="down" trendValue={0.3} />
        <KPICard title="Top Waste Product" value={topWasteProduct} icon={AlertTriangle} />
      </motion.div>

      {/* Log Waste Form */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-brand-primary font-semibold mb-4">Quick Log Waste</h3>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-brand-secondary text-xs mb-1">Product</label>
                <Select value={wasteForm.productId} onValueChange={(v) => setWasteForm((f) => ({ ...f, productId: v, qualityGradeId: '' }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-brand-secondary text-xs mb-1">Grade</label>
                <Select value={wasteForm.qualityGradeId} onValueChange={(v) => setWasteForm((f) => ({ ...f, qualityGradeId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Grade..." /></SelectTrigger>
                  <SelectContent>
                    {(selectedProduct?.qualityGrades || []).map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.clientFacingGrade || g.grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-brand-secondary text-xs mb-1">Qty (kg)</label>
                <Input type="number" placeholder="0" value={wasteForm.quantity} onChange={(e) => setWasteForm((f) => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div>
                <label className="block text-brand-secondary text-xs mb-1">Type</label>
                <Select value={wasteForm.wasteType} onValueChange={(v) => setWasteForm((f) => ({ ...f, wasteType: v }))}>
                  <SelectTrigger><SelectValue placeholder="Type..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECEIVING_WASTE">Receiving</SelectItem>
                    <SelectItem value="AGING_WASTE">Aging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-brand-secondary text-xs mb-1">Reason</label>
                <Input placeholder="Brief reason" value={wasteForm.reason} onChange={(e) => setWasteForm((f) => ({ ...f, reason: e.target.value }))} />
              </div>
              <div className="flex items-end col-span-2 lg:col-span-1">
                <Button className="w-full" onClick={handleSubmitWaste} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* QC Authorization */}
      {pendingAuth.length > 0 && (
        <motion.div variants={fadeInUp}>
          <Card className="border-brand-warning/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-warning">
                <Clock className="w-5 h-5" />
                Pending QC Authorization ({pendingAuth.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingAuth.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-brand-warning/5 rounded-lg border border-brand-warning/20">
                    <div>
                      <p className="text-brand-primary font-medium text-sm">{entry.product} ({entry.grade}) - {entry.qty}kg</p>
                      <p className="text-brand-muted text-xs">Waste: {entry.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-brand-success border-brand-success/30" onClick={() => handleAuthorize(entry.id)}>
                        <Check className="w-3 h-3 mr-1" /> Authorize
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Two-column waste tables */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receiving Waste</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={receivingColumns} data={receivingWaste} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aging Waste</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={agingColumns} data={agingWaste} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Trend Chart */}
      <motion.div variants={fadeInUp}>
        <ChartCard title="Daily Waste Cost" subtitle="Last 30 days - stacked by type">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={[]}>
              <defs>
                <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4EECD3" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4EECD3" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EC8A4E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EC8A4E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A3F3F" />
              <XAxis dataKey="date" tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
              <RechartsTooltip contentStyle={{ backgroundColor: '#143535', border: '1px solid #1A3F3F', borderRadius: '8px', color: '#E8F5F3' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="receiving" stroke="#4EECD3" fill="url(#recGrad)" strokeWidth={2} stackId="1" name="Receiving" />
              <Area type="monotone" dataKey="aging" stroke="#EC8A4E" fill="url(#ageGrad)" strokeWidth={2} stackId="1" name="Aging" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* Worst Suppliers */}
      <motion.div variants={fadeInUp}>
        <ChartCard title="Waste by Supplier" subtitle="Which suppliers products generate most waste">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[]} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A3F3F" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="supplier" tick={{ fill: '#8AABA6', fontSize: 11 }} tickLine={false} axisLine={false} width={120} />
              <RechartsTooltip contentStyle={{ backgroundColor: '#143535', border: '1px solid #1A3F3F', borderRadius: '8px', color: '#E8F5F3' }} formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="wasteCost" name="Waste Cost" fill="#EC4E4E" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>
    </motion.div>
  );
}

export { Waste };
export default Waste;
