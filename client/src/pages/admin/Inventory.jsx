import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, DollarSign, AlertTriangle, ArrowDownUp, Plus, ShoppingCart } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { KPICard } from '@/components/dashboard/KPICard';
import { DataTable } from '@/components/tables/DataTable';
import { CHART_COLORS } from '@/utils/constants';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { useFetch } from '@/hooks/useFetch';
import api from '@/services/api';
import { toast } from 'sonner';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const inventoryColumns = [
  { accessorKey: 'product', header: 'Product' },
  { accessorKey: 'grade', header: 'Grade', cell: ({ row }) => <Badge variant="outline">{row.original.grade}</Badge> },
  { accessorKey: 'openingStock', header: 'Opening', cell: ({ row }) => <span className="mono text-brand-secondary">{(row.original.openingStock ?? 0).toFixed(1)}</span> },
  {
    accessorKey: 'receivedToday',
    header: 'Received',
    cell: ({ row }) => {
      const v = row.original.receivedToday || 0;
      return <span className={`mono ${v > 0 ? 'text-brand-success font-semibold' : 'text-brand-muted'}`}>{v > 0 ? '+' : ''}{v.toFixed(1)}</span>;
    },
  },
  {
    accessorKey: 'soldToday',
    header: 'Sold',
    cell: ({ row }) => {
      const v = row.original.soldToday || 0;
      return <span className={`mono ${v > 0 ? 'text-brand-accent font-semibold' : 'text-brand-muted'}`}>{v > 0 ? '−' : ''}{v.toFixed(1)}</span>;
    },
  },
  {
    accessorKey: 'wastedToday',
    header: 'Wasted',
    cell: ({ row }) => {
      const v = row.original.wastedToday || 0;
      return <span className={`mono ${v > 0 ? 'text-brand-error font-semibold' : 'text-brand-muted'}`}>{v > 0 ? '−' : ''}{v.toFixed(1)}</span>;
    },
  },
  {
    accessorKey: 'currentStock',
    header: 'Current',
    cell: ({ row }) => <span className="mono font-bold text-brand-primary">{(row.original.currentStock ?? 0).toFixed(1)}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const s = row.original.status;
      const variant = s === 'Low' ? 'error' : s === 'Overstocked' ? 'warning' : 'success';
      return <Badge variant={variant}>{s}</Badge>;
    },
  },
];

const movementColumns = [
  { accessorKey: 'product', header: 'Product' },
  { accessorKey: 'grade', header: 'Grade' },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const t = row.original.type;
      const variant = t === 'Purchase In' ? 'success' : t === 'Sale Out' ? 'accent' : t === 'Waste' ? 'error' : 'default';
      return <Badge variant={variant}>{t}</Badge>;
    },
  },
  {
    accessorKey: 'qty',
    header: 'Qty (kg)',
    cell: ({ row }) => {
      const q = row.original.qty;
      return <span className={q > 0 ? 'text-brand-success font-semibold' : 'text-brand-error font-semibold'}>{q > 0 ? '+' : ''}{q}</span>;
    },
  },
  { accessorKey: 'date', header: 'Date' },
  { accessorKey: 'notes', header: 'Notes' },
  { accessorKey: 'user', header: 'By' },
];

