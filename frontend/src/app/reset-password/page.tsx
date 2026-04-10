'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const { error: err } = await updatePassword(password);
    if (err) {
      setError(err);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#2ff801]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-[#2ff801]">check_circle</span>
          </div>
          <h2 className="text-2xl font-[family-name:var(--font-headline)] font-bold text-white">Password updated!</h2>
          <p className="text-[#c5c6cd] text-sm">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden shadow-xl shadow-[#FF7F50]/20">
            <img src="/icons/logo-40.png" alt="ReefOS" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-[0.15em] text-[#FF7F50] uppercase">
            ReefOS
          </h1>
          <p className="text-[#c5c6cd] text-sm">Set your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3.5 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent transition-all text-sm"
              placeholder="Min 6 characters"
              autoFocus
            />
          </div>

          <div>
            <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              minLength={6}
              className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3.5 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent transition-all text-sm"
              placeholder="Re-enter password"
            />
          </div>

          {error && (
            <div className="bg-[#93000a]/20 border border-[#ffb4ab]/20 rounded-xl p-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffb4ab] text-sm">error</span>
              <span className="text-[#ffb4ab] text-xs">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-br from-[#FF7F50] to-[#d35e32] text-white font-[family-name:var(--font-headline)] font-bold py-4 rounded-xl text-sm tracking-widest uppercase shadow-xl shadow-[#FF7F50]/20 active:scale-[0.98] transition-transform duration-150 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                Updating...
              </span>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
