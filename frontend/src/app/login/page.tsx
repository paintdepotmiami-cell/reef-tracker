'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      const { error: err } = await signUp(email, password, name);
      if (err) {
        setError(err);
      } else {
        setSignupSuccess(true);
      }
    } else {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err);
      } else {
        router.push('/dashboard');
      }
    }
    setLoading(false);
  };

  if (signupSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#2ff801]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-[#2ff801]">check_circle</span>
          </div>
          <h2 className="text-2xl font-[family-name:var(--font-headline)] font-bold text-white">Check your email</h2>
          <p className="text-[#c5c6cd] text-sm leading-relaxed">
            We sent a confirmation link to <strong className="text-white">{email}</strong>. Click it to activate your account.
          </p>
          <button
            onClick={() => { setSignupSuccess(false); setMode('login'); }}
            className="text-[#FF7F50] font-semibold text-sm hover:underline"
          >
            Back to login
          </button>
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
          <p className="text-[#c5c6cd] text-sm">Your intelligent reef tank copilot</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3.5 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent transition-all text-sm"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3.5 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent transition-all text-sm"
              placeholder="you@email.com"
            />
          </div>

          <div>
            <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3.5 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent transition-all text-sm"
              placeholder={mode === 'signup' ? 'Min 6 characters' : 'Your password'}
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
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center">
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
            className="text-[#c5c6cd] text-sm hover:text-white transition-colors"
          >
            {mode === 'login' ? (
              <>Don&apos;t have an account? <span className="text-[#FF7F50] font-semibold">Sign up</span></>
            ) : (
              <>Already have an account? <span className="text-[#FF7F50] font-semibold">Sign in</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
