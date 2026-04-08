import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, Package, Camera, Image, X, Eye, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { useFetch } from '@/hooks/useFetch';

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const mockDispatches = [
  {
    id: 1,
    dispatchNum: 'D-392',
    client: 'Al Mandaloun',
    itemsCount: 24,
    status: 'Preparing',
    items: [
      { id: 1, product: 'Roma Tomatoes - Extra', qty: 50, photos: [{ id: 1, url: '/photos/p1.jpg', time: '09:15 AM' }] },
      { id: 2, product: 'Cucumbers - Quality A', qty: 30, photos: [] },
      { id: 3, product: 'Bell Peppers - Extra', qty: 20, photos: [{ id: 2, url: '/photos/p2.jpg', time: '09:20 AM' }] },
      { id: 4, product: 'Potatoes - Quality C', qty: 80, photos: [] },
    ],
  },
  {
    id: 2,
    dispatchNum: 'D-393',
    client: 'Le Petit Chef',
    itemsCount: 18,
    status: 'Loading',
    items: [
      { id: 5, product: 'Avocados - Extra', qty: 15, photos: [{ id: 3, url: '/photos/p3.jpg', time: '09:30 AM' }, { id: 4, url: '/photos/p4.jpg', time: '09:32 AM' }] },
      { id: 6, product: 'Lemons - Quality A', qty: 25, photos: [] },
      { id: 7, product: 'Bananas - Quality A', qty: 40, photos: [{ id: 5, url: '/photos/p5.jpg', time: '09:35 AM' }] },
    ],
  },
  {
    id: 3,
    dispatchNum: 'D-394',
    client: 'Karam Beirut',
    itemsCount: 31,
    status: 'Ready',
    items: [
      { id: 8, product: 'Onions - Quality C', qty: 60, photos: [{ id: 6, url: '/photos/p6.jpg', time: '08:45 AM' }] },
      { id: 9, product: 'Carrots - Quality A', qty: 35, photos: [{ id: 7, url: '/photos/p7.jpg', time: '08:50 AM' }] },
      { id: 10, product: 'Potatoes - Quality C', qty: 100, photos: [{ id: 8, url: '/photos/p8.jpg', time: '08:55 AM' }] },
    ],
  },
  {
    id: 4,
    dispatchNum: 'D-395',
    client: 'Fresh Market',
    itemsCount: 12,
    status: 'Preparing',
    items: [
      { id: 11, product: 'Iceberg Lettuce - Extra', qty: 20, photos: [] },
      { id: 12, product: 'Roma Tomatoes - Quality A', qty: 45, photos: [] },
    ],
  },
  {
    id: 5,
    dispatchNum: 'D-396',
    client: 'Souq Express',
    itemsCount: 22,
    status: 'Loading',
    items: [
      { id: 13, product: 'Bell Peppers - Quality A', qty: 30, photos: [{ id: 9, url: '/photos/p9.jpg', time: '10:00 AM' }] },
      { id: 14, product: 'Cucumbers - Extra', qty: 25, photos: [] },
      { id: 15, product: 'Avocados - Extra', qty: 10, photos: [] },
    ],
  },
  {
    id: 6,
    dispatchNum: 'D-397',
    client: 'Phoenicia Hotel',
    itemsCount: 38,
    status: 'Preparing',
    items: [
      { id: 16, product: 'Roma Tomatoes - Extra', qty: 80, photos: [] },
      { id: 17, product: 'Lemons - Extra', qty: 30, photos: [] },
      { id: 18, product: 'Bananas - Extra', qty: 50, photos: [] },
      { id: 19, product: 'Avocados - Extra', qty: 25, photos: [] },
    ],
  },
];

const statusVariant = (s) => {
  const map = { Preparing: 'warning', Loading: 'accent', Ready: 'success' };
  return map[s] || 'default';
};

function Logistics() {
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [photoModal, setPhotoModal] = useState(null);

  const { data: apiData } = useFetch('/dispatches');
  const dispatches = apiData?.dispatches || mockDispatches;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-6"
    >
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl font-bold text-brand-primary">Logistics Dashboard</h1>
        <p className="text-brand-secondary text-sm mt-1">Manage dispatch preparation and photo documentation</p>
      </motion.div>

      {/* Dispatch Grid */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dispatches.map((dispatch) => (
          <Card
            key={dispatch.id}
            className="cursor-pointer hover:border-brand-accent/50 transition-all"
            onClick={() => setSelectedDispatch(dispatch)}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-brand-accent" />
                  <span className="text-brand-primary font-semibold">{dispatch.dispatchNum}</span>
                </div>
                <Badge variant={statusVariant(dispatch.status)}>{dispatch.status}</Badge>
              </div>
              <p className="text-brand-primary font-medium">{dispatch.client}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand-border">
                <span className="text-brand-secondary text-sm">{dispatch.itemsCount} items</span>
                <div className="flex items-center gap-1 text-brand-muted text-xs">
                  <Camera className="w-3 h-3" />
                  {dispatch.items.reduce((sum, item) => sum + item.photos.length, 0)} photos
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Selected Dispatch Detail */}
      {selectedDispatch && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-brand-primary">
                    {selectedDispatch.dispatchNum} - {selectedDispatch.client}
                  </h3>
                  <p className="text-brand-secondary text-sm">{selectedDispatch.items.length} line items</p>
                </div>
                <Button variant="outline" onClick={() => setSelectedDispatch(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {selectedDispatch.items.map((item) => (
                  <div key={item.id} className="bg-brand-elevated rounded-lg p-4 border border-brand-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-brand-accent" />
                        <span className="text-brand-primary font-medium">{item.product}</span>
                        <span className="text-brand-secondary text-sm">{item.qty} kg</span>
                      </div>
                      <Button variant="outline" size="sm">
                        <Upload className="w-3 h-3 mr-1" /> Upload Photo
                      </Button>
                    </div>

                    {item.photos.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {item.photos.map((photo) => (
                          <div
                            key={photo.id}
                            className="relative w-20 h-20 bg-brand-base rounded-lg border border-brand-border cursor-pointer hover:border-brand-accent/50 transition-colors group"
                            onClick={() => setPhotoModal(photo)}
                          >
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="w-6 h-6 text-brand-muted" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-brand-base/60 rounded-lg transition-opacity">
                              <Eye className="w-5 h-5 text-brand-accent" />
                            </div>
                            <span className="absolute bottom-1 right-1 text-[10px] text-brand-muted">{photo.time}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {item.photos.length === 0 && (
                      <p className="text-brand-muted text-xs">No photos uploaded yet</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Photo Modal */}
      {photoModal && (
        <Dialog open onOpenChange={() => setPhotoModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Photo Preview</DialogTitle>
            </DialogHeader>
            <div className="w-full h-64 bg-brand-elevated rounded-lg flex items-center justify-center">
              <Image className="w-16 h-16 text-brand-muted" />
            </div>
            <p className="text-brand-muted text-sm text-center">Taken at {photoModal.time}</p>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}

export { Logistics };
export default Logistics;
