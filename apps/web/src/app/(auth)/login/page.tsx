'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { saveTokens, getDashboardPath } from '@/lib/auth';
import type { AuthTokens } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<AuthTokens>('/auth/login', { email, password });
      saveTokens(data);
      router.push(getDashboardPath(data.role));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-blue-lightest via-white to-brand-blue-lighter">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-brand-blue-lightest">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/logos/logo-full.png"
                alt="JusTenant"
                width={200}
                height={80}
                priority
                className="h-auto w-auto"
              />
            </div>
            <p className="text-brand-gray mt-2 text-sm font-proxima-nova">Where Tenants Come First</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1 font-proxima-nova">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1 font-proxima-nova">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-proxima-nova">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 font-proxima-nova">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-brand-gray font-proxima-nova">
            Are you a property manager?{' '}
            <Link href="/register/cmt" className="text-brand-blue font-semibold hover:text-brand-blue-light transition-colors">
              Register your company
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
