import React, { useState } from 'react';
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

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const mockWeight = [
  { id: 1, product: 'Roma Tomatoes', po: 'PO-1204', purchased: 500, received: 487, discrepancy: -13, status: 'Flagged' },
  { id: 2, product: 'Cucumbers', po: 'PO-1205', purchased: 300, received: 298, discrepancy: -2, status: 'OK' },
  { id: 3, product: 'Bell Peppers', po: 'PO-1206', purchased: 200, received: 185, discrepancy: -15, status: 'Flagged' },
  { id: 4, product: 'Potatoes', po: 'PO-1207', purchased: 800, received: 795, discrepancy: -5, status: 'OK' },
  { id: 5, product: 'Avocados', po: 'PO-1208', purchased: 100, received: 92, discrepancy: -8, status: 'Flagged' },
  { id: 6, product: 'Bananas', po: 'PO-1209', purchased: 400, received: 398, discrepancy: -2, status: 'OK' },
  { id: 7, product: 'Onions', po: 'PO-1210', purchased: 600, received: 575, discrepancy: -25, status: 'Flagged' },
  { id: 8, product: 'Lemons', po: 'PO-1211', purchased: 250, received: 248, discrepancy: -2, status: 'OK' },
];

const mockRatings = [
  { id: 1, supplier: 'Farm Fresh Co.', avgRating: 4.2, trend: 'Improving', deliveries: 145, issues: 8 },
  { id: 2, supplier: 'Bekaa Farms', avgRating: 3.8, trend: 'Stable', deliveries: 112, issues: 14 },
  { id: 3, supplier: 'Green Valley', avgRating: 4.5, trend: 'Improving', deliveries: 98, issues: 3 },
  { id: 4, supplier: 'Mountain Produce', avgRating: 3.2, trend: 'Declining', deliveries: 76, issues: 18 },
  { id: 5, supplier: 'Tropical Imports', avgRating: 4.0, trend: 'Stable', deliveries: 64, issues: 6 },
  { id: 6, supplier: 'South Coast Citrus', avgRating: 4.7, trend: 'Improving', deliveries: 52, issues: 1 },
];

const mockRatingHistory = (() => {
  const d = [];
  for (let i = 11; i >= 0; i--) {
    const dt = new Date(); dt.setMonth(dt.getMonth() - i);
    d.push({ month: dt.toLocaleDateString('en-US', { month: 'short' }), 'Farm Fresh Co.': +(3.5 + Math.random() * 1.2).toFixed(1), 'Green Valley': +(3.8 + Math.random()).toFixed(1), 'Mountain Produce': +(2.8 + Math.random()).toFixed(1) });
  }
  return d;
})();

const mockGrading = [
  { id: 1, product: 'Roma Tomatoes', date: '2026-04-08', internal: 'Extra', client: 'Extra', qty: 120, approvedBy: 'Karim H.' },
  { id: 2, product: 'Cucumbers', date: '2026-04-08', internal: 'A', client: 'Quality A', qty: 200, approvedBy: 'Karim H.' },
  { id: 3, product: 'Bell Peppers', date: '2026-04-08', internal: 'B', client: 'Quality A', qty: 80, approvedBy: 'Sami R.' },
  { id: 4, product: 'Potatoes', date: '2026-04-07', internal: 'C++', client: 'Quality C', qty: 350, approvedBy: 'Karim H.' },
  { id: 5, product: 'Avocados', date: '2026-04-07', internal: 'Extra', client: 'Extra', qty: 45, approvedBy: 'Sami R.' },
  { id: 6, product: 'Bananas', date: '2026-04-07', internal: 'C', client: 'Quality C', qty: 180, approvedBy: 'Karim H.' },
];

const mockWasteTrend = (() => {
  const d = [];
  for (let i = 13; i >= 0; i--) {
    const dt = new Date(); dt.setDate(dt.getDate() - i);
    d.push({ date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), receiving: +(20 + Math.random() * 60).toFixed(0), aging: +(15 + Math.random() * 45).toFixed(0) });
  }
  return d;
})();

