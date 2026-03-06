'use client';

export const dynamic = 'force-dynamic';

import dynamicImport from 'next/dynamic';

const Sidebar = dynamicImport(() => import('@/components/layout/sidebar'), { ssr: false });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
