'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';

// Redirect to main portal-team page which shows pending by default
export default function PendingRedirectPage() {
  const router = useRouter();

  // This component just redirects
  if (typeof window !== 'undefined') {
    router.push('/dashboard/portal-team');
  }

  return null;
}
