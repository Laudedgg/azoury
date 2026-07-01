import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Truck, User, LogOut, Bell } from 'lucide-react';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { DRIVER_ROLES } from '@/utils/constants';
import { cn } from '@/utils/helpers';

const driverTabs = [
  { label: 'Deliveries', icon: Truck, path: '/driver', end: true },
  { label: 'Profile', icon: User, path: '/driver/profile' },
];

function DriverLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <ProtectedRoute allowedRoles={DRIVER_ROLES}>
      <div className="flex flex-col h-screen bg-brand-base">
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-brand-surface/95 backdrop-blur-lg border-b border-brand-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-accent flex items-center justify-center">
              <span className="text-brand-base font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-brand-primary">Afood Driver</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              aria-label="Notifications"
              className="relative p-2 rounded-lg text-brand-secondary hover:text-brand-accent active:bg-brand-elevated transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-brand-error" />
            </button>
            <button
              onClick={handleLogout}
              aria-label="Log out"
              className="p-2 rounded-lg text-brand-muted hover:text-brand-error hover:bg-brand-error/5 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-20">
          <Outlet />
        </main>

        <nav
          className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch bg-brand-surface/95 backdrop-blur-lg border-t border-brand-border"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {driverTabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors',
                  isActive ? 'text-brand-accent' : 'text-brand-muted'
                )
              }
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </ProtectedRoute>
  );
}

export { DriverLayout };
export default DriverLayout;
