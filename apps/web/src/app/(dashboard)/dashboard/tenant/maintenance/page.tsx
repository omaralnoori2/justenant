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
  provider?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function TenantMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mediaUrls: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [tenantNotes, setTenantNotes] = useState('');

  useEffect(() => {
    api.get('/maintenance/requests')
      .then((r) => setRequests(r.data))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmitRequest = async () => {
    if (!formData.title || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/maintenance/requests', {
        title: formData.title,
        description: formData.description,
        mediaUrls: formData.mediaUrls,
      });
      setRequests([response.data, ...requests]);
      setFormData({ title: '', description: '', mediaUrls: [] });
      setShowSubmitModal(false);
    } catch (error) {
      alert('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddNotes = async () => {
    if (!selectedRequest || !tenantNotes) return;

    try {
      const response = await api.patch(
        `/maintenance/requests/${selectedRequest.id}/notes`,
        { notes: tenantNotes },
      );
      setRequests(requests.map((r) => (r.id === selectedRequest.id ? response.data : r)));
      setSelectedRequest(response.data);
      setTenantNotes('');
    } catch (error) {
      alert('Failed to add notes');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Submit and track your maintenance requests</p>
        </div>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="btn-primary"
        >
          + Submit Request
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Created</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Provider</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-gray-500">
                  No maintenance requests yet
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{request.title}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {request.provider ? `${request.provider.firstName} ${request.provider.lastName}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetailsModal(true);
                      }}
                      className="text-brand hover:underline"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Submit Request Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Submit Maintenance Request</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Broken window"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the maintenance issue..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSubmitModal(false);
                    setFormData({ title: '', description: '', mediaUrls: [] });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-brand text-white rounded-md hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
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

              {selectedRequest.provider && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Assigned Provider</p>
                  <p className="text-gray-900 mt-1">{selectedRequest.provider.firstName} {selectedRequest.provider.lastName}</p>
                </div>
              )}

              {selectedRequest.cmtNotes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">CMT Notes</p>
                  <p className="text-gray-900 mt-1">{selectedRequest.cmtNotes}</p>
                </div>
              )}

              {selectedRequest.providerNotes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Provider Notes</p>
                  <p className="text-gray-900 mt-1">{selectedRequest.providerNotes}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Add Notes</label>
                <textarea
                  value={tenantNotes}
                  onChange={(e) => setTenantNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedRequest(null);
                    setTenantNotes('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                {tenantNotes && (
                  <button
                    onClick={handleAddNotes}
                    className="flex-1 px-4 py-2 bg-brand text-white rounded-md hover:opacity-90"
                  >
                    Add Notes
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
