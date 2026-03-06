'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface SubscriptionTier {
  id: string;
  name: string;
  maxTenants: number;
  maxProperties: number;
  pricePerMonth: number;
}

export default function SubscriptionsPage() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/portal-team/subscription-tiers')
      .then((r) => setTiers(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription Tiers</h1>
        <p className="text-gray-500 text-sm mt-1">Manage available subscription plans</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : tiers.length === 0 ? (
          <p className="text-gray-500">No tiers found</p>
        ) : (
          tiers.map((tier) => (
            <div key={tier.id} className="card border-2 border-gray-200 relative">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Per month</p>
              </div>

              <div className="mb-6">
                <p className="text-3xl font-bold text-brand">${tier.pricePerMonth}</p>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-sm text-gray-700">Up to <strong>{tier.maxTenants}</strong> tenants</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-sm text-gray-700">Up to <strong>{tier.maxProperties}</strong> properties</span>
                </li>
              </ul>

              <button className="w-full px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                View CMTs
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
