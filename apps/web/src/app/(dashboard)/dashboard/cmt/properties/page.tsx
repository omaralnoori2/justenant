'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  createdAt: string;
  _count?: {
    units: number;
  };
}

export default function CMTPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/cmt/properties');
      setProperties(res.data);
    } catch (err) {
      console.error('Failed to fetch properties', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/cmt/properties', formData);
      setFormData({ name: '', address: '' });
      setShowCreateForm(false);
      fetchProperties();
    } catch (err) {
      console.error('Failed to create property', err);
      alert('Failed to create property');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading properties...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary"
        >
          {showCreateForm ? 'Cancel' : '+ Create Property'}
        </button>
      </div>

      {showCreateForm && (
        <div className="card border-l-4 border-l-brand-blue">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Property</h2>
          <form onSubmit={handleCreateProperty} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="e.g., Riverside Towers"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input-field"
                placeholder="e.g., 123 Main St, Downtown"
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {properties.length === 0 ? (
        <div className="card">
          <p className="text-gray-500">No properties yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <Link key={property.id} href={`/dashboard/cmt/properties/${property.id}`}>
              <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{property.name}</h3>
                <p className="text-sm text-gray-600 mb-4 flex-grow">{property.address}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-xs font-medium text-gray-500">
                    {property._count?.units || 0} units
                  </span>
                  <span className="text-xs font-medium text-brand-blue">View →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
