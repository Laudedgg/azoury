import React from 'react';
import { cn } from '@/utils/helpers';

function Field({ label, required, hint, error, className = '', children }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-brand-secondary text-xs font-medium">
          {label}
          {required && <span className="text-brand-accent ml-0.5">*</span>}
        </label>
      )}
      {children}
      {(hint || error) && (
        <p className={cn('text-[11px]', error ? 'text-brand-error' : 'text-brand-muted')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export { Field };
export default Field;
