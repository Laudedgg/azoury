import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, TrendingUp, ClipboardList, Receipt, Upload, Plus } from 'lucide-react';
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
import { CHART_COLORS } from '@/utils/constants';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { useFetch } from '@/hooks/useFetch';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const mockCombinedOrders = [
  { id: 1, product: 'Roma Tomatoes', totalOrdered: 450, currentStock: 120, netToPurchase: 330, supplier: 'Farm Fresh Co.', lastPrice: 2.80 },
  { id: 2, product: 'Iceberg Lettuce', totalOrdered: 280, currentStock: 350, netToPurchase: 0, supplier: 'Green Valley', lastPrice: 1.50 },
  { id: 3, product: 'Cucumbers', totalOrdered: 380, currentStock: 200, netToPurchase: 180, supplier: 'Farm Fresh Co.', lastPrice: 1.90 },
  { id: 4, product: 'Bell Peppers', totalOrdered: 220, currentStock: 90, netToPurchase: 130, supplier: 'Bekaa Farms', lastPrice: 3.20 },
  { id: 5, product: 'Bananas', totalOrdered: 500, currentStock: 600, netToPurchase: 0, supplier: 'Tropical Imports', lastPrice: 1.20 },
  { id: 6, product: 'Potatoes', totalOrdered: 800, currentStock: 450, netToPurchase: 350, supplier: 'Mountain Produce', lastPrice: 0.90 },
  { id: 7, product: 'Onions', totalOrdered: 600, currentStock: 380, netToPurchase: 220, supplier: 'Bekaa Farms', lastPrice: 0.75 },
  { id: 8, product: 'Carrots', totalOrdered: 340, currentStock: 400, netToPurchase: 0, supplier: 'Farm Fresh Co.', lastPrice: 1.10 },
  { id: 9, product: 'Avocados', totalOrdered: 150, currentStock: 40, netToPurchase: 110, supplier: 'Tropical Imports', lastPrice: 4.50 },
  { id: 10, product: 'Lemons', totalOrdered: 260, currentStock: 180, netToPurchase: 80, supplier: 'South Coast Citrus', lastPrice: 2.00 },
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

const combinedColumns = [
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

const products = ['Roma Tomatoes', 'Cucumbers', 'Potatoes', 'Bell Peppers', 'Avocados'];
const suppliers = ['Farm Fresh Co.', 'Bekaa Farms', 'Green Valley', 'Mountain Produce', 'Tropical Imports', 'South Coast Citrus'];

function Purchasing() {
  const [selectedProduct, setSelectedProduct] = useState('Roma Tomatoes');
  const [receiptDialog, setReceiptDialog] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const { data: apiData } = useFetch('/purchasing/orders');
  const priceHistory = generatePriceHistory();

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
            <div className="flex items-center justify-between">
              <p className="text-brand-secondary text-sm">Aggregated product needs across all pending orders</p>
              <Button disabled={selectedRows.length === 0}>
                <Plus className="w-4 h-4 mr-2" /> Generate PO ({selectedRows.length})
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
                    <Input type="date" defaultValue="2026-04-08" />
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
    </motion.div>
  );
}

export { Purchasing };
export default Purchasing;
