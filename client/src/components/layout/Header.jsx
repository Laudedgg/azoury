import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import Breadcrumbs from './Breadcrumbs';
import { getInitials } from '@/utils/helpers';
import { ROLES } from '@/utils/constants';

function Header() {
  const { user, logout } = useAuth();
  const roleLabel = ROLES[user?.role]?.label || user?.role;

  return (
    <header className="hidden lg:flex sticky top-0 z-20 items-center gap-4 h-16 px-6 bg-brand-base/80 backdrop-blur-md border-b border-brand-border">
      <div className="flex-1 min-w-0">
        <Breadcrumbs />
      </div>

      {/* Search */}
      <div className="hidden xl:flex items-center gap-2 h-9 w-64 rounded-lg border border-brand-border bg-brand-surface/60 px-3 text-brand-muted text-sm hover:border-brand-accent/30 transition-colors">
        <Search className="h-4 w-4" />
        <span className="flex-1">Search…</span>
        <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-brand-elevated border border-brand-border text-brand-secondary">⌘K</kbd>
      </div>

      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5 text-brand-secondary" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-error ring-2 ring-brand-base" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2.5 h-9 pl-1 pr-3 rounded-full border border-transparent hover:border-brand-border hover:bg-brand-surface/60 transition-colors">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="text-[11px]">{getInitials(user?.name || 'U')}</AvatarFallback>
            </Avatar>
            <div className="hidden xl:block text-left leading-tight">
              <p className="text-xs font-semibold text-brand-primary max-w-[120px] truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-brand-muted uppercase tracking-wider">{roleLabel}</p>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium text-brand-primary">{user?.name}</p>
            <p className="text-xs text-brand-muted">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-brand-error focus:text-brand-error">
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export { Header };
export default Header;
