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

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const mockInventory = [
  { id: 1, product: 'Roma Tomatoes', grade: 'Extra', currentStock: 120, reserved: 50, available: 70, minThreshold: 100, status: 'Low', lastMovement: '2026-04-08 09:30' },
  { id: 2, product: 'Roma Tomatoes', grade: 'Quality A', currentStock: 250, reserved: 80, available: 170, minThreshold: 100, status: 'OK', lastMovement: '2026-04-08 09:30' },
  { id: 3, product: 'Cucumbers', grade: 'Extra', currentStock: 350, reserved: 100, available: 250, minThreshold: 150, status: 'OK', lastMovement: '2026-04-08 08:15' },
  { id: 4, product: 'Bell Peppers', grade: 'Extra', currentStock: 40, reserved: 20, available: 20, minThreshold: 80, status: 'Low', lastMovement: '2026-04-08 07:45' },
  { id: 5, product: 'Potatoes', grade: 'Quality C', currentStock: 800, reserved: 200, available: 600, minThreshold: 300, status: 'Overstocked', lastMovement: '2026-04-08 08:00' },
  { id: 6, product: 'Avocados', grade: 'Extra', currentStock: 45, reserved: 30, available: 15, minThreshold: 50, status: 'Low', lastMovement: '2026-04-08 08:20' },
  { id: 7, product: 'Bananas', grade: 'Quality A', currentStock: 400, reserved: 150, available: 250, minThreshold: 200, status: 'OK', lastMovement: '2026-04-07 16:30' },
  { id: 8, product: 'Onions', grade: 'Quality C', currentStock: 600, reserved: 100, available: 500, minThreshold: 200, status: 'Overstocked', lastMovement: '2026-04-07 15:00' },
  { id: 9, product: 'Lemons', grade: 'Quality A', currentStock: 180, reserved: 60, available: 120, minThreshold: 100, status: 'OK', lastMovement: '2026-04-07 14:30' },
  { id: 10, product: 'Carrots', grade: 'Quality A', currentStock: 300, reserved: 80, available: 220, minThreshold: 150, status: 'OK', lastMovement: '2026-04-07 13:00' },
  { id: 11, product: 'Iceberg Lettuce', grade: 'Extra', currentStock: 60, reserved: 40, available: 20, minThreshold: 80, status: 'Low', lastMovement: '2026-04-08 07:30' },
  { id: 12, product: 'Mangoes', grade: 'Extra', currentStock: 90, reserved: 30, available: 60, minThreshold: 50, status: 'OK', lastMovement: '2026-04-06 12:00' },
];

const mockMovements = [
  { id: 1, product: 'Roma Tomatoes', grade: 'Extra', type: 'Purchase In', qty: 500, date: '2026-04-08 09:30', notes: 'PO-1204 from Farm Fresh', user: 'Ali M.' },
  { id: 2, product: 'Cucumbers', grade: 'Quality A', type: 'Sale Out', qty: -80, date: '2026-04-08 09:00', notes: 'Order #1847 Al Mandaloun', user: 'System' },
  { id: 3, product: 'Bell Peppers', grade: 'Extra', type: 'Purchase In', qty: 200, date: '2026-04-08 07:45', notes: 'PO-1206 from Bekaa Farms', user: 'Hassan K.' },
  { id: 4, product: 'Bananas', grade: 'Quality A', type: 'Waste', qty: -20, date: '2026-04-07 16:30', notes: 'Aging waste - overripe', user: 'Karim H.' },
  { id: 5, product: 'Potatoes', grade: 'Quality C', type: 'Sale Out', qty: -150, date: '2026-04-08 08:00', notes: 'Order #1845 Karam Beirut', user: 'System' },
  { id: 6, product: 'Avocados', grade: 'Extra', type: 'Return', qty: 5, date: '2026-04-08 08:20', notes: 'Returned from Le Petit Chef', user: 'Omar S.' },
  { id: 7, product: 'Lemons', grade: 'Quality A', type: 'Sale Out', qty: -40, date: '2026-04-07 14:30', notes: 'Order #1842 Green Basket', user: 'System' },
  { id: 8, product: 'Onions', grade: 'Quality C', type: 'Adjustment', qty: 15, date: '2026-04-07 15:00', notes: 'Inventory count adjustment', user: 'Ali M.' },
];

