import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, Loader2, Trash2, Upload, Download, FileSpreadsheet, Check, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
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

// Map various spellings/formats to canonical category enum values
function normalizeCategory(raw) {
  const s = String(raw || '').trim().toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');
  if (CATEGORIES.find((c) => c.value === s)) return s;
  // Friendly aliases
  const aliases = {
    FRUIT: 'FRUITS', VEGETABLE: 'VEGETABLES', VEG: 'VEGETABLES', MEAT: 'MEATS',
    DRYGOODS: 'DRY_GOODS', DRY: 'DRY_GOODS', BEVERAGE: 'BEVERAGES', DRINKS: 'BEVERAGES',
  };
  return aliases[s] || s;
}

function normalizeUnit(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (UNITS.find((u) => u.value === s)) return s;
  const aliases = { kgs: 'kg', kilogram: 'kg', kilograms: 'kg', pcs: 'piece', pieces: 'piece', bag: 'bags', boxes: 'box' };
  return aliases[s] || s;
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['name', 'description', 'subDescription', 'category', 'unit'],
    ['Roma Tomato', 'Fresh red tomato', 'Lebanese', 'VEGETABLES', 'kg'],
    ['Apple', 'Granny smith', 'Imported', 'FRUITS', 'kg'],
    ['Olive Oil', 'Cold-pressed', 'Estate bottled', 'BEVERAGES', 'box'],
  ]);
  ws['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 22 }, { wch: 14 }, { wch: 8 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  XLSX.writeFile(wb, 'azoury-products-template.xlsx');
}

