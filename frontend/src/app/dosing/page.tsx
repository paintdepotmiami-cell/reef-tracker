'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { getLatestTest, getUserProducts, getSupplements } from '@/lib/queries';
import type { WaterTest, UserProduct, Supplement, Product } from '@/lib/queries';
import { calculateSmartDosing } from '@/lib/smart-dosing';
import type { SmartDosingResult } from '@/lib/smart-dosing';
import { getCached, setCache } from '@/lib/cache';
import Link from 'next/link';

/* ─── Parameter Config ─── */
interface ParamDef {
  key: string;
  label: string;
  unit: string;
  icon: string;
  color: string;
  min: number;
  max: number;
  target: number;
  step: string;
  testKey: keyof WaterTest;
  affectsKey: string; // matches affects_params in products
}

const PARAMS: ParamDef[] = [
  { key: 'Alkalinity', label: 'Alkalinity', unit: 'dKH', icon: 'science', color: '#4cd6fb', min: 7, max: 11, target: 8.5, step: '0.1', testKey: 'alkalinity', affectsKey: 'alkalinity' },
  { key: 'Calcium', label: 'Calcium', unit: 'ppm', icon: 'labs', color: '#2ff801', min: 380, max: 450, target: 420, step: '1', testKey: 'calcium', affectsKey: 'calcium' },
  { key: 'Magnesium', label: 'Magnesium', unit: 'ppm', icon: 'experiment', color: '#F1C40F', min: 1250, max: 1400, target: 1350, step: '1', testKey: 'magnesium', affectsKey: 'magnesium' },
];

/* ─── Match user's products to a parameter ─── */
function findUserProductsFor(param: string, userProducts: UserProduct[]): { product: Product; userProduct: UserProduct }[] {
  const matches: { product: Product; userProduct: UserProduct }[] = [];
  for (const up of userProducts) {
    const prod = Array.isArray(up.product) ? up.product[0] : up.product;
    if (!prod) continue;
    const affects = prod.affects_params || [];
    if (affects.includes(param.toLowerCase())) {
      matches.push({ product: prod, userProduct: up });
    }
  }
  return matches;
}

/* ─── Match user's supplements to a parameter (fallback) ─── */
function findSupplementsFor(param: string, supplements: Supplement[]): Supplement[] {
  const lower = param.toLowerCase();
  return supplements.filter(s => {
    const name = s.name.toLowerCase();
    const type = (s.type || '').toLowerCase();
    if (lower === 'alkalinity') return name.includes('balance') || name.includes('alk') || name.includes('kalk') || type.includes('kh') || type.includes('buffer');
    if (lower === 'calcium') return name.includes('calcium') || name.includes('kalk');
    if (lower === 'magnesium') return name.includes('magnes');
    return false;
  });
}