const qualityDistribution = [
  { name: 'Extra', value: 35 },
  { name: 'Quality A', value: 40 },
  { name: 'Quality C', value: 25 },
];

const inventoryColumns = [
  { accessorKey: 'product', header: 'Product' },
  { accessorKey: 'grade', header: 'Grade', cell: ({ row }) => <Badge variant="outline">{row.original.grade}</Badge> },
  { accessorKey: 'currentStock', header: 'Current (kg)' },
  { accessorKey: 'reserved', header: 'Reserved (kg)' },
  { accessorKey: 'available', header: 'Available (kg)', cell: ({ row }) => <span className="font-semibold text-brand-primary">{row.original.available}</span> },
  { accessorKey: 'minThreshold', header: 'Min Threshold' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const s = row.original.status;
      const variant = s === 'Low' ? 'error' : s === 'Overstocked' ? 'warning' : 'success';
      return <Badge variant={variant}>{s}</Badge>;
    },
  },
  { accessorKey: 'lastMovement', header: 'Last Movement' },
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

  const { data: apiData } = useFetch('/inventory/stock');
  const inventory = apiData?.stock || mockInventory;

  const totalItems = inventory.length;
  const totalValue = 182400;
  const lowStockItems = inventory.filter((i) => i.status === 'Low').length;
  const lowStockProducts = inventory.filter((i) => i.status === 'Low');

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-6"
    >
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Inventory Management</h1>
          <p className="text-brand-secondary text-sm mt-1">Stock levels, movements, and alerts</p>
        </div>
        <Button onClick={() => setMovementDialog(true)}>
          <ArrowDownUp className="w-4 h-4 mr-2" /> Record Movement
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Items" value={totalItems} icon={Package} />
        <KPICard title="Total Value" value={formatCurrency(totalValue)} icon={DollarSign} trend="up" trendValue={1.8} />
        <KPICard title="Low Stock Items" value={lowStockItems} icon={AlertTriangle} trend="up" trendValue={2} />
        <Card>
          <CardContent className="p-4">
            <p className="text-brand-secondary text-xs font-medium mb-2">Quality Distribution</p>
            <ResponsiveContainer width="100%" height={80}>
              <PieChart>
                <Pie data={qualityDistribution} cx="50%" cy="50%" innerRadius={20} outerRadius={35} dataKey="value" paddingAngle={3}>
                  {qualityDistribution.map((entry, i) => (
                    <Cell key={entry.name} fill={CHART_COLORS[i]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#143535', border: '1px solid #1A3F3F', borderRadius: '8px', color: '#E8F5F3', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-3 mt-1">
              {qualityDistribution.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1 text-xs text-brand-secondary">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                  {d.name}
                </div>
              ))}
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
              data={mockMovements}
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
              <Select>
                <SelectTrigger><SelectValue placeholder="Select product..." /></SelectTrigger>
                <SelectContent>
                  {['Roma Tomatoes', 'Cucumbers', 'Bell Peppers', 'Potatoes', 'Avocados', 'Bananas', 'Onions', 'Lemons'].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Grade</label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select grade..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="extra">Extra</SelectItem>
                  <SelectItem value="quality-a">Quality A</SelectItem>
                  <SelectItem value="quality-c">Quality C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Type</label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase-in">Purchase In</SelectItem>
                  <SelectItem value="sale-out">Sale Out</SelectItem>
                  <SelectItem value="waste">Waste</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Quantity (kg)</label>
              <Input type="number" placeholder="0" />
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Notes</label>
              <textarea className="w-full bg-brand-elevated border border-brand-border rounded-lg p-3 text-brand-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-accent resize-none" rows={2} placeholder="Optional notes..." />
            </div>
            <Button className="w-full">Record Movement</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export { Inventory };
export default Inventory;
