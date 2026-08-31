import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, UserCircle, LogOut, Receipt } from 'lucide-react';
import { ProtectedRoute } from './ProtectedRoute';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { CLIENT_ROLES } from '@/utils/constants';
import { cn, getInitials } from '@/utils/helpers';

const clientNav = [
  { label: 'Portal',    icon: LayoutDashboard, path: '/portal',            end: true },
  { label: 'Orders',    icon: ShoppingBag,     path: '/portal/orders' },
  { label: 'Statement', icon: Receipt,         path: '/portal/statement' },
  { label: 'Account',   icon: UserCircle,      path: '/portal/account' },
];

const clientNavSections = [{ title: 'Menu', items: clientNav }];

// A compact icon rail that matches the reference dashboard's aesthetic:
// fixed narrow width, icon-only, active state = filled accent square,
// avatar + logout pinned to the bottom.
function IconRailItem({ item, isActive }) {
  return (
    <NavLink
      to={item.path}
      end={item.end}
      title={item.label}
      className={({ isActive: active }) =>
        cn(
          'group relative flex items-center justify-center h-11 w-11 rounded-xl transition-all',
          active
            ? 'bg-brand-accent/12 text-brand-accent shadow-[inset_0_0_0_1px_rgba(78,236,211,0.25)]'
            : 'text-brand-muted hover:text-brand-primary hover:bg-brand-elevated'
        )
      }
    >
      {({ isActive: active }) => (
        <>
          {active && (
            <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-brand-accent" />
          )}
          <item.icon className="h-5 w-5" />
          {/* Hover label */}
          <span className="pointer-events-none absolute left-full ml-3 px-2 py-1 rounded-md bg-brand-elevated border border-brand-border text-xs text-brand-primary whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all z-50 shadow-lg">
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  );
}

function ClientLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const businessInitial = (user?.client?.businessName || user?.firstName || 'A')[0].toUpperCase();

  return (
    <ProtectedRoute allowedRoles={CLIENT_ROLES}>
      <div className="flex h-screen overflow-hidden bg-brand-base">
        {/* Icon rail — fixed narrow, matches the reference mockup */}
        <aside className="hidden lg:flex relative flex-col items-center justify-between w-[68px] py-4 h-screen bg-brand-surface/60 border-r border-brand-border/60 z-30 shrink-0">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <NavLink
              to="/portal"
              className="h-10 w-10 rounded-xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center hover:bg-brand-accent/25 transition-colors"
              title="Afood Lebanon"
            >
              <span className="text-brand-accent font-bold text-lg">{businessInitial}</span>
            </NavLink>
            <div className="w-8 h-px bg-brand-border/60" />
          </div>

          {/* Nav icons */}
          <nav className="flex-1 flex flex-col items-center gap-1 mt-6">
            {clientNav.map((item) => (
              <IconRailItem key={item.path} item={item} />
            ))}
          </nav>

          {/* Bottom: avatar + logout */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleLogout}
              title="Log out"
              className="h-9 w-9 rounded-lg text-brand-muted hover:text-brand-error hover:bg-brand-error/10 flex items-center justify-center transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <div className="relative">
              <Avatar className="h-9 w-9 border border-brand-border">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-xs">{getInitials(user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'C')}</AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-brand-success ring-2 ring-brand-surface" title="Online" />
            </div>
          </div>
        </aside>

        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <MobileNav navSections={clientNavSections} primaryTabs={clientNav} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export { ClientLayout };
export default ClientLayout;
