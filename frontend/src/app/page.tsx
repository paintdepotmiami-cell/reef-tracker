'use client';

import { useEffect, useState } from 'react';
import { getAnimals, getLatestTest, getAllTests, getStats, generateTodayFeed, getMaintenanceTasks, completeMaintenanceTask } from '@/lib/queries';
import type { Animal, WaterTest, ActionItem, MaintenanceTask } from '@/lib/queries';
import { getCached, setCache } from '@/lib/cache';
import { useAuth } from '@/lib/auth';
import { analyzeTrends } from '@/lib/trend-analysis';
import { getSupabase } from '@/lib/supabase';
import Link from 'next/link';
import ParamGauge from '@/components/ParamGauge';
import ConsumableGauge from '@/components/ConsumableGauge';
import CycleStatusCard from '@/components/CycleStatus';
import { analyzeCycle } from '@/lib/cycle-engine';

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    testing: 'science',
    water_change: 'water_drop',
    water_management: 'water_drop',
    cleaning: 'cleaning_services',
    dosing: 'colorize',
    feeding: 'restaurant',
    equipment: 'settings_input_component',
    filtration: 'filter_alt',
    maintenance: 'build',
    other: 'task_alt',
  };
  return icons[category] || 'task_alt';
}

/** Wraps a promise with a timeout — resolves with null if it takes too long */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p,
    new Promise<null>(resolve => setTimeout(() => resolve(null), ms)),
  ]);
}

