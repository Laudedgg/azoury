import React, { useState } from 'react';
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
import { formatCurrency } from '@/utils/helpers';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const mockOrders = [
  { id: 1, client: 'Al Mandaloun', orderNum: '#1847', items: 24, status: 'Pending', priority: 'High' },
  { id: 2, client: 'Le Petit Chef', orderNum: '#1846', items: 18, status: 'Preparing', priority: 'High' },
  { id: 3, client: 'Karam Beirut', orderNum: '#1845', items: 31, status: 'Ready', priority: 'Medium' },
  { id: 4, client: 'Fresh Market', orderNum: '#1844', items: 12, status: 'Pending', priority: 'Low' },
  { id: 5, client: 'Souq Express', orderNum: '#1843', items: 22, status: 'Preparing', priority: 'High' },
  { id: 6, client: 'Green Basket', orderNum: '#1842', items: 15, status: 'Pending', priority: 'Medium' },
  { id: 7, client: 'Phoenicia Hotel', orderNum: '#1841', items: 38, status: 'Ready', priority: 'High' },
  { id: 8, client: 'Byblos Bay', orderNum: '#1840', items: 20, status: 'Pending', priority: 'Medium' },
];

const mockChecklist = [
  { id: 1, product: 'Roma Tomatoes - Extra', qty: 50, picked: false },
  { id: 2, product: 'Cucumbers - Quality A', qty: 30, picked: false },
  { id: 3, product: 'Bell Peppers - Extra', qty: 20, picked: true },
  { id: 4, product: 'Potatoes - Quality C', qty: 80, picked: true },
  { id: 5, product: 'Avocados - Extra', qty: 15, picked: false },
  { id: 6, product: 'Lemons - Quality A', qty: 25, picked: false },
];

const mockRoutes = [
  { id: 1, truck: 'B 234 567', driver: 'Ahmad Khalil', clients: 'Al Mandaloun, Le Petit Chef, Karam Beirut', stops: 3, status: 'Planned' },
  { id: 2, truck: 'B 345 678', driver: 'Hassan Mousa', clients: 'Fresh Market, Souq Express', stops: 2, status: 'Dispatched' },
  { id: 3, truck: 'B 456 789', driver: 'Omar Saeed', clients: 'Phoenicia Hotel, Green Basket, Byblos Bay', stops: 3, status: 'In Transit' },
];

const mockPricing = [
  { id: 1, product: 'Roma Tomatoes', extraPrice: 4.20, qualityAPrice: 3.50, qualityCPrice: 2.80, margin: 33 },
  { id: 2, product: 'Cucumbers', extraPrice: 3.10, qualityAPrice: 2.60, qualityCPrice: 2.00, margin: 28 },
  { id: 3, product: 'Bell Peppers', extraPrice: 5.50, qualityAPrice: 4.80, qualityCPrice: 3.80, margin: 35 },
  { id: 4, product: 'Potatoes', extraPrice: 1.50, qualityAPrice: 1.20, qualityCPrice: 0.95, margin: 25 },
  { id: 5, product: 'Avocados', extraPrice: 7.80, qualityAPrice: 6.50, qualityCPrice: 5.20, margin: 38 },
  { id: 6, product: 'Lemons', extraPrice: 3.40, qualityAPrice: 2.80, qualityCPrice: 2.20, margin: 30 },
  { id: 7, product: 'Bananas', extraPrice: 2.00, qualityAPrice: 1.60, qualityCPrice: 1.20, margin: 27 },
  { id: 8, product: 'Onions', extraPrice: 1.30, qualityAPrice: 1.00, qualityCPrice: 0.80, margin: 22 },
];

const mockReturns = [
  { id: 1, client: 'Al Mandaloun', orderNum: '#1832', type: 'Return', reason: 'Product quality below standard', status: 'Pending' },
  { id: 2, client: 'Fresh Market', orderNum: '#1828', type: 'Amendment', reason: 'Wrong quantity delivered', status: 'Under Review' },
  { id: 3, client: 'Karam Beirut', orderNum: '#1835', type: 'Return', reason: 'Damaged packaging - tomatoes crushed', status: 'Approved' },
  { id: 4, client: 'Le Petit Chef', orderNum: '#1830', type: 'Amendment', reason: 'Missing items: Bell Peppers and Avocados', status: 'Rejected' },
  { id: 5, client: 'Souq Express', orderNum: '#1838', type: 'Return', reason: 'Received wrong grade', status: 'Pending' },
];

