'use client';

export const dynamic = 'force-dynamic';

export default function CMTMaintenancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Track repair and maintenance tasks</p>
        </div>
        <button className="btn-primary">+ Create Request</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">0</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-3xl font-bold text-blue-600">0</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-3xl font-bold text-green-600">0</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-3xl font-bold text-red-600">0</p>
        </div>
      </div>

      <div className="card">
        <p className="text-gray-500 text-sm">No maintenance requests yet. Create one to get started.</p>
      </div>
    </div>
  );
}