const mockVehicles = [
  { id: 1, plate: 'B 234 567', model: 'Isuzu NPR', status: 'Active', mileage: 45200, next: '2026-04-20' },
  { id: 2, plate: 'B 345 678', model: 'Mitsubishi Canter', status: 'Active', mileage: 32100, next: '2026-05-05' },
  { id: 3, plate: 'B 456 789', model: 'Isuzu NPR', status: 'Maintenance', mileage: 67800, next: '2026-04-10' },
  { id: 4, plate: 'B 567 890', model: 'Hino 300', status: 'Active', mileage: 28400, next: '2026-04-25' },
];

const mockSpotChecks = [
  { id: 1, product: 'Roma Tomatoes', grade: 'Extra', system: 120, physical: 118, disc: -2, date: '2026-04-08', by: 'Karim H.' },
  { id: 2, product: 'Cucumbers', grade: 'Quality A', system: 200, physical: 200, disc: 0, date: '2026-04-08', by: 'Sami R.' },
  { id: 3, product: 'Potatoes', grade: 'Quality C', system: 350, physical: 342, disc: -8, date: '2026-04-08', by: 'Karim H.' },
  { id: 4, product: 'Bell Peppers', grade: 'Extra', system: 80, physical: 80, disc: 0, date: '2026-04-07', by: 'Sami R.' },
  { id: 5, product: 'Avocados', grade: 'Extra', system: 45, physical: 44, disc: -1, date: '2026-04-07', by: 'Karim H.' },
];

