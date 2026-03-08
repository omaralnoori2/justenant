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
  tenantId?: string;
  tenant?: { id: string; firstName: string; lastName: string; user: { email: string } };
  property: { id: string; name: string; landlord?: { id: string; firstName: string; lastName: string; user: { email: string } } };
}

interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  units: Unit[];
  landlord?: { id: string; firstName: string; lastName: string; user: { email: string } };
}

export default function CMTPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [showBulkGenerate, setShowBulkGenerate] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [generatorValues, setGeneratorValues] = useState({ towers: 10, floors: 30, unitsPerFloor: 9 });
  const [generating, setGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(30);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/cmt/properties');
      setProperties(res.data);
      // Flatten all units from all properties
      const units = res.data.flatMap((prop: Property) =>
        prop.units.map((unit: Unit) => ({ ...unit, property: { id: prop.id, name: prop.name, landlord: prop.landlord } }))
      );
      setAllUnits(units);
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

  const handleGenerateUnits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) {
      alert('Please select a property');
      return;
    }
    setGenerating(true);
    try {
      const res = await api.post(`/cmt/properties/${selectedProperty}/generate-units`, {
        mode: 'tower',
        towers: generatorValues.towers,
        floors: generatorValues.floors,
        unitsPerFloor: generatorValues.unitsPerFloor,
      });
      alert(`Generated ${res.data.generated} units!`);
      setShowBulkGenerate(false);
      setSelectedProperty('');
      fetchProperties();
    } catch (err) {
      console.error('Failed to generate units', err);
      alert('Failed to generate units');
    } finally {
      setGenerating(false);
    }
  };

  const getTenantDisplay = (unit: Unit) => {
    if (!unit.tenant) return '-';
    return `${unit.tenant.firstName} ${unit.tenant.lastName}`;
  };

  const getLandlordDisplay = (unit: Unit) => {
    if (!unit.property?.landlord) return '-';
    return `${unit.property.landlord.firstName} ${unit.property.landlord.lastName}`;
  };

  if (loading) return <div className="text-gray-500">Loading properties...</div>;

  const totalUnitsToGenerate = generatorValues.towers * generatorValues.floors * generatorValues.unitsPerFloor;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Properties & Units</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkGenerate(!showBulkGenerate)}
            className="btn-primary"
          >
            {showBulkGenerate ? 'Cancel' : '⚡ Generate Units'}
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary"
          >
            {showCreateForm ? 'Cancel' : '+ Create Property'}
          </button>
        </div>
      </div>

      {showBulkGenerate && (
        <div className="card border-l-4 border-l-brand-blue">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Bulk Generate Units</h2>
          <form onSubmit={handleGenerateUnits} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Property</label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Choose a property...</option>
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name} ({prop.units.length} units)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Towers (X)
                </label>
                <input
                  type="number"
                  min="1"
                  value={generatorValues.towers}
                  onChange={(e) =>
                    setGeneratorValues({ ...generatorValues, towers: parseInt(e.target.value) || 1 })
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
                  value={generatorValues.floors}
                  onChange={(e) =>
                    setGeneratorValues({ ...generatorValues, floors: parseInt(e.target.value) || 1 })
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
                  value={generatorValues.unitsPerFloor}
                  onChange={(e) =>
                    setGeneratorValues({ ...generatorValues, unitsPerFloor: parseInt(e.target.value) || 1 })
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
              disabled={generating}
              className="btn-primary w-full"
            >
              {generating ? 'Generating...' : 'Generate Units'}
            </button>
          </form>
        </div>
      )}

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

      {allUnits.length === 0 ? (
        <div className="card">
          <p className="text-gray-500">No units yet. Create a property and generate units to get started.</p>
        </div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Property</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Unit Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Floor</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Tenant</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Landlord</th>
                </tr>
              </thead>
              <tbody>
                {allUnits
                  .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                  .map((unit) => (
                    <tr key={unit.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{unit.property.name}</td>
                      <td className="px-4 py-3 text-gray-900">{unit.name}</td>
                      <td className="px-4 py-3 text-gray-600">{unit.floor || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          unit.isOccupied
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {unit.isOccupied ? 'Occupied' : 'Vacant'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-700 cursor-pointer hover:text-brand-blue hover:underline">
                          {getTenantDisplay(unit)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-700 cursor-pointer hover:text-brand-blue hover:underline">
                          {getLandlordDisplay(unit)}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Rows per page:</label>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="input-field py-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
                {Math.min(currentPage * rowsPerPage, allUnits.length)} of {allUnits.length} units
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from(
                  { length: Math.ceil(allUnits.length / rowsPerPage) },
                  (_, i) => i + 1
                )
                  .slice(
                    Math.max(0, currentPage - 3),
                    Math.min(Math.ceil(allUnits.length / rowsPerPage), currentPage + 2)
                  )
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        page === currentPage
                          ? 'bg-brand-blue text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
              </div>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(Math.ceil(allUnits.length / rowsPerPage), currentPage + 1))
                }
                disabled={currentPage === Math.ceil(allUnits.length / rowsPerPage)}
                className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>

      {showTenantModal && selectedUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Assign Tenant to {selectedUnit.name}
            </h2>

            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {selectedUnit.tenantId && (
                <button
                  onClick={handleRemoveTenant}
                  disabled={assigningTenant}
                  className="w-full text-left px-4 py-3 rounded border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium mb-2"
                >
                  {assigningTenant ? 'Removing...' : '✕ Remove Current Tenant'}
                </button>
              )}

              {availableTenants.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No tenants available</p>
              ) : (
                availableTenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    onClick={() => handleAssignTenant(tenant.id)}
                    disabled={assigningTenant}
                    className={`w-full text-left px-4 py-3 rounded border transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
                      selectedUnit.tenantId === tenant.id
                        ? 'border-brand-blue bg-blue-50 text-brand-blue font-medium'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tenant.firstName} {tenant.lastName}
                    <div className="text-xs text-gray-500 mt-1">
                      {tenant.user?.email}
                    </div>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => {
                setShowTenantModal(false);
                setSelectedUnit(null);
              }}
              disabled={assigningTenant}
              className="w-full px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showLandlordModal && selectedUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Assign Landlord to {selectedUnit.name}
            </h2>

            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {selectedUnit.landlordId && (
                <button
                  onClick={handleRemoveLandlord}
                  disabled={assigningLandlord}
                  className="w-full text-left px-4 py-3 rounded border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium mb-2"
                >
                  {assigningLandlord ? 'Removing...' : '✕ Remove Current Landlord'}
                </button>
              )}

              {availableLandlords.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No landlords available</p>
              ) : (
                availableLandlords.map((landlord) => (
                  <button
                    key={landlord.id}
                    onClick={() => handleAssignLandlord(landlord.id)}
                    disabled={assigningLandlord}
                    className={`w-full text-left px-4 py-3 rounded border transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
                      selectedUnit.landlordId === landlord.id
                        ? 'border-brand-blue bg-blue-50 text-brand-blue font-medium'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {landlord.firstName} {landlord.lastName}
                    <div className="text-xs text-gray-500 mt-1">
                      {landlord.user?.email}
                    </div>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={() => {
                setShowLandlordModal(false);
                setSelectedUnit(null);
              }}
              disabled={assigningLandlord}
              className="w-full px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
