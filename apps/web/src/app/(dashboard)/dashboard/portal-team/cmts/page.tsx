'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface CMT {
  id: string;
  businessName: string;
  businessAddress: string;
  contactPhone: string;
  status: string;
  subscriptionTier?: { name: string };
  user: { email: string };
  createdAt: string;
}

export default function PortalTeamCmtsPage() {
  const [cmts, setCmts] = useState<CMT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/portal-team/cmts')
      .then((r) => setCmts(r.data))
      .finally(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    SUSPENDED: 'bg-orange-100 text-orange-700',
    ACTIVE: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All CMTs</h1>
        <p className="text-gray-500 text-sm mt-1">Manage all Compound Management Teams</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Business Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Tier</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-gray-500">Loading...</td></tr>
            ) : cmts.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-4 text-gray-500">No CMTs found</td></tr>
            ) : (
              cmts.map((cmt) => (
                <tr key={cmt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{cmt.businessName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{cmt.user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{cmt.contactPhone}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{cmt.subscriptionTier?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[cmt.status] || 'bg-gray-100 text-gray-700'}`}>
                      {cmt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link href={`/dashboard/portal-team/cmts/${cmt.id}`} className="text-brand hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
