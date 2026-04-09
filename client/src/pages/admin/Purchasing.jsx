import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, TrendingUp, ClipboardList, Receipt, Upload, Plus, FileText, Check, Printer, Download, X } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { DataTable } from '@/components/tables/DataTable';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { Checkbox } from '@/components/ui/Checkbox';
import { Separator } from '@/components/ui/Separator';
import { CHART_COLORS } from '@/utils/constants';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { useFetch } from '@/hooks/useFetch';
import { toast } from 'sonner';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const mockCombinedOrders = [
  { id: 1, product: 'Roma Tomatoes', totalOrdered: 450, currentStock: 120, netToPurchase: 330, supplier: 'Farm Fresh Co.', lastPrice: 2.80, unit: 'kg' },
  { id: 2, product: 'Iceberg Lettuce', totalOrdered: 280, currentStock: 350, netToPurchase: 0, supplier: 'Green Valley', lastPrice: 1.50, unit: 'kg' },
  { id: 3, product: 'Cucumbers', totalOrdered: 380, currentStock: 200, netToPurchase: 180, supplier: 'Farm Fresh Co.', lastPrice: 1.90, unit: 'kg' },
  { id: 4, product: 'Bell Peppers', totalOrdered: 220, currentStock: 90, netToPurchase: 130, supplier: 'Bekaa Farms', lastPrice: 3.20, unit: 'kg' },
  { id: 5, product: 'Bananas', totalOrdered: 500, currentStock: 600, netToPurchase: 0, supplier: 'Tropical Imports', lastPrice: 1.20, unit: 'kg' },
  { id: 6, product: 'Potatoes', totalOrdered: 800, currentStock: 450, netToPurchase: 350, supplier: 'Mountain Produce', lastPrice: 0.90, unit: 'kg' },
  { id: 7, product: 'Onions', totalOrdered: 600, currentStock: 380, netToPurchase: 220, supplier: 'Bekaa Farms', lastPrice: 0.75, unit: 'kg' },
  { id: 8, product: 'Carrots', totalOrdered: 340, currentStock: 400, netToPurchase: 0, supplier: 'Farm Fresh Co.', lastPrice: 1.10, unit: 'kg' },
  { id: 9, product: 'Avocados', totalOrdered: 150, currentStock: 40, netToPurchase: 110, supplier: 'Tropical Imports', lastPrice: 4.50, unit: 'kg' },
  { id: 10, product: 'Lemons', totalOrdered: 260, currentStock: 180, netToPurchase: 80, supplier: 'South Coast Citrus', lastPrice: 2.00, unit: 'kg' },
];

const mockSupplierComparison = [
  { name: 'Farm Fresh Co.', currentPrice: 2.80, avg7: 2.75, avg30: 2.68, ytd: 2.55, lastYear: 2.30, trend: 'Rising' },
  { name: 'Bekaa Farms', currentPrice: 2.95, avg7: 2.90, avg30: 2.82, ytd: 2.70, lastYear: 2.45, trend: 'Rising' },
  { name: 'Green Valley', currentPrice: 2.60, avg7: 2.65, avg30: 2.70, ytd: 2.60, lastYear: 2.50, trend: 'Falling' },
  { name: 'Mountain Produce', currentPrice: 2.70, avg7: 2.72, avg30: 2.75, ytd: 2.65, lastYear: 2.40, trend: 'Stable' },
];

const generatePriceHistory = () => {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      'Farm Fresh Co.': +(2.5 + Math.random() * 0.6).toFixed(2),
      'Bekaa Farms': +(2.6 + Math.random() * 0.7).toFixed(2),
      'Green Valley': +(2.3 + Math.random() * 0.5).toFixed(2),
    });
  }
  return data;
};

const mockSurveys = [
  { id: 1, date: '2026-04-08', supplier: 'Farm Fresh Co.', product: 'Roma Tomatoes', price: 2.80 },
  { id: 2, date: '2026-04-08', supplier: 'Bekaa Farms', product: 'Roma Tomatoes', price: 2.95 },
  { id: 3, date: '2026-04-07', supplier: 'Green Valley', product: 'Cucumbers', price: 1.85 },
  { id: 4, date: '2026-04-07', supplier: 'Farm Fresh Co.', product: 'Cucumbers', price: 1.90 },
  { id: 5, date: '2026-04-06', supplier: 'Mountain Produce', product: 'Potatoes', price: 0.88 },
  { id: 6, date: '2026-04-06', supplier: 'Bekaa Farms', product: 'Onions', price: 0.78 },
  { id: 7, date: '2026-04-05', supplier: 'Tropical Imports', product: 'Avocados', price: 4.55 },
  { id: 8, date: '2026-04-05', supplier: 'South Coast Citrus', product: 'Lemons', price: 1.95 },
];

