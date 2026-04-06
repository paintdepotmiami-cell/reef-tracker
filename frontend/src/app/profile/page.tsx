'use client';

import { useAuth } from '@/lib/auth';

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
            {tank ? `${tank.name}${tank.size_gallons ? ` · ${tank.size_gallons} gal` : ''}` : 'No tank set up'}
            {profile?.location_city && ` · ${profile.location_city}, ${profile.location_state}`}
          </p>
          <p className="text-[#8f9097] text-xs mt-0.5">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { icon: 'water', label: 'Tank Setup', desc: tank ? `${tank.size_gallons || '—'} gal, ${tank.tank_type === 'mixed' ? 'Mixed Reef' : tank.tank_type === 'reef' ? 'Reef' : tank.tank_type === 'fish_only' ? 'Fish Only' : 'Nano'}` : 'Not configured' },
          { icon: 'school', label: 'Experience', desc: profile?.experience_level ? profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1) : 'Not set' },
          { icon: 'straighten', label: 'Units', desc: profile?.units === 'metric' ? 'Metric (L, °C, cm)' : 'Imperial (gal, °F, in)' },
          { icon: 'language', label: 'Language', desc: profile?.language === 'es' ? 'Espanol' : profile?.language === 'pt' ? 'Portugues' : 'English' },
          { icon: 'notifications', label: 'Notifications', desc: 'Coming soon' },
          { icon: 'info', label: 'About ReefOS', desc: 'v2.0.0 — Session 2' },
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
