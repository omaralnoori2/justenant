'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface DashboardStats {
  properties: number;
  totalUnits: number;
  activeUnits: number;
  vacantUnits: number;
}

interface RentalStats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}

export default function LandlordDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    properties: 0,
    totalUnits: 0,
    activeUnits: 0,
    vacantUnits: 0,
  });
  const [rentalStats, setRentalStats] = useState<RentalStats>({
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    occupancyRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/landlord/dashboard-stats').then((r) => setStats(r.data)),
      api.get('/landlord/rental-stats').then((r) => setRentalStats(r.data)),
    ])
      .catch(() => {
        setStats({ properties: 0, totalUnits: 0, activeUnits: 0, vacantUnits: 0 });
        setRentalStats({ totalProperties: 0, totalUnits: 0, occupiedUnits: 0, occupancyRate: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Landlord Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your properties and tenants</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Properties" value={stats.properties} color="text-brand" />
        <StatCard label="Total Units" value={stats.totalUnits} color="text-blue-600" />
        <StatCard label="Active Units" value={stats.activeUnits} color="text-green-600" />
        <StatCard label="Vacant Units" value={stats.vacantUnits} color="text-yellow-600" />
      </div>

      {/* Occupancy Summary */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 font-medium">Total Properties</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{rentalStats.totalProperties}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Total Units</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{rentalStats.totalUnits}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Occupancy Rate</p>
            <div className="mt-2 flex items-center">
              <div className="flex-1 bg-gray-200 rounded-full h-3 mr-3">
                <div
                  className="bg-green-600 h-3 rounded-full"
                  style={{ width: `${rentalStats.occupancyRate}%` }}
                />
              </div>
              <p className="text-2xl font-bold text-gray-900 w-16 text-right">
                {rentalStats.occupancyRate.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/landlord/properties" className="card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Properties</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.properties}</p>
            </div>
            <div className="text-4xl">🏢</div>
          </div>
          <button className="mt-4 text-brand text-sm font-medium hover:underline">
            View All →
          </button>
        </Link>

        <Link href="/dashboard/landlord/tenants" className="card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Active Tenants</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeUnits}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
          <button className="mt-4 text-brand text-sm font-medium hover:underline">
            View All →
          </button>
        </Link>

        <Link href="/dashboard/landlord/maintenance" className="card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Maintenance Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">—</p>
            </div>
            <div className="text-4xl">🔧</div>
          </div>
          <button className="mt-4 text-brand text-sm font-medium hover:underline">
            View Requests →
          </button>
        </Link>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card border-l-4 border-blue-500">
          <h3 className="text-sm font-bold text-gray-900">Manage Properties</h3>
          <p className="text-sm text-gray-600 mt-2">View, edit, or delete your properties and manage units</p>
          <Link href="/dashboard/landlord/properties" className="inline-block mt-3 text-brand font-medium hover:underline text-sm">
            Go to Properties →
          </Link>
        </div>

        <div className="card border-l-4 border-green-500">
          <h3 className="text-sm font-bold text-gray-900">Manage Tenants</h3>
          <p className="text-sm text-gray-600 mt-2">View tenant information, lease details, and contact information</p>
          <Link href="/dashboard/landlord/tenants" className="inline-block mt-3 text-brand font-medium hover:underline text-sm">
            Go to Tenants →
          </Link>
        </div>
      </div>
    </div>
  );
}
