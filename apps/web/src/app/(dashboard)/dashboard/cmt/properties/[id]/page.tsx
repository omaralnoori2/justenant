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
}

interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  units: Unit[];
}

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params?.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [towerCount, setTowerCount] = useState(10);
  const [floorCount, setFloorCount] = useState(30);
  const [unitsPerFloor, setUnitsPerFloor] = useState(9);

  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const res = await api.get(`/cmt/properties/${propertyId}`);
      setProperty(res.data);
    } catch (err) {
      console.error('Failed to fetch property', err);
      setProperty(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateUnits = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.post(`/cmt/properties/${propertyId}/generate-units`, {
        towerCount,
        floorCount,
        unitsPerFloor,
      });
      alert(`Generated ${res.data.generated} units!`);
      fetchProperty();
    } catch (err) {
      console.error('Failed to generate units', err);
      alert('Failed to generate units');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading property...</div>;

  if (!property) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/cmt/properties" className="text-brand hover:underline text-sm">
          ← Back to Properties
        </Link>
        <div className="card">
          <p className="text-gray-500">Property not found</p>
        </div>
      </div>
    );
  }

  const totalUnitsToGenerate = towerCount * floorCount * unitsPerFloor;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/cmt/properties" className="text-brand hover:underline text-sm mb-2 inline-block">
          ← Back to Properties
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
        <p className="text-gray-600 text-sm mt-1">{property.address}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Property Type</p>
          <p className="text-xl font-bold text-gray-900 mt-2">{property.type}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Units</p>
          <p className="text-xl font-bold text-gray-900 mt-2">{property.units.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Occupied Units</p>
          <p className="text-xl font-bold text-gray-900 mt-2">{property.units.filter(u => u.isOccupied).length}</p>
        </div>
      </div>

      <div className="card border-l-4 border-l-blue-500">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Bulk Generate Units</h2>
        <form onSubmit={handleGenerateUnits} className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Generate units with Tower naming format: Flat [floor][unit] Tower [A-Z]
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Towers (X)
              </label>
              <input
                type="number"
                min="1"
                value={towerCount}
                onChange={(e) => setTowerCount(parseInt(e.target.value) || 1)}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">Tower A through Z</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floors per Tower (Y)
              </label>
              <input
                type="number"
                min="1"
                value={floorCount}
                onChange={(e) => setFloorCount(parseInt(e.target.value) || 1)}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">Floors 1 to 30</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Units per Floor (Z)
              </label>
              <input
                type="number"
                min="1"
                value={unitsPerFloor}
                onChange={(e) => setUnitsPerFloor(parseInt(e.target.value) || 1)}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">Units 1-9+</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900">
              Total units: {towerCount} × {floorCount} × {unitsPerFloor} = {totalUnitsToGenerate.toLocaleString()} units
            </p>
          </div>

          <button
            type="submit"
            disabled={generating}
            className="btn-primary"
          >
            {generating ? 'Generating...' : 'Generate Units'}
          </button>
        </form>
      </div>

      {property.units.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Units ({property.units.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Unit Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Floor</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {property.units.slice(0, 20).map((unit) => (
                  <tr key={unit.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{unit.name}</td>
                    <td className="px-4 py-3 text-gray-600">{unit.floor || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        unit.isOccupied ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {unit.isOccupied ? 'Occupied' : 'Vacant'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {property.units.length > 20 && (
              <p className="px-4 py-3 text-sm text-gray-500">
                Showing 20 of {property.units.length} units
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
