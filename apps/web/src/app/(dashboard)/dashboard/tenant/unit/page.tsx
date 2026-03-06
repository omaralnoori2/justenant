'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface Unit {
  id: string;
  name: string;
  floor?: number;
  unitNumber?: number;
  isOccupied: boolean;
  property: {
    id: string;
    name: string;
    address: string;
    type: string;
    landlord?: {
      id: string;
      firstName: string;
      lastName: string;
      phone?: string;
      user?: {
        email: string;
      };
    };
  };
}

interface TenantProfile {
  leaseStart?: string;
  leaseEnd?: string;
  phone?: string;
  firstName: string;
  lastName: string;
}

export default function TenantUnitPage() {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tenant/unit').then((r) => setUnit(r.data)),
      api.get('/tenant/profile').then((r) => setProfile(r.data)),
    ])
      .catch(() => {
        setUnit(null);
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading unit information...</div>;

  if (!unit) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/tenant" className="text-brand hover:underline text-sm">
          ← Back to Dashboard
        </Link>
        <div className="card">
          <p className="text-gray-500">No unit assigned to your account yet.</p>
        </div>
      </div>
    );
  }

  const getLeaseDaysRemaining = () => {
    if (!profile?.leaseEnd) return null;
    const endDate = new Date(profile.leaseEnd);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysRemaining;
  };

  const daysRemaining = getLeaseDaysRemaining();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/tenant" className="text-brand hover:underline text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{unit.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{unit.property.name}</p>
        </div>
      </div>

      {/* Unit Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Unit Information */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Unit Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Unit Name</p>
              <p className="text-gray-900 font-medium mt-1">{unit.name}</p>
            </div>
            {unit.floor !== null && unit.floor !== undefined && (
              <div>
                <p className="text-sm text-gray-500">Floor</p>
                <p className="text-gray-900 font-medium mt-1">{unit.floor}</p>
              </div>
            )}
            {unit.unitNumber !== null && unit.unitNumber !== undefined && (
              <div>
                <p className="text-sm text-gray-500">Unit Number</p>
                <p className="text-gray-900 font-medium mt-1">{unit.unitNumber}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Property Type</p>
              <p className="text-gray-900 font-medium mt-1">
                {unit.property.type === 'TOWER' ? 'Tower' : 'Villa'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span
                className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold ${
                  unit.isOccupied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {unit.isOccupied ? 'Occupied' : 'Vacant'}
              </span>
            </div>
          </div>
        </div>

        {/* Property Information */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Property Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Property Name</p>
              <p className="text-gray-900 font-medium mt-1">{unit.property.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="text-gray-900 font-medium mt-1">{unit.property.address}</p>
            </div>
            {unit.property.landlord && (
              <div>
                <p className="text-sm text-gray-500">Landlord</p>
                <p className="text-gray-900 font-medium mt-1">
                  {unit.property.landlord.firstName} {unit.property.landlord.lastName}
                </p>
                {unit.property.landlord.phone && (
                  <p className="text-sm text-gray-600 mt-1">
                    <a href={`tel:${unit.property.landlord.phone}`} className="text-brand hover:underline">
                      {unit.property.landlord.phone}
                    </a>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lease Information */}
      {profile?.leaseStart && profile?.leaseEnd && (
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Lease Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Lease Start</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {new Date(profile.leaseStart).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Lease End</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {new Date(profile.leaseEnd).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Days Remaining</p>
              {daysRemaining !== null && (
                <p
                  className={`text-lg font-bold mt-1 ${
                    daysRemaining > 30
                      ? 'text-green-600'
                      : daysRemaining > 0
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tenant Information */}
      {profile && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-gray-900 font-medium mt-1">
                {profile.firstName} {profile.lastName}
              </p>
            </div>
            {profile.phone && (
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-gray-900 font-medium mt-1">
                  <a href={`tel:${profile.phone}`} className="text-brand hover:underline">
                    {profile.phone}
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/tenant/maintenance"
          className="card hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Submit Maintenance Request</p>
              <p className="text-sm text-gray-500 mt-1">Report any issues with your unit</p>
            </div>
            <div className="text-2xl">🔧</div>
          </div>
        </Link>

        <Link
          href="/dashboard/tenant/contacts"
          className="card hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">View Contacts</p>
              <p className="text-sm text-gray-500 mt-1">Landlord, CMT, service providers</p>
            </div>
            <div className="text-2xl">📞</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
