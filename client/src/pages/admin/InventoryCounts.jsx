import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList, Plus, Check, Loader2, ArrowLeft, X, Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useFetch } from '@/hooks/useFetch';
import api from '@/services/api';
import { toast } from 'sonner';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

function InventoryCounts() {
  const [openCountId, setOpenCountId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [notes, setNotes] = useState('');

  const { data: countsRes, refetch: refetchCounts } = useFetch('/inventory/counts');
  const counts = countsRes?.data || [];

  const startCount = async () => {
    setCreating(true);
    try {
      const res = await api.post('/inventory/counts', { notes });
      toast.success('Count started');
      setNotes('');
      refetchCounts();
      setOpenCountId(res.data.id);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to start count');
    } finally {
      setCreating(false);
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
          icon={ClipboardList}
          title="Inventory Counts"
          subtitle="Start a cycle count, enter physical quantities, submit to reconcile stock"
        />
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Card>
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Input
              placeholder="Optional notes (e.g. 'Monday cold-room check')"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1"
            />
            <Button onClick={startCount} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Start New Count
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeInUp}>
        {counts.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No counts yet"
            description="A count is a snapshot of the physical stock you see in the warehouse. Start one above, add the products you're counting, enter what you actually measured, then submit."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brand-border bg-brand-elevated/40">
                      <th className="h-9 px-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Started</th>
                      <th className="h-9 px-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">By</th>
                      <th className="h-9 px-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Items</th>
                      <th className="h-9 px-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Status</th>
                      <th className="h-9 px-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Notes</th>
                      <th className="h-9 px-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counts.map((c) => (
                      <tr key={c.id} className="border-b border-brand-border/60 last:border-0 hover:bg-brand-elevated/40">
                        <td className="px-3 py-2 text-sm text-brand-primary mono">
                          {new Date(c.startedAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-sm text-brand-secondary">
                          {c.createdBy?.firstName} {c.createdBy?.lastName}
                        </td>
                        <td className="px-3 py-2 text-sm text-right mono">{c._count?.items ?? 0}</td>
                        <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                        <td className="px-3 py-2 text-sm text-brand-muted truncate max-w-xs">{c.notes || '—'}</td>
                        <td className="px-3 py-2 text-right">
                          <Button size="sm" variant="outline" onClick={() => setOpenCountId(c.id)}>Open</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {openCountId && (
        <CountDetailDialog
          countId={openCountId}
          onClose={() => setOpenCountId(null)}
          onSubmitted={() => { refetchCounts(); setOpenCountId(null); }}
        />
      )}
    </motion.div>
  );
}

function CountDetailDialog({ countId, onClose, onSubmitted }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savingItem, setSavingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState({}); // itemId -> string

  const { data: count, refetch, loading } = useFetch(`/inventory/counts/${countId}`);
  const { data: stockRes } = useFetch('/inventory/stock');

  const gradesInCount = useMemo(() => new Set((count?.items || []).map((i) => i.qualityGradeId)), [count]);

  const flatGrades = useMemo(() => {
    const rows = [];
    (stockRes || []).forEach((p) => {
      (p.grades || []).forEach((g) => {
        rows.push({
          gradeId: g.id,
          productName: p.product?.name,
          grade: g.clientFacingGrade || g.grade,
          unit: p.product?.unit,
          currentStock: g.currentStock ?? 0,
        });
      });
    });
    return rows;
  }, [stockRes]);

  const isDraft = count?.status === 'DRAFT';

  const savePhysical = async (item) => {
    const raw = values[item.id];
    if (raw === undefined) return;
    setSavingItem(item.id);
    try {
      await api.patch(`/inventory/counts/${countId}/items/${item.id}`, {
        physicalCount: raw === '' ? null : Number(raw),
      });
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Save failed');
    } finally {
      setSavingItem(null);
    }
  };

  const removeItem = async (item) => {
    setSavingItem(item.id);
    try {
      await api.delete(`/inventory/counts/${countId}/items/${item.id}`);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Remove failed');
    } finally {
      setSavingItem(null);
    }
  };

  const addPickedGrades = async (ids) => {
    if (ids.length === 0) return;
    try {
      await api.post(`/inventory/counts/${countId}/items`, { qualityGradeIds: ids });
      refetch();
      setPickerOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to add items');
    }
  };

  const submitCount = async () => {
    setSubmitting(true);
    try {
      await api.post(`/inventory/counts/${countId}/submit`);
      toast.success('Count submitted — stock reconciled');
      onSubmitted?.();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-brand-accent" />
            Count {count && `#${count.id?.slice(0, 8)}`}
            {count && <StatusBadge status={count.status} />}
          </DialogTitle>
        </DialogHeader>

        {loading || !count ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-brand-accent" />
          </div>
        ) : (
          <div className="space-y-4">
            {isDraft && (
              <div className="flex items-center justify-between">
                <p className="text-brand-secondary text-sm">
                  {count.items.length} item{count.items.length === 1 ? '' : 's'} in this count
                </p>
                <Button size="sm" onClick={() => setPickerOpen(true)}>
                  <Plus className="w-3.5 h-3.5" /> Add items
                </Button>
              </div>
            )}

            {count.items.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No items in this count yet"
                description={isDraft ? "Click 'Add items' to pick which products to count." : "This count was submitted with no items."}
                dense
              />
            ) : (
              <div className="rounded-lg border border-brand-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-border bg-brand-elevated/40">
                        <th className="h-9 px-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Product</th>
                        <th className="h-9 px-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Grade</th>
                        <th className="h-9 px-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">System</th>
                        <th className="h-9 px-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-accent">Physical</th>
                        <th className="h-9 px-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Adj</th>
                        {isDraft && <th className="h-9 px-3 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {count.items.map((it) => {
                        const rawVal = values[it.id];
                        const displayVal = rawVal !== undefined ? rawVal : (it.physicalCount ?? '');
                        const showAdj = it.physicalCount != null
                          ? (Number(it.physicalCount) - Number(it.systemCount))
                          : (rawVal !== undefined && rawVal !== '' ? Number(rawVal) - Number(it.systemCount) : null);
                        return (
                          <tr key={it.id} className="border-b border-brand-border/60 last:border-0">
                            <td className="px-3 py-2 text-sm text-brand-primary">{it.product?.name}</td>
                            <td className="px-3 py-2 text-sm"><Badge variant="outline">{it.qualityGrade?.clientFacingGrade || it.qualityGrade?.grade}</Badge></td>
                            <td className="px-3 py-2 text-sm text-right mono text-brand-secondary">{Number(it.systemCount).toFixed(1)}</td>
                            <td className="px-3 py-2 text-right">
                              {isDraft ? (
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={displayVal}
                                  placeholder="—"
                                  onChange={(e) => setValues((v) => ({ ...v, [it.id]: e.target.value }))}
                                  onBlur={() => savePhysical(it)}
                                  className="w-24 h-8 text-sm text-right ml-auto"
                                />
                              ) : (
                                <span className="mono text-brand-primary font-semibold">
                                  {it.physicalCount != null ? Number(it.physicalCount).toFixed(1) : '—'}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-sm text-right mono">
                              {showAdj != null ? (
                                <span className={showAdj > 0 ? 'text-brand-success' : showAdj < 0 ? 'text-brand-error' : 'text-brand-muted'}>
                                  {showAdj > 0 ? '+' : ''}{showAdj.toFixed(1)}
                                </span>
                              ) : <span className="text-brand-muted">—</span>}
                            </td>
                            {isDraft && (
                              <td className="px-3 py-2 text-center">
                                <Button size="icon-sm" variant="ghost" onClick={() => removeItem(it)} disabled={savingItem === it.id}>
                                  {savingItem === it.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                </Button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {isDraft && count.items.length > 0 && (
              <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
                <Button variant="ghost" onClick={onClose}>Save & Close</Button>
                <Button onClick={submitCount} disabled={submitting || !count.items.some((i) => i.physicalCount != null)}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Submit — Reconcile Stock
                </Button>
              </div>
            )}

            {pickerOpen && (
              <GradePickerDialog
                grades={flatGrades.filter((g) => !gradesInCount.has(g.gradeId))}
                onClose={() => setPickerOpen(false)}
                onPick={addPickedGrades}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function GradePickerDialog({ grades, onClose, onPick }) {
  const [q, setQ] = useState('');
  const [checked, setChecked] = useState(new Set());

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return grades;
    return grades.filter((g) =>
      g.productName?.toLowerCase().includes(s) ||
      g.grade?.toLowerCase().includes(s)
    );
  }, [grades, q]);

  const toggle = (id) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAllVisible = () => {
    const ids = filtered.map((g) => g.gradeId);
    const allSelected = ids.every((id) => checked.has(id));
    setChecked((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pick items to count</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
            <Input
              placeholder="Search products..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-brand-muted">
              {filtered.length} available · {checked.size} selected
            </span>
            <Button size="xs" variant="ghost" onClick={toggleAllVisible}>
              {filtered.every((g) => checked.has(g.gradeId)) ? 'Clear all visible' : 'Select all visible'}
            </Button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-brand-border divide-y divide-brand-border">
            {filtered.length === 0 ? (
              <div className="text-center py-6 text-brand-muted text-sm">Nothing matches</div>
            ) : filtered.map((g) => (
              <label
                key={g.gradeId}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-brand-elevated/40 ${
                  checked.has(g.gradeId) ? 'bg-brand-accent/5' : ''
                }`}
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-brand-accent"
                  checked={checked.has(g.gradeId)}
                  onChange={() => toggle(g.gradeId)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-brand-primary text-sm truncate">{g.productName}</p>
                  <p className="text-brand-muted text-xs">{g.grade} · {g.unit}</p>
                </div>
                <span className="text-xs text-brand-muted mono">system: {g.currentStock.toFixed(1)}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onPick([...checked])} disabled={checked.size === 0}>
              Add {checked.size} item{checked.size === 1 ? '' : 's'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { InventoryCounts };
export default InventoryCounts;