const mockDispatchItems = [
  { id: 1, product: 'Roma Tomatoes - Extra', ordered: 50, loaded: 50, verified: true },
  { id: 2, product: 'Cucumbers - Quality A', ordered: 30, loaded: 30, verified: true },
  { id: 3, product: 'Bell Peppers - Extra', ordered: 20, loaded: 20, verified: false },
  { id: 4, product: 'Potatoes - Quality C', ordered: 80, loaded: 78, verified: false },
  { id: 5, product: 'Avocados - Extra', ordered: 15, loaded: 15, verified: false },
  { id: 6, product: 'Lemons - Quality A', ordered: 25, loaded: 25, verified: false },
];

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
  const [dispatchChecklist, setDispatchChecklist] = useState(mockDispatchItems);

  const { data: apiData } = useFetch('/quality/inspections');

  const toggleVerify = (id) => setDispatchChecklist((prev) => prev.map((i) => i.id === id ? { ...i, verified: !i.verified } : i));
  const allVerified = dispatchChecklist.every((i) => i.verified);

  return (
    <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
      <motion.div variants={fadeInUp}>
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
            <Card><CardContent className="p-6"><DataTable columns={weightColumns} data={mockWeight} searchPlaceholder="Search..." searchColumn="product" /></CardContent></Card>
          </TabsContent>

          {/* Supplier Ratings */}
          <TabsContent value="ratings" className="mt-6 space-y-6">
            <div className="flex justify-end"><Button onClick={() => setRatingDialog(true)}><Star className="w-4 h-4 mr-2" /> Rate Supplier</Button></div>
            <Card><CardContent className="p-6"><DataTable columns={ratingColumns} data={mockRatings} searchPlaceholder="Search..." searchColumn="supplier" /></CardContent></Card>
            <ChartCard title="Rating Trends" subtitle="Last 12 months">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={mockRatingHistory}>
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
            <Dialog open={ratingDialog} onOpenChange={setRatingDialog}>
              <DialogContent>
                <DialogHeader><DialogTitle>Rate Supplier</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><label className="block text-brand-secondary text-sm mb-1">Supplier</label>
                    <Select><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{mockRatings.map((s) => <SelectItem key={s.id} value={s.supplier}>{s.supplier}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div><label className="block text-brand-secondary text-sm mb-1">Rating</label><div className="flex gap-1">{[1,2,3,4,5].map((s) => <button key={s} className="p-1"><Star className="w-8 h-8 text-brand-border hover:fill-brand-warning hover:text-brand-warning" /></button>)}</div></div>
                  <div><label className="block text-brand-secondary text-sm mb-1">Notes</label><textarea className="w-full bg-brand-elevated border border-brand-border rounded-lg p-3 text-brand-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-accent resize-none" rows={3} /></div>
                  <Button className="w-full">Submit Rating</Button>
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
                  {[['Extra', 'Extra'], ['A / B', 'Quality A'], ['C++ / C', 'Quality C'], ['Reject', 'Waste']].map(([from, to]) => (
                    <div key={from} className="bg-brand-elevated rounded-lg p-3 text-center"><p className="text-brand-accent font-semibold">{from}</p><p className="text-brand-muted text-xs mt-1">maps to {to}</p></div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card><CardContent className="p-6"><DataTable columns={gradingColumns} data={mockGrading} searchPlaceholder="Search..." searchColumn="product" /></CardContent></Card>
          </TabsContent>

          {/* Waste */}
          <TabsContent value="waste" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <KPICard title="Waste Cost This Week" value={formatCurrency(284)} icon={Trash2} trend="down" trendValue={12} />
              <KPICard title="Waste % of Inventory" value="2.1%" icon={AlertTriangle} trend="down" trendValue={0.3} />
            </div>
            <ChartCard title="Daily Waste Cost" subtitle="Last 14 days">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={mockWasteTrend}>
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
          </TabsContent>

          {/* Fleet */}
          <TabsContent value="fleet" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockVehicles.map((v) => (
                <Card key={v.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3"><Truck className="w-6 h-6 text-brand-accent" /><Badge variant={v.status === 'Active' ? 'success' : 'warning'}>{v.status}</Badge></div>
                    <p className="text-brand-primary font-semibold">{v.plate}</p><p className="text-brand-muted text-sm">{v.model}</p>
                    <div className="mt-3 pt-3 border-t border-brand-border text-xs text-brand-secondary space-y-1"><p>Mileage: {v.mileage.toLocaleString()} km</p><p>Next: {v.next}</p></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Spot Checks */}
          <TabsContent value="spot" className="mt-6 space-y-4">
            <div className="flex justify-end"><Button><ClipboardCheck className="w-4 h-4 mr-2" /> New Spot Check</Button></div>
            <Card><CardContent className="p-6"><DataTable columns={spotCheckColumns} data={mockSpotChecks} /></CardContent></Card>
          </TabsContent>

          {/* Pre-Dispatch Checklist */}
          <TabsContent value="predispatch" className="mt-6 space-y-6">
            <div className="max-w-sm">
              <label className="block text-brand-secondary text-sm font-medium mb-2">Select Dispatch</label>
              <Select defaultValue="D-392">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="D-392">D-392 - Al Mandaloun (24 items)</SelectItem>
                  <SelectItem value="D-393">D-393 - Le Petit Chef (18 items)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-brand-primary font-semibold mb-4">Items Checklist</h3>
                <div className="space-y-2">
                  {dispatchChecklist.map((item) => (
                    <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${item.verified ? 'bg-brand-success/10 border-brand-success/30' : item.loaded !== item.ordered ? 'bg-brand-warning/10 border-brand-warning/30' : 'bg-brand-elevated border-brand-border hover:border-brand-accent/30'}`} onClick={() => toggleVerify(item.id)}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${item.verified ? 'bg-brand-success border-brand-success' : 'border-brand-border'}`}>{item.verified && <PackageCheck className="w-3 h-3 text-white" />}</div>
                        <span className="text-brand-primary text-sm">{item.product}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-brand-secondary">Ordered: {item.ordered}kg</span>
                        <span className={item.loaded !== item.ordered ? 'text-brand-warning font-semibold' : 'text-brand-primary'}>Loaded: {item.loaded}kg</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="mt-6 w-full" disabled={!allVerified}><PackageCheck className="w-4 h-4 mr-2" /> Approve Dispatch</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

export { QualityControl };
export default QualityControl;
