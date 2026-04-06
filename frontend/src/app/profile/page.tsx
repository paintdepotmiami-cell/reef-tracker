'use client';

export default function ProfilePage() {
  return (
    <div className="space-y-8 max-w-lg mx-auto">
      <div>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">Settings</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Profile</h1>
      </div>

      <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF7F50] to-[#d35e32] flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-white">person</span>
        </div>
        <div>
          <h3 className="font-[family-name:var(--font-headline)] font-bold text-white text-lg">Marcial L.</h3>
          <p className="text-[#c5c6cd] text-sm">40 Gallon Mixed Reef &middot; Miami, FL</p>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { icon: 'palette', label: 'Tank Setup', desc: '40 gal, Mixed Reef' },
          { icon: 'language', label: 'Language', desc: 'English' },
          { icon: 'notifications', label: 'Notifications', desc: 'Enabled' },
          { icon: 'info', label: 'About ReefOS', desc: 'v1.0.0' },
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
    </div>
  );
}