const mockReceipts = [
  { id: 1, date: '2026-04-08', supplier: 'Farm Fresh Co.', total: 3420 },
  { id: 2, date: '2026-04-07', supplier: 'Bekaa Farms', total: 2150 },
  { id: 3, date: '2026-04-06', supplier: 'Tropical Imports', total: 1890 },
  { id: 4, date: '2026-04-05', supplier: 'Green Valley', total: 4200 },
  { id: 5, date: '2026-04-04', supplier: 'Mountain Produce', total: 2780 },
  { id: 6, date: '2026-04-03', supplier: 'South Coast Citrus', total: 1560 },
];

const products = ['Roma Tomatoes', 'Cucumbers', 'Potatoes', 'Bell Peppers', 'Avocados'];
const suppliers = ['Farm Fresh Co.', 'Bekaa Farms', 'Green Valley', 'Mountain Produce', 'Tropical Imports', 'South Coast Citrus'];

function Purchasing() {
  const [selectedProduct, setSelectedProduct] = useState('Roma Tomatoes');
  const [receiptDialog, setReceiptDialog] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [poDialogOpen, setPODialogOpen] = useState(false);
  const [poQuantities, setPOQuantities] = useState({});
  const [poSuppliers, setPOSuppliers] = useState({});
  const [poNotes, setPONotes] = useState('');
  const [generatedPOs, setGeneratedPOs] = useState([]);
  const [viewPO, setViewPO] = useState(null);

  const { data: apiData } = useFetch('/purchasing/orders');
  const priceHistory = useMemo(() => generatePriceHistory(), []);

  const itemsNeedingPurchase = mockCombinedOrders.filter((o) => o.netToPurchase > 0);

  const toggleItem = (id) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  };

  const toggleAll = () => {
    if (Object.keys(selectedItems).length === itemsNeedingPurchase.length) {
      setSelectedItems({});
    } else {
      const all = {};
      itemsNeedingPurchase.forEach((item) => { all[item.id] = true; });
      setSelectedItems(all);
    }
  };

  const selectedCount = Object.keys(selectedItems).length;

  const openPODialog = () => {
    const initQty = {};
    const initSupp = {};
    itemsNeedingPurchase.filter((i) => selectedItems[i.id]).forEach((item) => {
      initQty[item.id] = item.netToPurchase;
      initSupp[item.id] = item.supplier;
    });
    setPOQuantities(initQty);
    setPOSuppliers(initSupp);
    setPONotes('');
    setPODialogOpen(true);
  };

  const selectedPOItems = itemsNeedingPurchase.filter((i) => selectedItems[i.id]);

  const poTotal = selectedPOItems.reduce((sum, item) => {
    const qty = poQuantities[item.id] || item.netToPurchase;
    return sum + qty * item.lastPrice;
  }, 0);

  // Group selected items by supplier for PO generation
  const groupedBySupplier = useMemo(() => {
    const groups = {};
    selectedPOItems.forEach((item) => {
      const supp = poSuppliers[item.id] || item.supplier;
      if (!groups[supp]) groups[supp] = [];
      groups[supp].push({ ...item, orderQty: poQuantities[item.id] || item.netToPurchase });
    });
    return groups;
  }, [selectedPOItems, poSuppliers, poQuantities]);

  const generatePO = () => {
    const now = new Date();
    const newPOs = Object.entries(groupedBySupplier).map(([supplier, items], idx) => ({
      id: `PO-${String(generatedPOs.length + idx + 1).padStart(4, '0')}`,
      supplier,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      items: items.map((i) => ({
        product: i.product,
        quantity: i.orderQty,
        unit: i.unit,
        unitPrice: i.lastPrice,
        total: i.orderQty * i.lastPrice,
      })),
      total: items.reduce((s, i) => s + i.orderQty * i.lastPrice, 0),
      notes: poNotes,
      status: 'DRAFT',
    }));

    setGeneratedPOs((prev) => [...newPOs, ...prev]);
    setPODialogOpen(false);
    setSelectedItems({});
    toast.success(`${newPOs.length} Purchase Order${newPOs.length > 1 ? 's' : ''} generated successfully`);
  };

  const combinedColumns = [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={selectedCount === itemsNeedingPurchase.length && itemsNeedingPurchase.length > 0}
          onCheckedChange={toggleAll}
        />
      ),
      cell: ({ row }) => {
        const item = row.original;
        if (item.netToPurchase <= 0) return null;
        return <Checkbox checked={!!selectedItems[item.id]} onCheckedChange={() => toggleItem(item.id)} />;
      },
      size: 40,
    },
    { accessorKey: 'product', header: 'Product' },
    { accessorKey: 'totalOrdered', header: 'Total Ordered (kg)' },
    { accessorKey: 'currentStock', header: 'Current Stock (kg)' },
    {
      accessorKey: 'netToPurchase',
      header: 'Net to Purchase (kg)',
      cell: ({ row }) => {
        const v = row.original.netToPurchase;
        return <span className={v > 0 ? 'text-brand-error font-semibold' : 'text-brand-success font-semibold'}>{v > 0 ? v : 'Sufficient'}</span>;
      },
    },
    { accessorKey: 'supplier', header: 'Suggested Supplier' },
    { accessorKey: 'lastPrice', header: 'Last Price', cell: ({ row }) => formatCurrency(row.original.lastPrice) },
  ];

  const comparisonColumns = [
    { accessorKey: 'name', header: 'Supplier' },
    { accessorKey: 'currentPrice', header: 'Current', cell: ({ row }) => formatCurrency(row.original.currentPrice) },
    { accessorKey: 'avg7', header: '7-Day Avg', cell: ({ row }) => formatCurrency(row.original.avg7) },
    { accessorKey: 'avg30', header: '30-Day Avg', cell: ({ row }) => formatCurrency(row.original.avg30) },
    { accessorKey: 'ytd', header: 'YTD', cell: ({ row }) => formatCurrency(row.original.ytd) },
    { accessorKey: 'lastYear', header: 'Last Year', cell: ({ row }) => formatCurrency(row.original.lastYear) },
    {
      accessorKey: 'trend',
      header: 'Trend',
      cell: ({ row }) => {
        const t = row.original.trend;
        return <Badge variant={t === 'Rising' ? 'error' : t === 'Falling' ? 'success' : 'default'}>{t}</Badge>;
      },
    },
  ];

  const surveyColumns = [
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'supplier', header: 'Supplier' },
    { accessorKey: 'product', header: 'Product' },
    { accessorKey: 'price', header: 'Price/kg', cell: ({ row }) => formatCurrency(row.original.price) },
  ];

  return (
    <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl font-bold text-brand-primary">Purchase Management</h1>
        <p className="text-brand-secondary text-sm mt-1">Manage orders, suppliers, and procurement</p>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Tabs defaultValue="combined">
          <TabsList>
            <TabsTrigger value="combined"><ShoppingBag className="w-4 h-4 mr-2" /> Combined Orders</TabsTrigger>
            <TabsTrigger value="comparison"><TrendingUp className="w-4 h-4 mr-2" /> Supplier Comparison</TabsTrigger>
            <TabsTrigger value="surveys"><ClipboardList className="w-4 h-4 mr-2" /> Price Surveys</TabsTrigger>
            <TabsTrigger value="receipts"><Receipt className="w-4 h-4 mr-2" /> Receipt Archive</TabsTrigger>
          </TabsList>

          {/* Tab 1: Combined Orders */}
          <TabsContent value="combined" className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-brand-secondary text-sm">Aggregated product needs across all pending orders</p>
              <Button onClick={openPODialog} disabled={selectedCount === 0}>
                <FileText className="w-4 h-4 mr-2" /> Generate PO ({selectedCount})
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <DataTable
                  columns={combinedColumns}
                  data={apiData?.orders || mockCombinedOrders}
                  searchPlaceholder="Search products..."
                  searchColumn="product"
                />
              </CardContent>
            </Card>

            {/* Generated POs section */}
            {generatedPOs.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-brand-primary font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-accent" />
                  Generated Purchase Orders ({generatedPOs.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {generatedPOs.map((po) => (
                    <Card key={po.id} className="hover:border-brand-accent/40 transition-colors cursor-pointer" onClick={() => setViewPO(po)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-mono text-brand-accent font-semibold text-sm">{po.id}</span>
                          <Badge variant={po.status === 'DRAFT' ? 'warning' : 'success'}>{po.status}</Badge>
                        </div>
                        <p className="text-brand-primary font-medium text-sm">{po.supplier}</p>
                        <p className="text-brand-muted text-xs mt-0.5">{po.date} at {po.time}</p>
                        <Separator className="my-3" />
                        <div className="flex items-center justify-between">
                          <span className="text-brand-secondary text-xs">{po.items.length} item{po.items.length > 1 ? 's' : ''}</span>
                          <span className="text-brand-accent font-bold">{formatCurrency(po.total)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Supplier Comparison */}
          <TabsContent value="comparison" className="mt-6 space-y-6">
            <div className="max-w-xs">
              <label className="block text-brand-secondary text-sm font-medium mb-2">Select Product</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-6">
                <DataTable columns={comparisonColumns} data={mockSupplierComparison} />
              </CardContent>
            </Card>

            <ChartCard title="Price History - Top 3 Suppliers" subtitle="Last 30 days">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A3F3F" />
                  <XAxis dataKey="date" tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fill: '#5A7A75', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#143535', border: '1px solid #1A3F3F', borderRadius: '8px', color: '#E8F5F3' }} />
                  <Legend wrapperStyle={{ color: '#8AABA6', fontSize: 12 }} />
                  <Line type="monotone" dataKey="Farm Fresh Co." stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Bekaa Farms" stroke={CHART_COLORS[1]} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Green Valley" stroke={CHART_COLORS[2]} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>

          {/* Tab 3: Price Surveys */}
          <TabsContent value="surveys" className="mt-6 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-brand-primary font-semibold mb-4">Add Price Survey</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-brand-secondary text-xs mb-1">Supplier</label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{suppliers.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-brand-secondary text-xs mb-1">Product</label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>{products.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-brand-secondary text-xs mb-1">Price per kg</label>
                    <Input type="number" step="0.01" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-brand-secondary text-xs mb-1">Date</label>
                    <Input type="date" defaultValue="2026-04-09" />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full"><Plus className="w-4 h-4 mr-1" /> Add Survey</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <DataTable columns={surveyColumns} data={mockSurveys} searchPlaceholder="Search surveys..." searchColumn="supplier" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Receipt Archive */}
          <TabsContent value="receipts" className="mt-6 space-y-6">
            <Card className="border-2 border-dashed border-brand-border hover:border-brand-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-12 text-center">
                <Upload className="w-10 h-10 text-brand-muted mx-auto mb-3" />
                <p className="text-brand-primary font-medium">Drop receipt images here</p>
                <p className="text-brand-muted text-sm mt-1">or click to browse (JPG, PNG, PDF)</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockReceipts.map((receipt) => (
                <Card key={receipt.id} className="cursor-pointer hover:border-brand-accent/50 transition-all" onClick={() => setReceiptDialog(receipt)}>
                  <CardContent className="p-4">
                    <div className="w-full h-40 bg-brand-elevated rounded-lg flex items-center justify-center mb-3">
                      <Receipt className="w-10 h-10 text-brand-muted" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-brand-primary text-sm font-medium">{receipt.supplier}</p>
                        <p className="text-brand-muted text-xs">{receipt.date}</p>
                      </div>
                      <p className="text-brand-accent font-semibold">{formatCurrency(receipt.total)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {receiptDialog && (
              <Dialog open onOpenChange={() => setReceiptDialog(null)}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Receipt Detail</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="w-full h-64 bg-brand-elevated rounded-lg flex items-center justify-center">
                      <Receipt className="w-16 h-16 text-brand-muted" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-brand-muted">Supplier</p>
                        <p className="text-brand-primary font-medium">{receiptDialog.supplier}</p>
                      </div>
                      <div>
                        <p className="text-brand-muted">Date</p>
                        <p className="text-brand-primary font-medium">{receiptDialog.date}</p>
                      </div>
                      <div>
                        <p className="text-brand-muted">Total Amount</p>
                        <p className="text-brand-accent font-semibold">{formatCurrency(receiptDialog.total)}</p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Generate PO Dialog */}
      <Dialog open={poDialogOpen} onOpenChange={setPODialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-accent" />
              Generate Purchase Order
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Info */}
            <p className="text-brand-secondary text-sm">
              {Object.keys(groupedBySupplier).length > 1
                ? `Items will be split into ${Object.keys(groupedBySupplier).length} separate POs by supplier.`
                : 'Review items and adjust quantities before generating.'}
            </p>

            {/* Items grouped by supplier */}
            {Object.entries(groupedBySupplier).map(([supplier, items]) => (
              <div key={supplier} className="border border-brand-border rounded-lg overflow-hidden">
                <div className="bg-brand-elevated px-4 py-2.5 flex items-center justify-between">
                  <span className="text-brand-primary font-medium text-sm">{supplier}</span>
                  <span className="text-brand-accent text-sm font-semibold">
                    {formatCurrency(items.reduce((s, i) => s + (poQuantities[i.id] || i.netToPurchase) * i.lastPrice, 0))}
                  </span>
                </div>
                <div className="divide-y divide-brand-border">
                  {items.map((item) => (
                    <div key={item.id} className="px-4 py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-brand-primary text-sm font-medium">{item.product}</p>
                        <p className="text-brand-muted text-xs">{formatCurrency(item.lastPrice)} / {item.unit}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24">
                          <Input
                            type="number"
                            value={poQuantities[item.id] || item.netToPurchase}
                            onChange={(e) => setPOQuantities((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))}
                            className="text-center h-9 text-sm"
                            min={1}
                          />
                        </div>
                        <span className="text-brand-secondary text-xs w-6">{item.unit}</span>
                        <span className="text-brand-primary text-sm font-semibold w-20 text-right">
                          {formatCurrency((poQuantities[item.id] || item.netToPurchase) * item.lastPrice)}
                        </span>
                        <Select
                          value={poSuppliers[item.id] || item.supplier}
                          onValueChange={(val) => setPOSuppliers((prev) => ({ ...prev, [item.id]: val }))}
                        >
                          <SelectTrigger className="w-40 h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Notes */}
            <div>
              <label className="block text-brand-secondary text-sm font-medium mb-1.5">Notes (optional)</label>
              <textarea
                value={poNotes}
                onChange={(e) => setPONotes(e.target.value)}
                rows={2}
                placeholder="Special instructions for this purchase order..."
                className="w-full bg-brand-elevated border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-primary placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent/40 resize-none"
              />
            </div>

            <Separator />

            {/* Total + Actions */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-muted text-xs">Grand Total</p>
                <p className="text-brand-accent text-2xl font-bold">{formatCurrency(poTotal)}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setPODialogOpen(false)}>Cancel</Button>
                <Button onClick={generatePO}>
                  <Check className="w-4 h-4 mr-2" />
                  Generate {Object.keys(groupedBySupplier).length > 1 ? `${Object.keys(groupedBySupplier).length} POs` : 'PO'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View PO Dialog */}
      {viewPO && (
        <Dialog open onOpenChange={() => setViewPO(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-accent" />
                  {viewPO.id}
                </span>
                <Badge variant={viewPO.status === 'DRAFT' ? 'warning' : 'success'}>{viewPO.status}</Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-brand-muted text-xs">Supplier</p>
                  <p className="text-brand-primary font-medium">{viewPO.supplier}</p>
                </div>
                <div>
                  <p className="text-brand-muted text-xs">Date</p>
                  <p className="text-brand-primary font-medium">{viewPO.date} {viewPO.time}</p>
                </div>
              </div>

              <Separator />

              {/* Line items */}
              <div className="border border-brand-border rounded-lg overflow-hidden">
                <div className="bg-brand-elevated px-4 py-2 grid grid-cols-12 gap-2 text-xs text-brand-muted font-medium">
                  <span className="col-span-5">Product</span>
                  <span className="col-span-2 text-right">Qty</span>
                  <span className="col-span-2 text-right">Price</span>
                  <span className="col-span-3 text-right">Total</span>
                </div>
                <div className="divide-y divide-brand-border">
                  {viewPO.items.map((item, i) => (
                    <div key={i} className="px-4 py-2.5 grid grid-cols-12 gap-2 text-sm">
                      <span className="col-span-5 text-brand-primary">{item.product}</span>
                      <span className="col-span-2 text-right text-brand-secondary">{item.quantity} {item.unit}</span>
                      <span className="col-span-2 text-right text-brand-secondary">{formatCurrency(item.unitPrice)}</span>
                      <span className="col-span-3 text-right text-brand-primary font-medium">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-brand-elevated px-4 py-2.5 flex items-center justify-between border-t border-brand-border">
                  <span className="text-brand-secondary text-sm font-medium">Total</span>
                  <span className="text-brand-accent text-lg font-bold">{formatCurrency(viewPO.total)}</span>
                </div>
              </div>

              {viewPO.notes && (
                <div>
                  <p className="text-brand-muted text-xs mb-1">Notes</p>
                  <p className="text-brand-secondary text-sm">{viewPO.notes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => { toast.success('PO sent to supplier'); setViewPO(null); }}>
                  <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
                <Button className="flex-1" onClick={() => {
                  setGeneratedPOs((prev) => prev.map((p) => p.id === viewPO.id ? { ...p, status: 'SENT' } : p));
                  toast.success(`${viewPO.id} sent to ${viewPO.supplier}`);
                  setViewPO(null);
                }}>
                  <Check className="w-4 h-4 mr-2" /> Send to Supplier
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}

export { Purchasing };
export default Purchasing;
