'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface CmtSummary {
  id: string;
  businessName: string;
  contactPhone: string;
  status: string;
  createdAt: string;
  user: { email: string };
}

export default function PortalTeamPage() {
  const [pending, setPending] = useState<CmtSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/portal-team/cmts/pending')
      .then((r) => setPending(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Portal Team Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage CMT registrations and subscriptions</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Pending CMT Registrations</h2>
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {pending.length} pending
          </span>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : pending.length === 0 ? (
          <p className="text-gray-500 text-sm">No pending registrations.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((cmt) => (
              <div key={cmt.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{cmt.businessName}</p>
                  <p className="text-sm text-gray-500">{cmt.user.email} · {cmt.contactPhone}</p>
                  <p className="text-xs text-gray-400">
                    Registered {new Date(cmt.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/dashboard/portal-team/cmts/${cmt.id}`}
                  className="btn-primary text-sm py-1.5 px-3"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
