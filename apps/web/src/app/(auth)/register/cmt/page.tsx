'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  businessName: string;
  businessAddress: string;
  contactPhone: string;
  licenseNumber: string;
}

export default function RegisterCmtPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessAddress: '',
    contactPhone: '',
    licenseNumber: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register/cmt', {
        email: form.email,
        password: form.password,
        businessName: form.businessName,
        businessAddress: form.businessAddress,
        contactPhone: form.contactPhone,
        licenseNumber: form.licenseNumber || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-dark to-brand">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted</h2>
          <p className="text-gray-500 mb-6">
            Your company registration is pending approval by the portal team. You'll be notified once approved.
          </p>
          <Link href="/login" className="btn-primary inline-block">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-dark to-brand py-12">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-brand">Register Your Company</h1>
            <p className="text-gray-500 mt-1 text-sm">Compound Management Team Registration</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Account Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} className="input-field" required minLength={8} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} className="input-field" required />
              </div>
            </div>

            <div className="pt-2 grid grid-cols-1 gap-4">
              <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Business Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input name="businessName" type="text" value={form.businessName} onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                <input name="businessAddress" type="text" value={form.businessAddress} onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                <input name="contactPhone" type="tel" value={form.contactPhone} onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Number <span className="text-gray-400">(optional)</span></label>
                <input name="licenseNumber" type="text" value={form.licenseNumber} onChange={handleChange} className="input-field" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-brand font-medium hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
