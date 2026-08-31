import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, ShoppingCart, Minus, Trash2, Calendar, Package, Printer, Search, X, RotateCcw,
  Sparkles, Apple, Leaf, Carrot,
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
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useFetch } from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { formatDate, getStatusColor } from '@/utils/helpers';
import { stableProduceImage } from '@/utils/produceImages';
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
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // ALL | FRUITS | VEGETABLES
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

  const products = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return allProducts.filter((p) => {
      if (categoryFilter !== 'ALL' && (p.category || '').toUpperCase() !== categoryFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q)
        || p.description.toLowerCase().includes(q)
        || p.subDescription.toLowerCase().includes(q)
        || (p.category || '').toLowerCase().includes(q)
      );
    });
  }, [allProducts, productSearch, categoryFilter]);

  const categoryCounts = useMemo(() => {
    const counts = { ALL: allProducts.length, FRUITS: 0, VEGETABLES: 0 };
    for (const p of allProducts) {
      const c = (p.category || '').toUpperCase();
      if (c === 'FRUITS' || c === 'VEGETABLES') counts[c] += 1;
    }
    return counts;
  }, [allProducts]);

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
      <motion.div variants={fadeInUp}>
        <PageHeader
          icon={ShoppingCart}
          title="Orders"
          subtitle="Browse the catalog, place orders, and track deliveries"
        />
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
                {/* Search + category filter chips */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
                    <Input
                      placeholder="Search 125 products by name, category, or grade..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10 pr-10 h-11"
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
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { key: 'ALL',        label: 'All',        icon: Sparkles, count: categoryCounts.ALL },
                      { key: 'FRUITS',     label: 'Fruits',     icon: Apple,    count: categoryCounts.FRUITS },
                      { key: 'VEGETABLES', label: 'Vegetables & Herbs', icon: Carrot, count: categoryCounts.VEGETABLES },
                    ].map((c) => {
                      const active = categoryFilter === c.key;
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setCategoryFilter(c.key)}
                          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold transition-colors border ${
                            active
                              ? 'bg-brand-accent text-brand-base border-brand-accent'
                              : 'bg-brand-surface text-brand-secondary border-brand-border hover:border-brand-accent/40 hover:text-brand-primary'
                          }`}
                        >
                          <c.icon className="w-3 h-3" />
                          {c.label}
                          <span className={`ml-1 tabular-nums ${active ? 'text-brand-base/70' : 'text-brand-muted'}`}>
                            {c.count}
                          </span>
                        </button>
                      );
                    })}
                    {products.length !== allProducts.length && (
                      <span className="text-xs text-brand-muted ml-auto">
                        Showing {products.length} of {allProducts.length}
                      </span>
                    )}
                  </div>
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
                      <p className="text-brand-primary font-medium">Nothing matches your filters</p>
                      <p className="text-brand-muted text-sm mt-1">Try clearing the search or a different category.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {products.map((product) => {
                      const img = stableProduceImage(product.name, product.category, 400);
                      const inCart = cart.find((c) => c.productId === product.id);
                      return (
                        <div
                          key={product.id}
                          className={`group rounded-xl border overflow-hidden bg-brand-surface transition-all hover:-translate-y-0.5 ${
                            inCart ? 'border-brand-accent shadow-md shadow-brand-accent/10' : 'border-brand-border hover:border-brand-accent/40'
                          }`}
                        >
                          <div className="relative aspect-square overflow-hidden bg-brand-elevated">
                            <img
                              src={img}
                              alt={product.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {product.unit && (
                              <span className="absolute top-2 right-2 rounded-full bg-brand-base/85 backdrop-blur-sm border border-brand-accent/30 text-brand-accent text-[10px] font-bold uppercase px-2 py-0.5">
                                {product.unit}
                              </span>
                            )}
                            {inCart && (
                              <span className="absolute top-2 left-2 rounded-full bg-brand-accent text-brand-base text-[10px] font-bold px-2 py-0.5">
                                In cart · {inCart.qty}
                              </span>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-brand-primary font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                              {product.name}
                            </p>
                            {product.subDescription && (
                              <p className="text-brand-muted text-[10px] uppercase tracking-wider mt-1 truncate">
                                {product.subDescription}
                              </p>
                            )}
                            <div className="mt-2.5 flex items-stretch gap-1.5">
                              <div className="flex items-stretch rounded-md border border-brand-border overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => bumpQtyFor(product.id, -1)}
                                  className="w-6 flex items-center justify-center bg-brand-elevated text-brand-secondary hover:bg-brand-base hover:text-brand-primary border-r border-brand-border"
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
                                  className="w-10 h-7 text-center text-xs font-semibold px-1 bg-brand-base border-0 rounded-none focus-visible:ring-1 focus-visible:ring-brand-accent text-brand-primary"
                                />
                                <button
                                  type="button"
                                  onClick={() => bumpQtyFor(product.id, 1)}
                                  className="w-6 flex items-center justify-center bg-brand-elevated text-brand-secondary hover:bg-brand-base hover:text-brand-primary border-l border-brand-border"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <Button
                                size="xs"
                                onClick={() => addToCart(product)}
                                disabled={!product.qualityGradeId}
                                className="flex-1 h-7 text-[11px]"
                              >
                                <Plus className="w-3 h-3" /> Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Shopping Cart Sidebar */}
              <div>
                <Card className="sticky top-4 overflow-hidden">
                  <div className="p-4 flex items-center justify-between border-b border-brand-border/60 bg-brand-elevated/30">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-brand-accent/15 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-brand-accent" />
                      </div>
                      <div>
                        <p className="text-brand-primary font-semibold text-sm">Your Cart</p>
                        <p className="text-brand-muted text-[11px]">
                          {cart.length === 0 ? 'Empty' : `${cart.length} product${cart.length === 1 ? '' : 's'} · ${cart.reduce((s, c) => s + c.qty, 0)} units`}
                        </p>
                      </div>
                    </div>
                    {cart.length > 0 && (
                      <button
                        onClick={() => setCart([])}
                        className="text-[11px] text-brand-muted hover:text-brand-error transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <CardContent className="p-4">
                    {cart.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-2xl bg-brand-elevated mx-auto flex items-center justify-center mb-2">
                          <ShoppingCart className="w-5 h-5 text-brand-muted" />
                        </div>
                        <p className="text-brand-primary text-sm font-medium">Cart is empty</p>
                        <p className="text-brand-muted text-xs mt-1">Tap "Add" on any product.</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2 max-h-[26rem] overflow-y-auto pr-1">
                          {cart.map((item) => {
                            const thumb = stableProduceImage(item.name, null, 96);
                            return (
                              <div key={item.key} className="p-2 bg-brand-elevated rounded-lg space-y-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-brand-base">
                                    <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-brand-primary text-xs font-semibold truncate">{item.name}</p>
                                    <p className="text-brand-accent text-xs font-semibold uppercase tracking-wide mono">
                                      {item.qty} × {item.unit}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => updateQty(item.key, -1)} className="w-6 h-6 rounded bg-brand-base flex items-center justify-center text-brand-secondary hover:text-brand-primary">
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-brand-primary text-xs font-medium w-5 text-center mono">{item.qty}</span>
                                    <button onClick={() => updateQty(item.key, 1)} className="w-6 h-6 rounded bg-brand-base flex items-center justify-center text-brand-secondary hover:text-brand-primary">
                                      <Plus className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => removeFromCart(item.key)} className="w-6 h-6 rounded flex items-center justify-center text-brand-error hover:bg-brand-error/10">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <Input
                                  placeholder="Note (optional) — e.g. 'green ones'"
                                  value={item.note || ''}
                                  onChange={(e) => updateNote(item.key, e.target.value)}
                                  className="h-7 text-[11px]"
                                />
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-4 pt-4 border-t border-brand-border">
                          <div>
                            <label className="block text-brand-secondary text-xs mb-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Delivery Date *
                            </label>
                            <Input
                              type="date"
                              value={deliveryDate}
                              onChange={(e) => setDeliveryDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              required
                              className="h-9"
                            />
                            <p className="text-[10px] text-brand-muted mt-1">
                              Order before 11 AM for same-day scheduling.
                            </p>
                          </div>

                          <Button
                            className="w-full mt-4 h-10"
                            disabled={submitting || cart.length === 0 || !deliveryDate}
                            onClick={handleSubmitOrder}
                          >
                            {submitting ? 'Submitting...' : `Submit order · ${cart.reduce((s, c) => s + c.qty, 0)} units`}
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
