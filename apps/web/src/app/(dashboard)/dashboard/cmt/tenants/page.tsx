'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Tenant {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  status: string;
  createdAt: string;
}

export default function CMTTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cmt/tenants')
      .then((r) => setTenants(r.data))
      .catch(() => setTenants([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-500 text-sm mt-1">Manage tenants in your properties</p>
        </div>
      </div>

      <div className="card bg-blue-50 border-l-4 border-l-blue-500">
        <p className="text-sm text-blue-900">
          💡 <strong>Note:</strong> Tenants register themselves through the tenant portal. Once registered, they appear here for approval.
        </p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-gray-500">Loading...</td></tr>
            ) : tenants.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-gray-500">No tenants yet</td></tr>
            ) : (
              tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{tenant.fullName || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{tenant.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{tenant.phoneNumber || '—'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      tenant.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700'
                        : tenant.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
