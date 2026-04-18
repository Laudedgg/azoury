import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, ShoppingCart, Minus, Trash2, Calendar, FileText, ChevronDown, Download, Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { DataTable } from '@/components/tables/DataTable';
import { OrderForm } from '@/components/forms/OrderForm';
import { useFetch } from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';
import { toast } from 'sonner';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const mockProducts = [
  { id: 1, name: 'Roma Tomatoes', image: null, tiers: [{ grade: 'Extra', price: 4.20 }, { grade: 'Quality A', price: 3.50 }, { grade: 'Cooking', price: 2.80 }] },
  { id: 2, name: 'Cucumbers', image: null, tiers: [{ grade: 'Extra', price: 3.10 }, { grade: 'Quality A', price: 2.60 }, { grade: 'Cooking', price: 2.00 }] },
  { id: 3, name: 'Bell Peppers', image: null, tiers: [{ grade: 'Extra', price: 5.50 }, { grade: 'Quality A', price: 4.80 }, { grade: 'Cooking', price: 3.80 }] },
  { id: 4, name: 'Potatoes', image: null, tiers: [{ grade: 'Extra', price: 1.50 }, { grade: 'Quality A', price: 1.20 }, { grade: 'Cooking', price: 0.95 }] },
  { id: 5, name: 'Avocados', image: null, tiers: [{ grade: 'Extra', price: 7.80 }, { grade: 'Quality A', price: 6.50 }] },
  { id: 6, name: 'Bananas', image: null, tiers: [{ grade: 'Extra', price: 2.00 }, { grade: 'Quality A', price: 1.60 }, { grade: 'Cooking', price: 1.20 }] },
  { id: 7, name: 'Lemons', image: null, tiers: [{ grade: 'Extra', price: 3.40 }, { grade: 'Quality A', price: 2.80 }, { grade: 'Cooking', price: 2.20 }] },
  { id: 8, name: 'Onions', image: null, tiers: [{ grade: 'Quality A', price: 1.00 }, { grade: 'Cooking', price: 0.80 }] },
  { id: 9, name: 'Carrots', image: null, tiers: [{ grade: 'Quality A', price: 1.40 }, { grade: 'Cooking', price: 1.10 }] },
  { id: 10, name: 'Iceberg Lettuce', image: null, tiers: [{ grade: 'Extra', price: 2.50 }, { grade: 'Quality A', price: 1.80 }] },
  { id: 11, name: 'Mangoes', image: null, tiers: [{ grade: 'Extra', price: 5.00 }, { grade: 'Quality A', price: 4.00 }] },
  { id: 12, name: 'Strawberries', image: null, tiers: [{ grade: 'Extra', price: 6.50 }, { grade: 'Quality A', price: 5.20 }] },
];

const mockActiveOrders = [
  { id: 1, orderRef: '#1847', items: 24, total: 3240, deliveryDate: '2026-04-09', status: 'Preparing', createdAt: '2026-04-08' },
  { id: 2, orderRef: '#1850', items: 18, total: 2450, deliveryDate: '2026-04-10', status: 'Confirmed', createdAt: '2026-04-08' },
];

const mockOrderHistory = [
  { id: 3, orderRef: '#1839', items: 18, total: 2850, deliveryDate: '2026-04-07', status: 'Delivered', createdAt: '2026-04-06' },
  { id: 4, orderRef: '#1832', items: 31, total: 4120, deliveryDate: '2026-04-06', status: 'Delivered', createdAt: '2026-04-05' },
  { id: 5, orderRef: '#1825', items: 15, total: 1890, deliveryDate: '2026-04-05', status: 'Delivered', createdAt: '2026-04-04' },
  { id: 6, orderRef: '#1818', items: 22, total: 2560, deliveryDate: '2026-04-04', status: 'Delivered', createdAt: '2026-04-03' },
  { id: 7, orderRef: '#1810', items: 28, total: 3450, deliveryDate: '2026-04-03', status: 'Delivered', createdAt: '2026-04-02' },
  { id: 8, orderRef: '#1803', items: 12, total: 1650, deliveryDate: '2026-04-02', status: 'Delivered', createdAt: '2026-04-01' },
  { id: 9, orderRef: '#1796', items: 20, total: 2780, deliveryDate: '2026-04-01', status: 'Delivered', createdAt: '2026-03-31' },
  { id: 10, orderRef: '#1789', items: 35, total: 4580, deliveryDate: '2026-03-31', status: 'Delivered', createdAt: '2026-03-30' },
];

