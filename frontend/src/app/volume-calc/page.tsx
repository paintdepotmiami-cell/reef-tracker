'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  calculateAll,
  TANK_PRESETS,
  type MeasureUnit,
  type CalculatorResult,
  type TankPreset,
} from '@/lib/volume-calculator';

/* ─── Evaporation risk meta ─── */
const EVAP_META = {
  low: { label: 'Low', color: '#2ff801', icon: 'check_circle' },
  moderate: { label: 'Moderate', color: '#F1C40F', icon: 'info' },
  high: { label: 'High', color: '#FF7F50', icon: 'warning' },
  critical: { label: 'Critical', color: '#ff4444', icon: 'dangerous' },
};

const STAR_COLORS = ['#ff4444', '#FF7F50', '#F1C40F', '#2ff801', '#2ff801'];

export default function VolumeCalcPage() {
  const [unit, setUnit] = useState<MeasureUnit>('in');
  const [length, setLength] = useState(36);
  const [width, setWidth] = useState(18);
  const [height, setHeight] = useState(16);
  const [tab, setTab] = useState<'volume' | 'weight' | 'viability'>('volume');
  const [showPresets, setShowPresets] = useState(false);

  const result: CalculatorResult = useMemo(() => {
    return calculateAll({ length, width, height, unit });
  }, [length, width, height, unit]);

  const { volume, weight, viability } = result;
  const evap = EVAP_META[viability.evaporationRisk];

  const applyPreset = (preset: TankPreset) => {
    setUnit('in');
    setLength(preset.lengthIn);
    setWidth(preset.widthIn);
    setHeight(preset.heightIn);
    setShowPresets(false);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <Link href="/tools" className="flex items-center gap-1 text-[#c5c6cd]/60 text-xs mb-2 active:opacity-60">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Tools
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 rounded-2xl bg-[#4cd6fb]/15 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#4cd6fb] text-2xl">straighten</span>
          </div>
          <div>
            <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#4cd6fb] text-xs font-medium uppercase">Calculator</p>
            <h1 className="text-2xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Volume & Weight</h1>
          </div>
        </div>
        <p className="text-[#c5c6cd] text-sm">Calculate capacity, weight, and viability for your tank</p>
      </div>

      {/* Dimension Inputs */}
      <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-4">
        {/* Unit Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-[#c5c6cd]/50 uppercase tracking-wider font-bold">Dimensions</p>
          <div className="flex bg-[#041329] rounded-xl overflow-hidden">
            {(['in', 'cm'] as MeasureUnit[]).map(u => (
              <button
                key={u}
                onClick={() => {
                  if (u !== unit) {
                    if (u === 'cm') {
                      setLength(Math.round(length * 2.54));
                      setWidth(Math.round(width * 2.54));
                      setHeight(Math.round(height * 2.54));
                    } else {
                      setLength(Math.round(length / 2.54));
                      setWidth(Math.round(width / 2.54));
                      setHeight(Math.round(height / 2.54));
                    }
                    setUnit(u);
                  }
                }}
                className={`px-4 py-1.5 text-xs font-bold transition-all ${
                  unit === u ? 'bg-[#4cd6fb]/20 text-[#4cd6fb]' : 'text-[#c5c6cd]/40'
                }`}
              >
                {u === 'in' ? 'Inches' : 'Centimeters'}
              </button>
            ))}
          </div>
        </div>

        {/* L × W × H */}
        <div className="grid grid-cols-3 gap-3">
          <DimensionInput label="Length" value={length} onChange={setLength} unit={unit} />
          <DimensionInput label="Width" value={width} onChange={setWidth} unit={unit} />
          <DimensionInput label="Height" value={height} onChange={setHeight} unit={unit} />
        </div>

        {/* Presets */}
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-[#4cd6fb] font-bold uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-xs">{showPresets ? 'expand_less' : 'expand_more'}</span>
          {showPresets ? 'Hide' : 'Common Tank Sizes'}
        </button>
        {showPresets && (
          <div className="grid grid-cols-2 gap-2">
            {TANK_PRESETS.map(preset => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="bg-[#041329] rounded-xl p-2.5 text-left active:scale-[0.97] transition-transform"
              >
                <p className="text-white text-xs font-medium">{preset.name}</p>
                <p className="text-[10px] text-[#c5c6cd]/40">{preset.lengthIn}&quot; × {preset.widthIn}&quot; × {preset.heightIn}&quot;</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Summary Card */}
      <div className="bg-[#0d1c32] rounded-2xl p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-[family-name:var(--font-headline)] font-bold text-[#4cd6fb]">{volume.gallons}</p>
            <p className="text-[9px] text-[#c5c6cd]/50 uppercase">Gallons</p>
          </div>
          <div>
            <p className="text-2xl font-[family-name:var(--font-headline)] font-bold text-[#FF7F50]">{volume.liters}</p>
            <p className="text-[9px] text-[#c5c6cd]/50 uppercase">Liters</p>
          </div>
          <div>
            <p className="text-2xl font-[family-name:var(--font-headline)] font-bold" style={{ color: viability.color }}>{weight.totalMaxLbs}</p>
            <p className="text-[9px] text-[#c5c6cd]/50 uppercase">lbs (max)</p>
          </div>
        </div>

        {/* Viability Badge */}
        <div className="mt-4 flex items-center justify-center gap-3 py-2 rounded-xl" style={{ backgroundColor: `${viability.color}10` }}>
          <span className="material-symbols-outlined text-lg" style={{ color: viability.color }}>{viability.icon}</span>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: viability.color }}>{viability.label}</p>
            <div className="flex gap-0.5 justify-center mt-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <span
                  key={s}
                  className="material-symbols-outlined text-sm"
                  style={{
                    color: s <= viability.rating ? STAR_COLORS[viability.rating - 1] : '#1c2a41',
                    fontVariationSettings: s <= viability.rating ? "'FILL' 1" : undefined,
                  }}
                >star</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['volume', '📐 Volume'], ['weight', '⚖️ Weight'], ['viability', '🎯 Viability']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
              tab === key ? 'bg-[#4cd6fb]/15 text-[#4cd6fb]' : 'bg-[#0d1c32] text-[#c5c6cd]/50'
            }`}
          >{label}</button>
        ))}
      </div>

      {/* ═══ Volume Tab ═══ */}
      {tab === 'volume' && (
        <div className="space-y-3">
          {/* Volume Details */}
          <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-[#4cd6fb] uppercase tracking-widest">Volume Breakdown</p>
            <VolumeRow label="US Gallons" value={`${volume.gallons} gal`} color="#4cd6fb" />
            <VolumeRow label="Liters" value={`${volume.liters} L`} color="#FF7F50" />
            <VolumeRow label="Cubic Inches" value={`${volume.cubicInches} in³`} color="#c5c6cd" />
          </div>

          {/* Formula */}
          <div className="bg-[#041329] rounded-2xl p-4">
            <p className="text-[10px] font-bold text-[#F1C40F] uppercase tracking-widest mb-2">Formula</p>
            <p className="text-[#c5c6cd] text-xs font-mono">
              {unit === 'cm'
                ? `${length} × ${width} × ${height} cm ÷ 1000 = ${volume.liters} L`
                : `${length} × ${width} × ${height} in × 0.004329 = ${volume.gallons} gal`
              }
            </p>
            <p className="text-[#c5c6cd]/40 text-[10px] mt-2">
              Note: Actual water volume is ~10-15% less due to displacement from rock, sand, and equipment.
            </p>
          </div>

          {/* Displacement Estimate */}
          <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-2">
            <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest">Estimated Actual Water Volume</p>
            <div className="flex items-center justify-between">
              <span className="text-[#c5c6cd] text-xs">With live rock (~10% displacement)</span>
              <span className="text-white text-sm font-bold">{Math.round(volume.gallons * 0.9)} gal</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#c5c6cd] text-xs">With rock + sand (~15% displacement)</span>
              <span className="text-white text-sm font-bold">{Math.round(volume.gallons * 0.85)} gal</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Weight Tab ═══ */}
      {tab === 'weight' && (
        <div className="space-y-3">
          {/* Weight Summary */}
          <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-[#FF7F50] uppercase tracking-widest">Weight Estimates</p>
            <VolumeRow label="Saltwater only" value={`${weight.waterOnlyKg} kg / ${weight.waterOnlyLbs} lbs`} color="#4cd6fb" />
            <VolumeRow label="Min total (×1.2)" value={`${weight.totalMinKg} kg / ${weight.totalMinLbs} lbs`} color="#F1C40F" />
            <VolumeRow label="Max total (×1.5)" value={`${weight.totalMaxKg} kg / ${weight.totalMaxLbs} lbs`} color="#ff4444" />
          </div>

          {/* Surface Pressure */}
          <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-2">
            <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest">Surface Pressure</p>
            <div className="flex items-center justify-between">
              <span className="text-[#c5c6cd] text-xs">Per square meter</span>
              <span className="text-white text-sm font-bold">{weight.surfacePressureKgM2} kg/m²</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#c5c6cd] text-xs">Per square foot</span>
              <span className="text-white text-sm font-bold">{weight.surfacePressureLbsFt2} lbs/ft²</span>
            </div>
          </div>

          {/* Stand Warning */}
          {weight.standWarning && (
            <div className="bg-[#ff4444]/8 border border-[#ff4444]/15 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#ff4444]">warning</span>
                <p className="text-[#ff4444] font-bold text-sm">Stand Warning</p>
              </div>
              <p className="text-[#ffb4ab] text-xs leading-relaxed">{weight.standWarning}</p>
            </div>
          )}

          {/* Weight Rule */}
          <div className="bg-[#041329] rounded-2xl p-4">
            <p className="text-[10px] font-bold text-[#F1C40F] uppercase tracking-widest mb-2">Rule of Thumb</p>
            <p className="text-[#c5c6cd] text-xs leading-relaxed">
              Each liter of aquarium equals <span className="text-white font-bold">1.2 to 1.5 kg</span> of total weight when fully set up with water, substrate, rock, and equipment. A decorated 100-liter tank weighs approximately 150 kg (330 lbs).
            </p>
          </div>

          {/* Weight Breakdown Visual */}
          <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-2">
            <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest">What&apos;s in the Weight?</p>
            <WeightBar label="Saltwater" pct={65} color="#4cd6fb" />
            <WeightBar label="Live Rock" pct={18} color="#FF7F50" />
            <WeightBar label="Sand/Substrate" pct={10} color="#F1C40F" />
            <WeightBar label="Glass/Acrylic" pct={5} color="#c5a3ff" />
            <WeightBar label="Equipment" pct={2} color="#d7ffc5" />
          </div>
        </div>
      )}

      {/* ═══ Viability Tab ═══ */}
      {tab === 'viability' && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="rounded-2xl p-4 border" style={{ backgroundColor: `${viability.color}08`, borderColor: `${viability.color}20` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-lg" style={{ color: viability.color }}>{viability.icon}</span>
              <p className="font-bold text-sm" style={{ color: viability.color }}>{viability.label}</p>
            </div>
            <p className="text-[#c5c6cd] text-xs leading-relaxed">{viability.summary}</p>
          </div>

          {/* Stability Metrics */}
          <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest">Stability Assessment</p>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-sm text-[#FF7F50]">thermostat</span>
                <p className="text-white text-xs font-medium">Thermal Stability</p>
              </div>
              <p className="text-[#c5c6cd] text-[11px] ml-6 leading-relaxed">{viability.thermalStability}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-sm text-[#4cd6fb]">science</span>
                <p className="text-white text-xs font-medium">Chemical Stability</p>
              </div>
              <p className="text-[#c5c6cd] text-[11px] ml-6 leading-relaxed">{viability.chemicalStability}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-sm" style={{ color: evap.color }}>water_drop</span>
                <p className="text-white text-xs font-medium">Evaporation Risk</p>
              </div>
              <div className="flex items-center gap-2 ml-6">
                <span className="material-symbols-outlined text-xs" style={{ color: evap.color }}>{evap.icon}</span>
                <p className="text-xs font-bold" style={{ color: evap.color }}>{evap.label}</p>
              </div>
            </div>
          </div>

          {/* Stocking Capacity */}
          <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-[#2ff801] uppercase tracking-widest">Stocking Capacity</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#041329] rounded-xl p-3">
                <p className="text-xl font-bold text-[#4cd6fb]">{viability.maxFishSmall}</p>
                <p className="text-[9px] text-[#c5c6cd]/50 uppercase">Small Fish</p>
                <p className="text-[8px] text-[#c5c6cd]/30">(~1&quot; body)</p>
              </div>
              <div className="bg-[#041329] rounded-xl p-3">
                <p className="text-xl font-bold text-[#FF7F50]">{viability.maxFishMedium}</p>
                <p className="text-[9px] text-[#c5c6cd]/50 uppercase">Medium</p>
                <p className="text-[8px] text-[#c5c6cd]/30">(~3&quot; body)</p>
              </div>
              <div className="bg-[#041329] rounded-xl p-3">
                <p className="text-xl font-bold text-[#c5a3ff]">{viability.maxFishLarge}</p>
                <p className="text-[9px] text-[#c5c6cd]/50 uppercase">Large</p>
                <p className="text-[8px] text-[#c5c6cd]/30">(~6&quot; body)</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-[#041329] rounded-xl p-3">
              <span className="material-symbols-outlined text-[#F1C40F] text-sm">diamond</span>
              <div>
                <p className="text-[10px] text-[#c5c6cd]/50 uppercase">Coral Capacity</p>
                <p className="text-white text-xs font-medium">{viability.maxCorals}</p>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {viability.recommendations.length > 0 && (
            <div className="bg-[#0d1c32] rounded-2xl p-4 space-y-2">
              <p className="text-[10px] font-bold text-[#2ff801] uppercase tracking-widest">Recommendations</p>
              {viability.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#2ff801] text-xs mt-0.5">✓</span>
                  <p className="text-[#c5c6cd] text-xs leading-relaxed">{r}</p>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {viability.warnings.length > 0 && (
            <div className="bg-[#ff4444]/8 border border-[#ff4444]/15 rounded-2xl p-4 space-y-2">
              <p className="text-[10px] font-bold text-[#ff4444] uppercase tracking-widest">Warnings</p>
              {viability.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#ff4444] text-xs mt-0.5">warning</span>
                  <p className="text-[#ffb4ab] text-xs leading-relaxed">{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* Viability Scale */}
          <div className="bg-[#041329] rounded-2xl p-4 space-y-2">
            <p className="text-[10px] font-bold text-[#F1C40F] uppercase tracking-widest mb-2">Viability Scale</p>
            <ScaleRow label="Extreme Nano" range="< 5 gal" color="#ff4444" active={viability.tier === 'nano_extreme'} />
            <ScaleRow label="Nano Reef" range="5-10 gal" color="#FF7F50" active={viability.tier === 'nano'} />
            <ScaleRow label="Small Reef" range="10-20 gal" color="#F1C40F" active={viability.tier === 'intermediate'} />
            <ScaleRow label="Ideal for Beginners" range="20-40 gal" color="#2ff801" active={viability.tier === 'beginner_ideal'} highlight />
            <ScaleRow label="Standard Reef" range="40-105 gal" color="#4cd6fb" active={viability.tier === 'standard'} />
            <ScaleRow label="Large System" range="105+ gal" color="#c5a3ff" active={viability.tier === 'large'} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function DimensionInput({ label, value, onChange, unit }: { label: string; value: number; onChange: (v: number) => void; unit: MeasureUnit }) {
  return (
    <div>
      <p className="text-[10px] text-[#c5c6cd]/50 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center bg-[#041329] rounded-xl overflow-hidden">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          className="px-2 py-2 text-[#c5c6cd]/40 active:text-white"
        >
          <span className="material-symbols-outlined text-sm">remove</span>
        </button>
        <input
          type="number"
          value={value}
          onChange={e => {
            const v = parseInt(e.target.value);
            if (!isNaN(v) && v > 0) onChange(v);
          }}
          className="flex-1 bg-transparent text-white text-center text-sm font-bold py-2 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={() => onChange(value + 1)}
          className="px-2 py-2 text-[#c5c6cd]/40 active:text-white"
        >
          <span className="material-symbols-outlined text-sm">add</span>
        </button>
      </div>
      <p className="text-[9px] text-[#c5c6cd]/30 text-center mt-0.5">{unit}</p>
    </div>
  );
}

function VolumeRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[#c5c6cd] text-xs">{label}</span>
      <span className="text-sm font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

function WeightBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[#c5c6cd] text-[10px]">{label}</span>
        <span className="text-[10px] font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-[#041329] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function ScaleRow({ label, range, color, active, highlight }: { label: string; range: string; color: string; active: boolean; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-3 py-1.5 px-2 rounded-lg transition-all ${active ? 'bg-white/5' : ''}`}>
      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: active ? color : `${color}30` }} />
      <div className="flex-1">
        <p className={`text-xs ${active ? 'text-white font-bold' : 'text-[#c5c6cd]/60'}`}>
          {label}
          {highlight && <span className="text-[#2ff801] text-[8px] ml-1">★ RECOMMENDED</span>}
        </p>
      </div>
      <span className="text-[10px] text-[#c5c6cd]/40">{range}</span>
      {active && <span className="material-symbols-outlined text-xs" style={{ color }}>arrow_back</span>}
    </div>
  );
}
