import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Truck, MapPin, DollarSign, RotateCcw, AlertTriangle, Package, Check, X,
  ClipboardList, Loader2, ChevronDown, Plus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { DataTable } from '@/components/tables/DataTable';
import { useFetch } from '@/hooks/useFetch';
import api from '@/services/api';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/helpers';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const statusVariant = (s) => ({ Pending: 'warning', Confirmed: 'accent', Preparing: 'accent', Ready: 'success', Dispatched: 'accent', 'In Transit': 'accent', Delivered: 'success', Planned: 'default', 'Under Review': 'warning', Approved: 'success', Rejected: 'error' }[s] || 'default');

const UNIT_LABELS = { kg: 'Kg', piece: 'Piece', bags: 'Bags', box: 'Box' };
const prettyUnit = (u) => UNIT_LABELS[u] || u || 'unit';
const titleCase = (s) => s ? s.charAt(0) + s.slice(1).toLowerCase() : '';

const routeColumns = [
  { accessorKey: 'truck', header: 'Truck' },
  { accessorKey: 'driver', header: 'Driver' },
  { accessorKey: 'clients', header: 'Clients' },
  { accessorKey: 'stops', header: 'Stops' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={statusVariant(row.original.status)}>{row.original.status}</Badge> },
  {
    accessorKey: 'id',
    header: 'Action',
    cell: ({ row }) => row.original.status === 'Planned' ? <Button size="sm">Dispatch</Button> : null,
  },
];

const pricingColumns = [
  { accessorKey: 'product', header: 'Product' },
  { accessorKey: 'extraPrice', header: 'Extra', cell: ({ row }) => formatCurrency(row.original.extraPrice) },
  { accessorKey: 'qualityAPrice', header: 'Quality A', cell: ({ row }) => formatCurrency(row.original.qualityAPrice) },
  { accessorKey: 'qualityCPrice', header: 'Cooking', cell: ({ row }) => formatCurrency(row.original.qualityCPrice) },
  { accessorKey: 'margin', header: 'Margin %', cell: ({ row }) => <span className={row.original.margin >= 30 ? 'text-brand-success font-semibold' : 'text-brand-warning font-semibold'}>{row.original.margin}%</span> },
];

const makeReturnColumns = (onReview) => [
  { accessorKey: 'client', header: 'Client' },
  { accessorKey: 'orderNum', header: 'Order #' },
  { accessorKey: 'type', header: 'Type', cell: ({ row }) => <Badge variant={row.original.type === 'Return' ? 'error' : 'warning'}>{row.original.type}</Badge> },
  { accessorKey: 'reason', header: 'Reason' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={statusVariant(row.original.status)}>{row.original.status}</Badge> },
  {
    id: 'action',
    header: 'Action',
    cell: ({ row }) => row.original.status === 'Pending' ? <Button size="sm" variant="outline" onClick={() => onReview(row.original)}>Review</Button> : null,
  },
];

const urgentColumns = [
  { accessorKey: 'product', header: 'Product' },
  { accessorKey: 'qty', header: 'Qty (kg)' },
  { accessorKey: 'supplier', header: 'Supplier' },
  { accessorKey: 'reason', header: 'Reason' },
  { accessorKey: 'time', header: 'Time' },
];

