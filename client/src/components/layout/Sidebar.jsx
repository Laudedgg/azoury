import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, Settings2, ShieldCheck, PackageCheck,
  Truck, Bus, Warehouse, Users, BarChart3, Trash2, Package,
  ChevronLeft, ChevronRight, LogOut, Sun, Moon, MoreVertical,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Separator } from '@/components/ui/Separator';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { ROLES } from '@/utils/constants';
import { cn, getInitials } from '@/utils/helpers';

export const navSections = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin', permission: 'dashboard', end: true },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Purchasing', icon: ShoppingCart, path: '/admin/purchasing', permission: 'purchasing' },
      { label: 'Operations', icon: Settings2, path: '/admin/operations', permission: 'operations' },
      { label: 'Quality Control', icon: ShieldCheck, path: '/admin/quality', permission: 'quality' },
      { label: 'Receiving', icon: PackageCheck, path: '/admin/receiving', permission: 'receiving' },
      { label: 'Logistics', icon: Truck, path: '/admin/logistics', permission: 'logistics' },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Products', icon: Package, path: '/admin/products', permission: 'products' },
      { label: 'Inventory', icon: Warehouse, path: '/admin/inventory', permission: 'inventory' },
      { label: 'Fleet', icon: Bus, path: '/admin/fleet', permission: 'fleet' },
      { label: 'Waste', icon: Trash2, path: '/admin/waste', permission: 'waste' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { label: 'Users', icon: Users, path: '/admin/users', permission: 'users' },
      { label: 'Reports', icon: BarChart3, path: '/admin/reports', permission: 'reports' },
    ],
  },
];

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const userRole = user?.role || 'ADMIN';
  const roleConfig = ROLES[userRole];
  const permissions = roleConfig?.permissions || [];
  const hasPermission = (perm) => permissions.includes('*') || permissions.includes(perm);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="hidden lg:flex relative flex-col h-screen bg-brand-surface border-r border-brand-border z-30 shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-brand-border">
        <NavLink to="/admin" className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center">
            <span className="text-brand-base font-bold text-lg">A</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="text-lg font-bold text-brand-primary whitespace-nowrap overflow-hidden"
              >
                Azoury
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-6 px-3">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) => hasPermission(item.permission));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title}>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.h4
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-brand-muted"
                    >
                      {section.title}
                    </motion.h4>
                  )}
                </AnimatePresence>
                <ul className="space-y-1">
                  {visibleItems.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
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
                                layoutId="sidebar-active"
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-brand-accent rounded-r-full"
                                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                              />
                            )}
                            <item.icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-brand-accent' : 'text-brand-muted group-hover:text-brand-accent')} />
                            <AnimatePresence>
                              {!collapsed && (
                                <motion.span
                                  initial={{ opacity: 0, width: 0 }}
                                  animate={{ opacity: 1, width: 'auto' }}
                                  exit={{ opacity: 0, width: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="whitespace-nowrap overflow-hidden"
                                >
                                  {item.label}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Theme Toggle */}
      <div className="px-3 py-3">
        <button
          onClick={toggleTheme}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-brand-secondary hover:text-brand-accent hover:bg-brand-accent/5 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          {isDark ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      <Separator />

      {/* User Section */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-brand-elevated transition-colors',
                collapsed && 'justify-center'
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{getInitials(user?.name || 'User')}</AvatarFallback>
              </Avatar>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex-1 text-left overflow-hidden"
                  >
                    <p className="text-sm font-medium text-brand-primary truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-brand-muted truncate">{roleConfig?.label || userRole}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              {!collapsed && <MoreVertical className="h-4 w-4 text-brand-muted shrink-0" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-brand-primary">{user?.name}</p>
              <p className="text-xs text-brand-muted">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-brand-error focus:text-brand-error">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-brand-border bg-brand-surface flex items-center justify-center text-brand-muted hover:text-brand-accent hover:bg-brand-elevated transition-colors shadow-sm"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </motion.aside>
  );
}

export { Sidebar };
export default Sidebar;
