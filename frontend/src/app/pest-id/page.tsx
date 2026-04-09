'use client';

import { useState } from 'react';
import { PEST_DATABASE, SYMPTOM_QUESTIONS, matchPestsBySymptoms } from '@/lib/pest-identifier';
import type { PestMatch } from '@/lib/pest-identifier';
import Link from 'next/link';

const URGENCY_META = {
  critical: { label: 'CRITICAL', color: '#ff4444', bg: '#ff4444' },
  high: { label: 'HIGH', color: '#FF7F50', bg: '#FF7F50' },
  medium: { label: 'MEDIUM', color: '#F1C40F', bg: '#F1C40F' },
  low: { label: 'LOW', color: '#2ff801', bg: '#2ff801' },
};

export default function PestIdPage() {
  const [mode, setMode] = useState<'home' | 'quiz' | 'results' | 'detail' | 'browse'>('home');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [results, setResults] = useState<{ pest: PestMatch; score: number }[]>([]);
  const [selectedPest, setSelectedPest] = useState<PestMatch | null>(null);
  const [detailTab, setDetailTab] = useState<'treatment' | 'mistakes' | 'prevention' | 'science'>('treatment');

  const startQuiz = () => {
    setAnswers({});
    setCurrentQ(0);
    setMode('quiz');
  };

  const selectAnswer = (questionId: string, label: string) => {
    const prev = answers[questionId] || [];
    const updated = prev.includes(label)
      ? prev.filter(l => l !== label)
      : [...prev, label];
    setAnswers({ ...answers, [questionId]: updated });
  };

  const nextQuestion = () => {
    if (currentQ < SYMPTOM_QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      // Calculate results
      const matches = matchPestsBySymptoms(answers);
      setResults(matches);
      setMode('results');
    }
  };

  const openDetail = (pest: PestMatch) => {
    setSelectedPest(pest);
    setDetailTab('treatment');
    setMode('detail');
  };

  const goHome = () => {
    setMode('home');
    setAnswers({});
    setCurrentQ(0);
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div>
        <Link href="/tools" className="flex items-center gap-1 text-[#c5c6cd]/60 text-xs mb-2 active:opacity-60">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Tools
        </Link>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb4ab] text-xs font-medium uppercase">Diagnostics</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Pest Identifier</h1>
        <p className="text-[#c5c6cd] text-sm mt-1">Identify pests & diseases with expert treatment protocols</p>
      </div>

      {/* ═══════ HOME MODE ═══════ */}
      {mode === 'home' && (
        <>
          {/* Symptom Quiz CTA */}
          <button
            onClick={startQuiz}
            className="w-full bg-gradient-to-r from-[#FF7F50] to-[#d35e32] rounded-3xl p-6 text-left active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-white">search_insights</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-[family-name:var(--font-headline)] font-bold text-lg">Symptom Checker</p>
                <p className="text-white/70 text-sm mt-0.5">Answer 4 questions to identify the problem</p>
              </div>
              <span className="material-symbols-outlined text-white/50">arrow_forward</span>
            </div>
          </button>

          {/* Browse All */}
          <button
            onClick={() => setMode('browse')}
            className="w-full bg-[#0d1c32] rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-[#4cd6fb]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl text-[#4cd6fb]">menu_book</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">Browse All Pests & Diseases</p>
              <p className="text-[#c5c6cd]/60 text-xs">{PEST_DATABASE.length} entries with expert protocols</p>
            </div>
            <span className="material-symbols-outlined text-[#c5c6cd]/40">chevron_right</span>
          </button>

          {/* Critical Warnings Preview */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-[#c5c6cd]/70 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ff4444] text-sm">priority_high</span>
              Critical Threats
            </p>
            {PEST_DATABASE.filter(p => p.urgency === 'critical').map(pest => (
              <button
                key={pest.id}
                onClick={() => openDetail(pest)}
                className="w-full bg-[#ff4444]/5 border border-[#ff4444]/15 rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
              >
                <span className="material-symbols-outlined text-xl" style={{ color: URGENCY_META[pest.urgency].color }}>{pest.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{pest.name}</p>
                  <p className="text-[#c5c6cd]/60 text-xs truncate">{pest.visual_signs[0]}</p>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase" style={{ backgroundColor: `${URGENCY_META[pest.urgency].bg}20`, color: URGENCY_META[pest.urgency].color }}>
                  {URGENCY_META[pest.urgency].label}
                </span>
              </button>
            ))}
          </div>

          {/* Safety Banner */}
          <div className="bg-[#ff4444]/8 border border-[#ff4444]/20 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#ff4444] text-xl mt-0.5">gpp_maybe</span>
              <div>
                <p className="text-[#ff9999] text-sm font-bold mb-1">Golden Rule</p>
                <p className="text-[#c5c6cd] text-xs leading-relaxed">
                  NEVER add copper medication to a reef tank with corals or invertebrates. Copper is lethal to ALL invertebrate life and permanently contaminates the rock. Always use a separate quarantine tank for fish treatment.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════ QUIZ MODE ═══════ */}
      {mode === 'quiz' && (
        <>
          {/* Progress */}
          <div className="flex gap-1">
            {SYMPTOM_QUESTIONS.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{ backgroundColor: i <= currentQ ? '#FF7F50' : '#1c2a41' }}
              />
            ))}
          </div>

          <div className="bg-[#0d1c32] rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#FF7F50]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-[#FF7F50]">
                  {SYMPTOM_QUESTIONS[currentQ].icon}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-[#c5c6cd]/50 uppercase tracking-wider">Question {currentQ + 1} of {SYMPTOM_QUESTIONS.length}</p>
                <p className="text-white font-[family-name:var(--font-headline)] font-bold">{SYMPTOM_QUESTIONS[currentQ].question}</p>
              </div>
            </div>

            <div className="space-y-2">
              {SYMPTOM_QUESTIONS[currentQ].options.map(opt => {
                const selected = (answers[SYMPTOM_QUESTIONS[currentQ].id] || []).includes(opt.label);
                return (
                  <button
                    key={opt.label}
                    onClick={() => selectAnswer(SYMPTOM_QUESTIONS[currentQ].id, opt.label)}
                    className={`w-full p-3.5 rounded-xl text-left text-sm transition-all flex items-center gap-3 ${
                      selected
                        ? 'bg-[#FF7F50]/15 text-white ring-1 ring-[#FF7F50]/40'
                        : 'bg-[#041329] text-[#c5c6cd] hover:bg-[#041329]/80'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      selected ? 'border-[#FF7F50] bg-[#FF7F50]' : 'border-[#1c2a41]'
                    }`}>
                      {selected && <span className="material-symbols-outlined text-white text-xs">check</span>}
                    </div>
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => currentQ > 0 ? setCurrentQ(currentQ - 1) : goHome()}
                className="flex-1 py-3 rounded-xl bg-[#1c2a41] text-[#c5c6cd] text-sm font-medium active:scale-[0.98]"
              >
                {currentQ > 0 ? 'Back' : 'Cancel'}
              </button>
              <button
                onClick={nextQuestion}
                disabled={!(answers[SYMPTOM_QUESTIONS[currentQ].id]?.length > 0)}
                className="flex-1 py-3 rounded-xl bg-[#FF7F50] text-white text-sm font-bold active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
              >
                {currentQ < SYMPTOM_QUESTIONS.length - 1 ? 'Next' : 'Identify'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══════ RESULTS MODE ═══════ */}
      {mode === 'results' && (
        <>
          <div className="text-center mb-2">
            <span className="material-symbols-outlined text-4xl text-[#FF7F50] mb-2 block">biotech</span>
            <p className="text-white font-[family-name:var(--font-headline)] font-bold text-lg">Analysis Complete</p>
            <p className="text-[#c5c6cd] text-sm">{results.length} potential match{results.length !== 1 ? 'es' : ''} found</p>
          </div>

          {results.length === 0 ? (
            <div className="bg-[#2ff801]/5 border border-[#2ff801]/15 rounded-2xl p-6 text-center">
              <span className="material-symbols-outlined text-3xl text-[#2ff801] mb-2 block">verified</span>
              <p className="text-white font-medium">No common pests matched</p>
              <p className="text-[#c5c6cd] text-sm mt-1">Your symptoms don't match known reef pests. Check the SOS Troubleshooter for water chemistry issues.</p>
              <Link href="/sos" className="mt-3 inline-flex items-center gap-1 text-[#FF7F50] text-sm font-medium">
                <span className="material-symbols-outlined text-sm">emergency</span>
                Open SOS Troubleshooter
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map(({ pest, score }, i) => {
                const maxScore = results[0].score;
                const confidencePercent = Math.round((score / maxScore) * 100);
                return (
                  <button
                    key={pest.id}
                    onClick={() => openDetail(pest)}
                    className="w-full bg-[#0d1c32] rounded-2xl p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
                  >
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${URGENCY_META[pest.urgency].bg}15` }}
                      >
                        <span className="material-symbols-outlined text-xl" style={{ color: URGENCY_META[pest.urgency].color }}>{pest.icon}</span>
                      </div>
                      {i === 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF7F50] flex items-center justify-center">
                          <span className="text-white text-[8px] font-bold">#1</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{pest.name}</p>
                      <p className="text-[#c5c6cd]/60 text-xs mt-0.5">{pest.nameEs}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1 bg-[#1c2a41] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${confidencePercent}%`, backgroundColor: URGENCY_META[pest.urgency].color }}
                          />
                        </div>
                        <span className="text-[10px] text-[#c5c6cd]/50">{confidencePercent}%</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase" style={{ backgroundColor: `${URGENCY_META[pest.urgency].bg}20`, color: URGENCY_META[pest.urgency].color }}>
                      {URGENCY_META[pest.urgency].label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={goHome}
            className="w-full py-3 rounded-xl bg-[#1c2a41] text-[#c5c6cd] text-sm font-medium active:scale-[0.98]"
          >
            Start Over
          </button>
        </>
      )}

      {/* ═══════ BROWSE MODE ═══════ */}
      {mode === 'browse' && (
        <>
          <button onClick={goHome} className="flex items-center gap-1 text-[#c5c6cd]/60 text-xs active:opacity-60">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </button>

          <div className="space-y-2">
            {PEST_DATABASE.map(pest => (
              <button
                key={pest.id}
                onClick={() => openDetail(pest)}
                className="w-full bg-[#0d1c32] rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${pest.color}15` }}>
                  <span className="material-symbols-outlined text-lg" style={{ color: pest.color }}>{pest.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{pest.name}</p>
                  <p className="text-[#c5c6cd]/50 text-xs">{pest.category} • {pest.nameEs}</p>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase" style={{ backgroundColor: `${URGENCY_META[pest.urgency].bg}20`, color: URGENCY_META[pest.urgency].color }}>
                  {URGENCY_META[pest.urgency].label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ═══════ DETAIL MODE ═══════ */}
      {mode === 'detail' && selectedPest && (
        <>
          <button
            onClick={() => results.length > 0 ? setMode('results') : setMode('browse')}
            className="flex items-center gap-1 text-[#c5c6cd]/60 text-xs active:opacity-60"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to {results.length > 0 ? 'Results' : 'Browse'}
          </button>

          {/* Pest Header */}
          <div className="bg-[#0d1c32] rounded-3xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${selectedPest.color}, transparent)` }} />

            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${selectedPest.color}15` }}>
                <span className="material-symbols-outlined text-3xl" style={{ color: selectedPest.color }}>{selectedPest.icon}</span>
              </div>
              <div>
                <p className="text-white font-[family-name:var(--font-headline)] font-bold text-lg">{selectedPest.name}</p>
                <p className="text-[#c5c6cd]/60 text-sm">{selectedPest.nameEs}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase" style={{ backgroundColor: `${URGENCY_META[selectedPest.urgency].bg}20`, color: URGENCY_META[selectedPest.urgency].color }}>
                    {URGENCY_META[selectedPest.urgency].label}
                  </span>
                  <span className="text-[#c5c6cd]/40 text-[10px] uppercase">{selectedPest.category}</span>
                </div>
              </div>
            </div>

            {/* Visual & Behavioral Signs */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-[#c5c6cd]/70 uppercase tracking-widest">Identification</p>
              {selectedPest.visual_signs.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-[#4cd6fb] mt-0.5">visibility</span>
                  <p className="text-[#c5c6cd] text-xs">{s}</p>
                </div>
              ))}
              {selectedPest.behavioral_signs.map((s, i) => (
                <div key={`b-${i}`} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-[#F1C40F] mt-0.5">pets</span>
                  <p className="text-[#c5c6cd] text-xs">{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* DANGEROUS MISTAKES — Always visible */}
          {selectedPest.dangerous_mistakes.length > 0 && (
            <div className="bg-[#ff4444]/8 border border-[#ff4444]/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ff4444]">gpp_maybe</span>
                <p className="text-[#ff9999] text-xs font-bold uppercase tracking-wider">Do NOT Do This</p>
              </div>
              {selectedPest.dangerous_mistakes.map((m, i) => (
                <div key={i} className="bg-[#ff4444]/5 rounded-xl p-3">
                  <p className="text-[#ff9999] text-sm font-medium mb-1">
                    <span className="material-symbols-outlined text-xs align-middle mr-1">block</span>
                    {m.action}
                  </p>
                  <p className="text-[#c5c6cd] text-xs">{m.consequence}</p>
                </div>
              ))}
            </div>
          )}

          {/* Detail Tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {(['treatment', 'prevention', 'science'] as const).map(t => (
              <button
                key={t}
                onClick={() => setDetailTab(t)}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  detailTab === t
                    ? 'bg-[#FF7F50]/15 text-[#FF7F50]'
                    : 'bg-[#0d1c32] text-[#c5c6cd]/50'
                }`}
              >
                {t === 'treatment' ? '💊 Treatment' : t === 'prevention' ? '🛡️ Prevention' : '🔬 Science'}
              </button>
            ))}
          </div>

          {detailTab === 'treatment' && (
            <div className="space-y-4">
              {/* Immediate Actions */}
              <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-[#FF7F50] uppercase tracking-widest">Immediate Actions</p>
                {selectedPest.treatment.immediate.map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[#FF7F50] text-xs font-bold mt-0.5 w-4 shrink-0">{i + 1}.</span>
                    <p className="text-[#c5c6cd] text-xs">{a}</p>
                  </div>
                ))}
              </div>

              {/* Long-term */}
              <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-[#4cd6fb] uppercase tracking-widest">Long-term Strategy</p>
                {selectedPest.treatment.long_term.map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs text-[#4cd6fb] mt-0.5">check_circle</span>
                    <p className="text-[#c5c6cd] text-xs">{a}</p>
                  </div>
                ))}
              </div>

              {/* Biological Control */}
              {selectedPest.treatment.biological.length > 0 && (
                <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-2">
                  <p className="text-[10px] font-bold text-[#2ff801] uppercase tracking-widest">Biological Control</p>
                  {selectedPest.treatment.biological.map((b, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-xs text-[#2ff801] mt-0.5">eco</span>
                      <p className="text-[#c5c6cd] text-xs">{b}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Products */}
              {selectedPest.treatment.products.length > 0 && (
                <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-2">
                  <p className="text-[10px] font-bold text-[#c5c6cd]/70 uppercase tracking-widest">Recommended Products</p>
                  {selectedPest.treatment.products.map((p, i) => (
                    <div key={i} className="flex items-start gap-3 bg-[#041329] rounded-xl p-3">
                      <span className="material-symbols-outlined text-sm text-[#F1C40F] mt-0.5">shopping_bag</span>
                      <div>
                        <p className="text-white text-xs font-medium">{p.name}</p>
                        <p className="text-[#c5c6cd]/60 text-[11px]">{p.purpose}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {detailTab === 'prevention' && (
            <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-2">
              <p className="text-[10px] font-bold text-[#2ff801] uppercase tracking-widest mb-1">Prevention Checklist</p>
              {selectedPest.prevention.map((p, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-[#2ff801] mt-0.5">shield</span>
                  <p className="text-[#c5c6cd] text-xs">{p}</p>
                </div>
              ))}
            </div>
          )}

          {detailTab === 'science' && (
            <div className="bg-[#0d1c32] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[#d7ffc5]">biotech</span>
                <p className="text-white font-medium text-sm">Biology</p>
              </div>
              <p className="text-[#c5c6cd] text-sm leading-relaxed">{selectedPest.science}</p>
            </div>
          )}

          {/* Link to SOS */}
          <Link href="/sos" className="flex items-center justify-center gap-2 bg-[#0d1c32] text-[#c5c6cd] py-3 rounded-2xl text-sm active:scale-[0.98] transition-transform">
            <span className="material-symbols-outlined text-[#ffb4ab] text-lg">emergency</span>
            Open Emergency SOS Troubleshooter
          </Link>
        </>
      )}
    </div>
  );
}
