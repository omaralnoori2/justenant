'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface ServiceProviderProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  serviceType: string;
  certifications?: string;
  user?: {
    id: string;
    email: string;
    status: string;
  };
  cmt?: {
    id: string;
    businessName: string;
    businessAddress: string;
    contactPhone?: string;
  };
}

interface WorkStats {
  totalTasksCompleted: number;
  completedThisMonth: number;
  averageCompletionTimeDays: number;
}

export default function ServiceProviderProfilePage() {
  const [profile, setProfile] = useState<ServiceProviderProfile | null>(null);
  const [stats, setStats] = useState<WorkStats>({
    totalTasksCompleted: 0,
    completedThisMonth: 0,
    averageCompletionTimeDays: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/service-provider/profile').then((r) => setProfile(r.data)),
      api.get('/service-provider/work-summary').then((r) => setStats(r.data)),
    ])
      .catch(() => {
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading profile...</div>;

  if (!profile) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/service-provider" className="text-brand hover:underline text-sm">
          ← Back to Dashboard
        </Link>
        <div className="card">
          <p className="text-gray-500">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/service-provider" className="text-brand hover:underline text-sm mb-2 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Your service provider information</p>
      </div>

      {/* Profile Header */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-gray-600 mt-2">{profile.serviceType}</p>
            <span
              className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                profile.user?.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {profile.user?.status || 'PENDING'}
            </span>
          </div>
          <div className="text-5xl">👨‍🔧</div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <a href={`mailto:${profile.user?.email}`} className="text-brand hover:underline mt-1">
                {profile.user?.email}
              </a>
            </div>
            {profile.phone && (
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <a href={`tel:${profile.phone}`} className="text-brand hover:underline mt-1">
                  {profile.phone}
                </a>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="text-gray-900 mt-1">
                {profile.user?.status === 'ACTIVE' ? '✅ Active' : '⏳ Pending Approval'}
              </p>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Professional Details</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Service Type</p>
              <p className="text-gray-900 mt-1">{profile.serviceType}</p>
            </div>
            {profile.certifications && (
              <div>
                <p className="text-sm font-medium text-gray-500">Certifications</p>
                <p className="text-gray-900 mt-1">{profile.certifications}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Work Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total Tasks Completed</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalTasksCompleted}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Completed This Month</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.completedThisMonth}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Avg Completion Time</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.averageCompletionTimeDays}d</p>
        </div>
      </div>

      {/* CMT Information */}
      {profile.cmt && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Compound Management Team (CMT)</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Business Name</p>
              <p className="text-gray-900 mt-1">{profile.cmt.businessName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Address</p>
              <p className="text-gray-900 mt-1">{profile.cmt.businessAddress}</p>
            </div>
            {profile.cmt.contactPhone && (
              <div>
                <p className="text-sm font-medium text-gray-500">Contact Phone</p>
                <a href={`tel:${profile.cmt.contactPhone}`} className="text-brand hover:underline mt-1">
                  {profile.cmt.contactPhone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/service-provider/tasks" className="card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">My Tasks</p>
              <p className="text-gray-600 mt-1">View and manage assigned tasks</p>
            </div>
            <div className="text-2xl">📋</div>
          </div>
        </Link>

        <Link href="/dashboard/service-provider/reports" className="card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Work Reports</p>
              <p className="text-gray-600 mt-1">View completion reports and analytics</p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