const activeOrderColumns = [
  { accessorKey: 'orderRef', header: 'Order #', cell: ({ row }) => `#${row.original.orderNumber || row.original.orderRef || row.original.id}` },
  { accessorKey: 'items', header: 'Items', cell: ({ row }) => `${row.original._count?.items ?? row.original.items ?? 0} items` },
  { accessorKey: 'total', header: 'Total', cell: ({ row }) => formatCurrency(row.original.total) },
  { accessorKey: 'deliveryDate', header: 'Delivery Date', cell: ({ row }) => formatDate(row.original.deliveryDate) },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={getStatusColor(row.original.status)}>{row.original.status}</Badge> },
];

const historyColumns = [
  { accessorKey: 'orderRef', header: 'Order #', cell: ({ row }) => `#${row.original.orderNumber || row.original.orderRef || row.original.id}` },
  { accessorKey: 'items', header: 'Items', cell: ({ row }) => `${row.original._count?.items ?? row.original.items ?? 0} items` },
  { accessorKey: 'total', header: 'Total', cell: ({ row }) => formatCurrency(row.original.total) },
  { accessorKey: 'deliveryDate', header: 'Delivered', cell: ({ row }) => formatDate(row.original.deliveryDate) },
  { accessorKey: 'createdAt', header: 'Placed', cell: ({ row }) => formatDate(row.original.createdAt) },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant="success">{row.original.status}</Badge> },
  {
    accessorKey: 'id',
    header: '',
    cell: () => (
      <Button variant="outline" size="sm">
        <Download className="w-3 h-3 mr-1" /> Invoice
      </Button>
    ),
  },
];

