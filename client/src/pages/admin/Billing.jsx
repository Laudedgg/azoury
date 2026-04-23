import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, FileText, Printer, Loader2, Receipt, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { KPICard } from '@/components/dashboard/KPICard';
import { DataTable } from '@/components/tables/DataTable';
import { useFetch } from '@/hooks/useFetch';
import api from '@/services/api';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';
import { printInvoice, printTable } from '@/utils/print';
import { toast } from 'sonner';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

function Billing() {
  const { data: ordersData, refetch } = useFetch('/orders?status=PREPARING,READY,DISPATCHED,DELIVERED&limit=200');
  const [loadingId, setLoadingId] = useState(null);

  const orders = (ordersData?.data || []).map((o) => ({
    id: o.id,
    orderRef: `#${o.id.slice(0, 8)}`,
    client: o.client?.businessName || '-',
    createdAt: o.createdAt,
    deliveryDate: o.deliveryDate,
    itemsCount: o._count?.items ?? o.items?.length ?? 0,
    status: o.status,
    statusLabel: o.status ? o.status.charAt(0) + o.status.slice(1).toLowerCase() : '',
    total: o.totalAmount || 0,
  }));

  const kpis = useMemo(() => {
    const total = orders.reduce((s, o) => s + o.total, 0);
    const delivered = orders.filter((o) => o.status === 'DELIVERED').reduce((s, o) => s + o.total, 0);
    const outstanding = total - delivered;
    return { total, delivered, outstanding, count: orders.length };
  }, [orders]);

  const handlePrintInvoice = async (orderId) => {
    setLoadingId(orderId);
    try {
      const res = await api.get(`/orders/${orderId}`);
      printInvoice(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load order for printing');
    } finally {
      setLoadingId(null);
    }
  };

  const handlePrintList = () => {
    printTable({
      title: 'Billing — Orders',
      subtitle: 'End-to-End Supply Chain',
      columns: [
        { key: 'orderRef', label: 'Order #' },
        { key: 'client', label: 'Client' },
        { key: 'deliveryDate', label: 'Delivery' },
        { key: 'itemsCount', label: 'Items', align: 'right' },
        { key: 'statusLabel', label: 'Status' },
        { key: 'totalFmt', label: 'Total', align: 'right' },
      ],
      rows: orders.map((o) => ({
        ...o,
        deliveryDate: o.deliveryDate ? formatDate(o.deliveryDate) : '-',
        totalFmt: formatCurrency(o.total),
      })),
    });
  };

  const columns = [
    { accessorKey: 'orderRef', header: 'Order #' },
    { accessorKey: 'client', header: 'Client' },
    { accessorKey: 'deliveryDate', header: 'Delivery', cell: ({ row }) => row.original.deliveryDate ? formatDate(row.original.deliveryDate) : '-' },
    { accessorKey: 'itemsCount', header: 'Items' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <Badge variant={getStatusColor(row.original.statusLabel)}>{row.original.statusLabel}</Badge>,
    },
    { accessorKey: 'total', header: 'Total', cell: ({ row }) => <span className="font-semibold text-brand-primary">{formatCurrency(row.original.total)}</span> },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          disabled={loadingId === row.original.id}
          onClick={() => handlePrintInvoice(row.original.id)}
        >
          {loadingId === row.original.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Printer className="w-3 h-3 mr-1" />}
          Print invoice
        </Button>
      ),
    },
  ];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-4 lg:space-y-6"
    >
      <motion.div variants={fadeInUp} className="flex flex-col-reverse gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold text-brand-primary">Billing</h1>
          <p className="text-brand-secondary text-sm mt-1">Invoices based on real quantities prepared per client</p>
        </div>
        <Button variant="outline" className="w-full lg:w-auto no-print" onClick={handlePrintList}>
          <Printer className="w-4 h-4 mr-2" /> Print list
        </Button>
      </motion.div>

      <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard title="Orders in billing" value={kpis.count} icon={Receipt} />
        <KPICard title="Invoiceable total" value={formatCurrency(kpis.total)} icon={DollarSign} />
        <KPICard title="Delivered" value={formatCurrency(kpis.delivered)} icon={CheckCircle} />
        <KPICard title="Outstanding" value={formatCurrency(kpis.outstanding)} icon={FileText} />
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <DataTable
              columns={columns}
              data={orders}
              searchPlaceholder="Search by client or order..."
              searchColumn="client"
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export { Billing };
export default Billing;
