import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Scale, Star, Award, Trash2, Truck, ClipboardCheck, PackageCheck,
  Flag, Plus, AlertTriangle, Wrench,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { KPICard } from '@/components/dashboard/KPICard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { DataTable } from '@/components/tables/DataTable';
import { CHART_COLORS } from '@/utils/constants';
import { formatCurrency } from '@/utils/helpers';
import { useFetch } from '@/hooks/useFetch';
import api from '@/services/api';
import { toast } from 'sonner';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const renderStars = (r) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-4 h-4 ${s <= Math.round(r) ? 'fill-brand-warning text-brand-warning' : 'text-brand-border'}`} />)}
    <span className="ml-2 text-brand-primary text-sm font-medium">{r}</span>
  </div>
);

const weightColumns = [
  { accessorKey: 'product', header: 'Product' },
  { accessorKey: 'po', header: 'PO #' },
  { accessorKey: 'purchased', header: 'Purchased (kg)' },
  { accessorKey: 'received', header: 'Received (kg)' },
  { accessorKey: 'discrepancy', header: 'Discrepancy', cell: ({ row }) => <span className={Math.abs(row.original.discrepancy) > 5 ? 'text-brand-error font-semibold' : 'text-brand-primary'}>{row.original.discrepancy}</span> },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={row.original.status === 'Flagged' ? 'error' : 'success'}>{row.original.status}</Badge> },
];

const ratingColumns = [
  { accessorKey: 'supplier', header: 'Supplier' },
  { accessorKey: 'avgRating', header: 'Rating', cell: ({ row }) => renderStars(row.original.avgRating) },
  { accessorKey: 'trend', header: 'Trend', cell: ({ row }) => <Badge variant={row.original.trend === 'Improving' ? 'success' : row.original.trend === 'Declining' ? 'error' : 'default'}>{row.original.trend}</Badge> },
  { accessorKey: 'deliveries', header: 'Deliveries' },
  { accessorKey: 'issues', header: 'Issues', cell: ({ row }) => <span className={row.original.issues > 10 ? 'text-brand-error font-semibold' : ''}>{row.original.issues}</span> },
];

const gradingColumns = [
  { accessorKey: 'product', header: 'Product' },
  { accessorKey: 'date', header: 'Date' },
  { accessorKey: 'internal', header: 'Internal Grade', cell: ({ row }) => <Badge variant="accent">{row.original.internal}</Badge> },
  { accessorKey: 'client', header: 'Client Grade', cell: ({ row }) => <Badge variant="outline">{row.original.client}</Badge> },
  { accessorKey: 'qty', header: 'Qty (kg)' },
  { accessorKey: 'approvedBy', header: 'Approved By' },
];

const spotCheckColumns = [
  { accessorKey: 'product', header: 'Product' },
  { accessorKey: 'grade', header: 'Grade' },
  { accessorKey: 'system', header: 'System' },
  { accessorKey: 'physical', header: 'Physical' },
  { accessorKey: 'disc', header: 'Discrepancy', cell: ({ row }) => <span className={row.original.disc !== 0 ? 'text-brand-error font-semibold' : 'text-brand-success'}>{row.original.disc}</span> },
  { accessorKey: 'date', header: 'Date' },
  { accessorKey: 'by', header: 'Checked By' },
];

function QualityControl() {
  const [ratingDialog, setRatingDialog] = useState(false);
  const [wasteDialog, setWasteDialog] = useState(false);
  const [dispatchChecklist, setDispatchChecklist] = useState([]);
  const [ratingSupplier, setRatingSupplier] = useState('');
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingNotes, setRatingNotes] = useState('');
  const [spotProduct, setSpotProduct] = useState('');
  const [spotGrade, setSpotGrade] = useState('');
  const [spotSystem, setSpotSystem] = useState('');
  const [spotPhysical, setSpotPhysical] = useState('');
  const [wasteProduct, setWasteProduct] = useState('');
  const [wasteGrade, setWasteGrade] = useState('');
  const [wasteQty, setWasteQty] = useState('');
  const [wasteType, setWasteType] = useState('');
  const [wasteReason, setWasteReason] = useState('');
  const [wasteCost, setWasteCost] = useState('');
  const [spotCheckDialog, setSpotCheckDialog] = useState(false);
  const [wasteLogDialog, setWasteLogDialog] = useState(false);

  // Fetch suppliers for ratings
  const { data: suppliersData } = useFetch('/suppliers');
  // Fetch waste data
  const { data: wasteData, refetch: refetchWaste } = useFetch('/waste');
  // Fetch waste analytics
  const { data: wasteAnalytics } = useFetch('/waste/analytics');
  // Fetch fleet
  const { data: fleetData } = useFetch('/fleet');
  // Fetch fleet stats
  const { data: fleetStats } = useFetch('/fleet/stats');
  // Fetch spot checks
  const { data: spotChecksData, refetch: refetchSpotChecks } = useFetch('/inventory/spot-checks');
  // Fetch products for dropdowns
  const { data: productsData } = useFetch('/products');
  // Fetch inventory stock for weight verification
  const { data: stockData } = useFetch('/inventory/stock');

  const suppliersList = suppliersData?.data || suppliersData || [];
  const productsList = productsData?.data || productsData || [];
  const wasteItems = wasteData?.data || wasteData || [];
  const spotCheckItems = spotChecksData?.data || spotChecksData || [];

  // Map fleet data
  const vehicleItems = useMemo(() => {
    const raw = fleetData?.data || fleetData || [];
    return raw.map((v) => ({
      id: v.id,
      plate: v.plateNumber || v.plate || '',
      model: v.model || '',
      status: v.status ? v.status.charAt(0) + v.status.slice(1).toLowerCase().replace('_', ' ') : 'Active',
      mileage: v.mileage || 0,
      next: v.nextMaintenanceDate || v.next || '',
    }));
  }, [fleetData]);

  // Map supplier ratings from supplier list
  const ratingItems = useMemo(() => {
    return suppliersList.map((s) => ({
      id: s.id,
      supplier: s.name,
      avgRating: s.averageRating || 0,
      trend: 'Stable',
      deliveries: s._count?.purchaseOrders || 0,
      issues: 0,
    }));
  }, [suppliersData]);

  const toggleVerify = (id) => setDispatchChecklist((prev) => prev.map((i) => i.id === id ? { ...i, verified: !i.verified } : i));
  const allVerified = dispatchChecklist.every((i) => i.verified);

  return (
    <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.08 } } }} className="space-y-4 lg:space-y-6">
      <motion.div variants={fadeInUp} className="hidden lg:block">
        <h1 className="text-2xl font-bold text-brand-primary">Quality & Cost Control</h1>
        <p className="text-brand-secondary text-sm mt-1">Verification, grading, waste, and fleet</p>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Tabs defaultValue="weight">
          <TabsList className="flex-wrap">
            <TabsTrigger value="weight"><Scale className="w-4 h-4 mr-1" /> Weight</TabsTrigger>
            <TabsTrigger value="ratings"><Star className="w-4 h-4 mr-1" /> Ratings</TabsTrigger>
            <TabsTrigger value="grading"><Award className="w-4 h-4 mr-1" /> Grading</TabsTrigger>
            <TabsTrigger value="waste"><Trash2 className="w-4 h-4 mr-1" /> Waste</TabsTrigger>
            <TabsTrigger value="fleet"><Truck className="w-4 h-4 mr-1" /> Fleet</TabsTrigger>
            <TabsTrigger value="spot"><ClipboardCheck className="w-4 h-4 mr-1" /> Spot Checks</TabsTrigger>
            <TabsTrigger value="predispatch"><PackageCheck className="w-4 h-4 mr-1" /> Pre-Dispatch</TabsTrigger>
          </TabsList>

          {/* Weight Verification */}
          <TabsContent value="weight" className="mt-6">
            <Card><CardContent className="p-6"><DataTable columns={weightColumns} data={[]} searchPlaceholder="Search..." searchColumn="product" /></CardContent></Card>
          </TabsContent>

          {/* Supplier Ratings */}
          <TabsContent value="ratings" className="mt-6 space-y-6">
            <div className="flex justify-end"><Button onClick={() => setRatingDialog(true)}><Star className="w-4 h-4 mr-2" /> Rate Supplier</Button></div>
            <Card><CardContent className="p-6"><DataTable columns={ratingColumns} data={ratingItems} searchPlaceholder="Search..." searchColumn="supplier" /></CardContent></Card>
            <ChartCard title="Rating Trends" subtitle="Last 12 months">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A3F3F" />
                  <XAxis dataKey="month" tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} domain={[1, 5]} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#143535', border: '1px solid #1A3F3F', borderRadius: '8px', color: '#E8F5F3' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Farm Fresh Co." stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Green Valley" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Mountain Produce" stroke={CHART_COLORS[2]} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <Dialog open={ratingDialog} onOpenChange={(open) => { setRatingDialog(open); if (!open) { setRatingSupplier(''); setRatingValue(0); setRatingNotes(''); } }}>
              <DialogContent>
                <DialogHeader><DialogTitle>Rate Supplier</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><label className="block text-brand-secondary text-sm mb-1">Supplier</label>
                    <Select value={ratingSupplier} onValueChange={setRatingSupplier}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {suppliersList.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                      </SelectContent></Select>
                  </div>
                  <div><label className="block text-brand-secondary text-sm mb-1">Rating</label><div className="flex gap-1">{[1,2,3,4,5].map((s) => <button key={s} className="p-1" onClick={() => setRatingValue(s)}><Star className={`w-8 h-8 ${s <= ratingValue ? 'fill-brand-warning text-brand-warning' : 'text-brand-border hover:fill-brand-warning hover:text-brand-warning'}`} /></button>)}</div></div>
                  <div><label className="block text-brand-secondary text-sm mb-1">Notes</label><textarea className="w-full bg-brand-elevated border border-brand-border rounded-lg p-3 text-brand-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-accent resize-none" rows={3} value={ratingNotes} onChange={(e) => setRatingNotes(e.target.value)} /></div>
                  <Button className="w-full" onClick={async () => {
                    if (!ratingSupplier || !ratingValue) {
                      toast.error('Please select a supplier and rating');
                      return;
                    }
                    try {
                      await api.post(`/suppliers/${ratingSupplier}/ratings`, {
                        rating: ratingValue,
                        notes: ratingNotes,
                        date: new Date().toISOString().split('T')[0],
                      });
                      toast.success('Rating submitted successfully');
                      setRatingDialog(false);
                      setRatingSupplier('');
                      setRatingValue(0);
                      setRatingNotes('');
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to submit rating');
                    }
                  }}>Submit Rating</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Quality Grading */}
          <TabsContent value="grading" className="mt-6 space-y-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-brand-primary font-semibold mb-3">Grade Mapping</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  {[['Extra', 'Extra'], ['A / B', 'Quality A'], ['C++ / C', 'Cooking'], ['Reject', 'Waste']].map(([from, to]) => (
                    <div key={from} className="bg-brand-elevated rounded-lg p-3 text-center"><p className="text-brand-accent font-semibold">{from}</p><p className="text-brand-muted text-xs mt-1">maps to {to}</p></div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card><CardContent className="p-6"><DataTable columns={gradingColumns} data={[]} searchPlaceholder="Search..." searchColumn="product" /></CardContent></Card>
          </TabsContent>

          {/* Waste */}
          <TabsContent value="waste" className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <KPICard title="Waste Cost This Week" value={formatCurrency(wasteAnalytics?.weekly?.totalCost || 0)} icon={Trash2} trend="down" trendValue={12} />
              <KPICard title="Waste % of Inventory" value={wasteAnalytics?.weekly?.wastePercentage ? `${wasteAnalytics.weekly.wastePercentage}%` : '0%'} icon={AlertTriangle} trend="down" trendValue={0.3} />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setWasteLogDialog(true)}><Plus className="w-4 h-4 mr-2" /> Log Waste</Button>
            </div>

            {wasteItems.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <DataTable
                    columns={[
                      { accessorKey: 'product', header: 'Product', cell: ({ row }) => row.original.product?.name || row.original.productName || '' },
                      { accessorKey: 'quantity', header: 'Qty (kg)' },
                      { accessorKey: 'wasteType', header: 'Type', cell: ({ row }) => <Badge variant="warning">{(row.original.wasteType || '').replace('_', ' ')}</Badge> },
                      { accessorKey: 'reason', header: 'Reason' },
                      { accessorKey: 'cost', header: 'Cost', cell: ({ row }) => formatCurrency(row.original.cost || 0) },
                      { accessorKey: 'authorized', header: 'Status', cell: ({ row }) => row.original.authorizedAt ? <Badge variant="success">Authorized</Badge> : <Badge variant="warning">Pending</Badge> },
                      {
                        id: 'action',
                        header: 'Action',
                        cell: ({ row }) => !row.original.authorizedAt ? (
                          <Button size="sm" variant="outline" onClick={async () => {
                            try {
                              await api.patch(`/waste/${row.original.id}/authorize`, {});
                              toast.success('Waste entry authorized');
                              refetchWaste();
                            } catch (err) {
                              toast.error(err.response?.data?.message || 'Failed to authorize');
                            }
                          }}>Authorize</Button>
                        ) : null,
                      },
                    ]}
                    data={wasteItems}
                    searchPlaceholder="Search waste..."
                    searchColumn="reason"
                  />
                </CardContent>
              </Card>
            )}

            <ChartCard title="Daily Waste Cost" subtitle="Last 14 days">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={wasteAnalytics?.daily || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A3F3F" />
                  <XAxis dataKey="date" tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#143535', border: '1px solid #1A3F3F', borderRadius: '8px', color: '#E8F5F3' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="receiving" name="Receiving" fill={CHART_COLORS[0]} stackId="a" />
                  <Bar dataKey="aging" name="Aging" fill={CHART_COLORS[5]} stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Log Waste Dialog */}
            <Dialog open={wasteLogDialog} onOpenChange={(open) => { setWasteLogDialog(open); if (!open) { setWasteProduct(''); setWasteGrade(''); setWasteQty(''); setWasteType(''); setWasteReason(''); setWasteCost(''); } }}>
              <DialogContent>
                <DialogHeader><DialogTitle>Log Waste Entry</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><label className="block text-brand-secondary text-sm mb-1">Product</label>
                    <Select value={wasteProduct} onValueChange={(v) => { setWasteProduct(v); setWasteGrade(''); }}>
                      <SelectTrigger><SelectValue placeholder="Select product..." /></SelectTrigger>
                      <SelectContent>{productsList.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><label className="block text-brand-secondary text-sm mb-1">Quality Grade</label>
                    <Select value={wasteGrade} onValueChange={setWasteGrade}>
                      <SelectTrigger><SelectValue placeholder="Select grade..." /></SelectTrigger>
                      <SelectContent>{(productsList.find((p) => String(p.id) === wasteProduct)?.qualityGrades || []).map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.name || g.grade}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><label className="block text-brand-secondary text-sm mb-1">Quantity (kg)</label><Input type="number" value={wasteQty} onChange={(e) => setWasteQty(e.target.value)} /></div>
                  <div><label className="block text-brand-secondary text-sm mb-1">Waste Type</label>
                    <Select value={wasteType} onValueChange={setWasteType}>
                      <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RECEIVING_WASTE">Receiving Waste</SelectItem>
                        <SelectItem value="AGING_WASTE">Aging Waste</SelectItem>
                        <SelectItem value="PROCESSING_WASTE">Processing Waste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><label className="block text-brand-secondary text-sm mb-1">Reason</label><Input value={wasteReason} onChange={(e) => setWasteReason(e.target.value)} /></div>
                  <div><label className="block text-brand-secondary text-sm mb-1">Cost</label><Input type="number" step="0.01" value={wasteCost} onChange={(e) => setWasteCost(e.target.value)} /></div>
                  <Button className="w-full" onClick={async () => {
                    if (!wasteProduct || !wasteQty || !wasteType) {
                      toast.error('Please fill required fields');
                      return;
                    }
                    try {
                      await api.post('/waste', {
                        productId: Number(wasteProduct),
                        qualityGradeId: wasteGrade ? Number(wasteGrade) : undefined,
                        quantity: Number(wasteQty),
                        wasteType,
                        reason: wasteReason,
                        cost: wasteCost ? Number(wasteCost) : undefined,
                      });
                      toast.success('Waste entry logged');
                      setWasteLogDialog(false);
                      refetchWaste();
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to log waste');
                    }
                  }}>Log Waste</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Fleet */}
          <TabsContent value="fleet" className="mt-6 space-y-6">
            {fleetStats && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <KPICard title="Total Vehicles" value={fleetStats.totalVehicles || vehicleItems.length} icon={Truck} />
                {fleetStats.maintenanceCosts != null && <KPICard title="Maintenance Costs" value={formatCurrency(fleetStats.maintenanceCosts)} icon={Wrench} />}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {vehicleItems.map((v) => (
                <Card key={v.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3"><Truck className="w-6 h-6 text-brand-accent" /><Badge variant={v.status === 'Active' ? 'success' : 'warning'}>{v.status}</Badge></div>
                    <p className="text-brand-primary font-semibold">{v.plate}</p><p className="text-brand-muted text-sm">{v.model}</p>
                    <div className="mt-3 pt-3 border-t border-brand-border text-xs text-brand-secondary space-y-1"><p>Mileage: {(v.mileage || 0).toLocaleString()} km</p><p>Next: {v.next}</p></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Spot Checks */}
          <TabsContent value="spot" className="mt-6 space-y-4">
            <div className="flex justify-end"><Button onClick={() => setSpotCheckDialog(true)}><ClipboardCheck className="w-4 h-4 mr-2" /> New Spot Check</Button></div>
            <Card><CardContent className="p-6"><DataTable columns={spotCheckColumns} data={spotCheckItems} /></CardContent></Card>

            <Dialog open={spotCheckDialog} onOpenChange={(open) => { setSpotCheckDialog(open); if (!open) { setSpotProduct(''); setSpotGrade(''); setSpotSystem(''); setSpotPhysical(''); } }}>
              <DialogContent>
                <DialogHeader><DialogTitle>New Spot Check</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><label className="block text-brand-secondary text-sm mb-1">Product</label>
                    <Select value={spotProduct} onValueChange={(v) => { setSpotProduct(v); setSpotGrade(''); }}>
                      <SelectTrigger><SelectValue placeholder="Select product..." /></SelectTrigger>
                      <SelectContent>{productsList.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><label className="block text-brand-secondary text-sm mb-1">Quality Grade</label>
                    <Select value={spotGrade} onValueChange={setSpotGrade}>
                      <SelectTrigger><SelectValue placeholder="Select grade..." /></SelectTrigger>
                      <SelectContent>{(productsList.find((p) => String(p.id) === spotProduct)?.qualityGrades || []).map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.name || g.grade}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><label className="block text-brand-secondary text-sm mb-1">System Count (kg)</label><Input type="number" value={spotSystem} onChange={(e) => setSpotSystem(e.target.value)} /></div>
                  <div><label className="block text-brand-secondary text-sm mb-1">Physical Count (kg)</label><Input type="number" value={spotPhysical} onChange={(e) => setSpotPhysical(e.target.value)} /></div>
                  <Button className="w-full" onClick={async () => {
                    if (!spotProduct || !spotSystem || !spotPhysical) {
                      toast.error('Please fill all required fields');
                      return;
                    }
                    try {
                      await api.post('/inventory/spot-checks', {
                        productId: Number(spotProduct),
                        qualityGradeId: spotGrade ? Number(spotGrade) : undefined,
                        systemCount: Number(spotSystem),
                        physicalCount: Number(spotPhysical),
                      });
                      toast.success('Spot check recorded');
                      setSpotCheckDialog(false);
                      setSpotProduct('');
                      setSpotGrade('');
                      setSpotSystem('');
                      setSpotPhysical('');
                      refetchSpotChecks();
                    } catch (err) {
                      toast.error(err.response?.data?.message || 'Failed to record spot check');
                    }
                  }}>Submit Spot Check</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Pre-Dispatch Checklist */}
          <TabsContent value="predispatch" className="mt-6 space-y-6">
            <PreDispatchQC />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

function PreDispatchQC() {
  const { data: dispatchListData } = useFetch('/dispatches?status=PLANNING,LOADING');
  const dispatches = (dispatchListData?.data || dispatchListData || []).filter((d) => ['PLANNING', 'LOADING'].includes(d.status));
  const [selectedId, setSelectedId] = useState('');
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifyingItemId, setVerifyingItemId] = useState(null);
  const [savingNotes, setSavingNotes] = useState(false);

  const loadChecklist = async (id) => {
    if (!id) { setChecklist(null); return; }
    setLoading(true);
    try {
      const res = await api.get(`/dispatches/${id}/qc-checklist`);
      setChecklist(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to load checklist');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { loadChecklist(selectedId); }, [selectedId]);

  const allOrderItems = (checklist?.items || []).flatMap((di) => (di.clientOrder?.items || []).map((it) => ({ ...it, _client: di.clientOrder?.client?.businessName || 'Client' })));
  const verifiedCount = allOrderItems.filter((it) => it.qcVerified).length;
  const totalItems = allOrderItems.length;
  const allVerified = totalItems > 0 && verifiedCount === totalItems;

  const toggleVerifyItem = async (item) => {
    setVerifyingItemId(item.id);
    try {
      await api.patch(`/orders/items/${item.id}/qc`, { verified: !item.qcVerified });
      await loadChecklist(selectedId);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update');
    } finally {
      setVerifyingItemId(null);
    }
  };

  const updateNotes = async (item, notes) => {
    setSavingNotes(true);
    try {
      await api.patch(`/orders/items/${item.id}/qc`, { verified: item.qcVerified, notes });
    } catch (err) {
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleApprove = async () => {
    if (!checklist) return;
    try {
      await api.patch(`/dispatches/${checklist.id}/status`, { status: 'LOADING' });
      toast.success('Dispatch marked as loaded — driver can start the trip');
      loadChecklist(selectedId);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update dispatch');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1 max-w-md">
          <label className="block text-brand-secondary text-sm font-medium mb-2">Select Dispatch</label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger><SelectValue placeholder={dispatches.length ? 'Pick a dispatch to verify…' : 'No PLANNING / LOADING dispatches'} /></SelectTrigger>
            <SelectContent>
              {dispatches.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  D-{d.id.slice(0, 8)} · {d.truck?.plateNumber || 'No truck'} · {d._count?.items ?? d.items?.length ?? 0} order(s)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {checklist && (
          <div className="text-sm text-brand-secondary">
            <span className="text-brand-primary font-semibold">{verifiedCount}</span> / {totalItems} items verified
          </div>
        )}
      </div>

      {loading && (
        <div className="py-12 text-center text-brand-muted text-sm">Loading checklist…</div>
      )}

      {checklist && !loading && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3">
              {(checklist.items || []).map((di) => (
                <div key={di.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-brand-accent" />
                    <p className="text-brand-primary font-semibold text-sm">
                      {di.clientOrder?.client?.businessName || 'Client'} · Order #{di.clientOrderId?.slice(0, 8)}
                    </p>
                  </div>
                  <div className="space-y-1.5 pl-6">
                    {(di.clientOrder?.items || []).map((it) => (
                      <div
                        key={it.id}
                        className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border transition-all ${it.qcVerified ? 'bg-brand-success/10 border-brand-success/30' : 'bg-brand-elevated border-brand-border'}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleVerifyItem(it)}
                            disabled={verifyingItemId === it.id}
                            className={`w-6 h-6 shrink-0 rounded flex items-center justify-center border-2 ${it.qcVerified ? 'bg-brand-success border-brand-success text-white' : 'border-brand-border'}`}
                          >
                            {it.qcVerified && <PackageCheck className="w-4 h-4" />}
                          </button>
                          <div className="min-w-0">
                            <p className="text-brand-primary text-sm truncate">{it.product?.name}</p>
                            <p className="text-brand-muted text-xs">
                              Ordered {it.quantity} · Prepared {it.fulfilledQuantity ?? '—'} {it.product?.unit || ''}
                              {it.qcVerifier && it.qcVerified && (
                                <span className="ml-2 text-brand-success">· verified by {it.qcVerifier.firstName} {it.qcVerifier.lastName}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <Input
                          placeholder="QC note (optional)"
                          defaultValue={it.qcNotes || ''}
                          onBlur={(e) => { if (e.target.value !== (it.qcNotes || '')) updateNotes(it, e.target.value); }}
                          className="h-8 text-xs sm:w-56"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button className="mt-6 w-full" disabled={!allVerified} onClick={handleApprove}>
              <PackageCheck className="w-4 h-4 mr-2" />
              {allVerified ? 'Approve & mark dispatch as loaded' : `${totalItems - verifiedCount} item(s) still need verification`}
            </Button>
          </CardContent>
        </Card>
      )}

      {!checklist && !loading && !selectedId && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-brand-muted text-sm">
            Pick a dispatch above to start verification.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { QualityControl };
export default QualityControl;
