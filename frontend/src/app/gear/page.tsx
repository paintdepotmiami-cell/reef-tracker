'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import {
  getEquipment, getSupplements,
  createEquipment, updateEquipment, deleteEquipment,
  createSupplement, updateSupplement, deleteSupplement,
  getAnimals, getProducts,
} from '@/lib/queries';
import type { Equipment, Supplement, Animal, Product } from '@/lib/queries';
import Link from 'next/link';
import { getCached, setCache } from '@/lib/cache';
import { searchCatalog, type CatalogItem } from '@/lib/equipment-catalog';
import { searchSupplements, type SupCatalogItem } from '@/lib/supplement-catalog';
import ImageIdentifier, { type IdentifyResult } from '@/components/ImageIdentifier';

/* ─── Equipment Knowledge Base ─── */
interface EquipmentGuide {
  key: string;
  icon: string;
  color: string;
  bg: string;
  label: string;
  importance: 'critical' | 'important' | 'recommended' | 'optional';
  what: string;
  why: string;
  warning: string;
  tip: string;
  keywords: string[]; // match against user's equipment names
}

const EQUIPMENT_GUIDE: EquipmentGuide[] = [
  {
    key: 'skimmer',
    icon: 'air',
    color: '#4cd6fb',
    bg: 'bg-[#4cd6fb]/10',
    label: 'Protein Skimmer',
    importance: 'critical',
    what: 'Removes dissolved organic compounds (DOC) from water before they decompose into ammonia and nitrate. Creates millions of tiny bubbles that attract and export waste as dark "skimmate".',
    why: 'The #1 most important piece of filtration for any reef tank. Without it, organics accumulate causing algae blooms, cyano, and elevated nutrients that stress corals.',
    warning: 'Your tank has no protein skimmer! This is the most critical filtration equipment for a reef. DOC buildup will cause algae, elevated nutrients, and coral stress.',
    tip: 'Size your skimmer for 1.5-2x your tank volume. Clean the neck weekly for optimal performance. Dark, wet skimmate = too low; dry, concentrated = ideal.',
    keywords: ['skimmer', 'protein skimmer'],
  },
  {
    key: 'return_pump',
    icon: 'swap_vert',
    color: '#2ff801',
    bg: 'bg-[#2ff801]/10',
    label: 'Return Pump',
    importance: 'critical',
    what: 'Moves water from the sump back to the display tank, creating the primary water circulation loop. DC pumps allow variable speed control.',
    why: 'Essential for water exchange between sump and display. Powers all sump-based filtration (skimmer, reactors, refugium). Without it, your sump equipment is useless.',
    warning: 'No return pump detected! If you have a sump, you need a return pump to circulate water through your filtration system.',
    tip: 'Target 5-10x tank turnover per hour. DC pumps save energy and allow speed adjustment. A backup pump or battery is recommended for power outages.',
    keywords: ['return pump', 'dc pump', 'pump 50w', 'jebao dc', 'sicce', 'eheim'],
  },
  {
    key: 'wavemaker',
    icon: 'waves',
    color: '#2ff801',
    bg: 'bg-[#2ff801]/10',
    label: 'Wavemakers / Powerheads',
    importance: 'critical',
    what: 'Create random, turbulent water flow inside the display tank. Modern wavemakers (Nero, Gyre, MP series) produce wide, gentle flow patterns that mimic ocean currents.',
    why: 'Corals need flow to deliver food, remove waste, and prevent dead spots where detritus accumulates. SPS corals need high flow, LPS moderate, and soft corals low-moderate.',
    warning: 'No wavemakers detected! Corals need water flow for nutrient delivery, waste removal, and gas exchange. Without flow, dead spots cause detritus buildup and coral stress.',
    tip: 'Place wavemakers on opposite sides for random patterns. SPS needs 40-80x turnover, LPS 20-40x. Avoid pointing directly at corals — indirect/random is best.',
    keywords: ['nero', 'gyre', 'vortech', 'mp40', 'mp10', 'wavemaker', 'powerhead', 'tunze', 'wave'],
  },
  {
    key: 'heater',
    icon: 'thermostat',
    color: '#FF7F50',
    bg: 'bg-[#FF7F50]/10',
    label: 'Heater',
    importance: 'critical',
    what: 'Maintains stable water temperature between 76-80°F (24-27°C). Titanium heaters with external controllers are the safest option.',
    why: 'Temperature swings are one of the fastest ways to kill corals and fish. Even 2°F rapid changes can cause bleaching. Consistent temperature is essential for biological stability.',
    warning: 'No heater detected! Temperature instability is one of the leading causes of coral death. Even in warm climates, nighttime drops can stress livestock.',
    tip: 'Use 3-5 watts per gallon. Titanium heaters are safest (no glass to break). External controller is recommended to prevent overheating if thermostat fails.',
    keywords: ['heater', 'calentador'],
  },
  {
    key: 'lights',
    icon: 'light_mode',
    color: '#F1C40F',
    bg: 'bg-[#F1C40F]/10',
    label: 'Reef Lights',
    importance: 'critical',
    what: 'Provide PAR (Photosynthetically Active Radiation) that corals need for their symbiotic zooxanthellae algae to photosynthesize. LED fixtures allow full spectrum control.',
    why: 'Corals are photosynthetic animals — without proper light they lose color and slowly die. Different corals need different PAR levels: SPS 200-400+, LPS 75-150, softies 50-100.',
    warning: 'No reef lights detected! Photosynthetic corals cannot survive without proper lighting. This is essential equipment for any reef tank.',
    tip: 'Ramp lights up/down over 1-2 hours to simulate sunrise/sunset. 8-10 hour photoperiod is ideal. Acclimate new corals at low PAR and increase gradually.',
    keywords: ['prime', 'hydra', 'radion', 'blade', 'light', 'led', 'lighting', 'kessil', 'ai prime', 'ai blade', 'reef light'],
  },
  {
    key: 'ato',
    icon: 'water_drop',
    color: '#4cd6fb',
    bg: 'bg-[#4cd6fb]/10',
    label: 'ATO (Auto Top-Off)',
    importance: 'important',
    what: 'Automatically replaces water lost to evaporation with fresh RO/DI water. Uses an optical or float sensor to maintain consistent water level.',
    why: 'Evaporation concentrates salinity — even 1 day without top-off can spike salinity from 35 to 37+ ppt, stressing all livestock. ATO maintains rock-stable salinity 24/7.',
    warning: 'No ATO system detected. Manual top-offs lead to salinity swings that stress corals and fish. An ATO is one of the best investments for reef stability.',
    tip: 'Use ONLY RO/DI water (0 TDS). Kalkwasser can be mixed in ATO water to simultaneously dose calcium and alkalinity. Check reservoir level weekly.',
    keywords: ['ato', 'auto top', 'top off', 'top-off', 'smart ato'],
  },
  {
    key: 'sump',
    icon: 'water',
    color: '#4cd6fb',
    bg: 'bg-[#4cd6fb]/10',
    label: 'Sump',
    importance: 'important',
    what: 'A secondary tank (usually below the display) that increases total water volume and houses filtration equipment: skimmer, reactors, heater, return pump, refugium section.',
    why: 'More water volume = more stability. Hides ugly equipment from display. Allows refugium for macroalgae nutrient export. Essential for running reactors and skimmers properly.',
    warning: 'No sump detected. While nano tanks can run without one, a sump dramatically increases stability and allows proper filtration equipment.',
    tip: 'Design sump with 3 chambers: intake (skimmer), refugium (chaeto + live rock), return pump. Baffles prevent microbubbles. Acrylic sumps are lighter than glass.',
    keywords: ['sump', 'refugio', 'refugium'],
  },
  {
    key: 'testing',
    icon: 'science',
    color: '#ffb59c',
    bg: 'bg-[#ffb59c]/10',
    label: 'Test Kits',
    importance: 'important',
    what: 'Measure critical water parameters: alkalinity, calcium, magnesium, phosphate, nitrate, pH, salinity. Digital checkers (Hanna) provide more accurate readings than color kits.',
    why: 'You can\'t manage what you can\'t measure. Weekly testing catches parameter drift before it causes problems. Trending data reveals patterns that prevent crashes.',
    warning: 'No test kits detected! You need at minimum: alkalinity, calcium, and phosphate testing to maintain a reef tank. Without testing, you\'re flying blind.',
    tip: 'Test weekly on the same day. Core 3: Alk, Ca, PO4. Hanna Checkers are the gold standard for accuracy. Log results in ReefOS for trend tracking.',
    keywords: ['hanna', 'checker', 'test kit', 'refractometer', 'api test', 'salifert', 'red sea test', 'medidor'],
  },
  {
    key: 'carbon_reactor',
    icon: 'filter_alt',
    color: '#c5c6cd',
    bg: 'bg-[#c5c6cd]/10',
    label: 'Carbon / GFO Reactor',
    importance: 'recommended',
    what: 'Activated carbon removes yellowing compounds (DOC), medications, and toxins. GFO (granular ferric oxide) absorbs phosphate. Reactors provide constant, even media contact.',
    why: 'Carbon keeps water crystal clear and removes coral chemical warfare toxins. GFO controls phosphate that fuels nuisance algae. Together they polish water quality.',
    warning: 'Consider adding carbon filtration for clearer water and chemical warfare protection between corals.',
    tip: 'Replace carbon every 3-4 weeks (it saturates). ROX 0.8 or Chemi-Pure Blue are top choices. For GFO, use RowaPhos in a reactor — don\'t let it tumble.',
    keywords: ['carbon', 'reactor', 'gfo', 'rowaphos', 'phosban', 'chemi-pure', 'chemipure'],
  },
  {
    key: 'dosing_pump',
    icon: 'medication',
    color: '#2ff801',
    bg: 'bg-[#2ff801]/10',
    label: 'Dosing Pump',
    importance: 'recommended',
    what: 'Automatically doses precise amounts of supplements (alk, calcium, magnesium, trace elements) throughout the day. Prevents parameter swings from manual dosing.',
    why: 'Manual dosing causes spikes and valleys. A dosing pump delivers tiny amounts 24/7, keeping parameters flat-line stable. Essential for SPS-dominant tanks.',
    warning: 'No dosing pump detected. If you dose supplements manually, a dosing pump will dramatically improve parameter stability, especially for SPS corals.',
    tip: 'Program multiple doses per day (e.g., alk every 2 hours). Never dose alk and calcium at the same time — they precipitate. Space them 30+ minutes apart.',
    keywords: ['dosing', 'reefdose', 'doser', 'dosificador', 'kamoer', 'jebao doser'],
  },
  {
    key: 'refugium',
    icon: 'eco',
    color: '#2ff801',
    bg: 'bg-[#2ff801]/10',
    label: 'Refugium / Chaeto Reactor',
    importance: 'recommended',
    what: 'A section of the sump (or external reactor) where macroalgae like Chaetomorpha grows under light 24/7, absorbing nitrate and phosphate from the water naturally.',
    why: 'Natural nutrient export without chemicals. Chaeto competes with nuisance algae for nutrients. Also produces copepods that feed fish and corals. A biological powerhouse.',
    warning: 'Consider a refugium or chaeto reactor for natural nutrient export. It reduces reliance on chemical filtration and produces beneficial copepods.',
    tip: 'Run refugium light on reverse cycle (on when display is off) to stabilize pH overnight. Harvest chaeto monthly — if it goes white/translucent, it\'s dying and releasing nutrients back.',
    keywords: ['chaeto', 'refugium', 'refugio', 'macroalgae', 'chaeto reactor'],
  },
  {
    key: 'uv_sterilizer',
    icon: 'fluorescent',
    color: '#d7ffc5',
    bg: 'bg-[#d7ffc5]/10',
    label: 'UV Sterilizer',
    importance: 'recommended',
    what: 'Uses UV-C radiation to destroy the DNA of free-floating pathogens (ich, velvet, bacteria) and single-celled algae as water passes through the unit. Does not harm beneficial bacteria in your rock or sand.',
    why: 'Prevents disease outbreaks by killing parasites in the water column before they can infect fish. Also clarifies green water from algae blooms. A safety net for your livestock.',
    warning: 'Consider a UV sterilizer to prevent disease outbreaks like ich and velvet. It acts as a safety net for your fish, especially when adding new livestock.',
    tip: 'Size for your tank volume — flow rate matters. Slower flow = more kill rate. Replace the UV bulb every 6-9 months even if it still glows. Run 24/7 for best protection.',
    keywords: ['uv', 'sterilizer', 'esterilizador', 'uv-c', 'ultraviolet'],
  },
  {
    key: 'rodi',
    icon: 'filter_drama',
    color: '#4cd6fb',
    bg: 'bg-[#4cd6fb]/10',
    label: 'RO/DI System',
    importance: 'important',
    what: 'Reverse Osmosis / Deionization system filters tap water, removing 95%+ of chlorine, heavy metals, silicates, nitrates, and phosphates. Produces pure 0 TDS water for saltwater mixing and ATO top-off.',
    why: 'Tap water contains chloramine, phosphate, silicate, and heavy metals that fuel algae and harm corals. Every drop of water entering your reef should be RO/DI. It prevents problems at the source.',
    warning: 'No RO/DI system detected. Using unfiltered tap water introduces phosphates, silicates, and chloramine that cause algae blooms and stress corals. This is essential for any serious reef.',
    tip: 'Replace sediment/carbon filters every 6 months, DI resin when TDS meter reads above 0. Store RO water in food-grade containers. A TDS meter is cheap insurance.',
    keywords: ['rodi', 'ro/di', 'osmosis', 'reverse osmosis', 'rodi system', 'filtro de agua'],
  },
  {
    key: 'overflow',
    icon: 'vertical_align_bottom',
    color: '#c5c6cd',
    bg: 'bg-[#c5c6cd]/10',
    label: 'Overflow Box',
    importance: 'optional',
    what: 'A gravity-fed mechanism (drilled bulkhead or hang-on siphon box) that drains water from the display tank down to the sump. Maintains constant water level in the display while feeding the sump filtration loop.',
    why: 'Required to connect your display to the sump. Drilled overflows are safest (no siphon to break). The overflow determines maximum flow to the sump — size it correctly.',
    warning: 'If you have a sump, you need an overflow to connect it to your display. Without it, the sump-display water loop cannot function.',
    tip: 'Drilled (reef-ready) tanks are preferred over HOB overflow boxes — no siphon break risk. Use a Durso or Herbie standpipe to silence drain noise. Emergency drain highly recommended.',
    keywords: ['overflow', 'rebosadero', 'drain', 'standpipe', 'durso', 'herbie'],
  },
  {
    key: 'chiller',
    icon: 'ac_unit',
    color: '#4cd6fb',
    bg: 'bg-[#4cd6fb]/10',
    label: 'Chiller',
    importance: 'optional',
    what: 'Active cooling unit that removes heat from aquarium water when temperature exceeds your setpoint. Essential in warm climates or rooms with high ambient temperature where fans alone cannot keep water below 80°F.',
    why: 'Coral bleaching begins at 82-84°F. In South Florida and tropical climates, summer heat can push tank temps dangerously high. A chiller is insurance against heat-related coral death.',
    warning: 'In warm climates like South Florida, a chiller prevents lethal temperature spikes during summer. Consider one if your tank regularly exceeds 80°F.',
    tip: 'Size chiller for 1.5x your tank volume. Place it where it can exhaust hot air away from the tank. Fans across the sump can drop 2-4°F as a cheaper alternative.',
    keywords: ['chiller', 'enfriador', 'cooling', 'ac unit'],
  },
  {
    key: 'controller',
    icon: 'settings_remote',
    color: '#c5c6cd',
    bg: 'bg-[#c5c6cd]/10',
    label: 'Aquarium Controller',
    importance: 'optional',
    what: 'Central hub that monitors temperature, pH, ORP, salinity in real-time. Can trigger alerts, shut off heaters if temp spikes, control pumps, and log data automatically.',
    why: 'Peace of mind and automation. Prevents equipment failures from becoming catastrophic. Auto-shuts heater if it sticks on. Alerts you via phone if something goes wrong.',
    warning: 'An aquarium controller provides real-time monitoring and safety automation. Not essential but highly recommended as your system matures.',
    tip: 'Neptune Apex and GHL Profilux are the top choices. Start with a basic pH/temp module and expand. The safety features alone (heater protection) are worth it.',
    keywords: ['apex', 'profilux', 'controller', 'ghl', 'neptune'],
  },
];