function Products() {
  const [addDialog, setAddDialog] = useState(false);
  const [form, setForm] = useState(emptyProductForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Upload state
  const fileInputRef = useRef(null);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [parsedRows, setParsedRows] = useState([]); // [{ row, name, description, subDescription, category, unit, errors: [] }]
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null); // { created, skipped, errors }

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

  const handleFileChosen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: '' });

      const rows = json.map((r, idx) => {
        const find = (keys) => {
          for (const k of keys) {
            const hit = Object.keys(r).find((rk) => rk.toLowerCase().replace(/\s+/g, '') === k);
            if (hit) return r[hit];
          }
          return '';
        };
        const name = String(find(['name', 'productname', 'product']) || '').trim();
        const description = String(find(['description', 'desc']) || '').trim();
        const subDescription = String(find(['subdescription', 'subdesc', 'sub']) || '').trim();
        const category = normalizeCategory(find(['category', 'cat']));
        const unit = normalizeUnit(find(['unit', 'units']) || 'kg');

        const errors = [];
        if (!name) errors.push('name missing');
        if (!CATEGORIES.find((c) => c.value === category)) errors.push(`unknown category "${category || '—'}"`);
        if (!UNITS.find((u) => u.value === unit)) errors.push(`unknown unit "${unit || '—'}"`);
        return { row: idx + 2, name, description, subDescription, category, unit, errors };
      });
      setParsedRows(rows);
      setUploadResult(null);
      setUploadDialog(true);
    } catch (err) {
      toast.error('Failed to parse spreadsheet — make sure it is .xlsx, .xls, or .csv');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmUpload = async () => {
    const valid = parsedRows.filter((r) => r.errors.length === 0).map((r) => ({
      name: r.name,
      description: r.description || undefined,
      subDescription: r.subDescription || undefined,
      category: r.category,
      unit: r.unit,
    }));
    if (valid.length === 0) {
      toast.error('Nothing to upload — fix the errors first');
      return;
    }
    setUploading(true);
    try {
      const res = await api.post('/products/bulk', { products: valid });
      setUploadResult(res.data);
      toast.success(`Imported ${res.data.created.length} product${res.data.created.length === 1 ? '' : 's'}`);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Bulk upload failed');
    } finally {
      setUploading(false);
    }
  };

  const closeUploadDialog = () => {
    setUploadDialog(false);
    setParsedRows([]);
    setUploadResult(null);
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
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> Upload Excel
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChosen}
          />
          <Button className="w-full sm:w-auto" onClick={() => { setForm(emptyProductForm); setAddDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
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

      {/* Bulk Upload Dialog */}
      <Dialog open={uploadDialog} onOpenChange={(o) => { if (!o) closeUploadDialog(); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-brand-accent" />
              Bulk Upload Products
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {!uploadResult ? (
              <>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-brand-secondary text-sm">
                    Found <span className="font-semibold text-brand-primary">{parsedRows.length}</span> rows.
                    Valid: <span className="text-brand-success">{parsedRows.filter((r) => r.errors.length === 0).length}</span>,
                    Errors: <span className="text-brand-error">{parsedRows.filter((r) => r.errors.length > 0).length}</span>
                  </p>
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="w-3 h-3 mr-1" /> Template
                  </Button>
                </div>

                <div className="text-xs text-brand-muted bg-brand-elevated p-3 rounded-lg border border-brand-border">
                  <p className="font-medium text-brand-secondary mb-1">Expected columns (header row required):</p>
                  <code className="block">name · description · subDescription · category · unit</code>
                  <p className="mt-2">
                    <b>category</b>: {CATEGORIES.map((c) => c.value).join(', ')}
                  </p>
                  <p><b>unit</b>: {UNITS.map((u) => u.value).join(', ')}</p>
                </div>

                <div className="border border-brand-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-brand-base">
                      <tr className="text-xs text-brand-secondary uppercase">
                        <th className="px-3 py-2 text-left">Row</th>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Category</th>
                        <th className="px-3 py-2 text-left">Unit</th>
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.length === 0 ? (
                        <tr><td colSpan={5} className="px-3 py-6 text-center text-brand-muted text-xs">No rows parsed.</td></tr>
                      ) : parsedRows.map((r) => (
                        <tr key={r.row} className="border-t border-brand-border">
                          <td className="px-3 py-2 text-brand-muted text-xs">{r.row}</td>
                          <td className="px-3 py-2 text-brand-primary">{r.name || <span className="text-brand-muted italic">—</span>}</td>
                          <td className="px-3 py-2">{CATEGORIES.find((c) => c.value === r.category)?.label || <span className="text-brand-error">{r.category || '—'}</span>}</td>
                          <td className="px-3 py-2">{UNITS.find((u) => u.value === r.unit)?.label || <span className="text-brand-error">{r.unit || '—'}</span>}</td>
                          <td className="px-3 py-2">
                            {r.errors.length === 0 ? (
                              <span className="inline-flex items-center text-brand-success text-xs"><Check className="w-3 h-3 mr-1" /> OK</span>
                            ) : (
                              <span className="inline-flex items-center text-brand-error text-xs"><AlertTriangle className="w-3 h-3 mr-1" /> {r.errors.join(', ')}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={closeUploadDialog} disabled={uploading}>Cancel</Button>
                  <Button
                    className="flex-1"
                    onClick={handleConfirmUpload}
                    disabled={uploading || parsedRows.filter((r) => r.errors.length === 0).length === 0}
                  >
                    {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</> : `Import ${parsedRows.filter((r) => r.errors.length === 0).length} valid row${parsedRows.filter((r) => r.errors.length === 0).length === 1 ? '' : 's'}`}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-lg bg-brand-success/10 border border-brand-success/30">
                    <p className="text-2xl font-bold text-brand-success">{uploadResult.created.length}</p>
                    <p className="text-xs text-brand-muted">Created</p>
                  </div>
                  <div className="p-3 rounded-lg bg-brand-warning/10 border border-brand-warning/30">
                    <p className="text-2xl font-bold text-brand-warning">{uploadResult.skipped.length}</p>
                    <p className="text-xs text-brand-muted">Skipped (duplicates)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-brand-error/10 border border-brand-error/30">
                    <p className="text-2xl font-bold text-brand-error">{uploadResult.errors.length}</p>
                    <p className="text-xs text-brand-muted">Errors</p>
                  </div>
                </div>
                {(uploadResult.skipped.length > 0 || uploadResult.errors.length > 0) && (
                  <div className="text-xs space-y-1 max-h-48 overflow-y-auto">
                    {uploadResult.skipped.map((s, i) => (
                      <p key={`s${i}`} className="text-brand-warning">Row {s.row}: {s.name} — {s.reason}</p>
                    ))}
                    {uploadResult.errors.map((e, i) => (
                      <p key={`e${i}`} className="text-brand-error">Row {e.row}: {e.message}</p>
                    ))}
                  </div>
                )}
                <Button className="w-full" onClick={closeUploadDialog}>Done</Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
