import React from 'react';
import { Card, CardContent } from './Card';

function SectionCard({ title, subtitle, icon: Icon, actions, children, className = '', bodyClass = '', padded = true }) {
  return (
    <Card className={className}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 p-5 pb-3 border-b border-brand-border/60">
          <div className="flex items-start gap-2.5 min-w-0">
            {Icon && (
              <div className="h-8 w-8 shrink-0 rounded-lg bg-brand-elevated flex items-center justify-center">
                <Icon className="h-4 w-4 text-brand-accent" />
              </div>
            )}
            <div className="min-w-0">
              {title && <p className="text-brand-primary font-semibold text-sm">{title}</p>}
              {subtitle && <p className="text-brand-muted text-xs mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <CardContent className={padded ? `p-5 pt-4 ${bodyClass}` : bodyClass}>
        {children}
      </CardContent>
    </Card>
  );
}

export { SectionCard };
export default SectionCard;
