'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Stats {
  totalUsers: number;
  totalCmts: number;
  totalTenants: number;
  totalProperties: number;
  totalUnits: number;
  cmtsByStatus: Record<string, number>;
  usersByRole: Record<string, number>;
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value.toLocaleString()}</p>
    </div>
  );
}

export default function SuperAdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/super-admin/stats')
      .then((r) => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!stats) return <div className="text-red-500">Failed to load stats</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform-wide overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.totalUsers} color="text-brand" />
        <StatCard label="Total CMTs" value={stats.totalCmts} color="text-purple-600" />
        <StatCard label="Total Tenants" value={stats.totalTenants} color="text-green-600" />
        <StatCard label="Total Properties" value={stats.totalProperties} color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">CMTs by Status</h3>
          <div className="space-y-2">
            {Object.entries(stats.cmtsByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{status}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Users by Role</h3>
          <div className="space-y-2">
            {Object.entries(stats.usersByRole).map(([role, count]) => (
              <div key={role} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{role.replace('_', ' ')}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
