'use client';

import { useAuth } from '@/lib/auth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const PUBLIC_PATHS = ['/login', '/landing', '/'];

// DEV ONLY: bypass auth for UI preview — REMOVE before deploy
const DEV_BYPASS = process.env.NODE_ENV === 'development';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (DEV_BYPASS) return;
    if (loading) return;

    const isPublic = PUBLIC_PATHS.includes(pathname);

    if (!user && !isPublic) {
      router.replace('/');
      return;
    }

    if (user && pathname === '/login') {
      router.replace('/dashboard');
      return;
    }

    // Redirect to onboarding if not completed (except on onboarding page itself)
    if (user && profile && !profile.onboarding_completed && pathname !== '/onboarding') {
      router.replace('/onboarding');
      return;
    }
  }, [user, profile, loading, pathname, router]);

  if (loading && !DEV_BYPASS) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <img src="/icons/logo-40.png" alt="ReefOS" className="w-14 h-14 rounded-xl animate-pulse mx-auto" />
          <p className="text-[#c5c6cd] text-sm mt-3 font-medium tracking-wider uppercase">Loading ReefOS...</p>
        </div>
      </div>
    );
  }

  // Show content on public pages
  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  // Don't render protected content until user is confirmed
  if (!user && !DEV_BYPASS) return null;

  // Allow onboarding page
  if (pathname === '/onboarding') {
    return <>{children}</>;
  }

  // Block until onboarding is done
  if (!DEV_BYPASS && profile && !profile.onboarding_completed) return null;

  return <>{children}</>;
}
