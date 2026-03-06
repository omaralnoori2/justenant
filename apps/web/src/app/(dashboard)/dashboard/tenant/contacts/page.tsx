'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface Contact {
  landlord?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    user?: {
      email: string;
    };
  };
  cmt?: {
    id: string;
    businessName: string;
    contactPhone?: string;
    user?: {
      email: string;
    };
  };
  tenant?: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };
}

function ContactCard({
  title,
  icon,
  name,
  phone,
  email,
  businessName,
}: {
  title: string;
  icon: string;
  name?: string;
  businessName?: string;
  phone?: string;
  email?: string;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-lg font-bold text-gray-900 mt-2">
            {businessName || `${name}`}
          </p>
          {phone && (
            <a
              href={`tel:${phone}`}
              className="text-brand hover:underline text-sm mt-2 inline-block"
            >
              📱 {phone}
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="text-brand hover:underline text-sm mt-2 inline-block block"
            >
              📧 {email}
            </a>
          )}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

export default function TenantContactsPage() {
  const [contacts, setContacts] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/tenant/contacts')
      .then((r) => setContacts(r.data))
      .catch(() => setContacts(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading contacts...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/tenant" className="text-brand hover:underline text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-500 text-sm mt-1">Reach out to your landlord, CMT, and service providers</p>
        </div>
      </div>

      {/* Your Information */}
      {contacts?.tenant && (
        <ContactCard
          title="Your Information"
          icon="👤"
          name={`${contacts.tenant.firstName} ${contacts.tenant.lastName}`}
          phone={contacts.tenant.phone}
          email={contacts.tenant.email}
        />
      )}

      {/* Landlord */}
      {contacts?.landlord ? (
        <ContactCard
          title="Landlord"
          icon="🏠"
          name={`${contacts.landlord.firstName} ${contacts.landlord.lastName}`}
          phone={contacts.landlord.phone}
          email={contacts.landlord.user?.email}
        />
      ) : (
        <div className="card">
          <p className="text-sm text-gray-500">No landlord assigned yet</p>
        </div>
      )}

      {/* CMT (Compound Management Team) */}
      {contacts?.cmt ? (
        <ContactCard
          title="Compound Management Team (CMT)"
          icon="🏢"
          businessName={contacts.cmt.businessName}
          phone={contacts.cmt.contactPhone}
          email={contacts.cmt.user?.email}
        />
      ) : (
        <div className="card">
          <p className="text-sm text-gray-500">No CMT assigned yet</p>
        </div>
      )}

      {/* Helpful Links */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/dashboard/tenant/maintenance"
            className="p-3 bg-white rounded-lg hover:shadow-md transition text-center"
          >
            <div className="text-2xl mb-2">🔧</div>
            <p className="text-sm font-medium text-gray-900">Submit Maintenance Request</p>
          </Link>
          <Link
            href="/dashboard/tenant/unit"
            className="p-3 bg-white rounded-lg hover:shadow-md transition text-center"
          >
            <div className="text-2xl mb-2">🏠</div>
            <p className="text-sm font-medium text-gray-900">View Unit Details</p>
          </Link>
        </div>
      </div>

      {/* Support Info */}
      <div className="card border-l-4 border-blue-500">
        <p className="text-sm text-gray-600">
          <strong>Need help?</strong> Contact your landlord or CMT using the phone and email
          information above. For maintenance emergencies, submit a maintenance request and mark
          it as urgent in the notes.
        </p>
      </div>
    </div>
  );
}
