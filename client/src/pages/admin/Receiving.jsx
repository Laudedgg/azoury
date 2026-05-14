import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, ClipboardList, Plus, Check, Clock, AlertCircle, Printer, FileText, Loader2, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { printTable } from '@/utils/print';
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

const UNIT_LABELS = { kg: 'Kg', piece: 'Piece', bags: 'Bags', box: 'Box', bunch: 'Bunch' };
const UNIT_OPTIONS = [
  { value: 'kg', label: 'Weight (Kg)' },
  { value: 'piece', label: 'Piece' },
  { value: 'bags', label: 'Bags' },
  { value: 'box', label: 'Box' },
  { value: 'bunch', label: 'Bunch' },
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

  // PO receiving state
  const [poDialog, setPoDialog] = useState(null); // full PO object
  const [poReceived, setPoReceived] = useState({}); // poItemId -> string
  const [savingPo, setSavingPo] = useState(false);
  const [loadingPo, setLoadingPo] = useState(false);

  const { data: productsData } = useFetch('/products');
  const { data: stockData } = useFetch('/inventory/stock');
  const { data: movementsData, refetch: refetchMovements } = useFetch('/inventory/movements?page=1&limit=50');
  const { data: spotChecksData, refetch: refetchSpotChecks } = useFetch('/inventory/spot-checks');
  const { data: poData, refetch: refetchPOs } = useFetch('/suppliers/purchase-orders?status=DRAFT');
  const { data: poSentData, refetch: refetchPOsSent } = useFetch('/suppliers/purchase-orders?status=SENT');
  const pendingPOs = [
    ...((poData?.data || []).map((p) => ({ ...p, _statusLabel: 'Draft' }))),
    ...((poSentData?.data || []).map((p) => ({ ...p, _statusLabel: 'Sent' }))),
  ];

  const openPoDialog = async (poId) => {
    setLoadingPo(true);
    try {
      const res = await api.get(`/suppliers/purchase-orders/${poId}`);
      setPoDialog(res.data);
      const initial = {};
      for (const it of res.data.items) {
        initial[it.id] = String(it.receivedQuantity ?? it.quantity ?? '');
      }
      setPoReceived(initial);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to load purchase order');
    } finally {
      setLoadingPo(false);
    }
  };

  const closePoDialog = () => { setPoDialog(null); setPoReceived({}); };

  const handleReceivePO = async () => {
    if (!poDialog) return;
    const items = poDialog.items.map((it) => ({
      id: it.id,
      receivedQuantity: Number(poReceived[it.id] ?? 0),
    }));
    for (const it of items) {
      if (Number.isNaN(it.receivedQuantity) || it.receivedQuantity < 0) {
        toast.error('Received quantities must be non-negative numbers');
        return;
      }
    }
    setSavingPo(true);
    try {
      await api.patch(`/suppliers/purchase-orders/${poDialog.id}/status`, {
        status: 'RECEIVED',
        items,
      });
      toast.success('Purchase order received — inventory updated');
      closePoDialog();
      refetchPOs();
      refetchPOsSent();
      refetchMovements();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to mark received');
    } finally {
      setSavingPo(false);
    }
  };

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
      <motion.div variants={fadeInUp} className="flex flex-col-reverse gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold text-brand-primary">Receiving Dashboard</h1>
          <p className="text-brand-secondary text-sm mt-1">Log incoming products by weight or unit count</p>
        </div>
        <Button
          variant="outline"
          className="w-full lg:w-auto no-print"
          onClick={() => printTable({
            title: 'Receiving Log',
            subtitle: 'Incoming products',
            columns: [
              { key: 'product', label: 'Product' },
              { key: 'po', label: 'PO #' },
              { key: 'qtyFmt', label: 'Received', align: 'right' },
              { key: 'time', label: 'Time' },
              { key: 'recordedBy', label: 'Recorded By' },
            ],
            rows: weighIns.map((w) => ({ ...w, qtyFmt: `${w.quantity} ${prettyUnit(w.unit)}` })),
          })}
        >
          <Printer className="w-4 h-4 mr-2" /> Print log
        </Button>
      </motion.div>

      {/* Section 0: Receive Purchase Orders */}
      <motion.div variants={fadeInUp}>
        <Card className="border-brand-accent/30 bg-brand-accent/5">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-brand-accent" />
              <h2 className="text-lg font-semibold text-brand-primary">Receive Purchase Orders</h2>
              <Badge variant="outline" className="ml-1 text-[10px]">{pendingPOs.length} pending</Badge>
            </div>
            <p className="text-brand-secondary text-xs mb-4">
              Open each PO, enter what actually arrived per line, and submit. Inventory updates
              automatically; missing items are flagged so purchasing can be notified.
            </p>

            {pendingPOs.length === 0 ? (
              <p className="text-brand-muted text-sm py-4 text-center">
                No purchase orders to receive right now. Purchasing can save buy lists from Combined Orders.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingPOs.map((po) => (
                  <Card key={po.id} className="border-brand-border hover:border-brand-accent/50 cursor-pointer transition-colors" onClick={() => openPoDialog(po.id)}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-brand-accent text-xs">PO {po.id.slice(0, 8)}</span>
                        <Badge variant={po._statusLabel === 'Draft' ? 'warning' : 'accent'} className="text-[10px]">{po._statusLabel}</Badge>
                      </div>
                      <p className="text-brand-primary text-sm font-medium truncate">{po.supplier?.name || 'Unassigned supplier'}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-brand-muted text-xs">{po._count?.items ?? 0} item{(po._count?.items ?? 0) === 1 ? '' : 's'}</span>
                        <span className="text-brand-muted text-xs">{new Date(po.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* PO Receive Dialog */}
      <Dialog open={!!poDialog} onOpenChange={(open) => { if (!open) closePoDialog(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receive PO {poDialog?.id?.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          {loadingPo ? (
            <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-accent" /></div>
          ) : poDialog && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-brand-muted text-xs">Supplier</p><p className="text-brand-primary font-medium">{poDialog.supplier?.name || 'Unassigned'}</p></div>
                <div><p className="text-brand-muted text-xs">Created</p><p className="text-brand-primary">{new Date(poDialog.createdAt).toLocaleString()}</p></div>
              </div>
              {poDialog.notes && (
                <div className="text-sm bg-brand-elevated p-3 rounded-lg">
                  <p className="text-brand-muted text-xs mb-1">Notes</p>
                  <p className="text-brand-primary">{poDialog.notes}</p>
                </div>
              )}
              <div className="rounded-lg border border-brand-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-brand-base">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs uppercase tracking-wider text-brand-secondary">Product</th>
                      <th className="text-right px-3 py-2 text-xs uppercase tracking-wider text-brand-secondary">Ordered</th>
                      <th className="text-right px-3 py-2 text-xs uppercase tracking-wider text-brand-accent">Received</th>
                      <th className="text-right px-3 py-2 text-xs uppercase tracking-wider text-brand-secondary">Missing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poDialog.items.map((it) => {
                      const received = Number(poReceived[it.id] ?? 0) || 0;
                      const missing = Math.max(0, (it.quantity || 0) - received);
                      return (
                        <tr key={it.id} className="border-t border-brand-border">
                          <td className="px-3 py-2 text-brand-primary">{it.product?.name}</td>
                          <td className="px-3 py-2 text-right text-brand-secondary">{it.quantity} {it.product?.unit || ''}</td>
                          <td className="px-3 py-2 text-right">
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              value={poReceived[it.id] ?? ''}
                              onChange={(e) => setPoReceived((m) => ({ ...m, [it.id]: e.target.value }))}
                              className="w-24 h-8 text-right text-sm inline-block"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            {missing > 0
                              ? <span className="text-brand-error font-medium">{missing} {it.product?.unit || ''}</span>
                              : <span className="text-brand-success text-xs">OK</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Button className="w-full" onClick={handleReceivePO} disabled={savingPo}>
                {savingPo ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating inventory...</> : 'Mark Received & Update Inventory'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
