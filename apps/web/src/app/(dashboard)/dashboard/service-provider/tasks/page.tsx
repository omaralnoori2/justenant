'use client';

export const dynamic = 'force-dynamic';

export default function ServiceProviderTasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-500 text-sm mt-1">Maintenance tasks assigned to you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      <div className="card">
        <p className="text-gray-500 text-sm">No tasks assigned yet.</p>
      </div>
    </div>
  );
}
