'use client';

import { useEffect, useState } from 'react';
import { getAnimals, getLatestTest, getEquipment, getSupplements, getStats, generateRecommendations } from '@/lib/queries';
import type { Animal, WaterTest, Equipment, Supplement, Recommendation } from '@/lib/queries';

const BADGE_COLORS: Record<string, string> = {
  Soft: 'bg-emerald-500/15 text-emerald-400',
  LPS: 'bg-amber-500/15 text-amber-400',
  SPS: 'bg-red-500/15 text-red-400',
  Anemone: 'bg-purple-500/15 text-purple-400',
  fish: 'bg-blue-500/15 text-blue-400',
  invertebrate: 'bg-rose-500/15 text-rose-400',
};

const EQUIP_ICONS: Record<string, string> = {
  filtration: '🫧', lighting: '💡', circulation: '🌊', water_management: '💧',
  sump: '📦', heating: '🌡️', testing: '🧪', default: '⚙️',
};

export default function Dashboard() {
  const [fish, setFish] = useState<Animal[]>([]);
  const [corals, setCorals] = useState<Animal[]>([]);
  const [inverts, setInverts] = useState<Animal[]>([]);
  const [test, setTest] = useState<WaterTest | null>(null);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [stats, setStats] = useState({ fish: 0, corals: 0, inverts: 0, equipment: 0 });
  const [modal, setModal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAnimals('fish').then(setFish),
      getAnimals('coral').then(setCorals),
      getAnimals('invertebrate').then(setInverts),
      getLatestTest().then(t => { setTest(t); if (t) setRecs(generateRecommendations(t)); }),
      getEquipment().then(setEquipment),
      getSupplements().then(setSupplements),
      getStats().then(setStats),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-4xl mb-4">🐠</div>
        <div className="text-sky-400 text-lg font-semibold">Cargando Acuario...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {modal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-gradient-to-b from-[#0f1e32] to-[#0a1628] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-sky-500/20 shadow-2xl" onClick={e => e.stopPropagation()}>
            {modal.photo_ref && <img src={`/reference/${modal.photo_ref}`} alt={modal.name} className="w-full h-72 object-cover rounded-t-2xl" />}
            <div className="p-6">
              <h2 className="text-2xl font-extrabold text-white">{modal.name}</h2>
              {modal.species && <p className="text-sky-400 italic mt-1">{modal.species}</p>}
              <div className="flex gap-2 mt-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${BADGE_COLORS[modal.subtype || modal.type] || 'bg-white/10 text-gray-400'}`}>{modal.subtype || modal.type}</span>
                {modal.quantity > 1 && <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-gray-400">x{modal.quantity}</span>}
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${modal.condition === 'healthy' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>{modal.condition === 'healthy' ? 'Healthy' : 'Monitorear'}</span>
              </div>
              {modal.description && <div className="mt-4 text-sm text-gray-400 leading-relaxed">{modal.description}</div>}
              {modal.care_notes && <div className="mt-3 text-sm text-gray-400 leading-relaxed">{modal.care_notes}</div>}
              <button onClick={() => setModal(null)} className="mt-6 w-full py-2 bg-sky-600/20 text-sky-400 rounded-lg hover:bg-sky-600/30 transition font-semibold cursor-pointer">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-gradient-to-r from-sky-700 to-blue-900 px-8 py-8 text-center shadow-lg shadow-sky-900/30">
        <h1 className="text-4xl font-extrabold text-white">🐠 Acuario de Marcial</h1>
        <p className="text-sky-300 text-lg mt-1">40 Galones — Mixed Reef — Miami, FL</p>
      </header>

      <div className="flex justify-center gap-6 py-5 bg-black/20 flex-wrap px-4">
        {[{ n: stats.fish, l: 'Peces' }, { n: stats.corals, l: 'Corales' }, { n: stats.inverts, l: 'Invertebrados' }, { n: stats.equipment, l: 'Equipos' }, { n: '40 gal', l: 'Tanque' }].map(s => (
          <div key={s.l} className="text-center px-6 py-3 bg-white/5 rounded-xl border border-white/10">
            <div className="text-2xl font-extrabold text-sky-400">{s.n}</div>
            <div className="text-xs text-gray-500 mt-1">{s.l}</div>
          </div>
        ))}
      </div>

      {test && (
        <Section title={`Ultima Prueba — ${new Date(test.test_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { p: 'Calcio', v: test.calcium, u: 'ppm', ok: test.calcium != null && test.calcium >= 380 && test.calcium <= 450 },
              { p: 'Alk', v: test.alkalinity, u: 'dKH', ok: test.alkalinity != null && test.alkalinity >= 7 && test.alkalinity <= 11 },
              { p: 'pH', v: test.ph, u: '', ok: test.ph != null && test.ph >= 8.0 && test.ph <= 8.4 },
              { p: 'Fosfato', v: test.phosphate, u: 'ppm', ok: test.phosphate != null && test.phosphate <= 0.1 },
              { p: 'Magnesio', v: test.magnesium, u: 'ppm', ok: test.magnesium != null && test.magnesium >= 1250 && test.magnesium <= 1400 },
              { p: 'Nitrato', v: test.nitrate, u: 'ppm', ok: test.nitrate != null && test.nitrate >= 2 && test.nitrate <= 15 },
              { p: 'Amonio', v: test.ammonia, u: 'ppm', ok: test.ammonia === 0 },
              { p: 'Nitrito', v: test.nitrite, u: 'ppm', ok: test.nitrite === 0 },
            ].map(t => (
              <div key={t.p} className="bg-[#0f1e32] rounded-xl p-4 text-center border border-white/5">
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{t.p}</div>
                <div className={`text-2xl font-extrabold mt-1 ${t.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{t.v ?? '—'}</div>
                <div className="text-[10px] text-gray-600">{t.u}</div>
              </div>
            ))}
          </div>

          {recs.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-white mb-3">Recomendaciones</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recs.map(r => (
                  <div key={r.param} className={`rounded-xl p-4 border-l-4 bg-[#0f1e32] ${r.level === 'ok' ? 'border-emerald-500' : r.level === 'action' ? 'border-amber-500' : 'border-sky-500'}`}>
                    <div className="font-bold text-white text-sm">{r.title}</div>
                    <div className="text-xs text-gray-400 mt-1 leading-relaxed">{r.text}</div>
                    {r.product && <div className="text-[11px] text-sky-400 font-semibold mt-2">{r.product}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-bold text-white mb-3">Plan de Mantenimiento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { freq: 'Diario', color: 'text-emerald-400', items: ['ReefDose: 2L cambio agua (24 dosis)', 'ATO: repone evaporacion + Kalkwasser', 'Klir Filter: filtracion continua', 'Verificar temperatura y salinidad'] },
                { freq: 'Semanal', color: 'text-sky-400', items: ['Prueba de agua completa', 'Limpiar vidrios', 'Vaciar vaso skimmer Klir', 'Reef-Roids a corales 2-3x', 'Dosar Koralle-VM + Replenish + Restor', 'Verificar Kalkwasser en ATO'] },
                { freq: 'Cada 2 Semanas', color: 'text-amber-400', items: ['Cambiar/agitar carbon reactor', 'Verificar RowaPhos en PhosBan', 'Limpiar Jebao pump', 'Podar Chaetomorpha', 'Verificar Nero 3'] },
                { freq: 'Mensual', color: 'text-purple-400', items: ['Reemplazar carbon activado', 'Reemplazar RowaPhos si PO4 sube', 'Calibrar Hanna + refractometro', 'Copepods al chaeto reactor', 'Fraggear Xenia/Kenya', 'Foto progreso'] },
              ].map(m => (
                <div key={m.freq} className="bg-[#0f1e32] rounded-xl p-4 border border-white/5">
                  <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${m.color}`}>{m.freq}</div>
                  {m.items.map(i => <div key={i} className="text-xs text-gray-400 py-1 border-b border-white/5 last:border-0">{i}</div>)}
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      <Section title="Alertas de Compatibilidad">
        <div className="space-y-2">
          {[
            { lvl: 'high', c: 'bg-red-500/15 text-red-400', who: 'Euphyllia (Torch + 2 Hammer)', prob: 'Tentaculos sweep 4-6". Queman corales vecinos.', act: 'Min 6" de todo coral no-Euphyllia.' },
            { lvl: 'high', c: 'bg-red-500/15 text-red-400', who: 'Bubble Tip Anemone', prob: 'Se mueve libre. Peligro con Nero 3.', act: 'Roca aislada. Proteger intakes.' },
            { lvl: 'high', c: 'bg-red-500/15 text-red-400', who: 'Palythoa (Button Polyp)', prob: 'PALYTOXINA mortal.', act: 'NUNCA sin guantes. No hervir rocas.' },
            { lvl: 'med', c: 'bg-amber-500/15 text-amber-400', who: 'Lemonpeel Angel', prob: 'Pica LPS y almejas.', act: 'Monitorear. Mas spirulina/nori.' },
            { lvl: 'med', c: 'bg-amber-500/15 text-amber-400', who: 'Elephant Ear Mushroom', prob: 'Come peces pequenos.', act: 'Lejos del Helfrichi Goby.' },
            { lvl: 'med', c: 'bg-amber-500/15 text-amber-400', who: 'GSP Star Polyps', prob: 'Muy invasivo.', act: 'Aislar en roca separada.' },
            { lvl: 'med', c: 'bg-amber-500/15 text-amber-400', who: 'Xenia Pulsing', prob: 'Invasiva.', act: 'Zona controlada.' },
            { lvl: 'info', c: 'bg-sky-500/15 text-sky-400', who: 'Scolymia Molten Red', prob: 'Sensible. No tolera contacto.', act: 'Sand bed, luz baja, 4" distancia.' },
            { lvl: 'info', c: 'bg-sky-500/15 text-sky-400', who: 'Flame Scallop', prob: 'Dificil largo plazo.', act: 'Fitoplancton 3-4x/semana.' },
          ].map((w, i) => (
            <div key={i} className="bg-[#0f1e32] rounded-lg p-3 flex items-start gap-3 border border-white/5">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 mt-0.5 ${w.c}`}>{w.lvl === 'high' ? 'Alto' : w.lvl === 'med' ? 'Medio' : 'Info'}</span>
              <div className="min-w-0">
                <span className="text-white font-semibold text-sm">{w.who}</span>
                <span className="text-gray-500 text-xs ml-2">{w.prob}</span>
                <div className="text-sky-400/70 text-xs mt-0.5">{w.act}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <AnimalSection title={`Peces (${stats.fish})`} animals={fish} onSelect={setModal} />
      <AnimalSection title={`Corales (${stats.corals})`} animals={corals} onSelect={setModal} />
      <AnimalSection title={`Invertebrados (${stats.inverts})`} animals={inverts} onSelect={setModal} />

      <Section title="Equipos">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {equipment.map(e => (
            <div key={e.id} className="bg-[#0f1e32] rounded-xl p-4 border border-white/5 flex items-center gap-4">
              <div className="text-2xl">{EQUIP_ICONS[e.category || 'default'] || '⚙️'}</div>
              <div><div className="font-semibold text-white text-sm">{e.name}</div>{e.brand && <div className="text-xs text-sky-400">{e.brand}</div>}{e.config && <div className="text-xs text-gray-500 mt-0.5">{e.config}</div>}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Suplementos">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {supplements.map(s => (
            <div key={s.id} className="bg-[#0f1e32] rounded-xl p-4 border border-white/5 flex items-center gap-4">
              <div className="text-2xl">🧬</div>
              <div><div className="font-semibold text-white text-sm">{s.name}</div>{s.brand && <div className="text-xs text-sky-400">{s.brand}</div>}{s.type && <div className="text-xs text-gray-500 mt-0.5">{s.type}</div>}</div>
            </div>
          ))}
        </div>
      </Section>

      <footer className="text-center py-8 text-gray-600 text-sm">Acuario de Marcial &middot; 40 Galones Mixed Reef &middot; Miami, FL</footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-sky-500/20">{title}</h2>
      {children}
    </div>
  );
}

function AnimalSection({ title, animals, onSelect }: { title: string; animals: Animal[]; onSelect: (a: Animal) => void }) {
  return (
    <Section title={title}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {animals.map(a => (
          <div key={a.id} onClick={() => onSelect(a)} className="bg-gradient-to-b from-[#0f1e32] to-[#0a1628] rounded-2xl overflow-hidden border border-white/5 cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-900/20 transition-all duration-300">
            {a.photo_ref && <img src={`/reference/${a.photo_ref}`} alt={a.name} className="w-full h-48 object-cover" loading="lazy" />}
            <div className="p-4">
              <div className="font-bold text-white">{a.name}</div>
              {a.species && <div className="text-xs text-sky-400 italic mt-0.5">{a.species}</div>}
              <div className="flex gap-1.5 mt-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${BADGE_COLORS[a.subtype || a.type] || 'bg-white/10 text-gray-400'}`}>{a.subtype || a.type}</span>
                {a.quantity > 1 && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-gray-400">x{a.quantity}</span>}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${a.condition === 'healthy' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>{a.condition === 'healthy' ? 'Healthy' : 'Monitorear'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
