import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import ClientLayout from '@/components/layout/ClientLayout';
import DriverLayout from '@/components/layout/DriverLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';

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

// Auth pages
const Login = React.lazy(() => import('@/pages/auth/Login'));
const Register = React.lazy(() => import('@/pages/auth/Register'));
const ChangePassword = React.lazy(() => import('@/pages/auth/ChangePassword'));

// Admin pages
const Dashboard = React.lazy(() => import('@/pages/admin/Dashboard'));
const Purchasing = React.lazy(() => import('@/pages/admin/Purchasing'));
const Operations = React.lazy(() => import('@/pages/admin/Operations'));
const QualityControl = React.lazy(() => import('@/pages/admin/QualityControl'));
const Receiving = React.lazy(() => import('@/pages/admin/Receiving'));
const Logistics = React.lazy(() => import('@/pages/admin/Logistics'));
const Fleet = React.lazy(() => import('@/pages/admin/Fleet'));
const Inventory = React.lazy(() => import('@/pages/admin/Inventory'));
const Users = React.lazy(() => import('@/pages/admin/Users'));
const Reports = React.lazy(() => import('@/pages/admin/Reports'));
const Waste = React.lazy(() => import('@/pages/admin/Waste'));

// Client pages
const Portal = React.lazy(() => import('@/pages/client/Portal'));
const Orders = React.lazy(() => import('@/pages/client/Orders'));
const Account = React.lazy(() => import('@/pages/client/Account'));

// Driver pages
const Deliveries = React.lazy(() => import('@/pages/driver/Deliveries'));

// Not Found
const NotFound = React.lazy(() => import('@/pages/NotFound'));

const wrap = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
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
      { path: 'users', element: wrap(Users) },
      { path: 'reports', element: wrap(Reports) },
      { path: 'waste', element: wrap(Waste) },
    ],
  },
  {
    path: '/portal',
    element: <RequirePasswordReset><ClientLayout /></RequirePasswordReset>,
    children: [
      { index: true, element: wrap(Portal) },
      { path: 'orders', element: wrap(Orders) },
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
