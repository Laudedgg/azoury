import React from 'react';
import { motion } from 'framer-motion';

function PageHeader({ title, subtitle, icon: Icon, actions, meta, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="hidden sm:flex h-11 w-11 shrink-0 rounded-xl bg-brand-accent/10 border border-brand-accent/20 items-center justify-center">
            <Icon className="h-5 w-5 text-brand-accent" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-brand-primary tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-brand-secondary text-xs sm:text-sm mt-0.5">{subtitle}</p>
          )}
          {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </motion.div>
  );
}

export { PageHeader };
export default PageHeader;