const mockUrgent = [
  { id: 1, product: 'Roma Tomatoes', qty: 100, supplier: 'Farm Fresh Co.', reason: 'Stock shortage for evening orders', time: '09:30 AM' },
  { id: 2, product: 'Avocados', qty: 30, supplier: 'Tropical Imports', reason: 'Unexpected large order', time: '11:15 AM' },
  { id: 3, product: 'Lemons', qty: 50, supplier: 'South Coast Citrus', reason: 'Quality reject from morning delivery', time: '02:00 PM' },
];

const statusVariant = (s) => ({ Pending: 'warning', Preparing: 'accent', Ready: 'success', Dispatched: 'accent', 'In Transit': 'accent', Planned: 'default', 'Under Review': 'warning', Approved: 'success', Rejected: 'error' }[s] || 'default');

const orderColumns = [
  { accessorKey: 'client', header: 'Client' },
  { accessorKey: 'orderNum', header: 'Order #' },
  { accessorKey: 'items', header: 'Items' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={statusVariant(row.original.status)}>{row.original.status}</Badge> },
  { accessorKey: 'priority', header: 'Priority', cell: ({ row }) => <Badge variant={row.original.priority === 'High' ? 'error' : row.original.priority === 'Medium' ? 'warning' : 'default'}>{row.original.priority}</Badge> },
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
  { accessorKey: 'qualityCPrice', header: 'Quality C', cell: ({ row }) => formatCurrency(row.original.qualityCPrice) },
  { accessorKey: 'margin', header: 'Margin %', cell: ({ row }) => <span className={row.original.margin >= 30 ? 'text-brand-success font-semibold' : 'text-brand-warning font-semibold'}>{row.original.margin}%</span> },
];

const returnColumns = [
  { accessorKey: 'client', header: 'Client' },
  { accessorKey: 'orderNum', header: 'Order #' },
  { accessorKey: 'type', header: 'Type', cell: ({ row }) => <Badge variant={row.original.type === 'Return' ? 'error' : 'warning'}>{row.original.type}</Badge> },
  { accessorKey: 'reason', header: 'Reason' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={statusVariant(row.original.status)}>{row.original.status}</Badge> },
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
  const [checklist, setChecklist] = useState(mockChecklist);
  const [returnDialog, setReturnDialog] = useState(null);
  const [returnComment, setReturnComment] = useState('');

  const { data: apiData } = useFetch('/orders?status=IN_PROGRESS');

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
                <DataTable columns={orderColumns} data={apiData?.orders || mockOrders} searchPlaceholder="Search orders..." searchColumn="client" />
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
              {[{ plate: 'B 234 567', model: 'Isuzu NPR', status: 'Available' }, { plate: 'B 345 678', model: 'Mitsubishi Canter', status: 'Available' }, { plate: 'B 456 789', model: 'Isuzu NPR', status: 'In Use' }].map((t) => (
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
            <Card><CardContent className="p-6"><DataTable columns={routeColumns} data={mockRoutes} /></CardContent></Card>
          </TabsContent>

          {/* Tab 3: Pricing */}
          <TabsContent value="pricing" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-brand-secondary text-sm mb-4">Margin is calculated from cost vs. selling price.</p>
                <DataTable columns={pricingColumns} data={mockPricing} searchPlaceholder="Search products..." searchColumn="product" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Returns */}
          <TabsContent value="returns" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <DataTable columns={returnColumns} data={mockReturns} searchPlaceholder="Search returns..." searchColumn="client" />
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
                      <Button variant="outline" className="flex-1 text-brand-success" disabled={!returnComment.trim()}><Check className="w-4 h-4 mr-1" /> Approve</Button>
                      <Button variant="outline" className="flex-1 text-brand-error" disabled={!returnComment.trim()}><X className="w-4 h-4 mr-1" /> Reject</Button>
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
            <Card><CardContent className="p-6"><DataTable columns={urgentColumns} data={mockUrgent} /></CardContent></Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

export { Operations };
export default Operations;
