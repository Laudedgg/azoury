import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Clock, DollarSign, FileText, Plus, Truck, ChevronRight,
  Sparkles, Calendar, Package, MapPin, CheckCircle2, Loader2, Zap, Circle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import api from '@/services/api';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { stableProduceImage } from '@/utils/produceImages';

// Brand hero image lives at client/public/brand/. Falls back to a produce
// Unsplash photo if the file hasn't been dropped in yet — the <img> onError
// swap below handles it so nothing looks broken during rollout.
const HERO_IMG = '/brand/hero-produce-command-center.png';
const HERO_FALLBACK = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1600&q=80&auto=format&fit=crop';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

// ---------------------------------------------------------------- Stat tile
function StatTile({ label, value, hint, icon: Icon, accent = 'accent' }) {
  const map = {
    accent:  'text-brand-accent bg-brand-accent/10 border-brand-accent/25',
    success: 'text-brand-success bg-brand-success/10 border-brand-success/25',
    warning: 'text-brand-warning bg-brand-warning/10 border-brand-warning/25',
    muted:   'text-brand-secondary bg-brand-elevated border-brand-border',
  }[accent];
  return (
    <Card className="hover:border-brand-accent/40 transition-colors">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <p className="text-[10px] font-semibold text-brand-secondary uppercase tracking-wider">{label}</p>
          {Icon && (
            <div className={`h-8 w-8 rounded-lg border flex items-center justify-center ${map}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
        <p className="text-brand-primary text-2xl font-bold tracking-tight mono">{value ?? '—'}</p>
        {hint && <p className="text-brand-muted text-[11px] mt-1">{hint}</p>}
      </div>
    </Card>
  );
}

// ------------------------------------------------------ Delivery Tracker
const ORDER_STEPS = [
  { key: 'PENDING',    label: 'Placed',     icon: Circle },
  { key: 'CONFIRMED',  label: 'Confirmed',  icon: CheckCircle2 },
  { key: 'PREPARING',  label: 'Preparing',  icon: Package },
  { key: 'READY',      label: 'Ready',      icon: CheckCircle2 },
  { key: 'DISPATCHED', label: 'On the way', icon: Truck },
  { key: 'DELIVERED',  label: 'Delivered',  icon: MapPin },
];
function stepIndex(status) {
  const i = ORDER_STEPS.findIndex((s) => s.key === status);
  return i === -1 ? 0 : i;
}

function DeliveryTracker({ order }) {
  if (!order) {
    return (
      <Card className="h-full">
        <div className="p-5 pb-3 border-b border-brand-border/60 flex items-center gap-2">
          <Truck className="w-4 h-4 text-brand-accent" />
          <p className="text-brand-primary font-semibold text-sm">Track Delivery</p>
        </div>
        <CardContent className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-elevated mx-auto flex items-center justify-center mb-3">
            <Truck className="w-6 h-6 text-brand-muted" />
          </div>
          <p className="text-brand-primary text-sm font-medium">No active delivery</p>
          <p className="text-brand-muted text-xs mt-1">You'll see the live status here once you place an order.</p>
          <Button asChild size="sm" variant="outline" className="mt-4">
            <Link to="/portal/orders"><Plus className="w-3.5 h-3.5" /> Place order</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const current = stepIndex(order.status);
  const itemCount = order._count?.items ?? order.items?.length ?? 0;
  const deliveryDate = order.deliveryDate
    ? new Date(order.deliveryDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
    : 'TBD';

  return (
    <Card className="h-full overflow-hidden relative isolate">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-56 h-56 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(78,236,211,0.7), transparent 70%)', filter: 'blur(30px)' }}
        />
      </div>
      <div className="relative z-10">
        <div className="p-5 pb-3 border-b border-brand-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-accent/15 flex items-center justify-center">
              <Truck className="w-4 h-4 text-brand-accent" />
            </div>
            <div>
              <p className="text-brand-primary font-semibold text-sm">Track Delivery</p>
              <p className="text-brand-muted text-[11px] mono">#{order.id?.slice(0, 8)}</p>
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <CardContent className="p-5 space-y-4">
          <div>
            <p className="text-brand-muted text-[10px] uppercase tracking-wider">Delivery date</p>
            <p className="text-brand-primary text-lg font-bold mt-0.5">{deliveryDate}</p>
            <p className="text-brand-muted text-xs mt-1">{itemCount} item{itemCount === 1 ? '' : 's'} in this order</p>
          </div>

          {/* Vertical step tracker */}
          <div className="space-y-0">
            {ORDER_STEPS.map((step, i) => {
              const done = i < current;
              const active = i === current;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-start gap-3 relative">
                  {/* Vertical line to next */}
                  {i < ORDER_STEPS.length - 1 && (
                    <div className={`absolute left-[15px] top-8 bottom-0 w-px ${done ? 'bg-brand-accent/50' : 'bg-brand-border'}`} />
                  )}
                  <div className={`shrink-0 h-8 w-8 rounded-full border flex items-center justify-center transition-colors ${
                    done ? 'bg-brand-accent border-brand-accent text-brand-base'
                    : active ? 'bg-brand-accent/15 border-brand-accent text-brand-accent'
                    : 'bg-brand-elevated border-brand-border text-brand-muted'
                  }`}>
                    {active ? <span className="h-2 w-2 rounded-full bg-brand-accent animate-ping absolute" /> : null}
                    <Icon className={`w-3.5 h-3.5 relative ${done || active ? '' : 'opacity-60'}`} />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className={`text-sm font-medium ${done ? 'text-brand-secondary' : active ? 'text-brand-primary' : 'text-brand-muted'}`}>
                      {step.label}
                    </p>
                    {active && (
                      <p className="text-brand-accent text-[11px] mt-0.5">In progress · Updates in real time</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

// ------------------------------------------------------ Quick Reorder rows
function QuickReorderRow({ product, onReorder }) {
  const img = stableProduceImage(product.name, product.category, 120);
  const stock = product.qualityGrades?.[0]?.currentStock ?? 0;
  // Fake but useful indicator: how much is on hand relative to a target of 50 units
  const stockPct = Math.min(100, Math.round((stock / 50) * 100));
  const stockColor = stockPct >= 50 ? 'bg-brand-success' : stockPct >= 20 ? 'bg-brand-warning' : 'bg-brand-error';
  const stockLabel = stockPct >= 50 ? 'In stock' : stockPct >= 20 ? 'Low' : 'Very low';
  const stockDot = stockPct >= 50 ? 'text-brand-success' : stockPct >= 20 ? 'text-brand-warning' : 'text-brand-error';

  return (
    <div className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-brand-elevated/40 transition-colors border border-transparent hover:border-brand-border">
      <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-brand-elevated">
        <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-brand-primary text-sm font-semibold truncate">{product.name}</p>
          <span className={`h-1.5 w-1.5 rounded-full ${stockColor}`} title={stockLabel} />
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 rounded-full bg-brand-elevated overflow-hidden">
            <div className={`h-full ${stockColor} transition-all`} style={{ width: `${Math.max(6, stockPct)}%` }} />
          </div>
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${stockDot} shrink-0`}>{stockLabel}</span>
        </div>
      </div>
      <Button size="xs" onClick={() => onReorder(product)} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Plus className="w-3 h-3" /> Reorder
      </Button>
      <Button size="xs" variant="ghost" onClick={() => onReorder(product)} className="shrink-0 group-hover:hidden">
        <Zap className="w-3 h-3 text-brand-accent" />
      </Button>
    </div>
  );
}

// ------------------------------------------------------ Quick Reorder dialog
function QuickReorderDialog({ product, clientId, onClose, onSuccess }) {
  const tomorrow = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);
  const [qty, setQty] = useState('1');
  const [date, setDate] = useState(tomorrow);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState('');

  const gradeId = product?.qualityGrades?.[0]?.id;
  const img = product ? stableProduceImage(product.name, product.category, 240) : null;

  const submit = async () => {
    if (!gradeId) {
      toast.error('This product has no quality grade set yet.');
      return;
    }
    const numQty = Math.max(1, Math.floor(Number(qty) || 0));
    setSubmitting(true);
    try {
      await api.post('/orders', {
        clientId,
        deliveryDate: date,
        items: [{
          productId: product.id,
          qualityGradeId: gradeId,
          quantity: numQty,
          specialInstructions: note.trim() || undefined,
        }],
      });
      toast.success(`Order placed — ${numQty} × ${product.name}`);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      const resp = err?.response?.data;
      toast.error(resp?.error || resp?.details?.[0]?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-accent" /> Quick reorder
          </DialogTitle>
        </DialogHeader>
        {product && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-brand-elevated rounded-lg">
              <div className="h-14 w-14 rounded-lg overflow-hidden bg-brand-base">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-brand-primary font-semibold truncate">{product.name}</p>
                {product.subDescription && (
                  <p className="text-brand-muted text-[11px] truncate">{product.subDescription}</p>
                )}
                <p className="text-brand-accent text-[10px] font-semibold uppercase tracking-wider mt-1">
                  Per {product.unit}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-brand-secondary text-xs mb-1">Quantity ({product.unit})</label>
                <div className="flex items-stretch rounded-md border border-brand-border overflow-hidden">
                  <button onClick={() => setQty(String(Math.max(1, Number(qty) - 1)))}
                    className="w-8 flex items-center justify-center bg-brand-elevated text-brand-secondary hover:bg-brand-base hover:text-brand-primary border-r border-brand-border">
                    −
                  </button>
                  <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)}
                    className="flex-1 h-10 text-center bg-brand-surface text-brand-primary focus:outline-none" />
                  <button onClick={() => setQty(String(Number(qty || 0) + 1))}
                    className="w-8 flex items-center justify-center bg-brand-elevated text-brand-secondary hover:bg-brand-base hover:text-brand-primary border-l border-brand-border">
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-brand-secondary text-xs mb-1">
                  <Calendar className="w-3 h-3 inline mr-1" /> Delivery
                </label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} className="h-10" />
              </div>
            </div>
            <div>
              <label className="block text-brand-secondary text-xs mb-1">Note (optional)</label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. green ones, extra ripe…" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button className="flex-1" onClick={submit} disabled={submitting || !gradeId || !Number(qty) || !date}>
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Placing…</> : `Place order · ${qty} ${product.unit}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// -------------------------------------------------------------------- Portal
function Portal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: ordersData, refetch } = useFetch('/orders?page=1&limit=20');
  const { data: productsData } = useFetch('/products?limit=200');

  const orders = ordersData?.data || [];
  const products = (productsData?.data || productsData || []).filter((p) => p.isActive !== false);

  const [reorderProduct, setReorderProduct] = useState(null);

  // KPIs
  const now = new Date();
  const activeOrders = orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status)).length;
  const pendingDeliveries = orders.filter((o) => ['DISPATCHED', 'READY'].includes(o.status)).length;
  const monthlySpend = orders
    .filter((o) => o.status === 'DELIVERED'
      && new Date(o.createdAt).getMonth() === now.getMonth()
      && new Date(o.createdAt).getFullYear() === now.getFullYear())
    .reduce((s, o) => s + (o.totalAmount || o.total || 0), 0);
  const lastOrderTotal = orders[0]?.totalAmount || orders[0]?.total || 0;

  const recentOrders = orders.slice(0, 5);

  // Next active order for the tracker
  const activeOrder = useMemo(() => {
    return orders
      .filter((o) => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DISPATCHED'].includes(o.status))
      .sort((a, b) => new Date(a.deliveryDate || a.createdAt) - new Date(b.deliveryDate || b.createdAt))[0] || null;
  }, [orders]);

  // Most-ordered products (fallback to a curated selection)
  const favouriteProducts = useMemo(() => {
    const tally = new Map();
    for (const o of orders) {
      for (const it of (o.items || [])) {
        const p = it.product;
        if (!p) continue;
        const cur = tally.get(p.id) || { product: p, count: 0 };
        cur.count += (it.quantity || 1);
        tally.set(p.id, cur);
      }
    }
    const top = [...tally.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((x) => products.find((pp) => pp.id === x.product.id) || x.product);
    if (top.length > 0) return top;
    return products.slice(0, 8);
  }, [orders, products]);

  const businessName = user?.client?.businessName || 'Your Business';
  const firstName = user?.firstName || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-5 lg:space-y-6">
      {/* Hero */}
      <motion.div variants={fadeInUp}>
        <Card className="relative overflow-hidden isolate border-brand-accent/25">
          <div className="absolute inset-0 z-0">
            <img
              src={HERO_IMG}
              alt=""
              aria-hidden
              loading="eager"
              onError={(e) => { if (e.currentTarget.src !== HERO_FALLBACK) e.currentTarget.src = HERO_FALLBACK; }}
              className="w-full h-full object-cover opacity-40 scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-brand-base/90 via-brand-base/65 to-brand-surface/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-base/95 via-transparent to-transparent" />
          </div>
          <div className="relative z-10 p-5 sm:p-7 lg:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-accent/12 border border-brand-accent/30 px-2.5 py-1 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse" />
              <span className="text-brand-accent text-[10px] font-semibold uppercase tracking-wider">
                {greeting}, {firstName}
              </span>
            </div>
            <h1 className="text-brand-primary text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
              Welcome, <span className="text-brand-accent">{businessName}</span>
            </h1>
            <p className="text-brand-secondary text-sm mt-2 max-w-xl">
              Fresh produce, straight from Bekaa. Reorder what you love below, or browse the full catalog.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button asChild size="lg" className="min-w-[180px]">
                <Link to="/portal/orders">
                  <Plus className="w-4 h-4" /> Place New Order
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/portal/statement">
                  <FileText className="w-4 h-4" /> View Statement
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stat strip */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile label="Active Orders" value={activeOrders} icon={ShoppingBag} accent="accent"
          hint={activeOrders === 0 ? 'Nothing in flight' : `${activeOrders} in progress`} />
        <StatTile label="Pending Delivery" value={pendingDeliveries} icon={Truck} accent="warning"
          hint={pendingDeliveries === 0 ? 'All caught up' : 'On the way'} />
        <StatTile label="This Month's Spend" value={formatCurrency(monthlySpend)} icon={DollarSign} accent="success"
          hint={now.toLocaleDateString('en-GB', { month: 'long' })} />
        <StatTile label="Last Invoice" value={formatCurrency(lastOrderTotal)} icon={FileText} accent="muted"
          hint={orders[0]?.createdAt ? formatDate(orders[0].createdAt) : '—'} />
      </motion.div>

      {/* Row 3: Quick Order rows + Delivery Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        {/* Quick Order */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between p-5 pb-3 border-b border-brand-border/60">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-brand-accent/15 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-brand-accent" />
                </div>
                <div>
                  <p className="text-brand-primary font-semibold text-sm">Quick Reorder</p>
                  <p className="text-brand-muted text-[11px]">One-click restock of your favourites</p>
                </div>
              </div>
              <Link to="/portal/orders"
                className="text-xs text-brand-accent hover:text-brand-accent-hover inline-flex items-center gap-1">
                Full catalog <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <CardContent className="p-3 sm:p-4">
              {favouriteProducts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-brand-elevated mx-auto flex items-center justify-center mb-3">
                    <Package className="w-6 h-6 text-brand-muted" />
                  </div>
                  <p className="text-brand-primary text-sm font-semibold">No products in your catalog yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {favouriteProducts.map((p) => (
                    <QuickReorderRow key={p.id} product={p} onReorder={setReorderProduct} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Delivery Tracker */}
        <motion.div variants={fadeInUp}>
          <DeliveryTracker order={activeOrder} />
        </motion.div>
      </div>

      {/* Row 4: Recent Orders + Delivery Windows info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        {/* Recent orders */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between p-5 pb-3 border-b border-brand-border/60">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-brand-accent" />
                <p className="text-brand-primary font-semibold text-sm">Recent Orders</p>
              </div>
              <Link to="/portal/orders?tab=history"
                className="text-xs text-brand-accent hover:text-brand-accent-hover inline-flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <CardContent className="p-4">
              {recentOrders.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-brand-elevated mx-auto flex items-center justify-center mb-3">
                    <ShoppingBag className="w-6 h-6 text-brand-muted" />
                  </div>
                  <p className="text-brand-primary font-semibold">No orders yet</p>
                  <p className="text-brand-muted text-sm mt-1 max-w-xs mx-auto">
                    Reorder from Quick Reorder above, or browse the catalog.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map((order) => {
                    const itemCount = order._count?.items ?? order.items?.length ?? 0;
                    const total = order.totalAmount ?? order.total ?? 0;
                    const firstItem = order.items?.[0]?.product;
                    const img = firstItem ? stableProduceImage(firstItem.name, firstItem.category, 120) : null;
                    return (
                      <Link
                        key={order.id}
                        to="/portal/orders?tab=history"
                        className="flex items-center gap-3 p-2.5 rounded-lg border border-brand-border hover:border-brand-accent/40 hover:bg-brand-elevated/40 transition-colors"
                      >
                        <div className="h-11 w-11 rounded-lg overflow-hidden bg-brand-elevated shrink-0">
                          {img ? (
                            <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-brand-muted m-auto" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-brand-primary text-sm font-medium truncate">
                            Order <span className="mono">#{order.id?.slice(0, 8)}</span>
                          </p>
                          <p className="text-brand-muted text-xs">
                            {order.createdAt ? formatDate(order.createdAt) : '—'} · {itemCount} item{itemCount === 1 ? '' : 's'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-brand-primary text-sm font-semibold mono">{formatCurrency(total)}</p>
                          <StatusBadge status={order.status} className="mt-1" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Delivery windows */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full overflow-hidden isolate relative">
            <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(78,236,144,0.4), transparent 70%)', filter: 'blur(30px)' }} />
            </div>
            <div className="relative z-10 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-brand-accent/15 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-brand-accent" />
                </div>
                <p className="text-brand-primary font-semibold text-sm">Delivery windows</p>
              </div>
              <p className="text-brand-secondary text-xs leading-relaxed">
                Same-day cutoff is <b className="text-brand-primary">11 AM</b>. Orders placed after ship the next morning.
              </p>
              <div className="mt-4 space-y-2.5">
                {[
                  { day: 'Mon – Fri', hours: '6:00 – 10:00 AM' },
                  { day: 'Saturday', hours: '6:00 – 9:00 AM' },
                  { day: 'Sunday', hours: 'On request', muted: true },
                ].map((w) => (
                  <div key={w.day} className="flex items-center justify-between text-xs">
                    <span className="text-brand-muted">{w.day}</span>
                    <span className={w.muted ? 'text-brand-muted italic' : 'text-brand-primary font-medium'}>{w.hours}</span>
                  </div>
                ))}
              </div>
              <Button asChild variant="soft" size="sm" className="w-full mt-4">
                <a href="mailto:hello@afoodlebanon.com">
                  <Package className="w-3.5 h-3.5" /> Custom request
                </a>
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick reorder dialog */}
      <QuickReorderDialog
        product={reorderProduct}
        clientId={user?.clientId}
        onClose={() => setReorderProduct(null)}
        onSuccess={refetch}
      />
    </motion.div>
  );
}

export { Portal };
export default Portal;
