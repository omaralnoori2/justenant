'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import type { SubscriptionTier } from '@/types';

interface CmtDetail {
  id: string;
  businessName: string;
  businessAddress: string;
  contactPhone: string;
  licenseNumber?: string;
  status: string;
  user: { email: string; createdAt: string };
  subscriptionTier?: SubscriptionTier;
}

export default function CmtDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [cmt, setCmt] = useState<CmtDetail | null>(null);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [selectedTier, setSelectedTier] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/portal-team/cmts?status=PENDING`),
      api.get('/portal-team/subscription-tiers'),
    ]).then(([cmtsRes, tiersRes]) => {
      const found = cmtsRes.data.find((c: CmtDetail) => c.id === id);
      setCmt(found || null);
      setTiers(tiersRes.data);
      if (tiersRes.data.length > 0) setSelectedTier(tiersRes.data[0].id);
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleApprove() {
    if (!selectedTier) return;
    setActing(true);
    try {
      await api.post(`/portal-team/cmts/${id}/approve`, { tierId: selectedTier });
      router.push('/dashboard/portal-team');
    } finally {
      setActing(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    setActing(true);
    try {
      await api.post(`/portal-team/cmts/${id}/reject`, { reason: rejectReason });
      router.push('/dashboard/portal-team');
    } finally {
      setActing(false);
    }
  }

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!cmt) return <div className="text-red-500">CMT not found</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review CMT Registration</h1>
        <p className="text-gray-500 text-sm mt-1">Approve or reject the registration request below</p>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-900">Business Information</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Business Name</span>
            <p className="font-medium">{cmt.businessName}</p>
          </div>
          <div>
            <span className="text-gray-500">Contact Phone</span>
            <p className="font-medium">{cmt.contactPhone}</p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Address</span>
            <p className="font-medium">{cmt.businessAddress}</p>
          </div>
          {cmt.licenseNumber && (
            <div>
              <span className="text-gray-500">License Number</span>
              <p className="font-medium">{cmt.licenseNumber}</p>
            </div>
          )}
          <div>
            <span className="text-gray-500">Email</span>
            <p className="font-medium">{cmt.user.email}</p>
          </div>
          <div>
            <span className="text-gray-500">Registered</span>
            <p className="font-medium">{new Date(cmt.user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 text-green-700">Approve</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assign Subscription Tier</label>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="input-field"
          >
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — up to {t.maxTenants} tenants, {t.maxProperties} properties (${t.pricePerMonth}/mo)
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleApprove} disabled={acting} className="btn-primary">
          Approve Registration
        </button>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-red-700">Reject</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="input-field min-h-[80px] resize-none"
            placeholder="Explain why the registration is being rejected..."
          />
        </div>
        <button
          onClick={handleReject}
          disabled={acting || rejectReason.trim().length < 10}
          className="border border-red-300 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
        >
          Reject Registration
        </button>
      </div>
    </div>
  );
}
