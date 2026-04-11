'use client';

import { useEffect, useState, useRef } from 'react';
import { getAllTests, createWaterTest } from '@/lib/queries';
import type { WaterTest } from '@/lib/queries';
import { useAuth } from '@/lib/auth';
import { getSupabase, getAuthHeaders } from '@/lib/supabase';
import { getCached, setCache } from '@/lib/cache';
import { analyzeCycle } from '@/lib/cycle-engine';
import CycleStatusCard from '@/components/CycleStatus';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const ParamSparkline = dynamic(() => import('@/components/ParamSparkline'), { ssr: false });

const PARAMS = [
  { key: 'alkalinity', label: 'Alkalinity', unit: 'dKH', placeholder: '8.3', step: '0.1' },
  { key: 'calcium', label: 'Calcium', unit: 'ppm', placeholder: '420', step: '1' },
  { key: 'magnesium', label: 'Magnesium', unit: 'ppm', placeholder: '1350', step: '1' },
  { key: 'nitrate', label: 'Nitrate', unit: 'ppm', placeholder: '5.0', step: '0.1' },
  { key: 'phosphate', label: 'Phosphate', unit: 'ppm', placeholder: '0.03', step: '0.01' },
];

const EXTRA_PARAMS = [
  { key: 'ph', label: 'pH', unit: 'pH', placeholder: '8.2', step: '0.1' },
  { key: 'ammonia', label: 'Ammonia', unit: 'ppm', placeholder: '0', step: '0.01' },
  { key: 'nitrite', label: 'Nitrite', unit: 'ppm', placeholder: '0', step: '0.01' },
];

interface PhotoEntry {
  file: File;
  preview: string;
  status: 'analyzing' | 'done' | 'error';
  detectedKeys: string[]; // which params this photo detected
}

