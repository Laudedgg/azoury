import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Truck, Plus, Pencil, Trash2, Search, Loader2, Phone, Mail, MapPin, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useFetch } from '@/hooks/useFetch';
import api from '@/services/api';
import { toast } from 'sonner';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const emptyForm = { name: '', contactPerson: '', email: '', phone: '', address: '' };

function Suppliers() {
  const { user } = useAuth();
  const canEdit = ['SUPER_ADMIN', 'PURCHASE_MANAGER', 'OPERATIONS_MANAGER'].includes(user?.role);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const { data, refetch } = useFetch('/suppliers');
  const suppliers = data?.data || data || [];

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return suppliers;
    return suppliers.filter((sup) =>
      (sup.name || '').toLowerCase().includes(s) ||
      (sup.contactPerson || '').toLowerCase().includes(s) ||
      (sup.phone || '').toLowerCase().includes(s) ||
      (sup.email || '').toLowerCase().includes(s)
    );
  }, [suppliers, q]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };
  const openEdit = (sup) => {
    setEditingId(sup.id);
    setForm({
      name: sup.name || '',
      contactPerson: sup.contactPerson || '',
      email: sup.email || '',
      phone: sup.phone || '',
      address: sup.address || '',
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name?.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, form);
        toast.success(`Updated ${form.name}`);
      } else {
        await api.post('/suppliers', form);
        toast.success(`Added ${form.name}`);
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (sup) => {
    if (!confirm(`Deactivate supplier "${sup.name}"? They can be re-added later.`)) return;
    setDeletingId(sup.id);
    try {
      await api.delete(`/suppliers/${sup.id}`);
      toast.success(`Deactivated ${sup.name}`);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to deactivate');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-4 lg:space-y-6"
    >
      <motion.div variants={fadeInUp}>
        <PageHeader
          icon={Truck}
          title="Supply Chain"
          subtitle="Add and manage the suppliers you buy produce from"
          actions={canEdit && (
            <Button size="sm" onClick={openNew}>
              <Plus className="w-4 h-4" /> Add Supplier
            </Button>
          )}
        />
      </motion.div>

      <motion.div variants={fadeInUp}>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
          <Input
            className="pl-10"
            placeholder="Search by name, contact, phone, email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </motion.div>

      <motion.div variants={fadeInUp}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Truck}
            title={suppliers.length === 0 ? 'No suppliers yet' : 'Nothing matches your search'}
            description={suppliers.length === 0
              ? 'Add your first supplier so you can attribute receipts, generate POs, and track pricing.'
              : 'Try a different search term.'}
            action={canEdit && suppliers.length === 0 ? (
              <Button onClick={openNew}><Plus className="w-4 h-4" /> Add First Supplier</Button>
            ) : null}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((sup) => (
              <Card key={sup.id} className="group hover:border-brand-accent/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-brand-primary font-semibold truncate">{sup.name}</p>
                      {sup.contactPerson && (
                        <p className="text-brand-secondary text-xs truncate flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-brand-muted" />
                          {sup.contactPerson}
                        </p>
                      )}
                    </div>
                    {sup.isActive === false && <Badge variant="muted">Inactive</Badge>}
                  </div>
                  <div className="space-y-1 mt-3 text-xs text-brand-muted">
                    {sup.phone && (
                      <a href={`tel:${sup.phone}`} className="flex items-center gap-1.5 hover:text-brand-accent">
                        <Phone className="w-3 h-3" />
                        <span className="truncate">{sup.phone}</span>
                      </a>
                    )}
                    {sup.email && (
                      <a href={`mailto:${sup.email}`} className="flex items-center gap-1.5 hover:text-brand-accent">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{sup.email}</span>
                      </a>
                    )}
                    {sup.address && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{sup.address}</span>
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-brand-border/60 opacity-70 group-hover:opacity-100 transition-opacity">
                      <Button size="xs" variant="ghost" onClick={() => openEdit(sup)}>
                        <Pencil className="w-3 h-3" /> Edit
                      </Button>
                      {sup.isActive !== false && (
                        <Button
                          size="xs"
                          variant="ghost"
                          className="text-brand-error hover:text-brand-error"
                          disabled={deletingId === sup.id}
                          onClick={() => deactivate(sup)}
                        >
                          {deletingId === sup.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          Deactivate
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-accent" />
              {editingId ? 'Edit supplier' : 'Add supplier'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-brand-secondary text-xs mb-1">Name <span className="text-brand-accent">*</span></label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Al-Arz Fresh Produce" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-brand-secondary text-xs mb-1">Contact person</label>
                <Input value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} placeholder="Full name" />
              </div>
              <div>
                <label className="block text-brand-secondary text-xs mb-1">Phone</label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+961 …" />
              </div>
            </div>
            <div>
              <label className="block text-brand-secondary text-xs mb-1">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="orders@supplier.lb" />
            </div>
            <div>
              <label className="block text-brand-secondary text-xs mb-1">Address</label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Bekaa, Beirut, …" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
              <Button className="flex-1" onClick={save} disabled={saving || !form.name?.trim()}>
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : (editingId ? 'Save changes' : 'Add supplier')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export { Suppliers };
export default Suppliers;
