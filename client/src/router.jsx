import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import ClientLayout from '@/components/layout/ClientLayout';
import DriverLayout from '@/components/layout/DriverLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';

// Stale-deploy recovery: when a user's tab has been open across a new deploy,
// the SPA still points at the OLD chunk hashes. Any lazy-loaded route then
// tries to fetch e.g. /assets/Products-DqKlhZf4.js which no longer exists →
// 'Failed to fetch dynamically imported module'. We catch that specific error
// and hard-reload once so the browser refetches index.html + new hashes.
const STALE_CHUNK_MESSAGES = [
  'Failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'Importing a module script failed',
  "Unable to preload CSS for", // Vite's preload-CSS failure has same root cause
];
const RELOAD_KEY = 'afood_reload_after_stale_chunk_v1';

function isStaleChunkError(err) {
  const msg = String(err?.message || err || '');
  return STALE_CHUNK_MESSAGES.some((m) => msg.includes(m));
}

// Wrap each import() so a stale-chunk 404 triggers ONE reload (no loop).
function lazyRoute(importFn) {
  return React.lazy(() =>
    importFn().catch((err) => {
      if (!isStaleChunkError(err)) throw err;
      try {
        if (sessionStorage.getItem(RELOAD_KEY)) {
          // Already reloaded once this session — genuine failure, don't loop
          throw err;
        }
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
      } catch { /* private mode: fall through and reload anyway */ }
      // Give the user a heartbeat then reload
      window.location.reload();
      // Return a stub so React doesn't blow up while the page tears down
      return { default: () => null };
    })
  );
}

// Once a fresh nav succeeds, clear the reload flag so future stale deploys
// can retry.
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // A tiny delay so we know the app really mounted before clearing
    setTimeout(() => { try { sessionStorage.removeItem(RELOAD_KEY); } catch {} }, 4000);
  });
}

function RequirePasswordReset({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return children;
}

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-brand-base">
    <div className="space-y-4 w-full max-w-2xl p-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid grid-cols-3 gap-4 mt-8">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64 mt-4" />
    </div>
  </div>
);

// Marketing / public
const Landing = lazyRoute(() => import('@/pages/Landing'));

// Auth pages
const Login = lazyRoute(() => import('@/pages/auth/Login'));
const Register = lazyRoute(() => import('@/pages/auth/Register'));
const ChangePassword = lazyRoute(() => import('@/pages/auth/ChangePassword'));

// Admin pages
const Dashboard = lazyRoute(() => import('@/pages/admin/Dashboard'));
const Purchasing = lazyRoute(() => import('@/pages/admin/Purchasing'));
const Operations = lazyRoute(() => import('@/pages/admin/Operations'));
const QualityControl = lazyRoute(() => import('@/pages/admin/QualityControl'));
const Receiving = lazyRoute(() => import('@/pages/admin/Receiving'));
const Logistics = lazyRoute(() => import('@/pages/admin/Logistics'));
const Fleet = lazyRoute(() => import('@/pages/admin/Fleet'));
const Inventory = lazyRoute(() => import('@/pages/admin/Inventory'));
const Products = lazyRoute(() => import('@/pages/admin/Products'));
const Users = lazyRoute(() => import('@/pages/admin/Users'));
const Reports = lazyRoute(() => import('@/pages/admin/Reports'));
const Billing = lazyRoute(() => import('@/pages/admin/Billing'));
const Waste = lazyRoute(() => import('@/pages/admin/Waste'));
const Pricing = lazyRoute(() => import('@/pages/admin/Pricing'));
const InventoryCounts = lazyRoute(() => import('@/pages/admin/InventoryCounts'));
const Suppliers = lazyRoute(() => import('@/pages/admin/Suppliers'));

// Client pages
const Portal = lazyRoute(() => import('@/pages/client/Portal'));
const Orders = lazyRoute(() => import('@/pages/client/Orders'));
const Account = lazyRoute(() => import('@/pages/client/Account'));
const Statement = lazyRoute(() => import('@/pages/client/Statement'));

// Driver pages
const Deliveries = lazyRoute(() => import('@/pages/driver/Deliveries'));

// Not Found
const NotFound = lazyRoute(() => import('@/pages/NotFound'));

const wrap = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: wrap(Landing),
  },
  {
    path: '/login',
    element: wrap(Login),
  },
  {
    path: '/register',
    element: wrap(Register),
  },
  {
    path: '/change-password',
    element: wrap(ChangePassword),
  },
  {
    path: '/admin',
    element: <RequirePasswordReset><AdminLayout /></RequirePasswordReset>,
    children: [
      { index: true, element: wrap(Dashboard) },
      { path: 'purchasing', element: wrap(Purchasing) },
      { path: 'operations', element: wrap(Operations) },
      { path: 'quality', element: wrap(QualityControl) },
      { path: 'receiving', element: wrap(Receiving) },
      { path: 'logistics', element: wrap(Logistics) },
      { path: 'fleet', element: wrap(Fleet) },
      { path: 'inventory', element: wrap(Inventory) },
      { path: 'products', element: wrap(Products) },
      { path: 'users', element: wrap(Users) },
      { path: 'reports', element: wrap(Reports) },
      { path: 'billing', element: wrap(Billing) },
      { path: 'waste', element: wrap(Waste) },
      { path: 'pricing', element: wrap(Pricing) },
      { path: 'inventory-counts', element: wrap(InventoryCounts) },
      { path: 'suppliers', element: wrap(Suppliers) },
    ],
  },
  {
    path: '/portal',
    element: <RequirePasswordReset><ClientLayout /></RequirePasswordReset>,
    children: [
      { index: true, element: wrap(Portal) },
      { path: 'orders', element: wrap(Orders) },
      { path: 'statement', element: wrap(Statement) },
      { path: 'account', element: wrap(Account) },
    ],
  },
  {
    path: '/driver',
    element: <RequirePasswordReset><DriverLayout /></RequirePasswordReset>,
    children: [
      { index: true, element: wrap(Deliveries) },
    ],
  },
  {
    path: '*',
    element: wrap(NotFound),
  },
]);

export default router;
