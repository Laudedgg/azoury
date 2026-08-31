import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, ClipboardList, Plus, Printer, FileText, Loader2, Truck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { useAuth } from '@/context/AuthContext';
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
  {
    accessorKey: 'quantity',
    header: 'Received',
    cell: ({ row }) => `${row.original.quantity} ${prettyUnit(row.original.unit)}`,
  },
  { accessorKey: 'supplier', header: 'Supplier', cell: ({ row }) => row.original.supplier || '—' },
  { accessorKey: 'po', header: 'PO / Ref' },
  { accessorKey: 'time', header: 'Time' },
  { accessorKey: 'recordedBy', header: 'By' },
  {
    accessorKey: 'photo',
    header: '📷',
    cell: ({ row }) => row.original.photo
      ? <a href={row.original.photo} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline text-xs">View</a>
      : <span className="text-brand-muted text-xs">—</span>,
  },
];

function Receiving() {
  const { user } = useAuth();
  const canAddSupplier = ['SUPER_ADMIN', 'PURCHASE_MANAGER', 'OPERATIONS_MANAGER'].includes(user?.role);

  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('kg');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  // Add supplier dialog
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: '', contactPerson: '', email: '', phone: '', address: '' });
  const [savingSupplier, setSavingSupplier] = useState(false);

  // PO receiving state
  const [poDialog, setPoDialog] = useState(null); // full PO object
  const [poReceived, setPoReceived] = useState({}); // poItemId -> string
  const [savingPo, setSavingPo] = useState(false);
  const [loadingPo, setLoadingPo] = useState(false);

  const { data: productsData } = useFetch('/products');
  const { data: movementsData, refetch: refetchMovements } = useFetch('/inventory/movements?page=1&limit=200');
  const { data: poData, refetch: refetchPOs } = useFetch('/suppliers/purchase-orders?status=DRAFT');
  const { data: poSentData, refetch: refetchPOsSent } = useFetch('/suppliers/purchase-orders?status=SENT');
  const { data: suppliersData, refetch: refetchSuppliers } = useFetch('/suppliers');
  const suppliers = suppliersData?.data || suppliersData || [];
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

  // Build receivings from PURCHASE_IN movements. The reference string may
  // contain "Supplier: X · PO#1234" — split it into columns for display.
  const parseSupplierFromRef = (ref) => {
    if (!ref) return { supplier: '', po: '' };
    const parts = ref.split('·').map((p) => p.trim());
    let supplier = '';
    let poParts = [];
    for (const p of parts) {
      if (p.toLowerCase().startsWith('supplier:')) {
        supplier = p.slice(9).trim();
      } else {
        poParts.push(p);
      }
    }
    return { supplier, po: poParts.join(' · ') };
  };

  const allWeighIns = (movementsData?.data || [])
    .filter((m) => m.type === 'PURCHASE_IN')
    .map((m) => {
      const { supplier, po } = parseSupplierFromRef(m.reference);
      return {
        id: m.id,
        product: m.product?.name || '',
        unit: m.product?.unit || 'kg',
        po,
        supplier,
        quantity: m.quantity,
        createdAt: m.createdAt,
        time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
        recordedBy: m.createdBy ? `${m.createdBy.firstName || ''} ${m.createdBy.lastName || ''}`.trim() : '',
        photo: m.imageUrl ? (m.imageUrl.startsWith('http') ? m.imageUrl : m.imageUrl) : null,
      };
    });

  const startOfToday = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();
  const todayWeighIns = allWeighIns.filter((w) => w.createdAt && new Date(w.createdAt).getTime() >= startOfToday);
  const archiveWeighIns = allWeighIns.filter((w) => w.createdAt && new Date(w.createdAt).getTime() < startOfToday);

  const handleRecordWeight = async () => {
    if (!selectedProduct || !selectedGradeId || !quantity) {
      toast.error(`Please select a product, grade, and enter ${isWeight(selectedUnit) ? 'weight' : 'count'}`);
      return;
    }
    const supplierName = suppliers.find((s) => s.id === selectedSupplier)?.name;
    const refParts = [];
    if (supplierName) refParts.push(`Supplier: ${supplierName}`);
    if (reference?.trim()) refParts.push(reference.trim());
    const combinedRef = refParts.join(' · ');

    setSubmitting(true);
    try {
      // Multipart when a photo is attached; JSON otherwise.
      // NOTE: intentionally NOT setting Content-Type — axios auto-sets it
      // to `multipart/form-data; boundary=...` when it sees a FormData.
      // Setting it manually strips the boundary and the server can't parse
      // the body.
      if (photoFile) {
        const fd = new FormData();
        fd.append('productId', selectedProduct);
        fd.append('qualityGradeId', selectedGradeId);
        fd.append('type', 'PURCHASE_IN');
        fd.append('quantity', String(Number(quantity)));
        if (combinedRef) fd.append('reference', combinedRef);
        if (supplierName) fd.append('notes', `From supplier: ${supplierName}`);
        fd.append('photo', photoFile);
        await api.post('/inventory/movements', fd);
      } else {
        await api.post('/inventory/movements', {
          productId: selectedProduct,
          qualityGradeId: selectedGradeId,
          type: 'PURCHASE_IN',
          quantity: Number(quantity),
          reference: combinedRef || undefined,
          notes: supplierName ? `From supplier: ${supplierName}` : undefined,
        });
      }
      toast.success(supplierName ? `Recorded from ${supplierName}` : 'Receiving recorded');
      setQuantity('');
      setReference('');
      setPhotoFile(null);
      // Keep supplier selected — chef often logs multiple items from same supplier
      refetchMovements();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to record receiving');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSupplier = async () => {
    if (!supplierForm.name?.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    setSavingSupplier(true);
    try {
      const res = await api.post('/suppliers', supplierForm);
      toast.success(`Added supplier: ${res.data.name}`);
      setAddSupplierOpen(false);
      setSupplierForm({ name: '', contactPerson: '', email: '', phone: '', address: '' });
      await refetchSuppliers();
      // Auto-select the newly-created supplier
      setSelectedSupplier(res.data.id);
    } catch (err) {
      const resp = err?.response?.data;
      toast.error(resp?.error || resp?.message || 'Failed to add supplier');
    } finally {
      setSavingSupplier(false);
    }
  };


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
            rows: todayWeighIns.map((w) => ({ ...w, qtyFmt: `${w.quantity} ${prettyUnit(w.unit)}` })),
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

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
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
              <div className="col-span-2 sm:col-span-3 lg:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-brand-secondary text-sm">Supplier</label>
                  {canAddSupplier && (
                    <button
                      type="button"
                      onClick={() => setAddSupplierOpen(true)}
                      className="text-[11px] text-brand-accent hover:text-brand-accent-hover inline-flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Add new
                    </button>
                  )}
                </div>
                <Select value={selectedSupplier} onValueChange={(v) => setSelectedSupplier(v === '__none__' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={suppliers.length === 0 ? 'No suppliers yet' : 'Pick a supplier…'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— No supplier —</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reference + Photo row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-brand-secondary text-sm mb-1">Reference (PO# or note)</label>
                <Input placeholder="Optional — e.g. Truck ABC-123, invoice #4421" value={reference} onChange={(e) => setReference(e.target.value)} />
              </div>
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Photo (optional)</label>
                <div className="flex items-stretch gap-2">
                  <label className="flex-1 h-10 flex items-center justify-center gap-2 rounded-lg border border-dashed border-brand-border bg-brand-surface hover:border-brand-accent/50 cursor-pointer transition-colors text-sm text-brand-secondary">
                    {photoFile ? (
                      <span className="truncate max-w-[160px]">{photoFile.name}</span>
                    ) : (
                      <><Plus className="w-4 h-4" /> Attach photo</>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {photoFile && (
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => setPhotoFile(null)} title="Remove photo">
                      ×
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Action row */}
            <div className="flex justify-end mb-6">
              <Button className="w-full sm:w-auto" onClick={handleRecordWeight} disabled={submitting}>
                <Plus className="w-4 h-4 mr-1" /> {submitting ? 'Recording...' : (isWeight(selectedUnit) ? 'Record Weight' : 'Record Count')}
              </Button>
            </div>

            {/* Add Supplier Dialog */}
            <Dialog open={addSupplierOpen} onOpenChange={setAddSupplierOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2"><Truck className="w-4 h-4 text-brand-accent" /> Add supplier</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="block text-brand-secondary text-xs mb-1">Name <span className="text-brand-accent">*</span></label>
                    <Input value={supplierForm.name} onChange={(e) => setSupplierForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Al-Arz Fresh Produce" autoFocus />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-brand-secondary text-xs mb-1">Contact person</label>
                      <Input value={supplierForm.contactPerson} onChange={(e) => setSupplierForm((f) => ({ ...f, contactPerson: e.target.value }))} placeholder="Full name" />
                    </div>
                    <div>
                      <label className="block text-brand-secondary text-xs mb-1">Phone</label>
                      <Input value={supplierForm.phone} onChange={(e) => setSupplierForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+961 …" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-brand-secondary text-xs mb-1">Email</label>
                    <Input type="email" value={supplierForm.email} onChange={(e) => setSupplierForm((f) => ({ ...f, email: e.target.value }))} placeholder="orders@supplier.lb" />
                  </div>
                  <div>
                    <label className="block text-brand-secondary text-xs mb-1">Address</label>
                    <Input value={supplierForm.address} onChange={(e) => setSupplierForm((f) => ({ ...f, address: e.target.value }))} placeholder="Bekaa, Beirut, …" />
                  </div>
                  <p className="text-[11px] text-brand-muted">Only name is required — fill the rest later from the supplier detail page.</p>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" className="flex-1" onClick={() => setAddSupplierOpen(false)} disabled={savingSupplier}>Cancel</Button>
                    <Button className="flex-1" onClick={handleAddSupplier} disabled={savingSupplier || !supplierForm.name?.trim()}>
                      {savingSupplier ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding…</> : 'Add supplier'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Today's receipts */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-brand-primary font-semibold text-sm">
                Today's receipts
                <span className="text-brand-muted text-xs font-normal ml-2">
                  ({todayWeighIns.length})
                </span>
              </p>
              {archiveWeighIns.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowArchive((s) => !s)}
                  className="text-xs text-brand-accent hover:text-brand-accent-hover"
                >
                  {showArchive ? 'Hide archive' : `View archive (${archiveWeighIns.length})`}
                </button>
              )}
            </div>
            <DataTable
              columns={weighInColumns}
              data={todayWeighIns}
              searchPlaceholder="Search today's receipts..."
              searchColumn="product"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Archive — collapsible, shows older receipts */}
      {showArchive && archiveWeighIns.length > 0 && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="w-4 h-4 text-brand-muted" />
                <p className="text-brand-primary font-semibold text-sm">Archive — older receipts</p>
                <Badge variant="muted" className="text-[10px] ml-1">{archiveWeighIns.length}</Badge>
              </div>
              <DataTable
                columns={weighInColumns}
                data={archiveWeighIns}
                searchPlaceholder="Search archive..."
                searchColumn="product"
              />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

export { Receiving };
export default Receiving;
