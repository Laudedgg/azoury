import React from 'react';
import { Card, CardContent } from './Card';

function EmptyState({ icon: Icon, title, description, action, className = '', dense = false }) {
  return (
    <Card className={`border-dashed ${className}`}>
      <CardContent className={dense ? 'p-6 text-center' : 'p-8 sm:p-12 text-center'}>
        {Icon && (
          <div className={`mx-auto ${dense ? 'w-10 h-10' : 'w-14 h-14'} rounded-2xl bg-brand-elevated flex items-center justify-center mb-3`}>
            <Icon className={`${dense ? 'w-5 h-5' : 'w-6 h-6'} text-brand-muted`} />
          </div>
        )}
        <p className="text-brand-primary font-semibold">{title}</p>
        {description && (
          <p className="text-brand-muted text-sm mt-1 max-w-md mx-auto">{description}</p>
        )}
        {action && <div className="mt-4 flex justify-center">{action}</div>}
      </CardContent>
    </Card>
  );
}

export { EmptyState };
export default EmptyState;
