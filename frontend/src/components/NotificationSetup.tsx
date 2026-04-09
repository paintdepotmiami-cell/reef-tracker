'use client';

import { useState, useEffect } from 'react';

/**
 * NotificationSetup — Handles push notification permission and scheduling.
 *
 * Connects the alert-engine to the Service Worker for real push notifications.
 * Shows a permission banner on first visit, then schedules local notifications
 * for maintenance reminders, probe calibration, and alert checks.
 */

type PermState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export default function NotificationSetup() {
  const [permState, setPermState] = useState<PermState>('prompt');
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermState('unsupported');
      return;
    }

    const currentPerm = Notification.permission as PermState;
    setPermState(currentPerm);

    // Show banner only if permission hasn't been asked yet
    // and user hasn't dismissed it this session
    const wasDismissed = sessionStorage.getItem('reefos-notif-dismissed');
    if (currentPerm === 'prompt' && !wasDismissed) {
      // Delay banner appearance for better UX
      const timer = setTimeout(() => setShowBanner(true), 5000);
      return () => clearTimeout(timer);
    }

    // If already granted, register periodic checks
    if (currentPerm === 'granted') {
      registerPeriodicSync();
    }
  }, []);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermState(result as PermState);
      setShowBanner(false);

      if (result === 'granted') {
        // Show welcome notification
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification('ReefOS Notifications Active', {
          body: 'You\'ll receive alerts for chemistry emergencies, maintenance reminders, and equipment checks.',
          icon: '/icons/icon-192.png',
          tag: 'reefos-welcome',
        });

        // Register periodic sync
        registerPeriodicSync();
      }
    } catch {
      setPermState('denied');
      setShowBanner(false);
    }
  };

  const dismissBanner = () => {
    setDismissed(true);
    setShowBanner(false);
    sessionStorage.setItem('reefos-notif-dismissed', 'true');
  };

  if (!showBanner || dismissed || permState !== 'prompt') return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-40 animate-in slide-in-from-bottom">
      <div className="bg-[#0d1c32] border border-[#FF7F50]/30 rounded-2xl p-4 shadow-xl shadow-black/40">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF7F50]/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#FF7F50]">notifications_active</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-[family-name:var(--font-headline)] font-bold text-sm">Enable Tank Alerts?</p>
            <p className="text-[#c5c6cd] text-xs mt-1 leading-relaxed">
              Get notified for ammonia spikes, pH drops, maintenance reminders, and equipment checks — even when the app is closed.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={requestPermission}
                className="flex-1 bg-[#FF7F50] text-white text-xs font-bold py-2.5 px-4 rounded-xl active:scale-95 transition-transform"
              >
                Enable Alerts
              </button>
              <button
                onClick={dismissBanner}
                className="px-4 py-2.5 text-[#8f9097] text-xs font-medium rounded-xl bg-[#1c2a41] active:scale-95 transition-transform"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Register periodic background sync for alert checks.
 * Falls back to scheduling via SW message if periodic sync isn't supported.
 */
async function registerPeriodicSync() {
  try {
    const reg = await navigator.serviceWorker.ready;

    // Try Periodic Background Sync API (Chrome only)
    if ('periodicSync' in reg) {
      const periodicSync = reg as ServiceWorkerRegistration & {
        periodicSync: { register: (tag: string, opts: { minInterval: number }) => Promise<void> };
      };
      await periodicSync.periodicSync.register('reefos-check-alerts', {
        minInterval: 4 * 60 * 60 * 1000, // every 4 hours
      });
    }
  } catch {
    // Periodic sync not supported or permission denied — that's fine
    // The app will check alerts on each visit instead
  }
}

/**
 * Schedule a local notification via the Service Worker.
 * Call this from anywhere in the app.
 */
export async function scheduleNotification(opts: {
  delay: number;       // ms from now
  title: string;
  body: string;
  url?: string;
  tag?: string;
}) {
  if (Notification.permission !== 'granted') return;

  const reg = await navigator.serviceWorker.ready;
  reg.active?.postMessage({
    type: 'SCHEDULE_NOTIFICATION',
    ...opts,
  });
}

/**
 * Send an immediate notification (for alert-engine integration).
 */
export async function sendAlertNotification(title: string, body: string, url: string = '/alerts') {
  if (Notification.permission !== 'granted') return;

  const reg = await navigator.serviceWorker.ready;
  reg.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: `reefos-${Date.now()}`,
    data: { url },
  } as NotificationOptions);
}
