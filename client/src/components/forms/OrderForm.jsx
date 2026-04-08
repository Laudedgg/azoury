import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Separator } from '@/components/ui/Separator';
import { QUALITY_GRADES } from '@/utils/constants';
import { cn, formatCurrency } from '@/utils/helpers';

const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  qualityGrade: z.string().min(1, 'Grade is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.coerce.number().min(0).optional(),
});

const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  deliveryDate: z.string().min(1, 'Delivery date is required'),
  notes: z.string().optional(),
});

function OrderForm({ products = [], onSubmit, loading = false }) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      items: [{ productId: '', qualityGrade: '', quantity: 1, unitPrice: 0 }],
      deliveryDate: '',
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');

  const total = watchedItems?.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0) || 0;

  const handleProductChange = (index, productId) => {
    setValue(`items.${index}.productId`, productId);
    const product = products.find((p) => p._id === productId || p.id === productId);
    if (product?.basePrice) {
      setValue(`items.${index}.unitPrice`, product.basePrice);
    }
  };

  const onFormSubmit = (data) => {
    onSubmit?.(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Order Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-brand-primary uppercase tracking-wider">Order Items</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ productId: '', qualityGrade: '', quantity: 1, unitPrice: 0 })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>

        <AnimatePresence>
          {fields.map((field, index) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-brand-border/50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    {/* Product */}
                    <div className="md:col-span-4">
                      <Label className="mb-1.5 block">Product</Label>
                      <Select
                        value={watchedItems?.[index]?.productId || ''}
                        onValueChange={(val) => handleProductChange(index, val)}
                      >
                        <SelectTrigger className={cn(errors.items?.[index]?.productId && 'border-brand-error')}>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product._id || product.id} value={product._id || product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.items?.[index]?.productId && (
                        <p className="text-xs text-brand-error mt-1">{errors.items[index].productId.message}</p>
                      )}
                    </div>

                    {/* Quality Grade */}
                    <div className="md:col-span-3">
                      <Label className="mb-1.5 block">Quality Grade</Label>
                      <Select
                        value={watchedItems?.[index]?.qualityGrade || ''}
                        onValueChange={(val) => setValue(`items.${index}.qualityGrade`, val)}
                      >
                        <SelectTrigger className={cn(errors.items?.[index]?.qualityGrade && 'border-brand-error')}>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(QUALITY_GRADES).map((grade) => (
                            <SelectItem key={grade.value} value={grade.value}>
                              {grade.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2">
                      <Label className="mb-1.5 block">Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        className={cn(errors.items?.[index]?.quantity && 'border-brand-error')}
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="md:col-span-2">
                      <Label className="mb-1.5 block">Unit Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                        className="text-right"
                      />
                    </div>

                    {/* Remove */}
                    <div className="md:col-span-1 flex justify-end">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="text-brand-error hover:text-brand-error hover:bg-brand-error/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="flex justify-end mt-3">
                    <span className="text-sm text-brand-secondary">
                      Line total:{' '}
                      <span className="font-semibold text-brand-primary">
                        {formatCurrency((watchedItems?.[index]?.quantity || 0) * (watchedItems?.[index]?.unitPrice || 0))}
                      </span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {errors.items?.root && (
          <p className="text-sm text-brand-error">{errors.items.root.message}</p>
        )}
      </div>

      <Separator />

      {/* Delivery Date & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className="mb-1.5 block">Delivery Date</Label>
          <Input
            type="date"
            {...register('deliveryDate')}
            className={cn(errors.deliveryDate && 'border-brand-error')}
          />
          {errors.deliveryDate && (
            <p className="text-xs text-brand-error mt-1">{errors.deliveryDate.message}</p>
          )}
        </div>
        <div>
          <Label className="mb-1.5 block">Special Instructions</Label>
          <textarea
            {...register('notes')}
            rows={3}
            className="flex w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-primary placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-1 focus:ring-offset-brand-base resize-none"
            placeholder="Any special requirements..."
          />
        </div>
      </div>

      <Separator />

      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-brand-secondary">{fields.length} item(s)</p>
          <p className="text-2xl font-bold text-brand-primary">{formatCurrency(total)}</p>
        </div>
        <Button type="submit" disabled={loading} size="lg">
          <ShoppingCart className="h-5 w-5 mr-2" />
          {loading ? 'Placing Order...' : 'Place Order'}
        </Button>
      </div>
    </form>
  );
}

export { OrderForm };
export default OrderForm;
