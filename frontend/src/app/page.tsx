'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ReefOSLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      title: 'Water Parameter Intelligence',
      text: 'Track Alk, Ca, Mg, NO₃, PO₄, pH, NH₃, and NO₂. Snap a photo of your test kit — AI reads the values. See trends, get alerts, and know exactly when to dose.',
      icon: '🧪',
      screenshot: '/screenshots/params.png',
      alt: 'ReefOS parameter center showing water chemistry analysis',
      tag: 'AI-Powered OCR',
    },
    {
      title: 'Livestock Management',
      text: 'Manage fish, corals, and inverts with health tracking, compatibility checks, quarantine countdowns, and AI camera identification from a 250+ species database.',
      icon: '🐠',
      screenshot: '/screenshots/livestock.png',
      alt: 'ReefOS livestock manager showing fish collection',
      tag: '250+ Species',
    },
    {
      title: 'Alerts, Dosing & Maintenance',
      text: 'Every morning, ReefOS tells you what your reef needs. Smart alerts prioritized by urgency, exact dosing calculations, recurring tasks, and consumable tracking.',
      icon: '⚠️',
      screenshot: '/screenshots/dashboard.png',
      alt: 'ReefOS dashboard with alerts and daily actions',
      tag: 'Decision Intelligence',
    },
    {
      title: '3D Reef Planner',
      text: 'Design your tank layout in 3D. Visualize flow patterns, PAR distribution, and pump placement. Plan coral positions with confidence.',
      icon: '🌊',
      screenshot: '/screenshots/planner.png',
      alt: 'ReefOS 3D planner showing flow simulation',
      tag: 'Flow & PAR Sim',
    },
  ];

  const engines = [
    'Cycling Engine',
    'Feeding Engine',
    'Flow Optimizer',
    'Diagnostics',
    'Emergency Tools',
    'Compatibility Logic',
    'AI Recognition',
    'Maintenance Automation',
  ];

  const faqs = [
    {
      q: 'What parameters does ReefOS track?',
      a: 'Alkalinity (dKH), Calcium (ppm), Magnesium (ppm), Nitrate, Phosphate, pH, Ammonia, and Nitrite. Each has trend analysis, safe ranges, and actionable alerts.',
    },
    {
      q: 'How does AI test recognition work?',
      a: 'Take a photo of your test kit (Hanna Checker, API, etc.) and ReefOS uses Google Gemini AI to read values automatically. No manual typing needed.',
    },
    {
      q: 'Is ReefOS really free?',
      a: 'Yes, 100%. All features are free with no paywalls, premium tiers, or usage limits. We believe every reefer deserves good tools.',
    },
    {
      q: 'Does it work on iPhone and Android?',
      a: 'ReefOS is a progressive web app (PWA). Visit reefos.net on any browser and add to home screen. Works like a native app — no app store needed.',
    },
    {
      q: 'What makes ReefOS different?',
      a: 'Most apps log numbers. ReefOS provides decision intelligence — it analyzes data, identifies trends, warns of problems, suggests dosing, checks compatibility, and gives daily action plans.',
    },
    {
      q: 'Does my data sync across devices?',
      a: 'Yes. All data is stored securely in the cloud and syncs in real-time. Log a test on your phone, check trends on your laptop.',
    },
  ];

  const screenshots = [
    { src: '/screenshots/dashboard.png', alt: 'ReefOS Dashboard' },
    { src: '/screenshots/params.png', alt: 'Parameter Center' },
    { src: '/screenshots/livestock.png', alt: 'Livestock Manager' },
    { src: '/screenshots/planner.png', alt: '3D Reef Planner' },
    { src: '/screenshots/cycle.png', alt: 'Cycle Tracker' },
  ];

  return (
    <div className="min-h-screen bg-[#010e24] text-[#c5c6cd]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* VideoObject structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: [
              {
                '@type': 'VideoObject',
                position: 1,
                name: 'Complete ReefOS App Walkthrough — Free Reef Tank Management App',
                description: 'Full tour of every ReefOS feature — parameter tracking, AI identification, smart dosing, livestock management, alerts, and 3D reef planner.',
                thumbnailUrl: 'https://img.youtube.com/vi/NFo2FZzeuUQ/maxresdefault.jpg',
                uploadDate: '2026-04-07',
                contentUrl: 'https://www.youtube.com/watch?v=NFo2FZzeuUQ',
                embedUrl: 'https://www.youtube-nocookie.com/embed/NFo2FZzeuUQ',
              },
              {
                '@type': 'VideoObject',
                position: 2,
                name: 'ReefOS AI Test Photo Recognition — Read Water Tests with Your Camera',
                description: 'How ReefOS uses AI to read water test results from photos. Supports Hanna Checkers, API kits, and more.',
                thumbnailUrl: 'https://img.youtube.com/vi/OX8lQW-5qj4/maxresdefault.jpg',
                uploadDate: '2026-04-07',
                contentUrl: 'https://www.youtube.com/watch?v=OX8lQW-5qj4',
                embedUrl: 'https://www.youtube-nocookie.com/embed/OX8lQW-5qj4',
              },
              {
                '@type': 'VideoObject',
                position: 3,
                name: 'ReefOS Smart Dosing Calculator — Precise 2-Part Dosing',
                description: 'How ReefOS calculates exact BRS 2-Part dosing amounts based on your water parameters and tank size.',
                thumbnailUrl: 'https://img.youtube.com/vi/b9fziAWpSbQ/maxresdefault.jpg',
                uploadDate: '2026-04-07',
                contentUrl: 'https://www.youtube.com/watch?v=b9fziAWpSbQ',
                embedUrl: 'https://www.youtube-nocookie.com/embed/b9fziAWpSbQ',
              },
              {
                '@type': 'VideoObject',
                position: 4,
                name: 'ReefOS Livestock & Compatibility Manager',
                description: 'Managing fish, corals, and invertebrates with health tracking and compatibility checks in ReefOS.',
                thumbnailUrl: 'https://img.youtube.com/vi/wKJwlgvCR9k/maxresdefault.jpg',
                uploadDate: '2026-04-07',
                contentUrl: 'https://www.youtube.com/watch?v=wKJwlgvCR9k',
                embedUrl: 'https://www.youtube-nocookie.com/embed/wKJwlgvCR9k',
              },
              {
                '@type': 'VideoObject',
                position: 5,
                name: 'ReefOS 3D Reef Planner Demo',
                description: 'Plan your reef tank layout in 3D with flow simulation and PAR distribution visualization.',
                thumbnailUrl: 'https://img.youtube.com/vi/iilKh5fQeCQ/maxresdefault.jpg',
                uploadDate: '2026-04-07',
                contentUrl: 'https://www.youtube.com/watch?v=iilKh5fQeCQ',
                embedUrl: 'https://www.youtube-nocookie.com/embed/iilKh5fQeCQ',
              },
            ],
          }),
        }}
      />
      {/* Background glows */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute left-[-10%] top-[-5%] h-80 w-80 rounded-full bg-[#4cd6fb]/10 blur-[100px]" />
        <div className="absolute right-[-10%] top-[10%] h-96 w-96 rounded-full bg-[#2ff801]/5 blur-[100px]" />
        <div className="absolute bottom-[-15%] left-[20%] h-96 w-96 rounded-full bg-[#FF7F50]/5 blur-[100px]" />
      </div>

      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#010e24]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-3">
            <Image src="/icons/logo-40.png" alt="ReefOS" width={40} height={40} className="rounded-xl" />
            <div>
              <div className="text-lg font-bold text-white tracking-tight">Reef<span className="text-[#FF7F50]">OS</span></div>
              <div className="text-[10px] text-[#8f9097] font-medium uppercase tracking-widest">Reef Tank App</div>
            </div>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-[#c5c6cd] md:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#screenshots" className="transition hover:text-white">Screenshots</a>
            <a href="#videos" className="transition hover:text-white">Videos</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href="/login" className="text-sm font-semibold text-[#c5c6cd] transition hover:text-white hidden sm:block">
              Sign In
            </a>
            <a href="/login" className="rounded-xl bg-[#FF7F50] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#FF7F50]/20 transition hover:scale-[1.03] active:scale-95">
              Start Free
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="mx-auto max-w-7xl px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FF7F50]/20 bg-[#FF7F50]/10 px-4 py-1.5 text-xs font-bold text-[#FF7F50] uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-[#2ff801] animate-pulse" />
              Free forever &middot; No credit card
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-[900] text-white tracking-tight leading-[1.1]" style={{ fontFamily: "'Manrope', sans-serif" }}>
              The All-in-One{' '}
              <span className="bg-gradient-to-r from-[#FF7F50] to-[#4cd6fb] bg-clip-text text-transparent">
                Reef Tank App
              </span>
              {' '}for Tracking, Stability & Growth
            </h1>
            <p className="mt-6 text-lg text-[#c5c6cd] max-w-2xl mx-auto leading-relaxed">
              Track 8 water parameters, manage 250+ species, get AI-powered recommendations,
              and stop guessing what your reef needs. Built by reefers, for reefers.
            </p>
            <p className="mt-4 text-base font-semibold text-[#2ff801]">
              Stop guessing. Start running your reef like a system.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/login" className="rounded-2xl bg-[#FF7F50] px-8 py-4 text-base font-bold text-white shadow-2xl shadow-[#FF7F50]/20 transition hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">rocket_launch</span>
                Start Free
              </a>
              <a href="#videos" className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white transition hover:border-white/20 hover:bg-white/10 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">play_circle</span>
                Watch Videos
              </a>
            </div>
          </div>

          {/* Hero Screenshot - Phone Frame */}
          <div className="mt-12 flex justify-center">
            <div className="rounded-[2.5rem] border-[3px] border-white/[0.12] bg-[#0a0a0a] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)]" style={{ maxWidth: 300 }}>
              <div className="rounded-[2rem] overflow-hidden">
                <Image src="/screenshots/dashboard.png" alt="ReefOS Dashboard — reef tank management app" width={390} height={844} className="w-full" priority />
              </div>
            </div>
          </div>
        </section>

        {/* STATS BAR */}
        <div className="border-y border-white/[0.06] py-10">
          <div className="mx-auto max-w-4xl flex justify-center gap-12 sm:gap-20 flex-wrap px-6">
            {[['8+', 'Parameters'], ['180+', 'Species'], ['550+', 'Products'], ['35', 'Smart Tools']].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-[900] text-[#FF7F50]" style={{ fontFamily: "'Manrope', sans-serif" }}>{num}</div>
                <div className="text-xs font-bold text-[#8f9097] uppercase tracking-wider mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* PROBLEM */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ffb4ab]">The problem</p>
                <h2 className="mt-3 text-3xl font-[900] text-white tracking-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  Most reef tanks fail because of instability, not lack of gear.
                </h2>
              </div>
              <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
                {[
                  ['trending_down', 'Unstable parameters nobody caught in time'],
                  ['edit_note', 'Scattered tracking across apps, sheets, and memory'],
                  ['psychology', 'Too much info, not enough actionable advice'],
                  ['warning', 'No clear plan when something goes wrong'],
                ].map(([icon, text]) => (
                  <div key={text} className="rounded-2xl border border-[#ff6b6b]/10 bg-[#ff6b6b]/[0.03] p-5 flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#ff6b6b] text-xl mt-0.5">{icon}</span>
                    <span className="text-[#c5c6cd] text-sm">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Solution */}
          <div className="mt-6 rounded-3xl border border-[#2ff801]/10 bg-[#2ff801]/[0.02] p-8 max-w-3xl mx-auto">
            <h3 className="text-lg font-bold text-[#2ff801] mb-4">ReefOS turns your reef into a managed system</h3>
            <div className="space-y-3">
              {[
                'One place for all your reef data',
                'AI that reads your tests and tells you what to do',
                'Alerts before problems become emergencies',
                'Built specifically for saltwater reef aquariums',
              ].map(item => (
                <div key={item} className="flex items-center gap-3 text-[#c5c6cd]">
                  <span className="material-symbols-outlined text-[#2ff801] text-lg">check_circle</span>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4cd6fb]">Features</p>
            <h2 className="mt-3 text-4xl font-[900] text-white tracking-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Everything Your Reef Needs. One App.
            </h2>
            <p className="mt-4 text-lg text-[#c5c6cd]">
              From daily parameter tracking to emergency protocols — ReefOS covers the full lifecycle of reef keeping.
            </p>
          </div>

          <div className="space-y-6">
            {features.map((feature, i) => (
              <div key={feature.title} className={`rounded-3xl border border-white/[0.06] bg-[#0d1c32] p-6 lg:p-8 grid gap-8 items-center ${i % 2 === 0 ? 'lg:grid-cols-[1fr_auto]' : 'lg:grid-cols-[auto_1fr]'}`}>
                {i % 2 === 1 && (
                  <div className="hidden lg:flex justify-center">
                    <div className="rounded-[2rem] border-[3px] border-white/[0.12] bg-[#0a0a0a] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" style={{ maxWidth: 220 }}>
                      <div className="rounded-[1.6rem] overflow-hidden">
                        <Image src={feature.screenshot} alt={feature.alt} width={390} height={844} className="w-full" />
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF7F50]/10 text-xl">
                      {feature.icon}
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-[#4cd6fb]/10 text-[#4cd6fb] text-[10px] font-bold uppercase tracking-wider">
                      {feature.tag}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-[#c5c6cd] leading-relaxed">{feature.text}</p>
                </div>
                <div className={`flex justify-center ${i % 2 === 1 ? 'lg:hidden' : ''}`}>
                  <div className="rounded-[2rem] border-[3px] border-white/[0.12] bg-[#0a0a0a] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" style={{ maxWidth: 220 }}>
                    <div className="rounded-[1.6rem] overflow-hidden">
                      <Image src={feature.screenshot} alt={feature.alt} width={390} height={844} className="w-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SCREENSHOT GALLERY */}
        <section id="screenshots" className="py-20">
          <div className="text-center max-w-3xl mx-auto px-6 mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF7F50]">See it in action</p>
            <h2 className="mt-3 text-3xl font-[900] text-white tracking-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Real Screenshots From a Real Reef Tank
            </h2>
          </div>
          <div className="flex gap-6 overflow-x-auto px-6 pb-4 snap-x snap-mandatory justify-start lg:justify-center" style={{ WebkitOverflowScrolling: 'touch' }}>
            {screenshots.map(s => (
              <div key={s.alt} className="snap-center flex-shrink-0 flex flex-col items-center gap-3">
                <div className="rounded-[2rem] border-[3px] border-white/[0.12] bg-[#0a0a0a] p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)]" style={{ width: 180 }}>
                  <div className="rounded-[1.6rem] overflow-hidden">
                    <Image src={s.src} alt={s.alt} width={390} height={844} className="w-full" />
                  </div>
                </div>
                <span className="text-xs font-bold text-[#8f9097] uppercase tracking-wider">{s.alt}</span>
              </div>
            ))}
          </div>
        </section>

        {/* YOUTUBE VIDEOS */}
        <section id="videos" className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF0000]">YouTube</p>
            <h2 className="mt-3 text-3xl font-[900] text-white tracking-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Watch ReefOS in Action
            </h2>
            <p className="mt-4 text-[#c5c6cd]">
              Tutorials, walkthroughs, and reef keeping tips from the ReefOS channel.
            </p>
          </div>

          {/* Featured video - large */}
          <div className="mb-8">
            <div className="rounded-3xl border border-white/[0.06] bg-[#0d1c32] p-4 lg:p-6 max-w-4xl mx-auto">
              <div className="relative w-full rounded-2xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube-nocookie.com/embed/NFo2FZzeuUQ"
                  title="Complete ReefOS App Walkthrough — Free Reef Tank Management App"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">Complete ReefOS App Walkthrough</h3>
              <p className="mt-1 text-sm text-[#8f9097]">Full tour of every feature — from parameter tracking to AI identification</p>
            </div>
          </div>

          {/* Grid of other videos */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {[
              { id: 'OX8lQW-5qj4', title: 'AI Test Photo Recognition', desc: 'How ReefOS reads water test results from photos' },
              { id: 'b9fziAWpSbQ', title: 'Smart Dosing Calculator', desc: 'Precise 2-Part dosing based on your parameters' },
              { id: 'wKJwlgvCR9k', title: 'Livestock & Compatibility', desc: 'Managing fish, corals, and compatibility checks' },
              { id: 'iilKh5fQeCQ', title: '3D Reef Planner Demo', desc: 'Plan your tank layout with flow simulation' },
            ].map(video => (
              <div key={video.id} className="rounded-2xl border border-white/[0.06] bg-[#0d1c32] overflow-hidden group">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube-nocookie.com/embed/${video.id}`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-white">{video.title}</h3>
                  <p className="mt-1 text-xs text-[#8f9097]">{video.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a
              href="https://youtube.com/@ReefOS_US"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-[#FF0000]/20 bg-[#FF0000]/10 px-6 py-3 text-sm font-bold text-[#FF0000] transition hover:bg-[#FF0000]/20"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              Subscribe to @ReefOS_US
            </a>
          </div>
        </section>

        {/* DIFFERENTIATOR */}
        <section className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8f9097]">Other aquarium apps</p>
              <h3 className="mt-4 text-2xl font-bold text-white">Store data. Show charts. Stop there.</h3>
              <ul className="mt-6 space-y-3">
                {['Manual parameter entry only', 'Just charts and graphs', 'Generic fish database', 'No emergency tools', 'Paid subscriptions'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-[#8f9097] text-sm">
                    <span className="material-symbols-outlined text-[#ff6b6b] text-base">close</span>{item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-[#4cd6fb]/15 bg-gradient-to-br from-[#4cd6fb]/[0.06] to-[#2ff801]/[0.03] p-8 shadow-2xl shadow-[#4cd6fb]/5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4cd6fb]">ReefOS</p>
              <h3 className="mt-4 text-2xl font-bold text-white">Understand, decide, and improve.</h3>
              <ul className="mt-6 space-y-3">
                {['AI reads your test photos', 'Actionable alerts & daily plans', 'Compatibility + health tracking', '550+ equipment & supplement catalog', 'Emergency SOS & diagnostics', '100% free, forever'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-white text-sm font-medium">
                    <span className="material-symbols-outlined text-[#2ff801] text-base">check_circle</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ENGINES */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4cd6fb]">Under the hood</p>
              <h2 className="mt-3 text-3xl font-[900] text-white tracking-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
                8 Intelligent Engines Working Together
              </h2>
              <p className="mt-4 text-[#c5c6cd] leading-relaxed">
                ReefOS isn&apos;t just screens — it&apos;s a system of engines that handle cycling, feeding, diagnostics, compatibility, emergencies, flow, maintenance, and planning.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {engines.map(engine => (
                  <div key={engine} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white font-medium">
                    {engine}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="rounded-[2rem] border-[3px] border-white/[0.12] bg-[#0a0a0a] p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)]" style={{ maxWidth: 240 }}>
                <div className="rounded-[1.6rem] overflow-hidden">
                  <Image src="/screenshots/cycle.png" alt="ReefOS cycle tracker showing tank maturity" width={390} height={844} className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="mx-auto max-w-xl px-6 py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4cd6fb]">Pricing</p>
          <h2 className="mt-3 text-4xl font-[900] text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>Simple. Free. Forever.</h2>
          <p className="mt-3 text-[#c5c6cd]">No trials. No paywalls. No &quot;premium&quot; tiers.</p>

          <div className="mt-8 rounded-3xl border border-white/[0.06] bg-[#0d1c32] p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF7F50] to-[#4cd6fb]" />
            <div className="text-5xl font-[900] text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>$0</div>
            <div className="text-lg text-[#8f9097] font-semibold">Forever</div>
            <div className="text-sm font-bold text-[#2ff801] mt-2 mb-6">All features included. No catch.</div>
            <div className="space-y-3 text-left mb-8">
              {[
                'Unlimited parameter logging',
                'AI test photo recognition',
                'Full species & product database',
                'All 35 smart tools',
                'Livestock management & compatibility',
                'Alerts, trends, and dosing',
                '3D reef planner',
                'Emergency SOS & diagnostics',
              ].map(item => (
                <div key={item} className="flex items-center gap-3 text-sm text-[#c5c6cd]">
                  <span className="material-symbols-outlined text-[#2ff801] text-base">check_circle</span>{item}
                </div>
              ))}
            </div>
            <a href="/login" className="block w-full rounded-xl bg-[#FF7F50] py-4 text-center text-base font-bold text-white shadow-lg shadow-[#FF7F50]/20 transition hover:scale-[1.02] active:scale-95">
              Get Started Free
            </a>
          </div>
        </section>

        {/* SEO BLOCK */}
        <section className="mx-auto max-w-4xl px-6 py-12">
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8">
            <h2 className="text-2xl font-bold text-white mb-4">The Best Free Reef Tank App for Saltwater Aquarium Management</h2>
            <p className="text-[#8f9097] leading-relaxed mb-4">
              ReefOS is a free reef tank management app designed for saltwater aquarium hobbyists at every level. Whether you&apos;re cycling your first tank or maintaining an advanced SPS-dominant mixed reef, ReefOS gives you the tools to track water parameters, manage livestock, monitor equipment, and make data-driven decisions about your reef aquarium.
            </p>
            <p className="text-[#8f9097] leading-relaxed mb-4">
              Unlike basic aquarium tracker apps, ReefOS uses artificial intelligence to read water test results from photos, identify fish and corals with your camera, generate personalized dosing recommendations, and alert you before small parameter shifts become tank-threatening emergencies.
            </p>
            <p className="text-[#8f9097] leading-relaxed">
              With a database of over 180 reef species, 550+ equipment and supplement products, and 35 specialized reef-keeping tools, ReefOS is the most comprehensive saltwater aquarium app available — and it&apos;s completely free. Works as a PWA on iPhone, Android, tablet, or desktop.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4cd6fb]">FAQ</p>
            <h2 className="mt-3 text-3xl font-[900] text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={faq.q} className="rounded-2xl border border-white/[0.06] bg-[#0d1c32] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-white font-semibold pr-4">{faq.q}</span>
                  <span className={`material-symbols-outlined text-[#8f9097] transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 pb-5' : 'max-h-0'}`}>
                  <p className="px-5 text-sm text-[#c5c6cd] leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TECH BAR */}
        <div className="border-y border-white/[0.06] py-8">
          <div className="mx-auto max-w-4xl flex justify-center gap-8 flex-wrap px-6">
            {[
              ['cloud_sync', 'Cloud Sync'],
              ['auto_awesome', 'AI-Powered'],
              ['install_mobile', 'PWA'],
              ['lock', 'Secure'],
              ['speed', 'Real-Time'],
            ].map(([icon, label]) => (
              <div key={label} className="flex items-center gap-2 text-sm text-[#8f9097] font-semibold">
                <span className="material-symbols-outlined text-[#4cd6fb] text-lg">{icon}</span>{label}
              </div>
            ))}
          </div>
        </div>

        {/* FINAL CTA */}
        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="rounded-[2rem] border border-[#4cd6fb]/15 bg-gradient-to-br from-[#4cd6fb]/[0.08] via-[#0d1c32] to-[#2ff801]/[0.05] p-10 lg:p-16 shadow-[0_40px_140px_rgba(76,214,251,0.08)]">
            <h2 className="text-3xl lg:text-4xl font-[900] text-white tracking-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Stop Guessing. Start Running Your Reef Like a System.
            </h2>
            <p className="mt-4 text-[#c5c6cd] text-lg">
              Join reefers who track smarter, not harder. Free forever.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/login" className="rounded-2xl bg-[#FF7F50] px-8 py-4 text-base font-bold text-white shadow-2xl shadow-[#FF7F50]/20 transition hover:scale-[1.03]">
                Start Free Now
              </a>
              <a href="https://reefos-planner.vercel.app" target="_blank" className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white transition hover:border-white/20">
                Try 3D Planner
              </a>
            </div>
            <p className="mt-4 text-xs text-[#8f9097]">No credit card required</p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] py-12 px-6">
        <div className="mx-auto max-w-4xl">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <Image src="/icons/logo-40.png" alt="ReefOS" width={48} height={48} className="rounded-xl" />
            <div className="text-lg font-bold text-white tracking-tight">Reef<span className="text-[#FF7F50]">OS</span></div>
            <p className="text-sm text-[#8f9097]">Your reef, intelligently managed.</p>
          </div>

          {/* Contact Email */}
          <div className="flex justify-center mb-6">
            <a href="mailto:info@reefos.net" className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-2.5 text-sm text-[#c5c6cd] hover:text-white hover:border-[#4cd6fb]/30 transition-all">
              <span className="material-symbols-outlined text-[#4cd6fb] text-lg">mail</span>
              info@reefos.net
            </a>
          </div>

          {/* Social Links */}
          <div className="flex justify-center gap-5 mb-8">
            <a href="mailto:info@reefos.net" className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#c5c6cd] hover:text-[#4cd6fb] hover:border-[#4cd6fb]/30 transition-all" aria-label="Email">
              <span className="material-symbols-outlined text-xl">mail</span>
            </a>
            <a href="https://youtube.com/@ReefOS_US" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#c5c6cd] hover:text-[#FF0000] hover:border-[#FF0000]/30 transition-all" aria-label="YouTube">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
            <a href="https://instagram.com/reefos_us" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#c5c6cd] hover:text-[#E4405F] hover:border-[#E4405F]/30 transition-all" aria-label="Instagram">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
            </a>
          </div>

          {/* Links */}
          <div className="flex justify-center gap-6 text-sm mb-6">
            <a href="/login" className="text-[#4cd6fb] hover:text-white transition">App</a>
            <a href="https://reefos-planner.vercel.app" target="_blank" className="text-[#4cd6fb] hover:text-white transition">3D Planner</a>
            <a href="https://youtube.com/@ReefOS_US" target="_blank" className="text-[#4cd6fb] hover:text-white transition">YouTube</a>
            <a href="mailto:info@reefos.net" className="text-[#4cd6fb] hover:text-white transition">Contact</a>
          </div>

          <p className="text-xs text-[#8f9097] text-center">&copy; 2026 ReefOS. Built with care for the reef keeping community.</p>
        </div>
      </footer>
    </div>
  );
}
