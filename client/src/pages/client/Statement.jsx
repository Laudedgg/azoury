import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, DollarSign, AlertCircle, CheckCircle, Printer, Loader2, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPICard } from '@/components/dashboard/KPICard';
import { DataTable } from '@/components/tables/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import api from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { printInvoice, printTable } from '@/utils/print';
import { toast } from 'sonner';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

function Statement() {
  const { user } = useAuth();
  const clientId = user?.clientId;
  const { data } = useFetch(clientId ? `/reports/statement/${clientId}` : null);
  const [loadingId, setLoadingId] = useState(null);

  const summary = data?.summary || { billed: 0, paid: 0, outstanding: 0, overdue: 0, paidLast7: 0, paidThisMonth: 0, count: 0 };
  const invoices = (data?.invoices || []).map((iv) => ({
    id: iv.id,
    orderId: iv.clientOrderId,
    invoiceRef: `INV-${iv.id.slice(0, 8)}`,
    orderRef: `#${iv.clientOrderId?.slice(0, 8) || ''}`,
    amount: iv.amount || 0,
    status: iv.status,
    statusLabel: iv.status ? iv.status.charAt(0) + iv.status.slice(1).toLowerCase() : '',
    createdAt: iv.createdAt,
    dueDate: iv.dueDate,
    paidAt: iv.paidAt,
    approvedAt: iv.approvedAt,
    approvedBy: iv.approvedBy ? `${iv.approvedBy.firstName} ${iv.approvedBy.lastName}` : null,
  }));

  const handlePrint = async (orderId) => {
    setLoadingId(orderId);
    try {
      const res = await api.get(`/orders/${orderId}`);
      const o = res.data;
      const dispatch = o.dispatchItems?.[0]?.dispatch;
      printInvoice({ ...o, dispatch });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to load invoice');
    } finally {
      setLoadingId(null);
    }
  };

  const handlePrintStatement = () => {
    printTable({
      title: `Statement of Account · ${data?.client?.businessName || ''}`,
      subtitle: `Printed ${new Date().toLocaleDateString()}  ·  ${invoices.length} invoice(s)`,
      columns: [
        { key: 'invoiceRef', label: 'Invoice' },
        { key: 'orderRef', label: 'Order' },
        { key: 'createdDate', label: 'Issued' },
        { key: 'dueDateFmt', label: 'Due' },
        { key: 'statusLabel', label: 'Status' },
        { key: 'amountFmt', label: 'Amount', align: 'right' },
      ],
      rows: invoices.map((iv) => ({
        ...iv,
        createdDate: formatDate(iv.createdAt),
        dueDateFmt: iv.dueDate ? formatDate(iv.dueDate) : '-',
        amountFmt: formatCurrency(iv.amount),
      })),
    });
  };

  const columns = [
    { accessorKey: 'invoiceRef', header: 'Invoice' },
    { accessorKey: 'orderRef', header: 'Order' },
    { accessorKey: 'createdAt', header: 'Issued', cell: ({ row }) => formatDate(row.original.createdAt) },
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
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2"
          disabled={loadingId === row.original.orderId}
          onClick={() => handlePrint(row.original.orderId)}
        >
          {loadingId === row.original.orderId ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Printer className="w-3 h-3 mr-1" />}
          Print
        </Button>
      ),
    },
  ];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-4 lg:space-y-6 max-w-5xl"
    >
      <motion.div variants={fadeInUp}>
        <PageHeader
          icon={FileText}
          title="Statement of Account"
          subtitle="All approved invoices, payment status, and recent activity"
          actions={(
            <Button variant="outline" size="sm" className="no-print" onClick={handlePrintStatement} disabled={invoices.length === 0}>
              <Printer className="w-4 h-4" /> Print statement
            </Button>
          )}
        />
      </motion.div>

      <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard title="Total billed" value={formatCurrency(summary.billed)} icon={FileText} />
        <KPICard title="Paid" value={formatCurrency(summary.paid)} icon={CheckCircle} />
        <KPICard title="Outstanding" value={formatCurrency(summary.outstanding)} icon={DollarSign} />
        <KPICard title="Overdue" value={formatCurrency(summary.overdue)} icon={AlertCircle} />
      </motion.div>

      <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <div className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand-success/10 text-brand-success flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-brand-muted text-[10px] uppercase tracking-wider">Collected last 7 days</p>
              <p className="text-brand-primary font-semibold text-base mono">{formatCurrency(summary.paidLast7)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand-accent/10 text-brand-accent flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-brand-muted text-[10px] uppercase tracking-wider">Collected this month</p>
              <p className="text-brand-primary font-semibold text-base mono">{formatCurrency(summary.paidThisMonth)}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={fadeInUp}>
        {invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No invoices yet"
            description="Invoices appear here once orders are delivered and approved by operations."
          />
        ) : (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <DataTable
                columns={columns}
                data={invoices}
                searchPlaceholder="Search by invoice or order..."
                searchColumn="invoiceRef"
              />
            </CardContent>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}

export { Statement };
export default Statement;
