'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface CompletedTask {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  completedAt?: string;
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    unit?: {
      name: string;
      property?: {
        name: string;
      };
    };
  };
}

export default function ServiceProviderReportsPage() {
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<CompletedTask | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    api
      .get('/service-provider/completed-tasks/month')
      .then((r) => setCompletedTasks(r.data))
      .catch(() => setCompletedTasks([]))
      .finally(() => setLoading(false));
  }, []);

  const getCompletionTimeInDays = (task: CompletedTask) => {
    if (!task.completedAt) return null;
    const createdTime = new Date(task.createdAt).getTime();
    const completedTime = new Date(task.completedAt).getTime();
    const daysDiff = Math.ceil((completedTime - createdTime) / (1000 * 60 * 60 * 24));
    return daysDiff;
  };

  const currentMonth = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/service-provider" className="text-brand hover:underline text-sm mb-2 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Work Reports</h1>
        <p className="text-gray-500 text-sm mt-1">View your completed tasks and performance metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-r from-green-50 to-emerald-50">
          <p className="text-sm text-gray-600 font-medium">Tasks Completed</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{completedTasks.length}</p>
          <p className="text-xs text-gray-500 mt-1">This month ({currentMonth})</p>
        </div>

        <div className="card bg-gradient-to-r from-blue-50 to-indigo-50">
          <p className="text-sm text-gray-600 font-medium">Average Completion Time</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {completedTasks.length > 0
              ? (
                  completedTasks.reduce((sum, task) => {
                    const days = getCompletionTimeInDays(task) || 0;
                    return sum + days;
                  }, 0) / completedTasks.length
                ).toFixed(1)
              : '0'}
            d
          </p>
          <p className="text-xs text-gray-500 mt-1">Days to complete</p>
        </div>

        <div className="card bg-gradient-to-r from-purple-50 to-pink-50">
          <p className="text-sm text-gray-600 font-medium">Completion Rate</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">100%</p>
          <p className="text-xs text-gray-500 mt-1">All assigned tasks completed</p>
        </div>
      </div>

      {/* Completed Tasks List */}
      {loading ? (
        <div className="text-gray-500">Loading reports...</div>
      ) : completedTasks.length === 0 ? (
        <div className="card">
          <p className="text-gray-500 text-sm">No completed tasks this month yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Task</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Tenant / Property</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Completed</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Time to Complete</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {completedTasks.map((task) => {
                const daysToComplete = getCompletionTimeInDays(task);

                return (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{task.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {task.tenant && (
                        <div>
                          <p>
                            {task.tenant.firstName} {task.tenant.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {task.tenant.unit?.property?.name} - {task.tenant.unit?.name}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {task.completedAt
                        ? new Date(task.completedAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {daysToComplete !== null ? `${daysToComplete}d` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setShowDetailsModal(true);
                        }}
                        className="text-brand hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Details Modal */}
      {showDetailsModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedTask.title}</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-gray-900 mt-1">{selectedTask.description}</p>
              </div>

              {selectedTask.tenant && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Tenant</p>
                  <p className="text-gray-900 mt-1">
                    {selectedTask.tenant.firstName} {selectedTask.tenant.lastName}
                  </p>
                  {selectedTask.tenant.unit && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedTask.tenant.unit.property?.name} - {selectedTask.tenant.unit.name}
                    </p>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-gray-900 mt-1">
                  {new Date(selectedTask.createdAt).toLocaleDateString()}
                </p>
              </div>

              {selectedTask.completedAt && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-gray-900 mt-1">
                    {new Date(selectedTask.completedAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    ({getCompletionTimeInDays(selectedTask)} days)
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedTask(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
