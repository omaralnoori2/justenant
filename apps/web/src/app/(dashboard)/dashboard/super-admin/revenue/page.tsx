'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  byTier: Array<{ tier: string; revenue: number; cmtCount: number }>;
}

export default function SuperAdminRevenuePage() {
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/super-admin/revenue')
      .then((r) => setRevenue(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!revenue) return <div className="text-red-500">Failed to load revenue data</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Revenue Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Platform revenue overview and breakdown</p>
      </div>

      <div className="card">
        <div className="mb-2">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-4xl font-bold text-brand">${revenue.totalRevenue?.toLocaleString() || '0'}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Revenue by Subscription Tier</h2>
        <div className="space-y-3">
          {revenue.byTier && revenue.byTier.map((item) => (
            <div key={item.tier} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{item.tier}</p>
                <p className="text-xs text-gray-500">{item.cmtCount} active CMTs</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">${item.revenue.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Monthly Trend</h2>
        <div className="space-y-2">
          {revenue.monthlyRevenue && revenue.monthlyRevenue.map((item) => (
            <div key={item.month} className="flex items-center justify-between">
              <p className="text-sm text-gray-600">{item.month}</p>
              <p className="text-sm font-medium text-gray-900">${item.revenue.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
