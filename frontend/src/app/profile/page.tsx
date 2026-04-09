'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { updateProfile, updateTank } from '@/lib/queries';
import Link from 'next/link';

const PROFILE_FIELDS = ['display_name', 'experience_level', 'location_city', 'location_state', 'units', 'language'];
const TANK_FIELDS = ['name', 'size_gallons', 'tank_type', 'sump_type', 'reef_goal'];

const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Espanol' },
  { value: 'pt', label: 'Portugues' },
];

const TANK_TYPE_OPTIONS = [
  { value: 'mixed', label: 'Mixed Reef' },
  { value: 'reef', label: 'SPS/LPS Reef' },
  { value: 'fish_only', label: 'Fish Only' },
  { value: 'nano', label: 'Nano Reef' },
];

const SUMP_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'basic', label: 'Basic' },
  { value: 'refugium', label: 'Refugium' },
  { value: 'advanced', label: 'Advanced' },
];

export default function ProfilePage() {
  const { profile, tank, user, signOut, refreshProfile, refreshTank } = useAuth();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveField = async () => {
    if (!user || !editingField) return;
    setSaving(true);
    try {
      if (PROFILE_FIELDS.includes(editingField)) {
        await updateProfile(user.id, { [editingField]: editValue });
        await refreshProfile();
      } else if (TANK_FIELDS.includes(editingField) && tank) {
        const val = editingField === 'size_gallons' ? (editValue ? Number(editValue) : null) : editValue;
        await updateTank(tank.id, { [editingField]: val });
        await refreshTank();
      }
    } finally {
      setEditingField(null);
      setEditValue('');
      setSaving(false);
    }
  };

  const displayValue = (field: string, raw: string | null | undefined): string => {
    if (!raw) return 'Not set';
    switch (field) {
      case 'experience_level':
        return EXPERIENCE_OPTIONS.find(o => o.value === raw)?.label || raw;
      case 'language':
        return LANGUAGE_OPTIONS.find(o => o.value === raw)?.label || raw;
      case 'units':
        return raw === 'metric' ? 'Metric' : 'Imperial';
      case 'tank_type':
        return TANK_TYPE_OPTIONS.find(o => o.value === raw)?.label || raw;
      case 'sump_type':
        return SUMP_OPTIONS.find(o => o.value === raw)?.label || raw;
      case 'size_gallons':
        return `${raw} gal`;
      default:
        return raw;
    }
  };

  function EditableRow({ icon, label, value, field, type = 'text', options, suffix }: {
    icon: string;
    label: string;
    value: string | null | undefined;
    field: string;
    type?: 'text' | 'number' | 'select' | 'toggle';
    options?: { value: string; label: string }[];
    suffix?: string;
  }) {
    const isEditing = editingField === field;

    return (
      <div className="bg-[#0d1c32] rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1c2a41] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#ffb59c]">{icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#8f9097] text-[11px] font-medium uppercase tracking-wider">{label}</p>
            {!isEditing ? (
              <p className="text-white text-sm font-medium truncate">{displayValue(field, value as string)}</p>
            ) : null}
          </div>
          {!isEditing && (
            <button
              onClick={() => startEdit(field, (value as string) || '')}
              className="w-8 h-8 rounded-lg bg-[#1c2a41] flex items-center justify-center active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[#FF7F50] text-[18px]">edit</span>
            </button>
          )}
        </div>

        {isEditing && (
          <div className="mt-3 ml-[52px]">
            {type === 'text' && (
              <input
                type="text"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                autoFocus
                className="w-full bg-[#010e24] border border-[#1c2a41] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#FF7F50] transition-colors"
              />
            )}

            {type === 'number' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  autoFocus
                  className="flex-1 bg-[#010e24] border border-[#1c2a41] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#FF7F50] transition-colors"
                />
                {suffix && <span className="text-[#8f9097] text-sm">{suffix}</span>}
              </div>
            )}

            {type === 'select' && options && (
              <div className="flex flex-wrap gap-2">
                {options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setEditValue(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
                      editValue === opt.value
                        ? 'bg-[#FF7F50] text-white'
                        : 'bg-[#1c2a41] text-[#c5c6cd] hover:bg-[#253448]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {type === 'toggle' && (
              <div className="flex gap-2">
                {[
                  { value: 'imperial', label: 'Imperial' },
                  { value: 'metric', label: 'Metric' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setEditValue(opt.value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                      editValue === opt.value
                        ? 'bg-[#FF7F50] text-white'
                        : 'bg-[#1c2a41] text-[#c5c6cd] hover:bg-[#253448]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={saveField}
                disabled={saving}
                className="px-4 py-1.5 bg-[#FF7F50] text-white text-sm font-semibold rounded-lg active:scale-95 transition-transform disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={cancelEdit}
                className="px-4 py-1.5 bg-[#1c2a41] text-[#c5c6cd] text-sm font-medium rounded-lg active:scale-95 transition-transform"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#FF7F50] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/" className="w-9 h-9 rounded-xl bg-[#0d1c32] flex items-center justify-center active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-[#c5c6cd] text-[20px]">arrow_back</span>
        </Link>
        <h1 className="text-2xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Profile</h1>
      </div>

      {/* Avatar Card */}
      <div className="bg-[#0d1c32] rounded-2xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF7F50] to-[#d35e32] flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-white">
            {(profile?.display_name || '?')[0].toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="font-[family-name:var(--font-headline)] font-bold text-white text-lg truncate">
            {profile?.display_name || 'Reefer'}
          </h3>
          <p className="text-[#8f9097] text-sm truncate">{user?.email}</p>
        </div>
      </div>

      {/* My Profile Section */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest px-1">My Profile</p>
        <div className="space-y-2">
          <EditableRow icon="person" label="Display Name" value={profile?.display_name} field="display_name" />
          <EditableRow icon="school" label="Experience Level" value={profile?.experience_level} field="experience_level" type="select" options={EXPERIENCE_OPTIONS} />
          <EditableRow icon="location_on" label="City" value={profile?.location_city} field="location_city" />
          <EditableRow icon="map" label="State" value={profile?.location_state} field="location_state" />
          <EditableRow icon="straighten" label="Units" value={profile?.units} field="units" type="toggle" />
          <EditableRow icon="language" label="Language" value={profile?.language} field="language" type="select" options={LANGUAGE_OPTIONS} />
        </div>
      </div>

      {/* My Tank Section */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest px-1">My Tank</p>
        <div className="space-y-2">
          <EditableRow icon="water" label="Tank Name" value={tank?.name} field="name" />
          <EditableRow icon="straighten" label="Size" value={tank?.size_gallons?.toString()} field="size_gallons" type="number" suffix="gal" />
          <EditableRow icon="waves" label="Type" value={tank?.tank_type} field="tank_type" type="select" options={TANK_TYPE_OPTIONS} />
          <EditableRow icon="filter_alt" label="Sump" value={tank?.sump_type} field="sump_type" type="select" options={SUMP_OPTIONS} />
          <EditableRow icon="flag" label="Goal" value={tank?.reef_goal} field="reef_goal" />
        </div>
      </div>

      {/* Quick Links */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest px-1">Quick Links</p>
        <Link href="/gear" className="bg-[#0d1c32] rounded-xl p-4 flex items-center gap-3 hover:bg-[#112036] transition-colors active:scale-[0.98] block">
          <div className="w-10 h-10 rounded-xl bg-[#1c2a41] flex items-center justify-center">
            <span className="material-symbols-outlined text-[#ffb59c]">build</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">Equipment & Supplements</p>
          </div>
          <span className="material-symbols-outlined text-[#c5c6cd]/40">chevron_right</span>
        </Link>
        <Link href="/onboarding" className="bg-[#0d1c32] rounded-xl p-4 flex items-center gap-3 hover:bg-[#112036] transition-colors active:scale-[0.98] block">
          <div className="w-10 h-10 rounded-xl bg-[#1c2a41] flex items-center justify-center">
            <span className="material-symbols-outlined text-[#ffb59c]">restart_alt</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">Run Setup Wizard Again</p>
          </div>
          <span className="material-symbols-outlined text-[#c5c6cd]/40">chevron_right</span>
        </Link>
      </div>

      {/* About */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest px-1">About</p>
        <div className="bg-[#0d1c32] rounded-xl p-4">
          <p className="text-white text-sm font-medium">ReefOS v4.0</p>
          <p className="text-[#8f9097] text-xs mt-1">AI-powered reef aquarium management</p>
          <div className="flex gap-4 mt-3">
            <a href="https://reefos.net" target="_blank" rel="noopener" className="text-[#FF7F50] text-xs font-medium active:scale-95 transition-transform">Website</a>
            <a href="https://youtube.com/@ReefOS_US" target="_blank" rel="noopener" className="text-[#FF7F50] text-xs font-medium active:scale-95 transition-transform">YouTube</a>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={signOut}
        className="w-full py-3.5 bg-[#93000a]/20 text-[#ffb4ab] rounded-xl hover:bg-[#93000a]/30 transition font-semibold cursor-pointer text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-sm">logout</span>
        Sign Out
      </button>
    </div>
  );
}
