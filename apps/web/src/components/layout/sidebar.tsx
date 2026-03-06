'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearTokens, getRole } from '@/lib/auth';
import type { Role } from '@/types';
import { clsx } from 'clsx';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  SUPER_ADMIN: [
    { label: 'Overview', href: '/dashboard/super-admin', icon: '📊' },
    { label: 'Users', href: '/dashboard/super-admin/users', icon: '👥' },
    { label: 'CMTs', href: '/dashboard/super-admin/cmts', icon: '🏢' },
    { label: 'Revenue', href: '/dashboard/super-admin/revenue', icon: '💰' },
  ],
  PORTAL_TEAM: [
    { label: 'Overview', href: '/dashboard/portal-team', icon: '📋' },
    { label: 'Pending CMTs', href: '/dashboard/portal-team/pending', icon: '⏳' },
    { label: 'All CMTs', href: '/dashboard/portal-team/cmts', icon: '🏢' },
    { label: 'Subscriptions', href: '/dashboard/portal-team/subscriptions', icon: '💳' },
  ],
  CMT: [
    { label: 'Dashboard', href: '/dashboard/cmt', icon: '🏠' },
    { label: 'Properties', href: '/dashboard/cmt/properties', icon: '🏗️' },
    { label: 'Tenants', href: '/dashboard/cmt/tenants', icon: '👥' },
    { label: 'Landlords', href: '/dashboard/cmt/landlords', icon: '🔑' },
    { label: 'Service Providers', href: '/dashboard/cmt/service-providers', icon: '🔧' },
    { label: 'Maintenance', href: '/dashboard/cmt/maintenance', icon: '⚙️' },
  ],
  LANDLORD: [
    { label: 'Dashboard', href: '/dashboard/landlord', icon: '🏠' },
    { label: 'Properties', href: '/dashboard/landlord/properties', icon: '🏗️' },
    { label: 'Tenants', href: '/dashboard/landlord/tenants', icon: '👥' },
  ],
  TENANT: [
    { label: 'Dashboard', href: '/dashboard/tenant', icon: '🏠' },
    { label: 'Maintenance', href: '/dashboard/tenant/maintenance', icon: '🔧' },
  ],
  SERVICE_PROVIDER: [
    { label: 'Dashboard', href: '/dashboard/service-provider', icon: '🔧' },
    { label: 'My Tasks', href: '/dashboard/service-provider/tasks', icon: '📋' },
  ],
};

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  PORTAL_TEAM: 'Portal Team',
  CMT: 'CMT',
  LANDLORD: 'Landlord',
  TENANT: 'Tenant',
  SERVICE_PROVIDER: 'Service Provider',
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const role = getRole();
  const navItems = role ? NAV_ITEMS[role] : [];

  function handleLogout() {
    clearTokens();
    router.push('/login');
  }

  return (
    <aside className="w-64 min-h-screen bg-brand-dark text-white flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold">JusTenant</h1>
        {role && (
          <span className="text-xs text-white/60 mt-1 block">{ROLE_LABELS[role]}</span>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white',
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
