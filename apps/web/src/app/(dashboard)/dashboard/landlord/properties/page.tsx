'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface Unit {
  id: string;
  name: string;
  floor?: number;
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  logo?: string;
  createdAt: string;
  units: Unit[];
  _count: {
    units: number;
  };
}

type ViewType = 'spreadsheet' | 'kanban';
type ColumnSortType = 'unitCode' | 'unitName' | 'tenant' | 'floor';
type SortDirection = 'asc' | 'desc';

export default function LandlordPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [allPropertyUnits, setAllPropertyUnits] = useState<Record<string, Unit[]>>({});
  const [loading, setLoading] = useState(true);

  // View and sorting states
  const [viewType, setViewType] = useState<ViewType>('spreadsheet');
  const [searchQuery, setSearchQuery] = useState('');
  const [columnSort, setColumnSort] = useState<{ column: ColumnSortType; direction: SortDirection }>({
    column: 'unitCode',
    direction: 'asc',
  });

  // Pagination states
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk operations
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');

  // Kanban view toggle
  const [kanbanViewType, setKanbanViewType] = useState<'properties' | 'units'>('properties');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/landlord/properties');
      setProperties(res.data);

      // Organize units by property
      const unitsMap: Record<string, Unit[]> = {};
      for (const property of res.data) {
        unitsMap[property.id] = property.units || [];
      }
      setAllPropertyUnits(unitsMap);
    } catch (err) {
      console.error('Failed to fetch properties', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for unit code extraction
  const extractTowerLetter = (unitName: string): string => {
    const match = unitName.match(/Tower\s+([A-Z])|Area\s+([A-Z])/);
    return match ? (match[1] || match[2] || '') : '';
  };

  const extractNumericPart = (unitName: string): string => {
    const match = unitName.match(/\d+/);
    return match ? match[0] : '';
  };

  const extractUnitCode = (unitName: string): string => {
    const letter = extractTowerLetter(unitName);
    const numeric = extractNumericPart(unitName);
    return letter && numeric ? `${letter}${numeric}` : '—';
  };

  // Sorting function
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
          return compareValues(a.name, b.name);
        case 'tenant':
          const tenantA = a.tenant ? `${a.tenant.firstName} ${a.tenant.lastName}` : '';
          const tenantB = b.tenant ? `${b.tenant.firstName} ${b.tenant.lastName}` : '';
          return compareValues(tenantA, tenantB);
        case 'floor':
          return compareValues(a.floor || 0, b.floor || 0);
        default:
          return 0;
      }
    });

    return sorted;
  };

  // Pagination
  const getPaginatedUnits = (units: Unit[]): Unit[] => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    return units.slice(startIdx, endIdx);
  };

  const getTotalPages = (units: Unit[]): number => {
    return Math.ceil(units.length / itemsPerPage);
  };

  // Handle column sort
  const handleColumnSort = (column: ColumnSortType) => {
    setColumnSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  // Handle bulk delete
  const handleBulkDelete = async (propertyId: string) => {
    if (selectedUnits.size === 0) {
      alert('No units selected');
      return;
    }

    if (!confirm(`Delete ${selectedUnits.size} units?`)) return;

    try {
      const unitIdsToDelete = Array.from(selectedUnits);
      for (const unitId of unitIdsToDelete) {
        try {
          await api.delete(`/landlord/properties/${propertyId}/units/${unitId}`);
        } catch (err) {
          console.error(`Failed to delete unit ${unitId}`, err);
        }
      }

      setAllPropertyUnits(prev => ({
        ...prev,
        [propertyId]: prev[propertyId]?.filter(u => !selectedUnits.has(u.id)) || []
      }));

      setSelectedUnits(new Set());
      setShowBulkDeleteModal(false);
      alert(`Deleted ${selectedUnits.size} units`);
    } catch (err) {
      alert('Failed to delete units');
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading properties...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/landlord" className="text-brand hover:underline text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-brand-blue">My Properties</h1>
          <p className="text-brand-gray text-sm mt-1">Manage your properties and units</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewType('spreadsheet')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewType === 'spreadsheet'
                ? 'bg-brand-blue text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📋 Spreadsheet
          </button>
          <button
            onClick={() => setViewType('kanban')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewType === 'kanban'
                ? 'bg-brand-blue text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📊 Kanban
          </button>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search properties or units..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
      </div>

      {properties.length === 0 ? (
        <div className="card">
          <p className="text-brand-gray text-sm">
            No properties yet. Contact your CMT to add a property.
          </p>
        </div>
      ) : viewType === 'spreadsheet' ? (
        /* SPREADSHEET VIEW */
        <div className="space-y-6">
          {properties
            .filter(p =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.address.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((property) => (
              <div key={property.id} className="card border-l-4 border-l-brand-blue">
                {/* Compound Header */}
                <div className="mb-4 pb-4 border-b-2 border-brand-blue">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-shrink-0">
                      {property.logo ? (
                        <img
                          src={property.logo}
                          alt={property.name}
                          className="h-12 w-12 rounded-lg object-cover border border-brand-blue-lightest"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-brand-blue-lightest border border-brand-blue flex items-center justify-center text-brand-blue font-bold">
                          {property.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="px-3 py-1 rounded-full bg-brand-blue-lightest text-brand-blue font-semibold text-sm">
                      {allPropertyUnits[property.id]?.length || 0} units
                    </span>
                  </div>

                  <div className="text-center mb-3">
                    <h3 className="text-xl font-bold text-brand-blue mb-1">{property.name}</h3>
                    <p className="text-sm text-brand-gray">{property.address}</p>
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
                          <th className="px-3 py-3 text-center font-bold text-brand-blue w-12">
                            <input
                              type="checkbox"
                              checked={
                                getPaginatedUnits(sortUnitsByColumn(allPropertyUnits[property.id])).length > 0 &&
                                getPaginatedUnits(sortUnitsByColumn(allPropertyUnits[property.id])).every(u =>
                                  selectedUnits.has(u.id)
                                )
                              }
                              onChange={(e) => {
                                const paginatedUnits = getPaginatedUnits(
                                  sortUnitsByColumn(allPropertyUnits[property.id])
                                );
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

                          <th
                            className="px-4 py-3 text-left font-bold text-brand-blue w-20 cursor-pointer hover:bg-brand-blue-light hover:text-white transition-colors"
                            onClick={() => handleColumnSort('unitCode')}
                            title="Click to sort"
                          >
                            Unit Code {columnSort.column === 'unitCode' && (columnSort.direction === 'asc' ? '↑' : '↓')}
                          </th>

                          <th
                            className="px-4 py-3 text-left font-bold text-brand-blue w-1/3 cursor-pointer hover:bg-brand-blue-light hover:text-white transition-colors"
                            onClick={() => handleColumnSort('unitName')}
                            title="Click to sort"
                          >
                            Unit Name {columnSort.column === 'unitName' && (columnSort.direction === 'asc' ? '↑' : '↓')}
                          </th>

                          <th
                            className="px-4 py-3 text-left font-bold text-brand-blue w-20 cursor-pointer hover:bg-brand-blue-light hover:text-white transition-colors"
                            onClick={() => handleColumnSort('floor')}
                            title="Click to sort"
                          >
                            Floor {columnSort.column === 'floor' && (columnSort.direction === 'asc' ? '↑' : '↓')}
                          </th>

                          <th
                            className="px-4 py-3 text-left font-bold text-brand-blue w-1/3 cursor-pointer hover:bg-brand-blue-light hover:text-white transition-colors"
                            onClick={() => handleColumnSort('tenant')}
                            title="Click to sort"
                          >
                            Tenant {columnSort.column === 'tenant' && (columnSort.direction === 'asc' ? '↑' : '↓')}
                          </th>

                          <th className="px-4 py-3 text-left font-bold text-brand-blue w-24">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getPaginatedUnits(sortUnitsByColumn(allPropertyUnits[property.id])).map((unit) => (
                          <tr key={unit.id} className="border-b border-gray-200 hover:bg-brand-blue-lightest transition-colors">
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

                            <td className="px-4 py-3 font-semibold text-brand-blue">
                              {extractUnitCode(unit.name)}
                            </td>

                            <td className="px-4 py-3 font-medium text-brand-dark">{unit.name}</td>

                            <td className="px-4 py-3 text-brand-gray">{unit.floor || '—'}</td>

                            <td className="px-4 py-3 text-brand-gray italic">
                              {unit.tenant ? `${unit.tenant.firstName} ${unit.tenant.lastName}` : '—'}
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  unit.tenant ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {unit.tenant ? 'Occupied' : 'Vacant'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination Controls */}
                    <div className="mt-4 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="text-sm text-brand-gray font-medium">
                          Showing{' '}
                          {allPropertyUnits[property.id].length > 0
                            ? (currentPage - 1) * itemsPerPage + 1
                            : 0}
                          –
                          {Math.min(currentPage * itemsPerPage, allPropertyUnits[property.id].length)} of{' '}
                          {allPropertyUnits[property.id].length} units
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-2 py-1 rounded text-sm border border-brand-gray disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-brand-dark font-medium"
                          >
                            ← Prev
                          </button>

                          {Array.from(
                            { length: getTotalPages(allPropertyUnits[property.id]) },
                            (_, i) => i + 1
                          ).map(page => {
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

                          <button
                            onClick={() =>
                              setCurrentPage(p =>
                                Math.min(getTotalPages(allPropertyUnits[property.id]), p + 1)
                              )
                            }
                            disabled={
                              currentPage === getTotalPages(allPropertyUnits[property.id])
                            }
                            className="px-2 py-1 rounded text-sm border border-brand-gray disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-brand-dark font-medium"
                          >
                            Next →
                          </button>
                        </div>
                      </div>

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
                    <p className="text-brand-gray">No units in this property</p>
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

          {kanbanViewType === 'properties' ? (
            /* Properties Kanban */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties
                .filter(p =>
                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.address.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((property) => {
                  const occupied = property.units.filter(u => u.tenant).length;
                  const occupancy = property._count.units > 0 ? (occupied / property._count.units) * 100 : 0;

                  return (
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
                          {property._count.units} units
                        </span>
                      </div>

                      <div className="mb-4 flex-1">
                        <p className="text-xs font-semibold text-brand-gray uppercase mb-2">Occupancy</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${occupancy}%` }}
                          />
                        </div>
                        <p className="text-xs text-brand-gray">
                          {occupied}/{property._count.units} ({Math.round(occupancy)}%)
                        </p>
                      </div>

                      <Link
                        href={`/dashboard/landlord/properties/${property.id}`}
                        className="w-full text-sm px-3 py-2 rounded-lg bg-brand-blue text-white hover:bg-brand-blue-light transition-colors font-medium text-center"
                      >
                        View Details
                      </Link>
                    </div>
                  );
                })}
            </div>
          ) : (
            /* Units Kanban */
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
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs font-semibold text-brand-gray uppercase">Unit Code</p>
                          <p className="text-lg font-bold text-brand-blue">{extractUnitCode(unit.name)}</p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            unit.tenant
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {unit.tenant ? 'Occupied' : 'Vacant'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{unit.name}</p>
                    </div>

                    <div className="space-y-2 mb-4 flex-1 text-sm">
                      {unit.floor !== undefined && (
                        <div>
                          <p className="text-xs text-brand-gray font-semibold">Floor</p>
                          <p className="text-gray-900">{unit.floor}</p>
                        </div>
                      )}
                      {unit.tenant && (
                        <div>
                          <p className="text-xs text-brand-gray font-semibold">Tenant</p>
                          <p className="text-gray-900">
                            {unit.tenant.firstName} {unit.tenant.lastName}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              {Object.values(allPropertyUnits).flat().length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-brand-gray">No units yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <h2 className="text-lg font-bold text-red-600">Delete Units?</h2>
            <p className="text-gray-700">
              Are you sure you want to delete{' '}
              <span className="font-semibold">{selectedUnits.size}</span> unit
              {selectedUnits.size !== 1 ? 's' : ''}? This action cannot be undone.
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
