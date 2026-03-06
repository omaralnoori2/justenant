'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  mediaUrls: string[];
  tenantNotes?: string;
  cmtNotes?: string;
  providerNotes?: string;
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    user?: {
      email: string;
    };
  };
}

interface DashboardStats {
  assigned: number;
  inProgress: number;
  completedThisMonth: number;
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export default function ServiceProviderTasksPage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    assigned: 0,
    inProgress: 0,
    completedThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [providerNotes, setProviderNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/maintenance/tasks').then((r) => setTasks(r.data)),
      api.get('/maintenance/stats').then((r) => setStats(r.data)),
    ])
      .catch(() => {
        setTasks([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleStartTask = async (taskId: string) => {
    setUpdating(true);
    try {
      const response = await api.patch(`/maintenance/tasks/${taskId}`, {
        status: 'IN_PROGRESS',
      });
      setTasks(tasks.map((t) => (t.id === taskId ? response.data : t)));
      if (selectedTask?.id === taskId) {
        setSelectedTask(response.data);
      }
    } catch (error) {
      alert('Failed to start task');
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    setUpdating(true);
    try {
      const response = await api.patch(`/maintenance/tasks/${taskId}`, {
        status: 'COMPLETED',
        providerNotes: providerNotes,
      });
      setTasks(tasks.map((t) => (t.id === taskId ? response.data : t)));
      setSelectedTask(response.data);
      setProviderNotes('');
    } catch (error) {
      alert('Failed to complete task');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNotes = async (taskId: string) => {
    if (!providerNotes) return;

    setUpdating(true);
    try {
      const response = await api.patch(`/maintenance/tasks/${taskId}`, {
        providerNotes: providerNotes,
      });
      setTasks(tasks.map((t) => (t.id === taskId ? response.data : t)));
      setSelectedTask(response.data);
      setProviderNotes('');
    } catch (error) {
      alert('Failed to add notes');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-700';
      case 'IN_PROGRESS':
        return 'bg-orange-100 text-orange-700';
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredTasks = filterStatus
    ? tasks.filter((t) => t.status === filterStatus)
    : tasks;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-500 text-sm mt-1">Complete maintenance tasks assigned to you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Assigned" value={stats.assigned} color="text-blue-600" />
        <StatCard label="In Progress" value={stats.inProgress} color="text-orange-600" />
        <StatCard label="Completed (Month)" value={stats.completedThisMonth} color="text-green-600" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus(null)}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === null
              ? 'bg-brand text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Tasks
        </button>
        <button
          onClick={() => setFilterStatus('ASSIGNED')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === 'ASSIGNED'
              ? 'bg-brand text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Assigned
        </button>
        <button
          onClick={() => setFilterStatus('IN_PROGRESS')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === 'IN_PROGRESS'
              ? 'bg-brand text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setFilterStatus('COMPLETED')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filterStatus === 'COMPLETED'
              ? 'bg-brand text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Completed
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Created</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-gray-500">
                  No tasks found
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{task.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {task.tenant ? `${task.tenant.firstName} ${task.tenant.lastName}` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {task.status === 'ASSIGNED' && (
                      <button
                        onClick={() => handleStartTask(task.id)}
                        className="text-brand hover:underline"
                      >
                        Start
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setShowDetailsModal(true);
                      }}
                      className="text-brand hover:underline"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showDetailsModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 p-6 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedTask.title}</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-gray-900 mt-1">{selectedTask.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="text-gray-900 mt-1">{new Date(selectedTask.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedTask.tenant && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Tenant Contact</p>
                  <p className="text-gray-900 mt-1">
                    {selectedTask.tenant.firstName} {selectedTask.tenant.lastName}
                  </p>
                  {selectedTask.tenant.user?.email && (
                    <p className="text-sm text-gray-600">{selectedTask.tenant.user.email}</p>
                  )}
                </div>
              )}

              {selectedTask.cmtNotes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">CMT Notes</p>
                  <p className="text-gray-900 mt-1">{selectedTask.cmtNotes}</p>
                </div>
              )}

              {selectedTask.tenantNotes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Tenant Notes</p>
                  <p className="text-gray-900 mt-1">{selectedTask.tenantNotes}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider Notes</label>
                <textarea
                  value={providerNotes}
                  onChange={(e) => setProviderNotes(e.target.value)}
                  placeholder="Add notes about the task..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedTask(null);
                    setProviderNotes('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedTask.status === 'ASSIGNED' && (
                  <button
                    onClick={() => handleStartTask(selectedTask.id)}
                    disabled={updating}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:opacity-90 disabled:opacity-50"
                  >
                    {updating ? 'Starting...' : 'Start Task'}
                  </button>
                )}
                {selectedTask.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleCompleteTask(selectedTask.id)}
                    disabled={updating}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:opacity-90 disabled:opacity-50"
                  >
                    {updating ? 'Completing...' : 'Complete Task'}
                  </button>
                )}
                {providerNotes && selectedTask.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleAddNotes(selectedTask.id)}
                    disabled={updating}
                    className="flex-1 px-4 py-2 bg-brand text-white rounded-md hover:opacity-90 disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Add Notes'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
