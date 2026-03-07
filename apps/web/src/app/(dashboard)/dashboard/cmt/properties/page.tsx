'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';

interface Property {
  id: string;
  name: string;
  address: string;
  landlord?: { name: string };
  logo?: string; // URL to property logo/image
  unitCount?: number;
}

interface Unit {
  id: string;
  name: string;
  floor?: number;
  tenant?: { id: string; firstName: string; lastName: string };
  landlord?: { id: string; name: string };
}

type ViewType = 'kanban' | 'spreadsheet';
type SortBy = 'name-asc' | 'name-desc' | 'units-high' | 'units-low';
type EditingCell = { unitId: string; field: 'name' | 'floor' } | null;
type ColumnSortType = 'unitCode' | 'unitName' | 'tower' | 'floor' | 'tenant' | 'landlord';
type SortDirection = 'asc' | 'desc';

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

  // Spreadsheet editing state
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [editingValue, setEditingValue] = useState('');

  // View and filter states
  const [viewType, setViewType] = useState<ViewType>('spreadsheet');
  const [kanbanViewType, setKanbanViewType] = useState<'properties' | 'units'>('properties');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name-asc');

  // Column sorting and pagination
  const [columnSort, setColumnSort] = useState<{ column: ColumnSortType; direction: SortDirection }>({
    column: 'unitName',
    direction: 'asc',
  });
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk operations
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditConfig, setBulkEditConfig] = useState({
    namePrefix: '',
    addFloor: 0,
    operation: 'rename', // 'rename' | 'addFloor'
  });

  // Form states
  const [formData, setFormData] = useState({ name: '', address: '' });
  const [generatorConfig, setGeneratorConfig] = useState({
    mode: 'tower',
    towers: 10,
    floors: 30,
    unitsPerFloor: 9,
  });

  // Generator modal step state
  const [generatorStep, setGeneratorStep] = useState(1); // 1: type, 2: X value, 3: Y value, 4: Z value

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

  // Extract tower from unit name (e.g., "Flat 101 Tower A" -> "Tower A")
  const extractTower = (unitName: string): string => {
    const match = unitName.match(/Tower\s+[A-Z]|Area\s+[A-Z]/);
    return match ? match[0] : '—';
  };

  // Extract unit number from unit name (e.g., "Flat 101 Tower A" -> "Flat 101")
  const extractUnitNumber = (unitName: string): string => {
    const parts = unitName.split(/\s+Tower\s+|\s+Area\s+/);
    return parts[0] || unitName;
  };

  // Extract unit code (e.g., "Flat 101 Tower A" -> "A101")
  const extractUnitCode = (unitName: string): string => {
    const tower = extractTower(unitName);
    const unitNum = extractUnitNumber(unitName);

    // Extract tower letter
    const towerLetter = tower.match(/[A-Z]/)?.[0] || '';
    // Extract numeric part from unit name
    const numeric = unitNum.match(/\d+/)?.[0] || '';

    return towerLetter && numeric ? `${towerLetter}${numeric}` : '—';
  };

  // Handle column header sort
  const handleColumnSort = (column: ColumnSortType) => {
    setColumnSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1); // Reset to first page
  };

  // Sort units by column
  const sortUnitsByColumn = (units: Unit[]): Unit[] => {
    const sorted = [...units];

    const compareValues = (a: any, b: any) => {
      if (a < b) return columnSort.direction === 'asc' ? -1 : 1;
      if (a > b) return columnSort.direction === 'asc' ? 1 : -1;
      return 0;
    };

    sorted.sort((a, b) => {
      switch (columnSort.column) {
        case 'unitCode':
          return compareValues(extractUnitCode(a.name), extractUnitCode(b.name));
        case 'unitName':
          return compareValues(extractUnitNumber(a.name), extractUnitNumber(b.name));
        case 'tower':
          return compareValues(extractTower(a.name), extractTower(b.name));
        case 'floor':
          return compareValues(a.floor || 0, b.floor || 0);
        case 'tenant':
          const tenantA = a.tenant ? `${a.tenant.firstName} ${a.tenant.lastName}` : '';
          const tenantB = b.tenant ? `${b.tenant.firstName} ${b.tenant.lastName}` : '';
          return compareValues(tenantA, tenantB);
        case 'landlord':
          return compareValues(a.landlord?.name || '', b.landlord?.name || '');
        default:
          return 0;
      }
    });

    return sorted;
  };

  // Get paginated units for current page
  const getPaginatedUnits = (units: Unit[]): Unit[] => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    return units.slice(startIdx, endIdx);
  };

  // Calculate total pages
  const getTotalPages = (units: Unit[]): number => {
    return Math.ceil(units.length / itemsPerPage);
  };

  // Handle bulk delete
  const handleBulkDelete = async (propertyId: string) => {
    if (selectedUnits.size === 0) {
      alert('No units selected');
      return;
    }

    if (!confirm(`Delete ${selectedUnits.size} units?`)) return;

    try {
      // Delete each selected unit
      const unitIdsToDelete = Array.from(selectedUnits);
      for (const unitId of unitIdsToDelete) {
        try {
          await api.delete(`/cmt/properties/${propertyId}/units/${unitId}`);
        } catch (err) {
          console.error(`Failed to delete unit ${unitId}`, err);
        }
      }

      // Update local state
      setAllPropertyUnits(prev => ({
        ...prev,
        [propertyId]: prev[propertyId].filter(u => !selectedUnits.has(u.id))
      }));

      setSelectedUnits(new Set());
      setShowBulkDeleteModal(false);
      alert(`Deleted ${selectedUnits.size} units`);
    } catch (err) {
      alert('Failed to delete units');
    }
  };

  // Handle bulk edit
  const handleBulkEdit = async (propertyId: string) => {
    if (selectedUnits.size === 0) {
      alert('No units selected');
      return;
    }

    if (bulkEditConfig.operation === 'rename' && !bulkEditConfig.namePrefix.trim()) {
      alert('Please enter a name prefix');
      return;
    }

    try {
      const unitIdsToEdit = Array.from(selectedUnits);
      const unitToUpdate = Object.values(allPropertyUnits)
        .flat()
        .filter(u => unitIdsToEdit.includes(u.id));

      // Show confirmation with preview
      let confirmMessage = `Update ${unitIdsToEdit.length} units?\n\n`;
      if (bulkEditConfig.operation === 'rename') {
        confirmMessage += `Change names to format: "${bulkEditConfig.namePrefix} [unit info]"\n`;
        confirmMessage += `Example: "${bulkEditConfig.namePrefix} Tower A, Flat 101"\n`;
      } else if (bulkEditConfig.operation === 'addFloor') {
        confirmMessage += `Add ${bulkEditConfig.addFloor} to floor numbers\n`;
      }

      if (!confirm(confirmMessage)) return;

      // Update each unit
      for (const unit of unitToUpdate) {
        const updateData: Record<string, any> = {};

        if (bulkEditConfig.operation === 'rename') {
          // Create new name with prefix
          updateData.name = `${bulkEditConfig.namePrefix} ${unit.name}`;
        } else if (bulkEditConfig.operation === 'addFloor') {
          updateData.floor = (unit.floor || 0) + bulkEditConfig.addFloor;
        }

        await api.patch(`/cmt/properties/${propertyId}/units/${unit.id}`, updateData);
      }

      // Update local state
      setAllPropertyUnits(prev => ({
        ...prev,
        [propertyId]: prev[propertyId].map(u => {
          if (selectedUnits.has(u.id)) {
            const updateData: Record<string, any> = {};
            if (bulkEditConfig.operation === 'rename') {
              updateData.name = `${bulkEditConfig.namePrefix} ${u.name}`;
            } else if (bulkEditConfig.operation === 'addFloor') {
              updateData.floor = (u.floor || 0) + bulkEditConfig.addFloor;
            }
            return { ...u, ...updateData };
          }
          return u;
        })
      }));

      alert(`Updated ${unitIdsToEdit.length} units successfully`);
      setSelectedUnits(new Set());
      setShowBulkEditModal(false);
      setBulkEditConfig({ namePrefix: '', addFloor: 0, operation: 'rename' });
    } catch (err) {
      alert('Failed to update units');
      console.error(err);
    }
  };

  // Save cell in spreadsheet view
  const handleSaveCell = async (propertyId: string, unitId: string, field: 'name' | 'floor') => {
    if (!editingValue.trim() && field === 'name') {
      alert('Unit name cannot be empty');
      return;
    }

    try {
      const updateData: Record<string, any> = {};
      if (field === 'name') {
        updateData.name = editingValue;
      } else if (field === 'floor') {
        updateData.floor = parseInt(editingValue) || 0;
      }

      await api.patch(`/cmt/properties/${propertyId}/units/${unitId}`, updateData);

      // Update local state
      setAllPropertyUnits(prev => ({
        ...prev,
        [propertyId]: prev[propertyId].map(u =>
          u.id === unitId ? { ...u, [field]: field === 'floor' ? parseInt(editingValue) : editingValue } : u
        )
      }));

      setEditingCell(null);
      setEditingValue('');
    } catch (err) {
      alert(`Failed to update unit ${field}`);
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
                onClick={() => setViewType('spreadsheet')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewType === 'spreadsheet'
                    ? 'bg-brand-blue text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📊 Sheet
              </button>
              <button
                onClick={() => setViewType('kanban')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewType === 'kanban'
                    ? 'bg-brand-blue text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📇 Kanban
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
      ) : viewType === 'spreadsheet' ? (
        /* SPREADSHEET VIEW - Google Sheet Style */
        <div className="space-y-6">
          {filteredAndSortedProperties.map((property) => (
            <div key={property.id} className="card border-l-4 border-l-brand-blue">
              {/* Compound Property Header with Logo */}
              <div className="mb-4 pb-4 border-b-2 border-brand-blue">
                {/* Top Row: Logo and Unit Badge */}
                <div className="flex items-start justify-between mb-3">
                  {/* Logo */}
                  <div className="flex-shrink-0">
                    {property.logo ? (
                      <img
                        src={property.logo}
                        alt={property.name}
                        className="h-12 w-12 rounded-lg object-cover border border-brand-blue-lightest"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-brand-blue-lightest border border-brand-blue flex items-center justify-center text-brand-blue font-bold">
                        {property.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Unit Count Badge */}
                  <span className="px-3 py-1 rounded-full bg-brand-blue-lightest text-brand-blue font-semibold text-sm">
                    {allPropertyUnits[property.id]?.length || 0} units
                  </span>
                </div>

                {/* Center: Name and Address */}
                <div className="text-center mb-3">
                  <h3 className="text-xl font-bold text-brand-blue mb-1">{property.name}</h3>
                  <p className="text-sm text-brand-gray">{property.address}</p>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setSelectedPropertyId(property.id);
                      setShowGeneratorModal(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-brand-blue text-white hover:bg-brand-blue-light transition-colors font-medium text-sm"
                  >
                    + Generate Units
                  </button>
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {selectedUnits.size > 0 && (
                <div className="mb-4 p-3 bg-brand-blue-lightest rounded-lg border-l-4 border-brand-blue flex items-center justify-between">
                  <span className="text-sm font-semibold text-brand-blue">
                    {selectedUnits.size} unit{selectedUnits.size !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedUnits(new Set())}
                      className="px-3 py-1 text-sm rounded-lg bg-white text-brand-dark hover:bg-gray-100 border border-brand-gray transition-colors font-medium"
                    >
                      Deselect All
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPropertyId(property.id);
                        setShowBulkEditModal(true);
                      }}
                      className="px-3 py-1 text-sm rounded-lg bg-brand-blue text-white hover:bg-brand-blue-light transition-colors font-medium"
                    >
                      ✎ Edit Selected
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPropertyId(property.id);
                        setShowBulkDeleteModal(true);
                      }}
                      className="px-3 py-1 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
                    >
                      Delete Selected
                    </button>
                  </div>
                </div>
              )}

              {/* Spreadsheet Table */}
              {allPropertyUnits[property.id] && allPropertyUnits[property.id].length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-brand-blue-lightest border-b-2 border-brand-blue">
                        {/* Checkbox Column */}
                        <th className="px-3 py-3 text-center font-bold text-brand-blue w-12">
                          <input
                            type="checkbox"
                            checked={getPaginatedUnits(sortUnitsByColumn(allPropertyUnits[property.id])).length > 0 && getPaginatedUnits(sortUnitsByColumn(allPropertyUnits[property.id])).every(u => selectedUnits.has(u.id))}
                            onChange={(e) => {
                              const paginatedUnits = getPaginatedUnits(sortUnitsByColumn(allPropertyUnits[property.id]));
                              if (e.target.checked) {
                                const newSelected = new Set(selectedUnits);
                                paginatedUnits.forEach(u => newSelected.add(u.id));
                                setSelectedUnits(newSelected);
                              } else {
                                const newSelected = new Set(selectedUnits);
                                paginatedUnits.forEach(u => newSelected.delete(u.id));
                                setSelectedUnits(newSelected);
                              }
                            }}
                            className="w-4 h-4 cursor-pointer"
                            title="Select all on this page"
                          />
                        </th>

                        {/* Unit Code Header */}
                        <th
                          className="px-4 py-3 text-left font-bold text-brand-blue w-20 cursor-pointer hover:bg-brand-blue-light hover:text-white transition-colors"
                          onClick={() => handleColumnSort('unitCode')}
                          title="Click to sort"
                        >
                          Unit Code {columnSort.column === 'unitCode' && (columnSort.direction === 'asc' ? '↑' : '↓')}
                        </th>

                        {/* Unit Name Header */}
                        <th
                          className="px-4 py-3 text-left font-bold text-brand-blue w-1/4 cursor-pointer hover:bg-brand-blue-light hover:text-white transition-colors"
                          onClick={() => handleColumnSort('unitName')}
                          title="Click to sort"
                        >
                          Unit Name {columnSort.column === 'unitName' && (columnSort.direction === 'asc' ? '↑' : '↓')}
                        </th>

                        {/* Tower/Area Header */}
                        <th
                          className="px-4 py-3 text-left font-bold text-brand-blue w-1/6 cursor-pointer hover:bg-brand-blue-light hover:text-white transition-colors"
                          onClick={() => handleColumnSort('tower')}
                          title="Click to sort"
                        >
                          Tower/Area {columnSort.column === 'tower' && (columnSort.direction === 'asc' ? '↑' : '↓')}
                        </th>

                        {/* Floor/Block Header */}
                        <th
                          className="px-4 py-3 text-left font-bold text-brand-blue w-1/6 cursor-pointer hover:bg-brand-blue-light hover:text-white transition-colors"
                          onClick={() => handleColumnSort('floor')}
                          title="Click to sort"
                        >
                          Floor/Block {columnSort.column === 'floor' && (columnSort.direction === 'asc' ? '↑' : '↓')}
                        </th>

                        {/* Tenant Header */}
                        <th
                          className="px-4 py-3 text-left font-bold text-brand-blue w-1/5 cursor-pointer hover:bg-brand-blue-light hover:text-white transition-colors"
                          onClick={() => handleColumnSort('tenant')}
                          title="Click to sort"
                        >
                          Tenant {columnSort.column === 'tenant' && (columnSort.direction === 'asc' ? '↑' : '↓')}
                        </th>

                        {/* Landlord Header */}
                        <th
                          className="px-4 py-3 text-left font-bold text-brand-blue w-1/5 cursor-pointer hover:bg-brand-blue-light hover:text-white transition-colors"
                          onClick={() => handleColumnSort('landlord')}
                          title="Click to sort"
                        >
                          Landlord {columnSort.column === 'landlord' && (columnSort.direction === 'asc' ? '↑' : '↓')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedUnits(sortUnitsByColumn(allPropertyUnits[property.id])).map((unit) => (
                        <tr key={unit.id} className="border-b border-gray-200 hover:bg-brand-blue-lightest transition-colors">
                          {/* Checkbox Column */}
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedUnits.has(unit.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedUnits);
                                if (e.target.checked) {
                                  newSelected.add(unit.id);
                                } else {
                                  newSelected.delete(unit.id);
                                }
                                setSelectedUnits(newSelected);
                              }}
                              className="w-4 h-4 cursor-pointer"
                            />
                          </td>

                          {/* Unit Code - Read Only */}
                          <td className="px-4 py-3 font-semibold text-brand-blue w-20">
                            {extractUnitCode(unit.name)}
                          </td>

                          {/* Unit Name - Editable */}
                          <td
                            className="px-4 py-3 font-medium text-brand-dark cursor-pointer hover:bg-blue-100"
                            onClick={() => {
                              setEditingCell({ unitId: unit.id, field: 'name' });
                              setEditingValue(unit.name);
                            }}
                          >
                            {editingCell?.unitId === unit.id && editingCell?.field === 'name' ? (
                              <input
                                autoFocus
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={() => handleSaveCell(property.id, unit.id, 'name')}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveCell(property.id, unit.id, 'name');
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="w-full px-2 py-1 border-2 border-brand-blue rounded bg-white focus:outline-none"
                              />
                            ) : (
                              <span>{extractUnitNumber(unit.name)}</span>
                            )}
                          </td>

                          {/* Tower/Area - Read Only */}
                          <td className="px-4 py-3 font-semibold text-brand-blue bg-brand-blue-lightest rounded">
                            {extractTower(unit.name)}
                          </td>

                          {/* Floor/Block - Editable */}
                          <td
                            className="px-4 py-3 text-brand-gray cursor-pointer hover:bg-blue-100"
                            onClick={() => {
                              setEditingCell({ unitId: unit.id, field: 'floor' });
                              setEditingValue(unit.floor?.toString() || '');
                            }}
                          >
                            {editingCell?.unitId === unit.id && editingCell?.field === 'floor' ? (
                              <input
                                autoFocus
                                type="number"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={() => handleSaveCell(property.id, unit.id, 'floor')}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveCell(property.id, unit.id, 'floor');
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="w-full px-2 py-1 border-2 border-brand-blue rounded bg-white focus:outline-none"
                              />
                            ) : (
                              <span>{unit.floor || '—'}</span>
                            )}
                          </td>

                          {/* Tenant */}
                          <td className="px-4 py-3 text-brand-gray italic">
                            {unit.tenant ? `${unit.tenant.firstName} ${unit.tenant.lastName}` : '—'}
                          </td>

                          {/* Landlord */}
                          <td className="px-4 py-3 text-brand-gray italic">
                            {unit.landlord ? unit.landlord.name : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  <div className="mt-4 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg space-y-3">
                    {/* Page Info and Navigation */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="text-sm text-brand-gray font-medium">
                        Showing {allPropertyUnits[property.id].length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, allPropertyUnits[property.id].length)} of {allPropertyUnits[property.id].length} units
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Previous Button */}
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-2 py-1 rounded text-sm border border-brand-gray disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-brand-dark font-medium"
                        >
                          ← Prev
                        </button>

                        {/* Page Numbers */}
                        {Array.from({ length: getTotalPages(allPropertyUnits[property.id]) }, (_, i) => i + 1).map(page => {
                          // Show first page, last page, current page, and neighbors
                          const totalPages = getTotalPages(allPropertyUnits[property.id]);
                          if (
                            page === 1 ||
                            page === totalPages ||
                            page === currentPage ||
                            page === currentPage - 1 ||
                            page === currentPage + 1
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                                  currentPage === page
                                    ? 'bg-brand-blue text-white'
                                    : 'border border-brand-gray hover:bg-gray-100 text-brand-dark'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (
                            (page === 2 && currentPage > 4) ||
                            (page === totalPages - 1 && currentPage < totalPages - 3)
                          ) {
                            return (
                              <span key={page} className="px-2 py-1 text-brand-gray">
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}

                        {/* Next Button */}
                        <button
                          onClick={() => setCurrentPage(p => Math.min(getTotalPages(allPropertyUnits[property.id]), p + 1))}
                          disabled={currentPage === getTotalPages(allPropertyUnits[property.id])}
                          className="px-2 py-1 rounded text-sm border border-brand-gray disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-brand-dark font-medium"
                        >
                          Next →
                        </button>
                      </div>
                    </div>

                    {/* Rows Per Page Selector */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="text-xs text-brand-gray font-medium">Rows per page:</div>
                      <div className="flex gap-2">
                        {[10, 30, 50, 100, 200, 500].map(size => (
                          <button
                            key={size}
                            onClick={() => {
                              setItemsPerPage(size);
                              setCurrentPage(1);
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              itemsPerPage === size
                                ? 'bg-brand-blue text-white'
                                : 'border border-brand-gray hover:bg-gray-100 text-brand-dark'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-gray-50 rounded-lg">
                  <p className="text-brand-gray">No units generated yet</p>
                  <button
                    onClick={() => {
                      setSelectedPropertyId(property.id);
                      setShowGeneratorModal(true);
                    }}
                    className="mt-3 px-4 py-2 rounded-lg bg-brand-blue text-white hover:bg-brand-blue-light transition-colors font-medium"
                  >
                    Generate Units
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* KANBAN VIEW */
        <div className="space-y-4">
          {/* Kanban View Type Toggle */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setKanbanViewType('properties')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                kanbanViewType === 'properties'
                  ? 'bg-brand-blue text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🏢 Properties
            </button>
            <button
              onClick={() => setKanbanViewType('units')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                kanbanViewType === 'units'
                  ? 'bg-brand-blue text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📦 Units
            </button>
          </div>

          {/* Properties View */}
          {kanbanViewType === 'properties' ? (
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
          ) : (
            /* Units View - Individual Unit Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(allPropertyUnits)
                .flat()
                .filter(unit =>
                  unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  extractUnitCode(unit.name).toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((unit) => (
                  <div
                    key={unit.id}
                    className="card hover:shadow-lg transition-shadow border-l-4 border-l-brand-blue flex flex-col"
                  >
                    {/* Unit Header */}
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs font-semibold text-brand-gray uppercase">Unit Code</p>
                          <p className="text-lg font-bold text-brand-blue">{extractUnitCode(unit.name)}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          unit.tenant
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {unit.tenant ? 'Occupied' : 'Vacant'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{unit.name}</p>
                    </div>

                    {/* Unit Details */}
                    <div className="space-y-2 mb-4 flex-1 text-sm">
                      {unit.floor !== undefined && (
                        <div>
                          <p className="text-xs text-brand-gray font-semibold">Floor/Block</p>
                          <p className="text-gray-900">{unit.floor}</p>
                        </div>
                      )}
                      {unit.tenant && (
                        <div>
                          <p className="text-xs text-brand-gray font-semibold">Tenant</p>
                          <p className="text-gray-900">{unit.tenant.firstName} {unit.tenant.lastName}</p>
                        </div>
                      )}
                      {unit.landlord && (
                        <div>
                          <p className="text-xs text-brand-gray font-semibold">Landlord</p>
                          <p className="text-gray-900">{unit.landlord.name}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setEditingCell({ unitId: unit.id, field: 'name' });
                          setEditingValue(unit.name);
                        }}
                        className="w-full text-sm px-3 py-2 rounded-lg bg-brand-blue text-white hover:bg-brand-blue-light transition-colors font-medium"
                      >
                        ✎ Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete unit "${unit.name}"?`)) {
                            // Find the property for this unit and delete it
                            for (const [propertyId, units] of Object.entries(allPropertyUnits)) {
                              if (units.find(u => u.id === unit.id)) {
                                api.delete(`/cmt/properties/${propertyId}/units/${unit.id}`)
                                  .then(() => {
                                    setAllPropertyUnits(prev => ({
                                      ...prev,
                                      [propertyId]: prev[propertyId].filter(u => u.id !== unit.id)
                                    }));
                                  })
                                  .catch(err => alert('Failed to delete unit'));
                                break;
                              }
                            }
                          }
                        }}
                        className="w-full text-sm px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              {Object.values(allPropertyUnits).flat().length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-brand-gray">No units yet. Generate units from properties.</p>
                </div>
              )}
            </div>
          )}
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

      {/* Bulk Unit Generator Modal - Multi-Step */}
      {showGeneratorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 space-y-6">
            {/* Step Indicator */}
            <div className="flex gap-2 justify-center mb-6">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    step === generatorStep
                      ? 'bg-brand-blue text-white'
                      : step < generatorStep
                      ? 'bg-brand-blue-light text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>

            {/* Step 1: Choose Towers or Villas */}
            {generatorStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-brand-blue">Choose Type</h2>
                <p className="text-sm text-brand-gray">Would you like to generate Towers or Villas?</p>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setGeneratorConfig({ ...generatorConfig, mode: 'tower' });
                      setGeneratorStep(2);
                    }}
                    className={`w-full p-4 rounded-lg border-2 font-semibold transition-colors ${
                      generatorConfig.mode === 'tower'
                        ? 'border-brand-blue bg-brand-blue-lightest text-brand-blue'
                        : 'border-gray-200 bg-white text-brand-dark hover:border-brand-blue'
                    }`}
                  >
                    🏢 Towers
                  </button>
                  <button
                    onClick={() => {
                      setGeneratorConfig({ ...generatorConfig, mode: 'villa' });
                      setGeneratorStep(2);
                    }}
                    className={`w-full p-4 rounded-lg border-2 font-semibold transition-colors ${
                      generatorConfig.mode === 'villa'
                        ? 'border-brand-blue bg-brand-blue-lightest text-brand-blue'
                        : 'border-gray-200 bg-white text-brand-dark hover:border-brand-blue'
                    }`}
                  >
                    🏠 Villas
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowGeneratorModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-brand-dark font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Choose X (Towers/Areas) */}
            {generatorStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-brand-blue">How Many {generatorConfig.mode === 'tower' ? 'Towers' : 'Areas'}?</h2>
                <p className="text-sm text-brand-gray">
                  {generatorConfig.mode === 'tower'
                    ? 'Each tower will be named Tower A, Tower B, Tower C, etc.'
                    : 'Each area will be named Area A, Area B, Area C, etc.'}
                </p>

                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-2">Enter number (1-26)</label>
                  <input
                    autoFocus
                    type="number"
                    min="1"
                    max="26"
                    value={generatorConfig.towers}
                    onChange={(e) => setGeneratorConfig({ ...generatorConfig, towers: parseInt(e.target.value) || 1 })}
                    className="input-field text-center text-xl font-bold"
                  />
                  <p className="text-xs text-brand-gray mt-2">
                    Example: 10 = {generatorConfig.mode === 'tower' ? 'Towers A to J' : 'Areas A to J'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setGeneratorStep(1)}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-brand-dark font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setGeneratorStep(3)}
                    className="flex-1 btn-primary"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Choose Y (Floors/Blocks) */}
            {generatorStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-brand-blue">
                  How Many {generatorConfig.mode === 'tower' ? 'Floors' : 'Blocks'} per {generatorConfig.mode === 'tower' ? 'Tower' : 'Area'}?
                </h2>
                <p className="text-sm text-brand-gray text-center">
                  Step 2: X = {generatorConfig.towers} {generatorConfig.mode === 'tower' ? 'Towers' : 'Areas'}
                </p>

                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-2">Enter number</label>
                  <input
                    autoFocus
                    type="number"
                    min="1"
                    value={generatorConfig.floors}
                    onChange={(e) => setGeneratorConfig({ ...generatorConfig, floors: parseInt(e.target.value) || 1 })}
                    className="input-field text-center text-xl font-bold"
                  />
                  <p className="text-xs text-brand-gray mt-2">
                    Example: 30 = {generatorConfig.floors} {generatorConfig.mode === 'tower' ? 'floors' : 'blocks'} per {generatorConfig.mode === 'tower' ? 'tower' : 'area'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setGeneratorStep(2)}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-brand-dark font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setGeneratorStep(4)}
                    className="flex-1 btn-primary"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Choose Z (Units/Villas) */}
            {generatorStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-brand-blue">
                  How Many {generatorConfig.mode === 'tower' ? 'Flats' : 'Villas'} per {generatorConfig.mode === 'tower' ? 'Floor' : 'Block'}?
                </h2>
                <div className="bg-brand-blue-lightest p-3 rounded-lg text-sm text-brand-dark">
                  <p>X = {generatorConfig.towers} {generatorConfig.mode === 'tower' ? 'Towers' : 'Areas'}</p>
                  <p>Y = {generatorConfig.floors} {generatorConfig.mode === 'tower' ? 'Floors' : 'Blocks'} per {generatorConfig.mode === 'tower' ? 'Tower' : 'Area'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-2">Enter number (1-9)</label>
                  <input
                    autoFocus
                    type="number"
                    min="1"
                    max="9"
                    value={generatorConfig.unitsPerFloor}
                    onChange={(e) => setGeneratorConfig({ ...generatorConfig, unitsPerFloor: parseInt(e.target.value) || 1 })}
                    className="input-field text-center text-xl font-bold"
                  />
                  <p className="text-xs text-brand-gray mt-2">
                    Example: 9 = 9 {generatorConfig.mode === 'tower' ? 'flats' : 'villas'} per {generatorConfig.mode === 'tower' ? 'floor' : 'block'}
                  </p>
                </div>

                {/* Preview */}
                <div className="bg-brand-blue-lightest p-4 rounded-lg space-y-2 border-2 border-brand-blue">
                  <p className="text-sm font-bold text-brand-blue">Preview:</p>
                  <p className="text-xs text-brand-dark">
                    <strong>Total Units:</strong> {generatorConfig.towers} × {generatorConfig.floors} × {generatorConfig.unitsPerFloor} = <strong className="text-brand-blue">{generatorConfig.towers * generatorConfig.floors * generatorConfig.unitsPerFloor}</strong> units
                  </p>
                  <p className="text-xs text-brand-dark">
                    <strong>Example Unit Names:</strong>
                  </p>
                  {generatorConfig.mode === 'tower' && (
                    <>
                      <p className="text-xs text-brand-gray ml-3">• Flat 101 Tower A (Tower A, Floor 1, Flat 1)</p>
                      <p className="text-xs text-brand-gray ml-3">• Flat 109 Tower A (Tower A, Floor 1, Flat 9)</p>
                      <p className="text-xs text-brand-gray ml-3">• Flat 201 Tower A (Tower A, Floor 2, Flat 1)</p>
                      <p className="text-xs text-brand-gray ml-3">• Flat 301 Tower B (Tower B, Floor 3, Flat 1)</p>
                    </>
                  )}
                  {generatorConfig.mode === 'villa' && (
                    <>
                      <p className="text-xs text-brand-gray ml-3">• Villa 101 Area A (Area A, Block 1, Villa 1)</p>
                      <p className="text-xs text-brand-gray ml-3">• Villa 109 Area A (Area A, Block 1, Villa 9)</p>
                      <p className="text-xs text-brand-gray ml-3">• Villa 201 Area B (Area B, Block 2, Villa 1)</p>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setGeneratorStep(3)}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-brand-dark font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      handleGenerateUnits();
                      setGeneratorStep(1);
                    }}
                    className="flex-1 btn-primary"
                  >
                    Generate {generatorConfig.towers * generatorConfig.floors * generatorConfig.unitsPerFloor} Units
                  </button>
                </div>
              </div>
            )}
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

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h2 className="text-lg font-bold text-brand-blue">Bulk Edit Units</h2>
            <p className="text-sm text-gray-700">
              Apply changes to <span className="font-semibold">{selectedUnits.size}</span> selected unit{selectedUnits.size !== 1 ? 's' : ''}
            </p>

            {/* Operation Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Edit Type:</label>
              <select
                value={bulkEditConfig.operation}
                onChange={(e) => setBulkEditConfig({ ...bulkEditConfig, operation: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="rename">Prefix Unit Names</option>
                <option value="addFloor">Add to Floor Number</option>
              </select>
            </div>

            {/* Dynamic Input Based on Operation */}
            {bulkEditConfig.operation === 'rename' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Name Prefix:</label>
                <input
                  type="text"
                  value={bulkEditConfig.namePrefix}
                  onChange={(e) => setBulkEditConfig({ ...bulkEditConfig, namePrefix: e.target.value })}
                  placeholder="e.g., 'Flat' or 'Unit'"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
                <p className="text-xs text-gray-500 italic">
                  Example: if prefix is "Tower A", names become "Tower A [current name]"
                </p>
              </div>
            )}

            {bulkEditConfig.operation === 'addFloor' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Add to Floor Number:</label>
                <input
                  type="number"
                  value={bulkEditConfig.addFloor}
                  onChange={(e) => setBulkEditConfig({ ...bulkEditConfig, addFloor: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
                <p className="text-xs text-gray-500 italic">
                  Example: if current floor is 1 and you add 10, new floor will be 11
                </p>
              </div>
            )}

            {/* Preview */}
            <div className="bg-gray-50 rounded p-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Preview of first few changes:</p>
              <div className="space-y-1 text-xs text-gray-700">
                {Array.from(selectedUnits)
                  .slice(0, 3)
                  .map(unitId => {
                    const unit = Object.values(allPropertyUnits)
                      .flat()
                      .find(u => u.id === unitId);
                    if (!unit) return null;
                    let preview = unit.name;
                    if (bulkEditConfig.operation === 'rename' && bulkEditConfig.namePrefix) {
                      preview = `${bulkEditConfig.namePrefix} ${unit.name}`;
                    } else if (bulkEditConfig.operation === 'addFloor') {
                      preview = `Floor: ${(unit.floor || 0) + bulkEditConfig.addFloor}`;
                    }
                    return <div key={unitId}>• {preview}</div>;
                  })}
                {selectedUnits.size > 3 && <div className="text-gray-500">... and {selectedUnits.size - 3} more</div>}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  handleBulkEdit(selectedPropertyId);
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-brand-blue text-white hover:bg-brand-blue-light font-medium"
              >
                Apply Changes
              </button>
              <button
                onClick={() => {
                  setShowBulkEditModal(false);
                  setBulkEditConfig({ namePrefix: '', addFloor: 0, operation: 'rename' });
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h2 className="text-lg font-bold text-red-600">Delete Units?</h2>
            <p className="text-gray-700">
              Are you sure you want to delete <span className="font-semibold">{selectedUnits.size}</span> unit{selectedUnits.size !== 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="max-h-48 overflow-y-auto bg-gray-50 rounded p-3">
              <p className="text-xs text-gray-600 font-semibold mb-2">Units to be deleted:</p>
              <ul className="space-y-1 text-sm text-gray-700">
                {Array.from(selectedUnits).map(unitId => {
                  const unit = Object.values(allPropertyUnits)
                    .flat()
                    .find(u => u.id === unitId);
                  return <li key={unitId}>• {unit?.name || 'Unknown unit'}</li>;
                })}
              </ul>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  handleBulkDelete(selectedPropertyId);
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium"
              >
                Delete {selectedUnits.size} Unit{selectedUnits.size !== 1 ? 's' : ''}
              </button>
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