const EQ_CATEGORIES = [
  { key: 'lighting', icon: 'light_mode', color: 'text-[#F1C40F]', bg: 'bg-[#F1C40F]/10' },
  { key: 'filtration', icon: 'filter_alt', color: 'text-[#4cd6fb]', bg: 'bg-[#4cd6fb]/10' },
  { key: 'circulation', icon: 'waves', color: 'text-[#2ff801]', bg: 'bg-[#2ff801]/10' },
  { key: 'heating', icon: 'thermostat', color: 'text-[#FF7F50]', bg: 'bg-[#FF7F50]/10' },
  { key: 'sump', icon: 'water', color: 'text-[#4cd6fb]', bg: 'bg-[#4cd6fb]/10' },
  { key: 'testing', icon: 'science', color: 'text-[#ffb59c]', bg: 'bg-[#ffb59c]/10' },
  { key: 'water_management', icon: 'water_drop', color: 'text-[#2ff801]', bg: 'bg-[#2ff801]/10' },
  { key: 'controller', icon: 'settings_remote', color: 'text-[#c5c6cd]', bg: 'bg-[#c5c6cd]/10' },
  { key: 'cooling', icon: 'ac_unit', color: 'text-[#4cd6fb]', bg: 'bg-[#4cd6fb]/10' },
  { key: 'other', icon: 'build', color: 'text-[#c5c6cd]', bg: 'bg-[#c5c6cd]/10' },
];

