import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, Clock, DollarSign, FileText, Plus, Truck, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/dashboard/KPICard';
import { useAuth } from '@/context/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const mockRecentOrders = [
  { id: 1, orderRef: '#1847', date: '2026-04-08', items: 24, total: 3240, status: 'Preparing' },
  { id: 2, orderRef: '#1839', date: '2026-04-07', items: 18, total: 2850, status: 'Delivered' },
  { id: 3, orderRef: '#1832', date: '2026-04-06', items: 31, total: 4120, status: 'Delivered' },
  { id: 4, orderRef: '#1825', date: '2026-04-05', items: 15, total: 1890, status: 'Delivered' },
  { id: 5, orderRef: '#1818', date: '2026-04-04', items: 22, total: 2560, status: 'Delivered' },
  { id: 6, orderRef: '#1810', date: '2026-04-03', items: 28, total: 3450, status: 'Delivered' },
  { id: 7, orderRef: '#1803', date: '2026-04-02', items: 12, total: 1650, status: 'Delivered' },
  { id: 8, orderRef: '#1796', date: '2026-04-01', items: 20, total: 2780, status: 'Delivered' },
  { id: 9, orderRef: '#1789', date: '2026-03-31', items: 35, total: 4580, status: 'Delivered' },
  { id: 10, orderRef: '#1782', date: '2026-03-30', items: 19, total: 2340, status: 'Delivered' },
];

const mockDeliveries = [
  { id: 1, orderRef: '#1847', date: '2026-04-09', timeSlot: '7:00 AM - 9:00 AM', status: 'Scheduled', driver: 'Ahmad K.' },
  { id: 2, orderRef: '#1850', date: '2026-04-10', timeSlot: '7:00 AM - 9:00 AM', status: 'Confirmed', driver: 'TBD' },
  { id: 3, orderRef: '#1853', date: '2026-04-11', timeSlot: '8:00 AM - 10:00 AM', status: 'Pending', driver: 'TBD' },
];

function Portal() {
  const { user } = useAuth();
  const { data } = useFetch('/portal/summary');

  const businessName = user?.company || data?.businessName || 'Your Business';

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-6"
    >
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Welcome, {businessName}</h1>
          <p className="text-brand-secondary text-sm mt-1">Here is your order overview and upcoming deliveries</p>
        </div>
        <Button asChild>
          <Link to="/portal/orders">
            <Plus className="w-4 h-4 mr-2" /> Place Order
          </Link>
        </Button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Active Orders" value={data?.activeOrders || 2} icon={ShoppingBag} trend="up" trendValue={5} />
        <KPICard title="Pending Deliveries" value={data?.pendingDeliveries || 3} icon={Truck} />
        <KPICard title="This Month's Spend" value={formatCurrency(data?.monthlySpend || 22540)} icon={DollarSign} trend="up" trendValue={8.3} />
        <KPICard title="Last Invoice" value={formatCurrency(data?.lastInvoice || 12480)} icon={FileText} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link to="/portal/orders" className="text-sm text-brand-accent hover:text-brand-accent/80 flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(data?.recentOrders || mockRecentOrders).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border border-brand-border hover:bg-brand-elevated/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-brand-elevated flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-brand-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-brand-primary">Order {order.orderRef}</p>
                        <p className="text-xs text-brand-muted">{order.date} - {order.items} items</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-brand-primary">{formatCurrency(order.total)}</p>
                      <Badge variant={getStatusColor(order.status)} className="mt-1">{order.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Deliveries Timeline */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDeliveries.map((delivery, i) => (
                  <div key={delivery.id} className="relative pl-6">
                    {/* Timeline line */}
                    {i < mockDeliveries.length - 1 && (
                      <div className="absolute left-[9px] top-6 w-0.5 h-full bg-brand-border" />
                    )}
                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      delivery.status === 'Scheduled' ? 'border-brand-accent bg-brand-accent/20' :
                      delivery.status === 'Confirmed' ? 'border-brand-success bg-brand-success/20' :
                      'border-brand-border bg-brand-elevated'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        delivery.status === 'Scheduled' ? 'bg-brand-accent' :
                        delivery.status === 'Confirmed' ? 'bg-brand-success' :
                        'bg-brand-muted'
                      }`} />
                    </div>
                    <div className="pb-4">
                      <p className="text-brand-primary font-medium text-sm">{delivery.date}</p>
                      <p className="text-brand-secondary text-xs mt-0.5">
                        <Clock className="w-3 h-3 inline mr-1" />{delivery.timeSlot}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-brand-muted text-xs">Order {delivery.orderRef}</span>
                        <Badge variant={getStatusColor(delivery.status)} className="text-xs">{delivery.status}</Badge>
                      </div>
                      {delivery.driver !== 'TBD' && (
                        <p className="text-brand-muted text-xs mt-1">Driver: {delivery.driver}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

export { Portal };
export default Portal;
