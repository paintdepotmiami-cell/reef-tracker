'use client';

export default function TopBar() {
  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#041329]/80 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#FF7F50]">waves</span>
        <span className="font-[family-name:var(--font-headline)] font-bold tracking-[0.15em] text-[#FF7F50] text-lg uppercase">
          ReefOS
        </span>
      </div>
      <button className="w-9 h-9 flex items-center justify-center rounded-full text-[#c5c6cd] hover:bg-[#1c2a41] transition-colors">
        <span className="material-symbols-outlined text-xl">notifications</span>
      </button>
    </header>
  );
}
