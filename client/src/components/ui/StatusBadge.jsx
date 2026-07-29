import React from 'react';
import { Badge } from './Badge';

// Central mapping — every domain status pill uses the same variant + label.
const STATUS_MAP = {
  // Order statuses
  PENDING:    { variant: 'warning', label: 'Pending' },
  CONFIRMED:  { variant: 'default', label: 'Confirmed' },
  PREPARING:  { variant: 'default', label: 'Preparing' },
  READY:      { variant: 'success', label: 'Ready' },
  DISPATCHED: { variant: 'default', label: 'Dispatched' },
  DELIVERED:  { variant: 'success', label: 'Delivered' },
  CANCELLED:  { variant: 'error',   label: 'Cancelled' },

  // Dispatch statuses
  PLANNING:   { variant: 'warning', label: 'Planning' },
  LOADING:    { variant: 'default', label: 'Loading' },
  IN_TRANSIT: { variant: 'default', label: 'In Transit' },
  COMPLETED:  { variant: 'success', label: 'Completed' },

  // Invoice statuses
  DRAFT:      { variant: 'warning', label: 'Draft' },
  SENT:       { variant: 'default', label: 'Sent' },
  PAID:       { variant: 'success', label: 'Paid' },
  OVERDUE:    { variant: 'error',   label: 'Overdue' },

  // Generic
  APPROVED:   { variant: 'success', label: 'Approved' },
  REJECTED:   { variant: 'error',   label: 'Rejected' },
  ACTIVE:     { variant: 'success', label: 'Active' },
  INACTIVE:   { variant: 'outline', label: 'Inactive' },
  LOW:        { variant: 'error',   label: 'Low' },
  OK:         { variant: 'success', label: 'OK' },
  AVAILABLE:  { variant: 'success', label: 'Available' },
  IN_USE:     { variant: 'warning', label: 'In Use' },
  MAINTENANCE:{ variant: 'warning', label: 'Maintenance' },
};

function StatusBadge({ status, className = '', children }) {
  const key = String(status ?? '').toUpperCase().replace(/\s+/g, '_');
  const cfg = STATUS_MAP[key] || { variant: 'outline', label: children || status || '—' };
  return (
    <Badge variant={cfg.variant} className={`uppercase tracking-wide text-[10px] ${className}`}>
      {children || cfg.label}
    </Badge>
  );
}

export { StatusBadge, STATUS_MAP };
export default StatusBadge;
