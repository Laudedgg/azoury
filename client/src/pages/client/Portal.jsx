import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, Clock, DollarSign, FileText, Plus, Truck, ChevronRight,
  Sparkles, Calendar, RefreshCw, Package,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { stableProduceImage } from '@/utils/produceImages';

// Hero backdrop — verified farmers-market shot from the earlier Landing work.
const HERO_IMG = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1600&q=80&auto=format&fit=crop';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

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

function Portal() {
  const { user } = useAuth();
  const { data: ordersData } = useFetch('/orders?page=1&limit=20');
  const { data: productsData } = useFetch('/products?limit=200');

  const orders = ordersData?.data || [];
  const products = (productsData?.data || productsData || []).filter((p) => p.isActive !== false);

  // KPIs from real orders
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

  const upcomingDelivery = useMemo(() => {
    const upcoming = orders
      .filter((o) => ['CONFIRMED', 'PREPARING', 'READY', 'DISPATCHED'].includes(o.status))
      .sort((a, b) => new Date(a.deliveryDate || a.createdAt) - new Date(b.deliveryDate || b.createdAt));
    return upcoming[0] || null;
  }, [orders]);

  // Most-ordered products (rank by count of order items across all their orders)
  const mostOrdered = useMemo(() => {
    const tally = new Map(); // productId -> { product, count }
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
      .slice(0, 6)
      .map((x) => x.product);
    if (top.length > 0) return top;
    // First-time users: seed the "recommended" strip from the catalog so the
    // section never looks empty.
    return products.slice(0, 6);
  }, [orders, products]);

  const businessName = user?.client?.businessName || 'Your Business';
  const firstName = user?.firstName || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.div initial="initial" animate="animate" variants={stagger} className="space-y-5 lg:space-y-6">
      {/* Hero welcome card — full-bleed produce backdrop, big greeting + CTA */}
      <motion.div variants={fadeInUp}>
        <Card className="relative overflow-hidden isolate border-brand-accent/25">
          <div className="absolute inset-0 z-0">
            <img src={HERO_IMG} alt="" aria-hidden loading="eager"
              className="w-full h-full object-cover opacity-25 scale-110" />
            <div className="absolute inset-0 bg-gradient-to-br from-brand-base via-brand-base/70 to-brand-surface/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-base/95 via-transparent to-transparent" />
          </div>
          <div className="relative z-10 p-5 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
            <div className="lg:col-span-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-accent/12 border border-brand-accent/30 px-2.5 py-1 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse" />
                <span className="text-brand-accent text-[10px] font-semibold uppercase tracking-wider">
                  {greeting}, {firstName}
                </span>
              </div>
              <h1 className="text-brand-primary text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                Welcome, <span className="text-brand-accent">{businessName}</span>
              </h1>
              <p className="text-brand-secondary text-sm sm:text-base mt-2 max-w-xl">
                Fresh produce, straight from Bekaa. Pick from the catalog, pick a delivery date, we handle the rest.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button asChild size="lg" className="min-w-[180px]">
                  <Link to="/portal/orders">
                    <Plus className="w-4 h-4" /> Place New Order
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/portal/orders?tab=active">
                    <Clock className="w-4 h-4" /> View Active Orders
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right side: upcoming delivery snapshot */}
            <div className="lg:col-span-2">
              {upcomingDelivery ? (
                <div className="rounded-xl border border-brand-accent/25 bg-brand-surface/70 backdrop-blur-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-brand-accent/15 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-brand-accent" />
                    </div>
                    <div>
                      <p className="text-brand-primary text-sm font-semibold">Next Delivery</p>
                      <p className="text-brand-muted text-[11px]">Order #{upcomingDelivery.id?.slice(0, 8)}</p>
                    </div>
                  </div>
                  <p className="text-brand-primary text-lg font-bold mono">
                    {upcomingDelivery.deliveryDate
                      ? new Date(upcomingDelivery.deliveryDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
                      : 'TBD'}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <StatusBadge status={upcomingDelivery.status} />
                    <span className="text-brand-muted text-xs">{upcomingDelivery._count?.items || upcomingDelivery.items?.length || 0} items</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-brand-border bg-brand-surface/40 p-4 text-center">
                  <Calendar className="w-8 h-8 mx-auto text-brand-muted mb-2" />
                  <p className="text-brand-primary text-sm font-medium">No upcoming delivery</p>
                  <p className="text-brand-muted text-[11px] mt-1">Place an order to schedule one.</p>
                </div>
              )}
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

      {/* Two-column: Recent orders + Quick reorder */}
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
            <CardContent className="p-5 pt-4">
              {recentOrders.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-brand-elevated mx-auto flex items-center justify-center mb-3">
                    <ShoppingBag className="w-6 h-6 text-brand-muted" />
                  </div>
                  <p className="text-brand-primary font-semibold">No orders yet</p>
                  <p className="text-brand-muted text-sm mt-1 max-w-xs mx-auto">
                    Browse the catalog and place your first order — it takes a minute.
                  </p>
                  <Button asChild className="mt-4">
                    <Link to="/portal/orders">
                      <Plus className="w-4 h-4" /> Browse Catalog
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentOrders.map((order) => {
                    const itemCount = order._count?.items ?? order.items?.length ?? 0;
                    const total = order.totalAmount ?? order.total ?? 0;
                    const firstItem = order.items?.[0]?.product;
                    const img = firstItem
                      ? stableProduceImage(firstItem.name, firstItem.category, 160)
                      : null;
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
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-5 h-5 text-brand-muted" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-brand-primary text-sm font-medium truncate">
                            Order #{order.id?.slice(0, 8)}
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

        {/* Insight / tip card */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full overflow-hidden isolate relative">
            <div
              className="absolute inset-0 z-0 opacity-20"
              style={{
                background: 'radial-gradient(600px 300px at 90% -20%, rgba(78,236,211,0.35), transparent 60%)',
              }}
            />
            <div className="relative z-10 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-brand-accent/15 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-brand-accent" />
                </div>
                <p className="text-brand-primary font-semibold text-sm">Delivery windows</p>
              </div>
              <p className="text-brand-secondary text-xs leading-relaxed">
                Same-day cutoff is <b className="text-brand-primary">11 AM</b>. Orders placed after cut off ship the next morning. Weekend deliveries are dispatched between 6–9 AM.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-muted">Mon–Fri</span>
                  <span className="text-brand-primary font-medium">6:00 – 10:00 AM</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-muted">Saturday</span>
                  <span className="text-brand-primary font-medium">6:00 – 9:00 AM</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-muted">Sunday</span>
                  <span className="text-brand-muted italic">On request only</span>
                </div>
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

      {/* Quick reorder / recommended */}
      <motion.div variants={fadeInUp}>
        <Card>
          <div className="flex items-center justify-between p-5 pb-3 border-b border-brand-border/60">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-brand-accent" />
              <p className="text-brand-primary font-semibold text-sm">
                {orders.length > 0 ? 'Reorder your favourites' : 'Try these to get started'}
              </p>
            </div>
            <Link to="/portal/orders"
              className="text-xs text-brand-accent hover:text-brand-accent-hover inline-flex items-center gap-1">
              Full catalog <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <CardContent className="p-5 pt-4">
            {mostOrdered.length === 0 ? (
              <p className="text-brand-muted text-sm text-center py-6">
                Your favourites will appear here once you place a few orders.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {mostOrdered.map((p) => {
                  const img = stableProduceImage(p.name, p.category, 300);
                  return (
                    <Link
                      key={p.id}
                      to="/portal/orders"
                      className="group rounded-xl border border-brand-border overflow-hidden bg-brand-surface hover:border-brand-accent/40 hover:-translate-y-0.5 transition-all"
                    >
                      <div className="aspect-square overflow-hidden bg-brand-elevated">
                        <img
                          src={img}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-2.5">
                        <p className="text-brand-primary text-xs font-semibold truncate">{p.name}</p>
                        <p className="text-brand-muted text-[10px] uppercase tracking-wider mt-0.5">{p.unit}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export { Portal };
export default Portal;
