'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function ProfilePage() {
  const { profile, tank, user, signOut } = useAuth();

  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <div>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">Settings</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Profile</h1>
      </div>

      <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF7F50] to-[#d35e32] flex items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {(profile?.display_name || '?')[0].toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="font-[family-name:var(--font-headline)] font-bold text-white text-lg">{profile?.display_name || 'Reefer'}</h3>
          <p className="text-[#c5c6cd] text-sm">
            {tank ? `${tank.name}${tank.size_gallons ? ` \u00b7 ${tank.size_gallons} gal` : ''}` : 'No tank set up'}
            {profile?.location_city && ` \u00b7 ${profile.location_city}, ${profile.location_state}`}
          </p>
          <p className="text-[#8f9097] text-xs mt-0.5">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest pt-2">Tank & Account</p>

        {[
          { icon: 'water', label: 'Tank Setup', desc: tank ? `${tank.size_gallons || '\u2014'} gal, ${tank.tank_type === 'mixed' ? 'Mixed Reef' : tank.tank_type === 'reef' ? 'Reef' : tank.tank_type === 'fish_only' ? 'Fish Only' : 'Nano'}` : 'Not configured' },
          { icon: 'school', label: 'Experience', desc: profile?.experience_level ? profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1) : 'Not set' },
          { icon: 'straighten', label: 'Units', desc: profile?.units === 'metric' ? 'Metric (L, \u00b0C, cm)' : 'Imperial (gal, \u00b0F, in)' },
          { icon: 'language', label: 'Language', desc: profile?.language === 'es' ? 'Español' : profile?.language === 'pt' ? 'Português' : 'English' },
          { icon: 'notifications', label: 'Notifications', desc: 'Coming soon' },
          { icon: 'settings_remote', label: 'IoT / Devices', desc: 'Coming soon' },
          { icon: 'info', label: 'About ReefOS', desc: 'v4.0.0 \u2014 Setup Wizard' },
        ].map(item => (
          <div key={item.label} className="bg-[#0d1c32] rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-[#112036] transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#1c2a41] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#ffb59c]">{item.icon}</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">{item.label}</p>
              <p className="text-[#c5c6cd] text-xs">{item.desc}</p>
            </div>
            <span className="material-symbols-outlined text-[#c5c6cd]/40">chevron_right</span>
          </div>
        ))}
      </div>

      {/* New Tank Setup */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest pt-2">Multi-Tank</p>
        <Link href="/onboarding"
          className="bg-gradient-to-r from-[#FF7F50]/10 to-[#d35e32]/10 border border-[#FF7F50]/20 rounded-xl p-4 flex items-center gap-4 hover:border-[#FF7F50]/40 transition-colors block">
          <div className="w-10 h-10 rounded-xl bg-[#FF7F50]/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#FF7F50]">add_circle</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">New Tank Setup</p>
            <p className="text-[#c5c6cd] text-xs">Add a quarantine, frag, or upgrade tank</p>
          </div>
          <span className="material-symbols-outlined text-[#FF7F50]">arrow_forward</span>
        </Link>
      </div>

      {/* Sign Out */}
      <button
        onClick={signOut}
        className="w-full py-3.5 bg-[#93000a]/20 text-[#ffb4ab] rounded-xl hover:bg-[#93000a]/30 transition font-semibold cursor-pointer text-sm flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">logout</span>
        Sign Out
      </button>
    </div>
  );
}