export default function Dashboard() {
  const { user, tank, profile, refreshTank } = useAuth();
  const [uploading, setUploading] = useState(false);

  const [test, setTest] = useState<WaterTest | null>(getCached<WaterTest | null>('latestTest'));
  const [feed, setFeed] = useState<ActionItem[]>(getCached<ActionItem[]>('todayFeed') || []);
  const [stats, setStats] = useState(getCached<{ fish: number; corals: number; inverts: number; equipment: number }>('stats') || { fish: 0, corals: 0, inverts: 0, equipment: 0 });
  const [tasks, setTasks] = useState<MaintenanceTask[]>(getCached<MaintenanceTask[]>('maintenanceTasks') || []);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [loading, setLoading] = useState(!getCached('stats'));

  useEffect(() => {
    if (!user) return;

    let animals: Animal[] = getCached<Animal[]>('animals') || [];
    let latestTest: WaterTest | null = getCached<WaterTest | null>('latestTest');

    const forceLoad = setTimeout(() => {
      console.warn('Dashboard timeout — forcing render');
      setLoading(false);
    }, 6000);

    let allTests: WaterTest[] = getCached<WaterTest[]>('allTests') || [];

    Promise.allSettled([
      withTimeout(getAnimals(), 5000).then(a => { if (a) { animals = a; setCache('animals', a); } }),
      withTimeout(getLatestTest(), 5000).then(t => {
        if (t !== undefined) {
          latestTest = t;
          setCache('latestTest', t);
          setTest(t);
        }
      }),
      withTimeout(getAllTests(), 5000).then(t => { if (t) { allTests = t; setCache('allTests', t); } }).catch(() => {}),
      withTimeout(getStats(), 5000).then(s => { if (s) { setCache('stats', s); setStats(s); } }).catch(() => {}),
      withTimeout(getMaintenanceTasks(), 5000).then(t => { if (t) { setCache('maintenanceTasks', t); setTasks(t); } }).catch(() => {}),
    ]).then(() => {
      const basicFeed = generateTodayFeed(latestTest, animals);
      const trendReport = analyzeTrends(allTests);

      const now = new Date();
      const maintenanceAlerts: ActionItem[] = (getCached<MaintenanceTask[]>('maintenanceTasks') || [])
        .filter(t => {
          if (!t.next_due_at) return false;
          const due = new Date(t.next_due_at);
          const daysUntil = (due.getTime() - now.getTime()) / 86400000;
          return daysUntil <= 0;
        })
        .map(t => {
          const due = new Date(t.next_due_at!);
          const daysOverdue = Math.floor((now.getTime() - due.getTime()) / 86400000);
          const isOverdue = daysOverdue > 0;
          return {
            id: `maint-${t.id}`,
            type: 'maintenance' as const,
            priority: (daysOverdue >= 3 ? 'critical' : isOverdue ? 'warning' : 'info') as ActionItem['priority'],
            icon: getCategoryIcon(t.category),
            title: isOverdue ? `${t.task_name} \u2014 ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue` : `${t.task_name} \u2014 due today`,
            description: t.notes || `Every ${t.interval_days} days. Tap to mark complete.`,
            action: 'Mark done',
          };
        });

      const trendIds = new Set(trendReport.actionItems.map(i => i.id));
      const maintIds = new Set(maintenanceAlerts.map(i => i.id));
      const basicFiltered = basicFeed.filter(i => !trendIds.has(i.id) && !maintIds.has(i.id));
      const combinedFeed = [...trendReport.actionItems, ...maintenanceAlerts, ...basicFiltered];
      const priorityOrder = { critical: 0, warning: 1, info: 2 };
      combinedFeed.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      setCache('todayFeed', combinedFeed);
      setFeed(combinedFeed);
    }).finally(() => {
      clearTimeout(forceLoad);
      setLoading(false);
    });
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <span className="material-symbols-outlined text-5xl text-[#FF7F50] animate-pulse">waves</span>
        <p className="text-[#c5c6cd] text-sm mt-3 font-medium tracking-wider uppercase">Loading ReefOS...</p>
      </div>
    </div>
  );

  // Maintenance task helpers
  const now = new Date();
  const overdueTasks = tasks.filter(t => t.next_due_at && new Date(t.next_due_at) < new Date(now.toDateString()));
  const todayTasks = tasks.filter(t => {
    if (!t.next_due_at) return false;
    const due = new Date(t.next_due_at);
    return due.toDateString() === now.toDateString();
  });
  const upcomingTasks = tasks.filter(t => {
    if (!t.next_due_at) return false;
    const due = new Date(t.next_due_at);
    const daysUntil = (due.getTime() - now.getTime()) / 86400000;
    return daysUntil > 0 && daysUntil <= 7 && due.toDateString() !== now.toDateString();
  });

  async function handleCompleteTask(taskId: string) {
    setCompletingTask(taskId);
    const updated = await completeMaintenanceTask(taskId);
    if (updated) {
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      setCache('maintenanceTasks', tasks.map(t => t.id === taskId ? updated : t));
    }
    setCompletingTask(null);
  }

  // Consumable tasks
  const consumableCats = new Set(['filtration', 'equipment', 'dosing']);
  const consumableTasks = tasks.filter(t =>
    consumableCats.has(t.category) || t.interval_days >= 14
  );

  const criticalCount = feed.filter(f => f.priority === 'critical').length;
  const warningCount = feed.filter(f => f.priority === 'warning').length;
  const totalSpecimens = stats.fish + stats.corals + stats.inverts;

  // Cycle engine
  const allTests = getCached<WaterTest[]>('allTests') || [];
  const tankAge = tank?.created_at
    ? Math.floor((now.getTime() - new Date(tank.created_at).getTime()) / 86400000)
    : 999;
  const cycleStatus = analyzeCycle({
    tests: allTests,
    tankCreatedAt: tank?.created_at || null,
    tankAgeInDays: tankAge,
  });

  async function handleHeroPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || !tank) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/hero.${ext}`;
      const supabase = getSupabase();
      // Upload (upsert to overwrite)
      const { error: uploadErr } = await supabase.storage
        .from('tank-photos')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;
      // Get public URL
      const { data: urlData } = supabase.storage.from('tank-photos').getPublicUrl(path);
      const photoUrl = urlData.publicUrl + '?t=' + Date.now(); // cache bust
      // Update tank record
      await supabase.from('reef_tanks').update({ photo_url: photoUrl }).eq('id', tank.id);
      await refreshTank();
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploading(false);
  }

  // Gauge configs
  const gaugeParams = test ? [
    { label: 'Calcium', value: test.calcium, unit: 'ppm', min: 300, max: 520, safeMin: 380, safeMax: 450 },
    { label: 'Alk', value: test.alkalinity, unit: 'dKH', min: 4, max: 14, safeMin: 7, safeMax: 11 },
    { label: 'Mg', value: test.magnesium, unit: 'ppm', min: 1100, max: 1500, safeMin: 1250, safeMax: 1400 },
    { label: 'pH', value: test.ph, unit: '', min: 7.5, max: 8.8, safeMin: 8.0, safeMax: 8.4 },
    { label: 'PO\u2084', value: test.phosphate, unit: 'ppm', min: 0, max: 0.4, safeMin: 0, safeMax: 0.1 },
    { label: 'NO\u2083', value: test.nitrate, unit: 'ppm', min: 0, max: 40, safeMin: 2, safeMax: 15 },
    { label: 'NH\u2083', value: test.ammonia, unit: 'ppm', min: 0, max: 1, safeMin: 0, safeMax: 0 },
    { label: 'NO\u2082', value: test.nitrite, unit: 'ppm', min: 0, max: 1, safeMin: 0, safeMax: 0 },
  ] : [];

  return (
    <div className="space-y-8">
      {/* HERO — Tank Viewport */}
      <section className="relative -mx-4 -mt-4 h-56 md:h-72 rounded-b-3xl overflow-hidden shadow-2xl group">
        {/* Background: photo or gradient */}
        {tank?.photo_url ? (
          <img
            src={tank.photo_url}
            alt={tank.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#003347] via-[#041329] to-[#0d1c32]">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #4cd6fb 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#041329]/90 via-[#041329]/30 to-transparent" />

        {/* Camera button */}
        <label className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer active:scale-90 transition-transform ${uploading ? 'animate-pulse' : ''}`}>
          <span className="material-symbols-outlined text-white text-lg">
            {uploading ? 'progress_activity' : 'photo_camera'}
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleHeroPhoto}
            className="hidden"
            disabled={uploading}
          />
        </label>

        <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${
              criticalCount > 0 ? 'bg-[#ff6b6b]/15 text-[#ff6b6b]' : 'bg-[#2ff801]/15 text-[#2ff801]'
            }`}>
              {criticalCount > 0 ? `${criticalCount} Alert${criticalCount > 1 ? 's' : ''}` : 'Stable Environment'}
            </span>
            <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-headline)] font-extrabold text-white tracking-tight">
              {tank?.name || 'My Reef'}
            </h2>
            <p className="text-[#8ccff5]/80 font-medium text-sm">
              {tank?.size_gallons ? `${tank.size_gallons} Gallon` : ''} {tank?.tank_type === 'mixed' ? 'Mixed Reef' : tank?.tank_type === 'reef' ? 'Reef' : tank?.tank_type === 'fish_only' ? 'Fish Only' : 'Reef'} System
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <p className="text-[10px] text-[#8ccff5] uppercase tracking-widest font-bold">Specimens</p>
              <p className="text-xl font-[family-name:var(--font-headline)] font-extrabold text-white">{totalSpecimens}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <p className="text-[10px] text-[#8ccff5] uppercase tracking-widest font-bold">Gear</p>
              <p className="text-xl font-[family-name:var(--font-headline)] font-extrabold text-white">{stats.equipment}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-3 gap-3">
        <Link href="/logs" className="bg-[#004b66] text-[#8ccff5] p-4 rounded-xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_4px_16px_rgba(1,14,36,0.3)]">
          <span className="material-symbols-outlined text-2xl">science</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Test Water</span>
        </Link>
        <Link href="/planner" className="bg-[#0d1c32] text-[#c5c6cd] p-4 rounded-xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_4px_16px_rgba(1,14,36,0.3)]">
          <span className="material-symbols-outlined text-2xl text-[#FF7F50]">view_in_ar</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Planner</span>
        </Link>
        <Link href="/livestock" className="bg-[#0d1c32] text-[#c5c6cd] p-4 rounded-xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_4px_16px_rgba(1,14,36,0.3)]">
          <span className="material-symbols-outlined text-2xl text-[#4cd6fb]">sailing</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Livestock</span>
        </Link>
      </section>

      {/* Alert Banner */}
      {criticalCount > 0 && (
        <div className="p-4 bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 text-[#ffb4ab] rounded-xl flex items-center gap-4">
          <span className="material-symbols-outlined text-[#ff6b6b]">warning</span>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest">Active Alert</p>
            <p className="text-sm font-medium">{feed.find(f => f.priority === 'critical')?.title}</p>
          </div>
        </div>
      )}

      {/* Cycle Status Banner (only shows if cycling) */}
      {cycleStatus.active && (
        <CycleStatusCard status={cycleStatus} variant="banner" />
      )}

      {/* Water Parameters */}
      {test && (
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-[family-name:var(--font-headline)] font-extrabold text-white">Water Chemistry</h2>
              <p className="text-[#8f9097] text-xs mt-0.5">
                {new Date(test.test_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <Link href="/logs" className="text-[#4cd6fb] text-sm font-semibold flex items-center gap-1 hover:underline">
              History <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {/* Big 3: Ca, Alk, Mg */}
          <div className="grid grid-cols-3 gap-3">
            {gaugeParams.slice(0, 3).map(g => (
              <ParamGauge
                key={g.label}
                label={g.label}
                value={g.value}
                unit={g.unit}
                min={g.min}
                max={g.max}
                safeMin={g.safeMin}
                safeMax={g.safeMax}
              />
            ))}
          </div>

          {/* Secondary params */}
          <div className="flex justify-between gap-1 px-1">
            {gaugeParams.slice(3).map(g => (
              <ParamGauge
                key={g.label}
                label={g.label}
                value={g.value}
                unit={g.unit}
                min={g.min}
                max={g.max}
                safeMin={g.safeMin}
                safeMax={g.safeMax}
                compact
              />
            ))}
          </div>
        </section>
      )}

      {/* Consumables Inventory */}
      {consumableTasks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-[family-name:var(--font-headline)] font-extrabold text-white">Consumables</h2>
          <div className="space-y-3">
            {consumableTasks.map(t => (
              <ConsumableGauge
                key={t.id}
                label={t.task_name.replace('Replace ', '').replace('Check ', '')}
                icon={getCategoryIcon(t.category)}
                intervalDays={t.interval_days}
                lastCompletedAt={t.last_completed_at}
                nextDueAt={t.next_due_at}
                onComplete={() => handleCompleteTask(t.id)}
                completing={completingTask === t.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* TODAY FEED */}
      {feed.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-[family-name:var(--font-headline)] font-extrabold text-white">Today</h2>
              {criticalCount > 0 && (
                <span className="px-2.5 py-0.5 bg-[#93000a]/30 text-[#ffb4ab] rounded-full text-[10px] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">warning</span>
                  {criticalCount} action{criticalCount > 1 ? 's' : ''} needed
                </span>
              )}
              {warningCount > 0 && criticalCount === 0 && (
                <span className="px-2.5 py-0.5 bg-[#F1C40F]/10 text-[#F1C40F] rounded-full text-[10px] font-bold">
                  {warningCount} to review
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {feed.map(item => (
              <div
                key={item.id}
                className={`bg-[#0d1c32] rounded-xl p-4 flex items-start gap-4 border-l-4 shadow-[0_4px_16px_rgba(1,14,36,0.2)] ${
                  item.priority === 'critical' ? 'border-[#ffb4ab]' :
                  item.priority === 'warning' ? 'border-[#F1C40F]' :
                  'border-[#4cd6fb]'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  item.priority === 'critical' ? 'bg-[#ffb4ab]/10' :
                  item.priority === 'warning' ? 'bg-[#F1C40F]/10' :
                  'bg-[#4cd6fb]/10'
                }`}>
                  <span className={`material-symbols-outlined ${
                    item.priority === 'critical' ? 'text-[#ffb4ab]' :
                    item.priority === 'warning' ? 'text-[#F1C40F]' :
                    'text-[#4cd6fb]'
                  }`}>{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm">{item.title}</p>
                  <p className="text-xs text-[#c5c6cd] mt-1 leading-relaxed">{item.description}</p>
                  {item.action && (
                    <button className="mt-2 text-[10px] font-bold text-[#FF7F50] uppercase tracking-wider flex items-center gap-1 hover:underline">
                      {item.action} <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Maintenance Tracker */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-[family-name:var(--font-headline)] font-extrabold text-[#ffb59c]">Maintenance</h2>
            {overdueTasks.length > 0 && (
              <span className="px-2.5 py-0.5 bg-[#93000a]/30 text-[#ffb4ab] rounded-full text-[10px] font-bold">
                {overdueTasks.length} overdue
              </span>
            )}
          </div>
        </div>

        {/* Overdue */}
        {overdueTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-[#ffb4ab] uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ffb4ab] shadow-[0_0_6px_#ffb4ab]"></span>
              Overdue
            </p>
            {overdueTasks.map(t => {
              const daysOverdue = Math.floor((now.getTime() - new Date(t.next_due_at!).getTime()) / 86400000);
              return (
                <button
                  key={t.id}
                  onClick={() => handleCompleteTask(t.id)}
                  disabled={completingTask === t.id}
                  className="w-full bg-[#0d1c32] rounded-xl p-4 flex items-center gap-4 border-l-4 border-[#ffb4ab] text-left active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_4px_16px_rgba(1,14,36,0.2)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#ffb4ab]/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#ffb4ab]">{getCategoryIcon(t.category)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm">{t.task_name}</p>
                    <p className="text-[10px] text-[#ffb4ab] mt-0.5">{daysOverdue} day{daysOverdue > 1 ? 's' : ''} overdue \u00b7 every {t.interval_days}d</p>
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-[#ffb4ab]/30 flex items-center justify-center shrink-0">
                    {completingTask === t.id ? (
                      <span className="material-symbols-outlined text-[#ffb4ab] text-sm animate-spin">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-[#ffb4ab]/40 text-sm">check</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Today */}
        {todayTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-[#F1C40F] uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F1C40F] shadow-[0_0_6px_#F1C40F]"></span>
              Today
            </p>
            {todayTasks.map(t => (
              <button
                key={t.id}
                onClick={() => handleCompleteTask(t.id)}
                disabled={completingTask === t.id}
                className="w-full bg-[#0d1c32] rounded-xl p-4 flex items-center gap-4 border-l-4 border-[#F1C40F] text-left active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_4px_16px_rgba(1,14,36,0.2)]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F1C40F]/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#F1C40F]">{getCategoryIcon(t.category)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm">{t.task_name}</p>
                  <p className="text-[10px] text-[#F1C40F]/70 mt-0.5">Due today \u00b7 every {t.interval_days}d</p>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-[#F1C40F]/30 flex items-center justify-center shrink-0">
                  {completingTask === t.id ? (
                    <span className="material-symbols-outlined text-[#F1C40F] text-sm animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[#F1C40F]/40 text-sm">check</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Upcoming */}
        {upcomingTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-[#2ff801] uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2ff801] shadow-[0_0_6px_#2ff801]"></span>
              Upcoming
            </p>
            {upcomingTasks.map(t => {
              const daysUntil = Math.ceil((new Date(t.next_due_at!).getTime() - now.getTime()) / 86400000);
              return (
                <div
                  key={t.id}
                  className="bg-[#0d1c32] rounded-xl p-4 flex items-center gap-4 border-l-4 border-[#2ff801]/30 shadow-[0_4px_16px_rgba(1,14,36,0.2)]"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#2ff801]/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#2ff801]/60">{getCategoryIcon(t.category)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-[family-name:var(--font-headline)] font-bold text-[#c5c6cd] text-sm">{t.task_name}</p>
                    <p className="text-[10px] text-[#2ff801]/50 mt-0.5">In {daysUntil} day{daysUntil > 1 ? 's' : ''} \u00b7 every {t.interval_days}d</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="bg-[#0d1c32] rounded-2xl p-8 text-center shadow-[0_4px_16px_rgba(1,14,36,0.2)]">
            <span className="material-symbols-outlined text-4xl text-[#ffb59c]/30">task_alt</span>
            <p className="text-[#c5c6cd] text-sm mt-3">No maintenance tasks yet.</p>
            <p className="text-[10px] text-[#c5c6cd]/50 mt-1">Tasks will appear once your tank is set up.</p>
          </div>
        )}
      </section>
    </div>
  );
}
