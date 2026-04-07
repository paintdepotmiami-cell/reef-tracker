'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  getEquipment, getSupplements,
  createEquipment, updateEquipment, deleteEquipment,
  createSupplement, updateSupplement, deleteSupplement,
} from '@/lib/queries';
import type { Equipment, Supplement } from '@/lib/queries';
import Link from 'next/link';

const EQ_CATEGORIES = [
  { key: 'lighting', icon: 'light_mode', color: 'text-[#F1C40F]', bg: 'bg-[#F1C40F]/10' },
  { key: 'filtration', icon: 'filter_alt', color: 'text-[#4cd6fb]', bg: 'bg-[#4cd6fb]/10' },
  { key: 'circulation', icon: 'waves', color: 'text-[#2ff801]', bg: 'bg-[#2ff801]/10' },
  { key: 'heating', icon: 'thermostat', color: 'text-[#FF7F50]', bg: 'bg-[#FF7F50]/10' },
  { key: 'sump', icon: 'water', color: 'text-[#4cd6fb]', bg: 'bg-[#4cd6fb]/10' },
  { key: 'testing', icon: 'science', color: 'text-[#ffb59c]', bg: 'bg-[#ffb59c]/10' },
  { key: 'water_management', icon: 'water_drop', color: 'text-[#2ff801]', bg: 'bg-[#2ff801]/10' },
  { key: 'controller', icon: 'settings_remote', color: 'text-[#c5c6cd]', bg: 'bg-[#c5c6cd]/10' },
  { key: 'other', icon: 'build', color: 'text-[#c5c6cd]', bg: 'bg-[#c5c6cd]/10' },
];

const SUP_TYPES = [
  'calcium supplement', 'alkalinity supplement', 'magnesium supplement',
  'trace elements', 'coral food', 'bacteria', 'phosphate remover', 'other',
];

function getCatMeta(cat: string | null) {
  return EQ_CATEGORIES.find(c => c.key === (cat || 'other')) || EQ_CATEGORIES[EQ_CATEGORIES.length - 1];
}

