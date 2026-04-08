import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, ClipboardList, Plus, Check, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/tables/DataTable';
import { useFetch } from '@/hooks/useFetch';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const productOptions = [
  { value: 'roma-tomatoes', label: 'Roma Tomatoes' },
  { value: 'cucumbers', label: 'Cucumbers' },
  { value: 'bell-peppers', label: 'Bell Peppers' },
  { value: 'potatoes', label: 'Potatoes' },
  { value: 'avocados', label: 'Avocados' },
  { value: 'lemons', label: 'Lemons' },
  { value: 'bananas', label: 'Bananas' },
  { value: 'onions', label: 'Onions' },
  { value: 'carrots', label: 'Carrots' },
  { value: 'iceberg-lettuce', label: 'Iceberg Lettuce' },
];

const mockWeighIns = [
  { id: 1, product: 'Roma Tomatoes', po: 'PO-1204', weight: 487, time: '07:15 AM', recordedBy: 'Ali M.' },
  { id: 2, product: 'Cucumbers', po: 'PO-1205', weight: 298, time: '07:32 AM', recordedBy: 'Ali M.' },
  { id: 3, product: 'Bell Peppers', po: 'PO-1206', weight: 185, time: '07:48 AM', recordedBy: 'Hassan K.' },
  { id: 4, product: 'Potatoes', po: 'PO-1207', weight: 795, time: '08:05 AM', recordedBy: 'Ali M.' },
  { id: 5, product: 'Avocados', po: 'PO-1208', weight: 92, time: '08:20 AM', recordedBy: 'Hassan K.' },
  { id: 6, product: 'Bananas', po: 'PO-1209', weight: 398, time: '08:35 AM', recordedBy: 'Ali M.' },
  { id: 7, product: 'Onions', po: 'PO-1210', weight: 575, time: '08:52 AM', recordedBy: 'Hassan K.' },
  { id: 8, product: 'Lemons', po: 'PO-1211', weight: 248, time: '09:10 AM', recordedBy: 'Ali M.' },
];

const mockInventoryCount = [
  { id: 1, product: 'Roma Tomatoes', grade: 'Extra', systemCount: 120, physicalCount: '', discrepancy: null },
  { id: 2, product: 'Roma Tomatoes', grade: 'Quality A', systemCount: 85, physicalCount: '83', discrepancy: -2 },
  { id: 3, product: 'Cucumbers', grade: 'Extra', systemCount: 150, physicalCount: '150', discrepancy: 0 },
  { id: 4, product: 'Cucumbers', grade: 'Quality A', systemCount: 200, physicalCount: '198', discrepancy: -2 },
  { id: 5, product: 'Bell Peppers', grade: 'Extra', systemCount: 40, physicalCount: '', discrepancy: null },
  { id: 6, product: 'Bell Peppers', grade: 'Quality A', systemCount: 50, physicalCount: '50', discrepancy: 0 },
  { id: 7, product: 'Potatoes', grade: 'Quality C', systemCount: 350, physicalCount: '342', discrepancy: -8 },
  { id: 8, product: 'Avocados', grade: 'Extra', systemCount: 40, physicalCount: '', discrepancy: null },
  { id: 9, product: 'Bananas', grade: 'Quality A', systemCount: 300, physicalCount: '300', discrepancy: 0 },
  { id: 10, product: 'Onions', grade: 'Quality C', systemCount: 380, physicalCount: '', discrepancy: null },
  { id: 11, product: 'Lemons', grade: 'Quality A', systemCount: 180, physicalCount: '178', discrepancy: -2 },
  { id: 12, product: 'Carrots', grade: 'Quality A', systemCount: 400, physicalCount: '400', discrepancy: 0 },
];

const weighInColumns = [
  { accessorKey: 'product', header: 'Product' },
  { accessorKey: 'po', header: 'PO #' },
  { accessorKey: 'weight', header: 'Recorded Weight (kg)' },
  { accessorKey: 'time', header: 'Time' },
  { accessorKey: 'recordedBy', header: 'Recorded By' },
];

function Receiving() {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [weight, setWeight] = useState('');
  const [inventoryData, setInventoryData] = useState(mockInventoryCount);

  const { data: apiData } = useFetch('/receiving/today');

  const completedCount = inventoryData.filter((i) => i.physicalCount !== '').length;
  const totalCount = inventoryData.length;
  const countStatus = completedCount === totalCount ? 'Completed' : completedCount > 0 ? 'In Progress' : 'Not Started';

  const inventoryColumns = [
    { accessorKey: 'product', header: 'Product' },
    { accessorKey: 'grade', header: 'Grade' },
    { accessorKey: 'systemCount', header: 'System Count (kg)' },
    {
      accessorKey: 'physicalCount',
      header: 'Physical Count (kg)',
      cell: ({ row }) => (
        <Input
          type="number"
          className="w-24 h-8 text-sm"
          placeholder="--"
          value={row.original.physicalCount}
          onChange={(e) => {
            const newVal = e.target.value;
            setInventoryData((prev) =>
              prev.map((item) =>
                item.id === row.original.id
                  ? { ...item, physicalCount: newVal, discrepancy: newVal ? Number(newVal) - item.systemCount : null }
                  : item
              )
            );
          }}
        />
      ),
    },
    {
      accessorKey: 'discrepancy',
      header: 'Discrepancy',
      cell: ({ row }) => {
        const v = row.original.discrepancy;
        return v === null ? (
          <span className="text-brand-muted">--</span>
        ) : (
          <span className={v !== 0 ? 'text-brand-error font-semibold' : 'text-brand-success font-semibold'}>
            {v > 0 ? '+' : ''}{v}
          </span>
        );
      },
    },
  ];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-8"
    >
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl font-bold text-brand-primary">Receiving Dashboard</h1>
        <p className="text-brand-secondary text-sm mt-1">Product weighing and daily inventory counts</p>
      </motion.div>

      {/* Section 1: Incoming Product Weighing */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Scale className="w-5 h-5 text-brand-accent" />
              <h2 className="text-lg font-semibold text-brand-primary">Incoming Product Weighing</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Product</label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {productOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Weight (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-1" /> Record Weight
                </Button>
              </div>
            </div>

            <DataTable
              columns={weighInColumns}
              data={apiData?.weighIns || mockWeighIns}
              searchPlaceholder="Search weigh-ins..."
              searchColumn="product"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Section 2: Daily Inventory Count */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-brand-accent" />
                <h2 className="text-lg font-semibold text-brand-primary">Daily Inventory Count</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {countStatus === 'Completed' && <Check className="w-4 h-4 text-brand-success" />}
                  {countStatus === 'In Progress' && <Clock className="w-4 h-4 text-brand-warning" />}
                  {countStatus === 'Not Started' && <AlertCircle className="w-4 h-4 text-brand-muted" />}
                  <Badge variant={countStatus === 'Completed' ? 'success' : countStatus === 'In Progress' ? 'warning' : 'default'}>
                    {countStatus} ({completedCount}/{totalCount})
                  </Badge>
                </div>
                <Button disabled={completedCount < totalCount}>
                  Submit Inventory Count
                </Button>
              </div>
            </div>

            <DataTable
              columns={inventoryColumns}
              data={inventoryData}
              searchPlaceholder="Search products..."
              searchColumn="product"
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export { Receiving };
export default Receiving;
