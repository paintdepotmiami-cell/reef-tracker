'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { getMaintenanceTasks, completeMaintenanceTask } from '@/lib/queries';
import type { MaintenanceTask } from '@/lib/queries';
import { getCached, setCache } from '@/lib/cache';
import Link from 'next/link';

/* ─── Category Config ─── */
const CATEGORIES: Record<string, { icon: string; color: string; label: string }> = {
  testing: { icon: 'science', color: '#4cd6fb', label: 'Testing' },
  cleaning: { icon: 'mop', color: '#FF7F50', label: 'Cleaning' },
  water_management: { icon: 'water_drop', color: '#2ff801', label: 'Water' },
  feeding: { icon: 'restaurant', color: '#F1C40F', label: 'Feeding' },
  dosing: { icon: 'labs', color: '#d7ffc5', label: 'Dosing' },
  filtration: { icon: 'filter_alt', color: '#ffb59c', label: 'Filtration' },
  equipment: { icon: 'settings', color: '#c5a3ff', label: 'Equipment' },
  maintenance: { icon: 'build', color: '#8f9097', label: 'General' },
};

const CADENCE_LABELS: Record<string, string> = {
  '1': 'Daily',
  '3': 'Every 3 days',
  '7': 'Weekly',
  '14': 'Biweekly',
  '21': 'Every 3 weeks',
  '30': 'Monthly',
  '90': 'Quarterly',
  '180': 'Biannual',
};

function getCadenceLabel(days: number): string {
  return CADENCE_LABELS[String(days)] || `Every ${days} days`;
}

function getDueStatus(task: MaintenanceTask): { label: string; color: string; urgency: number } {
  if (!task.next_due_at) return { label: 'No date', color: '#8f9097', urgency: 0 };
  const now = Date.now();
  const due = new Date(task.next_due_at).getTime();
  const diff = due - now;
  const days = Math.ceil(diff / 86400000);

  if (days < -1) return { label: `${Math.abs(days)}d overdue`, color: '#ff4444', urgency: 3 };
  if (days < 0) return { label: 'Overdue', color: '#ff4444', urgency: 3 };
  if (days === 0) return { label: 'Due today', color: '#FF7F50', urgency: 2 };
  if (days === 1) return { label: 'Tomorrow', color: '#F1C40F', urgency: 1 };
  if (days <= 3) return { label: `In ${days} days`, color: '#F1C40F', urgency: 1 };
  if (days <= 7) return { label: `In ${days} days`, color: '#2ff801', urgency: 0 };
  return { label: `In ${days}d`, color: '#8f9097', urgency: 0 };
}