export default function GearPage() {
  const { user, tank } = useAuth();
  const [tab, setTab] = useState<'equipment' | 'supplements'>('equipment');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Equipment | Supplement | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Form fields
  const [fName, setFName] = useState('');
  const [fBrand, setFBrand] = useState('');
  const [fCategory, setFCategory] = useState('other');
  const [fType, setFType] = useState('other');
  const [fConfig, setFConfig] = useState('');
  const [fNotes, setFNotes] = useState('');

  useEffect(() => {
    Promise.allSettled([
      getEquipment().then(setEquipment),
      getSupplements().then(setSupplements),
    ]).finally(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setEditing(null);
    setFName(''); setFBrand(''); setFCategory('other'); setFType('other');
    setFConfig(''); setFNotes('');
    setShowModal(true);
  };

  const openEdit = (item: Equipment | Supplement) => {
    setEditing(item);
    setFName(item.name);
    setFBrand(item.brand || '');
    setFNotes(item.notes || '');
    if (tab === 'equipment') {
      const eq = item as Equipment;
      setFCategory(eq.category || 'other');
      setFConfig(eq.config || '');
    } else {
      const sup = item as Supplement;
      setFType(sup.type || 'other');
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!fName.trim() || !user) return;
    setSaving(true);

    if (tab === 'equipment') {
      const payload = {
        name: fName.trim(),
        brand: fBrand.trim() || null,
        category: fCategory,
        config: fConfig.trim() || null,
        notes: fNotes.trim() || null,
        user_id: user.id,
        tank_id: tank?.id || null,
      };
      if (editing) {
        await updateEquipment(editing.id, payload);
      } else {
        await createEquipment(payload);
      }
      const updated = await getEquipment();
      setEquipment(updated);
    } else {
      const payload = {
        name: fName.trim(),
        brand: fBrand.trim() || null,
        type: fType,
        notes: fNotes.trim() || null,
        user_id: user.id,
        tank_id: tank?.id || null,
      };
      if (editing) {
        await updateSupplement(editing.id, payload);
      } else {
        await createSupplement(payload);
      }
      const updated = await getSupplements();
      setSupplements(updated);
    }

    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (tab === 'equipment') {
      await deleteEquipment(id);
      setEquipment(prev => prev.filter(e => e.id !== id));
    } else {
      await deleteSupplement(id);
      setSupplements(prev => prev.filter(s => s.id !== id));
    }
    setConfirmDelete(null);
  };

  // Group equipment by category
  const grouped = equipment.reduce<Record<string, Equipment[]>>((acc, eq) => {
    const cat = eq.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(eq);
    return acc;
  }, {});

  // Group supplements by type
  const supGrouped = supplements.reduce<Record<string, Supplement[]>>((acc, s) => {
    const t = s.type || 'other';
    if (!acc[t]) acc[t] = [];
    acc[t].push(s);
    return acc;
  }, {});

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-5xl text-[#FF7F50] animate-pulse">settings_input_component</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/profile" className="w-9 h-9 rounded-xl bg-[#1c2a41] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[#c5c6cd] text-lg">arrow_back</span>
        </Link>
        <div className="flex-1">
          <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">My Tank</p>
          <h1 className="text-2xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Gear & Dosing</h1>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-br from-[#FF7F50] to-[#d35e32] text-white rounded-xl font-[family-name:var(--font-headline)] font-bold text-sm shadow-lg shadow-[#FF7F50]/20 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Add
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-3">
        <button
          onClick={() => setTab('equipment')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-[family-name:var(--font-headline)] text-sm tracking-wide transition-all ${
            tab === 'equipment'
              ? 'bg-[#FF7F50] text-white font-bold'
              : 'bg-[#1c2a41] text-[#c5c6cd] hover:bg-[#27354c]'
          }`}
        >
          <span className="material-symbols-outlined text-lg">settings_input_component</span>
          Equipment
          <span className="text-[10px] opacity-70">({equipment.length})</span>
        </button>
        <button
          onClick={() => setTab('supplements')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-[family-name:var(--font-headline)] text-sm tracking-wide transition-all ${
            tab === 'supplements'
              ? 'bg-[#FF7F50] text-white font-bold'
              : 'bg-[#1c2a41] text-[#c5c6cd] hover:bg-[#27354c]'
          }`}
        >
          <span className="material-symbols-outlined text-lg">science</span>
          Supplements
          <span className="text-[10px] opacity-70">({supplements.length})</span>
        </button>
      </div>

      {/* Equipment List */}
      {tab === 'equipment' && (
        <div className="space-y-6">
          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-[#1c2a41] mb-3 block">settings_input_component</span>
              <p className="text-[#c5c6cd] text-sm">No equipment yet</p>
              <p className="text-[#8f9097] text-xs mt-1">Tap + to add your first piece of gear</p>
            </div>
          )}
          {EQ_CATEGORIES.map(cat => {
            const items = grouped[cat.key];
            if (!items || items.length === 0) return null;
            return (
              <div key={cat.key} className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-7 h-7 rounded-lg ${cat.bg} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined text-sm ${cat.color}`}>{cat.icon}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#c5c6cd] uppercase tracking-widest">
                    {cat.key.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-[#8f9097]">({items.length})</span>
                </div>
                {items.map(eq => (
                  <div
                    key={eq.id}
                    className="bg-[#0d1c32] rounded-xl p-4 flex items-start gap-3 group"
                  >
                    <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center shrink-0`}>
                      <span className={`material-symbols-outlined ${cat.color}`}>{cat.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-[family-name:var(--font-headline)] font-semibold text-white text-sm truncate">{eq.name}</p>
                      {eq.brand && <p className="text-[10px] text-[#FF7F50]/60 mt-0.5">{eq.brand}</p>}
                      {eq.config && <p className="text-xs text-[#c5c6cd] mt-1 leading-relaxed">{eq.config}</p>}
                      {eq.notes && <p className="text-[10px] text-[#8f9097] mt-1 italic">{eq.notes}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(eq)}
                        className="w-8 h-8 rounded-lg bg-[#1c2a41] flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <span className="material-symbols-outlined text-[#c5c6cd] text-sm">edit</span>
                      </button>
                      {confirmDelete === eq.id ? (
                        <button
                          onClick={() => handleDelete(eq.id)}
                          className="w-8 h-8 rounded-lg bg-[#93000a]/30 flex items-center justify-center active:scale-90 transition-transform"
                        >
                          <span className="material-symbols-outlined text-[#ffb4ab] text-sm">check</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(eq.id)}
                          className="w-8 h-8 rounded-lg bg-[#1c2a41] flex items-center justify-center active:scale-90 transition-transform"
                        >
                          <span className="material-symbols-outlined text-[#c5c6cd] text-sm">delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Supplements List */}
      {tab === 'supplements' && (
        <div className="space-y-6">
          {Object.keys(supGrouped).length === 0 && (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-[#1c2a41] mb-3 block">science</span>
              <p className="text-[#c5c6cd] text-sm">No supplements yet</p>
              <p className="text-[#8f9097] text-xs mt-1">Tap + to add your first supplement</p>
            </div>
          )}
          {Object.entries(supGrouped).map(([type, items]) => (
            <div key={type} className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-[#ffb59c]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm text-[#ffb59c]">science</span>
                </div>
                <span className="text-[10px] font-bold text-[#c5c6cd] uppercase tracking-widest">{type}</span>
                <span className="text-[10px] text-[#8f9097]">({items.length})</span>
              </div>
              {items.map(sup => (
                <div
                  key={sup.id}
                  className="bg-[#0d1c32] rounded-xl p-4 flex items-start gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#ffb59c]/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#ffb59c]">science</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-[family-name:var(--font-headline)] font-semibold text-white text-sm truncate">{sup.name}</p>
                    {sup.brand && <p className="text-[10px] text-[#FF7F50]/60 mt-0.5">{sup.brand}</p>}
                    {sup.notes && <p className="text-[10px] text-[#8f9097] mt-1 italic">{sup.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(sup)}
                      className="w-8 h-8 rounded-lg bg-[#1c2a41] flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <span className="material-symbols-outlined text-[#c5c6cd] text-sm">edit</span>
                    </button>
                    {confirmDelete === sup.id ? (
                      <button
                        onClick={() => handleDelete(sup.id)}
                        className="w-8 h-8 rounded-lg bg-[#93000a]/30 flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <span className="material-symbols-outlined text-[#ffb4ab] text-sm">check</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(sup.id)}
                        className="w-8 h-8 rounded-lg bg-[#1c2a41] flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <span className="material-symbols-outlined text-[#c5c6cd] text-sm">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 z-[60] flex items-end sm:items-center justify-center" onClick={() => setShowModal(false)}>
          <div
            className="bg-gradient-to-b from-[#112036] to-[#041329] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto border-t border-[#ffb59c]/10 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 space-y-5">
              {/* Handle bar (mobile) */}
              <div className="flex justify-center sm:hidden">
                <div className="w-10 h-1 rounded-full bg-[#27354c]"></div>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-[family-name:var(--font-headline)] font-bold text-white">
                  {editing ? 'Edit' : 'Add'} {tab === 'equipment' ? 'Equipment' : 'Supplement'}
                </h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-[#1c2a41] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#c5c6cd] text-sm">close</span>
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="font-[family-name:var(--font-headline)] text-[9px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-1.5">Name *</label>
                <input
                  type="text"
                  value={fName}
                  onChange={e => setFName(e.target.value)}
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3 px-4 text-white text-sm focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent placeholder:text-slate-500"
                  placeholder={tab === 'equipment' ? 'e.g. AI Hydra 32 HD' : 'e.g. Kalkwasser'}
                  autoFocus
                />
              </div>

              {/* Brand */}
              <div>
                <label className="font-[family-name:var(--font-headline)] text-[9px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-1.5">Brand</label>
                <input
                  type="text"
                  value={fBrand}
                  onChange={e => setFBrand(e.target.value)}
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3 px-4 text-white text-sm focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent placeholder:text-slate-500"
                  placeholder={tab === 'equipment' ? 'e.g. AquaIllumination' : 'e.g. Brightwell Aquatics'}
                />
              </div>

              {/* Category (equipment) or Type (supplements) */}
              {tab === 'equipment' ? (
                <div>
                  <label className="font-[family-name:var(--font-headline)] text-[9px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-1.5">Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {EQ_CATEGORIES.map(cat => (
                      <button
                        key={cat.key}
                        onClick={() => setFCategory(cat.key)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                          fCategory === cat.key
                            ? 'border-[#FF7F50] bg-[#FF7F50]/10'
                            : 'border-[#1c2a41] bg-[#0d1c32] hover:border-[#27354c]'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-lg ${fCategory === cat.key ? 'text-[#FF7F50]' : cat.color}`}>{cat.icon}</span>
                        <span className={`text-[9px] font-medium capitalize ${fCategory === cat.key ? 'text-[#FF7F50]' : 'text-[#c5c6cd]'}`}>
                          {cat.key.replace('_', ' ')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="font-[family-name:var(--font-headline)] text-[9px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-1.5">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {SUP_TYPES.map(t => (
                      <button
                        key={t}
                        onClick={() => setFType(t)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border capitalize ${
                          fType === t
                            ? 'border-[#FF7F50] bg-[#FF7F50]/10 text-[#FF7F50]'
                            : 'border-[#1c2a41] bg-[#0d1c32] text-[#c5c6cd] hover:border-[#27354c]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Config (equipment only) */}
              {tab === 'equipment' && (
                <div>
                  <label className="font-[family-name:var(--font-headline)] text-[9px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-1.5">Config / Settings</label>
                  <textarea
                    value={fConfig}
                    onChange={e => setFConfig(e.target.value)}
                    rows={2}
                    className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3 px-4 text-white text-sm focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent placeholder:text-slate-500 resize-none"
                    placeholder="e.g. 70% blue, 30% white, ramp 10am-10pm"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="font-[family-name:var(--font-headline)] text-[9px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-1.5">Notes</label>
                <textarea
                  value={fNotes}
                  onChange={e => setFNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3 px-4 text-white text-sm focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent placeholder:text-slate-500 resize-none"
                  placeholder="Optional notes..."
                />
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving || !fName.trim()}
                className="w-full bg-gradient-to-br from-[#FF7F50] to-[#d35e32] text-white font-[family-name:var(--font-headline)] font-bold py-3.5 rounded-xl text-sm tracking-widest uppercase shadow-xl shadow-[#FF7F50]/20 active:scale-[0.98] transition-transform duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> Saving...</>
                ) : (
                  <><span className="material-symbols-outlined text-sm">{editing ? 'check' : 'add'}</span> {editing ? 'Save Changes' : 'Add'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
