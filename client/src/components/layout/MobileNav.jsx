import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Bell, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { cn, getInitials } from '@/utils/helpers';

const pageTitleMap = {
  '/admin': 'Dashboard',
  '/admin/purchasing': 'Purchasing',
  '/admin/operations': 'Operations',
  '/admin/quality': 'Quality Control',
  '/admin/receiving': 'Receiving',
  '/admin/logistics': 'Logistics',
  '/admin/fleet': 'Fleet',
  '/admin/inventory': 'Inventory',
  '/admin/products': 'Products',
  '/admin/users': 'Users',
  '/admin/reports': 'Reports',
  '/admin/waste': 'Waste',
  '/portal': 'Portal',
  '/portal/orders': 'Orders',
  '/portal/account': 'Account',
  '/driver': 'Deliveries',
};

function getPageTitle(pathname) {
  if (pageTitleMap[pathname]) return pageTitleMap[pathname];
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1] || '';
  return last.charAt(0).toUpperCase() + last.slice(1);
}

function MobileNav({ navSections = [], primaryTabs = [] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [drawerOpen]);

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const closeDrawer = () => setDrawerOpen(false);

  const handleLogout = async () => {
    closeDrawer();
    await logout();
    navigate('/login');
  };

  const pageTitle = getPageTitle(location.pathname);

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-brand-surface/95 backdrop-blur-lg border-b border-brand-border">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="p-2 -ml-2 rounded-lg text-brand-secondary hover:text-brand-accent active:bg-brand-elevated transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-semibold text-brand-primary text-base truncate">{pageTitle}</h1>
        <div className="flex items-center gap-1">
          <button
            aria-label="Notifications"
            className="relative p-2 rounded-lg text-brand-secondary hover:text-brand-accent active:bg-brand-elevated transition-colors"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-brand-error" />
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Profile menu"
            className="ml-1 rounded-full ring-1 ring-brand-border hover:ring-brand-accent transition-colors"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-brand-accent/20 text-brand-accent font-semibold">
                {getInitials(user?.name || 'U')}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </header>

      {/* Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeDrawer}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-[85vw] max-w-[320px] bg-brand-surface border-r border-brand-border flex flex-col shadow-2xl"
            >
              {/* Profile header */}
              <div className="flex items-center gap-3 p-4 border-b border-brand-border shrink-0">
                <Avatar className="h-11 w-11">
                  <AvatarFallback className="bg-brand-accent/20 text-brand-accent font-semibold">
                    {getInitials(user?.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-primary truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-brand-muted truncate">{user?.email}</p>
                </div>
                <button
                  onClick={closeDrawer}
                  aria-label="Close menu"
                  className="p-2 rounded-lg text-brand-muted hover:text-brand-primary active:bg-brand-elevated transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 px-3">
                {navSections.map((section) => (
                  <div key={section.title} className="mb-4">
                    <h4 className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
                      {section.title}
                    </h4>
                    <ul className="space-y-0.5">
                      {section.items.map((item) => (
                        <li key={item.path}>
                          <NavLink
                            to={item.path}
                            end={item.end}
                            onClick={closeDrawer}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                isActive
                                  ? 'bg-brand-accent/10 text-brand-accent'
                                  : 'text-brand-secondary hover:text-brand-primary active:bg-brand-elevated'
                              )
                            }
                          >
                            <item.icon className="h-5 w-5 shrink-0" />
                            <span>{item.label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="border-t border-brand-border shrink-0 p-3 space-y-1">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-brand-secondary hover:text-brand-primary active:bg-brand-elevated transition-colors"
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-brand-error hover:bg-brand-error/10 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Tab Bar */}
      {primaryTabs.length > 0 && (
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch bg-brand-surface/95 backdrop-blur-lg border-t border-brand-border"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {primaryTabs.map((tab) => {
            if (tab.action === 'more') {
              return (
                <button
                  key="more"
                  onClick={() => setDrawerOpen(true)}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-brand-muted active:text-brand-accent transition-colors"
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </button>
              );
            }
            return (
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
            );
          })}
        </nav>
      )}
    </>
  );
}

export { MobileNav };
export default MobileNav;
