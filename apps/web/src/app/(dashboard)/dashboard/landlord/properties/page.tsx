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
  units: Array<{
    id: string;
    name: string;
    tenant?: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
  _count: {
    units: number;
  };
}

export default function LandlordPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    api
      .get('/landlord/properties')
      .then((r) => setProperties(r.data))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, []);

  const getOccupancyPercentage = (property: Property) => {
    if (property._count.units === 0) return 0;
    const occupied = property.units.filter((u) => u.tenant).length;
    return Math.round((occupied / property._count.units) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/landlord" className="text-brand hover:underline text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
          <p className="text-gray-500 text-sm mt-1">Properties you own and manage</p>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading properties...</div>
      ) : properties.length === 0 ? (
        <div className="card">
          <p className="text-gray-500 text-sm">
            No properties yet. Contact your CMT to add a property.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((property) => {
            const occupiedUnits = property.units.filter((u) => u.tenant).length;
            const occupancyPercentage = getOccupancyPercentage(property);

            return (
              <div key={property.id} className="card hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900">{property.name}</h2>
                    <p className="text-sm text-gray-600 mt-1">{property.address}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Type: {property.type === 'TOWER' ? 'Tower' : 'Villa'} •{' '}
                      {property._count.units} units
                    </p>

                    {/* Occupancy Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-600">Occupancy</p>
                        <p className="text-xs font-medium text-gray-900">
                          {occupiedUnits}/{property._count.units} ({occupancyPercentage}%)
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            occupancyPercentage >= 80
                              ? 'bg-green-600'
                              : occupancyPercentage >= 50
                              ? 'bg-blue-600'
                              : 'bg-yellow-600'
                          }`}
                          style={{ width: `${occupancyPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-4xl ml-4">🏢</div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/dashboard/landlord/properties/${property.id}`}
                    className="flex-1 px-3 py-2 bg-brand text-white rounded text-sm font-medium hover:opacity-90 text-center"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedProperty(property);
                      setShowDetailsModal(true);
                    }}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50"
                  >
                    Units
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Units Modal */}
      {showDetailsModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 p-6 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Units in {selectedProperty.name}
            </h2>

            <div className="space-y-3">
              {selectedProperty.units.length === 0 ? (
                <p className="text-gray-500 text-sm">No units in this property</p>
              ) : (
                selectedProperty.units.map((unit) => (
                  <div key={unit.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{unit.name}</p>
                        {unit.tenant ? (
                          <p className="text-sm text-gray-600 mt-1">
                            Tenant: {unit.tenant.firstName} {unit.tenant.lastName}
                          </p>
                        ) : (
                          <p className="text-sm text-yellow-600 mt-1">Vacant</p>
                        )}
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
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedProperty(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {selectedProperty && (
                <Link
                  href={`/dashboard/landlord/properties/${selectedProperty.id}`}
                  className="flex-1 px-4 py-2 bg-brand text-white rounded-md hover:opacity-90 text-center"
                >
                  View Details
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