export default function DosingPage() {
  const { user, tank } = useAuth();
  const tankGallons = tank?.size_gallons || 40;

  const [latestTest, setLatestTest] = useState<WaterTest | null>(null);
  const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState(true);

  const [values, setValues] = useState<Record<string, { current: string; target: string }>>({});
  const [results, setResults] = useState<Record<string, SmartDosingResult>>({});
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    if (!user) return;

    async function load() {
      const [test, prods, supps] = await Promise.all([
        getLatestTest(),
        getUserProducts(),
        getSupplements(),
      ]);
      setLatestTest(test);
      setUserProducts(prods);
      setSupplements(supps);

      // Pre-fill from latest test
      const init: Record<string, { current: string; target: string }> = {};
      for (const p of PARAMS) {
        const val = test ? test[p.testKey] : null;
        init[p.key] = {
          current: val != null ? String(val) : '',
          target: String(p.target),
        };
      }
      setValues(init);
      setLoading(false);
    }
    load();
  }, [user]);

  // Auto-calculate when test data loads
  useEffect(() => {
    if (!latestTest || loading) return;
    // Auto-calculate all params that have current values
    for (const p of PARAMS) {
      const v = values[p.key];
      if (!v?.current) continue;
      const current = parseFloat(v.current);
      const target = parseFloat(v.target);
      if (isNaN(current) || isNaN(target)) continue;
      handleCalculate(p.key, current, target);
    }
  }, [loading, latestTest]);

  const handleCalculate = (paramKey: string, currentOverride?: number, targetOverride?: number) => {
    const v = values[paramKey];
    if (!v) return;
    const current = currentOverride ?? parseFloat(v.current);
    const target = targetOverride ?? parseFloat(v.target);
    if (isNaN(current) || isNaN(target)) return;

    const ctx = {
      gallons: tankGallons,
      hasSPS: true,
      hasLPS: true,
      hasATO: true,
      hasDosingSPump: false,
      currentAlk: values['Alkalinity']?.current ? parseFloat(values['Alkalinity'].current) : null,
      currentCa: values['Calcium']?.current ? parseFloat(values['Calcium'].current) : null,
      currentMg: values['Magnesium']?.current ? parseFloat(values['Magnesium'].current) : null,
    };

    const result = calculateSmartDosing(paramKey, current, target, ctx);
    setResults(prev => ({ ...prev, [paramKey]: result }));
  };

  // Test freshness
  const testAge = latestTest
    ? Math.floor((Date.now() - new Date(latestTest.test_date).getTime()) / 86400000)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-[#4cd6fb] animate-pulse">science</span>
          <p className="text-[#c5c6cd] text-sm">Loading your chemistry…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <Link href="/tools" className="flex items-center gap-1 text-[#c5c6cd]/60 text-xs mb-2 active:opacity-60">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Tools
        </Link>
        <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">Chemistry</p>
        <h1 className="text-3xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Smart Dosing</h1>
        <p className="text-[#c5c6cd] text-sm mt-1">Personalized dosing using your products & latest test</p>
      </div>

      {/* Latest Test Banner */}
      {latestTest ? (
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${testAge != null && testAge > 7 ? 'bg-[#F1C40F]/10 border border-[#F1C40F]/20' : 'bg-[#2ff801]/5 border border-[#2ff801]/15'}`}>
          <span className="material-symbols-outlined text-lg" style={{ color: testAge != null && testAge > 7 ? '#F1C40F' : '#2ff801' }}>
            {testAge != null && testAge > 7 ? 'schedule' : 'check_circle'}
          </span>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">
              {testAge != null && testAge > 7
                ? `Test from ${testAge} days ago — consider retesting`
                : 'Values pre-filled from latest test'}
            </p>
            <p className="text-[#c5c6cd]/60 text-xs">
              {new Date(latestTest.test_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' • '}Alk {latestTest.alkalinity} · Ca {latestTest.calcium} · Mg {latestTest.magnesium}
            </p>
          </div>
          <Link href="/logs" className="text-[#FF7F50] text-xs font-medium">New Test</Link>
        </div>
      ) : (
        <div className="bg-[#F1C40F]/10 border border-[#F1C40F]/20 rounded-2xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-[#F1C40F] text-lg">science</span>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">No water test found</p>
            <p className="text-[#c5c6cd]/60 text-xs">Log a test to auto-fill values</p>
          </div>
          <Link href="/logs" className="text-[#FF7F50] text-xs font-medium">Log Test</Link>
        </div>
      )}

      {/* Tank Badge */}
      <div className="flex items-center gap-2">
        <div className="bg-[#0d1c32] rounded-xl px-4 py-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#4cd6fb] text-lg">water</span>
          <span className="text-white text-sm font-bold font-[family-name:var(--font-headline)]">{tank?.name || 'My Tank'}</span>
          <span className="text-[#8f9097] text-xs">{tankGallons} gal</span>
        </div>
      </div>

      {/* Parameter Cards */}
      {PARAMS.map((param) => {
        const v = values[param.key];
        const result = results[param.key];
        const myProducts = findUserProductsFor(param.affectsKey, userProducts);
        const mySupps = findSupplementsFor(param.key, supplements);
        const hasProduct = myProducts.length > 0 || mySupps.length > 0;

        return (
          <div key={param.key} className="bg-[#0d1c32] rounded-2xl p-5 space-y-4">
            {/* Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${param.color}15` }}>
                  <span className="material-symbols-outlined text-xl" style={{ color: param.color }}>{param.icon}</span>
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-headline)] font-bold text-white text-lg">{param.label}</h3>
                  <p className="text-[#8f9097] text-xs">Range: {param.min} – {param.max} {param.unit}</p>
                </div>
              </div>
              {result && (
                <div className="px-2 py-1 rounded-lg" style={{ backgroundColor: `${result.severityColor}15` }}>
                  <span className="text-[10px] font-bold uppercase" style={{ color: result.severityColor }}>
                    {result.severity === 'none' ? '✓ OK' : result.severity}
                  </span>
                </div>
              )}
            </div>

            {/* Your Products for this param */}
            {hasProduct ? (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-[#2ff801]/70 uppercase tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">inventory_2</span>
                  Your Products
                </p>
                {myProducts.map(({ product: prod, userProduct: up }) => (
                  <button
                    key={up.id}
                    onClick={() => setExpandedProduct(expandedProduct === up.id ? null : up.id)}
                    className="w-full bg-[#041329] rounded-xl p-3 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#2ff801]/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#2ff801] text-sm">check_circle</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium">{prod.name}</p>
                      <p className="text-[#c5c6cd]/50 text-[10px]">{prod.brand}</p>
                    </div>
                    <span className="material-symbols-outlined text-[#c5c6cd]/30 text-sm">
                      {expandedProduct === up.id ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                ))}
                {myProducts.map(({ product: prod, userProduct: up }) =>
                  expandedProduct === up.id && prod.dosing_instructions ? (
                    <div key={`detail-${up.id}`} className="bg-[#041329]/60 rounded-xl p-3 ml-3">
                      <p className="text-[#c5c6cd] text-xs leading-relaxed">{prod.dosing_instructions}</p>
                    </div>
                  ) : null
                )}
                {mySupps.filter(s => !myProducts.some(p => p.product.name.toLowerCase().includes(s.name.toLowerCase().split(' ')[0]))).map(s => (
                  <div key={s.id} className="bg-[#041329] rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#4cd6fb]/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#4cd6fb] text-sm">science</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium">{s.name}</p>
                      <p className="text-[#c5c6cd]/50 text-[10px]">{s.brand} • {s.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#F1C40F]/8 border border-[#F1C40F]/15 rounded-xl p-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#F1C40F] text-sm">shopping_cart</span>
                <div className="flex-1">
                  <p className="text-[#F1C40F] text-xs font-medium">No product for {param.label}</p>
                  <p className="text-[#c5c6cd]/50 text-[10px]">Add one from the Products catalog</p>
                </div>
                <Link href="/products" className="text-[#FF7F50] text-[10px] font-bold">Browse</Link>
              </div>
            )}

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#8f9097] text-[10px] uppercase tracking-wider font-medium block mb-1.5">
                  Current {latestTest ? '(from test)' : ''}
                </label>
                <input
                  type="number"
                  step={param.step}
                  placeholder={String(param.target)}
                  value={v?.current || ''}
                  onChange={(e) => setValues(prev => ({ ...prev, [param.key]: { ...prev[param.key], current: e.target.value } }))}
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl px-3 py-2.5 text-white text-sm font-[family-name:var(--font-headline)] placeholder:text-[#3a4255] focus:outline-none focus:border-[#FF7F50] transition-colors"
                />
              </div>
              <div>
                <label className="text-[#8f9097] text-[10px] uppercase tracking-wider font-medium block mb-1.5">Target</label>
                <input
                  type="number"
                  step={param.step}
                  value={v?.target || ''}
                  onChange={(e) => setValues(prev => ({ ...prev, [param.key]: { ...prev[param.key], target: e.target.value } }))}
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl px-3 py-2.5 text-white text-sm font-[family-name:var(--font-headline)] placeholder:text-[#3a4255] focus:outline-none focus:border-[#FF7F50] transition-colors"
                />
              </div>
            </div>

            {/* Calculate */}
            <button
              onClick={() => handleCalculate(param.key)}
              disabled={!v?.current || !v?.target}
              className="w-full bg-gradient-to-r from-[#FF7F50] to-[#d35e32] text-white font-bold text-sm py-2.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed font-[family-name:var(--font-headline)] tracking-wide"
            >
              Calculate Smart Dose
            </button>

            {/* ═══ Results ═══ */}
            {result && (
              <div className="space-y-3">
                {result.deficit <= 0 ? (
                  <div className="rounded-xl border border-[#2ff801]/30 bg-[#2ff801]/5 p-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#2ff801]">check_circle</span>
                    <span className="text-[#2ff801] text-sm font-bold">
                      {result.deficit === 0 ? 'At target!' : `Above target (${Math.abs(result.deficit).toFixed(1)} ${result.unit} over)`}
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Cross-warnings */}
                    {result.crossWarnings.map((w, i) => (
                      <div key={i} className="bg-[#ff4444]/8 border border-[#ff4444]/20 rounded-xl p-3 flex items-start gap-2">
                        <span className="material-symbols-outlined text-[#ff4444] text-sm mt-0.5">warning</span>
                        <p className="text-[#ff9999] text-xs">{w}</p>
                      </div>
                    ))}

                    {/* Dose with YOUR product */}
                    <div className="rounded-xl border border-[#4cd6fb]/20 bg-[#4cd6fb]/5 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm font-bold">
                            {myProducts.length > 0 ? myProducts[0].product.name : result.product}
                          </p>
                          <p className="text-[#8f9097] text-xs">
                            {myProducts.length > 0 ? myProducts[0].product.brand : result.brand}
                            {myProducts.length > 0 && <span className="text-[#2ff801] ml-1">• You own this</span>}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-[family-name:var(--font-headline)] font-bold" style={{ color: param.color }}>
                            {result.doseAmount}
                          </p>
                          <p className="text-[#8f9097] text-xs">{result.doseUnit}</p>
                        </div>
                      </div>

                      <div className="bg-[#010e24] rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#8f9097]">
                            Deficit: <span className="text-white font-bold">{result.deficit.toFixed(1)} {result.unit}</span>
                          </span>
                          <span className="text-[10px] font-bold uppercase" style={{ color: result.severityColor }}>{result.severity}</span>
                        </div>
                        {result.splitDoses && (
                          <div className="flex items-center gap-1 text-[#F1C40F]">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            <p className="text-xs">Split over {result.daysToComplete} days</p>
                          </div>
                        )}
                        <p className="text-[#c5c6cd] text-xs">{result.frequency}</p>
                      </div>

                      {/* Product dosing instructions */}
                      {myProducts.length > 0 && myProducts[0].product.dosing_instructions && (
                        <div className="flex items-start gap-2 bg-[#010e24] rounded-lg p-3">
                          <span className="material-symbols-outlined text-[#4cd6fb] text-xs mt-0.5">menu_book</span>
                          <p className="text-[#c5c6cd] text-[11px] leading-relaxed">{myProducts[0].product.dosing_instructions}</p>
                        </div>
                      )}
                    </div>

                    {/* Expert Tips */}
                    {result.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-[#F1C40F] text-xs mt-0.5">lightbulb</span>
                        <p className="text-[#c5c6cd] text-xs">{tip}</p>
                      </div>
                    ))}

                    {/* Method Options */}
                    <details className="group">
                      <summary className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest cursor-pointer flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs group-open:rotate-90 transition-transform">chevron_right</span>
                        Dosing Method Options
                      </summary>
                      <div className="mt-2 space-y-1.5">
                        {result.allMethods.map((method) => {
                          const methodKey = `${param.key}-${method.method}`;
                          const isExp = expandedMethod === methodKey;
                          return (
                            <div key={method.method}>
                              <button
                                onClick={() => setExpandedMethod(isExp ? null : methodKey)}
                                className={`w-full rounded-xl p-3 flex items-center gap-3 text-left transition-all active:scale-[0.99] ${method.recommended ? 'bg-[#2ff801]/5 border border-[#2ff801]/15' : 'bg-[#041329]'}`}
                              >
                                <span className="material-symbols-outlined text-lg" style={{ color: method.methodColor }}>{method.methodIcon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-white text-xs font-medium">{method.methodName}</p>
                                    {method.recommended && <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-[#2ff801]/15 text-[#2ff801] uppercase">Best</span>}
                                  </div>
                                </div>
                                <span className="material-symbols-outlined text-[#c5c6cd]/40 text-sm">{isExp ? 'expand_less' : 'expand_more'}</span>
                              </button>
                              {isExp && (
                                <div className="ml-4 mr-1 mt-1 bg-[#041329]/60 rounded-xl p-3 space-y-2">
                                  <p className="text-[#c5c6cd] text-xs leading-relaxed">{method.reason}</p>
                                  <div className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-xs text-[#4cd6fb] mt-0.5">schedule</span>
                                    <p className="text-[#c5c6cd] text-xs">{method.schedule}</p>
                                  </div>
                                  {method.warnings.map((w, wi) => (
                                    <div key={wi} className="flex items-start gap-1.5 bg-[#ff4444]/5 rounded-lg p-2">
                                      <span className="material-symbols-outlined text-[#ff9999] text-xs mt-0.5">warning</span>
                                      <p className="text-[#ff9999] text-[11px]">{w}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Expert Rules */}
      <div className="bg-[#0d1c32] rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#FF7F50] text-xl">school</span>
          <h3 className="font-[family-name:var(--font-headline)] font-bold text-white text-lg">Expert Rules</h3>
        </div>
        <div className="space-y-2.5">
          {[
            { icon: 'dark_mode', color: '#4cd6fb', tip: 'Dose Alkalinity at NIGHT — pH naturally drops after lights-out, the buffer counteracts this.' },
            { icon: 'priority_high', color: '#ff4444', tip: 'Fix Magnesium FIRST if low. Ca and Alk cannot hold with Mg below 1200 ppm.' },
            { icon: 'speed', color: '#F1C40F', tip: 'Never raise Alk more than 1 dKH/day or Ca more than 20 ppm/day.' },
            { icon: 'balance', color: '#2ff801', tip: 'Always dose Ca and Alk in equal proportions to maintain ionic balance.' },
            { icon: 'water_drop', color: '#d7ffc5', tip: 'Kalkwasser is for MAINTENANCE via ATO only. Never use it to raise depleted levels.' },
            { icon: 'settings', color: '#8f9097', tip: 'Calcium Reactors use CO2 which LOWERS pH. Only for tanks >150gal with heavy SPS.' },
          ].map((item) => (
            <div key={item.tip} className="flex items-start gap-3 bg-[#010e24] rounded-xl p-3">
              <span className="material-symbols-outlined text-base mt-0.5 shrink-0" style={{ color: item.color }}>{item.icon}</span>
              <p className="text-[#c5c6cd] text-xs leading-relaxed">{item.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
