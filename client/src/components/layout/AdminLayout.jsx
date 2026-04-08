import React from 'react';
import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { INTERNAL_ROLES } from '@/utils/constants';

function AdminLayout() {
  return (
    <ProtectedRoute allowedRoles={INTERNAL_ROLES}>
      <div className="flex h-screen overflow-hidden bg-brand-base">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export { AdminLayout };
export default AdminLayout;
