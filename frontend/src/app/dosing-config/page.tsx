'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { getDosingConfig, updateDosingConfig, createDosingConfig } from '@/lib/queries';
import type { DosingConfig, DosingChannel } from '@/lib/queries';
import Link from 'next/link';
import ImageIdentifier, { type IdentifyResult } from '@/components/ImageIdentifier';

/* ─── Parameter Affects Options ─── */
const AFFECTS_OPTIONS = [
  { value: 'alkalinity', label: 'Alkalinity', icon: 'science', color: '#4cd6fb' },
  { value: 'calcium', label: 'Calcium', icon: 'labs', color: '#2ff801' },
  { value: 'magnesium', label: 'Magnesium', icon: 'experiment', color: '#F1C40F' },
  { value: 'all-in-one', label: 'All-in-One', icon: 'blur_on', color: '#d7ffc5' },
  { value: 'food', label: 'Coral Food', icon: 'restaurant', color: '#FF7F50' },
  { value: 'supplement', label: 'Supplement', icon: 'medication', color: '#ffb59c' },
  { value: 'water-out', label: 'Water Out (AWC)', icon: 'output', color: '#ff4444' },
  { value: 'water-in', label: 'Water In (AWC)', icon: 'input', color: '#4cd6fb' },
  { value: 'medication', label: 'Medication', icon: 'healing', color: '#ff9999' },
  { value: 'kalkwasser', label: 'Kalkwasser', icon: 'water_drop', color: '#c5c6cd' },
  { value: 'bacteria', label: 'Bacteria', icon: 'biotech', color: '#2ff801' },
  { value: 'trace', label: 'Trace Elements', icon: 'hub', color: '#F1C40F' },
  { value: 'other', label: 'Other', icon: 'more_horiz', color: '#8f9097' },
];

const QUICK_ADD_PRODUCTS = [
  { name: 'BRS Soda Ash', parameter: 'alkalinity' },
  { name: 'BRS Calcium Chloride', parameter: 'calcium' },
  { name: 'BRS Magnesium', parameter: 'magnesium' },
  { name: 'All For Reef', parameter: 'all-in-one' },
  { name: 'Kalkwasser', parameter: 'kalkwasser' },
  { name: 'Reef-Roids', parameter: 'food' },
  { name: 'Red Sea Foundation A', parameter: 'alkalinity' },
  { name: 'Red Sea Foundation B', parameter: 'calcium' },
  { name: 'Red Sea Foundation C', parameter: 'magnesium' },
  { name: 'Brightwell Alkalin8.3', parameter: 'alkalinity' },
  { name: 'Brightwell Calcium', parameter: 'calcium' },
  { name: 'Aquaforest AF Amino Mix', parameter: 'supplement' },
  { name: 'Tropic Marin All-For-Reef', parameter: 'all-in-one' },
  { name: 'Aquavitro Fuel', parameter: 'food' },
  { name: 'Brightwell MicroBacter7', parameter: 'bacteria' },
  { name: 'Polyp Lab Reef-Roids', parameter: 'food' },
];

const ATO_MODELS = [
  { name: 'Smart ATO', brand: 'AutoAqua' },
  { name: 'Smart ATO Duo', brand: 'AutoAqua' },
  { name: 'Smart ATO Micro', brand: 'AutoAqua' },
  { name: 'Tunze Osmolator 3155', brand: 'Tunze' },
  { name: 'Tunze Osmolator Nano 3152', brand: 'Tunze' },
  { name: 'XP AquaPod', brand: 'XP Aqua' },
  { name: 'Duetto ATO', brand: 'XP Aqua' },
  { name: 'ATO (built-in)', brand: 'Neptune Systems' },
  { name: 'Hydros ATO', brand: 'CoralVue' },
  { name: 'JBJ ATO', brand: 'JBJ' },
  { name: 'DIY / Custom ATO', brand: 'Other' },
];

function getAffects(value: string) {
  return AFFECTS_OPTIONS.find(a => a.value === value) || AFFECTS_OPTIONS[AFFECTS_OPTIONS.length - 1];
}

