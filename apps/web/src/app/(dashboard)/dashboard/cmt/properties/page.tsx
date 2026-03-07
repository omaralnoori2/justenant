'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';

interface Property {
  id: string;
  name: string;
  address: string;
  landlord?: { name: string };
  unitCount?: number;
}

interface Unit {
  id: string;
  name: string;
  floor?: number;
}

type ViewType = 'kanban' | 'list';
type SortBy = 'name-asc' | 'name-desc' | 'units-high' | 'units-low';

export default function CMTPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [allPropertyUnits, setAllPropertyUnits] = useState<Record<string, Unit[]>>({});
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitName, setEditingUnitName] = useState('');

  // View and filter states
  const [viewType, setViewType] = useState<ViewType>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name-asc');

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

      // Fetch all units for all properties
      const unitsMap: Record<string, Unit[]> = {};
      for (const property of res.data) {
        try {
          const unitsRes = await api.get(`/cmt/properties/${property.id}/units`);
          unitsMap[property.id] = unitsRes.data || [];
        } catch (err) {
          console.error(`Failed to fetch units for property ${property.id}`, err);
          unitsMap[property.id] = [];
        }
      }
      setAllPropertyUnits(unitsMap);
    } catch (err) {
      console.error('Failed to fetch properties', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort properties
  const filteredAndSortedProperties = useMemo(() => {
    let filtered = properties.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort properties
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'units-high':
          return (b.unitCount || 0) - (a.unitCount || 0);
        case 'units-low':
          return (a.unitCount || 0) - (b.unitCount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [properties, searchQuery, sortBy]);

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
          <h1 className="text-2xl font-bold text-brand-blue">Properties</h1>
          <p className="text-brand-gray text-sm mt-1">Manage residential properties and units</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          + Add Property
        </button>
      </div>

      {/* Controls: Search, Sort, View Toggle */}
      <div className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">Search Properties</label>
            <input
              type="text"
              placeholder="Search by name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="input-field"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="units-high">Units (High to Low)</option>
              <option value="units-low">Units (Low to High)</option>
            </select>
          </div>

          {/* View Toggle */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">View</label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewType('list')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewType === 'list'
                    ? 'bg-brand-blue text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📋 List
              </button>
              <button
                onClick={() => setViewType('kanban')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewType === 'kanban'
                    ? 'bg-brand-blue text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📊 Kanban
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Display */}
      {loading ? (
        <div className="card text-center py-8">
          <p className="text-brand-gray">Loading properties...</p>
        </div>
      ) : filteredAndSortedProperties.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-brand-gray">
            {properties.length === 0 ? 'No properties yet. Create one to get started.' : 'No properties match your search.'}
          </p>
        </div>
      ) : viewType === 'list' ? (
        /* LIST VIEW */
        <div className="space-y-4">
          {filteredAndSortedProperties.map((property) => (
            <div key={property.id} className="card border-l-4 border-l-brand-blue">
              {/* Property Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-brand-blue">{property.name}</h3>
                  <p className="text-sm text-brand-gray mt-1">{property.address}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-brand-blue-lightest text-brand-blue font-semibold text-sm">
                  {allPropertyUnits[property.id]?.length || 0} units
                </span>
              </div>

              {/* Property Actions */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setSelectedPropertyId(property.id);
                    setShowGeneratorModal(true);
                  }}
                  className="text-sm px-3 py-2 rounded-lg bg-brand-blue-lightest text-brand-blue hover:bg-brand-blue-light transition-colors font-medium"
                >
                  🏗️ Generate Units
                </button>
                <button
                  onClick={async () => {
                    setSelectedPropertyId(property.id);
                    await fetchUnits(property.id);
                  }}
                  className="text-sm px-3 py-2 rounded-lg bg-gray-100 text-brand-dark hover:bg-gray-200 transition-colors font-medium"
                >
                  ⚙️ Edit Units
                </button>
              </div>

              {/* Units List */}
              {allPropertyUnits[property.id] && allPropertyUnits[property.id].length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-brand-gray uppercase mb-3">Units</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {allPropertyUnits[property.id].map((unit) => (
                      <div
                        key={unit.id}
                        className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:border-brand-blue hover:bg-brand-blue-lightest transition-colors"
                      >
                        <p className="text-xs font-medium text-brand-dark">{unit.name}</p>
                        {unit.floor && <p className="text-xs text-brand-gray mt-1">Floor {unit.floor}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-brand-gray">No units generated yet</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedProperties.map((property) => (
            <div
              key={property.id}
              className="card hover:shadow-lg transition-shadow border-l-4 border-l-brand-blue flex flex-col"
            >
              <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200">
                <div className="flex-1">
                  <h3 className="font-semibold text-brand-blue text-lg">{property.name}</h3>
                  <p className="text-xs text-brand-gray mt-1">{property.address}</p>
                </div>
                <span className="px-2 py-1 rounded-full bg-brand-blue-lightest text-brand-blue text-xs font-semibold whitespace-nowrap ml-2">
                  {allPropertyUnits[property.id]?.length || 0}
                </span>
              </div>

              {property.landlord && (
                <p className="text-xs text-brand-gray mb-3">
                  👤 <span className="font-medium">{property.landlord.name}</span>
                </p>
              )}

              {/* Units Grid in Kanban */}
              {allPropertyUnits[property.id] && allPropertyUnits[property.id].length > 0 ? (
                <div className="mb-4 flex-1">
                  <p className="text-xs font-semibold text-brand-gray uppercase mb-2">Units</p>
                  <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                    {allPropertyUnits[property.id].slice(0, 8).map((unit) => (
                      <div
                        key={unit.id}
                        className="px-2 py-1 rounded text-xs bg-brand-blue-lightest text-brand-dark font-medium truncate"
                        title={unit.name}
                      >
                        {unit.name}
                      </div>
                    ))}
                    {allPropertyUnits[property.id].length > 8 && (
                      <div className="px-2 py-1 rounded text-xs bg-gray-100 text-brand-gray font-medium">
                        +{allPropertyUnits[property.id].length - 8} more
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-4 flex-1 flex items-center justify-center">
                  <p className="text-xs text-brand-gray italic">No units yet</p>
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedPropertyId(property.id);
                    setShowGeneratorModal(true);
                  }}
                  className="w-full text-sm px-3 py-2 rounded-lg bg-brand-blue text-white hover:bg-brand-blue-light transition-colors font-medium"
                >
                  🏗️ Generate Units
                </button>
                <button
                  onClick={async () => {
                    setSelectedPropertyId(property.id);
                    await fetchUnits(property.id);
                  }}
                  className="w-full text-sm px-3 py-2 rounded-lg bg-gray-100 text-brand-dark hover:bg-gray-200 transition-colors font-medium"
                >
                  ⚙️ Edit Units
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
