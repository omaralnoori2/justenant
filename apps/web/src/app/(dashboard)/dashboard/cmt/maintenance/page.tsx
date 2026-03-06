'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  mediaUrls: string[];
  tenantNotes?: string;
  cmtNotes?: string;
  providerNotes?: string;
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    user?: {
      email: string;
    };
  };
  provider?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface DashboardStats {
  pending: number;
  assigned: number;
  inProgress: number;
  completedThisMonth: number;
}

interface ServiceProvider {
  id: string;
  firstName: string;
  lastName: string;
  serviceType: string;
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export default function CMTMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    pending: 0,
    assigned: 0,
    inProgress: 0,
    completedThisMonth: 0,
  });
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [cmtNotes, setCmtNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/cmt/maintenance').then((r) => setRequests(r.data)),
      api.get('/cmt/maintenance/stats').then((r) => setStats(r.data)),
      api.get('/cmt/service-providers').then((r) => setProviders(r.data)),
    ])
      .catch(() => {
        setRequests([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAssignProvider = async () => {
    if (!selectedRequest || !selectedProviderId) return;

    setUpdating(true);
    try {
      const response = await api.post(`/cmt/maintenance/${selectedRequest.id}/assign`, {
        providerId: selectedProviderId,
      });
      setRequests(requests.map((r) => (r.id === selectedRequest.id ? response.data : r)));
      setSelectedRequest(response.data);
      setShowAssignModal(false);
      setSelectedProviderId('');
    } catch (error) {
      alert('Failed to assign provider');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNotes = async () => {
    if (!selectedRequest || !cmtNotes) return;

    setUpdating(true);
    try {
      const response = await api.patch(`/cmt/maintenance/${selectedRequest.id}`, {
        cmtNotes: cmtNotes,
      });
      setRequests(requests.map((r) => (r.id === selectedRequest.id ? response.data : r)));
      setSelectedRequest(response.data);
      setCmtNotes('');
    } catch (error) {
      alert('Failed to add notes');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-700';
      case 'IN_PROGRESS':
        return 'bg-orange-100 text-orange-700';
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredRequests = filterStatus
    ? requests.filter((r) => r.status === filterStatus)
    : requests;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Track repair and maintenance tasks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Pending" value={stats.pending} color="text-yellow-600" />
        <StatCard label="Assigned" value={stats.assigned} color="text-blue-600" />
        <StatCard label="In Progress" value={stats.inProgress} color="text-orange-600" />
        <StatCard label="Completed (Month)" value={stats.completedThisMonth} color="text-green-600" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus(null)}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === null
              ? 'bg-brand text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Requests
        </button>
        <button
          onClick={() => setFilterStatus('PENDING')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === 'PENDING'
              ? 'bg-brand text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilterStatus('ASSIGNED')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === 'ASSIGNED'
              ? 'bg-brand text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Assigned
        </button>
        <button
          onClick={() => setFilterStatus('IN_PROGRESS')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === 'IN_PROGRESS'
              ? 'bg-brand text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilterStatus('COMPLETED')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === 'COMPLETED'
              ? 'bg-brand text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Completed
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Provider</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Created</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-gray-500">
                  No maintenance requests found
                </td>
              </tr>
            ) : (
              filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {request.tenant ? `${request.tenant.firstName} ${request.tenant.lastName}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{request.title}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {request.provider ? `${request.provider.firstName} ${request.provider.lastName}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {request.status === 'PENDING' && (
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowAssignModal(true);
                        }}
                        className="text-brand hover:underline"
                      >
                        Assign
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetailsModal(true);
                      }}
                      className="text-brand hover:underline"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Assign Service Provider</h2>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Assign a service provider to: <strong>{selectedRequest.title}</strong>
              </p>

              <select
                value={selectedProviderId}
                onChange={(e) => setSelectedProviderId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="">Select a service provider...</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.firstName} {provider.lastName} - {provider.serviceType}
                  </option>
                ))}
              </select>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedRequest(null);
                    setSelectedProviderId('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignProvider}
                  disabled={!selectedProviderId || updating}
                  className="flex-1 px-4 py-2 bg-brand text-white rounded-md hover:opacity-90 disabled:opacity-50"
                >
                  {updating ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 p-6 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedRequest.title}</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-gray-900 mt-1">{selectedRequest.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="text-gray-900 mt-1">{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedRequest.tenant && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Tenant</p>
                  <p className="text-gray-900 mt-1">{selectedRequest.tenant.firstName} {selectedRequest.tenant.lastName}</p>
                  {selectedRequest.tenant.user?.email && (
                    <p className="text-sm text-gray-600">{selectedRequest.tenant.user.email}</p>
                  )}
                </div>
              )}

              {selectedRequest.provider && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Assigned Provider</p>
                  <p className="text-gray-900 mt-1">{selectedRequest.provider.firstName} {selectedRequest.provider.lastName}</p>
                </div>
              )}

              {selectedRequest.tenantNotes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Tenant Notes</p>
                  <p className="text-gray-900 mt-1">{selectedRequest.tenantNotes}</p>
                </div>
              )}

              {selectedRequest.providerNotes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Provider Notes</p>
                  <p className="text-gray-900 mt-1">{selectedRequest.providerNotes}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CMT Notes</label>
                <textarea
                  value={cmtNotes}
                  onChange={(e) => setCmtNotes(e.target.value)}
                  placeholder="Add notes for this request..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedRequest(null);
                    setCmtNotes('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedRequest.status === 'PENDING' && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowAssignModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:opacity-90"
                  >
                    Assign Provider
                  </button>
                )}
                {cmtNotes && (
                  <button
                    onClick={handleAddNotes}
                    disabled={updating}
                    className="flex-1 px-4 py-2 bg-brand text-white rounded-md hover:opacity-90 disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Add Notes'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
