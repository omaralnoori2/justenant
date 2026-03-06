'use client';

export const dynamic = 'force-dynamic';

export default function TenantDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tenant Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your rental and maintenance requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">My Property</p>
          <p className="text-xl font-bold text-gray-900">Not assigned</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Maintenance Requests</p>
          <p className="text-3xl font-bold text-blue-600">0</p>
        </div>
      </div>

      <div className="card">
        <p className="text-gray-500 text-sm">Tenant portal features coming soon...</p>
      </div>
    </div>
  );
}