export default function DosingConfigPage() {
  const { user, tank } = useAuth();
  const [config, setConfig] = useState<DosingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editing state
  const [editingChannel, setEditingChannel] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');

  // Form fields for channel add/edit
  const [fProduct, setFProduct] = useState('');
  const [fParameter, setFParameter] = useState('alkalinity');
  const [fMlDay, setFMlDay] = useState('');
  const [fDosesDay, setFDosesDay] = useState('24');
  const [fEnabled, setFEnabled] = useState(true);

  // Pump model edit
  const [editingPump, setEditingPump] = useState(false);
  const [fPumpModel, setFPumpModel] = useState('');
  const [fPumpBrand, setFPumpBrand] = useState('');
  const [fMethod, setFMethod] = useState<'pump' | 'manual' | 'kalkwasser' | 'reactor'>('pump');

  // ATO state
  const [editingAto, setEditingAto] = useState(false);
  const [fAtoEnabled, setFAtoEnabled] = useState(false);
  const [fAtoModel, setFAtoModel] = useState('');
  const [fAtoBrand, setFAtoBrand] = useState('');
  const [fAtoKalk, setFAtoKalk] = useState(false);
  const [fAtoKalkTsp, setFAtoKalkTsp] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);

  // Load config
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getDosingConfig().then(cfg => {
      setConfig(cfg);
      if (cfg) {
        setFPumpModel(cfg.pump_model || '');
        setFPumpBrand(cfg.pump_brand || '');
        setFMethod(cfg.method as 'pump' | 'manual' | 'kalkwasser' | 'reactor');
        setFAtoEnabled(cfg.ato_enabled || false);
        setFAtoModel(cfg.ato_model || '');
        setFAtoBrand(cfg.ato_brand || '');
        setFAtoKalk(cfg.ato_kalkwasser || false);
        setFAtoKalkTsp(cfg.ato_kalk_tsp_per_gal ? String(cfg.ato_kalk_tsp_per_gal) : '');
      }
      setLoading(false);
    });
  }, [user]);

  // Auto-clear success message
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const channels = config?.channels || [];

  // Save channels to DB
  const saveChannels = async (newChannels: DosingChannel[], extraUpdates?: Partial<DosingConfig>) => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      if (config?.id) {
        const updated = await updateDosingConfig(config.id, {
          channels: newChannels,
          ...extraUpdates,
        });
        if (updated) setConfig(updated);
        else setError('Failed to save');
      } else {
        const created = await createDosingConfig({
          user_id: user.id,
          tank_id: tank?.id || null,
          pump_model: fPumpModel || null,
          pump_brand: fPumpBrand || null,
          method: fMethod,
          channels: newChannels,
          notes: null,
          ato_enabled: fAtoEnabled,
          ato_model: fAtoModel || null,
          ato_brand: fAtoBrand || null,
          ato_kalkwasser: fAtoKalk,
          ato_kalk_tsp_per_gal: fAtoKalkTsp ? parseFloat(fAtoKalkTsp) : null,
          ...extraUpdates,
        });
        if (created) setConfig(created);
        else setError('Failed to create config');
      }
      setSuccess('Saved!');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Add channel
  const handleAddChannel = () => {
    if (!fProduct.trim()) return;
    const newCh: DosingChannel = {
      channel: channels.length + 1,
      product: fProduct.trim(),
      parameter: fParameter,
      ml_per_day: parseFloat(fMlDay) || 0,
      doses_per_day: parseInt(fDosesDay) || 24,
      enabled: fEnabled,
    };
    saveChannels([...channels, newCh]);
    resetForm();
    setShowAddModal(false);
    setShowQuickAdd(false);
  };

  // Update channel
  const handleUpdateChannel = (index: number) => {
    const updated = [...channels];
    updated[index] = {
      ...updated[index],
      product: fProduct.trim(),
      parameter: fParameter,
      ml_per_day: parseFloat(fMlDay) || 0,
      doses_per_day: parseInt(fDosesDay) || 24,
      enabled: fEnabled,
    };
    saveChannels(updated);
    setEditingChannel(null);
    resetForm();
  };

  // Delete channel
  const handleDeleteChannel = (index: number) => {
    const updated = channels.filter((_, i) => i !== index).map((ch, i) => ({ ...ch, channel: i + 1 }));
    saveChannels(updated);
    setEditingChannel(null);
  };

  // Toggle channel enabled
  const handleToggleChannel = (index: number) => {
    const updated = [...channels];
    updated[index] = { ...updated[index], enabled: !updated[index].enabled };
    saveChannels(updated);
  };

  // Save pump info
  const handleSavePump = () => {
    saveChannels(channels, {
      pump_model: fPumpModel || null,
      pump_brand: fPumpBrand || null,
      method: fMethod,
    });
    setEditingPump(false);
  };

  // Save ATO info
  const handleSaveAto = () => {
    saveChannels(channels, {
      ato_enabled: fAtoEnabled,
      ato_model: fAtoModel || null,
      ato_brand: fAtoBrand || null,
      ato_kalkwasser: fAtoKalk,
      ato_kalk_tsp_per_gal: fAtoKalkTsp ? parseFloat(fAtoKalkTsp) : null,
    });
    setEditingAto(false);
  };

  // Quick add product
  const handleQuickAdd = (product: { name: string; parameter: string }) => {
    setFProduct(product.name);
    setFParameter(product.parameter);
    setFMlDay('');
    setFDosesDay('24');
    setFEnabled(true);
    setShowQuickAdd(false);
    setShowAddModal(true);
  };

  // Camera identify result
  const handleIdentifyResult = (result: IdentifyResult) => {
    setShowCamera(false);
    const name = `${result.brand || ''} ${result.name}`.trim();
    setFProduct(name);
    const cat = result.category?.toLowerCase() || '';
    if (cat.includes('alk') || cat.includes('buffer') || cat.includes('kh')) setFParameter('alkalinity');
    else if (cat.includes('calc')) setFParameter('calcium');
    else if (cat.includes('mag')) setFParameter('magnesium');
    else if (cat.includes('food') || cat.includes('amino')) setFParameter('food');
    else if (cat.includes('bacteria')) setFParameter('bacteria');
    else if (cat.includes('trace')) setFParameter('trace');
    else if (cat.includes('all-in-one') || cat.includes('all for reef')) setFParameter('all-in-one');
    else setFParameter('supplement');
    setFMlDay('');
    setFDosesDay('24');
    setFEnabled(true);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFProduct('');
    setFParameter('alkalinity');
    setFMlDay('');
    setFDosesDay('24');
    setFEnabled(true);
  };

  const openEditChannel = (index: number) => {
    const ch = channels[index];
    setFProduct(ch.product);
    setFParameter(ch.parameter);
    setFMlDay(String(ch.ml_per_day || ''));
    setFDosesDay(String(ch.doses_per_day || 24));
    setFEnabled(ch.enabled);
    setEditingChannel(index);
    setShowAddModal(true);
  };

  // Filter quick add by search
  const filteredQuickAdd = quickSearch
    ? QUICK_ADD_PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(quickSearch.toLowerCase()) ||
        p.parameter.toLowerCase().includes(quickSearch.toLowerCase())
      )
    : QUICK_ADD_PRODUCTS;

  // Stats
  const activeChannels = channels.filter(ch => ch.enabled);
  const totalMlDay = activeChannels.reduce((sum, ch) => sum + (ch.ml_per_day || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-[#2ff801] animate-pulse">precision_manufacturing</span>
          <p className="text-[#c5c6cd] text-sm">Loading dosing config...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dosing" className="w-9 h-9 rounded-xl bg-[#1c2a41] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[#c5c6cd] text-lg">arrow_back</span>
        </Link>
        <div className="flex-1">
          <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">Configuration</p>
          <h1 className="text-2xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Dosing Manager</h1>
        </div>
        <button
          onClick={() => setShowCamera(true)}
          className="w-10 h-10 rounded-xl bg-[#4cd6fb]/15 flex items-center justify-center active:scale-95 transition-transform"
          title="Scan Product"
        >
          <span className="material-symbols-outlined text-[#4cd6fb] text-lg">photo_camera</span>
        </button>
      </div>

      {/* Success/Error Toasts */}
      {success && (
        <div className="bg-[#2ff801]/10 border border-[#2ff801]/30 rounded-xl p-3 flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[#2ff801] text-sm">check_circle</span>
          <p className="text-[#2ff801] text-sm font-medium">{success}</p>
        </div>
      )}
      {error && (
        <div className="bg-[#ff4444]/10 border border-[#ff4444]/30 rounded-xl p-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#ff4444] text-sm">error</span>
          <p className="text-[#ff4444] text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-[#ff4444]">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* ═══ Pump Info Card ═══ */}
      <div className="bg-[#0d1c32] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#2ff801]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#2ff801] text-xl">precision_manufacturing</span>
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-headline)] font-bold text-white text-base">
                {config?.pump_model || 'Dosing Pump'}
              </h3>
              <p className="text-[#8f9097] text-xs">
                {config?.pump_brand || 'Not configured'} &bull; {(config?.method || 'pump').replace('_', ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditingPump(!editingPump)}
            className="w-9 h-9 rounded-xl bg-[#1c2a41] flex items-center justify-center active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-[#c5c6cd] text-sm">{editingPump ? 'close' : 'edit'}</span>
          </button>
        </div>

        {editingPump && (
          <div className="space-y-3 pt-2 border-t border-[#1c2a41]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#8f9097] text-[10px] uppercase tracking-wider font-medium block mb-1">Model</label>
                <input
                  value={fPumpModel}
                  onChange={e => setFPumpModel(e.target.value)}
                  placeholder="e.g. ReefDose 4"
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-[#3a4255] focus:outline-none focus:border-[#FF7F50]"
                />
              </div>
              <div>
                <label className="text-[#8f9097] text-[10px] uppercase tracking-wider font-medium block mb-1">Brand</label>
                <input
                  value={fPumpBrand}
                  onChange={e => setFPumpBrand(e.target.value)}
                  placeholder="e.g. Red Sea"
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-[#3a4255] focus:outline-none focus:border-[#FF7F50]"
                />
              </div>
            </div>
            <div>
              <label className="text-[#8f9097] text-[10px] uppercase tracking-wider font-medium block mb-1">Method</label>
              <div className="flex gap-2">
                {(['pump', 'manual', 'kalkwasser', 'reactor'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setFMethod(m)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      fMethod === m
                        ? 'bg-[#FF7F50] text-white'
                        : 'bg-[#010e24] text-[#c5c6cd] border border-[#1c2a41]'
                    }`}
                  >
                    {m === 'pump' ? 'Dosing Pump' : m === 'manual' ? 'Manual' : m === 'kalkwasser' ? 'Kalkwasser' : 'Reactor'}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleSavePump}
              disabled={saving}
              className="w-full bg-gradient-to-r from-[#FF7F50] to-[#d35e32] text-white font-bold text-sm py-2.5 rounded-xl active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Pump Info'}
            </button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#010e24] rounded-xl p-3 text-center">
            <p className="text-[9px] text-[#8f9097] uppercase font-bold tracking-wider">Channels</p>
            <p className="text-white text-xl font-bold font-[family-name:var(--font-headline)]">{activeChannels.length}</p>
            <p className="text-[9px] text-[#8f9097]">of {channels.length} total</p>
          </div>
          <div className="bg-[#010e24] rounded-xl p-3 text-center">
            <p className="text-[9px] text-[#8f9097] uppercase font-bold tracking-wider">Total mL/day</p>
            <p className="text-[#4cd6fb] text-xl font-bold font-[family-name:var(--font-headline)]">{totalMlDay.toFixed(1)}</p>
            <p className="text-[9px] text-[#8f9097]">all channels</p>
          </div>
          <div className="bg-[#010e24] rounded-xl p-3 text-center">
            <p className="text-[9px] text-[#8f9097] uppercase font-bold tracking-wider">Method</p>
            <p className="text-[#2ff801] text-xl font-bold font-[family-name:var(--font-headline)] capitalize">{config?.method || '---'}</p>
            <p className="text-[9px] text-[#8f9097]">{config?.pump_brand || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* ═══ ATO (Auto Top-Off) Card ═══ */}
      <div className="bg-[#0d1c32] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#4cd6fb]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#4cd6fb] text-xl">water_drop</span>
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-headline)] font-bold text-white text-base">
                Auto Top-Off (ATO)
              </h3>
              <p className="text-[#8f9097] text-xs">
                {config?.ato_enabled
                  ? `${config.ato_model || 'ATO'} ${config.ato_brand ? `by ${config.ato_brand}` : ''} ${config.ato_kalkwasser ? '+ Kalkwasser' : '(RODI only)'}`
                  : 'Not configured'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditingAto(!editingAto)}
            className="w-9 h-9 rounded-xl bg-[#1c2a41] flex items-center justify-center active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-[#c5c6cd] text-sm">{editingAto ? 'close' : 'edit'}</span>
          </button>
        </div>

        {/* ATO Status badges */}
        {config?.ato_enabled && !editingAto && (
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4cd6fb]/10 border border-[#4cd6fb]/20 rounded-lg">
              <span className="material-symbols-outlined text-[#4cd6fb] text-xs">check_circle</span>
              <span className="text-[#4cd6fb] text-[10px] font-bold">ATO Active</span>
            </div>
            {config.ato_kalkwasser && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F1C40F]/10 border border-[#F1C40F]/20 rounded-lg">
                <span className="material-symbols-outlined text-[#F1C40F] text-xs">water_drop</span>
                <span className="text-[#F1C40F] text-[10px] font-bold">
                  Kalkwasser {config.ato_kalk_tsp_per_gal ? `(${config.ato_kalk_tsp_per_gal} tsp/gal)` : ''}
                </span>
              </div>
            )}
          </div>
        )}

        {editingAto && (
          <div className="space-y-4 pt-2 border-t border-[#1c2a41]">
            {/* ATO Enabled Toggle */}
            <button
              onClick={() => setFAtoEnabled(!fAtoEnabled)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full ${
                fAtoEnabled ? 'bg-[#4cd6fb]/10 text-[#4cd6fb] border border-[#4cd6fb]/30' : 'bg-[#1c2a41] text-[#8f9097]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{fAtoEnabled ? 'toggle_on' : 'toggle_off'}</span>
              {fAtoEnabled ? 'I have an Auto Top-Off system' : 'No ATO system'}
            </button>

            {fAtoEnabled && (
              <>
                {/* ATO Model Selection */}
                <div>
                  <label className="text-[#8f9097] text-[10px] uppercase tracking-wider font-medium block mb-1.5">ATO Model</label>
                  <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
                    {ATO_MODELS.map(ato => {
                      const isSelected = fAtoModel === ato.name;
                      return (
                        <button
                          key={ato.name}
                          onClick={() => { setFAtoModel(ato.name); setFAtoBrand(ato.brand); }}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                            isSelected
                              ? 'bg-[#4cd6fb]/10 border border-[#4cd6fb]/30'
                              : 'bg-[#010e24] active:bg-[#1c2a41]'
                          }`}
                        >
                          <span className={`material-symbols-outlined text-sm ${isSelected ? 'text-[#4cd6fb]' : 'text-[#8f9097]'}`}>
                            {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <div>
                            <p className={`text-sm font-medium ${isSelected ? 'text-[#4cd6fb]' : 'text-white'}`}>{ato.name}</p>
                            <p className="text-[10px] text-[#8f9097]">{ato.brand}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {/* Custom ATO */}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={fAtoModel}
                      onChange={e => setFAtoModel(e.target.value)}
                      placeholder="Custom model..."
                      className="bg-[#010e24] border border-[#1c2a41] rounded-xl px-3 py-2 text-white text-sm placeholder:text-[#3a4255] focus:outline-none focus:border-[#4cd6fb]"
                    />
                    <input
                      value={fAtoBrand}
                      onChange={e => setFAtoBrand(e.target.value)}
                      placeholder="Brand..."
                      className="bg-[#010e24] border border-[#1c2a41] rounded-xl px-3 py-2 text-white text-sm placeholder:text-[#3a4255] focus:outline-none focus:border-[#4cd6fb]"
                    />
                  </div>
                </div>

                {/* Kalkwasser Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#F1C40F]">science</span>
                    <p className="text-[10px] font-bold text-[#F1C40F]/70 uppercase tracking-widest">Kalkwasser (Calcium Hydroxide)</p>
                  </div>

                  <button
                    onClick={() => setFAtoKalk(!fAtoKalk)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full ${
                      fAtoKalk
                        ? 'bg-[#F1C40F]/10 text-[#F1C40F] border border-[#F1C40F]/30'
                        : 'bg-[#1c2a41] text-[#c5c6cd]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{fAtoKalk ? 'toggle_on' : 'toggle_off'}</span>
                    <div className="text-left flex-1">
                      <p className="font-semibold">{fAtoKalk ? 'Kalkwasser in ATO water' : 'No Kalkwasser'}</p>
                      <p className="text-[10px] opacity-70 mt-0.5">
                        {fAtoKalk
                          ? 'Calcium hydroxide mixed into RODI top-off water. Raises Ca + Alk + pH.'
                          : 'Top-off with plain RODI water only.'}
                      </p>
                    </div>
                  </button>

                  {fAtoKalk && (
                    <div className="bg-[#F1C40F]/5 border border-[#F1C40F]/20 rounded-xl p-4 space-y-3">
                      <div>
                        <label className="text-[#F1C40F] text-[10px] uppercase tracking-wider font-bold block mb-1.5">
                          Concentration (tsp per gallon)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            max="4"
                            value={fAtoKalkTsp}
                            onChange={e => setFAtoKalkTsp(e.target.value)}
                            placeholder="2"
                            className="w-24 bg-[#010e24] border border-[#1c2a41] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-[#3a4255] focus:outline-none focus:border-[#F1C40F]"
                          />
                          <span className="text-[#8f9097] text-xs">tsp / gallon RODI</span>
                        </div>
                        <p className="text-[#8f9097] text-[10px] mt-1.5">Standard: 2 tsp/gal. Start low (1 tsp) if pH runs high.</p>
                      </div>
                      <div className="bg-[#ff4444]/10 border border-[#ff4444]/20 rounded-lg p-3">
                        <div className="flex gap-2">
                          <span className="material-symbols-outlined text-[#ff4444] text-sm shrink-0 mt-0.5">warning</span>
                          <p className="text-[#ffb4ab] text-[10px] leading-relaxed">
                            <strong>Safety:</strong> Kalkwasser raises pH. If dosed too fast (large ATO refill), pH can spike above 8.6 which is lethal.
                            Only use with a reliable ATO that doses small amounts frequently. Monitor pH closely for the first week.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              onClick={handleSaveAto}
              disabled={saving}
              className="w-full bg-gradient-to-r from-[#4cd6fb] to-[#2ba8d4] text-white font-bold text-sm py-2.5 rounded-xl active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save ATO Configuration'}
            </button>
          </div>
        )}
      </div>

      {/* ═══ Channels List ═══ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FF7F50] text-lg">tune</span>
            <h2 className="font-[family-name:var(--font-headline)] font-bold text-white text-lg">Channels</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowQuickAdd(true); setQuickSearch(''); }}
              className="flex items-center gap-1 px-3 py-2 bg-[#1c2a41] text-[#c5c6cd] rounded-xl text-xs font-medium active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-sm">list</span>
              Browse
            </button>
            <button
              onClick={() => { resetForm(); setEditingChannel(null); setShowAddModal(true); }}
              className="flex items-center gap-1 px-3 py-2 bg-gradient-to-br from-[#FF7F50] to-[#d35e32] text-white rounded-xl text-xs font-bold active:scale-95 transition-transform shadow-lg shadow-[#FF7F50]/20"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add
            </button>
          </div>
        </div>

        {channels.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <span className="material-symbols-outlined text-5xl text-[#1c2a41]">precision_manufacturing</span>
            <p className="text-[#c5c6cd] text-sm">No dosing channels configured</p>
            <p className="text-[#8f9097] text-xs">Add what your pump doses --- alkalinity, calcium, food, supplements...</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {QUICK_ADD_PRODUCTS.slice(0, 6).map(p => (
                <button
                  key={p.name}
                  onClick={() => handleQuickAdd(p)}
                  className="px-3 py-1.5 bg-[#1c2a41] text-[#c5c6cd] rounded-full text-[11px] font-medium active:scale-95 transition-transform border border-[#27354c]"
                >
                  + {p.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {channels.map((ch, index) => {
              const affects = getAffects(ch.parameter);
              return (
                <div
                  key={`ch-${index}`}
                  className={`bg-[#0d1c32] rounded-xl p-4 space-y-2 transition-opacity ${!ch.enabled ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${affects.color}15` }}>
                      <span className="text-xs font-bold font-[family-name:var(--font-headline)]" style={{ color: affects.color }}>
                        {ch.channel}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-[family-name:var(--font-headline)] font-semibold text-white text-sm truncate">{ch.product}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="material-symbols-outlined text-[10px]" style={{ color: affects.color }}>{affects.icon}</span>
                        <span className="text-[10px] font-medium" style={{ color: affects.color }}>{affects.label}</span>
                        <span className="text-[10px] text-[#8f9097]">&bull;</span>
                        <span className="text-[10px] text-[#c5c6cd]">{ch.doses_per_day}x/day</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold font-[family-name:var(--font-headline)]" style={{ color: affects.color }}>
                        {ch.ml_per_day || 0}
                      </p>
                      <p className="text-[9px] text-[#8f9097]">mL/day</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-[#1c2a41]/50">
                    <button
                      onClick={() => handleToggleChannel(index)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        ch.enabled ? 'bg-[#2ff801]/10 text-[#2ff801]' : 'bg-[#1c2a41] text-[#8f9097]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">{ch.enabled ? 'toggle_on' : 'toggle_off'}</span>
                      {ch.enabled ? 'ON' : 'OFF'}
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => openEditChannel(index)}
                      className="w-8 h-8 rounded-lg bg-[#1c2a41] flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <span className="material-symbols-outlined text-[#c5c6cd] text-sm">edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteChannel(index)}
                      className="w-8 h-8 rounded-lg bg-[#93000a]/20 flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <span className="material-symbols-outlined text-[#ffb4ab] text-sm">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ Smart Dosing Link ═══ */}
      <Link
        href="/dosing"
        className="block bg-gradient-to-r from-[#4cd6fb]/10 to-[#041329] rounded-2xl p-4 border border-[#4cd6fb]/20 active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#4cd6fb]/15 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#4cd6fb]">calculate</span>
          </div>
          <div className="flex-1">
            <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm">Smart Dosing Calculator</p>
            <p className="text-[10px] text-[#c5c6cd] mt-0.5">Get dosing recommendations based on your water tests and pump config</p>
          </div>
          <span className="material-symbols-outlined text-[#4cd6fb]">arrow_forward</span>
        </div>
      </Link>

      {/* ═══ Tips ═══ */}
      <div className="bg-[#0d1c32] rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#F1C40F] text-lg">lightbulb</span>
          <h3 className="font-[family-name:var(--font-headline)] font-bold text-white text-base">Dosing Tips</h3>
        </div>
        <div className="space-y-2">
          {[
            { icon: 'schedule', color: '#4cd6fb', tip: 'Space Alk and Ca doses 30+ minutes apart --- they precipitate if mixed.' },
            { icon: 'speed', color: '#F1C40F', tip: 'More doses per day = more stable parameters. 24x (once per hour) is ideal.' },
            { icon: 'straighten', color: '#2ff801', tip: 'Calibrate pump tubes monthly. Output decreases as tubing wears.' },
            { icon: 'water_drop', color: '#c5c6cd', tip: 'Kalkwasser in ATO raises Ca + Alk + pH simultaneously. Great for maintenance, but watch pH spikes.' },
            { icon: 'photo_camera', color: '#FF7F50', tip: 'Use the camera button to scan any product bottle and auto-add it.' },
          ].map(item => (
            <div key={item.tip} className="flex items-start gap-3 bg-[#010e24] rounded-xl p-3">
              <span className="material-symbols-outlined text-base mt-0.5 shrink-0" style={{ color: item.color }}>{item.icon}</span>
              <p className="text-[#c5c6cd] text-xs leading-relaxed">{item.tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Add/Edit Channel Modal ═══ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setEditingChannel(null); }}>
          <div
            className="bg-[#0d1c32] rounded-t-3xl w-full max-w-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between sticky top-0 bg-[#0d1c32] pb-2 -mt-2 pt-2 z-10">
              <h3 className="font-[family-name:var(--font-headline)] font-bold text-white text-lg">
                {editingChannel !== null ? `Edit Channel ${editingChannel + 1}` : 'Add Channel'}
              </h3>
              <button onClick={() => { setShowAddModal(false); setEditingChannel(null); }} className="w-8 h-8 rounded-full bg-[#1c2a41] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#c5c6cd] text-sm">close</span>
              </button>
            </div>

            {/* Product Name */}
            <div>
              <label className="text-[#8f9097] text-[10px] uppercase tracking-wider font-medium block mb-1.5">Product Name</label>
              <div className="flex gap-2">
                <input
                  value={fProduct}
                  onChange={e => setFProduct(e.target.value)}
                  placeholder="e.g. BRS Soda Ash"
                  className="flex-1 bg-[#010e24] border border-[#1c2a41] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-[#3a4255] focus:outline-none focus:border-[#FF7F50]"
                  autoFocus
                />
                <button
                  onClick={() => setShowCamera(true)}
                  className="w-11 h-11 rounded-xl bg-[#4cd6fb]/15 flex items-center justify-center shrink-0 active:scale-90"
                  title="Scan with camera"
                >
                  <span className="material-symbols-outlined text-[#4cd6fb]">photo_camera</span>
                </button>
              </div>
            </div>

            {/* Affects Parameter */}
            <div>
              <label className="text-[#8f9097] text-[10px] uppercase tracking-wider font-medium block mb-1.5">Affects</label>
              <div className="flex flex-wrap gap-1.5">
                {AFFECTS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFParameter(opt.value)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      fParameter === opt.value
                        ? 'text-white'
                        : 'bg-[#010e24] text-[#8f9097] border border-[#1c2a41]'
                    }`}
                    style={fParameter === opt.value ? { backgroundColor: `${opt.color}25`, color: opt.color, borderColor: `${opt.color}40`, borderWidth: 1, borderStyle: 'solid' } : undefined}
                  >
                    <span className="material-symbols-outlined text-xs">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* mL/day + Doses/day */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#8f9097] text-[10px] uppercase tracking-wider font-medium block mb-1.5">mL per Day</label>
                <input
                  type="number"
                  step="0.1"
                  value={fMlDay}
                  onChange={e => setFMlDay(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-[#3a4255] focus:outline-none focus:border-[#FF7F50]"
                />
              </div>
              <div>
                <label className="text-[#8f9097] text-[10px] uppercase tracking-wider font-medium block mb-1.5">Doses per Day</label>
                <select
                  value={fDosesDay}
                  onChange={e => setFDosesDay(e.target.value)}
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#FF7F50] appearance-none"
                >
                  <option value="1">1x (once daily)</option>
                  <option value="2">2x (every 12h)</option>
                  <option value="3">3x (every 8h)</option>
                  <option value="4">4x (every 6h)</option>
                  <option value="6">6x (every 4h)</option>
                  <option value="12">12x (every 2h)</option>
                  <option value="24">24x (every hour)</option>
                  <option value="48">48x (every 30 min)</option>
                </select>
              </div>
            </div>

            {/* Enabled toggle */}
            <button
              onClick={() => setFEnabled(!fEnabled)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                fEnabled ? 'bg-[#2ff801]/10 text-[#2ff801]' : 'bg-[#1c2a41] text-[#8f9097]'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{fEnabled ? 'toggle_on' : 'toggle_off'}</span>
              {fEnabled ? 'Channel Enabled' : 'Channel Disabled'}
            </button>

            {/* Save — sticky at bottom */}
            <div className="sticky bottom-0 bg-[#0d1c32] pt-2 pb-1">
              <button
                onClick={editingChannel !== null ? () => handleUpdateChannel(editingChannel) : handleAddChannel}
                disabled={!fProduct.trim() || saving}
                className="w-full bg-gradient-to-r from-[#FF7F50] to-[#d35e32] text-white font-bold text-sm py-3.5 rounded-xl active:scale-[0.98] disabled:opacity-40 font-[family-name:var(--font-headline)] tracking-wide shadow-lg shadow-[#FF7F50]/25"
              >
                {saving ? 'Saving...' : editingChannel !== null ? 'Update Channel' : 'Add Channel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Quick Add / Browse Products Modal ═══ */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowQuickAdd(false)}>
          <div
            className="bg-[#0d1c32] rounded-t-3xl w-full max-w-lg p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-[family-name:var(--font-headline)] font-bold text-white text-lg">Browse Products</h3>
              <button onClick={() => setShowQuickAdd(false)} className="w-8 h-8 rounded-full bg-[#1c2a41] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#c5c6cd] text-sm">close</span>
              </button>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8f9097] text-sm">search</span>
              <input
                ref={searchRef}
                value={quickSearch}
                onChange={e => setQuickSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl pl-9 pr-3 py-2.5 text-white text-sm placeholder:text-[#3a4255] focus:outline-none focus:border-[#FF7F50]"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              {filteredQuickAdd.map(p => {
                const affects = getAffects(p.parameter);
                const alreadyAdded = channels.some(ch => ch.product.toLowerCase() === p.name.toLowerCase());
                return (
                  <button
                    key={p.name}
                    onClick={() => !alreadyAdded && handleQuickAdd(p)}
                    disabled={alreadyAdded}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      alreadyAdded
                        ? 'bg-[#2ff801]/5 opacity-50'
                        : 'bg-[#010e24] active:scale-[0.98] active:bg-[#1c2a41]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${affects.color}15` }}>
                      <span className="material-symbols-outlined text-sm" style={{ color: affects.color }}>{affects.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{p.name}</p>
                      <p className="text-[10px]" style={{ color: affects.color }}>{affects.label}</p>
                    </div>
                    {alreadyAdded ? (
                      <span className="text-[10px] text-[#2ff801] font-bold">ADDED</span>
                    ) : (
                      <span className="material-symbols-outlined text-[#c5c6cd]/40 text-sm">add_circle</span>
                    )}
                  </button>
                );
              })}
              {filteredQuickAdd.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-[#8f9097] text-sm">No products match &quot;{quickSearch}&quot;</p>
                  <button
                    onClick={() => { setShowQuickAdd(false); setFProduct(quickSearch); setShowAddModal(true); }}
                    className="mt-2 text-[#FF7F50] text-xs font-bold"
                  >
                    Add &quot;{quickSearch}&quot; as custom product
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => { setShowQuickAdd(false); resetForm(); setShowAddModal(true); }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#1c2a41] rounded-xl text-[#c5c6cd] text-sm font-medium active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Add Custom Product
            </button>
          </div>
        </div>
      )}

      {/* ═══ AI Camera ═══ */}
      {showCamera && (
        <ImageIdentifier
          context="supplement"
          onResult={handleIdentifyResult}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
