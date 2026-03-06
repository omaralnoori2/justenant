'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface Tenant {
  id?: string;
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    leaseStart?: string;
    leaseEnd?: string;
    user?: {
      email: string;
      status: string;
    };
  };
  name: string;
  property: {
    id: string;
    name: string;
    address: string;
  };
}

export default function LandlordTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/landlord/tenants')
      .then((r) => setTenants(r.data))
      .catch(() => setTenants([]))
      .finally(() => setLoading(false));
  }, []);

  const isLeaseExpiring = (leaseEnd?: string) => {
    if (!leaseEnd) return false;
    const endDate = new Date(leaseEnd);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysRemaining <= 30 && daysRemaining > 0;
  };

  const isLeaseExpired = (leaseEnd?: string) => {
    if (!leaseEnd) return false;
    return new Date(leaseEnd) < new Date();
  };

  const getDaysRemaining = (leaseEnd?: string) => {
    if (!leaseEnd) return null;
    const endDate = new Date(leaseEnd);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysRemaining;
  };

  const getLeaseStatus = (tenant: Tenant) => {
    const leaseEnd = tenant.tenant?.leaseEnd;
    if (isLeaseExpired(leaseEnd)) return 'expired';
    if (isLeaseExpiring(leaseEnd)) return 'expiring';
    return 'active';
  };

  const filteredTenants = filterStatus
    ? tenants.filter((t) => getLeaseStatus(t) === filterStatus)
    : tenants;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/landlord" className="text-brand hover:underline text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">My Tenants</h1>
          <p className="text-gray-500 text-sm mt-1">Tenants in your properties</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus(null)}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === null
              ? 'bg-brand text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Tenants
        </button>
        <button
          onClick={() => setFilterStatus('active')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === 'active'
              ? 'bg-brand text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Active Leases
        </button>
        <button
          onClick={() => setFilterStatus('expiring')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === 'expiring'
              ? 'bg-brand text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Expiring Soon
        </button>
        <button
          onClick={() => setFilterStatus('expired')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === 'expired'
              ? 'bg-brand text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Expired
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading tenants...</div>
      ) : filteredTenants.length === 0 ? (
        <div className="card">
          <p className="text-gray-500 text-sm">No tenants found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Property</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Lease Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTenants.map((tenantUnit) => {
                const tenant = tenantUnit.tenant;
                if (!tenant) return null;

                const daysRemaining = getDaysRemaining(tenant.leaseEnd);
                const status = getLeaseStatus(tenantUnit);
                const statusColor =
                  status === 'expired'
                    ? 'bg-red-100 text-red-700'
                    : status === 'expiring'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700';

                return (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {tenant.firstName} {tenant.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tenantUnit.property.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tenantUnit.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                        {status === 'expired'
                          ? 'Expired'
                          : status === 'expiring'
                          ? `Expires in ${daysRemaining}d`
                          : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {tenant.phone ? (
                        <a href={`tel:${tenant.phone}`} className="text-brand hover:underline">
                          {tenant.phone}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => {
                          setSelectedTenant(tenantUnit);
                          setShowDetailsModal(true);
                        }}
                        className="text-brand hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedTenant?.tenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {selectedTenant.tenant.firstName} {selectedTenant.tenant.lastName}
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Property</p>
                <p className="text-gray-900 mt-1">{selectedTenant.property.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Unit</p>
                <p className="text-gray-900 mt-1">{selectedTenant.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <a
                  href={`mailto:${selectedTenant.tenant.user?.email}`}
                  className="text-brand hover:underline mt-1"
                >
                  {selectedTenant.tenant.user?.email}
                </a>
              </div>

              {selectedTenant.tenant.phone && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <a
                    href={`tel:${selectedTenant.tenant.phone}`}
                    className="text-brand hover:underline mt-1"
                  >
                    {selectedTenant.tenant.phone}
                  </a>
                </div>
              )}

              {selectedTenant.tenant.leaseStart && selectedTenant.tenant.leaseEnd && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Lease Period</p>
                  <p className="text-gray-900 mt-1">
                    {new Date(selectedTenant.tenant.leaseStart).toLocaleDateString()} to{' '}
                    {new Date(selectedTenant.tenant.leaseEnd).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(() => {
                      const daysRemaining = getDaysRemaining(selectedTenant.tenant.leaseEnd);
                      if (daysRemaining === null) return '';
                      if (daysRemaining > 0)
                        return `${daysRemaining} days remaining`;
                      return 'Lease expired';
                    })()}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <span
                  className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold ${
                    selectedTenant.tenant.user?.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {selectedTenant.tenant.user?.status}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedTenant(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
