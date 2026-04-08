import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Upload, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Separator } from '@/components/ui/Separator';
import { PRODUCT_CATEGORIES, QUALITY_GRADES } from '@/utils/constants';
import { cn } from '@/utils/helpers';

const gradeSchema = z.object({
  grade: z.string().min(1, 'Grade is required'),
  price: z.coerce.number().min(0, 'Price must be >= 0'),
});

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  grades: z.array(gradeSchema).min(1, 'At least one quality grade is required'),
});

function ProductForm({ defaultValues, onSubmit, loading = false }) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues || {
      name: '',
      description: '',
      category: '',
      unit: 'kg',
      grades: [{ grade: 'A', price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'grades' });
  const watchedCategory = watch('category');

  const onFormSubmit = (data) => {
    onSubmit?.(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-brand-primary uppercase tracking-wider">Product Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block">Product Name</Label>
            <Input
              {...register('name')}
              placeholder="e.g., Whole Chicken"
              className={cn(errors.name && 'border-brand-error')}
            />
            {errors.name && <p className="text-xs text-brand-error mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Label className="mb-1.5 block">Category</Label>
            <Select value={watchedCategory} onValueChange={(val) => setValue('category', val)}>
              <SelectTrigger className={cn(errors.category && 'border-brand-error')}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-brand-error mt-1">{errors.category.message}</p>}
          </div>
        </div>

        <div>
          <Label className="mb-1.5 block">Description</Label>
          <textarea
            {...register('description')}
            rows={3}
            className="flex w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-primary placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-1 focus:ring-offset-brand-base resize-none"
            placeholder="Product description..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block">Unit of Measure</Label>
            <Select value={watch('unit')} onValueChange={(val) => setValue('unit', val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                <SelectItem value="lb">Pounds (lb)</SelectItem>
                <SelectItem value="unit">Unit / Piece</SelectItem>
                <SelectItem value="box">Box</SelectItem>
                <SelectItem value="case">Case</SelectItem>
                <SelectItem value="pallet">Pallet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block">Product Image</Label>
            <div className="flex items-center justify-center w-full h-[42px] rounded-lg border-2 border-dashed border-brand-border bg-brand-surface hover:bg-brand-elevated hover:border-brand-accent/30 transition-colors cursor-pointer">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-brand-muted">
                <Upload className="h-4 w-4" />
                <span>Upload image</span>
                <input type="file" accept="image/*" className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Quality Grades & Pricing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-brand-primary uppercase tracking-wider">Quality Grades & Pricing</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ grade: '', price: 0 })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Grade
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
                    <div className="md:col-span-5">
                      <Label className="mb-1.5 block">Grade</Label>
                      <Select
                        value={watch(`grades.${index}.grade`)}
                        onValueChange={(val) => setValue(`grades.${index}.grade`, val)}
                      >
                        <SelectTrigger className={cn(errors.grades?.[index]?.grade && 'border-brand-error')}>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(QUALITY_GRADES).map((g) => (
                            <SelectItem key={g.value} value={g.value}>
                              {g.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-5">
                      <Label className="mb-1.5 block">Price per Unit</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        {...register(`grades.${index}.price`, { valueAsNumber: true })}
                        className={cn('text-right', errors.grades?.[index]?.price && 'border-brand-error')}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end">
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
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {errors.grades?.root && (
          <p className="text-sm text-brand-error">{errors.grades.root.message}</p>
        )}
      </div>

      <Separator />

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading} size="lg">
          <Save className="h-5 w-5 mr-2" />
          {loading ? 'Saving...' : defaultValues ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}

export { ProductForm };
export default ProductForm;
