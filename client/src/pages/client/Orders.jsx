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

  // Map API products to the shape the UI expects (active only)
  const products = (productsData?.data || []).filter((p) => p.isActive !== false).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    subDescription: p.subDescription || '',
    category: p.category,
    unit: p.unit,
    image: p.image || null,
    tiers: (p.qualityGrades || []).map((qg) => ({
      grade: qg.clientFacingGrade || qg.grade,
      price: qg.price,
      qualityGradeId: qg.id,
    })),
  }));

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
      className="space-y-4 lg:space-y-6"
    >
      <motion.div variants={fadeInUp} className="hidden lg:block">
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
                {products.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center">
                      <Package className="w-10 h-10 mx-auto text-brand-muted mb-3" />
                      <p className="text-brand-primary font-medium">No products available yet</p>
                      <p className="text-brand-muted text-sm mt-1">The catalog will appear here once products are added.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <Card key={product.id}>
                        <CardContent className="p-4">
                          <div className="w-full h-24 bg-brand-elevated rounded-lg flex items-center justify-center mb-3">
                            <Package className="w-8 h-8 text-brand-muted" />
                          </div>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-brand-primary font-semibold text-sm">{product.name}</p>
                            {product.unit && <Badge variant="outline" className="text-[10px] shrink-0">{product.unit}</Badge>}
                          </div>
                          {product.description && (
                            <p className="text-brand-secondary text-xs mb-0.5">{product.description}</p>
                          )}
                          {product.subDescription && (
                            <p className="text-brand-muted text-xs mb-3">{product.subDescription}</p>
                          )}
                          {product.tiers.length === 0 ? (
                            <p className="text-brand-muted text-xs italic mt-2">Pricing coming soon</p>
                          ) : (
                            <div className="space-y-2 mt-3">
                              {product.tiers.map((tier) => (
                                <div key={tier.grade} className="flex items-center justify-between">
                                  <div>
                                    <Badge variant="outline" className="text-xs">{tier.grade}</Badge>
                                    <span className="text-brand-accent font-semibold text-sm ml-2">{formatCurrency(tier.price)}/{product.unit || 'kg'}</span>
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
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
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
                  data={activeOrdersData?.data || []}
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
                  data={historyData?.data || []}
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
