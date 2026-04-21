import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { DataTable } from '@/components/tables/DataTable';
import { useFetch } from '@/hooks/useFetch';
import api from '@/services/api';
import { toast } from 'sonner';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const CATEGORIES = [
  { value: 'FRUITS', label: 'Fruits' },
  { value: 'VEGETABLES', label: 'Vegetables' },
  { value: 'MEATS', label: 'Meats' },
  { value: 'DAIRY', label: 'Dairy' },
  { value: 'DRY_GOODS', label: 'Dry Goods' },
  { value: 'BEVERAGES', label: 'Beverages' },
  { value: 'FROZEN', label: 'Frozen' },
  { value: 'OTHER', label: 'Other' },
];

const UNITS = [
  { value: 'kg', label: 'Kg' },
  { value: 'piece', label: 'Piece' },
  { value: 'bags', label: 'Bags' },
  { value: 'box', label: 'Box' },
];

const emptyProductForm = {
  name: '',
  description: '',
  subDescription: '',
  category: '',
  unit: 'kg',
};

function Products() {
  const [addDialog, setAddDialog] = useState(false);
  const [form, setForm] = useState(emptyProductForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { data: productsData, refetch } = useFetch('/products?page=1&limit=100');
  const products = (productsData?.data || []).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    subDescription: p.subDescription || '',
    category: p.category,
    unit: p.unit,
    isActive: p.isActive,
  }));

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this product? Clients will stop seeing it.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deactivated');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to deactivate');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.category || !form.unit) {
      toast.error('Name, category, and unit are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/products', {
        name: form.name,
        description: form.description || undefined,
        subDescription: form.subDescription || undefined,
        category: form.category,
        unit: form.unit,
      });
      toast.success('Product created');
      setAddDialog(false);
      setForm(emptyProductForm);
      refetch();
    } catch (err) {
      const resp = err?.response?.data;
      toast.error(resp?.error || resp?.details?.[0]?.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Product',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-medium text-brand-primary truncate">{row.original.name}</p>
          {row.original.description && (
            <p className="text-xs text-brand-muted truncate">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'subDescription',
      header: 'Sub Description',
      cell: ({ row }) => (
        <span className="text-xs text-brand-secondary">{row.original.subDescription || '—'}</span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => <Badge variant="outline">{CATEGORIES.find((c) => c.value === row.original.category)?.label || row.original.category}</Badge>,
    },
    { accessorKey: 'unit', header: 'Unit', cell: ({ row }) => UNITS.find((u) => u.value === row.original.unit)?.label || row.original.unit },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => <Badge variant={row.original.isActive ? 'success' : 'default'}>{row.original.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => row.original.isActive && (
        <Button
          variant="outline"
          size="sm"
          className="text-brand-error"
          disabled={deletingId === row.original.id}
          onClick={() => handleDelete(row.original.id)}
        >
          {deletingId === row.original.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
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
          <h1 className="text-2xl font-bold text-brand-primary">Products</h1>
          <p className="text-brand-secondary text-sm mt-1">Manage the product catalog that clients see in their dashboard</p>
        </div>
        <Button className="w-full lg:w-auto" onClick={() => { setForm(emptyProductForm); setAddDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <DataTable
              columns={columns}
              data={products}
              searchPlaceholder="Search products..."
              searchColumn="name"
            />
          </CardContent>
        </Card>
      </motion.div>

      {products.length === 0 && (
        <motion.div variants={fadeInUp}>
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <Package className="w-10 h-10 mx-auto text-brand-muted mb-3" />
              <p className="text-brand-primary font-medium">No products yet</p>
              <p className="text-brand-muted text-sm mt-1">Add a product so clients can see it in their dashboard.</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Name *</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Roma Tomatoes" />
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Description</label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description" />
            </div>
            <div>
              <label className="block text-brand-secondary text-sm mb-1">Sub Description</label>
              <Input value={form.subDescription} onChange={(e) => setForm((f) => ({ ...f, subDescription: e.target.value }))} placeholder="Additional details" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Category *</label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Unit *</label>
                <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : 'Create Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export { Products };
export default Products;
