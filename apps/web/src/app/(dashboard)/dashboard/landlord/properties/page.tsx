'use client';

export const dynamic = 'force-dynamic';

export default function LandlordPropertiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
          <p className="text-gray-500 text-sm mt-1">Properties you own and manage</p>
        </div>
        <button className="btn-primary">+ Add Property</button>
      </div>

      <div className="card">
        <p className="text-gray-500 text-sm">No properties yet.</p>
      </div>
    </div>
  );
}
