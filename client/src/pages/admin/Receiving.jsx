import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, ClipboardList, Plus, Check, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/tables/DataTable';
import { useFetch } from '@/hooks/useFetch';
import api from '@/services/api';
import { toast } from 'sonner';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const UNIT_LABELS = { kg: 'Kg', piece: 'Piece', bags: 'Bags', box: 'Box' };
const UNIT_OPTIONS = [
  { value: 'kg', label: 'Weight (Kg)' },
  { value: 'piece', label: 'Piece' },
  { value: 'bags', label: 'Bags' },
  { value: 'box', label: 'Box' },
];
const prettyUnit = (u) => UNIT_LABELS[u] || u || 'unit';
const isWeight = (u) => u === 'kg';
const quantityLabel = (u) => (isWeight(u) ? `Weight (${prettyUnit(u)})` : `Count (${prettyUnit(u)})`);

const weighInColumns = [
  { accessorKey: 'product', header: 'Product' },
  { accessorKey: 'po', header: 'PO #' },
  {
    accessorKey: 'quantity',
    header: 'Received',
    cell: ({ row }) => `${row.original.quantity} ${prettyUnit(row.original.unit)}`,
  },
  { accessorKey: 'time', header: 'Time' },
  { accessorKey: 'recordedBy', header: 'Recorded By' },
];

function Receiving() {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('kg');
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: productsData } = useFetch('/products');
  const { data: stockData } = useFetch('/inventory/stock');
  const { data: movementsData, refetch: refetchMovements } = useFetch('/inventory/movements?page=1&limit=50');
  const { data: spotChecksData, refetch: refetchSpotChecks } = useFetch('/inventory/spot-checks');

  const products = productsData?.data || productsData || [];
  const currentProduct = products.find((p) => p.id === selectedProduct);

  // When a product is picked, pre-fill the unit dropdown with its configured unit
  const onPickProduct = (v) => {
    setSelectedProduct(v);
    setSelectedGradeId('');
    const prod = products.find((p) => p.id === v);
    if (prod?.unit && UNIT_LABELS[prod.unit]) setSelectedUnit(prod.unit);
  };

  // Build receivings from recent PURCHASE_IN movements
  const weighIns = (movementsData?.data || [])
    .filter((m) => m.type === 'PURCHASE_IN')
    .map((m) => ({
      id: m.id,
      product: m.product?.name || '',
      unit: m.product?.unit || 'kg',
      po: m.reference || '',
      quantity: m.quantity,
      time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
      recordedBy: m.createdBy?.name || '',
    }));

  // Build inventory count from stock data
  const stockItems = stockData || [];
  const initialInventoryCount = stockItems.flatMap((item) =>
    (item.grades || []).map((g) => ({
      id: `${item.product.id}-${g.id}`,
      productId: item.product.id,
      qualityGradeId: g.id,
      product: item.product.name,
      unit: item.product.unit || 'kg',
      grade: g.clientFacingGrade || g.grade,
      systemCount: g.currentStock,
      physicalCount: '',
      discrepancy: null,
    }))
  );

  const [inventoryData, setInventoryData] = useState([]);

  // Sync inventory data when stock loads
  React.useEffect(() => {
    if (stockItems.length > 0) {
      setInventoryData(initialInventoryCount);
    }
  }, [stockData]);

  const completedCount = inventoryData.filter((i) => i.physicalCount !== '').length;
  const totalCount = inventoryData.length;
  const countStatus = completedCount === totalCount ? 'Completed' : completedCount > 0 ? 'In Progress' : 'Not Started';

  const handleRecordWeight = async () => {
    if (!selectedProduct || !selectedGradeId || !quantity) {
      toast.error(`Please select a product, grade, and enter ${isWeight(selectedUnit) ? 'weight' : 'count'}`);
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/inventory/movements', {
        productId: selectedProduct,
        qualityGradeId: selectedGradeId,
        type: 'PURCHASE_IN',
        quantity: Number(quantity),
        reference: reference,
      });
      toast.success('Receiving recorded');
      setQuantity('');
      setReference('');
      refetchMovements();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to record receiving');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitSpotChecks = async () => {
    const completed = inventoryData.filter((i) => i.physicalCount !== '' && i.productId && i.qualityGradeId);
    if (completed.length === 0) {
      toast.error('No counts to submit');
      return;
    }
    setSubmitting(true);
    try {
      for (const item of completed) {
        await api.post('/inventory/spot-checks', {
          productId: item.productId,
          qualityGradeId: item.qualityGradeId,
          systemCount: item.systemCount,
          physicalCount: Number(item.physicalCount),
        });
      }
      toast.success('Inventory counts submitted');
      refetchSpotChecks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit counts');
    } finally {
      setSubmitting(false);
    }
  };

  const inventoryColumns = [
    { accessorKey: 'product', header: 'Product' },
    { accessorKey: 'grade', header: 'Grade' },
    {
      accessorKey: 'unit',
      header: 'Unit',
      cell: ({ row }) => <Badge variant="outline" className="text-[10px]">{prettyUnit(row.original.unit)}</Badge>,
    },
    {
      accessorKey: 'systemCount',
      header: 'System',
      cell: ({ row }) => `${row.original.systemCount} ${prettyUnit(row.original.unit)}`,
    },
    {
      accessorKey: 'physicalCount',
      header: 'Physical',
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
      className="space-y-4 lg:space-y-8"
    >
      <motion.div variants={fadeInUp} className="hidden lg:block">
        <h1 className="text-2xl font-bold text-brand-primary">Receiving Dashboard</h1>
        <p className="text-brand-secondary text-sm mt-1">Log incoming products by weight or unit count</p>
      </motion.div>

      {/* Section 1: Incoming Products */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-brand-accent" />
              <h2 className="text-lg font-semibold text-brand-primary">Incoming Products</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Product</label>
                <Select value={selectedProduct} onValueChange={onPickProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Grade</label>
                <Select value={selectedGradeId} onValueChange={setSelectedGradeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(currentProduct?.qualityGrades || []).map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.clientFacingGrade || g.grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Unit</label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-brand-secondary text-sm mb-1">{quantityLabel(selectedUnit)}</label>
                <Input
                  type="number"
                  inputMode={isWeight(selectedUnit) ? 'decimal' : 'numeric'}
                  step={isWeight(selectedUnit) ? '0.1' : '1'}
                  min="0"
                  placeholder={isWeight(selectedUnit) ? '0.0' : '0'}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Reference (PO#)</label>
                <Input placeholder="Optional" value={reference} onChange={(e) => setReference(e.target.value)} />
              </div>
              <div className="flex items-end col-span-2 sm:col-span-3 lg:col-span-1">
                <Button className="w-full" onClick={handleRecordWeight} disabled={submitting}>
                  <Plus className="w-4 h-4 mr-1" /> {submitting ? 'Recording...' : (isWeight(selectedUnit) ? 'Record Weight' : 'Record Count')}
                </Button>
              </div>
            </div>

            <DataTable
              columns={weighInColumns}
              data={weighIns}
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
                <Button disabled={completedCount < totalCount || submitting} onClick={handleSubmitSpotChecks}>
                  {submitting ? 'Submitting...' : 'Submit Inventory Count'}
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