export default function LogsPage() {
  const { user, tank } = useAuth();

  // Cycle engine
  const now = new Date();
  const tankAge = tank?.created_at
    ? Math.floor((now.getTime() - new Date(tank.created_at).getTime()) / 86400000)
    : 999;
  const [tests, setTests] = useState<WaterTest[]>(getCached<WaterTest[]>('allTests') || []);
  const [loading, setLoading] = useState(!getCached('allTests'));
  const [saving, setSaving] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  // Multi-photo state
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [analyzingCount, setAnalyzingCount] = useState(0);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const timeout = setTimeout(() => setLoading(false), 6000);
    getAllTests().then(t => { setCache('allTests', t); setTests(t); }).catch(() => {}).finally(() => { clearTimeout(timeout); setLoading(false); });
  }, [user]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const analyzePhoto = async (file: File, index: number) => {
    setAnalyzingCount(c => c + 1);
    try {
      const base64 = await fileToBase64(file);
      const auth = await getAuthHeaders();
      const res = await fetch('/api/analyze-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify({ image: base64, mimeType: file.type || 'image/jpeg' }),
      });
      if (!res.ok) {
        setPhotos(prev => prev.map((p, i) => i === index ? { ...p, status: 'error' as const } : p));
        return;
      }
      const { params } = await res.json();
      if (params) {
        const detectedKeys: string[] = [];
        const newForm: Record<string, string> = {};
        const allKeys = [...PARAMS, ...EXTRA_PARAMS].map(p => p.key);
        for (const key of allKeys) {
          if (params[key] != null) {
            newForm[key] = String(params[key]);
            detectedKeys.push(key);
          }
        }
        // Merge into form — new values override old (latest photo wins per param)
        setForm(prev => ({ ...prev, ...newForm }));
        setPhotos(prev => prev.map((p, i) => i === index ? { ...p, status: 'done' as const, detectedKeys } : p));
        // Auto-show extra params if AI detected any
        const hasExtra = EXTRA_PARAMS.some(p => newForm[p.key]);
        if (hasExtra) setShowExtra(true);
      } else {
        setPhotos(prev => prev.map((p, i) => i === index ? { ...p, status: 'error' as const } : p));
      }
    } catch {
      setPhotos(prev => prev.map((p, i) => i === index ? { ...p, status: 'error' as const } : p));
    } finally {
      setAnalyzingCount(c => c - 1);
    }
  };

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    const newIndex = photos.length;
    const entry: PhotoEntry = { file, preview, status: 'analyzing', detectedKeys: [] };
    setPhotos(prev => [...prev, entry]);
    analyzePhoto(file, newIndex);
    // Reset input so same file can be selected again
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const removed = prev[index];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearAllPhotos = () => {
    photos.forEach(p => URL.revokeObjectURL(p.preview));
    setPhotos([]);
  };

  const uploadPhotos = async (): Promise<string | null> => {
    if (photos.length === 0 || !user) return null;
    try {
      const supabase = getSupabase();
      const ts = Date.now();
      let firstUrl: string | null = null;
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i].file;
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `${user.id}/${ts}_${i}.${ext}`;
        const { error } = await supabase.storage
          .from('test-photos')
          .upload(path, file, { upsert: true });
        if (error) { console.error('Photo upload error:', error); continue; }
        if (i === 0) {
          // Use signed URL (1 hour expiry) instead of public URL for privacy
          const { data: urlData } = await supabase.storage.from('test-photos').createSignedUrl(path, 3600);
          firstUrl = urlData?.signedUrl || null;
        }
      }
      return firstUrl;
    } catch (err) {
      console.error('Photo upload failed:', err);
      return null;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload photo with 8s timeout — don't block save if upload hangs
      let photoUrl: string | null = null;
      if (photos.length > 0) {
        try {
          photoUrl = await Promise.race([
            uploadPhotos(),
            new Promise<null>(resolve => setTimeout(() => resolve(null), 8000)),
          ]);
        } catch {
          console.warn('Photo upload skipped');
        }
      }
      const data: Record<string, number | string | null> = {
        test_date: new Date().toISOString().split('T')[0],
        user_id: user?.id || null,
        tank_id: tank?.id || null,
      };
      if (photoUrl) data.photo_url = photoUrl;
      [...PARAMS, ...EXTRA_PARAMS].forEach(p => {
        if (form[p.key]) data[p.key] = parseFloat(form[p.key]);
      });
      const result = await createWaterTest(data as Partial<WaterTest>);
      if (result) {
        setTests(prev => [result, ...prev]);
        setForm({});
        clearAllPhotos();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        console.error('createWaterTest returned null');
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const getStatus = (key: string, val: number | null) => {
    if (val == null) return { label: '', color: '' };
    const ranges: Record<string, [number, number]> = {
      alkalinity: [7, 11], calcium: [380, 450], magnesium: [1250, 1400],
      nitrate: [2, 15], phosphate: [0, 0.1], ph: [8.0, 8.4],
    };
    const r = ranges[key];
    if (!r) return val === 0 ? { label: 'OK', color: 'text-[#2ff801]' } : { label: 'Alert', color: 'text-[#ffb4ab]' };
    return val >= r[0] && val <= r[1]
      ? { label: 'Stable', color: 'text-[#2ff801]' }
      : { label: val < r[0] ? 'Low' : 'High', color: 'text-[#ffb59c]' };
  };

  const isAnalyzing = analyzingCount > 0;
  const filledCount = Object.keys(form).filter(k => form[k]).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-5xl text-[#FF7F50] animate-pulse">insert_chart</span>
    </div>
  );

  return (
    <div className="space-y-8 max-w-lg mx-auto pb-28">
      <div>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">Parameter Tracking</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Log Parameters</h1>
        <p className="text-[#c5c6cd] text-sm mt-1">Snap your test results — AI reads the values automatically.</p>
      </div>

      {/* Cycle Status (expanded card — only shows if cycling) */}
      {(() => {
        const cycleStatus = analyzeCycle({
          tests,
          tankCreatedAt: tank?.created_at || null,
          tankAgeInDays: tankAge,
        });
        return cycleStatus.active ? <CycleStatusCard status={cycleStatus} variant="card" /> : null;
      })()}

      {/* Success */}
      {saved && (
        <div className="bg-[#2ff801]/10 border border-[#2ff801]/20 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-[#2ff801]">check_circle</span>
          <span className="text-[#2ff801] font-semibold text-sm">Parameters saved successfully!</span>
        </div>
      )}

      {/* Photo Scanner Section */}
      <div className="bg-[#0d1c32] rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(1,14,36,0.3)]">
        {photos.length > 0 ? (
          <div className="p-4 space-y-3">
            {/* Photo grid */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {photos.map((photo, i) => (
                <div key={i} className="relative shrink-0 w-28 h-28 rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.preview} alt={`Test ${i + 1}`} className="w-full h-full object-cover" />
                  {/* Status overlay */}
                  {photo.status === 'analyzing' && (
                    <div className="absolute inset-0 bg-[#041329]/70 flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-[#4cd6fb] text-xl animate-pulse">document_scanner</span>
                      <span className="text-[9px] text-[#4cd6fb] mt-1 font-bold">Reading...</span>
                    </div>
                  )}
                  {photo.status === 'done' && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#041329] to-transparent p-1.5">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[#2ff801] text-xs">check_circle</span>
                        <span className="text-[8px] text-[#2ff801] font-bold">{photo.detectedKeys.length} params</span>
                      </div>
                    </div>
                  )}
                  {photo.status === 'error' && (
                    <div className="absolute inset-0 bg-[#041329]/70 flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-[#FF7F50] text-xl">error</span>
                      <span className="text-[9px] text-[#ffb59c] mt-1">No read</span>
                    </div>
                  )}
                  {/* Remove button */}
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-white text-xs">close</span>
                  </button>
                </div>
              ))}

              {/* Add more button */}
              <label className="shrink-0 w-28 h-28 rounded-xl border-2 border-dashed border-[#1c2a41] flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#4cd6fb]/40 transition-colors">
                <span className="material-symbols-outlined text-2xl text-[#4cd6fb]">add_a_photo</span>
                <span className="text-[9px] text-[#8f9097] font-bold">Add more</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleAddPhoto}
                  className="hidden"
                />
              </label>
            </div>

            {/* Summary bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#4cd6fb]">photo_library</span>
                <span className="text-xs text-[#c5c6cd]">
                  {photos.length} photo{photos.length !== 1 ? 's' : ''}
                  {isAnalyzing && <span className="text-[#4cd6fb] ml-1">· analyzing...</span>}
                  {!isAnalyzing && filledCount > 0 && <span className="text-[#2ff801] ml-1">· {filledCount} values detected</span>}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-3 py-10 px-6 cursor-pointer hover:bg-[#0d1c32]/80 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-[#FF7F50]/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-[#FF7F50]">photo_camera</span>
            </div>
            <div className="text-center">
              <p className="text-white font-[family-name:var(--font-headline)] font-bold text-base">Scan Test Results</p>
              <p className="text-[#8f9097] text-xs mt-1">Take photos of your test kit — AI reads the values</p>
              <p className="text-[#8f9097] text-[10px] mt-0.5">Works with Hanna, API, Salifert, Red Sea & more</p>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleAddPhoto}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-[#1c2a41]" />
        <span className="text-[10px] text-[#8f9097] uppercase tracking-widest font-bold">
          {filledCount > 0 ? 'Review & Edit' : 'Or enter manually'}
        </span>
        <div className="flex-1 h-px bg-[#1c2a41]" />
      </div>

      {/* Form */}
      <div className="space-y-4">
        {PARAMS.map(p => {
          const val = form[p.key] ? parseFloat(form[p.key]) : null;
          const status = getStatus(p.key, val);
          // Highlight fields that were AI-detected
          const aiDetected = photos.some(ph => ph.detectedKeys.includes(p.key));
          return (
            <div key={p.key} className={`bg-[#0d1c32] p-5 rounded-xl space-y-3 ${aiDetected ? 'ring-1 ring-[#2ff801]/20' : ''}`}>
              <div className="flex justify-between items-center">
                <label className="font-[family-name:var(--font-headline)] text-xs tracking-[0.15em] text-[#c5c6cd] uppercase font-medium flex items-center gap-2">
                  {p.label} ({p.unit})
                  {aiDetected && <span className="material-symbols-outlined text-[#2ff801] text-xs">auto_awesome</span>}
                </label>
                {status.label && <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.color} ${status.color.replace('text-', 'bg-')}/10`}>{status.label}</span>}
              </div>
              <div className="relative">
                <input
                  type="number"
                  step={p.step}
                  value={form[p.key] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [p.key]: e.target.value }))}
                  className="w-full bg-[#010e24] border-none rounded-xl py-4 px-5 text-2xl font-[family-name:var(--font-headline)] font-bold text-white focus:ring-2 focus:ring-[#FF7F50]/40 transition-all placeholder:text-white/10"
                  placeholder={p.placeholder}
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-[family-name:var(--font-headline)] text-sm text-[#c5c6cd]/50">{p.unit}</span>
              </div>
            </div>
          );
        })}

        {/* Toggle Extra */}
        <button onClick={() => setShowExtra(!showExtra)} className="text-[#4cd6fb] text-sm font-semibold flex items-center gap-1 w-full justify-center py-2">
          <span className="material-symbols-outlined text-sm">{showExtra ? 'expand_less' : 'expand_more'}</span>
          {showExtra ? 'Hide' : 'Show'} additional parameters
        </button>

        {showExtra && EXTRA_PARAMS.map(p => {
          const aiDetected = photos.some(ph => ph.detectedKeys.includes(p.key));
          return (
            <div key={p.key} className={`bg-[#0d1c32] p-5 rounded-xl space-y-3 ${aiDetected ? 'ring-1 ring-[#2ff801]/20' : ''}`}>
              <label className="font-[family-name:var(--font-headline)] text-xs tracking-[0.15em] text-[#c5c6cd] uppercase font-medium flex items-center gap-2">
                {p.label} ({p.unit})
                {aiDetected && <span className="material-symbols-outlined text-[#2ff801] text-xs">auto_awesome</span>}
              </label>
              <input
                type="number"
                step={p.step}
                value={form[p.key] || ''}
                onChange={e => setForm(prev => ({ ...prev, [p.key]: e.target.value }))}
                className="w-full bg-[#010e24] border-none rounded-xl py-3 px-4 text-xl font-[family-name:var(--font-headline)] font-bold text-white focus:ring-2 focus:ring-[#FF7F50]/40 transition-all placeholder:text-white/10"
                placeholder={p.placeholder}
              />
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || isAnalyzing || (Object.keys(form).length === 0 && photos.length === 0)}
        className="w-full bg-gradient-to-br from-[#ffb59c] to-[#d35e32] text-white font-[family-name:var(--font-headline)] font-bold py-5 rounded-xl text-lg tracking-widest uppercase shadow-xl active:scale-[0.98] transition-transform duration-150 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : isAnalyzing ? 'Analyzing...' : 'Save Log'}
        <span className="material-symbols-outlined text-xl">{saving ? 'progress_activity' : 'save'}</span>
      </button>

      {/* Sparkline Trends */}
      {tests.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-headline)] text-sm tracking-[0.2em] text-[#c5c6cd] uppercase font-bold">Trends</h3>
            <span className="text-[10px] text-[#c5c6cd]/50">{tests.length} test{tests.length !== 1 ? 's' : ''} logged</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'alkalinity' as keyof WaterTest, label: 'Alk', unit: 'dKH', min: 7, max: 11, color: '#FF7F50' },
              { key: 'calcium' as keyof WaterTest, label: 'Calcium', unit: 'ppm', min: 380, max: 450, color: '#4cd6fb' },
              { key: 'magnesium' as keyof WaterTest, label: 'Magnesium', unit: 'ppm', min: 1250, max: 1400, color: '#ffb59c' },
              { key: 'phosphate' as keyof WaterTest, label: 'PO4', unit: 'ppm', min: 0, max: 0.1, color: '#2ff801' },
              { key: 'nitrate' as keyof WaterTest, label: 'NO3', unit: 'ppm', min: 2, max: 15, color: '#d7ffc5' },
              { key: 'ph' as keyof WaterTest, label: 'pH', unit: '', min: 8.0, max: 8.4, color: '#c5c6cd' },
            ].map(p => (
              <ParamSparkline
                key={p.key}
                label={p.label}
                unit={p.unit}
                min={p.min}
                max={p.max}
                color={p.color}
                data={tests.map(t => ({
                  date: t.test_date,
                  value: t[p.key] as number | null,
                }))}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent Records */}
      {tests.length > 0 && (
        <section className="space-y-4">
          <h3 className="font-[family-name:var(--font-headline)] text-sm tracking-[0.2em] text-[#c5c6cd] uppercase font-bold">Recent Records</h3>
          <div className="space-y-3">
            {tests.slice(0, 10).map(t => (
              <div key={t.id} className="bg-[#0d1c32]/60 p-4 rounded-xl flex items-center gap-3">
                {t.photo_url && (
                  <Image
                    src={t.photo_url}
                    alt="Test photo"
                    width={56}
                    height={56}
                    className="w-14 h-14 object-cover rounded-lg shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[#c5c6cd] font-medium mb-1">
                    {new Date(t.test_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-sm font-[family-name:var(--font-headline)] text-white truncate">
                    ALK {t.alkalinity ?? '—'} &middot; CA {t.calcium ?? '—'} &middot; MG {t.magnesium ?? '—'}
                    {t.nitrate != null && ` · NO3 ${t.nitrate}`}
                    {t.phosphate != null && ` · PO4 ${t.phosphate}`}
                  </div>
                </div>
                {!t.photo_url && <span className="material-symbols-outlined text-[#c5c6cd]/40 shrink-0">chevron_right</span>}
                {t.photo_url && <span className="material-symbols-outlined text-[#4cd6fb]/40 shrink-0 text-sm">photo_camera</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
