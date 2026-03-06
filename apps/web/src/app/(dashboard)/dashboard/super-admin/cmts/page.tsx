'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
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

interface CreateCMTForm {
  email: string;
  password: string;
  businessName: string;
  businessAddress: string;
  contactPhone: string;
  licenseNumber: string;
}

export default function SuperAdminCMTsPage() {
  const [cmts, setCmts] = useState<CMT[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<CreateCMTForm>({
    email: '',
    password: '',
    businessName: '',
    businessAddress: '',
    contactPhone: '',
    licenseNumber: '',
  });

  useEffect(() => {
    fetchCMTs();
  }, []);

  const fetchCMTs = async () => {
    try {
      const r = await api.get('/super-admin/cmts');
      setCmts(r.data);
    } catch (err) {
      console.error('Failed to fetch CMTs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCMT = async () => {
    if (!formData.email || !formData.password || !formData.businessName || !formData.businessAddress || !formData.contactPhone) {
      alert('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        businessName: formData.businessName,
        businessAddress: formData.businessAddress,
        contactPhone: formData.contactPhone,
        ...(formData.licenseNumber && { licenseNumber: formData.licenseNumber }),
      };

      await api.post('/super-admin/cmts', payload);
      alert('CMT account created successfully!');

      // Reset form and close modal
      setFormData({
        email: '',
        password: '',
        businessName: '',
        businessAddress: '',
        contactPhone: '',
        licenseNumber: '',
      });
      setShowModal(false);

      // Refresh CMT list
      fetchCMTs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create CMT');
    } finally {
      setCreating(false);
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    SUSPENDED: 'bg-orange-100 text-orange-700',
    ACTIVE: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All CMTs</h1>
          <p className="text-gray-500 text-sm mt-1">Compound Management Teams across the platform</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Add CMT
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Business Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Tier</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-gray-500">Loading...</td></tr>
            ) : cmts.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-gray-500">No CMTs found</td></tr>
            ) : (
              cmts.map((cmt) => (
                <tr key={cmt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{cmt.businessName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{cmt.user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{cmt.subscriptionTier?.name || '—'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[cmt.status] || 'bg-gray-100 text-gray-700'}`}>
                      {cmt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(cmt.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create CMT Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Add New CMT</h2>

            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />

            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />

            <input
              type="text"
              placeholder="Business Name"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />

            <textarea
              placeholder="Business Address"
              value={formData.businessAddress}
              onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg min-h-[80px]"
            />

            <input
              type="tel"
              placeholder="Contact Phone"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />

            <input
              type="text"
              placeholder="License Number (optional)"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />

            <div className="flex gap-2 pt-4">
              <button onClick={handleCreateCMT} disabled={creating} className="flex-1 btn-primary">
                {creating ? 'Creating...' : 'Create CMT'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
