'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Unit {
  id: string;
  name: string;
  floor?: number;
  unitNumber?: number;
  isOccupied: boolean;
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    leaseStart?: string;
    leaseEnd?: string;
    user?: {
      email: string;
    };
  };
}

interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  createdAt: string;
  units: Unit[];
}

type ColumnSortType = 'unitCode' | 'unitName' | 'tenant' | 'floor';
type SortDirection = 'asc' | 'desc';

export default function PropertyDetailsPage() {
  const params = useParams();
  const propertyId = params?.propertyId as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [showUnitModal, setShowUnitModal] = useState(false);

  // Sorting and pagination
  const [columnSort, setColumnSort] = useState<{ column: ColumnSortType; direction: SortDirection }>({
    column: 'unitCode',
    direction: 'asc',
  });
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk operations
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  useEffect(() => {
    api
      .get(`/landlord/properties/${propertyId}`)
      .then((r) => setProperty(r.data))
      .catch(() => setProperty(null))
      .finally(() => setLoading(false));
  }, [propertyId]);

  // Helper functions
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

  const getPaginatedUnits = (units: Unit[]): Unit[] => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    return units.slice(startIdx, endIdx);
  };

  const getTotalPages = (units: Unit[]): number => {
    return Math.ceil(units.length / itemsPerPage);
  };

  const handleColumnSort = (column: ColumnSortType) => {
    setColumnSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const handleBulkDelete = async () => {
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

      // Refresh property
      const res = await api.get(`/landlord/properties/${propertyId}`);
      setProperty(res.data);

      setSelectedUnits(new Set());
      setShowBulkDeleteModal(false);
      alert(`Deleted ${selectedUnits.size} units`);
    } catch (err) {
      alert('Failed to delete units');
    }
  };

  if (loading) return <div className="text-gray-500">Loading property...</div>;

  if (!property) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/landlord/properties" className="text-brand hover:underline text-sm">
          ← Back to Properties
        </Link>
        <div className="card">
          <p className="text-gray-500">Property not found</p>
        </div>
      </div>
    );
  }

  const occupiedUnits = property.units.filter((u) => u.tenant).length;
  const occupancyRate = property.units.length > 0 ? (occupiedUnits / property.units.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/landlord/properties" className="text-brand-blue hover:underline text-sm mb-2 inline-block">
          ← Back to Properties
        </Link>
        <h1 className="text-2xl font-bold text-brand-blue">{property.name}</h1>
        <p className="text-brand-gray text-sm mt-1">{property.address}</p>
      </div>

      {/* Property Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Property Type</p>
          <p className="text-xl font-bold text-gray-900 mt-2">
            {property.type === 'TOWER' ? 'Tower' : 'Villa'}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Units</p>
          <p className="text-xl font-bold text-gray-900 mt-2">{property.units.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Occupancy Rate</p>
          <p className="text-xl font-bold text-gray-900 mt-2">{occupancyRate.toFixed(0)}%</p>
        </div>
      </div>

      {/* Occupancy Progress */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50">
        <p className="text-sm font-medium text-gray-700 mb-3">Unit Occupancy</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-600 h-4 rounded-full transition-all"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {occupiedUnits}/{property.units.length}
            </p>
            <p className="text-xs text-gray-500">{occupancyRate.toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Units Table */}
      <div className="card">
        <h2 className="text-lg font-bold text-brand-blue mb-4">Units</h2>

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
                onClick={() => setShowBulkDeleteModal(true)}
                className="px-3 py-1 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-brand-blue-lightest border-b-2 border-brand-blue">
              <tr>
                <th className="px-3 py-3 text-center font-bold text-brand-blue w-12">
                  <input
                    type="checkbox"
                    checked={
                      getPaginatedUnits(sortUnitsByColumn(property.units)).length > 0 &&
                      getPaginatedUnits(sortUnitsByColumn(property.units)).every(u =>
                        selectedUnits.has(u.id)
                      )
                    }
                    onChange={(e) => {
                      const paginatedUnits = getPaginatedUnits(sortUnitsByColumn(property.units));
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
                  className="px-4 py-3 text-left font-bold text-brand-blue w-1/4 cursor-pointer hover:bg-brand-blue-light hover:text-white transition-colors"
                  onClick={() => handleColumnSort('unitName')}
                  title="Click to sort"
                >
                  Unit Name {columnSort.column === 'unitName' && (columnSort.direction === 'asc' ? '↑' : '↓')}
                </th>

                <th
                  className="px-4 py-3 text-left font-bold text-brand-blue w-1/5 cursor-pointer hover:bg-brand-blue-light hover:text-white transition-colors"
                  onClick={() => handleColumnSort('tenant')}
                  title="Click to sort"
                >
                  Tenant {columnSort.column === 'tenant' && (columnSort.direction === 'asc' ? '↑' : '↓')}
                </th>

                <th className="px-4 py-3 text-left font-bold text-brand-blue w-24">Status</th>
                <th className="px-4 py-3 text-left font-bold text-brand-blue w-32">Lease End</th>
              </tr>
            </thead>
            <tbody>
              {property.units.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-gray-500 text-sm text-center">
                    No units in this property
                  </td>
                </tr>
              ) : (
                getPaginatedUnits(sortUnitsByColumn(property.units)).map((unit) => (
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

                    <td className="px-4 py-3 text-sm text-brand-gray">
                      {unit.tenant?.leaseEnd ? new Date(unit.tenant.leaseEnd).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {property.units.length > 0 && (
            <div className="mt-4 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-sm text-brand-gray font-medium">
                  Showing {(currentPage - 1) * itemsPerPage + 1}–
                  {Math.min(currentPage * itemsPerPage, property.units.length)} of {property.units.length} units
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded text-sm border border-brand-gray disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-brand-dark font-medium"
                  >
                    ← Prev
                  </button>

                  {Array.from({ length: getTotalPages(property.units) }, (_, i) => i + 1).map(page => {
                    const totalPages = getTotalPages(property.units);
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
                    } else if ((page === 2 && currentPage > 4) || (page === totalPages - 1 && currentPage < totalPages - 3)) {
                      return (
                        <span key={page} className="px-2 py-1 text-brand-gray">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(getTotalPages(property.units), p + 1))}
                    disabled={currentPage === getTotalPages(property.units)}
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
          )}
        </div>
      </div>

      {/* Unit Details Modal */}
      {showUnitModal && selectedUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedUnit.name}</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Unit Status</p>
                <span
                  className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold ${
                    selectedUnit.tenant
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {selectedUnit.tenant ? 'Occupied' : 'Vacant'}
                </span>
              </div>

              {selectedUnit.tenant && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tenant</p>
                    <p className="text-gray-900 mt-1">
                      {selectedUnit.tenant.firstName} {selectedUnit.tenant.lastName}
                    </p>
                  </div>

                  {selectedUnit.tenant.phone && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <a
                        href={`tel:${selectedUnit.tenant.phone}`}
                        className="text-brand hover:underline mt-1"
                      >
                        {selectedUnit.tenant.phone}
                      </a>
                    </div>
                  )}

                  {selectedUnit.tenant.user?.email && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <a
                        href={`mailto:${selectedUnit.tenant.user.email}`}
                        className="text-brand hover:underline mt-1"
                      >
                        {selectedUnit.tenant.user.email}
                      </a>
                    </div>
                  )}

                  {selectedUnit.tenant.leaseStart && selectedUnit.tenant.leaseEnd && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Lease Period</p>
                      <p className="text-gray-900 mt-1">
                        {new Date(selectedUnit.tenant.leaseStart).toLocaleDateString()} to{' '}
                        {new Date(selectedUnit.tenant.leaseEnd).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setShowUnitModal(false);
                  setSelectedUnit(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
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
              Are you sure you want to delete <span className="font-semibold">{selectedUnits.size}</span> unit
              {selectedUnits.size !== 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="max-h-48 overflow-y-auto bg-gray-50 rounded p-3">
              <p className="text-xs text-gray-600 font-semibold mb-2">Units to be deleted:</p>
              <ul className="space-y-1 text-sm text-gray-700">
                {Array.from(selectedUnits).map(unitId => {
                  const unit = property?.units.find(u => u.id === unitId);
                  return <li key={unitId}>• {unit?.name || 'Unknown unit'}</li>;
                })}
              </ul>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  handleBulkDelete();
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
