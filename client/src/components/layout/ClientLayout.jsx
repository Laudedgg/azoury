import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, ShoppingBag, UserCircle, LogOut, ChevronLeft, ChevronRight, Sun, Moon, Receipt } from 'lucide-react';
import { ProtectedRoute } from './ProtectedRoute';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Separator } from '@/components/ui/Separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { CLIENT_ROLES } from '@/utils/constants';
import { cn, getInitials } from '@/utils/helpers';

const clientNav = [
  { label: 'Portal', icon: LayoutDashboard, path: '/portal', end: true },
  { label: 'Orders', icon: ShoppingBag, path: '/portal/orders' },
  { label: 'Statement', icon: Receipt, path: '/portal/statement' },
  { label: 'Account', icon: UserCircle, path: '/portal/account' },
];

const clientNavSections = [{ title: 'Menu', items: clientNav }];

function ClientLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <ProtectedRoute allowedRoles={CLIENT_ROLES}>
      <div className="flex h-screen overflow-hidden bg-brand-base">
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? 72 : 260 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="hidden lg:flex relative flex-col h-screen bg-brand-surface border-r border-brand-border z-30 shrink-0"
        >
          <div className="flex items-center h-16 px-4 border-b border-brand-border">
            <NavLink to="/portal" className="flex items-center gap-3 overflow-hidden">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center">
                <span className="text-brand-base font-bold text-lg">A</span>
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-lg font-bold text-brand-primary whitespace-nowrap overflow-hidden"
                  >
                    Afood Lebanon
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          </div>

          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-1 px-3">
              {clientNav.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative',
                      isActive
                        ? 'bg-brand-accent/10 text-brand-accent'
                        : 'text-brand-secondary hover:text-brand-accent hover:bg-brand-accent/5'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="client-sidebar-active"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-brand-accent rounded-r-full"
                        />
                      )}
                      <item.icon className="h-5 w-5 shrink-0" />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </ScrollArea>

          <Separator />
          <div className="px-3 py-3">
            <button
              onClick={toggleTheme}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-brand-secondary hover:text-brand-accent hover:bg-brand-accent/5 transition-colors',
                collapsed && 'justify-center'
              )}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>
          </div>
          <Separator />

          <div className="p-3">
            <div className={cn('flex items-center gap-3 px-2 py-2', collapsed && 'justify-center')}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{getInitials(user?.name || 'C')}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-brand-primary truncate">{user?.name}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-brand-error hover:bg-brand-error/5 transition-colors mt-1',
                collapsed && 'justify-center'
              )}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Log out</span>}
            </button>
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-brand-border bg-brand-surface flex items-center justify-center text-brand-muted hover:text-brand-accent transition-colors shadow-sm"
          >
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
        </motion.aside>

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