const SUP_TYPES = [
  'calcium supplement', 'alkalinity supplement', 'magnesium supplement',
  'trace elements', 'coral food', 'bacteria', 'phosphate remover', 'other',
];

function getCatMeta(cat: string | null) {
  return EQ_CATEGORIES.find(c => c.key === (cat || 'other')) || EQ_CATEGORIES[EQ_CATEGORIES.length - 1];
}

/** Check which essential equipment the user has based on names */
function detectEquipment(equipment: Equipment[]): Set<string> {
  const found = new Set<string>();
  const allText = equipment.map(e => `${e.name} ${e.brand || ''} ${e.category || ''} ${e.notes || ''}`.toLowerCase());

  for (const guide of EQUIPMENT_GUIDE) {
    for (const text of allText) {
      if (guide.keywords.some(kw => text.includes(kw))) {
        found.add(guide.key);
        break;
      }
    }
    // Also match by category
    if (guide.key === 'heater' && equipment.some(e => e.category === 'heating')) found.add('heater');
    if (guide.key === 'lights' && equipment.some(e => e.category === 'lighting')) found.add('lights');
    if (guide.key === 'sump' && equipment.some(e => e.category === 'sump')) found.add('sump');
    if (guide.key === 'testing' && equipment.some(e => e.category === 'testing')) found.add('testing');
    if (guide.key === 'controller' && equipment.some(e => e.category === 'controller')) found.add('controller');
  }

  return found;
}

