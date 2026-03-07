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

export default function PropertyDetailsPage() {
  const params = useParams();
  const propertyId = params?.propertyId as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [showUnitModal, setShowUnitModal] = useState(false);

  useEffect(() => {
    api
      .get(`/landlord/properties/${propertyId}`)
      .then((r) => setProperty(r.data))
      .catch(() => setProperty(null))
      .finally(() => setLoading(false));
  }, [propertyId]);

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
        <Link href="/dashboard/landlord/properties" className="text-brand hover:underline text-sm mb-2 inline-block">
          ← Back to Properties
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
        <p className="text-gray-500 text-sm mt-1">{property.address}</p>
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
        <h2 className="text-lg font-bold text-gray-900 mb-4">Units</h2>
        <div className="overflow-hidden border rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Lease End</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {property.units.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-gray-500 text-sm text-center">
                    No units in this property
                  </td>
                </tr>
              ) : (
                property.units.map((unit) => (
                  <tr key={unit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{unit.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {unit.tenant ? `${unit.tenant.firstName} ${unit.tenant.lastName}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          unit.tenant
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {unit.tenant ? 'Occupied' : 'Vacant'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {unit.tenant?.leaseEnd
                        ? new Date(unit.tenant.leaseEnd).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => {
                          setSelectedUnit(unit);
                          setShowUnitModal(true);
                        }}
                        className="text-brand hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
    </div>
  );
}