export default function MaintenancePage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'today' | 'week'>('all');
  const [catFilter, setCatFilter] = useState('all');
  const [completing, setCompleting] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    if (!user) return;
    const cached = getCached<MaintenanceTask[]>('maintenance-tasks');
    if (cached) { setTasks(cached); setLoading(false); }

    getMaintenanceTasks().then(data => {
      setCache('maintenance-tasks', data);
      setTasks(data);
      setLoading(false);
    });
  }, [user]);

  const handleComplete = async (id: string) => {
    setCompleting(id);
    const updated = await completeMaintenanceTask(id);
    if (updated) {
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    }
    setCompleting(null);
  };

  // Stats
  const stats = useMemo(() => {
    const now = Date.now();
    const overdue = tasks.filter(t => t.next_due_at && new Date(t.next_due_at).getTime() < now).length;
    const today = tasks.filter(t => {
      if (!t.next_due_at) return false;
      const due = new Date(t.next_due_at);
      const todayDate = new Date();
      return due.toDateString() === todayDate.toDateString();
    }).length;
    const completedThisWeek = tasks.filter(t => {
      if (!t.last_completed_at) return false;
      return (now - new Date(t.last_completed_at).getTime()) < 7 * 86400000;
    }).length;
    return { overdue, today, completedThisWeek, total: tasks.length };
  }, [tasks]);

  // Filtered tasks
  const filtered = useMemo(() => {
    const now = Date.now();
    let list = [...tasks];

    if (filter === 'overdue') {
      list = list.filter(t => t.next_due_at && new Date(t.next_due_at).getTime() < now);
    } else if (filter === 'today') {
      list = list.filter(t => {
        if (!t.next_due_at) return false;
        const d = new Date(t.next_due_at);
        return d.toDateString() === new Date().toDateString();
      });
    } else if (filter === 'week') {
      list = list.filter(t => {
        if (!t.next_due_at) return false;
        const diff = new Date(t.next_due_at).getTime() - now;
        return diff < 7 * 86400000;
      });
    }

    if (catFilter !== 'all') {
      list = list.filter(t => t.category === catFilter);
    }

    // Sort: overdue first, then by due date
    list.sort((a, b) => {
      const aTime = a.next_due_at ? new Date(a.next_due_at).getTime() : Infinity;
      const bTime = b.next_due_at ? new Date(b.next_due_at).getTime() : Infinity;
      return aTime - bTime;
    });

    return list;
  }, [tasks, filter, catFilter]);

  // Categories with counts
  const activeCats = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => { counts[t.category] = (counts[t.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-[#FF7F50] animate-pulse">task_alt</span>
          <p className="text-[#c5c6cd] text-sm">Loading maintenance…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <Link href="/tools" className="flex items-center gap-1 text-[#c5c6cd]/60 text-xs mb-2 active:opacity-60">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Tools
        </Link>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#FF7F50] text-xs font-medium uppercase">Schedule</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Maintenance</h1>
        <p className="text-[#c5c6cd] text-sm mt-1">{tasks.length} tasks tracked</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        <button onClick={() => setFilter('overdue')} className={`bg-[#0d1c32] rounded-2xl p-3 text-center transition-all ${filter === 'overdue' ? 'ring-1 ring-[#ff4444]/40' : ''}`}>
          <p className="text-xl font-bold" style={{ color: stats.overdue > 0 ? '#ff4444' : '#2ff801' }}>{stats.overdue}</p>
          <p className="text-[9px] text-[#c5c6cd]/50 uppercase">Overdue</p>
        </button>
        <button onClick={() => setFilter('today')} className={`bg-[#0d1c32] rounded-2xl p-3 text-center transition-all ${filter === 'today' ? 'ring-1 ring-[#FF7F50]/40' : ''}`}>
          <p className="text-xl font-bold text-[#FF7F50]">{stats.today}</p>
          <p className="text-[9px] text-[#c5c6cd]/50 uppercase">Today</p>
        </button>
        <button onClick={() => setFilter('week')} className={`bg-[#0d1c32] rounded-2xl p-3 text-center transition-all ${filter === 'week' ? 'ring-1 ring-[#F1C40F]/40' : ''}`}>
          <p className="text-xl font-bold text-[#F1C40F]">{filtered.length}</p>
          <p className="text-[9px] text-[#c5c6cd]/50 uppercase">This Week</p>
        </button>
        <button onClick={() => { setFilter('all'); setCatFilter('all'); }} className={`bg-[#0d1c32] rounded-2xl p-3 text-center transition-all ${filter === 'all' ? 'ring-1 ring-[#4cd6fb]/40' : ''}`}>
          <p className="text-xl font-bold text-[#4cd6fb]">{stats.completedThisWeek}</p>
          <p className="text-[9px] text-[#c5c6cd]/50 uppercase">Done/wk</p>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        <button
          onClick={() => setCatFilter('all')}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${catFilter === 'all' ? 'bg-[#FF7F50]/15 text-[#FF7F50]' : 'bg-[#0d1c32] text-[#c5c6cd]/50'}`}
        >All</button>
        {activeCats.map(([cat, count]) => {
          const cfg = CATEGORIES[cat] || { icon: 'task', color: '#8f9097', label: cat };
          return (
            <button
              key={cat}
              onClick={() => setCatFilter(catFilter === cat ? 'all' : cat)}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${catFilter === cat ? 'bg-[#FF7F50]/15 text-[#FF7F50]' : 'bg-[#0d1c32] text-[#c5c6cd]/50'}`}
            >
              <span className="material-symbols-outlined text-xs" style={{ color: cfg.color }}>{cfg.icon}</span>
              {cfg.label}
              <span className="text-[9px] opacity-50">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-[#0d1c32] rounded-2xl p-8 text-center">
            <span className="material-symbols-outlined text-3xl text-[#2ff801] mb-2 block">celebration</span>
            <p className="text-white font-medium">All caught up!</p>
            <p className="text-[#c5c6cd]/50 text-xs mt-1">No tasks match this filter</p>
          </div>
        ) : (
          filtered.map(task => {
            const due = getDueStatus(task);
            const cat = CATEGORIES[task.category] || { icon: 'task', color: '#8f9097', label: task.category };
            const isCompleting = completing === task.id;

            return (
              <div key={task.id} className="bg-[#0d1c32] rounded-2xl p-4 flex items-center gap-3">
                {/* Complete button */}
                <button
                  onClick={() => handleComplete(task.id)}
                  disabled={isCompleting}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 ${
                    isCompleting ? 'bg-[#2ff801]/20' : 'bg-[#041329] border border-[#1c2a41] hover:border-[#2ff801]/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg" style={{ color: isCompleting ? '#2ff801' : '#c5c6cd40' }}>
                    {isCompleting ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </button>

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-medium truncate">{task.task_name}</p>
                    <span className="material-symbols-outlined text-xs" style={{ color: cat.color }}>{cat.icon}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[#c5c6cd]/40">{getCadenceLabel(task.interval_days)}</span>
                    {task.notes && (
                      <>
                        <span className="text-[#c5c6cd]/20">•</span>
                        <span className="text-[10px] text-[#c5c6cd]/30 truncate">{task.notes}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Due badge */}
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-bold" style={{ color: due.color }}>{due.label}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Recently Completed */}
      {stats.completedThisWeek > 0 && (
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="w-full flex items-center justify-center gap-2 py-2 text-[#c5c6cd]/50 text-xs"
        >
          <span className="material-symbols-outlined text-sm">{showCompleted ? 'expand_less' : 'expand_more'}</span>
          {showCompleted ? 'Hide' : 'Show'} completed this week ({stats.completedThisWeek})
        </button>
      )}
      {showCompleted && (
        <div className="space-y-2">
          {tasks
            .filter(t => t.last_completed_at && (Date.now() - new Date(t.last_completed_at).getTime()) < 7 * 86400000)
            .map(task => (
              <div key={`done-${task.id}`} className="bg-[#0d1c32]/50 rounded-2xl p-4 flex items-center gap-3 opacity-60">
                <div className="w-10 h-10 rounded-xl bg-[#2ff801]/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#2ff801] text-lg">check_circle</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm line-through truncate">{task.task_name}</p>
                  <p className="text-[10px] text-[#c5c6cd]/40">
                    Completed {new Date(task.last_completed_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
