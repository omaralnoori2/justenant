'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Property {
  id: string;
  name: string;
  address: string;
  landlord?: { name: string };
}

interface Unit {
  id: string;
  name: string;
  floor?: number;
}

export default function CMTPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitName, setEditingUnitName] = useState('');

  // Form states
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [generatorConfig, setGeneratorConfig] = useState({
    mode: 'tower',
    towers: 10,
    floors: 30,
    unitsPerFloor: 9,
  });

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

  const handleCreateProperty = async () => {
    if (!formData.name || !formData.address) {
      alert('Please fill in all fields');
      return;
    }
    try {
      await api.post('/cmt/properties', formData);
      setFormData({ name: '', address: '' });
      setShowCreateModal(false);
      fetchProperties();
    } catch (err) {
      alert('Failed to create property');
    }
  };

  const handleGenerateUnits = async () => {
    if (!selectedPropertyId) return;
    try {
      const response = await api.post(`/cmt/properties/${selectedPropertyId}/generate-units`, generatorConfig);
      alert(`Generated ${response.data.count} units!`);
      setShowGeneratorModal(false);
      fetchProperties();
    } catch (err) {
      alert('Failed to generate units');
    }
  };

  const fetchUnits = async (propertyId: string) => {
    try {
      const res = await api.get(`/cmt/properties/${propertyId}/units`);
      setUnits(res.data);
      setShowUnitsModal(true);
    } catch (err) {
      console.error('Failed to fetch units', err);
    }
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnitId(unit.id);
    setEditingUnitName(unit.name);
  };

  const handleSaveUnitName = async (unitId: string) => {
    if (!editingUnitName.trim()) {
      alert('Unit name cannot be empty');
      return;
    }
    try {
      await api.patch(`/cmt/properties/${selectedPropertyId}/units/${unitId}`, { name: editingUnitName });
      setUnits(units.map(u => u.id === unitId ? { ...u, name: editingUnitName } : u));
      setEditingUnitId(null);
    } catch (err) {
      alert('Failed to update unit name');
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-500 text-sm mt-1">Manage residential properties and units</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          + Add Property
        </button>
      </div>

      {/* Properties List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-gray-500">Loading properties...</p>
        ) : properties.length === 0 ? (
          <p className="text-gray-500 col-span-2">No properties yet. Create one to get started.</p>
        ) : (
          properties.map((property) => (
            <div key={property.id} className="card">
              <h3 className="font-semibold text-gray-900">{property.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{property.address}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedPropertyId(property.id);
                    setShowGeneratorModal(true);
                  }}
                  className="text-sm px-3 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                >
                  Generate Units
                </button>
                <button
                  onClick={async () => {
                    setSelectedPropertyId(property.id);
                    await fetchUnits(property.id);
                  }}
                  className="text-sm px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  View Units
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Property Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Add New Property</h2>
            <input
              type="text"
              placeholder="Property name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <textarea
              placeholder="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg min-h-[80px]"
            />
            <div className="flex gap-2">
              <button onClick={handleCreateProperty} className="flex-1 btn-primary">
                Create
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Unit Generator Modal */}
      {showGeneratorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Generate Units</h2>
            <p className="text-sm text-gray-500">Tower Mode: Flat [floor][unit] Tower [Letter]</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Towers (X)</label>
              <input
                type="number"
                min="1"
                max="26"
                value={generatorConfig.towers}
                onChange={(e) => setGeneratorConfig({ ...generatorConfig, towers: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Example: 10 towers = A to J</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Floors per Tower (Y)</label>
              <input
                type="number"
                min="1"
                value={generatorConfig.floors}
                onChange={(e) => setGeneratorConfig({ ...generatorConfig, floors: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Units per Floor (Z)</label>
              <input
                type="number"
                min="1"
                max="9"
                value={generatorConfig.unitsPerFloor}
                onChange={(e) => setGeneratorConfig({ ...generatorConfig, unitsPerFloor: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
              Will generate <strong>{generatorConfig.towers * generatorConfig.floors * generatorConfig.unitsPerFloor}</strong> units
            </p>

            <div className="flex gap-2">
              <button onClick={handleGenerateUnits} className="flex-1 btn-primary">
                Generate
              </button>
              <button
                onClick={() => setShowGeneratorModal(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Units List Modal */}
      {showUnitsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Units ({units.length})</h2>
              <button
                onClick={() => setShowUnitsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            {units.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No units generated yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Unit Name</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Floor</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {units.map((unit) => (
                      <tr key={unit.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {editingUnitId === unit.id ? (
                            <input
                              type="text"
                              value={editingUnitName}
                              onChange={(e) => setEditingUnitName(e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                              autoFocus
                            />
                          ) : (
                            <span className="font-medium text-gray-900">{unit.name}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{unit.floor || '—'}</td>
                        <td className="px-4 py-3 space-x-2">
                          {editingUnitId === unit.id ? (
                            <>
                              <button
                                onClick={() => handleSaveUnitName(unit.id)}
                                className="text-sm px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingUnitId(null)}
                                className="text-sm px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleEditUnit(unit)}
                              className="text-sm px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowUnitsModal(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-900"
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
