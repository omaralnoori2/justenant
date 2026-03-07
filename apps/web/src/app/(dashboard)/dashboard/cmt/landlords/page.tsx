'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Landlord {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  status: string;
  createdAt: string;
}

export default function CMTLandlordsPage() {
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cmt/landlords')
      .then((r) => setLandlords(r.data))
      .catch(() => setLandlords([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Landlords</h1>
        <p className="text-gray-500 text-sm mt-1">Manage property owners</p>
      </div>

      <div className="card bg-blue-50 border-l-4 border-l-blue-500">
        <p className="text-sm text-blue-900">
          💡 <strong>Note:</strong> Landlords register themselves through the landlord portal. Once registered, they appear here for approval.
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
            ) : landlords.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-gray-500">No landlords yet</td></tr>
            ) : (
              landlords.map((landlord) => (
                <tr key={landlord.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{landlord.fullName || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{landlord.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{landlord.phoneNumber || '—'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      landlord.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700'
                        : landlord.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {landlord.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(landlord.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
