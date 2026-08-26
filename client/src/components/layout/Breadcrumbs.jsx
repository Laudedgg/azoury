import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const labelMap = {
  admin: 'Admin',
  portal: 'Portal',
  driver: 'Driver',
  purchasing: 'Purchasing',
  operations: 'Operations',
  quality: 'Quality Control',
  receiving: 'Receiving',
  logistics: 'Logistics',
  fleet: 'Fleet',
  inventory: 'Inventory',
  users: 'Users',
  reports: 'Reports',
  waste: 'Waste',
  orders: 'Orders',
  account: 'Account',
  deliveries: 'Deliveries',
  pricing: 'Pricing',
  'inventory-counts': 'Stock Counts',
  suppliers: 'Supply Chain',
};

function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0) return null;

  const crumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === pathSegments.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      <Link to="/" className="text-brand-muted hover:text-brand-accent transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      {crumbs.map((crumb) => (
        <React.Fragment key={crumb.path}>
          <ChevronRight className="h-3.5 w-3.5 text-brand-muted" />
          {crumb.isLast ? (
            <span className="text-brand-accent font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="text-brand-muted hover:text-brand-primary transition-colors">
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export { Breadcrumbs };
export default Breadcrumbs;
