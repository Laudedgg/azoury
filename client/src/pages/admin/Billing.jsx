import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, FileText, Printer, Loader2, Receipt, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPICard } from '@/components/dashboard/KPICard';
import { DataTable } from '@/components/tables/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useFetch } from '@/hooks/useFetch';
import api from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { printInvoice, printTable } from '@/utils/print';
import { toast } from 'sonner';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

function Billing() {
  const { data: ordersData, refetch } = useFetch('/orders?status=PREPARING,READY,DISPATCHED,DELIVERED&limit=200');
  const { data: invoicesData, refetch: refetchInvoices } = useFetch('/reports/invoices?limit=200');
  const [loadingId, setLoadingId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const invoices = (invoicesData?.data || []).map((iv) => ({
    id: iv.id,
    orderId: iv.clientOrderId,
    orderRef: `#${iv.clientOrderId?.slice(0, 8) || iv.id.slice(0, 8)}`,
    client: iv.client?.businessName || '-',
    amount: iv.amount || 0,
    status: iv.status,
    statusLabel: iv.status ? iv.status.charAt(0) + iv.status.slice(1).toLowerCase() : '',
    dueDate: iv.dueDate,
    createdAt: iv.createdAt,
    approvedAt: iv.approvedAt,
    approvedBy: iv.approvedBy ? `${iv.approvedBy.firstName} ${iv.approvedBy.lastName}` : null,
  }));
  const drafts = invoices.filter((iv) => iv.status === 'DRAFT');
  const approved = invoices.filter((iv) => iv.status !== 'DRAFT');

  const handleApprove = async (invoiceId) => {
    setApprovingId(invoiceId);
    try {
      await api.patch(`/reports/invoices/${invoiceId}/approve`);
      toast.success('Invoice approved — client will see it on their Statement');
      refetchInvoices();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to approve');
    } finally {
      setApprovingId(null);
    }
  };

  const handleMarkPaid = async (invoiceId) => {
    setPayingId(invoiceId);
    try {
      await api.patch(`/reports/invoices/${invoiceId}`, { status: 'PAID' });
      toast.success('Invoice marked as paid');
      refetchInvoices();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to mark paid');
    } finally {
      setPayingId(null);
    }
  };

  const handlePrintInvoiceRecord = async (orderId) => {
    setLoadingId(orderId);
    try {
      const res = await api.get(`/orders/${orderId}`);
      const o = res.data;
      const dispatch = o.dispatchItems?.[0]?.dispatch;
      printInvoice({ ...o, dispatch });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to load order for printing');
    } finally {
      setLoadingId(null);
    }
  };

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
      const o = res.data;
      // Lift the latest dispatch's freeBonusProduct up to the order for the invoice template
      const dispatch = o.dispatchItems?.[0]?.dispatch;
      printInvoice({ ...o, dispatch });
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

  const invoiceColumns = [
    { accessorKey: 'orderRef', header: 'Order #' },
    { accessorKey: 'client', header: 'Client' },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
    { accessorKey: 'dueDate', header: 'Due', cell: ({ row }) => row.original.dueDate ? formatDate(row.original.dueDate) : '-' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <span className="font-semibold text-brand-primary">{formatCurrency(row.original.amount)}</span> },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            disabled={loadingId === row.original.orderId}
            onClick={() => handlePrintInvoiceRecord(row.original.orderId)}
          >
            {loadingId === row.original.orderId ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Printer className="w-3 h-3 mr-1" />}
            Print
          </Button>
          {row.original.status !== 'PAID' && row.original.status !== 'DRAFT' && (
            <Button size="sm" className="h-7 px-2" disabled={payingId === row.original.id} onClick={() => handleMarkPaid(row.original.id)}>
              {payingId === row.original.id ? <Loader2 className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
            </Button>
          )}
        </div>
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
      <motion.div variants={fadeInUp}>
        <PageHeader
          icon={Receipt}
          title="Billing"
          subtitle="Invoices based on real quantities prepared per client"
          actions={(
            <Button variant="outline" size="sm" className="no-print" onClick={handlePrintList}>
              <Printer className="w-4 h-4" /> Print list
            </Button>
          )}
        />
      </motion.div>

      <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard title="Pending approval" value={drafts.length} icon={AlertCircle} />
        <KPICard title="Approved & sent" value={formatCurrency(approved.reduce((s, i) => s + i.amount, 0))} icon={ShieldCheck} />
        <KPICard title="Paid" value={formatCurrency(approved.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.amount, 0))} icon={CheckCircle} />
        <KPICard title="Outstanding" value={formatCurrency(approved.filter((i) => i.status !== 'PAID').reduce((s, i) => s + i.amount, 0))} icon={FileText} />
      </motion.div>

      {/* Pending approval queue */}
      {drafts.length > 0 && (
        <motion.div variants={fadeInUp}>
          <Card className="border-brand-warning/40 bg-brand-warning/5">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-brand-warning" />
                <h3 className="text-brand-primary font-semibold text-sm">Pending Operations Approval ({drafts.length})</h3>
              </div>
              <p className="text-brand-secondary text-xs mb-3">
                Auto-generated when an order is delivered. Approve to push to the client's statement of account.
              </p>
              <div className="space-y-2">
                {drafts.map((iv) => (
                  <div key={iv.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-brand-elevated rounded-lg border border-brand-border">
                    <div className="min-w-0">
                      <p className="text-brand-primary font-medium text-sm truncate">
                        {iv.client} · {iv.orderRef}
                      </p>
                      <p className="text-brand-muted text-xs">
                        {formatCurrency(iv.amount)} · created {formatDate(iv.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => handlePrintInvoiceRecord(iv.orderId)} disabled={loadingId === iv.orderId}>
                        {loadingId === iv.orderId ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Printer className="w-3 h-3 mr-1" />}
                        Preview
                      </Button>
                      <Button size="sm" onClick={() => handleApprove(iv.id)} disabled={approvingId === iv.id}>
                        {approvingId === iv.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <ShieldCheck className="w-3 h-3 mr-1" />}
                        Approve & Send
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-brand-primary font-semibold text-sm mb-3">Invoices</h3>
            <DataTable
              columns={invoiceColumns}
              data={invoices}
              searchPlaceholder="Search by client..."
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
