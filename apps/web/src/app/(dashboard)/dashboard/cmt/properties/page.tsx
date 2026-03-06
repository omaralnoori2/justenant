'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import api from '@/lib/api';

export default function CMTPropertiesPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-500 text-sm mt-1">Manage residential properties and units</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          + Add Property
        </button>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">No properties yet. Add your first property to get started.</p>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Property</h2>
            <p className="text-gray-500 text-sm mb-6">Property management features coming soon...</p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full px-4 py-2 rounded-lg bg-gray-200 text-gray-900 font-medium hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
