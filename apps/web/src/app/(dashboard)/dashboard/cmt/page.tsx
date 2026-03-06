'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface DashboardData {
  businessName: string;
  subscriptionTier?: { name: string; maxTenants: number; maxProperties: number };
  stats: {
    tenantCount: number;
    propertyCount: number;
    pendingMaintenance: number;
    activeTenants: number;
  };
}

function StatCard({ label, value, max, color }: { label: string; value: number; max?: number; color: string }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>
        {value.toLocaleString()}
        {max !== undefined && <span className="text-base font-normal text-gray-400"> / {max}</span>}
      </p>
    </div>
  );
}

export default function CmtDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cmt/dashboard')
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!data) return <div className="text-red-500">Failed to load dashboard</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{data.businessName}</h1>
        {data.subscriptionTier && (
          <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            {data.subscriptionTier.name} Plan
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tenants"
          value={data.stats.tenantCount}
          max={data.subscriptionTier?.maxTenants}
          color="text-brand"
        />
        <StatCard
          label="Properties"
          value={data.stats.propertyCount}
          max={data.subscriptionTier?.maxProperties}
          color="text-purple-600"
        />
        <StatCard label="Active Tenants" value={data.stats.activeTenants} color="text-green-600" />
        <StatCard label="Pending Maintenance" value={data.stats.pendingMaintenance} color="text-orange-600" />
      </div>
    </div>
  );
}
