import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Truck, MapPin, DollarSign, RotateCcw, AlertTriangle, Package, Check, X,
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

const statusVariant = (s) => ({ Pending: 'warning', Preparing: 'accent', Ready: 'success', Dispatched: 'accent', 'In Transit': 'accent', Planned: 'default', 'Under Review': 'warning', Approved: 'success', Rejected: 'error' }[s] || 'default');

const makeOrderColumns = (onStatusUpdate) => [
  { accessorKey: 'client', header: 'Client' },
  { accessorKey: 'orderNum', header: 'Order #' },
  { accessorKey: 'items', header: 'Items' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={statusVariant(row.original.status)}>{row.original.status}</Badge> },
  { accessorKey: 'priority', header: 'Priority', cell: ({ row }) => <Badge variant={row.original.priority === 'High' ? 'error' : row.original.priority === 'Medium' ? 'warning' : 'default'}>{row.original.priority}</Badge> },
  {
    id: 'action',
    header: 'Action',
    cell: ({ row }) => {
      const s = row.original.status;
      if (s === 'Pending') return <Button size="sm" onClick={() => onStatusUpdate(row.original.id, 'CONFIRMED')}>Confirm</Button>;
      if (s === 'Confirmed') return <Button size="sm" onClick={() => onStatusUpdate(row.original.id, 'PREPARING')}>Prepare</Button>;
      if (s === 'Preparing') return <Button size="sm" onClick={() => onStatusUpdate(row.original.id, 'READY')}>Mark Ready</Button>;
      return null;
    },
  },
];

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
  const [prepMode, setPrepMode] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [returnDialog, setReturnDialog] = useState(null);
  const [returnComment, setReturnComment] = useState('');

  // Fetch orders for dispatch center
  const { data: ordersData, refetch: refetchOrders } = useFetch('/orders?status=PENDING,CONFIRMED,PREPARING');
  // Fetch dispatches for route planning
  const { data: dispatchesData } = useFetch('/dispatches');
  // Fetch fleet for truck list
  const { data: fleetData } = useFetch('/fleet');
  // Fetch products with grades for pricing
  const { data: productsData } = useFetch('/products');
  // Fetch returns
  const { data: returnsData, refetch: refetchReturns } = useFetch('/orders/returns');

  // Map orders API data to display shape
  const ordersItems = useMemo(() => {
    const raw = ordersData?.data || ordersData || [];
    return raw.map((o) => ({
      id: o.id,
      client: o.client?.name || o.client || '',
      orderNum: `#${o.id}`,
      items: o._count?.items || o.items?.length || 0,
      status: o.status ? o.status.charAt(0) + o.status.slice(1).toLowerCase() : 'Pending',
      priority: o.priority || 'Medium',
    }));
  }, [ordersData]);

  // Map dispatches to routes shape
  const routesItems = useMemo(() => {
    const raw = dispatchesData?.data || dispatchesData || [];
    return raw.map((d) => ({
      id: d.id,
      truck: d.truck?.plateNumber || d.truck || '',
      driver: d.driver?.name || d.driver || '',
      clients: d.routeOrder || '',
      stops: d._count?.items || 0,
      status: d.status ? d.status.charAt(0) + d.status.slice(1).toLowerCase() : 'Planned',
    }));
  }, [dispatchesData]);

  // Map fleet to truck cards
  const truckCards = useMemo(() => {
    const raw = fleetData?.data || fleetData || [];
    return raw.map((v) => ({
      plate: v.plateNumber || v.plate || '',
      model: v.model || '',
      status: v.status ? v.status.charAt(0) + v.status.slice(1).toLowerCase().replace('_', ' ') : 'Available',
    }));
  }, [fleetData]);

  // Map products to pricing shape
  const pricingItems = useMemo(() => {
    const raw = productsData?.data || productsData || [];
    return raw.map((p) => {
      const grades = p.qualityGrades || [];
      const extraGrade = grades.find((g) => g.name === 'Extra' || g.grade === 'Extra');
      const qualityAGrade = grades.find((g) => g.name === 'Quality A' || g.grade === 'A');
      const qualityCGrade = grades.find((g) => g.name === 'Cooking' || g.grade === 'C');
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

  // Map returns data
  const returnsItems = useMemo(() => {
    const raw = returnsData?.data || returnsData || [];
    return raw.map((r) => ({
      id: r.id,
      client: r.clientOrder?.client?.name || '',
      orderNum: r.clientOrderId ? `#${r.clientOrderId}` : '',
      type: r.type || 'Return',
      reason: r.reason || '',
      status: r.opsManagerApproval === 'APPROVED' ? 'Approved' : r.opsManagerApproval === 'REJECTED' ? 'Rejected' : 'Pending',
    }));
  }, [returnsData]);

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      toast.success(`Order status updated to ${status}`);
      refetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleReturnAction = async (returnId, approval) => {
    if (!returnComment.trim()) return;
    try {
      await api.patch(`/orders/returns/${returnId}`, {
        opsManagerApproval: approval,
        opsManagerComment: returnComment,
      });
      toast.success(`Return ${approval.toLowerCase()} successfully`);
      setReturnDialog(null);
      setReturnComment('');
      refetchReturns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update return');
    }
  };

  const orderColumns = useMemo(() => makeOrderColumns(handleStatusUpdate), []);
  const returnColumns = useMemo(() => makeReturnColumns(setReturnDialog), []);

  const togglePick = (id) => setChecklist((prev) => prev.map((i) => i.id === id ? { ...i, picked: !i.picked } : i));

  return (
    <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl font-bold text-brand-primary">Operations Management</h1>
        <p className="text-brand-secondary text-sm mt-1">Dispatch, routing, pricing, and returns</p>
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

          {/* Tab 1: Dispatch */}
          <TabsContent value="dispatch" className="mt-6 space-y-6">
            <div className="flex items-center gap-3">
              <Button variant={prepMode === 'product' ? 'default' : 'outline'} onClick={() => setPrepMode(prepMode === 'product' ? null : 'product')}>
                <Package className="w-4 h-4 mr-2" /> Prepare by Product
              </Button>
              <Button variant={prepMode === 'client' ? 'default' : 'outline'} onClick={() => setPrepMode(prepMode === 'client' ? null : 'client')}>
                <Truck className="w-4 h-4 mr-2" /> Prepare by Client
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <DataTable columns={orderColumns} data={ordersItems} searchPlaceholder="Search orders..." searchColumn="client" />
              </CardContent>
            </Card>

            {prepMode && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-brand-primary font-semibold mb-4">
                    Pick List -- {prepMode === 'product' ? 'By Product' : 'Al Mandaloun #1847'}
                  </h3>
                  <div className="space-y-2">
                    {checklist.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          item.picked ? 'bg-brand-success/10 border-brand-success/30' : 'bg-brand-elevated border-brand-border hover:border-brand-accent/30'
                        }`}
                        onClick={() => togglePick(item.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded flex items-center justify-center border ${item.picked ? 'bg-brand-success border-brand-success' : 'border-brand-border'}`}>
                            {item.picked && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-sm ${item.picked ? 'text-brand-success line-through' : 'text-brand-primary'}`}>{item.product}</span>
                        </div>
                        <span className="text-brand-secondary text-sm">{item.qty} kg</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 2: Routes */}
          <TabsContent value="routes" className="mt-6 space-y-6">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div><label className="block text-brand-secondary text-xs mb-1">Product</label><Input placeholder="Product name" /></div>
                  <div><label className="block text-brand-secondary text-xs mb-1">Qty (kg)</label><Input type="number" placeholder="0" /></div>
                  <div><label className="block text-brand-secondary text-xs mb-1">Supplier</label><Input placeholder="Supplier" /></div>
                  <div><label className="block text-brand-secondary text-xs mb-1">Reason</label><Input placeholder="Why urgent?" /></div>
                  <div className="flex items-end"><Button variant="destructive" className="w-full"><AlertTriangle className="w-4 h-4 mr-1" /> Submit</Button></div>
                </div>
              </CardContent>
            </Card>
            <Card><CardContent className="p-6"><DataTable columns={urgentColumns} data={[]} /></CardContent></Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

export { Operations };
export default Operations;
