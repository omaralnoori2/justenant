'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface TenantProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  leaseStart?: string;
  leaseEnd?: string;
  unit?: {
    id: string;
    name: string;
    floor?: number;
    unitNumber?: number;
    property: {
      id: string;
      name: string;
      address: string;
      type: string;
    };
  };
}

interface MaintenanceStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export default function TenantDashboardPage() {
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [stats, setStats] = useState<MaintenanceStats>({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tenant/profile').then((r) => setProfile(r.data)),
      api.get('/tenant/maintenance-stats').then((r) => setStats(r.data)),
    ])
      .catch(() => {
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {profile?.firstName || 'Tenant'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manage your unit and maintenance requests</p>
      </div>

      {/* Unit Assignment Card */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">My Unit</p>
            {profile?.unit ? (
              <div className="mt-3">
                <p className="text-xl font-bold text-gray-900">{profile.unit.name}</p>
                <p className="text-sm text-gray-600 mt-1">{profile.unit.property.name}</p>
                <p className="text-sm text-gray-500">{profile.unit.property.address}</p>
                {profile.leaseStart && profile.leaseEnd && (
                  <p className="text-xs text-gray-500 mt-2">
                    Lease: {new Date(profile.leaseStart).toLocaleDateString()} to{' '}
                    {new Date(profile.leaseEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-lg text-gray-500 mt-2">No unit assigned yet</p>
            )}
          </div>
          {profile?.unit && (
            <Link
              href="/dashboard/tenant/unit"
              className="text-brand hover:underline text-sm font-medium"
            >
              View Details →
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Requests"
          value={stats.totalRequests}
          color="text-blue-600"
        />
        <StatCard
          label="Pending"
          value={stats.pendingRequests}
          color="text-yellow-600"
        />
        <StatCard
          label="Completed"
          value={stats.completedRequests}
          color="text-green-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/tenant/maintenance" className="card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Maintenance Requests</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalRequests}</p>
            </div>
            <div className="text-3xl">🔧</div>
          </div>
          <button className="mt-4 text-brand text-sm font-medium hover:underline">
            View All →
          </button>
        </Link>

        <Link href="/dashboard/tenant/unit" className="card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Unit Information</p>
              <p className="text-xl font-bold text-gray-900 mt-2">
                {profile?.unit?.name || 'Not assigned'}
              </p>
            </div>
            <div className="text-3xl">🏠</div>
          </div>
          <button className="mt-4 text-brand text-sm font-medium hover:underline">
            View Details →
          </button>
        </Link>
      </div>

      {/* Support Card */}
      <Link href="/dashboard/tenant/contacts" className="card bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Need Help?</p>
            <p className="text-gray-700 mt-2">Contact your landlord, CMT, or service providers</p>
          </div>
          <div className="text-3xl">📞</div>
        </div>
        <button className="mt-4 text-brand text-sm font-medium hover:underline">
          View Contacts →
        </button>
      </Link>
    </div>
  );
}
