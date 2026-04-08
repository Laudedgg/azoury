import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Truck, User, LogOut } from 'lucide-react';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { DRIVER_ROLES } from '@/utils/constants';
import { cn } from '@/utils/helpers';

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
        {/* Minimal Header */}
        <header className="flex items-center justify-between h-14 px-4 bg-brand-surface border-b border-brand-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-accent flex items-center justify-center">
              <span className="text-brand-base font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-brand-primary">Azoury Driver</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-brand-secondary">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-brand-muted hover:text-brand-error hover:bg-brand-error/5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <nav className="flex items-center justify-around h-16 bg-brand-surface border-t border-brand-border safe-area-bottom">
          <NavLink
            to="/driver"
            end
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors',
                isActive ? 'text-brand-accent' : 'text-brand-muted'
              )
            }
          >
            <Truck className="h-5 w-5" />
            <span className="text-xs font-medium">Deliveries</span>
          </NavLink>
          <NavLink
            to="/driver/profile"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors',
                isActive ? 'text-brand-accent' : 'text-brand-muted'
              )
            }
          >
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">Profile</span>
          </NavLink>
        </nav>
      </div>
    </ProtectedRoute>
  );
}

export { DriverLayout };
export default DriverLayout;
