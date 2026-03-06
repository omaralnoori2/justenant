'use client';

export const dynamic = 'force-dynamic';

export default function LandlordTenantsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Tenants</h1>
        <p className="text-gray-500 text-sm mt-1">Tenants in your properties</p>
      </div>

      <div className="card">
        <p className="text-gray-500 text-sm">No tenants yet.</p>
      </div>
    </div>
  );
}
