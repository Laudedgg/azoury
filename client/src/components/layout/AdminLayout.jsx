import React from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Settings2, Warehouse, Users, MoreHorizontal } from 'lucide-react';
import { ProtectedRoute } from './ProtectedRoute';
import { Sidebar, navSections } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { useAuth } from '@/context/AuthContext';
import { INTERNAL_ROLES, ROLES } from '@/utils/constants';

function AdminLayout() {
  const { user } = useAuth();
  const permissions = ROLES[user?.role]?.permissions || [];
  const hasPermission = (perm) => permissions.includes('*') || permissions.includes(perm);

  const filteredSections = navSections
    .map((s) => ({ ...s, items: s.items.filter((i) => hasPermission(i.permission)) }))
    .filter((s) => s.items.length > 0);

  const primaryTabs = [
    { label: 'Home', icon: LayoutDashboard, path: '/admin', end: true },
    { label: 'Operations', icon: Settings2, path: '/admin/operations' },
    { label: 'Inventory', icon: Warehouse, path: '/admin/inventory' },
    { label: 'Users', icon: Users, path: '/admin/users' },
    { label: 'More', icon: MoreHorizontal, action: 'more' },
  ].filter((t) => t.action === 'more' || hasPermission(
    t.path === '/admin' ? 'dashboard' :
    t.path === '/admin/operations' ? 'operations' :
    t.path === '/admin/inventory' ? 'inventory' :
    t.path === '/admin/users' ? 'users' : null
  ));

  return (
    <ProtectedRoute allowedRoles={INTERNAL_ROLES}>
      <div className="flex h-screen overflow-hidden bg-brand-base">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <MobileNav navSections={filteredSections} primaryTabs={primaryTabs} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export { AdminLayout };
export default AdminLayout;
