'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'forgot') {
      const { error: err } = await resetPassword(email);
      if (err) {
        setError(err);
      } else {
        setResetSent(true);
      }
      setLoading(false);
      return;
    }

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

  const handleGoogle = async () => {
    setError('');
    const { error: err } = await signInWithGoogle();
    if (err) setError(err);
  };

  // Success screens
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

  if (resetSent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#4cd6fb]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-[#4cd6fb]">mail</span>
          </div>
          <h2 className="text-2xl font-[family-name:var(--font-headline)] font-bold text-white">Reset link sent</h2>
          <p className="text-[#c5c6cd] text-sm leading-relaxed">
            Check <strong className="text-white">{email}</strong> for a password reset link. It may take a minute.
          </p>
          <button
            onClick={() => { setResetSent(false); setMode('login'); }}
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
          <p className="text-[#c5c6cd] text-sm">
            {mode === 'forgot' ? 'Reset your password' : 'Your intelligent reef tank copilot'}
          </p>
        </div>

        {/* Google Sign In — only for login/signup modes */}
        {mode !== 'forgot' && (
          <>
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold py-3.5 rounded-xl text-sm shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-[#1c2a41]" />
              <span className="text-xs text-[#8f9097] uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-[#1c2a41]" />
            </div>
          </>
        )}

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

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    className="text-[10px] text-[#4cd6fb] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
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
          )}

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
                {mode === 'forgot' ? 'Sending...' : mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              mode === 'forgot' ? 'Send Reset Link' : mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center space-y-2">
          {mode === 'forgot' ? (
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className="text-[#c5c6cd] text-sm hover:text-white transition-colors"
            >
              <span className="text-[#FF7F50] font-semibold">Back to sign in</span>
            </button>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
