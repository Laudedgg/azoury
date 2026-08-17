import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Users, Save, Loader2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFetch } from '@/hooks/useFetch';
import api from '@/services/api';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/helpers';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

function Pricing() {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [savingKey, setSavingKey] = useState(null);
  const [edits, setEdits] = useState({}); // gradeId -> { costPrice?: string, sellPrice?: string, clientPrice?: string }

  const queryUrl = selectedClientId
    ? `/pricing/grades?clientId=${selectedClientId}`
    : '/pricing/grades';
  const { data: grades, refetch: refetchGrades } = useFetch(queryUrl);
  const { data: clientsRes } = useFetch('/clients');
  const clients = clientsRes?.data || clientsRes || [];

  const setEdit = useCallback((gradeId, patch) => {
    setEdits((prev) => ({ ...prev, [gradeId]: { ...(prev[gradeId] || {}), ...patch } }));
  }, []);

  const saveGradePricing = async (row) => {
    const patch = edits[row.gradeId] || {};
    const payload = {};
    if (patch.costPrice !== undefined) payload.costPrice = Number(patch.costPrice || 0);
    if (patch.sellPrice !== undefined) payload.sellPrice = Number(patch.sellPrice || 0);
    if (Object.keys(payload).length === 0) return;
    setSavingKey(row.gradeId);
    try {
      await api.patch(`/pricing/grades/${row.gradeId}`, payload);
      toast.success(`Saved pricing for ${row.product?.name}`);
      setEdits((prev) => {
        const next = { ...prev };
        delete next[row.gradeId];
        return next;
      });
      refetchGrades();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Save failed');
    } finally {
      setSavingKey(null);
    }
  };

  const saveClientOverride = async (row) => {
    if (!selectedClientId) return;
    const raw = edits[row.gradeId]?.clientPrice;
    if (raw === undefined || raw === '') return;
    setSavingKey(`c-${row.gradeId}`);
    try {
      await api.post(`/pricing/client/${selectedClientId}`, {
        qualityGradeId: row.gradeId,
        sellPrice: Number(raw),
      });
      toast.success(`Client price set for ${row.product?.name}`);
      setEdits((prev) => {
        const next = { ...prev };
        if (next[row.gradeId]) delete next[row.gradeId].clientPrice;
        return next;
      });
      refetchGrades();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Save failed');
    } finally {
      setSavingKey(null);
    }
  };

  const removeClientOverride = async (row) => {
    if (!row.overrideId) return;
    setSavingKey(`c-${row.gradeId}`);
    try {
      await api.delete(`/pricing/client/${selectedClientId}/override/${row.overrideId}`);
      toast.success('Override removed — client now sees default price');
      refetchGrades();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Remove failed');
    } finally {
      setSavingKey(null);
    }
  };

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const rows = grades || [];
    if (!q) return rows;
    return rows.filter((r) =>
      (r.product?.name || '').toLowerCase().includes(q) ||
      (r.product?.category || '').toLowerCase().includes(q) ||
      (r.grade || '').toLowerCase().includes(q)
    );
  }, [grades, searchTerm]);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-4 lg:space-y-6"
    >
      <motion.div variants={fadeInUp}>
        <PageHeader
          icon={DollarSign}
          title="Pricing"
          subtitle="Set cost, default sell price, and per-client overrides"
        />
      </motion.div>

      <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="min-w-0">
          <label className="block text-brand-secondary text-xs font-medium mb-1">Filter by client (for overrides)</label>
          <Select value={selectedClientId} onValueChange={(v) => setSelectedClientId(v === '__none__' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Show default prices only" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— No client (default prices) —</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.businessName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-brand-secondary text-xs font-medium mb-1">Search</label>
          <Input
            placeholder="Search products, category, grade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.div>

      <motion.div variants={fadeInUp}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No products to price yet"
            description="Add products and quality grades from the Products page — then set cost + sell price here."
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brand-border bg-brand-elevated/40">
                      <th className="h-9 px-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Product</th>
                      <th className="h-9 px-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Grade</th>
                      <th className="h-9 px-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Stock</th>
                      <th className="h-9 px-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Cost</th>
                      <th className="h-9 px-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-accent">Default Sell</th>
                      <th className="h-9 px-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Margin</th>
                      <th className="h-9 px-3 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Save</th>
                      {selectedClientId && (
                        <th className="h-9 px-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-success">
                          <Users className="w-3 h-3 inline mr-1" />
                          Client Price
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => {
                      const edit = edits[row.gradeId] || {};
                      const costVal = edit.costPrice ?? (row.costPrice ?? '');
                      const sellVal = edit.sellPrice ?? (row.defaultSellPrice ?? 0);
                      const dirty = edit.costPrice !== undefined || edit.sellPrice !== undefined;
                      const numCost = Number(costVal) || 0;
                      const numSell = Number(sellVal) || 0;
                      const margin = numSell > 0 ? ((numSell - numCost) / numSell) * 100 : 0;
                      const clientVal = edit.clientPrice ?? (row.clientSellPrice ?? '');
                      const isOverridden = row.clientSellPrice != null;

                      return (
                        <tr key={row.gradeId} className="border-b border-brand-border/60 last:border-0 hover:bg-brand-elevated/40">
                          <td className="px-3 py-2 text-sm text-brand-primary">
                            <div>{row.product?.name}</div>
                            <div className="text-xs text-brand-muted">{row.product?.unit}</div>
                          </td>
                          <td className="px-3 py-2 text-sm">
                            <Badge variant="outline">{row.clientFacingGrade}</Badge>
                          </td>
                          <td className="px-3 py-2 text-sm text-right mono text-brand-secondary">
                            {(row.currentStock ?? 0).toFixed(1)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={costVal}
                              placeholder="0.00"
                              onChange={(e) => setEdit(row.gradeId, { costPrice: e.target.value })}
                              className="w-24 h-8 text-sm text-right"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={sellVal}
                              placeholder="0.00"
                              onChange={(e) => setEdit(row.gradeId, { sellPrice: e.target.value })}
                              className="w-24 h-8 text-sm text-right"
                            />
                          </td>
                          <td className="px-3 py-2 text-sm text-right mono">
                            <span className={margin >= 30 ? 'text-brand-success font-semibold' : margin >= 15 ? 'text-brand-warning' : 'text-brand-error'}>
                              {margin.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Button
                              size="xs"
                              variant={dirty ? 'default' : 'ghost'}
                              disabled={!dirty || savingKey === row.gradeId}
                              onClick={() => saveGradePricing(row)}
                            >
                              {savingKey === row.gradeId
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Save className="w-3 h-3" />}
                            </Button>
                          </td>
                          {selectedClientId && (
                            <td className="px-3 py-2 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={clientVal}
                                  placeholder="—"
                                  onChange={(e) => setEdit(row.gradeId, { clientPrice: e.target.value })}
                                  onBlur={() => {
                                    if (edit.clientPrice !== undefined && edit.clientPrice !== '') {
                                      saveClientOverride(row);
                                    }
                                  }}
                                  className={`w-24 h-8 text-sm text-right ${isOverridden ? 'border-brand-success/40' : ''}`}
                                />
                                {isOverridden && (
                                  <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    className="text-brand-muted hover:text-brand-error"
                                    onClick={() => removeClientOverride(row)}
                                    title="Remove override"
                                    disabled={savingKey === `c-${row.gradeId}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}

export { Pricing };
export default Pricing;
