'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getRole } from '@/lib/auth';
import type { Role } from '@/types';

interface Unit {
  id: string;
  name: string;
  floor?: number;
  unitNumber?: number;
  isOccupied: boolean;
  tenantId?: string;
  tenant?: { id: string; firstName: string; lastName: string; user: { email: string } };
  landlordId?: string;
  landlord?: { id: string; firstName: string; lastName: string; user: { email: string } };
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

interface TenantOption {
  id: string;
  firstName: string;
  lastName: string;
  user?: { email: string };
}

interface LandlordOption {
  id: string;
  firstName: string;
  lastName: string;
  user?: { email: string };
}

export default function CMTPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', address: '',
    cmtEmail: '', cmtPassword: '', cmtBusinessName: '', cmtBusinessAddress: '', cmtContactPhone: '', cmtLicenseNumber: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [addUnitsMode, setAddUnitsMode] = useState<'none' | 'choose' | 'single' | 'bulk'>('none');
  const [bulkStep, setBulkStep] = useState<'type' | 'config' | 'confirm'>('type');
  const [bulkType, setBulkType] = useState<'tower' | 'villa'>('tower');
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [generatorValues, setGeneratorValues] = useState({ towers: 1, floors: 1, unitsPerFloor: 1 });
  const [generating, setGenerating] = useState(false);
  const [singleUnitName, setSingleUnitName] = useState('');
  const [singleUnitFloor, setSingleUnitFloor] = useState('');
  const [addingSingleUnit, setAddingSingleUnit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(30);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [availableTenants, setAvailableTenants] = useState<TenantOption[]>([]);
  const [assigningTenant, setAssigningTenant] = useState(false);
  const [showLandlordModal, setShowLandlordModal] = useState(false);
  const [availableLandlords, setAvailableLandlords] = useState<LandlordOption[]>([]);
  const [assigningLandlord, setAssigningLandlord] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [userRole, setUserRole] = useState<Role | null>(null);

  useEffect(() => {
    setUserRole(getRole());
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/cmt/properties');
      console.log('Fetched properties response:', res.data);

      setProperties(res.data);
      const units = res.data.flatMap((prop: Property) =>
        prop.units.map((unit: Unit) => {
          console.log(`Unit ${unit.name} landlord data:`, unit.landlord);
          return {
            ...unit,
            property: { id: prop.id, name: prop.name, landlord: prop.landlord }
          };
        })
      );
      console.log('Processed units with landlord data:', units);
      setAllUnits(units);
    } catch (err) {
      console.error('Failed to fetch properties', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTenantModal = async (unit: Unit) => {
    try {
      const res = await api.get('/cmt/tenants');
      setAvailableTenants(res.data || []);
      setSelectedUnit(unit);
      setShowTenantModal(true);
    } catch (err) {
      console.error('Failed to fetch tenants', err);
      alert('Failed to fetch available tenants');
    }
  };

  const handleAssignTenant = async (tenantId: string) => {
    if (!selectedUnit) return;
    setAssigningTenant(true);
    try {
      const url = `/cmt/properties/${selectedUnit.property.id}/units/${selectedUnit.id}/assign-tenant`;
      await api.post(url, { tenantId });
      setShowTenantModal(false);
      setSelectedUnit(null);
      await fetchProperties();
    } catch (err: any) {
      console.error('Failed to assign tenant:', err);
      alert(`Failed to assign tenant: ${err.response?.data?.message || err.message}`);
    } finally {
      setAssigningTenant(false);
    }
  };

  const handleRemoveTenant = async () => {
    if (!selectedUnit) return;
    setAssigningTenant(true);
    try {
      const removeUrl = `/cmt/properties/${selectedUnit.property.id}/units/${selectedUnit.id}/remove-tenant`;
      await api.post(removeUrl);
      setShowTenantModal(false);
      setSelectedUnit(null);
      await fetchProperties();
    } catch (err) {
      console.error('Failed to remove tenant', err);
      alert('Failed to remove tenant');
    } finally {
      setAssigningTenant(false);
    }
  };

  const handleOpenLandlordModal = async (unit: Unit) => {
    try {
      console.log('Opening landlord modal for unit:', unit.id, unit.name);
      const res = await api.get('/cmt/landlords');
      console.log('Fetched landlords response:', res.data);

      if (!res.data) {
        console.warn('API returned null/undefined data');
        setAvailableLandlords([]);
      } else if (Array.isArray(res.data)) {
        setAvailableLandlords(res.data);
      } else {
        console.warn('Unexpected response format:', res.data);
        setAvailableLandlords([]);
      }

      setSelectedUnit(unit);
      setShowLandlordModal(true);
      console.log('Landlord modal opened successfully');
    } catch (err: any) {
      console.error('Failed to fetch landlords - Full error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      alert(`Failed to fetch available landlords: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleAssignLandlord = async (landlordId: string) => {
    if (!selectedUnit) {
      console.warn('No unit selected for landlord assignment');
      return;
    }
    setAssigningLandlord(true);
    try {
      const url = `/cmt/properties/${selectedUnit.property.id}/units/${selectedUnit.id}/assign-landlord`;
      console.log('Assigning landlord:', { url, landlordId });
      const res = await api.post(url, { landlordId });
      console.log('Landlord assignment response:', res.data);
      setShowLandlordModal(false);
      setSelectedUnit(null);
      await fetchProperties();
    } catch (err: any) {
      console.error('Failed to assign landlord - Full error:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error status:', err.response?.status);
      alert(`Failed to assign landlord: ${err.response?.data?.message || err.message}`);
    } finally {
      setAssigningLandlord(false);
    }
  };

  const handleRemoveLandlord = async () => {
    if (!selectedUnit) {
      console.warn('No unit selected for landlord removal');
      return;
    }
    setAssigningLandlord(true);
    try {
      const removeUrl = `/cmt/properties/${selectedUnit.property.id}/units/${selectedUnit.id}/remove-landlord`;
      console.log('Removing landlord from unit:', removeUrl);
      const res = await api.post(removeUrl);
      console.log('Landlord removal response:', res.data);
      setShowLandlordModal(false);
      setSelectedUnit(null);
      await fetchProperties();
    } catch (err: any) {
      console.error('Failed to remove landlord - Full error:', err);
      console.error('Error response data:', err.response?.data);
      console.error('Error status:', err.response?.status);
      alert(`Failed to remove landlord: ${err.response?.data?.message || err.message}`);
    } finally {
      setAssigningLandlord(false);
    }
  };

  const handleCreateProperty = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/cmt/properties', formData);
      setFormData({ name: '', address: '', cmtEmail: '', cmtPassword: '', cmtBusinessName: '', cmtBusinessAddress: '', cmtContactPhone: '', cmtLicenseNumber: '' });
      setShowCreateForm(false);
      await fetchProperties();
    } catch (err) {
      console.error('Failed to create property', err);
      alert('Failed to create property');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateUnits = async () => {
    const propertyId = selectedProperty || (properties.length === 1 ? properties[0].id : '');
    if (!propertyId) {
      alert('Please select a property');
      return;
    }
    setGenerating(true);
    try {
      const res = await api.post(`/cmt/properties/${propertyId}/generate-units`, {
        mode: bulkType,
        towers: generatorValues.towers,
        floors: generatorValues.floors,
        unitsPerFloor: generatorValues.unitsPerFloor,
      });
      alert(`Generated ${res.data.generated} units!`);
      setAddUnitsMode('none');
      setBulkStep('type');
      setSelectedProperty('');
      setGeneratorValues({ towers: 1, floors: 1, unitsPerFloor: 1 });
      await fetchProperties();
    } catch (err) {
      console.error('Failed to generate units', err);
      alert('Failed to generate units');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddSingleUnit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const propertyId = selectedProperty || (properties.length === 1 ? properties[0].id : '');
    if (!propertyId || !singleUnitName.trim()) return;
    setAddingSingleUnit(true);
    try {
      await api.post(`/cmt/properties/${propertyId}/generate-units`, {
        mode: 'tower',
        towers: 1,
        floors: 1,
        unitsPerFloor: 1,
        towerNames: [singleUnitName.trim()],
      });
      // The API will create "Flat 101 Tower <name>", so let's use a direct unit creation approach
      // Actually, let's just use the updateUnitName after creation or create a simpler approach
      // For now, we use the bulk generator with 1 unit and then rename it
      const unitsRes = await api.get(`/cmt/properties/${propertyId}/units`);
      const allPropertyUnits = unitsRes.data;
      const lastUnit = allPropertyUnits[allPropertyUnits.length - 1];
      if (lastUnit) {
        await api.patch(`/cmt/properties/${propertyId}/units/${lastUnit.id}`, {
          name: singleUnitName.trim(),
        });
      }
      setSingleUnitName('');
      setSingleUnitFloor('');
      setSelectedProperty('');
      setAddUnitsMode('none');
      await fetchProperties();
    } catch (err) {
      console.error('Failed to add unit', err);
      alert('Failed to add unit');
    } finally {
      setAddingSingleUnit(false);
    }
  };

  const getTenantDisplay = (unit: Unit) => {
    if (!unit.tenant) return '-';
    return `${unit.tenant.firstName} ${unit.tenant.lastName}`;
  };

  const getLandlordDisplay = (unit: Unit) => {
    if (!unit.landlord) return '-';
    return `${unit.landlord.firstName} ${unit.landlord.lastName}`;
  };

  const getTowerName = (unit: Unit) => {
    const towerMatch = unit.name.match(/Tower\s([A-Z]+)$/);
    return towerMatch ? towerMatch[1] : '-';
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedUnits = () => {
    const sorted = [...allUnits].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortColumn) {
        case 'property':
          aVal = a.property.name.toLowerCase();
          bVal = b.property.name.toLowerCase();
          break;
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'tower':
          aVal = getTowerName(a);
          bVal = getTowerName(b);
          break;
        case 'status':
          aVal = a.isOccupied ? 1 : 0;
          bVal = b.isOccupied ? 1 : 0;
          break;
        case 'tenant':
          aVal = getTenantDisplay(a).toLowerCase();
          bVal = getTenantDisplay(b).toLowerCase();
          break;
        case 'landlord':
          aVal = getLandlordDisplay(a).toLowerCase();
          bVal = getLandlordDisplay(b).toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  const totalUnitsToGenerate = generatorValues.towers * generatorValues.floors * generatorValues.unitsPerFloor;

  if (loading) {
    return <div className="text-gray-500">Loading properties...</div>;
  }

  const sortedUnits = getSortedUnits();
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedUnits = sortedUnits.slice(startIndex, endIndex);
  const totalPages = Math.ceil(sortedUnits.length / rowsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Properties & Units</h1>
        <div className="flex gap-2 relative">
          <div className="relative">
            <button
              onClick={() => setAddUnitsMode(addUnitsMode === 'none' ? 'choose' : 'none')}
              className="btn-primary"
            >
              {addUnitsMode !== 'none' ? 'Cancel' : '+ Add Units'}
            </button>
            {addUnitsMode === 'choose' && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => { setAddUnitsMode('single'); if (properties.length > 0) setSelectedProperty(properties[0].id); }}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-t-lg border-b border-gray-100"
                >
                  Add One Unit
                </button>
                <button
                  onClick={() => { setAddUnitsMode('bulk'); setBulkStep('type'); if (properties.length > 0) setSelectedProperty(properties[0].id); }}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-b-lg"
                >
                  Add Bulk
                </button>
              </div>
            )}
          </div>
          {userRole === 'SUPER_ADMIN' && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn-primary"
            >
              {showCreateForm ? 'Cancel' : '+ Create Property'}
            </button>
          )}
        </div>
      </div>

      {addUnitsMode === 'single' && (
        <div className="card border-l-4 border-l-brand-blue">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Add One Unit</h2>
          <form onSubmit={handleAddSingleUnit} className="space-y-4">
            {properties.length > 1 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Property</label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="input-field"
                required
              >
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name} ({prop.units.length} units)
                  </option>
                ))}
              </select>
            </div>
            ) : properties.length === 1 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
              <p className="text-sm text-gray-900 font-medium">{properties[0].name}</p>
            </div>
            ) : null}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Name</label>
                <input
                  type="text"
                  value={singleUnitName}
                  onChange={(e) => setSingleUnitName(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Flat 101 Tower A"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor (optional)</label>
                <input
                  type="number"
                  min="1"
                  value={singleUnitFloor}
                  onChange={(e) => setSingleUnitFloor(e.target.value)}
                  className="input-field"
                  placeholder="e.g., 1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={addingSingleUnit} className="btn-primary">
                {addingSingleUnit ? 'Adding...' : 'Add Unit'}
              </button>
              <button
                type="button"
                onClick={() => { setAddUnitsMode('none'); setSingleUnitName(''); setSingleUnitFloor(''); setSelectedProperty(''); }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {addUnitsMode === 'bulk' && (
        <div className="card border-l-4 border-l-brand-blue">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Add Bulk Units</h2>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-6">
            {['type', 'config', 'confirm'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  bulkStep === step ? 'bg-brand-blue text-white' :
                  ['type', 'config', 'confirm'].indexOf(bulkStep) > i ? 'bg-green-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {['type', 'config', 'confirm'].indexOf(bulkStep) > i ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-medium ${bulkStep === step ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step === 'type' ? 'Type' : step === 'config' ? 'Configuration' : 'Confirm'}
                </span>
                {i < 2 && <div className="w-8 h-px bg-gray-300" />}
              </div>
            ))}
          </div>

          {/* Step 1: Select Property & Type */}
          {bulkStep === 'type' && (
            <div className="space-y-4">
              {properties.length > 1 ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Property</label>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="input-field"
                >
                  {properties.map((prop) => (
                    <option key={prop.id} value={prop.id}>
                      {prop.name} ({prop.units.length} units)
                    </option>
                  ))}
                </select>
              </div>
              ) : properties.length === 1 ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                <p className="text-sm text-gray-900 font-medium">{properties[0].name}</p>
              </div>
              ) : null}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Property Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setBulkType('tower')}
                    className={`p-4 rounded-lg border-2 text-center transition-colors ${
                      bulkType === 'tower'
                        ? 'border-brand-blue bg-blue-50 text-brand-blue'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">🏢</div>
                    <div className="font-semibold">Towers</div>
                    <div className="text-xs mt-1">Towers &gt; Floors &gt; Flats</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkType('villa')}
                    className={`p-4 rounded-lg border-2 text-center transition-colors ${
                      bulkType === 'villa'
                        ? 'border-brand-blue bg-blue-50 text-brand-blue'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">🏡</div>
                    <div className="font-semibold">Villas</div>
                    <div className="text-xs mt-1">Areas &gt; Blocks &gt; Villas</div>
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setAddUnitsMode('none'); setSelectedProperty(''); }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { if (properties.length > 0 && !selectedProperty) setSelectedProperty(properties[0].id); setBulkStep('config'); }}
                  className="btn-primary"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Configuration */}
          {bulkStep === 'config' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {bulkType === 'tower' ? 'Number of Towers' : 'Number of Areas'}
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
                    {bulkType === 'tower' ? 'Floors per Tower' : 'Blocks per Area'}
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
                    {bulkType === 'tower' ? 'Flats per Floor' : 'Villas per Block'}
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
              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setBulkStep('type')}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setBulkStep('confirm')}
                  className="btn-primary"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {bulkStep === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold text-gray-900">Review before generating</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-gray-500">Property:</span>
                  <span className="text-gray-900 font-medium">
                    {properties.find(p => p.id === selectedProperty)?.name || (properties.length === 1 ? properties[0].name : '-')}
                  </span>
                  <span className="text-gray-500">Type:</span>
                  <span className="text-gray-900 font-medium">{bulkType === 'tower' ? 'Towers' : 'Villas'}</span>
                  <span className="text-gray-500">{bulkType === 'tower' ? 'Towers:' : 'Areas:'}</span>
                  <span className="text-gray-900 font-medium">{generatorValues.towers}</span>
                  <span className="text-gray-500">{bulkType === 'tower' ? 'Floors per Tower:' : 'Blocks per Area:'}</span>
                  <span className="text-gray-900 font-medium">{generatorValues.floors}</span>
                  <span className="text-gray-500">{bulkType === 'tower' ? 'Flats per Floor:' : 'Villas per Block:'}</span>
                  <span className="text-gray-900 font-medium">{generatorValues.unitsPerFloor}</span>
                </div>
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <span className="text-gray-700 font-bold">
                    Total units to generate: {totalUnitsToGenerate.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {bulkType === 'tower'
                    ? `Naming format: Flat [floor][unit] Tower [A-${String.fromCharCode(64 + generatorValues.towers)}]`
                    : `Naming format: Villa [block][unit] Area [A-${String.fromCharCode(64 + generatorValues.towers)}]`
                  }
                </div>
              </div>
              <div className="flex justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setBulkStep('config')}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleGenerateUnits}
                  disabled={generating}
                  className="btn-primary"
                >
                  {generating ? 'Generating...' : 'Confirm & Generate'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showCreateForm && (
        <div className="card border-l-4 border-l-brand-blue">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Property</h2>
          <form onSubmit={handleCreateProperty} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 123 Main St, Downtown"
                  required
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-md font-semibold text-gray-800 mb-3">CMT Admin Account</h3>
              <p className="text-sm text-gray-500 mb-3">A dedicated CMT admin will be created and linked to this property.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CMT Email</label>
                  <input
                    type="email"
                    value={formData.cmtEmail}
                    onChange={(e) => setFormData({ ...formData, cmtEmail: e.target.value })}
                    className="input-field"
                    placeholder="e.g., cmt@riverside.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CMT Password</label>
                  <input
                    type="password"
                    value={formData.cmtPassword}
                    onChange={(e) => setFormData({ ...formData, cmtPassword: e.target.value })}
                    className="input-field"
                    placeholder="Min 8 characters"
                    minLength={8}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    value={formData.cmtBusinessName}
                    onChange={(e) => setFormData({ ...formData, cmtBusinessName: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Riverside Management Co."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                  <input
                    type="text"
                    value={formData.cmtBusinessAddress}
                    onChange={(e) => setFormData({ ...formData, cmtBusinessAddress: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Office 5, Business Bay"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.cmtContactPhone}
                    onChange={(e) => setFormData({ ...formData, cmtContactPhone: e.target.value })}
                    className="input-field"
                    placeholder="e.g., +971 50 123 4567"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.cmtLicenseNumber}
                    onChange={(e) => setFormData({ ...formData, cmtLicenseNumber: e.target.value })}
                    className="input-field"
                    placeholder="e.g., BRN-12345"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Creating...' : 'Create Property & CMT Account'}
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
            <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '60px' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '18%' }} />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-700">No.</th>
                  <th
                    onClick={() => handleSort('property')}
                    className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors truncate"
                  >
                    Property {sortColumn === 'property' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('name')}
                    className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors truncate"
                  >
                    Unit Name {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('tower')}
                    className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors truncate"
                  >
                    Tower {sortColumn === 'tower' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors truncate"
                  >
                    Status {sortColumn === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('tenant')}
                    className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors truncate"
                  >
                    Tenant {sortColumn === 'tenant' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    onClick={() => handleSort('landlord')}
                    className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors truncate"
                  >
                    Landlord {sortColumn === 'landlord' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUnits.map((unit, index) => (
                  <tr key={unit.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-medium">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-4 py-3 text-gray-900 truncate" title={unit.property.name}>{unit.property.name}</td>
                    <td className="px-4 py-3 text-gray-900 truncate" title={unit.name}>{unit.name}</td>
                    <td className="px-4 py-3 text-gray-600 font-medium truncate">{getTowerName(unit)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          unit.isOccupied
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {unit.isOccupied ? 'Occupied' : 'Vacant'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        onClick={() => handleOpenTenantModal(unit)}
                        className="text-gray-700 cursor-pointer hover:text-brand-blue hover:underline hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                      >
                        {getTenantDisplay(unit)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        onClick={() => handleOpenLandlordModal(unit)}
                        className="text-gray-700 cursor-pointer hover:text-brand-blue hover:underline hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                      >
                        {getLandlordDisplay(unit)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
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
                Showing {startIndex + 1} to {Math.min(endIndex, sortedUnits.length)} of {sortedUnits.length} units
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(
                    Math.max(0, currentPage - 3),
                    Math.min(totalPages, currentPage + 2)
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
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

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
