'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Unit {
  id: string;
  name: string;
  floor?: number;
  unitNumber?: number;
  isOccupied: boolean;
}

interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  units: Unit[];
}

interface GeneratingState {
  [key: string]: boolean;
}

export default function CMTPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState<GeneratingState>({});
  const [formValues, setFormValues] = useState<{ [key: string]: { towers: number; floors: number; unitsPerFloor: number } }>({});

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/cmt/properties');
      setProperties(res.data);
      const initialValues: typeof formValues = {};
      res.data.forEach((prop: Property) => {
        initialValues[prop.id] = { towers: 10, floors: 30, unitsPerFloor: 9 };
      });
      setFormValues(initialValues);
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

  const handleGenerateUnits = async (propertyId: string, e: React.FormEvent) => {
    e.preventDefault();
    setGenerating({ ...generating, [propertyId]: true });
    try {
      const values = formValues[propertyId];
      const res = await api.post(`/cmt/properties/${propertyId}/generate-units`, {
        mode: 'tower',
        towers: values.towers,
        floors: values.floors,
        unitsPerFloor: values.unitsPerFloor,
      });
      alert(`Generated ${res.data.generated} units!`);
      fetchProperties();
    } catch (err) {
      console.error('Failed to generate units', err);
      alert('Failed to generate units');
    } finally {
      setGenerating({ ...generating, [propertyId]: false });
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
        <div className="space-y-6">
          {properties.map((property) => {
            const values = formValues[property.id] || { towers: 10, floors: 30, unitsPerFloor: 9 };
            const totalUnitsToGenerate = values.towers * values.floors * values.unitsPerFloor;

            return (
              <div key={property.id} className="card">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{property.name}</h2>
                  <p className="text-gray-600 text-sm mt-1">{property.address}</p>
                </div>

                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Generate Units</h3>
                  <form onSubmit={(e) => handleGenerateUnits(property.id, e)} className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Towers (X)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={values.towers}
                          onChange={(e) =>
                            setFormValues({
                              ...formValues,
                              [property.id]: { ...values, towers: parseInt(e.target.value) || 1 },
                            })
                          }
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Floors per Tower (Y)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={values.floors}
                          onChange={(e) =>
                            setFormValues({
                              ...formValues,
                              [property.id]: { ...values, floors: parseInt(e.target.value) || 1 },
                            })
                          }
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Units per Floor (Z)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={values.unitsPerFloor}
                          onChange={(e) =>
                            setFormValues({
                              ...formValues,
                              [property.id]: { ...values, unitsPerFloor: parseInt(e.target.value) || 1 },
                            })
                          }
                          className="input-field"
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <strong>Total units to generate:</strong> {totalUnitsToGenerate.toLocaleString()}
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={generating[property.id]}
                      className="btn-primary w-full"
                    >
                      {generating[property.id] ? 'Generating...' : 'Generate Units'}
                    </button>
                  </form>
                </div>

                {property.units && property.units.length > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Units ({property.units.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Unit Name</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Floor</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Unit #</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {property.units.map((unit) => (
                            <tr key={unit.id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="px-4 py-2">{unit.name}</td>
                              <td className="px-4 py-2">{unit.floor || '-'}</td>
                              <td className="px-4 py-2">{unit.unitNumber || '-'}</td>
                              <td className="px-4 py-2">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  unit.isOccupied
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {unit.isOccupied ? 'Occupied' : 'Vacant'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
