'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface ServiceProvider {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  serviceType?: string;
  status: string;
  createdAt: string;
}

export default function CMTServiceProvidersPage() {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: '', firstName: '', lastName: '', phone: '', password: '', serviceType: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const r = await api.get('/cmt/service-providers');
      setProviders(r.data);
    } catch (err) {
      console.error('Failed to fetch providers', err);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/cmt/service-providers', formData);
      alert('Service provider created successfully!');
      setFormData({ email: '', firstName: '', lastName: '', phone: '', password: '', serviceType: '' });
      setShowForm(false);
      fetchProviders();
    } catch (err) {
      console.error('Failed to create provider', err);
      alert('Failed to create service provider');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Providers</h1>
          <p className="text-gray-500 text-sm mt-1">Manage maintenance and repair contractors</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : '+ Add Provider'}
        </button>
      </div>

      {showForm && (
        <div className="card border-l-4 border-l-blue-500">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Service Provider</h2>
          <form onSubmit={handleAddProvider} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type (optional)</label>
                <input type="text" value={formData.serviceType} onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })} className="input-field" placeholder="e.g., Plumbing, Electrical" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Creating...' : 'Create Provider'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Service Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-gray-500">Loading...</td></tr>
            ) : providers.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-4 text-gray-500">No service providers yet</td></tr>
            ) : (
              providers.map((provider) => (
                <tr key={provider.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{provider.firstName} {provider.lastName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{provider.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{provider.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{provider.serviceType || '—'}</td>
                  <td className="px-6 py-4 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${provider.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{provider.status}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(provider.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
