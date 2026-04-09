'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import AuthGuard from './AuthGuard';

const CHROMELESS_PATHS = ['/login', '/onboarding', '/landing'];
const FULLSCREEN_PATHS = ['/planner'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isChromeless = CHROMELESS_PATHS.includes(pathname);
  const isFullscreen = FULLSCREEN_PATHS.includes(pathname);
  const showNav = user && !isChromeless;

  return (
    <AuthGuard>
      <div className={showNav ? 'pb-[5.5rem]' : ''}>
        {showNav && !isFullscreen && <TopBar />}
        <main className={showNav && !isFullscreen ? 'pt-20 px-4 max-w-5xl mx-auto' : isFullscreen ? '' : 'px-4 max-w-5xl mx-auto'}>
          {children}
        </main>
        {showNav && <BottomNav />}
      </div>
    </AuthGuard>
  );
}
