'use client';

export const dynamic = 'force-dynamic';

export default function LandlordDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Landlord Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your properties and tenants</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Properties</p>
          <p className="text-3xl font-bold text-brand">0</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Active Tenants</p>
          <p className="text-3xl font-bold text-blue-600">0</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Monthly Rent</p>
          <p className="text-3xl font-bold text-green-600">$0</p>
        </div>
      </div>

      <div className="card">
        <p className="text-gray-500 text-sm">Landlord portal features coming soon...</p>
      </div>
    </div>
  );
}
