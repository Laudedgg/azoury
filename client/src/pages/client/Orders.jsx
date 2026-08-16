import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, ShoppingCart, Minus, Trash2, Calendar, Package, Printer, Search, X, RotateCcw,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { printInvoice, printTable } from '@/utils/print';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { DataTable } from '@/components/tables/DataTable';
import { useFetch } from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { formatDate, getStatusColor } from '@/utils/helpers';
import { toast } from 'sonner';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const activeOrderColumns = [
  { accessorKey: 'orderRef', header: 'Order #', cell: ({ row }) => `#${row.original.orderNumber || row.original.orderRef || row.original.id}` },
  { accessorKey: 'items', header: 'Items', cell: ({ row }) => `${row.original._count?.items ?? row.original.items ?? 0} items` },
  { accessorKey: 'deliveryDate', header: 'Delivery Date', cell: ({ row }) => formatDate(row.original.deliveryDate) },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={getStatusColor(row.original.status)}>{row.original.status}</Badge> },
];

const makeHistoryColumns = (onPrint) => [
  { accessorKey: 'orderRef', header: 'Order #', cell: ({ row }) => `#${row.original.orderNumber || row.original.orderRef || row.original.id}` },
  { accessorKey: 'items', header: 'Items', cell: ({ row }) => `${row.original._count?.items ?? row.original.items ?? 0} items` },
  { accessorKey: 'deliveryDate', header: 'Delivered', cell: ({ row }) => formatDate(row.original.deliveryDate) },
  { accessorKey: 'createdAt', header: 'Placed', cell: ({ row }) => formatDate(row.original.createdAt) },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant="success">{row.original.status}</Badge> },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Button variant="outline" size="sm" onClick={() => onPrint(row.original.id)}>
        <Printer className="w-3 h-3 mr-1" /> Print
      </Button>
    ),
  },
];