function Operations() {
  const [returnDialog, setReturnDialog] = useState(null);
  const [returnComment, setReturnComment] = useState('');
  const [expandedClient, setExpandedClient] = useState(null);
  const [prepareOrder, setPrepareOrder] = useState(null);
  const [prepareItems, setPrepareItems] = useState([]);
  const [loadingPrepare, setLoadingPrepare] = useState(false);
  const [savingPrepare, setSavingPrepare] = useState(false);
  const [dispatchDialog, setDispatchDialog] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({ driverId: '', truckId: '', orderIds: [] });
  const [creatingDispatch, setCreatingDispatch] = useState(false);

  const { data: ordersData, refetch: refetchOrders } = useFetch('/orders?status=PENDING,CONFIRMED,PREPARING,READY&limit=200');
  const { data: dispatchesData, refetch: refetchDispatches } = useFetch('/dispatches');
  const { data: fleetData } = useFetch('/fleet');
  const { data: productsData } = useFetch('/products');
  const { data: returnsData, refetch: refetchReturns } = useFetch('/orders/returns');
  const { data: driversData } = useFetch('/users/role/DRIVER');
  const drivers = Array.isArray(driversData) ? driversData : (driversData?.data || []);
  const readyOrders = (ordersData?.data || []).filter((o) => o.status === 'READY');

  // Raw orders with per-client grouping
  const rawOrders = ordersData?.data || ordersData || [];

  // Group orders by client business name
  const ordersByClient = useMemo(() => {
    const buckets = {};
    for (const o of rawOrders) {
      const key = o.client?.businessName || o.client || 'Unknown';
      if (!buckets[key]) buckets[key] = { clientName: key, orders: [] };
      buckets[key].orders.push(o);
    }
    return Object.values(buckets).sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [rawOrders]);

  const routesItems = useMemo(() => {
    const raw = dispatchesData?.data || dispatchesData || [];
    return raw.map((d) => ({
      id: d.id,
      truck: d.truck?.plateNumber || d.truck || '',
      driver: d.driver?.name || d.driver || '',
      clients: d.routeOrder || '',
      stops: d._count?.items || 0,
      status: d.status ? titleCase(d.status) : 'Planned',
    }));
  }, [dispatchesData]);

  const truckCards = useMemo(() => {
    const raw = fleetData?.data || fleetData || [];
    return raw.map((v) => ({
      plate: v.plateNumber || v.plate || '',
      model: v.model || '',
      status: v.status ? titleCase(v.status).replace('_', ' ') : 'Available',
    }));
  }, [fleetData]);

  const pricingItems = useMemo(() => {
    const raw = productsData?.data || productsData || [];
    return raw.map((p) => {
      const grades = p.qualityGrades || [];
      const extraGrade = grades.find((g) => g.grade === 'Extra' || g.clientFacingGrade === 'EXTRA');
      const qualityAGrade = grades.find((g) => g.grade === 'A' || g.clientFacingGrade === 'QUALITY_A');
      const qualityCGrade = grades.find((g) => g.grade === 'C' || g.clientFacingGrade === 'QUALITY_C');
      return {
        id: p.id,
        product: p.name,
        extraPrice: extraGrade?.price || 0,
        qualityAPrice: qualityAGrade?.price || 0,
        qualityCPrice: qualityCGrade?.price || 0,
        margin: 0,
      };
    });
  }, [productsData]);

  const returnsItems = useMemo(() => {
    const raw = returnsData?.data || returnsData || [];
    return raw.map((r) => ({
      id: r.id,
      client: r.clientOrder?.client?.businessName || r.clientOrder?.client?.name || '',
      orderNum: r.clientOrderId ? `#${r.clientOrderId}` : '',
      type: r.type || 'Return',
      reason: r.reason || '',
      status: r.opsManagerApproval === 'APPROVED' ? 'Approved' : r.opsManagerApproval === 'REJECTED' ? 'Rejected' : 'Pending',
    }));
  }, [returnsData]);

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      toast.success(`Order ${titleCase(status)}`);
      refetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleReturnAction = async (returnId, approval) => {
    if (!returnComment.trim()) return;
    try {
      await api.patch(`/orders/returns/${returnId}`, {
        opsManagerApproval: approval,
        opsManagerComment: returnComment,
      });
      toast.success(`Return ${approval.toLowerCase()}`);
      setReturnDialog(null);
      setReturnComment('');
      refetchReturns();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update return');
    }
  };

  const openPrepareDialog = async (orderId) => {
    setLoadingPrepare(true);
    setPrepareOrder({ id: orderId, _loading: true });
    try {
      const res = await api.get(`/orders/${orderId}`);
      const o = res.data;
      setPrepareOrder(o);
      setPrepareItems((o.items || []).map((it) => ({
        orderItemId: it.id,
        productName: it.product?.name || '',
        grade: it.qualityGrade?.clientFacingGrade || it.qualityGrade?.grade || '',
        unit: it.product?.unit || 'kg',
        ordered: it.quantity,
        real: (it.fulfilledQuantity ?? it.quantity ?? 0).toString(),
        stock: it.qualityGrade?.currentStock ?? 0,
      })));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load order');
      setPrepareOrder(null);
    } finally {
      setLoadingPrepare(false);
    }
  };

  const closePrepareDialog = () => {
    setPrepareOrder(null);
    setPrepareItems([]);
  };

  const openDispatchDialog = () => {
    setDispatchForm({ driverId: '', truckId: '', orderIds: [] });
    setDispatchDialog(true);
  };

  const toggleOrderInDispatch = (orderId) => {
    setDispatchForm((f) => ({
      ...f,
      orderIds: f.orderIds.includes(orderId)
        ? f.orderIds.filter((id) => id !== orderId)
        : [...f.orderIds, orderId],
    }));
  };

  const handleCreateDispatch = async () => {
    if (!dispatchForm.driverId || !dispatchForm.truckId) {
      toast.error('Pick a driver and a truck');
      return;
    }
    if (dispatchForm.orderIds.length === 0) {
      toast.error('Select at least one ready order to dispatch');
      return;
    }
    setCreatingDispatch(true);
    try {
      await api.post('/dispatches', {
        driverId: dispatchForm.driverId,
        truckId: dispatchForm.truckId,
        orderIds: dispatchForm.orderIds,
      });
      toast.success('Dispatch created — driver will see it on their device');
      setDispatchDialog(false);
      setDispatchForm({ driverId: '', truckId: '', orderIds: [] });
      refetchDispatches();
      refetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create dispatch');
    } finally {
      setCreatingDispatch(false);
    }
  };

  const handleSavePrepare = async () => {
    if (!prepareOrder || prepareOrder._loading) return;
    for (const it of prepareItems) {
      const v = Number(it.real);
      if (Number.isNaN(v) || v < 0) {
        toast.error(`Enter a valid real quantity for ${it.productName}`);
        return;
      }
    }
    setSavingPrepare(true);
    try {
      await api.patch(`/orders/${prepareOrder.id}/prepare`, {
        items: prepareItems.map((it) => ({ orderItemId: it.orderItemId, realQuantity: Number(it.real) })),
      });
      toast.success('Order prepared — inventory updated');
      closePrepareDialog();
      refetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to prepare order');
    } finally {
      setSavingPrepare(false);
    }
  };

  const returnColumns = useMemo(() => makeReturnColumns(setReturnDialog), []);

  return (
    <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.08 } } }} className="space-y-4 lg:space-y-6">
      <motion.div variants={fadeInUp} className="hidden lg:block">
        <h1 className="text-2xl font-bold text-brand-primary">Operations Management</h1>
        <p className="text-brand-secondary text-sm mt-1">Dispatch per client, routing, pricing, and returns</p>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Tabs defaultValue="dispatch">
          <TabsList>
            <TabsTrigger value="dispatch"><Package className="w-4 h-4 mr-2" /> Dispatch Center</TabsTrigger>
            <TabsTrigger value="routes"><MapPin className="w-4 h-4 mr-2" /> Route Planning</TabsTrigger>
            <TabsTrigger value="pricing"><DollarSign className="w-4 h-4 mr-2" /> Client Pricing</TabsTrigger>
            <TabsTrigger value="returns"><RotateCcw className="w-4 h-4 mr-2" /> Returns</TabsTrigger>
            <TabsTrigger value="urgent"><AlertTriangle className="w-4 h-4 mr-2" /> Urgent</TabsTrigger>
          </TabsList>

          {/* Tab 1: Dispatch — grouped by client */}
          <TabsContent value="dispatch" className="mt-6 space-y-3">
            {ordersByClient.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <Package className="w-10 h-10 mx-auto text-brand-muted mb-3" />
                  <p className="text-brand-primary font-medium">No open orders</p>
                  <p className="text-brand-muted text-sm mt-1">Orders placed by clients will appear here grouped per client.</p>
                </CardContent>
              </Card>
            ) : ordersByClient.map(({ clientName, orders }) => {
              const isExpanded = expandedClient === clientName;
              const totalItems = orders.reduce((s, o) => s + (o._count?.items || o.items?.length || 0), 0);
              return (
                <Card key={clientName}>
                  <CardContent className="p-4">
                    <button
                      className="flex items-center justify-between w-full text-left"
                      onClick={() => setExpandedClient(isExpanded ? null : clientName)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-brand-accent/10 flex items-center justify-center shrink-0">
                          <Truck className="w-4 h-4 text-brand-accent" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-brand-primary font-semibold truncate">{clientName}</p>
                          <p className="text-brand-muted text-xs">{orders.length} order{orders.length === 1 ? '' : 's'} · {totalItems} items</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-brand-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-brand-border space-y-2">
                        {orders.map((o) => {
                          const s = titleCase(o.status);
                          return (
                            <div key={o.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-brand-elevated rounded-lg">
                              <div className="min-w-0">
                                <p className="text-brand-primary text-sm font-medium">Order #{o.id.slice(0, 8)}</p>
                                <p className="text-brand-muted text-xs">
                                  {o._count?.items || 0} items
                                  {o.deliveryDate && ` · Deliver ${new Date(o.deliveryDate).toLocaleDateString()}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={statusVariant(s)}>{s}</Badge>
                                {o.status === 'PENDING' && (
                                  <Button size="sm" onClick={() => handleStatusUpdate(o.id, 'CONFIRMED')}>Confirm</Button>
                                )}
                                {['CONFIRMED', 'PREPARING', 'READY'].includes(o.status) && (
                                  <Button size="sm" variant="outline" onClick={() => openPrepareDialog(o.id)}>
                                    <ClipboardList className="w-3 h-3 mr-1" />
                                    {o.status === 'READY' ? 'Adjust' : 'Prepare'}
                                  </Button>
                                )}
                                {['CONFIRMED', 'PREPARING'].includes(o.status) && (
                                  <Button size="sm" onClick={() => handleStatusUpdate(o.id, 'READY')}>Mark Ready</Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Tab 2: Routes */}
          <TabsContent value="routes" className="mt-6 space-y-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-brand-secondary text-sm">
                Build a dispatch by picking a driver, a truck, and the ready orders to load.
                The driver will see the assigned orders on their device.
              </p>
              <Button className="w-full sm:w-auto" onClick={openDispatchDialog} disabled={readyOrders.length === 0}>
                <Plus className="w-4 h-4 mr-2" /> Create Dispatch
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {truckCards.map((t) => (
                <Card key={t.plate}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Truck className="w-5 h-5 text-brand-accent" />
                      <Badge variant={t.status === 'Available' ? 'success' : 'warning'}>{t.status}</Badge>
                    </div>
                    <p className="text-brand-primary font-semibold">{t.plate}</p>
                    <p className="text-brand-muted text-sm">{t.model}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card><CardContent className="p-6"><DataTable columns={routeColumns} data={routesItems} /></CardContent></Card>
          </TabsContent>

          {/* Tab 3: Pricing */}
          <TabsContent value="pricing" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-brand-secondary text-sm mb-4">Margin is calculated from cost vs. selling price.</p>
                <DataTable columns={pricingColumns} data={pricingItems} searchPlaceholder="Search products..." searchColumn="product" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Returns */}
          <TabsContent value="returns" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <DataTable columns={returnColumns} data={returnsItems} searchPlaceholder="Search returns..." searchColumn="client" />
              </CardContent>
            </Card>

            {returnDialog && (
              <Dialog open onOpenChange={() => { setReturnDialog(null); setReturnComment(''); }}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Return/Amendment Detail</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className="text-brand-muted">Client</p><p className="text-brand-primary font-medium">{returnDialog.client}</p></div>
                      <div><p className="text-brand-muted">Order</p><p className="text-brand-primary font-medium">{returnDialog.orderNum}</p></div>
                    </div>
                    <div><p className="text-brand-muted text-sm mb-1">Reason</p><p className="text-brand-primary text-sm bg-brand-elevated p-3 rounded-lg">{returnDialog.reason}</p></div>
                    <div>
                      <label className="block text-brand-secondary text-sm mb-2">Comment (required)</label>
                      <textarea className="w-full bg-brand-elevated border border-brand-border rounded-lg p-3 text-brand-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-accent resize-none" rows={3} value={returnComment} onChange={(e) => setReturnComment(e.target.value)} />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 text-brand-success" disabled={!returnComment.trim()} onClick={() => handleReturnAction(returnDialog.id, 'APPROVED')}><Check className="w-4 h-4 mr-1" /> Approve</Button>
                      <Button variant="outline" className="flex-1 text-brand-error" disabled={!returnComment.trim()} onClick={() => handleReturnAction(returnDialog.id, 'REJECTED')}><X className="w-4 h-4 mr-1" /> Reject</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* Tab 5: Urgent */}
          <TabsContent value="urgent" className="mt-6 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-brand-primary font-semibold mb-4">Quick Urgent Purchase</h3>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div><label className="block text-brand-secondary text-xs mb-1">Product</label><Input placeholder="Product name" /></div>
                  <div><label className="block text-brand-secondary text-xs mb-1">Qty (kg)</label><Input type="number" placeholder="0" /></div>
                  <div><label className="block text-brand-secondary text-xs mb-1">Supplier</label><Input placeholder="Supplier" /></div>
                  <div><label className="block text-brand-secondary text-xs mb-1">Reason</label><Input placeholder="Why urgent?" /></div>
                  <div className="flex items-end col-span-2 lg:col-span-1"><Button variant="destructive" className="w-full"><AlertTriangle className="w-4 h-4 mr-1" /> Submit</Button></div>
                </div>
              </CardContent>
            </Card>
            <Card><CardContent className="p-6"><DataTable columns={urgentColumns} data={[]} /></CardContent></Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Create Dispatch Dialog */}
      <Dialog open={dispatchDialog} onOpenChange={setDispatchDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Dispatch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Driver *</label>
                <Select value={dispatchForm.driverId} onValueChange={(v) => setDispatchForm((f) => ({ ...f, driverId: v }))}>
                  <SelectTrigger><SelectValue placeholder={drivers.length === 0 ? 'No drivers' : 'Select driver...'} /></SelectTrigger>
                  <SelectContent>
                    {drivers.filter((d) => d.isActive !== false).map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Truck *</label>
                <Select value={dispatchForm.truckId} onValueChange={(v) => setDispatchForm((f) => ({ ...f, truckId: v }))}>
                  <SelectTrigger><SelectValue placeholder={(fleetData?.data || fleetData || []).length === 0 ? 'No trucks' : 'Select truck...'} /></SelectTrigger>
                  <SelectContent>
                    {(fleetData?.data || fleetData || []).map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.plateNumber || v.plate} — {v.model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <p className="text-brand-secondary text-sm mb-2">Ready orders ({readyOrders.length})</p>
              {readyOrders.length === 0 ? (
                <p className="text-brand-muted text-xs italic">No orders are READY. Confirm and prepare orders first via Dispatch Center.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {readyOrders.map((o) => {
                    const checked = dispatchForm.orderIds.includes(o.id);
                    return (
                      <label
                        key={o.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checked ? 'bg-brand-accent/10 border-brand-accent/40' : 'bg-brand-elevated border-brand-border hover:border-brand-accent/30'}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOrderInDispatch(o.id)}
                            className="w-4 h-4 accent-brand-accent shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-brand-primary text-sm font-medium truncate">
                              {o.client?.businessName || 'Unknown client'} · #{o.id.slice(0, 8)}
                            </p>
                            <p className="text-brand-muted text-xs">
                              {o._count?.items || 0} items
                              {o.deliveryDate && ` · Deliver ${new Date(o.deliveryDate).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDispatchDialog(false)} disabled={creatingDispatch}>Cancel</Button>
              <Button className="flex-1" onClick={handleCreateDispatch} disabled={creatingDispatch || dispatchForm.orderIds.length === 0}>
                {creatingDispatch ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : `Create Dispatch (${dispatchForm.orderIds.length})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prepare Order Dialog */}
      <Dialog open={!!prepareOrder} onOpenChange={(o) => { if (!o) closePrepareDialog(); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Prepare Order {prepareOrder && !prepareOrder._loading && `· ${prepareOrder.client?.businessName || ''}`}
            </DialogTitle>
          </DialogHeader>
          {loadingPrepare || prepareOrder?._loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-brand-accent" />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-brand-secondary text-sm">
                Record the <span className="text-brand-primary font-semibold">real quantity</span> picked per line.
                Inventory updates live and the real quantity is what the client is billed for.
              </p>

              <div className="space-y-2">
                {prepareItems.map((it, idx) => {
                  const real = Number(it.real) || 0;
                  const projectedStock = it.stock - (real - (prepareOrder?.items?.[idx]?.fulfilledQuantity || 0));
                  const lowStock = real > it.stock;
                  return (
                    <div key={it.orderItemId} className="p-3 bg-brand-elevated rounded-lg border border-brand-border">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="text-brand-primary font-medium text-sm truncate">{it.productName}</p>
                          <div className="flex items-center gap-2 flex-wrap text-xs text-brand-muted mt-0.5">
                            <Badge variant="outline" className="text-[10px]">{it.grade}</Badge>
                            <span>Unit: {prettyUnit(it.unit)}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-brand-muted text-[10px]">Ordered</p>
                          <p className="text-brand-primary font-semibold">{it.ordered} {prettyUnit(it.unit)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-brand-secondary text-xs mb-1">
                            Real {it.unit === 'kg' ? 'weight' : 'count'} ({prettyUnit(it.unit)}) *
                          </label>
                          <Input
                            type="number"
                            inputMode={it.unit === 'kg' ? 'decimal' : 'numeric'}
                            step={it.unit === 'kg' ? '0.1' : '1'}
                            min="0"
                            value={it.real}
                            onChange={(e) => {
                              const v = e.target.value;
                              setPrepareItems((prev) => prev.map((x, i) => i === idx ? { ...x, real: v } : x));
                            }}
                            className={lowStock ? 'border-brand-warning' : ''}
                          />
                        </div>
                        <div>
                          <label className="block text-brand-secondary text-xs mb-1">Stock after</label>
                          <div className={`h-10 flex items-center px-3 rounded-md border ${lowStock ? 'border-brand-warning bg-brand-warning/5 text-brand-warning' : 'border-brand-border bg-brand-base text-brand-primary'} text-sm`}>
                            {projectedStock.toFixed(it.unit === 'kg' ? 1 : 0)} {prettyUnit(it.unit)}
                            {lowStock && <AlertTriangle className="w-3.5 h-3.5 ml-2" />}
                          </div>
                          <p className="text-[10px] text-brand-muted mt-1">Current stock: {it.stock} {prettyUnit(it.unit)}</p>
                        </div>
                      </div>
                      {Number(it.real) !== it.ordered && (
                        <p className="text-[11px] text-brand-accent mt-2">
                          Adjustment: {(Number(it.real) - it.ordered).toFixed(it.unit === 'kg' ? 1 : 0)} {prettyUnit(it.unit)} vs ordered
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={closePrepareDialog} disabled={savingPrepare}>Cancel</Button>
                <Button className="flex-1" onClick={handleSavePrepare} disabled={savingPrepare}>
                  {savingPrepare ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save & Update Inventory'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export { Operations };
export default Operations;