const IMPORTANCE_ORDER = { critical: 0, important: 1, recommended: 2, optional: 3 };
const IMPORTANCE_COLORS = {
  critical: { text: '#ff4444', bg: 'bg-[#ff4444]/10', border: 'border-[#ff4444]/20', label: 'CRITICAL' },
  important: { text: '#FF7F50', bg: 'bg-[#FF7F50]/10', border: 'border-[#FF7F50]/20', label: 'IMPORTANT' },
  recommended: { text: '#F1C40F', bg: 'bg-[#F1C40F]/10', border: 'border-[#F1C40F]/20', label: 'RECOMMENDED' },
  optional: { text: '#4cd6fb', bg: 'bg-[#4cd6fb]/10', border: 'border-[#4cd6fb]/20', label: 'OPTIONAL' },
};

export default function GearPage() {
  const { user, tank } = useAuth();
  const [tab, setTab] = useState<'equipment' | 'supplements' | 'guide'>('equipment');
  const [equipment, setEquipment] = useState<Equipment[]>(getCached<Equipment[]>('equipment') || []);
  const [supplements, setSupplements] = useState<Supplement[]>(getCached<Supplement[]>('supplements') || []);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(!getCached('equipment'));

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Equipment | Supplement | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Detail sheet
  const [selectedGuide, setSelectedGuide] = useState<EquipmentGuide | null>(null);

  // AI Camera
  const [showCamera, setShowCamera] = useState(false);
  const handleIdentifyResult = async (result: IdentifyResult) => {
    setShowCamera(false);
    const aiName = `${result.brand || ''} ${result.name}`.trim();
    setFName(aiName);
    setFBrand(result.brand || '');
    setFImageUrl(null);
    if (result.type === 'supplement') {
      setTab('supplements');
      setFType(result.category || 'other');
    } else {
      setTab('equipment');
      setFCategory(result.category || 'other');
    }
    setShowModal(true);

    // Cross-reference with reef_products DB for rich data
    try {
      const products = reefProducts.length > 0 ? reefProducts : await getProducts();
      if (!reefProducts.length) setReefProducts(products);
      const nameLower = result.name.toLowerCase();
      const brandLower = (result.brand || '').toLowerCase();
      const match = products.find(p => {
        const pName = p.name.toLowerCase();
        const pBrand = p.brand.toLowerCase();
        // Exact brand+name match
        if (brandLower && pBrand === brandLower && pName === nameLower) return true;
        // Name contains or is contained
        if (pName.includes(nameLower) || nameLower.includes(pName)) return true;
        // Brand + partial name
        if (brandLower && pBrand === brandLower && (pName.includes(nameLower.split(' ')[0]) || nameLower.includes(pName.split(' ')[0]))) return true;
        return false;
      });
      if (match) {
        setFName(`${match.brand} ${match.name}`.trim());
        setFBrand(match.brand);
        setFImageUrl(match.image_url);
        if (match.description) setFNotes(match.description);
        if (result.type === 'supplement' && match.subcategory) {
          setFType(match.subcategory);
        } else if (result.type !== 'supplement' && match.category) {
          setFCategory(match.category);
        }
      }
    } catch { /* silently continue with AI-only data */ }
  };

  // Form fields
  const [fName, setFName] = useState('');
  const [fBrand, setFBrand] = useState('');
  const [fCategory, setFCategory] = useState('other');
  const [fType, setFType] = useState('other');
  const [fConfig, setFConfig] = useState('');
  const [fNotes, setFNotes] = useState('');
  const [fImageUrl, setFImageUrl] = useState<string | null>(null);
  const [reefProducts, setReefProducts] = useState<Product[]>([]);

  // Catalog search (works for both equipment and supplements)
  const [showSuggestions, setShowSuggestions] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const catalogResults = useMemo(() => {
    if (!fName.trim() || fName.length < 2) return [];
    if (tab === 'supplements') {
      return searchSupplements(fName, fType !== 'other' ? fType : undefined);
    }
    return searchCatalog(fName, fCategory !== 'other' ? fCategory : undefined);
  }, [fName, fCategory, fType, tab]);

  const pickCatalogItem = (item: CatalogItem) => {
    setFName(`${item.brand} ${item.name}`);
    setFBrand(item.brand);
    setFCategory(item.category);
    setShowSuggestions(false);
  };

  const pickSupItem = (item: SupCatalogItem) => {
    setFName(`${item.brand} ${item.name}`);
    setFBrand(item.brand);
    setFType(item.type);
    setShowSuggestions(false);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const timeout = setTimeout(() => setLoading(false), 6000);
    Promise.allSettled([
      getEquipment().then(e => { setCache('equipment', e); setEquipment(e); }),
      getSupplements().then(s => { setCache('supplements', s); setSupplements(s); }),
      getAnimals().then(a => setAnimals(a)),
      getProducts().then(p => setReefProducts(p)),
    ]).finally(() => { clearTimeout(timeout); setLoading(false); });
  }, [user]);

  const detectedSet = detectEquipment(equipment);
  const hasCoral = animals.some(a => a.type === 'coral');
  const hasSPS = animals.some(a => a.subtype?.toLowerCase().includes('sps') || a.light_need === 'High' || a.difficulty === 'Expert');

  // Missing equipment warnings (only critical + important if they have corals)
  const missingEquipment = EQUIPMENT_GUIDE.filter(g => {
    if (detectedSet.has(g.key)) return false;
    if (g.importance === 'optional') return false;
    if (g.importance === 'recommended' && !hasCoral) return false;
    if (g.key === 'dosing_pump' && !hasSPS) return false;
    return true;
  }).sort((a, b) => IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance]);

  const openAdd = () => {
    setEditing(null);
    setFName(''); setFBrand(''); setFCategory('other'); setFType('other');
    setFConfig(''); setFNotes(''); setFImageUrl(null);
    setShowModal(true);
  };

  const openEdit = (item: Equipment | Supplement) => {
    setEditing(item);
    setFName(item.name);
    setFBrand(item.brand || '');
    setFNotes(item.notes || '');
    if (tab === 'equipment') {
      const eq = item as Equipment;
      setFCategory(eq.category || 'other');
      setFConfig(eq.config || '');
    } else {
      const sup = item as Supplement;
      setFType(sup.type || 'other');
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!fName.trim() || !user) return;
    setSaving(true);

    if (tab === 'equipment' || tab === 'guide') {
      const payload = {
        name: fName.trim(),
        brand: fBrand.trim() || null,
        category: fCategory,
        config: fConfig.trim() || null,
        notes: fNotes.trim() || null,
        image_url: fImageUrl || null,
        user_id: user.id,
        tank_id: tank?.id || null,
      };
      if (editing) {
        await updateEquipment(editing.id, payload);
      } else {
        await createEquipment(payload);
      }
      const updated = await getEquipment();
      setEquipment(updated);
      setCache('equipment', updated);
    } else {
      const payload = {
        name: fName.trim(),
        brand: fBrand.trim() || null,
        type: fType,
        notes: fNotes.trim() || null,
        image_url: fImageUrl || null,
        user_id: user.id,
        tank_id: tank?.id || null,
      };
      if (editing) {
        await updateSupplement(editing.id, payload);
      } else {
        await createSupplement(payload);
      }
      const updated = await getSupplements();
      setSupplements(updated);
      setCache('supplements', updated);
    }

    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (tab === 'equipment') {
      await deleteEquipment(id);
      setEquipment(prev => prev.filter(e => e.id !== id));
    } else {
      await deleteSupplement(id);
      setSupplements(prev => prev.filter(s => s.id !== id));
    }
    setConfirmDelete(null);
  };

  // Group equipment by category
  const grouped = equipment.reduce<Record<string, Equipment[]>>((acc, eq) => {
    const cat = eq.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(eq);
    return acc;
  }, {});

  // Group supplements by type
  const supGrouped = supplements.reduce<Record<string, Supplement[]>>((acc, s) => {
    const t = s.type || 'other';
    if (!acc[t]) acc[t] = [];
    acc[t].push(s);
    return acc;
  }, {});

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-5xl text-[#FF7F50] animate-pulse">settings_input_component</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/my-reef" className="w-9 h-9 rounded-xl bg-[#1c2a41] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[#c5c6cd] text-lg">arrow_back</span>
        </Link>
        <div className="flex-1">
          <p className="font-[family-name:var(--font-headline)] tracking-widest text-[#ffb59c] text-xs font-medium uppercase">My Tank</p>
          <h1 className="text-2xl font-[family-name:var(--font-headline)] font-bold tracking-tight text-white">Gear & Dosing</h1>
        </div>
        <button
          onClick={() => setShowCamera(true)}
          className="w-10 h-10 rounded-xl bg-[#4cd6fb]/15 flex items-center justify-center active:scale-95 transition-transform"
          title="AI Identify"
        >
          <span className="material-symbols-outlined text-[#4cd6fb] text-lg">photo_camera</span>
        </button>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-br from-[#FF7F50] to-[#d35e32] text-white rounded-xl font-[family-name:var(--font-headline)] font-bold text-sm shadow-lg shadow-[#FF7F50]/20 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Add
        </button>
      </div>

      {/* ═══ Missing Equipment Warnings ═══ */}
      {missingEquipment.length > 0 && tab !== 'guide' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ff4444] text-sm">warning</span>
            <p className="text-[10px] font-bold text-[#ff4444] uppercase tracking-widest">Missing Equipment</p>
          </div>
          {missingEquipment.slice(0, 3).map(g => {
            const imp = IMPORTANCE_COLORS[g.importance];
            return (
              <button
                key={g.key}
                onClick={() => setSelectedGuide(g)}
                className={`w-full ${imp.bg} border ${imp.border} rounded-xl p-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#041329]/40 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg" style={{ color: g.color }}>{g.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm">{g.label}</p>
                    <span className="px-1.5 py-0.5 rounded text-[7px] font-extrabold tracking-wider" style={{ color: imp.text, backgroundColor: `${imp.text}15` }}>
                      {imp.label}
                    </span>
                  </div>
                  <p className="text-[#c5c6cd] text-[10px] mt-0.5 line-clamp-2">{g.warning}</p>
                </div>
                <span className="material-symbols-outlined text-[#c5c6cd]/30 shrink-0 text-sm">chevron_right</span>
              </button>
            );
          })}
          {missingEquipment.length > 3 && (
            <button
              onClick={() => setTab('guide')}
              className="w-full text-center text-[#4cd6fb] text-xs font-bold py-2"
            >
              + {missingEquipment.length - 3} more missing — View Equipment Guide
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('equipment')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full font-[family-name:var(--font-headline)] text-xs tracking-wide transition-all ${
            tab === 'equipment'
              ? 'bg-[#FF7F50] text-white font-bold'
              : 'bg-[#1c2a41] text-[#c5c6cd] hover:bg-[#27354c]'
          }`}
        >
          <span className="material-symbols-outlined text-base">settings_input_component</span>
          Equipment
          <span className="text-[10px] opacity-70">({equipment.length})</span>
        </button>
        <button
          onClick={() => setTab('supplements')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full font-[family-name:var(--font-headline)] text-xs tracking-wide transition-all ${
            tab === 'supplements'
              ? 'bg-[#FF7F50] text-white font-bold'
              : 'bg-[#1c2a41] text-[#c5c6cd] hover:bg-[#27354c]'
          }`}
        >
          <span className="material-symbols-outlined text-base">science</span>
          Dosing
          <span className="text-[10px] opacity-70">({supplements.length})</span>
        </button>
        <button
          onClick={() => setTab('guide')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full font-[family-name:var(--font-headline)] text-xs tracking-wide transition-all ${
            tab === 'guide'
              ? 'bg-gradient-to-r from-[#4cd6fb] to-[#2ff801] text-[#041329] font-bold'
              : 'bg-[#1c2a41] text-[#c5c6cd] hover:bg-[#27354c]'
          }`}
        >
          <span className="material-symbols-outlined text-base">menu_book</span>
          Guide
        </button>
      </div>

      {/* Flow Optimizer CTA */}
      {tab === 'equipment' && equipment.some(e => e.category === 'circulation') && (
        <Link
          href="/flow"
          className="block bg-gradient-to-r from-[#4cd6fb]/10 to-[#041329] rounded-2xl p-4 border border-[#4cd6fb]/20 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#4cd6fb]/15 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#4cd6fb]">water</span>
            </div>
            <div className="flex-1">
              <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm">Flow Optimizer</p>
              <p className="text-[10px] text-[#c5c6cd] mt-0.5">AI analysis of pump placement based on your {equipment.filter(e => e.category === 'circulation').length} pumps &amp; coral flow needs</p>
            </div>
            <span className="material-symbols-outlined text-[#4cd6fb]">arrow_forward</span>
          </div>
        </Link>
      )}

      {/* ═══ Equipment List ═══ */}
      {tab === 'equipment' && (
        <div className="space-y-6">
          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-[#1c2a41] mb-3 block">settings_input_component</span>
              <p className="text-[#c5c6cd] text-sm">No equipment yet</p>
              <p className="text-[#8f9097] text-xs mt-1">Tap + to add your first piece of gear</p>
            </div>
          )}
          {EQ_CATEGORIES.map(cat => {
            const items = grouped[cat.key];
            if (!items || items.length === 0) return null;
            return (
              <div key={cat.key} className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-7 h-7 rounded-lg ${cat.bg} flex items-center justify-center`}>
                    <span className={`material-symbols-outlined text-sm ${cat.color}`}>{cat.icon}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#c5c6cd] uppercase tracking-widest">
                    {cat.key.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-[#8f9097]">({items.length})</span>
                </div>
                {items.map(eq => {
                  // Find matching guide for this equipment
                  const eqText = `${eq.name} ${eq.brand || ''} ${eq.notes || ''}`.toLowerCase();
                  const matchedGuide = EQUIPMENT_GUIDE.find(g =>
                    g.keywords.some(kw => eqText.includes(kw))
                  );

                  return (
                    <div
                      key={eq.id}
                      className="bg-[#0d1c32] rounded-xl p-4 flex items-start gap-3 group"
                    >
                      <button
                        onClick={() => matchedGuide && setSelectedGuide(matchedGuide)}
                        className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center shrink-0 ${matchedGuide ? 'active:scale-90 transition-transform' : ''}`}
                      >
                        <span className={`material-symbols-outlined ${cat.color}`}>{cat.icon}</span>
                      </button>
                      <div className="flex-1 min-w-0" onClick={() => matchedGuide && setSelectedGuide(matchedGuide)}>
                        <p className="font-[family-name:var(--font-headline)] font-semibold text-white text-sm truncate">{eq.name}</p>
                        {eq.brand && <p className="text-[10px] text-[#FF7F50]/60 mt-0.5">{eq.brand}</p>}
                        {eq.config && <p className="text-xs text-[#c5c6cd] mt-1 leading-relaxed">{eq.config}</p>}
                        {eq.notes && <p className="text-[10px] text-[#8f9097] mt-1 italic">{eq.notes}</p>}
                        {matchedGuide && (
                          <p className="text-[9px] text-[#4cd6fb] mt-1.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">info</span>
                            Tap for guide
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(eq)}
                          className="w-8 h-8 rounded-lg bg-[#1c2a41] flex items-center justify-center active:scale-90 transition-transform"
                        >
                          <span className="material-symbols-outlined text-[#c5c6cd] text-sm">edit</span>
                        </button>
                        {confirmDelete === eq.id ? (
                          <button
                            onClick={() => handleDelete(eq.id)}
                            className="w-8 h-8 rounded-lg bg-[#93000a]/30 flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <span className="material-symbols-outlined text-[#ffb4ab] text-sm">check</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(eq.id)}
                            className="w-8 h-8 rounded-lg bg-[#1c2a41] flex items-center justify-center active:scale-90 transition-transform"
                          >
                            <span className="material-symbols-outlined text-[#c5c6cd] text-sm">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Supplements List ═══ */}
      {tab === 'supplements' && (
        <div className="space-y-6">
          {/* Dosing Pump Config CTA */}
          <Link
            href="/dosing-config"
            className="block bg-gradient-to-r from-[#2ff801]/10 to-[#041329] rounded-2xl p-4 border border-[#2ff801]/20 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#2ff801]/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#2ff801]">precision_manufacturing</span>
              </div>
              <div className="flex-1">
                <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm">Dosing Pump Manager</p>
                <p className="text-[10px] text-[#c5c6cd] mt-0.5">Configure channels, mL/day, products & auto-dosing schedule</p>
              </div>
              <span className="material-symbols-outlined text-[#2ff801]">arrow_forward</span>
            </div>
          </Link>

          {Object.keys(supGrouped).length === 0 && (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-[#1c2a41] mb-3 block">science</span>
              <p className="text-[#c5c6cd] text-sm">No supplements yet</p>
              <p className="text-[#8f9097] text-xs mt-1">Tap + to add your first supplement</p>
            </div>
          )}
          {Object.entries(supGrouped).map(([type, items]) => (
            <div key={type} className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-[#ffb59c]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm text-[#ffb59c]">science</span>
                </div>
                <span className="text-[10px] font-bold text-[#c5c6cd] uppercase tracking-widest">{type}</span>
                <span className="text-[10px] text-[#8f9097]">({items.length})</span>
              </div>
              {items.map(sup => (
                <div
                  key={sup.id}
                  className="bg-[#0d1c32] rounded-xl p-4 flex items-start gap-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#ffb59c]/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#ffb59c]">science</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-[family-name:var(--font-headline)] font-semibold text-white text-sm truncate">{sup.name}</p>
                    {sup.brand && <p className="text-[10px] text-[#FF7F50]/60 mt-0.5">{sup.brand}</p>}
                    {sup.notes && <p className="text-[10px] text-[#8f9097] mt-1 italic">{sup.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(sup)}
                      className="w-8 h-8 rounded-lg bg-[#1c2a41] flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <span className="material-symbols-outlined text-[#c5c6cd] text-sm">edit</span>
                    </button>
                    {confirmDelete === sup.id ? (
                      <button
                        onClick={() => handleDelete(sup.id)}
                        className="w-8 h-8 rounded-lg bg-[#93000a]/30 flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <span className="material-symbols-outlined text-[#ffb4ab] text-sm">check</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(sup.id)}
                        className="w-8 h-8 rounded-lg bg-[#1c2a41] flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <span className="material-symbols-outlined text-[#c5c6cd] text-sm">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ═══ Equipment Guide Tab ═══ */}
      {tab === 'guide' && (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="bg-gradient-to-br from-[#4cd6fb]/10 to-[#2ff801]/10 rounded-2xl p-4 border border-[#4cd6fb]/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#4cd6fb]">verified</span>
              <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm">Your Equipment Health</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 bg-[#041329]/40 rounded-xl p-3 text-center">
                <p className="text-2xl font-[family-name:var(--font-headline)] font-extrabold text-[#2ff801]">{detectedSet.size}</p>
                <p className="text-[9px] text-[#c5c6cd] uppercase tracking-widest">Detected</p>
              </div>
              <div className="flex-1 bg-[#041329]/40 rounded-xl p-3 text-center">
                <p className="text-2xl font-[family-name:var(--font-headline)] font-extrabold" style={{ color: missingEquipment.length > 0 ? '#FF7F50' : '#2ff801' }}>
                  {missingEquipment.length}
                </p>
                <p className="text-[9px] text-[#c5c6cd] uppercase tracking-widest">Missing</p>
              </div>
              <div className="flex-1 bg-[#041329]/40 rounded-xl p-3 text-center">
                <p className="text-2xl font-[family-name:var(--font-headline)] font-extrabold text-white">{EQUIPMENT_GUIDE.length}</p>
                <p className="text-[9px] text-[#c5c6cd] uppercase tracking-widest">Total</p>
              </div>
            </div>
          </div>

          {/* All equipment guide items */}
          {EQUIPMENT_GUIDE.map(g => {
            const hasIt = detectedSet.has(g.key);
            const imp = IMPORTANCE_COLORS[g.importance];
            return (
              <button
                key={g.key}
                onClick={() => setSelectedGuide(g)}
                className={`w-full rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform border ${
                  hasIt
                    ? 'bg-[#0d1c32] border-[#2ff801]/15'
                    : `${imp.bg} ${imp.border}`
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0`} style={{ backgroundColor: `${g.color}15` }}>
                  <span className="material-symbols-outlined text-xl" style={{ color: g.color }}>{g.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-[family-name:var(--font-headline)] font-bold text-white text-sm">{g.label}</p>
                    {hasIt ? (
                      <span className="px-1.5 py-0.5 rounded text-[7px] font-extrabold tracking-wider bg-[#2ff801]/15 text-[#2ff801]">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[7px] font-extrabold tracking-wider" style={{ color: imp.text, backgroundColor: `${imp.text}15` }}>
                        MISSING — {imp.label}
                      </span>
                    )}
                  </div>
                  <p className="text-[#c5c6cd] text-[10px] mt-0.5 line-clamp-2">
                    {hasIt ? g.what.slice(0, 100) + '...' : g.warning}
                  </p>
                </div>
                <span className="material-symbols-outlined text-[#c5c6cd]/30 shrink-0">chevron_right</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ═══ Equipment Detail Sheet ═══ */}
      {selectedGuide && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={() => setSelectedGuide(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-[#0a1628] rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="sticky top-0 z-10 bg-[#0a1628] pt-3 pb-2 flex justify-center rounded-t-3xl">
              <div className="w-10 h-1 rounded-full bg-[#1c2a41]" />
            </div>

            <div className="px-6 space-y-5 pb-8">
              {/* Icon + Title */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${selectedGuide.color}15` }}>
                  <span className="material-symbols-outlined text-3xl" style={{ color: selectedGuide.color }}>{selectedGuide.icon}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-[family-name:var(--font-headline)] font-extrabold text-white">{selectedGuide.label}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {detectedSet.has(selectedGuide.key) ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#2ff801]/15 text-[#2ff801]">
                        <span className="material-symbols-outlined text-[10px] align-middle mr-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        You have this
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{
                        color: IMPORTANCE_COLORS[selectedGuide.importance].text,
                        backgroundColor: `${IMPORTANCE_COLORS[selectedGuide.importance].text}15`,
                      }}>
                        MISSING — {IMPORTANCE_COLORS[selectedGuide.importance].label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* What it does */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[#4cd6fb] text-sm">help</span>
                  <p className="text-[10px] font-bold text-[#4cd6fb] uppercase tracking-widest">What it does</p>
                </div>
                <p className="text-[#c5c6cd] text-sm leading-relaxed">{selectedGuide.what}</p>
              </div>

              {/* Why it matters */}
              <div className="bg-[#041329] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[#FF7F50] text-sm">priority_high</span>
                  <p className="text-[10px] font-bold text-[#FF7F50] uppercase tracking-widest">Why it matters</p>
                </div>
                <p className="text-[#c5c6cd] text-sm leading-relaxed">{selectedGuide.why}</p>
              </div>

              {/* Pro tip */}
              <div className="bg-[#2ff801]/5 rounded-xl p-4 border border-[#2ff801]/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[#2ff801] text-sm">lightbulb</span>
                  <p className="text-[10px] font-bold text-[#2ff801] uppercase tracking-widest">Pro Tip</p>
                </div>
                <p className="text-[#c5c6cd] text-sm leading-relaxed">{selectedGuide.tip}</p>
              </div>

              {/* Warning if missing */}
              {!detectedSet.has(selectedGuide.key) && (
                <div className="bg-[#ff4444]/5 rounded-xl p-4 border border-[#ff4444]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[#ff4444] text-sm">warning</span>
                    <p className="text-[10px] font-bold text-[#ff4444] uppercase tracking-widest">Your Tank</p>
                  </div>
                  <p className="text-[#c5c6cd] text-sm leading-relaxed">{selectedGuide.warning}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Add/Edit Modal ═══ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 z-[60] flex items-end sm:items-center justify-center" onClick={() => setShowModal(false)}>
          <div
            className="bg-gradient-to-b from-[#112036] to-[#041329] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto border-t border-[#ffb59c]/10 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 space-y-5">
              <div className="flex justify-center sm:hidden">
                <div className="w-10 h-1 rounded-full bg-[#27354c]"></div>
              </div>

              <div className="flex items-center justify-between">
                <h2 className="text-lg font-[family-name:var(--font-headline)] font-bold text-white">
                  {editing ? 'Edit' : 'Add'} {tab === 'supplements' ? 'Supplement' : 'Equipment'}
                </h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-[#1c2a41] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#c5c6cd] text-sm">close</span>
                </button>
              </div>

              <div className="relative">
                <label className="font-[family-name:var(--font-headline)] text-[9px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-1.5">
                  Name *
                  <span className="text-[#FF7F50]/60 ml-2 normal-case tracking-normal">Search or type custom</span>
                </label>
                <div className="relative">
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={fName}
                    onChange={e => { setFName(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3 px-4 pr-10 text-white text-sm focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent placeholder:text-slate-500"
                    placeholder={tab === 'supplements' ? 'Search... Red Sea, Brightwell, Seachem...' : 'Search... AI Hydra, Vortech, Tunze...'}
                    autoFocus
                  />
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#c5c6cd]/30 text-lg pointer-events-none">search</span>
                </div>

                {/* Catalog Suggestions Dropdown */}
                {showSuggestions && fName.trim().length >= 2 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute left-0 right-0 top-full mt-1 bg-[#0d1c32] border border-[#1c2a41] rounded-xl overflow-hidden z-10 shadow-2xl max-h-[280px] overflow-y-auto"
                  >
                    {catalogResults.length > 0 ? (
                      <>
                        <div className="px-3 py-1.5 border-b border-[#1c2a41]">
                          <p className="text-[8px] text-[#c5c6cd]/40 uppercase tracking-widest font-bold">{catalogResults.length} Result{catalogResults.length !== 1 ? 's' : ''}</p>
                        </div>
                        {catalogResults.map((item, i) => {
                          const isSup = tab === 'supplements';
                          const typeOrCat = isSup ? (item as SupCatalogItem).type : (item as CatalogItem).category;
                          return (
                            <button
                              key={`${item.brand}-${item.name}-${i}`}
                              onClick={() => isSup ? pickSupItem(item as SupCatalogItem) : pickCatalogItem(item as CatalogItem)}
                              className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-[#1c2a41]/50 active:bg-[#1c2a41] transition-colors border-b border-[#1c2a41]/30 last:border-0"
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSup ? 'bg-[#2ff801]/10' : 'bg-[#FF7F50]/10'}`}>
                                <span className={`material-symbols-outlined text-sm ${isSup ? 'text-[#2ff801]' : 'text-[#FF7F50]'}`}>
                                  {isSup ? (
                                    typeOrCat.includes('calcium') ? 'labs' :
                                    typeOrCat.includes('alkalinity') ? 'shield' :
                                    typeOrCat.includes('magnesium') ? 'experiment' :
                                    typeOrCat.includes('trace') ? 'auto_awesome' :
                                    typeOrCat.includes('coral food') ? 'restaurant' :
                                    typeOrCat.includes('bacteria') ? 'biotech' :
                                    typeOrCat.includes('phosphate') || typeOrCat.includes('nitrate') ? 'filter_alt' :
                                    typeOrCat.includes('salt') ? 'water_drop' :
                                    typeOrCat.includes('dip') ? 'local_hospital' :
                                    typeOrCat.includes('fish food') ? 'set_meal' :
                                    typeOrCat.includes('amino') ? 'colorize' :
                                    typeOrCat.includes('buffer') || typeOrCat.includes('ph') ? 'straighten' : 'science'
                                  ) : (
                                    typeOrCat === 'lighting' ? 'light_mode' :
                                    typeOrCat === 'circulation' ? 'waves' :
                                    typeOrCat === 'filtration' ? 'filter_alt' :
                                    typeOrCat === 'heating' ? 'thermostat' :
                                    typeOrCat === 'water_management' ? 'water_drop' :
                                    typeOrCat === 'testing' ? 'science' :
                                    typeOrCat === 'controller' ? 'settings_remote' :
                                    typeOrCat === 'sump' ? 'plumbing' : 'settings'
                                  )}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{item.brand} {item.name}</p>
                                <p className="text-[#c5c6cd]/40 text-[10px] capitalize">{typeOrCat.replace(/_/g, ' ')}</p>
                              </div>
                              {item.popular && (
                                <span className="text-[7px] font-bold text-[#F1C40F] bg-[#F1C40F]/10 px-1.5 py-0.5 rounded uppercase">Top</span>
                              )}
                            </button>
                          );
                        })}
                      </>
                    ) : (
                      <div className="p-4 text-center space-y-3">
                        <span className="material-symbols-outlined text-2xl text-[#c5c6cd]/20">search_off</span>
                        <p className="text-[#c5c6cd]/50 text-xs">No matches for &ldquo;{fName}&rdquo;</p>
                        <div className="flex gap-2">
                          <a
                            href={`https://www.google.com/search?q=${encodeURIComponent(fName + (tab === 'supplements' ? ' reef aquarium supplement' : ' reef aquarium equipment'))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-[#4cd6fb]/10 text-[#4cd6fb] active:scale-95 transition-transform"
                          >
                            <span className="material-symbols-outlined text-sm">travel_explore</span>
                            Search Google
                          </a>
                          <button
                            onClick={() => setShowSuggestions(false)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-[#FF7F50]/10 text-[#FF7F50] active:scale-95 transition-transform"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            Add Custom
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="font-[family-name:var(--font-headline)] text-[9px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-1.5">Brand</label>
                <input
                  type="text"
                  value={fBrand}
                  onChange={e => setFBrand(e.target.value)}
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3 px-4 text-white text-sm focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent placeholder:text-slate-500"
                  placeholder={tab === 'supplements' ? 'e.g. Brightwell Aquatics' : 'e.g. AquaIllumination'}
                />
              </div>

              {tab === 'supplements' ? (
                <div>
                  <label className="font-[family-name:var(--font-headline)] text-[9px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-1.5">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {SUP_TYPES.map(t => (
                      <button
                        key={t}
                        onClick={() => setFType(t)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border capitalize ${
                          fType === t
                            ? 'border-[#FF7F50] bg-[#FF7F50]/10 text-[#FF7F50]'
                            : 'border-[#1c2a41] bg-[#0d1c32] text-[#c5c6cd] hover:border-[#27354c]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="font-[family-name:var(--font-headline)] text-[9px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-1.5">Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {EQ_CATEGORIES.map(cat => (
                      <button
                        key={cat.key}
                        onClick={() => setFCategory(cat.key)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                          fCategory === cat.key
                            ? 'border-[#FF7F50] bg-[#FF7F50]/10'
                            : 'border-[#1c2a41] bg-[#0d1c32] hover:border-[#27354c]'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-lg ${fCategory === cat.key ? 'text-[#FF7F50]' : cat.color}`}>{cat.icon}</span>
                        <span className={`text-[9px] font-medium capitalize ${fCategory === cat.key ? 'text-[#FF7F50]' : 'text-[#c5c6cd]'}`}>
                          {cat.key.replace('_', ' ')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tab !== 'supplements' && (
                <div>
                  <label className="font-[family-name:var(--font-headline)] text-[9px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-1.5">Config / Settings</label>
                  <textarea
                    value={fConfig}
                    onChange={e => setFConfig(e.target.value)}
                    rows={2}
                    className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3 px-4 text-white text-sm focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent placeholder:text-slate-500 resize-none"
                    placeholder="e.g. 70% blue, 30% white, ramp 10am-10pm"
                  />
                </div>
              )}

              <div>
                <label className="font-[family-name:var(--font-headline)] text-[9px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-1.5">Notes</label>
                <textarea
                  value={fNotes}
                  onChange={e => setFNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3 px-4 text-white text-sm focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent placeholder:text-slate-500 resize-none"
                  placeholder="Optional notes..."
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !fName.trim()}
                className="w-full bg-gradient-to-br from-[#FF7F50] to-[#d35e32] text-white font-[family-name:var(--font-headline)] font-bold py-3.5 rounded-xl text-sm tracking-widest uppercase shadow-xl shadow-[#FF7F50]/20 active:scale-[0.98] transition-transform duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> Saving...</>
                ) : (
                  <><span className="material-symbols-outlined text-sm">{editing ? 'check' : 'add'}</span> {editing ? 'Save Changes' : 'Add'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Camera */}
      {showCamera && (
        <ImageIdentifier
          context={tab === 'supplements' ? 'supplement' : 'equipment'}
          onResult={handleIdentifyResult}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Animation style */}
      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
