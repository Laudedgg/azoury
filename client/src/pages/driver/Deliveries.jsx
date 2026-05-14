import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, CheckCircle, Phone, Navigation, Package, Camera,
  AlertTriangle, ChevronDown, ChevronUp, Truck, FileText, PenLine, Gauge,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useFetch } from '@/hooks/useFetch';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { toast } from 'sonner';
import { getStatusColor } from '@/utils/helpers';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const deliveryStatusOrder = { 'In Progress': 0, 'Pending': 1, 'Delivered': 2 };

function Deliveries() {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [issueDialog, setIssueDialog] = useState(null);
  const [signature, setSignature] = useState(false);
  const [notes, setNotes] = useState('');
  const [issueType, setIssueType] = useState('');
  const [issueNotes, setIssueNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [kmDialog, setKmDialog] = useState(null); // { deliveryId, action: 'start' | 'end' }
  const [kmValue, setKmValue] = useState('');
  const [detailById, setDetailById] = useState({}); // dispatchId -> full dispatch
  const [lineEdits, setLineEdits] = useState({}); // orderItemId -> { delivered, refused, reason }
  const [savingLine, setSavingLine] = useState(null);
  const canvasRef = useRef(null);

  const { data: apiData, refetch } = useFetch('/dispatches?page=1&limit=20');

  // Map API dispatches to the shape the UI expects
  const rawDispatches = apiData?.data || [];
  const deliveries = rawDispatches.map((d) => ({
    id: d.id,
    rawStatus: d.status,
    startKm: d.startKm ?? null,
    endKm: d.endKm ?? null,
    truckPlate: d.truck?.plateNumber || '',
    client: d.items?.[0]?.clientOrder?.client?.businessName || 'Client',
    address: d.items?.[0]?.clientOrder?.client?.address || '',
    orderRef: `#${d.id}`,
    itemsCount: d._count?.items || d.items?.length || 0,
    timeWindow: 'TBD',
    status: d.status === 'IN_TRANSIT' ? 'In Progress' : d.status === 'COMPLETED' ? 'Delivered' : 'Pending',
    phone: d.items?.[0]?.clientOrder?.client?.phone || '',
    instructions: d.items?.[0]?.clientOrder?.specialInstructions || '',
    items: (d.items || []).map((item) => ({
      id: item.id,
      product: item.clientOrder?.items?.map((oi) => oi.product?.name).join(', ') || 'Items',
      qty: `${item.quantity || ''} kg`,
    })),
    dispatchItemIds: (d.items || []).map((item) => item.id),
  }));

  const activeDeliveries = deliveries.filter((d) => d.status !== 'Delivered');
  const completedDeliveries = deliveries.filter((d) => d.status === 'Delivered');

  const handleConfirmDelivery = async () => {
    if (!confirmDialog) return;
    setSubmitting(true);
    try {
      // Confirm each dispatch item
      const dispatchItemIds = confirmDialog.dispatchItemIds || [confirmDialog.id];
      for (const dispatchItemId of dispatchItemIds) {
        await api.post('/dispatches/confirm-delivery', {
          dispatchItemId,
          deliveryNotes: notes,
          signature: signature ? 'captured' : '',
        });
      }
      toast.success('Delivery confirmed');
      setConfirmDialog(null);
      setNotes('');
      setSignature(false);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to confirm delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const loadDetail = async (id) => {
    if (detailById[id]) return;
    try {
      const res = await api.get(`/dispatches/${id}`);
      setDetailById((prev) => ({ ...prev, [id]: res.data }));
      const edits = {};
      for (const di of res.data.items || []) {
        for (const oi of di.clientOrder?.items || []) {
          edits[oi.id] = {
            delivered: String(oi.deliveredQuantity ?? oi.fulfilledQuantity ?? oi.quantity ?? ''),
            refused: String(oi.refusedQuantity ?? 0),
            reason: oi.refusalReason || '',
          };
        }
      }
      setLineEdits((prev) => ({ ...prev, ...edits }));
    } catch {
      // silent
    }
  };

  const updateLine = (itemId, patch) => {
    setLineEdits((prev) => ({ ...prev, [itemId]: { ...(prev[itemId] || {}), ...patch } }));
  };

  const saveLine = async (orderItem, dispatchId) => {
    const edit = lineEdits[orderItem.id] || {};
    const delivered = Number(edit.delivered);
    const refused = Number(edit.refused);
    if (Number.isNaN(delivered) || delivered < 0 || Number.isNaN(refused) || refused < 0) {
      toast.error('Quantities must be non-negative numbers');
      return;
    }
    if (refused > 0 && !edit.reason?.trim()) {
      toast.error('Reason is required when refusing items');
      return;
    }
    setSavingLine(orderItem.id);
    try {
      await api.patch(`/orders/items/${orderItem.id}/delivery`, {
        deliveredQuantity: delivered,
        refusedQuantity: refused,
        refusalReason: edit.reason?.trim() || null,
      });
      toast.success(`${orderItem.product?.name || 'Item'} updated`);
      // Reload detail to reflect persisted values
      const res = await api.get(`/dispatches/${dispatchId}`);
      setDetailById((prev) => ({ ...prev, [dispatchId]: res.data }));
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save line');
    } finally {
      setSavingLine(null);
    }
  };

  const openKmDialog = (deliveryId, action) => {
    setKmDialog({ deliveryId, action });
    setKmValue('');
  };

  const handleKmSubmit = async () => {
    if (!kmDialog) return;
    const km = Number(kmValue);
    if (!kmValue || Number.isNaN(km) || km < 0) {
      toast.error('Enter a valid odometer reading');
      return;
    }
    setSubmitting(true);
    try {
      const status = kmDialog.action === 'start' ? 'IN_TRANSIT' : 'COMPLETED';
      await api.patch(`/dispatches/${kmDialog.deliveryId}/status`, { status, km });
      toast.success(kmDialog.action === 'start' ? 'Trip started' : 'Trip ended');
      setKmDialog(null);
      setKmValue('');
      refetch();
    } catch (err) {
      const resp = err?.response?.data;
      toast.error(resp?.error || resp?.message || 'Failed to update trip');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportIssue = async () => {
    if (!issueDialog) return;
    setSubmitting(true);
    try {
      // Find the raw dispatch to get its real ID
      const rawDispatch = rawDispatches.find((d) => d.id === issueDialog.id);
      const dispatchId = rawDispatch?.id || issueDialog.id;
      await api.patch(`/dispatches/${dispatchId}/status`, { status: 'COMPLETED' });
      toast.success('Issue reported');
      setIssueDialog(null);
      setIssueType('');
      setIssueNotes('');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to report issue');
    } finally {
      setSubmitting(false);
    }
  };

  const totalStops = deliveries.length;
  const estimatedTime = `${Math.round(totalStops * 0.75)}h ${Math.round((totalStops * 0.75 % 1) * 60)}m`;

  // Simple canvas signature handling
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    canvas.isDrawing = true;
    setSignature(true);
  };

  const draw = (e) => {
    const canvas = canvasRef.current;
    if (!canvas?.isDrawing) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#4EECD3';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    if (canvas) canvas.isDrawing = false;
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
      className="space-y-4 max-w-lg mx-auto"
    >
      <motion.div variants={fadeInUp}>
        <h1 className="text-xl font-bold text-brand-primary">My Deliveries</h1>
        <p className="text-sm text-brand-secondary mt-0.5">Today&apos;s delivery schedule</p>
      </motion.div>

      {/* Today's Route Summary */}
      <motion.div variants={fadeInUp}>
        <Card className="bg-brand-accent/10 border-brand-accent/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-accent/20 flex items-center justify-center">
                <Truck className="w-5 h-5 text-brand-accent" />
              </div>
              <div className="flex-1">
                <p className="text-brand-primary font-semibold">Today&apos;s Route</p>
                <p className="text-brand-secondary text-xs">
                  {totalStops} deliveries - Est. {estimatedTime} - Truck B 234 567
                </p>
              </div>
              <Badge variant="accent">{completedDeliveries.length}/{totalStops}</Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delivery Stops */}
      <div className="space-y-3">
        {activeDeliveries.map((delivery, index) => (
          <motion.div
            key={delivery.id}
            variants={fadeInUp}
          >
            <Card className={`transition-all ${delivery.status === 'In Progress' ? 'border-brand-accent/50' : 'hover:border-brand-accent/30'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      delivery.status === 'In Progress' ? 'bg-brand-accent text-brand-base' : 'bg-brand-elevated text-brand-secondary'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-brand-primary">{delivery.client}</p>
                      <p className="text-xs text-brand-muted">{delivery.orderRef}</p>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(delivery.status)}>{delivery.status}</Badge>
                </div>

                {/* Trip odometer controls */}
                <div className="ml-11 mb-3 p-2 bg-brand-elevated/50 rounded-lg border border-brand-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-3.5 h-3.5 text-brand-accent" />
                    <span className="text-brand-secondary text-xs font-medium">Trip Odometer</span>
                    {delivery.truckPlate && <span className="text-brand-muted text-[10px] ml-auto">{delivery.truckPlate}</span>}
                  </div>
                  {delivery.startKm != null && (
                    <p className="text-brand-muted text-[11px]">Start: <span className="text-brand-primary font-medium">{delivery.startKm} km</span></p>
                  )}
                  {delivery.endKm != null && (
                    <p className="text-brand-muted text-[11px]">End: <span className="text-brand-primary font-medium">{delivery.endKm} km</span>
                      {delivery.startKm != null && (
                        <span className="ml-2 text-brand-accent">Δ {(delivery.endKm - delivery.startKm).toFixed(1)} km</span>
                      )}
                    </p>
                  )}
                  {delivery.rawStatus !== 'COMPLETED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 h-7 text-xs"
                      onClick={() => openKmDialog(delivery.id, delivery.startKm == null ? 'start' : 'end')}
                    >
                      <Gauge className="w-3 h-3 mr-1" />
                      {delivery.startKm == null ? 'Start Trip (log km)' : 'End Trip (log km)'}
                    </Button>
                  )}
                </div>

                <div className="space-y-2 text-sm ml-11">
                  <div className="flex items-center gap-2 text-brand-secondary">
                    <MapPin className="h-4 w-4 text-brand-muted flex-shrink-0" />
                    <span>{delivery.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-brand-secondary">
                    <Clock className="h-4 w-4 text-brand-muted flex-shrink-0" />
                    <span>{delivery.timeWindow}</span>
                  </div>
                  <div className="flex items-center gap-2 text-brand-secondary">
                    <Package className="h-4 w-4 text-brand-muted flex-shrink-0" />
                    <span>{delivery.itemsCount} items</span>
                  </div>
                </div>

                {/* Expand/Collapse Items */}
                <button
                  onClick={() => {
                    const next = expandedId === delivery.id ? null : delivery.id;
                    setExpandedId(next);
                    if (next) loadDetail(delivery.id);
                  }}
                  className="ml-11 mt-2 text-brand-accent text-xs flex items-center gap-1 hover:text-brand-accent/80"
                >
                  {expandedId === delivery.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {expandedId === delivery.id ? 'Hide line items' : 'Record delivery per item'}
                </button>

                {expandedId === delivery.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="ml-11 mt-2 space-y-3"
                  >
                    {!detailById[delivery.id] ? (
                      <p className="text-brand-muted text-xs italic">Loading items…</p>
                    ) : (
                      (detailById[delivery.id].items || []).map((di) => (
                        <div key={di.id} className="space-y-1.5">
                          <p className="text-brand-secondary text-[11px] uppercase tracking-wider">
                            {di.clientOrder?.client?.businessName || 'Client'}
                          </p>
                          {(di.clientOrder?.items || []).map((oi) => {
                            const edit = lineEdits[oi.id] || {};
                            const refused = Number(edit.refused || 0);
                            return (
                              <div key={oi.id} className="p-2 bg-brand-elevated rounded-lg border border-brand-border space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-brand-primary text-sm font-medium truncate">{oi.product?.name}</p>
                                  <span className="text-brand-muted text-[11px] shrink-0">
                                    Loaded {oi.fulfilledQuantity ?? oi.quantity} {oi.product?.unit}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-brand-muted text-[10px] uppercase tracking-wider mb-1">Delivered</label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.1"
                                      value={edit.delivered ?? ''}
                                      onChange={(e) => updateLine(oi.id, { delivered: e.target.value })}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-brand-muted text-[10px] uppercase tracking-wider mb-1">Refused</label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.1"
                                      value={edit.refused ?? '0'}
                                      onChange={(e) => updateLine(oi.id, { refused: e.target.value })}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                </div>
                                {refused > 0 && (
                                  <Input
                                    placeholder="Reason for refusal (required)"
                                    value={edit.reason ?? ''}
                                    onChange={(e) => updateLine(oi.id, { reason: e.target.value })}
                                    className="h-8 text-sm"
                                  />
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full h-7 text-xs"
                                  onClick={() => saveLine(oi, delivery.id)}
                                  disabled={savingLine === oi.id}
                                >
                                  {savingLine === oi.id ? 'Saving…' : 'Save this item'}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ))
                    )}
                    {delivery.instructions && (
                      <div className="p-2 bg-brand-warning/10 rounded text-xs text-brand-warning border border-brand-warning/20 mt-2">
                        <FileText className="w-3 h-3 inline mr-1" />
                        {delivery.instructions}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3 ml-11">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a href={`tel:${delivery.phone}`}>
                      <Phone className="h-3.5 w-3.5 mr-1" /> Call
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Navigation className="h-3.5 w-3.5 mr-1" /> Navigate
                  </Button>
                  {delivery.status === 'In Progress' && (
                    <>
                      <Button size="sm" className="flex-1" onClick={() => setConfirmDialog(delivery)}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Deliver
                      </Button>
                    </>
                  )}
                </div>

                {delivery.status === 'In Progress' && (
                  <div className="ml-11 mt-2">
                    <button
                      onClick={() => setIssueDialog(delivery)}
                      className="text-brand-error text-xs flex items-center gap-1 hover:text-brand-error/80"
                    >
                      <AlertTriangle className="w-3 h-3" /> Report Issue
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Completed Deliveries */}
      {completedDeliveries.length > 0 && (
        <motion.div variants={fadeInUp}>
          <h2 className="text-brand-secondary font-medium text-sm mb-2">Completed</h2>
          <div className="space-y-2">
            {completedDeliveries.map((delivery) => (
              <Card key={delivery.id} className="bg-brand-success/5 border-brand-success/20">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-brand-success" />
                      <div>
                        <p className="text-brand-primary text-sm font-medium">{delivery.client}</p>
                        <p className="text-brand-muted text-xs">{delivery.orderRef} - Completed {delivery.completedAt}</p>
                      </div>
                    </div>
                    <Badge variant="success">Delivered</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Confirm Delivery Dialog */}
      {confirmDialog && (
        <Dialog open onOpenChange={() => setConfirmDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delivery - {confirmDialog.client}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Signature Area */}
              <div>
                <label className="block text-brand-secondary text-sm mb-2">
                  <PenLine className="w-4 h-4 inline mr-1" /> Customer Signature
                </label>
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={120}
                  className="w-full h-30 bg-brand-elevated border border-brand-border rounded-lg cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                {!signature && (
                  <p className="text-brand-muted text-xs mt-1">Draw signature above</p>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-brand-secondary text-sm mb-2">
                  <Camera className="w-4 h-4 inline mr-1" /> Delivery Photo
                </label>
                <div className="w-full h-20 bg-brand-elevated border-2 border-dashed border-brand-border rounded-lg flex items-center justify-center cursor-pointer hover:border-brand-accent/50 transition-colors">
                  <div className="text-center">
                    <Camera className="w-5 h-5 text-brand-muted mx-auto" />
                    <p className="text-brand-muted text-xs mt-1">Tap to take photo</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Notes</label>
                <textarea
                  className="w-full bg-brand-elevated border border-brand-border rounded-lg p-3 text-brand-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-accent resize-none"
                  rows={2}
                  placeholder="Optional delivery notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button className="w-full" onClick={handleConfirmDelivery} disabled={submitting}>
                <CheckCircle className="w-4 h-4 mr-2" /> {submitting ? 'Confirming...' : 'Confirm Delivery'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Report Issue Dialog */}
      {issueDialog && (
        <Dialog open onOpenChange={() => setIssueDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Issue - {issueDialog.client}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Issue Type</label>
                <Select value={issueType} onValueChange={setIssueType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unavailable">Client Unavailable</SelectItem>
                    <SelectItem value="refused">Delivery Refused</SelectItem>
                    <SelectItem value="damaged">Product Damaged</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Notes</label>
                <textarea
                  className="w-full bg-brand-elevated border border-brand-border rounded-lg p-3 text-brand-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-accent resize-none"
                  rows={3}
                  placeholder="Describe the issue..."
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                />
              </div>
              <Button variant="destructive" className="w-full" onClick={handleReportIssue} disabled={submitting}>
                <AlertTriangle className="w-4 h-4 mr-2" /> {submitting ? 'Submitting...' : 'Submit Issue Report'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Km Odometer Dialog */}
      {kmDialog && (
        <Dialog open onOpenChange={() => { setKmDialog(null); setKmValue(''); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {kmDialog.action === 'start' ? 'Start Trip' : 'End Trip'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-brand-secondary text-sm">
                {kmDialog.action === 'start'
                  ? 'Enter the truck odometer reading before leaving.'
                  : 'Enter the truck odometer reading on return.'}
              </p>
              <div>
                <label className="block text-brand-secondary text-sm mb-1">Odometer (km)</label>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  autoFocus
                  placeholder="e.g. 12345"
                  value={kmValue}
                  onChange={(e) => setKmValue(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleKmSubmit} disabled={submitting}>
                <Gauge className="w-4 h-4 mr-2" /> {submitting ? 'Saving...' : (kmDialog.action === 'start' ? 'Start Trip' : 'End Trip')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}

export { Deliveries };
export default Deliveries;