function Inventory() {
  const [movementDialog, setMovementDialog] = useState(false);
  const [movementForm, setMovementForm] = useState({ productId: '', qualityGradeId: '', type: '', quantity: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const { data: stockData, refetch: refetchStock } = useFetch('/inventory/stock');
  const { data: movementsData, refetch: refetchMovements } = useFetch('/inventory/movements?page=1&limit=50');
  const { data: lowStockData, refetch: refetchLowStock } = useFetch('/inventory/low-stock');
  const { data: productsData } = useFetch('/products');

  const stockItems = stockData || [];
  const inventory = stockItems.flatMap((item) =>
    (item.grades || []).map((g) => ({
      id: `${item.product.id}-${g.id}`,
      productId: item.product.id,
      qualityGradeId: g.id,
      product: item.product.name,
      grade: g.clientFacingGrade || g.grade,
      currentStock: g.currentStock ?? 0,
      openingStock: g.openingStock ?? 0,
      receivedToday: g.today?.received ?? 0,
      soldToday: g.today?.sold ?? 0,
      wastedToday: g.today?.wasted ?? 0,
      returnedToday: g.today?.returned ?? 0,
      netToday: g.netToday ?? 0,
      reserved: 0,
      available: g.currentStock ?? 0,
      minThreshold: g.minThreshold ?? 0,
      price: g.price ?? 0,
      status: g.isLow ? 'Low' : 'OK',
      lastMovement: '',
    }))
  );

  // Daily totals across all products (for the summary strip)
  const totals = stockItems.reduce(
    (acc, s) => ({
      opening: acc.opening + (s.openingStock ?? 0),
      received: acc.received + (s.receivedToday ?? 0),
      sold: acc.sold + (s.soldToday ?? 0),
      wasted: acc.wasted + (s.wastedToday ?? 0),
    }),
    { opening: 0, received: 0, sold: 0, wasted: 0 }
  );

  const movements = (movementsData?.data || []).map((m) => ({
    id: m.id,
    product: m.product?.name || '',
    grade: m.qualityGrade?.clientFacingGrade || m.qualityGrade?.grade || '',
    type: m.type,
    qty: m.quantity,
    date: m.createdAt ? formatDate(m.createdAt) : '',
    notes: m.notes || m.reference || '',
    user: m.createdBy?.name || '',
  }));

  const lowStockAlerts = lowStockData || [];
  const lowStockProducts = lowStockAlerts.map((g) => ({
    id: g.id,
    product: g.product?.name || '',
    grade: g.clientFacingGrade || g.grade,
    currentStock: g.currentStock,
    minThreshold: 0,
  }));

  const products = productsData?.data || productsData || [];

  const totalItems = inventory.reduce((s, i) => s + (i.currentStock || 0), 0);
  const totalValue = inventory.reduce((s, i) => s + (i.currentStock || 0) * (i.price || 0), 0);
  const lowStockItems = lowStockAlerts.length || inventory.filter((i) => i.status === 'Low').length;

  // Build quality distribution from real data
  const gradeCountMap = {};
  inventory.forEach((i) => {
    gradeCountMap[i.grade] = (gradeCountMap[i.grade] || 0) + (i.currentStock || 0);
  });
  const qualityDist = Object.entries(gradeCountMap).map(([name, value]) => ({ name, value }));

  const handleRecordMovement = async () => {
    if (!movementForm.productId || !movementForm.qualityGradeId || !movementForm.type || !movementForm.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/inventory/movements', {
        productId: movementForm.productId,
        qualityGradeId: movementForm.qualityGradeId,
        type: movementForm.type,
        quantity: Number(movementForm.quantity),
        notes: movementForm.notes,
      });
      toast.success('Movement recorded successfully');
      setMovementDialog(false);
      setMovementForm({ productId: '', qualityGradeId: '', type: '', quantity: '', notes: '' });
      refetchStock();
      refetchMovements();
      refetchLowStock();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record movement');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === movementForm.productId);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-4 lg:space-y-6"
    >
      <motion.div variants={fadeInUp} className="flex flex-col-reverse gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold text-brand-primary">Inventory Management</h1>
          <p className="text-brand-secondary text-sm mt-1">Stock levels, movements, and alerts</p>
        </div>
        <Button className="w-full lg:w-auto" onClick={() => setMovementDialog(true)}>
          <ArrowDownUp className="w-4 h-4 mr-2" /> Record Movement
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <KPICard title="Total Items on Hand" value={totalItems.toFixed(1)} icon={Package} />
        <KPICard title="Total Value" value={formatCurrency(totalValue)} icon={DollarSign} />
        <KPICard title="Low Stock Items" value={lowStockItems} icon={AlertTriangle} accent="warning" />
      </motion.div>

      {/* Today's flow — opening + receipts − sales − waste = current */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-brand-primary font-semibold text-sm">Today's flow</p>
                <p className="text-brand-muted text-xs">Live: opening + receipts − sales − waste = current</p>
              </div>
              <span className="text-[10px] text-brand-muted uppercase tracking-wider">Since 00:00</span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="p-2 rounded-lg bg-brand-elevated">
                <p className="text-[10px] text-brand-muted uppercase tracking-wider">Opening</p>
                <p className="mono text-brand-secondary font-semibold text-lg mt-1">{totals.opening.toFixed(1)}</p>
              </div>
              <div className="p-2 rounded-lg bg-brand-success/10 border border-brand-success/25">
                <p className="text-[10px] text-brand-success uppercase tracking-wider">Received</p>
                <p className="mono text-brand-success font-semibold text-lg mt-1">+{totals.received.toFixed(1)}</p>
              </div>
              <div className="p-2 rounded-lg bg-brand-accent/10 border border-brand-accent/25">
                <p className="text-[10px] text-brand-accent uppercase tracking-wider">Sold</p>
                <p className="mono text-brand-accent font-semibold text-lg mt-1">−{totals.sold.toFixed(1)}</p>
              </div>
              <div className="p-2 rounded-lg bg-brand-error/10 border border-brand-error/25">
                <p className="text-[10px] text-brand-error uppercase tracking-wider">Wasted</p>
                <p className="mono text-brand-error font-semibold text-lg mt-1">−{totals.wasted.toFixed(1)}</p>
              </div>
              <div className="p-2 rounded-lg bg-brand-accent/15 border border-brand-accent/40">
                <p className="text-[10px] text-brand-accent uppercase tracking-wider">Current</p>
                <p className="mono text-brand-primary font-bold text-lg mt-1">
                  {(totals.opening + totals.received - totals.sold - totals.wasted).toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Inventory Table */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-6">
            <DataTable
              columns={inventoryColumns}
              data={inventory}
              searchPlaceholder="Search products..."
              searchColumn="product"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Movement History */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle>Recent Movements</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={movementColumns}
              data={movements}
              searchPlaceholder="Search movements..."
              searchColumn="product"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <motion.div variants={fadeInUp}>
          <Card className="border-brand-error/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-error">
                <AlertTriangle className="w-5 h-5" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockProducts.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-brand-error/5 rounded-lg border border-brand-error/20">
                    <div>
                      <p className="text-brand-primary font-medium text-sm">{item.product} - {item.grade}</p>
                      <p className="text-brand-muted text-xs">Current: {item.currentStock}kg / Min: {item.minThreshold}kg</p>
                    </div>
                    <Button size="sm">
                      <ShoppingCart className="w-3 h-3 mr-1" /> Order Now
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Record Movement Dialog */}
      <Dialog open={movementDialog} onOpenChange={setMovementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Movement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Product</label>
              <Select value={movementForm.productId} onValueChange={(v) => setMovementForm((f) => ({ ...f, productId: v, qualityGradeId: '' }))}>
                <SelectTrigger><SelectValue placeholder="Select product..." /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Grade</label>
              <Select value={movementForm.qualityGradeId} onValueChange={(v) => setMovementForm((f) => ({ ...f, qualityGradeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select grade..." /></SelectTrigger>
                <SelectContent>
                  {(selectedProduct?.qualityGrades || []).map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.clientFacingGrade || g.grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Type</label>
              <Select value={movementForm.type} onValueChange={(v) => setMovementForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PURCHASE_IN">Purchase In</SelectItem>
                  <SelectItem value="SALE_OUT">Sale Out</SelectItem>
                  <SelectItem value="WASTE">Waste</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  <SelectItem value="RETURN">Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Quantity (kg)</label>
              <Input type="number" placeholder="0" value={movementForm.quantity} onChange={(e) => setMovementForm((f) => ({ ...f, quantity: e.target.value }))} />
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Notes</label>
              <textarea className="w-full bg-brand-elevated border border-brand-border rounded-lg p-3 text-brand-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-accent resize-none" rows={2} placeholder="Optional notes..." value={movementForm.notes} onChange={(e) => setMovementForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleRecordMovement} disabled={submitting}>
              {submitting ? 'Recording...' : 'Record Movement'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export { Inventory };
export default Inventory;