function Orders() {
  const { user } = useAuth();
  const clientId = user?.clientId;
  const role = user?.role;
  const canPlace = role === 'CLIENT_ADMIN' || role === 'CLIENT_STAFF' || role === 'CLIENT_ORDERER';
  const canReceive = role === 'CLIENT_ADMIN' || role === 'CLIENT_STAFF' || role === 'CLIENT_RECEIVER';
  const defaultTab = canPlace ? 'place' : 'active';

  const [cart, setCart] = useState([]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [pendingQty, setPendingQty] = useState({}); // productId -> string
  const [returnDialog, setReturnDialog] = useState(null); // { orderId, orderRef }
  const [returnForm, setReturnForm] = useState({ type: 'RETURN', reason: '' });
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const { data: productsData } = useFetch('/products?page=1&limit=100');
  const { data: activeOrdersData, refetch: refetchActive } = useFetch('/orders?status=PENDING,CONFIRMED,PREPARING,DISPATCHED');
  const { data: historyData, refetch: refetchHistory } = useFetch('/orders?page=1&limit=50');

  const refetch = () => { refetchActive(); refetchHistory(); };

  // Map API products to the shape the UI expects (active only). Pricing is hidden from clients
  // for now; we just use the first quality grade on each product as the order reference.
  const allProducts = (productsData?.data || []).filter((p) => p.isActive !== false).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    subDescription: p.subDescription || '',
    category: p.category,
    unit: p.unit,
    qualityGradeId: (p.qualityGrades || [])[0]?.id || null,
  }));

  const products = (() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter((p) => (
      p.name.toLowerCase().includes(q)
      || p.description.toLowerCase().includes(q)
      || p.subDescription.toLowerCase().includes(q)
      || (p.category || '').toLowerCase().includes(q)
    ));
  })();

  const setQtyFor = (productId, value) => {
    setPendingQty((m) => ({ ...m, [productId]: value }));
  };
  const bumpQtyFor = (productId, delta) => {
    setPendingQty((m) => {
      const current = Number(m[productId] ?? 1) || 0;
      const next = Math.max(1, current + delta);
      return { ...m, [productId]: String(next) };
    });
  };

  const addToCart = (product) => {
    if (!product.qualityGradeId) return;
    const raw = pendingQty[product.id] ?? '1';
    const qty = Math.max(1, Math.floor(Number(raw) || 0));
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id);
      if (existing) {
        return prev.map((c) => c.productId === product.id ? { ...c, qty: c.qty + qty } : c);
      }
      return [...prev, {
        key: product.id,
        productId: product.id,
        qualityGradeId: product.qualityGradeId,
        name: product.name,
        unit: product.unit,
        qty,
        note: '',
      }];
    });
    setPendingQty((m) => ({ ...m, [product.id]: '1' }));
    toast.success(`Added ${qty} × ${product.name} to cart`);
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

  const updateNote = (key, note) => {
    setCart((prev) => prev.map((c) => c.key === key ? { ...c, note } : c));
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    if (!deliveryDate) {
      toast.error('Please pick a delivery date');
      return;
    }
    setSubmitting(true);
    try {
      const items = cart.map((c) => ({
        productId: c.productId,
        qualityGradeId: c.qualityGradeId,
        quantity: c.qty,
        specialInstructions: c.note?.trim() || undefined,
      }));
      await api.post('/orders', {
        clientId,
        deliveryDate,
        items,
      });
      toast.success('Order placed successfully!');
      setCart([]);
      setDeliveryDate('');
      refetch();
    } catch (err) {
      const resp = err?.response?.data;
      toast.error(resp?.error || resp?.details?.[0]?.message || resp?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintOrder = async (orderId) => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      const o = res.data;
      const dispatch = o.dispatchItems?.[0]?.dispatch;
      printInvoice({ ...o, dispatch });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to load order for printing');
    }
  };

  const openReturnDialog = (order) => {
    setReturnDialog({ orderId: order.id, orderRef: `#${order.id?.slice(0, 8)}` });
    setReturnForm({ type: 'RETURN', reason: '' });
  };

  const handleSubmitReturn = async () => {
    if (!returnForm.reason.trim()) {
      toast.error('Please describe the reason');
      return;
    }
    setSubmittingReturn(true);
    try {
      await api.post('/orders/returns', {
        clientOrderId: returnDialog.orderId,
        type: returnForm.type,
        reason: returnForm.reason.trim(),
      });
      toast.success('Request submitted — our team will review it.');
      setReturnDialog(null);
      setReturnForm({ type: 'RETURN', reason: '' });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const historyColumns = React.useMemo(() => {
    const cols = [
      { accessorKey: 'orderRef', header: 'Order #', cell: ({ row }) => `#${row.original.orderNumber || row.original.orderRef || row.original.id}` },
      { accessorKey: 'items', header: 'Items', cell: ({ row }) => `${row.original._count?.items ?? row.original.items ?? 0} items` },
      { accessorKey: 'deliveryDate', header: 'Delivered', cell: ({ row }) => formatDate(row.original.deliveryDate) },
      { accessorKey: 'createdAt', header: 'Placed', cell: ({ row }) => formatDate(row.original.createdAt) },
      { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant="success">{row.original.status}</Badge> },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button variant="outline" size="sm" onClick={() => handlePrintOrder(row.original.id)}>
              <Printer className="w-3 h-3 mr-1" /> Print
            </Button>
            {canReceive && (
              <Button variant="outline" size="sm" className="text-brand-warning" onClick={() => openReturnDialog(row.original)}>
                <RotateCcw className="w-3 h-3 mr-1" /> Return
              </Button>
            )}
          </div>
        ),
      },
    ];
    return cols;
  }, [canReceive]);

  const handleCancelOrder = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled successfully');
      refetch();
    } catch (err) {
      const resp = err?.response?.data;
      toast.error(resp?.error || resp?.message || 'Failed to cancel order');
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
        <Tabs defaultValue={defaultTab}>
          <TabsList>
            {canPlace && (
              <TabsTrigger value="place">
                <ShoppingCart className="w-4 h-4 mr-2" /> Place Order
              </TabsTrigger>
            )}
            <TabsTrigger value="active">
              Active Orders
            </TabsTrigger>
            <TabsTrigger value="history">
              Order History
            </TabsTrigger>
          </TabsList>

          {/* Place Order Tab */}
          {canPlace && <TabsContent value="place" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product Catalog */}
              <div className="lg:col-span-2 space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
                  <Input
                    placeholder="Search products by name, description, or category..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-primary"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {allProducts.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center">
                      <Package className="w-10 h-10 mx-auto text-brand-muted mb-3" />
                      <p className="text-brand-primary font-medium">No products available yet</p>
                      <p className="text-brand-muted text-sm mt-1">The catalog will appear here once products are added.</p>
                    </CardContent>
                  </Card>
                ) : products.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center">
                      <Search className="w-10 h-10 mx-auto text-brand-muted mb-3" />
                      <p className="text-brand-primary font-medium">No products match "{productSearch}"</p>
                      <p className="text-brand-muted text-sm mt-1">Try a different search.</p>
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
                            {product.unit && (
                              <Badge variant="default" className="text-xs font-bold shrink-0 uppercase">
                                {product.unit}
                              </Badge>
                            )}
                          </div>
                          {product.description && (
                            <p className="text-brand-secondary text-xs mb-0.5">{product.description}</p>
                          )}
                          {product.subDescription && (
                            <p className="text-brand-muted text-xs mb-3">{product.subDescription}</p>
                          )}
                          <div className="mt-3 space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wider text-brand-muted font-medium">
                              Quantity (tap or type)
                            </label>
                            <div className="flex items-stretch gap-2">
                              <div className="flex items-stretch rounded-md border border-brand-border overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => bumpQtyFor(product.id, -1)}
                                  className="w-7 flex items-center justify-center bg-brand-elevated text-brand-secondary hover:bg-brand-base hover:text-brand-primary border-r border-brand-border"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={pendingQty[product.id] ?? '1'}
                                  onChange={(e) => setQtyFor(product.id, e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                  onBlur={(e) => {
                                    const n = Math.max(1, Math.floor(Number(e.target.value) || 1));
                                    setQtyFor(product.id, String(n));
                                  }}
                                  className="w-14 h-8 text-center text-sm font-semibold px-1 bg-brand-base border-0 rounded-none focus-visible:ring-1 focus-visible:ring-brand-accent text-brand-primary"
                                />
                                <button
                                  type="button"
                                  onClick={() => bumpQtyFor(product.id, 1)}
                                  className="w-7 flex items-center justify-center bg-brand-elevated text-brand-secondary hover:bg-brand-base hover:text-brand-primary border-l border-brand-border"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => addToCart(product)}
                                disabled={!product.qualityGradeId}
                                className="flex-1 h-8 text-xs"
                              >
                                <Plus className="w-3 h-3 mr-1" /> Add to cart
                              </Button>
                            </div>
                          </div>
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
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {cart.map((item) => (
                            <div key={item.key} className="p-2 bg-brand-elevated rounded-lg space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-brand-primary text-sm font-medium truncate">{item.name}</p>
                                  {item.unit && (
                                    <p className="text-brand-accent text-sm font-semibold uppercase tracking-wide">
                                      {item.qty} × {item.unit}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5">
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
                              <Input
                                placeholder="Note for this item (optional)"
                                value={item.note || ''}
                                onChange={(e) => updateNote(item.key, e.target.value)}
                                className="h-8 text-xs"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-brand-border">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-brand-secondary text-xs mb-1">
                                <Calendar className="w-3 h-3 inline mr-1" /> Delivery Date *
                              </label>
                              <Input
                                type="date"
                                value={deliveryDate}
                                onChange={(e) => setDeliveryDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                required
                              />
                            </div>
                          </div>

                          <Button
                            className="w-full mt-4"
                            disabled={submitting || cart.length === 0 || !deliveryDate}
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
          </TabsContent>}

          {/* Active Orders Tab */}
          <TabsContent value="active" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <DataTable
                  columns={[...activeOrderColumns, {
                    accessorKey: 'actions',
                    header: '',
                    cell: ({ row }) => (
                      <div className="flex items-center justify-end gap-1.5">
                        {canPlace && ['PENDING', 'CONFIRMED'].includes(row.original.status) && (
                          <Button variant="outline" size="sm" onClick={() => handleCancelOrder(row.original.id)}>Cancel</Button>
                        )}
                        {canReceive && ['DISPATCHED', 'DELIVERED'].includes(row.original.status) && (
                          <Button variant="outline" size="sm" className="text-brand-warning" onClick={() => openReturnDialog(row.original)}>
                            <RotateCcw className="w-3 h-3 mr-1" /> Return
                          </Button>
                        )}
                      </div>
                    ),
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

      {/* Return / refund request dialog */}
      <Dialog open={!!returnDialog} onOpenChange={(open) => { if (!open) setReturnDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request return or refund {returnDialog?.orderRef ? `· ${returnDialog.orderRef}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Type</label>
              <Select value={returnForm.type} onValueChange={(v) => setReturnForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RETURN">Return — send products back</SelectItem>
                  <SelectItem value="AMENDMENT">Amendment — request adjustment / refund</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Reason *</label>
              <textarea
                rows={4}
                value={returnForm.reason}
                onChange={(e) => setReturnForm((f) => ({ ...f, reason: e.target.value }))}
                className="w-full bg-brand-elevated border border-brand-border rounded-lg p-3 text-brand-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-accent resize-none"
                placeholder="Tell us what happened so we can process this quickly..."
              />
            </div>
            <Button className="w-full" onClick={handleSubmitReturn} disabled={submittingReturn || !returnForm.reason.trim()}>
              {submittingReturn ? 'Submitting...' : 'Submit request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export { Orders };
export default Orders;