function Orders() {
  const { user } = useAuth();
  const clientId = user?.clientId;
  const [cart, setCart] = useState([]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: productsData } = useFetch('/products?page=1&limit=100');
  const { data: activeOrdersData, refetch: refetchActive } = useFetch('/orders?status=PENDING,CONFIRMED,PREPARING,DISPATCHED');
  const { data: historyData, refetch: refetchHistory } = useFetch('/orders?page=1&limit=50');

  const refetch = () => { refetchActive(); refetchHistory(); };

  // Map API products to the shape the UI expects, fallback to mock
  const products = productsData?.data
    ? productsData.data.map((p) => ({
        id: p.id,
        name: p.name,
        image: p.image || null,
        tiers: (p.qualityGrades || []).map((qg) => ({
          grade: qg.clientFacingGrade || qg.grade,
          price: qg.price,
          qualityGradeId: qg.id,
        })),
      }))
    : mockProducts;

  const addToCart = (product, tier) => {
    const key = `${product.id}-${tier.grade}`;
    setCart((prev) => {
      const existing = prev.find((c) => c.key === key);
      if (existing) {
        return prev.map((c) => c.key === key ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { key, productId: product.id, qualityGradeId: tier.qualityGradeId, name: product.name, grade: tier.grade, price: tier.price, qty: 1 }];
    });
  };

  const updateQty = (key, delta) => {
    setCart((prev) => prev.map((c) => {
      if (c.key !== key) return c;
      const newQty = c.qty + delta;
      return newQty > 0 ? { ...c, qty: newQty } : c;
    }).filter((c) => c.qty > 0));
  };

  const removeFromCart = (key) => {
    setCart((prev) => prev.filter((c) => c.key !== key));
  };

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const items = cart.map((c) => ({
        productId: c.productId,
        qualityGradeId: c.qualityGradeId,
        quantity: c.qty,
        unitPrice: c.price,
      }));
      await api.post('/orders', {
        clientId,
        deliveryDate,
        specialInstructions: instructions,
        items,
      });
      toast.success('Order placed successfully!');
      setCart([]);
      setDeliveryDate('');
      setInstructions('');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled successfully');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel order');
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-6"
    >
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl font-bold text-brand-primary">Orders</h1>
        <p className="text-brand-secondary text-sm mt-1">Browse products, place orders, and track deliveries</p>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Tabs defaultValue="place">
          <TabsList>
            <TabsTrigger value="place">
              <ShoppingCart className="w-4 h-4 mr-2" /> Place Order
            </TabsTrigger>
            <TabsTrigger value="active">
              Active Orders
            </TabsTrigger>
            <TabsTrigger value="history">
              Order History
            </TabsTrigger>
          </TabsList>

          {/* Place Order Tab */}
          <TabsContent value="place" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product Catalog */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <Card key={product.id}>
                      <CardContent className="p-4">
                        <div className="w-full h-24 bg-brand-elevated rounded-lg flex items-center justify-center mb-3">
                          <Package className="w-8 h-8 text-brand-muted" />
                        </div>
                        <p className="text-brand-primary font-semibold text-sm mb-3">{product.name}</p>
                        <div className="space-y-2">
                          {product.tiers.map((tier) => (
                            <div key={tier.grade} className="flex items-center justify-between">
                              <div>
                                <Badge variant="outline" className="text-xs">{tier.grade}</Badge>
                                <span className="text-brand-accent font-semibold text-sm ml-2">{formatCurrency(tier.price)}/kg</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addToCart(product, tier)}
                                className="h-7 text-xs"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Shopping Cart Sidebar */}
              <div>
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-brand-accent" />
                      Cart ({cart.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cart.length === 0 ? (
                      <p className="text-brand-muted text-sm text-center py-8">Cart is empty. Add products to get started.</p>
                    ) : (
                      <>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {cart.map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-2 bg-brand-elevated rounded-lg">
                              <div className="flex-1 min-w-0">
                                <p className="text-brand-primary text-sm font-medium truncate">{item.name}</p>
                                <p className="text-brand-muted text-xs">{item.grade} - {formatCurrency(item.price)}/kg</p>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                <button onClick={() => updateQty(item.key, -1)} className="w-6 h-6 rounded bg-brand-base flex items-center justify-center text-brand-secondary hover:text-brand-primary">
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-brand-primary text-sm font-medium w-6 text-center">{item.qty}</span>
                                <button onClick={() => updateQty(item.key, 1)} className="w-6 h-6 rounded bg-brand-base flex items-center justify-center text-brand-secondary hover:text-brand-primary">
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button onClick={() => removeFromCart(item.key)} className="w-6 h-6 rounded flex items-center justify-center text-brand-error hover:bg-brand-error/10">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-brand-border">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-brand-secondary font-medium">Subtotal</span>
                            <span className="text-brand-accent font-bold text-lg">{formatCurrency(subtotal)}</span>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-brand-secondary text-xs mb-1">
                                <Calendar className="w-3 h-3 inline mr-1" /> Delivery Date
                              </label>
                              <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                            </div>
                            <div>
                              <label className="block text-brand-secondary text-xs mb-1">Special Instructions</label>
                              <textarea
                                className="w-full bg-brand-elevated border border-brand-border rounded-lg p-2 text-brand-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-accent resize-none"
                                rows={2}
                                placeholder="Any special requests..."
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                              />
                            </div>
                          </div>

                          <Button
                            className="w-full mt-4"
                            disabled={submitting || cart.length === 0}
                            onClick={handleSubmitOrder}
                          >
                            {submitting ? 'Submitting...' : 'Submit Order'}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Active Orders Tab */}
          <TabsContent value="active" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <DataTable
                  columns={[...activeOrderColumns, {
                    accessorKey: 'actions',
                    header: '',
                    cell: ({ row }) => ['PENDING', 'CONFIRMED'].includes(row.original.status) ? (
                      <Button variant="outline" size="sm" onClick={() => handleCancelOrder(row.original.id)}>Cancel</Button>
                    ) : null,
                  }]}
                  data={activeOrdersData?.data || mockActiveOrders}
                  searchPlaceholder="Search orders..."
                  searchColumn="orderRef"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Order History Tab */}
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <DataTable
                  columns={historyColumns}
                  data={historyData?.data || mockOrderHistory}
                  searchPlaceholder="Search order history..."
                  searchColumn="orderRef"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

export { Orders };
export default Orders;
