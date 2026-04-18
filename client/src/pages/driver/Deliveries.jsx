import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, CheckCircle, Phone, Navigation, Package, Camera,
  AlertTriangle, ChevronDown, ChevronUp, Truck, FileText, PenLine,
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

const mockDeliveries = [
  {
    id: 1, client: 'Al Mandaloun', address: 'Hamra Street, Beirut', orderRef: '#1847', itemsCount: 24,
    timeWindow: '7:00 AM - 8:30 AM', status: 'In Progress', phone: '+961 1 234 567',
    instructions: 'Use back entrance. Ask for George.',
    items: [
      { product: 'Roma Tomatoes - Extra', qty: '50 kg' },
      { product: 'Cucumbers - Quality A', qty: '30 kg' },
      { product: 'Bell Peppers - Extra', qty: '20 kg' },
      { product: 'Potatoes - Cooking', qty: '80 kg' },
    ],
  },
  {
    id: 2, client: 'Le Petit Chef', address: 'Gemmayze, Beirut', orderRef: '#1846', itemsCount: 18,
    timeWindow: '8:30 AM - 9:30 AM', status: 'Pending', phone: '+961 1 345 678',
    instructions: 'Ring the bell twice. Delivery to kitchen entrance on the left.',
    items: [
      { product: 'Avocados - Extra', qty: '15 kg' },
      { product: 'Lemons - Quality A', qty: '25 kg' },
      { product: 'Bananas - Quality A', qty: '40 kg' },
    ],
  },
  {
    id: 3, client: 'Karam Beirut', address: 'Verdun, Beirut', orderRef: '#1845', itemsCount: 31,
    timeWindow: '9:30 AM - 10:30 AM', status: 'Pending', phone: '+961 1 456 789',
    instructions: 'Parking available in the basement. Take service elevator.',
    items: [
      { product: 'Onions - Cooking', qty: '60 kg' },
      { product: 'Carrots - Quality A', qty: '35 kg' },
      { product: 'Potatoes - Cooking', qty: '100 kg' },
      { product: 'Roma Tomatoes - Quality A', qty: '45 kg' },
    ],
  },
  {
    id: 4, client: 'Fresh Market', address: 'Achrafieh, Beirut', orderRef: '#1844', itemsCount: 12,
    timeWindow: '10:30 AM - 11:30 AM', status: 'Pending', phone: '+961 1 567 890',
    instructions: '',
    items: [
      { product: 'Iceberg Lettuce - Extra', qty: '20 kg' },
      { product: 'Roma Tomatoes - Quality A', qty: '45 kg' },
    ],
  },
  {
    id: 5, client: 'Souq Express', address: 'Hamra, Beirut', orderRef: '#1843', itemsCount: 22,
    timeWindow: '11:30 AM - 12:30 PM', status: 'Pending', phone: '+961 1 678 901',
    instructions: 'Side door delivery only.',
    items: [
      { product: 'Bell Peppers - Quality A', qty: '30 kg' },
      { product: 'Cucumbers - Extra', qty: '25 kg' },
      { product: 'Avocados - Extra', qty: '10 kg' },
    ],
  },
];

const mockCompleted = [
  { id: 6, client: 'Phoenicia Hotel', orderRef: '#1841', completedAt: '6:45 AM', status: 'Delivered' },
];

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
  const canvasRef = useRef(null);

  const { data: apiData, refetch } = useFetch('/dispatches?page=1&limit=20');

  // Map API dispatches to the shape the UI expects, fallback to mock
  const rawDispatches = apiData?.data || [];
  const deliveries = rawDispatches.length > 0
    ? rawDispatches.map((d) => ({
        id: d.id,
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
      }))
    : mockDeliveries;

  const activeDeliveries = deliveries.filter((d) => d.status !== 'Delivered');
  const completedDeliveries = deliveries.filter((d) => d.status === 'Delivered').length > 0
    ? deliveries.filter((d) => d.status === 'Delivered')
    : mockCompleted;

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
                  onClick={() => setExpandedId(expandedId === delivery.id ? null : delivery.id)}
                  className="ml-11 mt-2 text-brand-accent text-xs flex items-center gap-1 hover:text-brand-accent/80"
                >
                  {expandedId === delivery.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {expandedId === delivery.id ? 'Hide items' : 'View items'}
                </button>

                {expandedId === delivery.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="ml-11 mt-2 space-y-1"
                  >
                    {delivery.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-brand-elevated rounded text-xs">
                        <span className="text-brand-primary">{item.product}</span>
                        <span className="text-brand-secondary">{item.qty}</span>
                      </div>
                    ))}
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
    </motion.div>
  );
}

export { Deliveries };
export default Deliveries;
