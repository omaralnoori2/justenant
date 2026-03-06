'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface DashboardStats {
  assigned: number;
  inProgress: number;
  totalCompleted: number;
  completedThisMonth: number;
}

interface ResponseTimeStats {
  averageResponseTimeHours: number;
  maxResponseTimeHours: number;
  pendingTasks: number;
}

interface WorkSummary {
  totalTasksCompleted: number;
  averageCompletionTimeDays: number;
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}

export default function ServiceProviderDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    assigned: 0,
    inProgress: 0,
    totalCompleted: 0,
    completedThisMonth: 0,
  });
  const [responseTime, setResponseTime] = useState<ResponseTimeStats>({
    averageResponseTimeHours: 0,
    maxResponseTimeHours: 0,
    pendingTasks: 0,
  });
  const [workSummary, setWorkSummary] = useState<WorkSummary>({
    totalTasksCompleted: 0,
    averageCompletionTimeDays: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/service-provider/dashboard-stats').then((r) => setStats(r.data)),
      api.get('/service-provider/response-time-stats').then((r) => setResponseTime(r.data)),
      api.get('/service-provider/work-summary').then((r) => setWorkSummary(r.data)),
    ])
      .catch(() => {
        setStats({ assigned: 0, inProgress: 0, totalCompleted: 0, completedThisMonth: 0 });
        setResponseTime({ averageResponseTimeHours: 0, maxResponseTimeHours: 0, pendingTasks: 0 });
        setWorkSummary({ totalTasksCompleted: 0, averageCompletionTimeDays: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Provider Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage your maintenance tasks</p>
        </div>
      </div>

      {/* Task Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Assigned" value={stats.assigned} color="text-blue-600" />
        <StatCard label="In Progress" value={stats.inProgress} color="text-orange-600" />
        <StatCard label="Completed (Month)" value={stats.completedThisMonth} color="text-green-600" />
        <StatCard label="Total Completed" value={stats.totalCompleted} color="text-purple-600" />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50">
          <p className="text-sm text-gray-600 font-medium">Average Response Time</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {responseTime.averageResponseTimeHours.toFixed(1)}h
          </p>
          <p className="text-xs text-gray-500 mt-1">From assignment to start</p>
        </div>

        <div className="card bg-gradient-to-r from-green-50 to-emerald-50">
          <p className="text-sm text-gray-600 font-medium">Avg Completion Time</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {workSummary.averageCompletionTimeDays}d
          </p>
          <p className="text-xs text-gray-500 mt-1">From start to completion</p>
        </div>

        <div className="card bg-gradient-to-r from-purple-50 to-pink-50">
          <p className="text-sm text-gray-600 font-medium">Tasks This Month</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.completedThisMonth}
          </p>
          <p className="text-xs text-gray-500 mt-1">Completed in current month</p>
        </div>
      </div>

      {/* Current Status Alert */}
      {stats.inProgress > 0 && (
        <div className="card border-l-4 border-orange-500 bg-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Active Tasks</p>
              <p className="text-gray-700 mt-1">
                You have {stats.inProgress} task{stats.inProgress !== 1 ? 's' : ''} currently in progress
              </p>
            </div>
            <Link
              href="/dashboard/service-provider/tasks?status=IN_PROGRESS"
              className="text-brand hover:underline font-medium"
            >
              View →
            </Link>
          </div>
        </div>
      )}

      {stats.assigned > 0 && (
        <div className="card border-l-4 border-blue-500 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Pending Tasks</p>
              <p className="text-gray-700 mt-1">
                {stats.assigned} task{stats.assigned !== 1 ? 's' : ''} waiting to be started
              </p>
            </div>
            <Link
              href="/dashboard/service-provider/tasks?status=ASSIGNED"
              className="text-brand hover:underline font-medium"
            >
              View →
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/service-provider/tasks" className="card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">All Tasks</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.assigned + stats.inProgress}
              </p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
          <button className="mt-4 text-brand text-sm font-medium hover:underline">
            View Tasks →
          </button>
        </Link>

        <Link href="/dashboard/service-provider/profile" className="card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">My Profile</p>
              <p className="text-lg font-bold text-gray-900 mt-2">Service Provider</p>
            </div>
            <div className="text-3xl">👤</div>
          </div>
          <button className="mt-4 text-brand text-sm font-medium hover:underline">
            View Profile →
          </button>
        </Link>

        <Link href="/dashboard/service-provider/reports" className="card hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Reports</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.completedThisMonth}
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
          <button className="mt-4 text-brand text-sm font-medium hover:underline">
            View Reports →
          </button>
        </Link>
      </div>

      {/* Support Info */}
      <div className="card border-l-4 border-green-500">
        <p className="text-sm text-gray-600">
          <strong>Need support?</strong> Contact your CMT team through the in-app messaging or check your assigned tasks for contact details.
        </p>
      </div>
    </div>
  );
}
