'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { createEquipment, createMaintenanceTask, createWaterTest, getSpecies, getProducts } from '@/lib/queries';

/* ── Step Definitions ─────────────────────────────────── */

const STEPS_NEW = [
  { title: 'Design Your System', subtitle: 'Tank size, type & configuration', icon: 'water' },
  { title: 'About You', subtitle: 'Experience, goals & preferences', icon: 'school' },
  { title: 'Gear Up', subtitle: 'Equipment checklist', icon: 'build' },
  { title: 'Mix Your Ocean', subtitle: 'Water preparation guide', icon: 'water_drop' },
  { title: 'The Patience Step', subtitle: 'Cycle readiness & nitrogen cycle', icon: 'biotech' },
  { title: 'Welcome to ReefOS', subtitle: 'You\'re ready to begin', icon: 'rocket_launch' },
];

const STEPS_EXISTING = [
  { title: 'Design Your System', subtitle: 'Tank size, type & configuration', icon: 'water' },
  { title: 'About You', subtitle: 'Experience, goals & preferences', icon: 'school' },
  { title: 'Scan Your Gear', subtitle: 'Photo-identify your equipment', icon: 'photo_camera' },
  { title: 'Scan Your Livestock', subtitle: 'Photo-identify fish & corals', icon: 'pets' },
  { title: 'Current Parameters', subtitle: 'Snap your latest test results', icon: 'science' },
  { title: 'Welcome to ReefOS', subtitle: 'You\'re ready to begin', icon: 'rocket_launch' },
];

/* ── Commercial Tank Presets ──────────────────────────── */

const COMMERCIAL_TANKS: { brand: string; models: { name: string; gallons: number }[] }[] = [
  { brand: 'Red Sea', models: [
    { name: 'Max Nano', gallons: 20 }, { name: 'Max E-170', gallons: 45 }, { name: 'Max E-260', gallons: 69 },
    { name: 'Max E-370', gallons: 98 }, { name: 'Max S-400', gallons: 110 }, { name: 'Max S-500', gallons: 133 },
    { name: 'Reefer 170', gallons: 43 }, { name: 'Reefer 250', gallons: 65 }, { name: 'Reefer 300', gallons: 80 },
    { name: 'Reefer 350', gallons: 91 }, { name: 'Reefer 425 XL', gallons: 112 }, { name: 'Reefer 525 XL', gallons: 139 },
    { name: 'Reefer 625 XXL', gallons: 164 }, { name: 'Reefer 750 XXL', gallons: 200 },
    { name: 'Reefer Peninsula 500', gallons: 132 }, { name: 'Reefer Peninsula 650', gallons: 172 },
  ]},
  { brand: 'Waterbox', models: [
    { name: 'Cube 10', gallons: 10 }, { name: 'Cube 15', gallons: 15 }, { name: 'Cube 20', gallons: 20 },
    { name: 'AIO 16', gallons: 16 }, { name: 'AIO 25', gallons: 25 }, { name: 'AIO 35', gallons: 35 },
    { name: 'Marine X 60.2', gallons: 60 }, { name: 'Marine X 90.3', gallons: 90 },
    { name: 'Marine X 110.4', gallons: 110 }, { name: 'Marine X 150.5', gallons: 150 },
    { name: 'Marine X 185.5', gallons: 185 }, { name: 'Marine X 220.6', gallons: 220 },
    { name: 'Peninsula 25', gallons: 25 }, { name: 'Peninsula 65.4', gallons: 65 },
  ]},
  { brand: 'Innovative Marine', models: [
    { name: 'Nuvo 10', gallons: 10 }, { name: 'Nuvo 20', gallons: 20 }, { name: 'Nuvo 40', gallons: 40 },
    { name: 'Lagoon 25', gallons: 25 }, { name: 'Lagoon 50', gallons: 50 },
    { name: 'EXT 30', gallons: 30 }, { name: 'EXT 50', gallons: 50 }, { name: 'EXT 75', gallons: 75 },
    { name: 'EXT 100', gallons: 100 }, { name: 'EXT 150', gallons: 150 }, { name: 'EXT 200', gallons: 200 },
  ]},
  { brand: 'Coralife', models: [
    { name: 'BioCube 16', gallons: 16 }, { name: 'BioCube 32', gallons: 32 },
  ]},
  { brand: 'Fluval', models: [
    { name: 'Evo 5', gallons: 5 }, { name: 'Evo 13.5', gallons: 13 }, { name: 'Sea Evo 52', gallons: 52 },
  ]},
  { brand: 'JBJ', models: [
    { name: 'Rimless Flat Panel 10', gallons: 10 }, { name: 'Rimless Flat Panel 25', gallons: 25 },
    { name: 'Rimless Flat Panel 45', gallons: 45 }, { name: 'Rimless Flat Panel 65', gallons: 65 },
  ]},
];

const TANK_TYPES = [
  { key: 'reef', label: 'Reef Tank', desc: 'SPS, LPS, soft corals', icon: 'waves' },
  { key: 'mixed', label: 'Mixed Reef', desc: 'Fish + corals balanced', icon: 'pets' },
  { key: 'fish_only', label: 'Fish Only', desc: 'FOWLR or FO system', icon: 'set_meal' },
  { key: 'nano', label: 'Nano Reef', desc: 'Under 30 gallons', icon: 'science' },
];

const SUMP_TYPES = [
  { key: 'sump', label: 'Sump System', desc: 'Separate chamber below tank — hides equipment, more water volume', icon: 'filter_alt' },
  { key: 'aio', label: 'All-in-One', desc: 'Rear chambers built into tank — compact, beginner-friendly', icon: 'check_box' },
  { key: 'hob', label: 'Hang-on-Back', desc: 'External filters/skimmer hang on rim — budget option', icon: 'dock_to_right' },
];

const EXPERIENCE_LEVELS = [
  { key: 'beginner', label: 'Beginner', desc: 'First saltwater tank', icon: 'eco' },
  { key: 'intermediate', label: 'Intermediate', desc: '1-3 years experience', icon: 'trending_up' },
  { key: 'advanced', label: 'Advanced', desc: '3+ years, SPS keeper', icon: 'military_tech' },
];

const REEF_GOALS = [
  { key: 'fish_focus', label: 'Fish-Focused', desc: 'Colorful fish, minimal corals', icon: 'set_meal', color: '#F1C40F' },
  { key: 'coral_garden', label: 'Coral Garden', desc: 'Softies & LPS dominated', icon: 'nature', color: '#2ff801' },
  { key: 'sps_reef', label: 'SPS Reef', desc: 'Advanced long-term goal', icon: 'military_tech', color: '#FF7F50' },
  { key: 'mixed', label: 'Mixed Reef', desc: 'Balanced ecosystem', icon: 'waves', color: '#4cd6fb' },
];

/* ── Equipment Catalog (for existing tank scan) ─────────── */

const EQUIPMENT_CATALOG: { category: string; icon: string; items: { name: string; brand: string }[] }[] = [
  { category: 'Lighting', icon: 'light_mode', items: [
    { name: 'Hydra 32 HD', brand: 'Aqua Illumination' }, { name: 'Hydra 64 HD', brand: 'Aqua Illumination' },
    { name: 'Prime 16 HD', brand: 'Aqua Illumination' }, { name: 'Blade', brand: 'Aqua Illumination' },
    { name: 'A360X', brand: 'Kessil' }, { name: 'A500X', brand: 'Kessil' }, { name: 'A160WE', brand: 'Kessil' },
    { name: 'Radion XR15', brand: 'EcoTech Marine' }, { name: 'Radion XR30', brand: 'EcoTech Marine' },
    { name: 'Photon V2+', brand: 'Reef Factory' },
    { name: 'Black Box LED', brand: 'Generic' }, { name: 'ReefLED 90', brand: 'Red Sea' }, { name: 'ReefLED 160S', brand: 'Red Sea' },
    { name: 'Nemolight S72', brand: 'Nemo' },
    { name: 'OR3 90', brand: 'Orphek' }, { name: 'OR3 120', brand: 'Orphek' }, { name: 'Atlantik V4', brand: 'Orphek' },
  ]},
  { category: 'Skimmer', icon: 'bubble_chart', items: [
    { name: 'Classic 110-S', brand: 'Reef Octopus' }, { name: 'Classic 150-S', brand: 'Reef Octopus' },
    { name: 'Regal 150-S', brand: 'Reef Octopus' }, { name: 'Regal 200-S', brand: 'Reef Octopus' },
    { name: 'Curve 5', brand: 'Bubble Magus' }, { name: 'Curve 7', brand: 'Bubble Magus' },
    { name: 'Comline DOC 9001', brand: 'Tunze' }, { name: 'DOC 9410', brand: 'Tunze' },
    { name: 'RSK-300', brand: 'Red Sea' }, { name: 'RSK-600', brand: 'Red Sea' },
    { name: 'SWC-120', brand: 'SWC' }, { name: 'SWC-160', brand: 'SWC' },
    { name: 'Jebao DPS-6', brand: 'Jebao' },
    { name: 'HOB-1', brand: 'IceCap' },
    { name: 'Skim-Mate 800', brand: 'AquaMaxx' },
  ]},
  { category: 'Return Pump', icon: 'water_pump', items: [
    { name: 'Sicce Syncra SDC 7.0', brand: 'Sicce' }, { name: 'Sicce Syncra SDC 9.0', brand: 'Sicce' },
    { name: 'Sicce Syncra Silent 3.0', brand: 'Sicce' },
    { name: 'Varios 4S', brand: 'Abyzz' },
    { name: 'DC Runner 5.3', brand: 'Aqua Medic' },
    { name: 'Vectra S2', brand: 'EcoTech Marine' }, { name: 'Vectra M2', brand: 'EcoTech Marine' }, { name: 'Vectra L2', brand: 'EcoTech Marine' },
    { name: 'Silence 5.0', brand: 'Tunze' },
    { name: 'MightyJet DC', brand: 'Innovative Marine' },
    { name: 'Waveline DC-3000', brand: 'Jebao' }, { name: 'Waveline DC-6000', brand: 'Jebao' },
  ]},
  { category: 'Powerhead', icon: 'air', items: [
    { name: 'VorTech MP10', brand: 'EcoTech Marine' }, { name: 'VorTech MP40', brand: 'EcoTech Marine' }, { name: 'VorTech MP60', brand: 'EcoTech Marine' },
    { name: 'Nero 3', brand: 'Aqua Illumination' }, { name: 'Nero 5', brand: 'Aqua Illumination' }, { name: 'Nero 7', brand: 'Aqua Illumination' },
    { name: 'Turbelle 6040', brand: 'Tunze' }, { name: 'Turbelle 6055', brand: 'Tunze' }, { name: 'Turbelle 6095', brand: 'Tunze' },
    { name: 'Gyre XF-250', brand: 'Maxspect' }, { name: 'Gyre XF-350', brand: 'Maxspect' },
    { name: 'SOW-8', brand: 'Jebao' }, { name: 'SOW-16', brand: 'Jebao' },
    { name: 'IceCap 2K Gyre', brand: 'IceCap' },
  ]},
  { category: 'Heater', icon: 'thermostat', items: [
    { name: 'Titanium 150W', brand: 'Finnex' }, { name: 'Titanium 300W', brand: 'Finnex' },
    { name: 'TH-500', brand: 'Finnex' },
    { name: 'Titanium 200W', brand: 'Aqueon' }, { name: 'Titanium 300W', brand: 'Aqueon' },
    { name: 'Jäger 200W', brand: 'Eheim' }, { name: 'Jäger 300W', brand: 'Eheim' },
    { name: 'Smart Heater', brand: 'Reef Factory' },
    { name: 'InkBird ITC-306T', brand: 'InkBird' }, { name: 'InkBird ITC-308', brand: 'InkBird' },
    { name: 'BeanTemp', brand: 'BRS' },
  ]},
  { category: 'ATO', icon: 'water_drop', items: [
    { name: 'Smart ATO Micro', brand: 'AutoAqua' }, { name: 'Smart ATO Duo', brand: 'AutoAqua' },
    { name: 'Osmolator 3155', brand: 'Tunze' }, { name: 'Nano Osmolator', brand: 'Tunze' },
    { name: 'XP ATO', brand: 'IceCap' },
    { name: 'Smart ATO', brand: 'Reef Factory' },
    { name: 'Hydros ATO', brand: 'CoralVue' },
    { name: 'MightyJet ATO', brand: 'Innovative Marine' },
  ]},
  { category: 'Controller', icon: 'settings_input_component', items: [
    { name: 'Apex', brand: 'Neptune Systems' }, { name: 'Apex Jr', brand: 'Neptune Systems' }, { name: 'Apex EL', brand: 'Neptune Systems' },
    { name: 'Trident', brand: 'Neptune Systems' },
    { name: 'Hydros Control X4', brand: 'CoralVue' }, { name: 'Hydros Control X2', brand: 'CoralVue' },
    { name: 'Reef Commander', brand: 'Reef Factory' },
    { name: 'ReefBot', brand: 'Reef Kinetics' },
    { name: 'ALKATRONIC', brand: 'FocusTree' },
    { name: 'GHL ProfiLux 4', brand: 'GHL' },
  ]},
  { category: 'Dosing Pump', icon: 'science', items: [
    { name: 'ReefDose 2', brand: 'Red Sea' }, { name: 'ReefDose 4', brand: 'Red Sea' },
    { name: 'DOS', brand: 'Neptune Systems' }, { name: 'DDR', brand: 'Neptune Systems' },
    { name: 'Jebao DP-4', brand: 'Jebao' },
    { name: 'Kamoer X1 Pro', brand: 'Kamoer' },
    { name: 'Smart Doser', brand: 'Reef Factory' },
    { name: 'BRS 1.1mL', brand: 'BRS' },
  ]},
  { category: 'Reactor', icon: 'filter_alt', items: [
    { name: 'BioPellet Reactor', brand: 'BRS' }, { name: 'GFO/Carbon Reactor', brand: 'BRS' },
    { name: 'Bio Reactor 70', brand: 'Reef Octopus' },
    { name: 'FR-SE Media Reactor', brand: 'Two Little Fishies' },
    { name: 'CaRx C120.2', brand: 'Reef Octopus' },
    { name: 'KR Reactor', brand: 'Deltec' },
    { name: 'Rollermat', brand: 'Theiling' },
    { name: 'Clarisea SK-3000', brand: 'D-D' },
  ]},
  { category: 'RO/DI', icon: 'water_full', items: [
    { name: '4-Stage Value Plus', brand: 'BRS' }, { name: '5-Stage Plus', brand: 'BRS' }, { name: '6-Stage Universal', brand: 'BRS' },
    { name: 'Typhoon III', brand: 'Air Water Ice' },
    { name: 'Aquatic Life RO Buddie', brand: 'Aquatic Life' },
    { name: 'Maxcap', brand: 'Spectrapure' },
    { name: 'SpectraSelect 90', brand: 'Spectrapure' },
  ]},
];

/* ── Equipment Checklist ──────────────────────────────── */

interface EquipItem {
  name: string;
  category: string;
  why: string;
  essential: boolean;
  status: 'have' | 'need' | 'skip';
}

const INITIAL_EQUIPMENT: EquipItem[] = [
  // Core
  { name: 'Aquarium / Tank', category: 'Core', why: 'The glass or acrylic enclosure — foundation of everything', essential: true, status: 'need' },
  { name: 'Stand', category: 'Core', why: 'Must support total weight (gallons × 10 lbs + rock + sand)', essential: true, status: 'need' },
  { name: 'Return Pump', category: 'Core', why: 'Moves water from sump back to display tank', essential: true, status: 'need' },
  // Filtration
  { name: 'Protein Skimmer', category: 'Filtration', why: 'Removes organic waste via foam fractionation — the most important piece of filtration', essential: true, status: 'need' },
  { name: 'Filter Socks / Roller', category: 'Filtration', why: 'Catches detritus and particles before they decompose', essential: false, status: 'need' },
  { name: 'Carbon / GFO Media', category: 'Filtration', why: 'Carbon removes toxins, GFO removes phosphate', essential: false, status: 'need' },
  // Circulation
  { name: 'Wavemaker / Powerhead', category: 'Circulation', why: 'Corals need flow for gas exchange and feeding — aim for 40-80× turnover', essential: true, status: 'need' },
  // Lighting
  { name: 'LED Light Fixture', category: 'Lighting', why: 'Provides PAR for photosynthesis — blue/white spectrum for corals', essential: true, status: 'need' },
  // Water
  { name: 'RO/DI Unit', category: 'Water', why: 'Removes 95%+ of tap water impurities — never use raw tap water', essential: true, status: 'need' },
  { name: 'Salt Mix', category: 'Water', why: 'Creates synthetic seawater — brands: Red Sea, Fritz, Instant Ocean', essential: true, status: 'need' },
  { name: 'Refractometer', category: 'Water', why: 'Measures salinity accurately — target 1.025-1.026 SG', essential: true, status: 'need' },
  { name: 'Mixing Container + Pump', category: 'Water', why: 'Mix saltwater 24hrs before use — match temp and salinity', essential: true, status: 'need' },
  // Heating
  { name: 'Heater', category: 'Heating', why: 'Maintains 76-78°F — corals die at <72°F', essential: true, status: 'need' },
  { name: 'Heater Controller', category: 'Heating', why: 'CRITICAL safety device. Heaters are the #1 equipment failure — they stick ON and cook your tank. An external controller (InkBird, Apex) cuts power if temp exceeds your setpoint. Non-negotiable for any reef.', essential: true, status: 'need' },
  // Water Management
  { name: 'Auto Top-Off (ATO)', category: 'Water Management', why: 'Automatically replenishes evaporated freshwater to maintain salinity. Essential for nano tanks (<30gal) where evaporation causes dangerous salinity swings within hours.', essential: false, status: 'need' },
  // Monitoring
  { name: 'Test Kits (Alk/Ca/Mg/NO3/PO4)', category: 'Monitoring', why: 'Weekly parameter testing is mandatory — Hanna Checkers or Salifert recommended', essential: true, status: 'need' },
];

/* ── Default Maintenance Tasks ────────────────────────── */

function getDefaultTasks(tankSize: number) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
  const nextSaturday = new Date(now);
  nextSaturday.setDate(now.getDate() + ((6 + 7 - now.getDay()) % 7 || 7));

  return [
    // Daily
    { task_name: 'Top-off / ATO Check', category: 'water_management', interval_days: 1, next_due_at: tomorrow.toISOString(), notes: 'Replenish evaporated water with RODI. Never add saltwater for top-off.' },
    { task_name: 'Feed Fish', category: 'feeding', interval_days: 1, next_due_at: tomorrow.toISOString(), notes: 'Feed only what is consumed in 2-3 minutes. Overfeeding causes nutrient spikes.' },
    { task_name: 'Visual Inspection', category: 'other', interval_days: 1, next_due_at: tomorrow.toISOString(), notes: 'Check coral expansion, fish behavior, equipment function. Look for anything unusual.' },

    // Weekly
    { task_name: 'Test Water Parameters', category: 'testing', interval_days: 7, next_due_at: nextMonday.toISOString(), notes: 'Measure Alk, Ca, Mg, NO3, PO4. Log in ReefOS Logs.' },
    { task_name: `Water Change (${Math.round(tankSize * 0.15)} gal)`, category: 'water_change', interval_days: 7, next_due_at: nextSaturday.toISOString(), notes: `Change ~15% (${Math.round(tankSize * 0.15)} gallons) of tank water. Siphon detritus from substrate.` },
    { task_name: 'Clean Glass', category: 'cleaning', interval_days: 7, next_due_at: nextSaturday.toISOString(), notes: 'Use magnetic cleaner or scraper. Remove coralline and algae buildup.' },

    // Biweekly
    { task_name: 'Replace Filter Socks', category: 'filtration', interval_days: 3, next_due_at: new Date(now.getTime() + 3 * 86400000).toISOString(), notes: 'Swap filter socks to prevent nitrate factory effect. Machine wash used socks in hot water (no detergent).' },

    // Monthly  
    { task_name: 'Clean Skimmer Cup & Neck', category: 'equipment', interval_days: 14, next_due_at: new Date(now.getTime() + 14 * 86400000).toISOString(), notes: 'Clean collection cup and neck. A dirty neck reduces skimming efficiency significantly.' },
    { task_name: 'Inspect Pump & Powerheads', category: 'equipment', interval_days: 30, next_due_at: new Date(now.getTime() + 30 * 86400000).toISOString(), notes: 'Check for calcium deposits on impellers. Soak in citric acid solution if needed.' },

    // Quarterly
    { task_name: 'Replace Carbon Media', category: 'filtration', interval_days: 30, next_due_at: new Date(now.getTime() + 30 * 86400000).toISOString(), notes: 'Activated carbon loses effectiveness after 4-6 weeks. Replace in media reactor or bag.' },
    { task_name: 'Replace GFO (Phosphate Remover)', category: 'filtration', interval_days: 45, next_due_at: new Date(now.getTime() + 45 * 86400000).toISOString(), notes: 'GFO is exhausted after 4-6 weeks. Replace and rinse new media before use.' },
    { task_name: 'Calibrate Refractometer', category: 'equipment', interval_days: 90, next_due_at: new Date(now.getTime() + 90 * 86400000).toISOString(), notes: 'Use calibration fluid (not RODI). Ensure salinity reads 35 ppt accurately.' },
    { task_name: 'Deep Equipment Cleaning', category: 'maintenance', interval_days: 90, next_due_at: new Date(now.getTime() + 90 * 86400000).toISOString(), notes: 'Soak pumps in citric acid, deep clean skimmer venturi, inspect heater for salt creep.' },
  ];
}

/* ── Weight Calculator ────────────────────────────────── */

function calcWeight(gallons: number) {
  const waterLbs = gallons * 8.6; // saltwater is ~8.6 lbs/gal
  const rockLbs = gallons * 1.5;  // ~1.5 lbs rock per gallon
  const sandLbs = gallons * 1;    // ~1 lb sand per gallon
  const glassLbs = gallons * 1.5; // approximate glass weight
  const totalLbs = waterLbs + rockLbs + sandLbs + glassLbs;
  return { waterLbs: Math.round(waterLbs), rockLbs: Math.round(rockLbs), sandLbs: Math.round(sandLbs), glassLbs: Math.round(glassLbs), totalLbs: Math.round(totalLbs), totalKg: Math.round(totalLbs * 0.453) };
}

/* ── Main Component ───────────────────────────────────── */

export default function SetupWizard() {
  const { user, refreshProfile, refreshTank } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Flow: new vs existing
  const [tankStatus, setTankStatus] = useState<'new' | 'existing' | ''>('');
  const [tankAge, setTankAge] = useState(''); // months

  const STEPS = tankStatus === 'existing' ? STEPS_EXISTING : STEPS_NEW;

  // Step 1: Tank
  const [tankName, setTankName] = useState('');
  const [tankSize, setTankSize] = useState('');
  const [tankType, setTankType] = useState('mixed');
  const [sumpType, setSumpType] = useState('sump');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [tankModel, setTankModel] = useState('');

  // Step 2: Profile
  const [experience, setExperience] = useState('beginner');
  const [reefGoal, setReefGoal] = useState('mixed');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [units, setUnits] = useState('imperial');
  const [language, setLanguage] = useState('en');

  // Step 3: Equipment (new tank = checklist, existing tank = AI scan)
  const [equipment, setEquipment] = useState<EquipItem[]>(INITIAL_EQUIPMENT.map(e => ({ ...e })));
  const [expandedTooltip, setExpandedTooltip] = useState<string | null>(null);

  // Existing tank: AI scan states
  const [scanningGear, setScanningGear] = useState(false);
  const [scannedGear, setScannedGear] = useState<{ name: string; brand: string | null; category: string; confidence: number; qty: number }[]>([]);
  const [scanningLivestock, setScanningLivestock] = useState(false);
  const [scannedLivestock, setScannedLivestock] = useState<{ name: string; scientific_name: string | null; type: string; category: string; confidence: number; details: string }[]>([]);

  // Species search for manual livestock add
  const [speciesDb, setSpeciesDb] = useState<{ common_name: string; scientific_name: string; category: string; subcategory: string; difficulty: string }[]>([]);
  const [livestockSearch, setLivestockSearch] = useState('');
  const [livestockTab, setLivestockTab] = useState<'fish' | 'coral' | 'invertebrate'>('fish');
  // Gear category browser
  const [gearCategory, setGearCategory] = useState<string | null>(null);
  const [gearSearch, setGearSearch] = useState('');
  const [productsDb, setProductsDb] = useState<{ name: string; brand: string; category: string }[]>([]);
  // Livestock subcategory browser
  const [livestockSubcat, setLivestockSubcat] = useState<string | null>(null);

  // Existing tank: Current parameters
  const [scanningParams, setScanningParams] = useState(false);
  const [params, setParams] = useState<Record<string, number | null>>({
    alkalinity: null, calcium: null, magnesium: null, nitrate: null,
    phosphate: null, ph: null, ammonia: null, nitrite: null,
    salinity: null, temperature: null,
  });

  // Load species + products databases for manual selection
  useEffect(() => {
    if (tankStatus === 'existing') {
      getSpecies().then(data => setSpeciesDb((data || []) as typeof speciesDb));
      getProducts().then(data => setProductsDb((data || []).map(p => ({ name: p.name, brand: p.brand, category: p.category }))));
    }
  }, [tankStatus]);

  // Step 5: Cycle (new tank only)
  const [startCycle, setStartCycle] = useState(false);

  const gallons = parseInt(tankSize) || 0;
  const weight = calcWeight(gallons);
  const tankAgeMonths = parseInt(tankAge) || 0;

  /* ── AI Photo Helpers ───────────────────────────────── */

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max = 640; // Smaller for faster Gemini processing
          let w = img.width, h = img.height;
          if (w > max || h > max) { const r = Math.min(max / w, max / h); w *= r; h *= r; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleGearPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanningGear(true);
    try {
      const base64 = await compressImage(file);
      const res = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, context: 'equipment' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.name && data.type !== 'unknown') {
          const photoName = data.brand ? `${data.brand} ${data.name}` : data.name;
          setScannedGear(prev => {
            const existing = prev.findIndex(g => g.name === photoName);
            if (existing >= 0) { const updated = [...prev]; updated[existing] = { ...updated[existing], qty: updated[existing].qty + 1 }; return updated; }
            return [...prev, { name: photoName, brand: data.brand, category: data.category, confidence: data.confidence, qty: 1 }];
          });
          // Also mark in equipment checklist
          setEquipment(prev => prev.map(eq => {
            const cat = eq.category.toLowerCase();
            const dataCat = (data.category || '').toLowerCase();
            if (cat === dataCat || eq.name.toLowerCase().includes(dataCat)) {
              return { ...eq, status: 'have' };
            }
            return eq;
          }));
        }
      }
    } catch (err) { console.error('Gear scan failed:', err); }
    finally { setScanningGear(false); e.target.value = ''; }
  };

  const handleLivestockPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanningLivestock(true);
    try {
      const base64 = await compressImage(file);
      // Send the active tab as context so AI focuses on the right type
      const res = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, context: livestockTab }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.name) {
          // If AI returned a different type than selected tab, skip it
          // (e.g., user on "coral" tab but photo has a fish — ignore the fish)
          const validType = data.type === livestockTab;
          if (!validType && ['fish', 'coral', 'invertebrate'].includes(data.type)) {
            alert(`Detected a ${data.type} (${data.name}), but you're adding ${livestockTab}s. Switch tabs or try a closer photo.`);
            return;
          }

          // Try to match against species database for full data
          const aiName = (data.name || '').toLowerCase().trim();
          const aiSci = (data.scientific_name || '').toLowerCase().trim();
          const dbMatch = speciesDb.find(s => {
            const dbName = (s.common_name || '').toLowerCase();
            const dbSci = (s.scientific_name || '').toLowerCase();
            // Exact match first
            if (dbName === aiName || dbSci === aiSci) return true;
            // Partial match
            if (aiName.length > 3 && (dbName.includes(aiName) || aiName.includes(dbName))) return true;
            if (aiSci.length > 3 && (dbSci.includes(aiSci) || aiSci.includes(dbSci))) return true;
            return false;
          });

          setScannedLivestock(prev => [...prev, {
            name: dbMatch?.common_name || data.name,
            scientific_name: dbMatch?.scientific_name || data.scientific_name,
            type: dbMatch?.category?.toLowerCase() || data.type || livestockTab,
            category: dbMatch?.subcategory || data.category,
            confidence: data.confidence,
            details: dbMatch
              ? `${dbMatch.difficulty} difficulty. ${data.details || ''}`
              : (data.details || ''),
          }]);
        }
      }
    } catch (err) { console.error('Livestock scan failed:', err); }
    finally { setScanningLivestock(false); e.target.value = ''; }
  };

  const handleParamsPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanningParams(true);
    try {
      const base64 = await compressImage(file);
      const res = await fetch('/api/analyze-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.params) {
          setParams(prev => {
            const updated = { ...prev };
            for (const [key, val] of Object.entries(data.params)) {
              if (val !== null && val !== undefined) updated[key] = val as number;
            }
            return updated;
          });
        }
      }
    } catch (err) { console.error('Params scan failed:', err); }
    finally { setScanningParams(false); e.target.value = ''; }
  };

  const canAdvance = () => {
    if (step === 0) return tankName.trim().length > 0 && tankStatus !== '';
    return true;
  };

  const toggleEquipStatus = (idx: number) => {
    setEquipment(prev => {
      const updated = [...prev];
      const states: EquipItem['status'][] = ['have', 'need', 'skip'];
      const currentIdx = states.indexOf(updated[idx].status);
      updated[idx] = { ...updated[idx], status: states[(currentIdx + 1) % 3] };
      return updated;
    });
  };

  /* ── Save & Finish ──────────────────────────────────── */

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    setError('');

    try {
      const supabase = getSupabase();

      // 1. Update profile
      await supabase.from('reef_profiles').update({
        experience_level: experience,
        location_city: city || null,
        location_state: state || null,
        units,
        language,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);

      // 2. Create tank
      const tankInsert: Record<string, unknown> = {
        user_id: user.id,
        name: tankName || 'My Reef',
        size_gallons: gallons || null,
        tank_type: tankType,
        sump_type: sumpType,
        reef_goal: reefGoal,
        is_primary: true,
        setup_completed_at: new Date().toISOString(),
      };
      if (tankStatus === 'new') {
        tankInsert.cycle_started_at = startCycle ? new Date().toISOString() : null;
      } else {
        // Existing tank: mark as mature, store age
        tankInsert.cycle_started_at = new Date(Date.now() - (tankAgeMonths || 6) * 30 * 86400000).toISOString();
        tankInsert.cycle_completed = true;
        if (tankModel) tankInsert.model = `${selectedBrand} ${tankModel}`;
      }

      const { data: newTank, error: tankErr } = await supabase.from('reef_tanks')
        .insert(tankInsert).select().single();

      if (tankErr) { setError(`Tank: ${tankErr.message}`); setSaving(false); return; }

      // All inserts run in parallel for speed
      const promises: Promise<unknown>[] = [];

      if (tankStatus === 'existing') {
        // 3a. Save scanned gear as equipment (respecting qty for duplicates)
        for (const gear of scannedGear) {
          for (let q = 0; q < gear.qty; q++) {
            promises.push(createEquipment({
              user_id: user.id,
              tank_id: newTank?.id || null,
              name: gear.qty > 1 ? `${gear.name} #${q + 1}` : gear.name,
              category: gear.category?.toLowerCase() || 'other',
              notes: `AI-identified during setup (${Math.round(gear.confidence * 100)}% confidence)`,
            }));
          }
        }
        // Also save checklist "have" items
        const haveItems = equipment.filter(e => e.status === 'have');
        for (const item of haveItems) {
          if (!scannedGear.find(g => g.name.toLowerCase().includes(item.name.toLowerCase()))) {
            promises.push(createEquipment({ user_id: user.id, tank_id: newTank?.id || null, name: item.name, category: item.category.toLowerCase(), notes: 'Added via Setup Wizard' }));
          }
        }

        // 3b. Save scanned livestock
        for (const animal of scannedLivestock) {
          promises.push(supabase.from('reef_animals').insert({
            user_id: user.id,
            tank_id: newTank?.id || null,
            name: animal.name,
            species: animal.scientific_name,
            type: animal.type as 'fish' | 'coral' | 'invertebrate',
            subtype: animal.category,
            quantity: 1,
            condition: 'healthy',
            description: animal.details,
          }));
        }

        // 3c. Save initial water test if params exist
        const hasParams = Object.values(params).some(v => v !== null);
        if (hasParams) {
          promises.push(createWaterTest({
            user_id: user.id,
            tank_id: newTank?.id || null,
            test_date: new Date().toISOString(),
            ...params,
            notes: 'Baseline test from onboarding setup',
          }));
        }
      } else {
        // 3. New tank: Auto-add equipment that user marked as "have"
        const haveItems = equipment.filter(e => e.status === 'have');
        for (const item of haveItems) {
          promises.push(createEquipment({
            user_id: user.id,
            tank_id: newTank?.id || null,
            name: item.name,
            category: item.category.toLowerCase(),
            notes: 'Added via Setup Wizard',
          }));
        }
      }

      // 4. Auto-seed maintenance tasks
      const taskSize = gallons || 40;
      const defaultTasks = getDefaultTasks(taskSize);
      for (const task of defaultTasks) {
        promises.push(createMaintenanceTask({
          ...task,
          user_id: user.id,
          tank_id: newTank?.id || null,
        }));
      }

      // Run all inserts in parallel
      await Promise.all(promises);

      await refreshProfile();
      await refreshTank();
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Setup error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleFinish();
  };
  const back = () => { if (step > 0) setStep(step - 1); };

  // Dynamic essential: ATO is essential for nano tanks (<30 gal)
  const isNano = gallons > 0 && gallons < 30;
  const adjustedEquipment = equipment.map(e =>
    e.name === 'Auto Top-Off (ATO)' ? { ...e, essential: isNano ? true : e.essential } : e
  );

  // Equipment stats
  const haveCount = adjustedEquipment.filter(e => e.status === 'have').length;
  const needCount = adjustedEquipment.filter(e => e.status === 'need').length;
  const essentialMissing = adjustedEquipment.filter(e => e.essential && e.status !== 'have').length;

  return (
    <div className="min-h-[80vh] flex flex-col justify-between max-w-md mx-auto">
      {/* Progress Bar */}
      <div className="space-y-6">
        <div className="flex gap-1.5 mt-2">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-[#FF7F50]' : 'bg-[#1c2a41]'}`} />
          ))}
        </div>

        {/* Step Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FF7F50]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-[#FF7F50]">{STEPS[step].icon}</span>
          </div>
          <p className="text-[10px] text-[#c5c6cd]/50 uppercase tracking-wider font-bold">Step {step + 1} of {STEPS.length}</p>
          <h1 className="text-2xl font-[family-name:var(--font-headline)] font-bold text-white">{STEPS[step].title}</h1>
          <p className="text-[#c5c6cd] text-sm">{STEPS[step].subtitle}</p>
        </div>

        {/* Step Content */}
        <div className="space-y-4 mt-4">

          {/* ── STEP 1: Tank Setup ──────────────────────── */}
          {step === 0 && (
            <>
              {/* New vs Existing */}
              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-3">Is this a new or existing tank?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setTankStatus('new')}
                    className={`p-4 rounded-xl text-left transition-all ${tankStatus === 'new'
                      ? 'bg-[#4cd6fb]/15 border-2 border-[#4cd6fb] shadow-lg shadow-[#4cd6fb]/10'
                      : 'bg-[#0d1c32] border-2 border-transparent hover:border-[#1c2a41]'}`}>
                    <span className={`material-symbols-outlined text-2xl mb-2 ${tankStatus === 'new' ? 'text-[#4cd6fb]' : 'text-[#c5c6cd]'}`}>add_circle</span>
                    <p className={`font-[family-name:var(--font-headline)] text-sm font-semibold ${tankStatus === 'new' ? 'text-white' : 'text-[#c5c6cd]'}`}>New Tank</p>
                    <p className="text-[10px] text-[#8f9097] mt-0.5">Setting up from scratch</p>
                  </button>
                  <button onClick={() => setTankStatus('existing')}
                    className={`p-4 rounded-xl text-left transition-all ${tankStatus === 'existing'
                      ? 'bg-[#2ff801]/15 border-2 border-[#2ff801] shadow-lg shadow-[#2ff801]/10'
                      : 'bg-[#0d1c32] border-2 border-transparent hover:border-[#1c2a41]'}`}>
                    <span className={`material-symbols-outlined text-2xl mb-2 ${tankStatus === 'existing' ? 'text-[#2ff801]' : 'text-[#c5c6cd]'}`}>check_circle</span>
                    <p className={`font-[family-name:var(--font-headline)] text-sm font-semibold ${tankStatus === 'existing' ? 'text-white' : 'text-[#c5c6cd]'}`}>Existing Tank</p>
                    <p className="text-[10px] text-[#8f9097] mt-0.5">Already running</p>
                  </button>
                </div>
              </div>

              {/* Tank Age (existing only) */}
              {tankStatus === 'existing' && (
                <div>
                  <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">How old is your tank? (months)</label>
                  <input type="number" value={tankAge} onChange={e => setTankAge(e.target.value)}
                    className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3.5 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent transition-all text-sm"
                    placeholder="e.g., 18" />
                  {tankAgeMonths > 36 && (
                    <div className="mt-3 bg-[#F1C40F]/5 border border-[#F1C40F]/20 rounded-xl p-3 flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#F1C40F] text-lg mt-0.5">warning</span>
                      <div>
                        <p className="text-[#F1C40F] text-xs font-bold">Old Tank Syndrome (OTS) Risk</p>
                        <p className="text-[#c5c6cd] text-[11px] mt-1 leading-relaxed">Tanks over 3 years old can develop OTS — sand beds and rocks saturate with phosphates, pH drops slowly. ReefOS will monitor for these signs and alert you.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">Tank Name</label>
                <input type="text" value={tankName} onChange={e => setTankName(e.target.value)}
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3.5 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent transition-all text-sm"
                  placeholder="e.g., Living Room Reef" autoFocus />
              </div>

              {/* Commercial Tank Selector */}
              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">
                  Commercial Tank <span className="text-[#8f9097]">• Optional</span>
                </label>
                <select
                  value={selectedBrand}
                  onChange={e => { setSelectedBrand(e.target.value); setTankModel(''); }}
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3.5 px-4 text-white focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent transition-all text-sm appearance-none"
                >
                  <option value="">Custom / DIY tank</option>
                  {COMMERCIAL_TANKS.map(b => (
                    <option key={b.brand} value={b.brand}>{b.brand}</option>
                  ))}
                </select>
              </div>

              {selectedBrand && (
                <div>
                  <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">Model</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {COMMERCIAL_TANKS.find(b => b.brand === selectedBrand)?.models.map(m => (
                      <button key={m.name} onClick={() => {
                        setTankModel(m.name);
                        setTankSize(String(m.gallons));
                        if (!tankName) setTankName(`${selectedBrand} ${m.name}`);
                      }}
                        className={`p-3 rounded-xl text-left transition-all ${tankModel === m.name
                          ? 'bg-[#FF7F50]/15 border-2 border-[#FF7F50]'
                          : 'bg-[#0d1c32] border-2 border-transparent hover:border-[#1c2a41]'}`}
                      >
                        <p className={`text-sm font-semibold ${tankModel === m.name ? 'text-white' : 'text-[#c5c6cd]'}`}>{m.name}</p>
                        <p className="text-[10px] text-[#8f9097]">{m.gallons} gallons</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tankModel && (
                <div className="bg-[#2ff801]/5 border border-[#2ff801]/20 rounded-xl p-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2ff801] text-lg">check_circle</span>
                  <p className="text-[11px] text-[#c5c6cd]">Auto-filled: <strong className="text-white">{selectedBrand} {tankModel}</strong> — {tankSize} gallons</p>
                </div>
              )}

              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">
                  Tank Size (gallons){tankModel && <span className="text-[#2ff801] ml-2">✓ Auto-filled</span>}
                </label>
                <input type="number" value={tankSize} onChange={e => setTankSize(e.target.value)}
                  className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3.5 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 focus:border-transparent transition-all text-sm"
                  placeholder="e.g., 40" />
              </div>

              {/* Weight Calculator */}
              {gallons > 0 && (
                <div className="bg-[#0d1c32] rounded-xl p-4 space-y-3 border border-[#1c2a41]">
                  <p className="text-[10px] text-[#FF7F50] uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs">scale</span>
                    Estimated Total Weight
                  </p>
                  <p className="text-2xl font-[family-name:var(--font-headline)] font-extrabold text-white">
                    {weight.totalLbs} lbs <span className="text-sm text-[#8f9097]">({weight.totalKg} kg)</span>
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'Water', val: weight.waterLbs, color: '#4cd6fb' },
                      { label: 'Rock', val: weight.rockLbs, color: '#c5c6cd' },
                      { label: 'Sand', val: weight.sandLbs, color: '#F1C40F' },
                      { label: 'Glass', val: weight.glassLbs, color: '#8f9097' },
                    ].map(w => (
                      <div key={w.label}>
                        <p className="text-sm font-bold" style={{ color: w.color }}>{w.val}</p>
                        <p className="text-[9px] text-[#8f9097]">{w.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#F1C40F] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">warning</span>
                    Ensure your stand is rated for {Math.ceil(weight.totalLbs / 50) * 50}+ lbs
                  </p>
                </div>
              )}

              {/* Beginner Tip */}
              {gallons > 0 && gallons < 30 && (
                <div className="bg-[#FF7F50]/5 border border-[#FF7F50]/20 rounded-xl p-3 flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#FF7F50] text-lg mt-0.5">tips_and_updates</span>
                  <div>
                    <p className="text-[#FF7F50] text-xs font-bold">Nano Tank Advisory</p>
                    <p className="text-[#c5c6cd] text-[11px] mt-1 leading-relaxed">Tanks under 30 gallons are <strong className="text-white">harder for beginners</strong> — smaller water volume means faster parameter swings. Consider 40+ gallons for more forgiving chemistry.</p>
                  </div>
                </div>
              )}

              {/* Tank Type */}
              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-3">Tank Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {TANK_TYPES.map(t => (
                    <button key={t.key} onClick={() => setTankType(t.key)}
                      className={`p-4 rounded-xl text-left transition-all ${tankType === t.key
                        ? 'bg-[#FF7F50]/15 border-2 border-[#FF7F50] shadow-lg shadow-[#FF7F50]/10'
                        : 'bg-[#0d1c32] border-2 border-transparent hover:border-[#1c2a41]'}`}
                    >
                      <span className={`material-symbols-outlined text-xl mb-2 ${tankType === t.key ? 'text-[#FF7F50]' : 'text-[#c5c6cd]'}`}>{t.icon}</span>
                      <p className={`font-[family-name:var(--font-headline)] text-sm font-semibold ${tankType === t.key ? 'text-white' : 'text-[#c5c6cd]'}`}>{t.label}</p>
                      <p className="text-[10px] text-[#8f9097] mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sump Type */}
              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-3">Filtration Setup</label>
                <div className="space-y-2">
                  {SUMP_TYPES.map(s => (
                    <button key={s.key} onClick={() => setSumpType(s.key)}
                      className={`w-full p-4 rounded-xl flex items-center gap-4 text-left transition-all ${sumpType === s.key
                        ? 'bg-[#FF7F50]/15 border-2 border-[#FF7F50]'
                        : 'bg-[#0d1c32] border-2 border-transparent hover:border-[#1c2a41]'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sumpType === s.key ? 'bg-[#FF7F50]/20' : 'bg-[#1c2a41]'}`}>
                        <span className={`material-symbols-outlined ${sumpType === s.key ? 'text-[#FF7F50]' : 'text-[#c5c6cd]'}`}>{s.icon}</span>
                      </div>
                      <div>
                        <p className={`font-[family-name:var(--font-headline)] font-semibold text-sm ${sumpType === s.key ? 'text-white' : 'text-[#c5c6cd]'}`}>{s.label}</p>
                        <p className="text-[10px] text-[#8f9097] mt-0.5">{s.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── STEP 2: Experience & Goals ──────────────── */}
          {step === 1 && (
            <>
              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-3">Experience Level</label>
                <div className="space-y-2">
                  {EXPERIENCE_LEVELS.map(lvl => (
                    <button key={lvl.key} onClick={() => setExperience(lvl.key)}
                      className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${experience === lvl.key
                        ? 'bg-[#FF7F50]/15 border-2 border-[#FF7F50]' : 'bg-[#0d1c32] border-2 border-transparent hover:border-[#1c2a41]'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${experience === lvl.key ? 'bg-[#FF7F50]/20' : 'bg-[#1c2a41]'}`}>
                        <span className={`material-symbols-outlined ${experience === lvl.key ? 'text-[#FF7F50]' : 'text-[#c5c6cd]'}`}>{lvl.icon}</span>
                      </div>
                      <div className="text-left">
                        <p className={`font-[family-name:var(--font-headline)] font-semibold ${experience === lvl.key ? 'text-white' : 'text-[#c5c6cd]'}`}>{lvl.label}</p>
                        <p className="text-xs text-[#8f9097]">{lvl.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-3">
                  Reef Goal <span className="text-[#8f9097]">• What do you want to build?</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {REEF_GOALS.map(g => (
                    <button key={g.key} onClick={() => setReefGoal(g.key)}
                      className={`p-4 rounded-xl text-left transition-all ${reefGoal === g.key
                        ? 'border-2 shadow-lg' : 'bg-[#0d1c32] border-2 border-transparent hover:border-[#1c2a41]'}`}
                      style={reefGoal === g.key ? { borderColor: g.color, backgroundColor: `${g.color}15`, boxShadow: `0 4px 16px ${g.color}20` } : {}}
                    >
                      <span className="material-symbols-outlined text-xl mb-2" style={{ color: reefGoal === g.key ? g.color : '#c5c6cd' }}>{g.icon}</span>
                      <p className={`font-[family-name:var(--font-headline)] text-sm font-semibold ${reefGoal === g.key ? 'text-white' : 'text-[#c5c6cd]'}`}>{g.label}</p>
                      <p className="text-[10px] text-[#8f9097] mt-0.5">{g.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location (compact) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">City</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)}
                    className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3 px-3 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 text-sm" placeholder="Miami" />
                </div>
                <div>
                  <label className="font-[family-name:var(--font-headline)] text-[10px] tracking-[0.15em] text-[#c5c6cd] uppercase font-medium block mb-2">State</label>
                  <input type="text" value={state} onChange={e => setState(e.target.value)}
                    className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-3 px-3 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 text-sm" placeholder="FL" />
                </div>
              </div>

              {/* Units & Language */}
              <div className="flex gap-3">
                {[{ key: 'imperial', label: '🇺🇸 Imperial' }, { key: 'metric', label: '🌍 Metric' }].map(u => (
                  <button key={u.key} onClick={() => setUnits(u.key)}
                    className={`flex-1 p-3 rounded-xl text-center text-sm font-[family-name:var(--font-headline)] font-semibold transition-all ${units === u.key
                      ? 'bg-[#FF7F50]/15 border-2 border-[#FF7F50] text-white' : 'bg-[#0d1c32] border-2 border-transparent text-[#c5c6cd]'}`}
                  >{u.label}</button>
                ))}
              </div>
              <div className="flex gap-3">
                {[{ key: 'en', label: '🇺🇸 English' }, { key: 'es', label: '🇪🇸 Español' }, { key: 'pt', label: '🇧🇷 Português' }].map(l => (
                  <button key={l.key} onClick={() => setLanguage(l.key)}
                    className={`flex-1 p-3 rounded-xl text-center text-xs font-[family-name:var(--font-headline)] font-semibold transition-all ${language === l.key
                      ? 'bg-[#FF7F50]/15 border-2 border-[#FF7F50] text-white' : 'bg-[#0d1c32] border-2 border-transparent text-[#c5c6cd]'}`}
                  >{l.label}</button>
                ))}
              </div>
            </>
          )}

          {/* ── STEP 3: Equipment Checklist (NEW) / Scan Gear (EXISTING) ── */}
          {step === 2 && tankStatus === 'existing' && (
            <>
              {/* AI Gear Scanner */}
              <div className="bg-[#0d1c32] rounded-2xl p-5 border border-[#1c2a41] text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#4cd6fb]/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl text-[#4cd6fb]">photo_camera</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Snap Your Equipment</h3>
                <p className="text-[#c5c6cd] text-sm mb-4">Take photos of your skimmer, lights, pumps, ATO, controller — ReefOS AI will identify each one.</p>
                <label className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-sm cursor-pointer transition-all ${scanningGear ? 'bg-[#1c2a41] text-[#8f9097]' : 'bg-[#FF7F50] text-white hover:scale-[1.03] active:scale-95 shadow-lg shadow-[#FF7F50]/20'}`}>
                  <span className="material-symbols-outlined text-lg">{scanningGear ? 'hourglass_top' : 'add_a_photo'}</span>
                  {scanningGear ? 'Identifying...' : 'Take Photo'}
                  <input type="file" accept="image/*" capture="environment" onChange={handleGearPhoto} className="hidden" disabled={scanningGear} />
                </label>
              </div>

              {/* Scanned Results */}
              {scannedGear.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-[#2ff801]/70 uppercase tracking-widest mb-2">Identified Equipment ({scannedGear.reduce((sum, g) => sum + g.qty, 0)})</p>
                  <div className="space-y-2">
                    {scannedGear.map((g, i) => (
                      <div key={i} className="bg-[#2ff801]/10 border border-[#2ff801]/20 rounded-xl p-3 flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#2ff801]">check_circle</span>
                        <div className="flex-1">
                          <p className="text-white text-sm font-semibold">{g.name}{g.qty > 1 ? ` ×${g.qty}` : ''}</p>
                          <p className="text-[10px] text-[#8f9097]">{g.category} · {Math.round(g.confidence * 100)}% confident</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setScannedGear(prev => {
                            const updated = [...prev];
                            if (updated[i].qty > 1) { updated[i] = { ...updated[i], qty: updated[i].qty - 1 }; return updated; }
                            return prev.filter((_, idx) => idx !== i);
                          })} className="w-6 h-6 rounded-full bg-[#0d1c32] flex items-center justify-center text-[#8f9097] hover:text-[#ff6b6b] transition-colors">
                            <span className="material-symbols-outlined text-xs">{g.qty > 1 ? 'remove' : 'close'}</span>
                          </button>
                          <span className="text-white text-xs font-bold w-5 text-center">{g.qty}</span>
                          <button onClick={() => setScannedGear(prev => {
                            const updated = [...prev];
                            updated[i] = { ...updated[i], qty: updated[i].qty + 1 };
                            return updated;
                          })} className="w-6 h-6 rounded-full bg-[#0d1c32] flex items-center justify-center text-[#2ff801] hover:text-[#4cd6fb] transition-colors">
                            <span className="material-symbols-outlined text-xs">add</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OR divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#1c2a41]" />
                <span className="text-[10px] font-bold text-[#8f9097] uppercase tracking-wider">or choose by category</span>
                <div className="flex-1 h-px bg-[#1c2a41]" />
              </div>

              {/* Category Grid */}
              {!gearCategory ? (
                <div className="grid grid-cols-3 gap-2">
                  {EQUIPMENT_CATALOG.map(cat => {
                    const count = scannedGear.filter(g => g.category.toLowerCase() === cat.category.toLowerCase()).length;
                    return (
                      <button key={cat.category} onClick={() => setGearCategory(cat.category)}
                        className="bg-[#0d1c32] border border-[#1c2a41] hover:border-[#4cd6fb]/40 rounded-xl p-3 text-center transition-all active:scale-[0.96]">
                        <span className="material-symbols-outlined text-xl text-[#4cd6fb]">{cat.icon}</span>
                        <p className="text-white text-xs font-semibold mt-1.5">{cat.category}</p>
                        {count > 0 && <p className="text-[9px] text-[#2ff801] font-bold mt-0.5">{count} added</p>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div>
                  {/* Back + Category Header */}
                  <button onClick={() => { setGearCategory(null); setGearSearch(''); }}
                    className="flex items-center gap-1 text-[#4cd6fb] text-sm mb-3 hover:underline">
                    <span className="material-symbols-outlined text-base">arrow_back</span> All Categories
                  </button>
                  <p className="text-[10px] font-bold text-[#4cd6fb]/70 uppercase tracking-widest mb-2">
                    {gearCategory} — {EQUIPMENT_CATALOG.find(c => c.category === gearCategory)?.items.length} models
                  </p>

                  {/* Search within category */}
                  <input
                    type="text" value={gearSearch} onChange={e => setGearSearch(e.target.value)}
                    className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-2.5 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#4cd6fb]/50 text-sm mb-2"
                    placeholder={`Filter ${gearCategory.toLowerCase()}...`}
                  />

                  {/* Model List */}
                  <div className="max-h-60 overflow-y-auto space-y-1.5">
                    {(EQUIPMENT_CATALOG.find(c => c.category === gearCategory)?.items || [])
                      .filter(item => !gearSearch || `${item.brand} ${item.name}`.toLowerCase().includes(gearSearch.toLowerCase()))
                      .map(item => {
                        const fullName = `${item.brand} ${item.name}`;
                        const existingIdx = scannedGear.findIndex(g => g.name === fullName);
                        const existingQty = existingIdx >= 0 ? scannedGear[existingIdx].qty : 0;
                        return (
                          <button key={fullName}
                            onClick={() => {
                              setScannedGear(prev => {
                                const idx = prev.findIndex(g => g.name === fullName);
                                if (idx >= 0) { const updated = [...prev]; updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 }; return updated; }
                                return [...prev, { name: fullName, brand: item.brand, category: gearCategory!, confidence: 1, qty: 1 }];
                              });
                            }}
                            className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition-all ${existingQty > 0
                              ? 'bg-[#2ff801]/10 border border-[#2ff801]/20'
                              : 'bg-[#0d1c32] border border-transparent hover:border-[#1c2a41] active:scale-[0.98]'}`}
                          >
                            <span className={`material-symbols-outlined text-sm ${existingQty > 0 ? 'text-[#2ff801]' : 'text-[#FF7F50]'}`}>
                              {existingQty > 0 ? 'check_circle' : 'add_circle'}
                            </span>
                            <div>
                              <p className={`text-sm font-medium ${existingQty > 0 ? 'text-[#2ff801]' : 'text-white'}`}>{item.name}</p>
                              <p className="text-[10px] text-[#8f9097]">{item.brand}{existingQty > 0 ? ` · ×${existingQty}` : ''}</p>
                            </div>
                          </button>
                        );
                      })}
                  </div>

                  {/* Custom add for this category */}
                  {gearSearch.length >= 2 && (
                    <button
                      onClick={() => {
                        setScannedGear(prev => [...prev, { name: gearSearch.trim(), brand: null, category: gearCategory!, confidence: 1, qty: 1 }]);
                        setGearSearch('');
                      }}
                      className="w-full mt-2 p-3 rounded-xl flex items-center gap-3 text-left bg-[#FF7F50]/10 border border-[#FF7F50]/20 hover:border-[#FF7F50]/40 active:scale-[0.98] transition-all"
                    >
                      <span className="material-symbols-outlined text-sm text-[#FF7F50]">add_circle</span>
                      <div>
                        <p className="text-sm font-medium text-[#FF7F50]">Add &quot;{gearSearch.trim()}&quot;</p>
                        <p className="text-[10px] text-[#8f9097]">Custom {gearCategory?.toLowerCase()}</p>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {scannedGear.length === 0 && !gearCategory && (
                <p className="text-center text-[#8f9097] text-xs">Take a photo or pick a category to add your equipment.</p>
              )}
            </>
          )}

          {step === 2 && tankStatus !== 'existing' && (
            <>
              {/* Stats Bar */}
              <div className="flex gap-3">
                <div className="flex-1 bg-[#2ff801]/10 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-[#2ff801]">{haveCount}</p>
                  <p className="text-[9px] text-[#2ff801]/70 uppercase tracking-wider font-bold">Have</p>
                </div>
                <div className="flex-1 bg-[#FF7F50]/10 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-[#FF7F50]">{needCount}</p>
                  <p className="text-[9px] text-[#FF7F50]/70 uppercase tracking-wider font-bold">Need</p>
                </div>
                <div className="flex-1 bg-[#1c2a41] rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-[#8f9097]">{equipment.length - haveCount - needCount}</p>
                  <p className="text-[9px] text-[#8f9097]/70 uppercase tracking-wider font-bold">Skip</p>
                </div>
              </div>

              {essentialMissing > 0 && (
                <div className="bg-[#FF7F50]/5 border border-[#FF7F50]/20 rounded-xl p-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF7F50] text-sm">info</span>
                  <p className="text-[11px] text-[#c5c6cd]"><strong className="text-[#FF7F50]">{essentialMissing} essential</strong> items still needed. Tap items to toggle status.</p>
                </div>
              )}

              {isNano && (
                <div className="bg-[#F1C40F]/5 border border-[#F1C40F]/20 rounded-xl p-3 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#F1C40F] text-lg mt-0.5">warning</span>
                  <div>
                    <p className="text-[#F1C40F] text-xs font-bold">Nano Tank: ATO is Essential</p>
                    <p className="text-[#c5c6cd] text-[11px] mt-1 leading-relaxed">In tanks under 30 gallons, evaporation causes dangerous salinity swings within hours. An Auto Top-Off system is <strong className="text-white">mandatory</strong> to keep your livestock alive.</p>
                  </div>
                </div>
              )}

              {/* Equipment List */}
              {['Core', 'Filtration', 'Circulation', 'Lighting', 'Water', 'Heating', 'Water Management', 'Monitoring'].map(cat => {
                const items = adjustedEquipment.filter(e => e.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest mb-2">{cat}</p>
                    <div className="space-y-1.5">
                      {items.map((item, _) => {
                        const globalIdx = equipment.indexOf(item);
                        const statusConfig = {
                          have: { bg: 'bg-[#2ff801]/10', border: 'border-[#2ff801]/30', icon: 'check_circle', iconColor: 'text-[#2ff801]' },
                          need: { bg: 'bg-[#FF7F50]/10', border: 'border-[#FF7F50]/30', icon: 'shopping_cart', iconColor: 'text-[#FF7F50]' },
                          skip: { bg: 'bg-[#1c2a41]', border: 'border-transparent', icon: 'do_not_disturb_on', iconColor: 'text-[#8f9097]' },
                        }[item.status];
                        return (
                          <div key={item.name}>
                            <button
                              onClick={() => toggleEquipStatus(globalIdx)}
                              className={`w-full ${statusConfig.bg} border ${statusConfig.border} rounded-xl p-3 flex items-center gap-3 text-left transition-all active:scale-[0.98]`}
                            >
                              <span className={`material-symbols-outlined ${statusConfig.iconColor}`}>{statusConfig.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${item.status === 'skip' ? 'text-[#8f9097] line-through' : 'text-white'}`}>
                                  {item.name}
                                  {item.essential && <span className="text-[#FF7F50] text-[8px] ml-1">●</span>}
                                </p>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setExpandedTooltip(expandedTooltip === item.name ? null : item.name); }}
                                className="w-6 h-6 rounded-full bg-[#1c2a41] flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[#8f9097] text-xs">help</span>
                              </button>
                            </button>
                            {expandedTooltip === item.name && (
                              <div className="mx-2 mt-1 mb-2 p-3 bg-[#1c2a41] rounded-lg border border-[#27354c]">
                                <p className="text-[11px] text-[#c5c6cd] leading-relaxed">{item.why}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ── STEP 4 (EXISTING): Scan Livestock ─────── */}
          {step === 3 && tankStatus === 'existing' && (
            <>
              <div className="bg-[#0d1c32] rounded-2xl p-5 border border-[#1c2a41] text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FF7F50]/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl text-[#FF7F50]">pets</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Snap Your Fish & Corals</h3>
                <p className="text-[#c5c6cd] text-sm mb-4">Take photos of your livestock — ReefOS AI will identify species, check compatibility, and build your reef inventory.</p>
                <label className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-sm cursor-pointer transition-all ${scanningLivestock ? 'bg-[#1c2a41] text-[#8f9097]' : 'bg-[#FF7F50] text-white hover:scale-[1.03] active:scale-95 shadow-lg shadow-[#FF7F50]/20'}`}>
                  <span className="material-symbols-outlined text-lg">{scanningLivestock ? 'hourglass_top' : 'add_a_photo'}</span>
                  {scanningLivestock ? 'Identifying...' : 'Take Photo'}
                  <input type="file" accept="image/*" capture="environment" onChange={handleLivestockPhoto} className="hidden" disabled={scanningLivestock} />
                </label>
              </div>

              {/* Scanned Livestock */}
              {scannedLivestock.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-[#FF7F50]/70 uppercase tracking-widest mb-2">Identified Livestock ({scannedLivestock.length})</p>
                  <div className="space-y-2">
                    {scannedLivestock.map((a, i) => (
                      <div key={i} className={`border rounded-xl p-3 flex items-center gap-3 ${
                        a.type === 'fish' ? 'bg-[#4cd6fb]/10 border-[#4cd6fb]/20' :
                        a.type === 'coral' ? 'bg-[#FF7F50]/10 border-[#FF7F50]/20' :
                        'bg-[#2ff801]/10 border-[#2ff801]/20'
                      }`}>
                        <span className="material-symbols-outlined text-white">
                          {a.type === 'fish' ? 'set_meal' : a.type === 'coral' ? 'nature' : 'bug_report'}
                        </span>
                        <div className="flex-1">
                          <p className="text-white text-sm font-semibold">{a.name}</p>
                          <p className="text-[10px] text-[#8f9097]">
                            {a.scientific_name && <span className="italic">{a.scientific_name} · </span>}
                            {a.type} · {a.category} · {Math.round(a.confidence * 100)}%
                          </p>
                          {a.details && <p className="text-[10px] text-[#c5c6cd] mt-1">{a.details}</p>}
                        </div>
                        <button onClick={() => setScannedLivestock(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-[#8f9097] hover:text-[#ff6b6b]">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* OR divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#1c2a41]" />
                <span className="text-[10px] font-bold text-[#8f9097] uppercase tracking-wider">or choose from list</span>
                <div className="flex-1 h-px bg-[#1c2a41]" />
              </div>

              {/* Livestock Type Tabs */}
              <div className="flex gap-2">
                {(['fish', 'coral', 'invertebrate'] as const).map(t => (
                  <button key={t} onClick={() => { setLivestockTab(t); setLivestockSubcat(null); setLivestockSearch(''); }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${livestockTab === t
                      ? 'bg-[#FF7F50]/15 border-2 border-[#FF7F50] text-white'
                      : 'bg-[#0d1c32] border-2 border-transparent text-[#8f9097]'}`}
                  >
                    {t === 'fish' ? '🐠 Fish' : t === 'coral' ? '🪸 Corals' : '🦐 Inverts'}
                  </button>
                ))}
              </div>

              {/* Subcategory Pills or Species List */}
              <div>
                {!livestockSubcat ? (
                  <>
                    {/* Show subcategory pills for the selected tab */}
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(speciesDb.filter(s => s.category?.toLowerCase() === livestockTab).map(s => s.subcategory))].filter(Boolean).sort().map(sub => {
                        const count = scannedLivestock.filter(a => a.category === sub).length;
                        return (
                          <button key={sub} onClick={() => setLivestockSubcat(sub)}
                            className="bg-[#0d1c32] border border-[#1c2a41] hover:border-[#FF7F50]/40 rounded-xl px-4 py-2.5 text-center transition-all active:scale-[0.96]">
                            <p className="text-white text-xs font-semibold">{sub}</p>
                            {count > 0 && <p className="text-[9px] text-[#2ff801] font-bold">{count} added</p>}
                          </button>
                        );
                      })}
                    </div>
                    {scannedLivestock.length === 0 && (
                      <p className="text-center text-[#8f9097] text-xs mt-3">Pick a category above or take a photo to add your livestock.</p>
                    )}
                  </>
                ) : (
                  <>
                    {/* Back + Subcategory Header */}
                    <button onClick={() => { setLivestockSubcat(null); setLivestockSearch(''); }}
                      className="flex items-center gap-1 text-[#FF7F50] text-sm mb-3 hover:underline">
                      <span className="material-symbols-outlined text-base">arrow_back</span> All {livestockTab === 'fish' ? 'Fish' : livestockTab === 'coral' ? 'Corals' : 'Invertebrates'}
                    </button>

                    {/* Filter within subcategory */}
                    {speciesDb.filter(s => s.category?.toLowerCase() === livestockTab && s.subcategory === livestockSubcat).length > 8 && (
                      <input
                        type="text" value={livestockSearch} onChange={e => setLivestockSearch(e.target.value)}
                        className="w-full bg-[#010e24] border border-[#1c2a41] rounded-xl py-2.5 px-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#FF7F50]/50 text-sm mb-2"
                        placeholder={`Filter ${livestockSubcat?.toLowerCase()}...`}
                      />
                    )}

                    {/* Species List */}
                    <div className="max-h-60 overflow-y-auto space-y-1.5">
                      {speciesDb
                        .filter(s => s.category?.toLowerCase() === livestockTab && s.subcategory === livestockSubcat)
                        .filter(s => !livestockSearch || s.common_name?.toLowerCase().includes(livestockSearch.toLowerCase()) || s.scientific_name?.toLowerCase().includes(livestockSearch.toLowerCase()))
                        .map(species => {
                          const alreadyAdded = scannedLivestock.some(a => a.name === species.common_name);
                          return (
                            <button key={species.common_name} disabled={alreadyAdded}
                              onClick={() => {
                                setScannedLivestock(prev => [...prev, {
                                  name: species.common_name,
                                  scientific_name: species.scientific_name,
                                  type: livestockTab,
                                  category: species.subcategory || livestockTab,
                                  confidence: 1,
                                  details: species.difficulty ? `${species.difficulty} difficulty` : '',
                                }]);
                              }}
                              className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition-all ${alreadyAdded
                                ? 'bg-[#2ff801]/10 border border-[#2ff801]/20'
                                : 'bg-[#0d1c32] border border-transparent hover:border-[#1c2a41] active:scale-[0.98]'}`}
                            >
                              <span className={`material-symbols-outlined text-sm ${alreadyAdded ? 'text-[#2ff801]' : 'text-[#FF7F50]'}`}>
                                {alreadyAdded ? 'check_circle' : 'add_circle'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${alreadyAdded ? 'text-[#2ff801]' : 'text-white'}`}>{species.common_name}</p>
                                <p className="text-[10px] text-[#8f9097] truncate">
                                  <span className="italic">{species.scientific_name}</span>
                                  {species.difficulty && ` · ${species.difficulty}`}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* ── STEP 5 (EXISTING): Current Parameters ───── */}
          {step === 4 && tankStatus === 'existing' && (
            <>
              <div className="bg-[#0d1c32] rounded-2xl p-5 border border-[#1c2a41] text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#2ff801]/10 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl text-[#2ff801]">science</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Snap Your Test Results</h3>
                <p className="text-[#c5c6cd] text-sm mb-4">Photo your Hanna Checker, API kit, or any test results — AI reads the values automatically.</p>
                <label className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-sm cursor-pointer transition-all ${scanningParams ? 'bg-[#1c2a41] text-[#8f9097]' : 'bg-[#2ff801] text-[#010e24] hover:scale-[1.03] active:scale-95 shadow-lg shadow-[#2ff801]/20'}`}>
                  <span className="material-symbols-outlined text-lg">{scanningParams ? 'hourglass_top' : 'add_a_photo'}</span>
                  {scanningParams ? 'Reading...' : 'Scan Test Kit'}
                  <input type="file" accept="image/*" capture="environment" onChange={handleParamsPhoto} className="hidden" disabled={scanningParams} />
                </label>
              </div>

              {/* Parameter Grid — manual or AI-filled */}
              <div>
                <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest mb-3">
                  Parameters {Object.values(params).some(v => v !== null) && <span className="text-[#2ff801]">· AI-filled</span>}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'alkalinity', label: 'Alkalinity', unit: 'dKH', color: '#4cd6fb' },
                    { key: 'calcium', label: 'Calcium', unit: 'ppm', color: '#c5c6cd' },
                    { key: 'magnesium', label: 'Magnesium', unit: 'ppm', color: '#c5a3ff' },
                    { key: 'nitrate', label: 'Nitrate', unit: 'ppm', color: '#F1C40F' },
                    { key: 'phosphate', label: 'Phosphate', unit: 'ppm', color: '#FF7F50' },
                    { key: 'ph', label: 'pH', unit: '', color: '#2ff801' },
                    { key: 'salinity', label: 'Salinity', unit: 'ppt', color: '#4cd6fb' },
                    { key: 'temperature', label: 'Temperature', unit: '°F', color: '#ff6b6b' },
                  ].map(p => (
                    <div key={p.key} className="bg-[#0d1c32] rounded-xl p-3 border border-[#1c2a41]">
                      <label className="text-[10px] uppercase tracking-wider font-bold block mb-1" style={{ color: p.color }}>{p.label}</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="any"
                          value={params[p.key] ?? ''}
                          onChange={e => setParams(prev => ({ ...prev, [p.key]: e.target.value ? parseFloat(e.target.value) : null }))}
                          className="w-full bg-[#010e24] border border-[#1c2a41] rounded-lg py-2 px-2 text-white text-sm focus:ring-1 focus:ring-[#FF7F50]/50"
                          placeholder="—"
                        />
                        {p.unit && <span className="text-[10px] text-[#8f9097] shrink-0">{p.unit}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick warnings based on params */}
              {params.ammonia != null && params.ammonia > 0 && (
                <div className="bg-[#93000a]/10 border border-[#ffb4ab]/20 rounded-xl p-3 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#ffb4ab] text-lg">dangerous</span>
                  <p className="text-[11px] text-[#ffb4ab] leading-relaxed"><strong>Ammonia detected ({params.ammonia} ppm).</strong> Check for dead livestock, uneaten food, or failing filtration. Immediate water change recommended.</p>
                </div>
              )}
              {params.alkalinity != null && params.alkalinity > 12 && (
                <div className="bg-[#F1C40F]/5 border border-[#F1C40F]/20 rounded-xl p-3 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#F1C40F] text-sm">warning</span>
                  <p className="text-[11px] text-[#c5c6cd]"><strong className="text-[#F1C40F]">Alkalinity high ({params.alkalinity} dKH).</strong> Target 7.5-9.0 dKH for most mixed reefs. ReefOS will guide you to lower it safely.</p>
                </div>
              )}

              <p className="text-center text-[#8f9097] text-xs">You can also enter values manually or skip — log tests anytime from the Logs page.</p>
            </>
          )}

          {/* ── STEP 4 (NEW): Water Preparation ────────── */}
          {step === 3 && tankStatus !== 'existing' && (
            <>
              <div className="bg-[#0d1c32] rounded-2xl p-5 space-y-5 border border-[#1c2a41]">
                {[
                  { num: 1, icon: 'water_drop', title: 'Fill with RO/DI Water', desc: 'Fill the tank with purified freshwater ONLY. TDS meter should read 0. Never use tap water — it contains phosphates, silicates, chlorine, and heavy metals.', color: '#4cd6fb' },
                  { num: 2, icon: 'autorenew', title: 'Aerate for 24 Hours BEFORE Adding Salt', desc: 'Run a powerhead and heater (set to 77°F) in the freshwater for 24 hours. This oxygenates the water, stabilizes pH, and releases trapped gases. Adding salt to unaerated RO/DI can cause elements to precipitate due to pH shock.', color: '#F1C40F' },
                  { num: 3, icon: 'science', title: 'THEN Dissolve Salt Slowly', desc: `For ${gallons || 40} gallons: approximately ${Math.round((gallons || 40) * 0.5)} cups of salt mix. Add salt gradually while the pump circulates. Target: 35 ppt (1.026 SG). Verify with refractometer as you go. Let mix for another 24 hours.`, color: '#FF7F50' },
                  { num: 4, icon: 'landscape', title: 'Aquascape: Rock FIRST, Sand LATER', desc: 'Place live rock directly on the glass bottom to create caves and overhangs. Do NOT put sand first — fish dig and can topple rocks. Pro tip: add sand after 4-6 weeks to avoid trapping detritus during the cycling phase.', color: '#c5a3ff' },
                  { num: 5, icon: 'straighten', title: 'Verify Parameters & Equipment', desc: 'Measure salinity (1.025-1.026), temperature (76-78°F), and pH (8.0-8.4). Turn on ALL equipment (skimmer, return pump, wavemakers) to verify flow and check for leaks. Everything must be stable before starting the nitrogen cycle.', color: '#2ff801' },
                ].map(s => (
                  <div key={s.num} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}15` }}>
                      <span className="material-symbols-outlined text-lg" style={{ color: s.color }}>{s.icon}</span>
                    </div>
                    <div>
                      <p className="text-white font-[family-name:var(--font-headline)] font-bold text-sm flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${s.color}20`, color: s.color }}>Step {s.num}</span>
                        {s.title}
                      </p>
                      <p className="text-[#c5c6cd] text-xs mt-1 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Reference */}
              <div className="bg-[#4cd6fb]/5 border border-[#4cd6fb]/20 rounded-xl p-4 space-y-2">
                <p className="text-[10px] text-[#4cd6fb] uppercase tracking-widest font-bold">Quick Reference</p>
                {[
                  ['Salt per gallon', '~½ cup (varies by brand)'],
                  ['Target salinity', '1.025-1.026 SG / 35 ppt'],
                  ['Water temperature', '76-78°F (24-26°C)'],
                  ['Mixing time', 'Minimum 24 hours'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-[#c5c6cd]">{label}</span>
                    <span className="text-white font-semibold">{val}</span>
                  </div>
                ))}
              </div>

              <div className="bg-[#93000a]/10 border border-[#ffb4ab]/20 rounded-xl p-3 flex items-start gap-2">
                <span className="material-symbols-outlined text-[#ffb4ab] text-lg">warning</span>
                <p className="text-[11px] text-[#ffb4ab] leading-relaxed"><strong>Never use tap water.</strong> Tap water contains phosphates, silicates, chlorine, and heavy metals that will cause algae blooms and kill invertebrates.</p>
              </div>
            </>
          )}

          {/* ── STEP 5 (NEW): Cycle Readiness ──────────── */}
          {step === 4 && tankStatus !== 'existing' && (
            <>
              <div className="bg-[#0d1c32] rounded-2xl p-5 border border-[#1c2a41]">
                <p className="text-[10px] text-[#4cd6fb] uppercase tracking-widest font-bold mb-4">The Nitrogen Cycle</p>
                {/* Visual Timeline */}
                <div className="space-y-4">
                  {[
                    { week: 'Week 1-2', title: 'Ammonia Spike', desc: 'Bacteria begin colonizing rock. NH₃ rises — this is 100% NORMAL. Do NOT panic and do NOT add fish. The spike is food for beneficial bacteria.', color: '#ffb4ab', icon: 'trending_up' },
                    { week: 'Week 2-3', title: 'Nitrite Spike', desc: 'Nitrosomonas bacteria convert NH₃ → NO₂. Nitrite peaks then slowly falls. Still toxic — patience is key.', color: '#F1C40F', icon: 'swap_horiz' },
                    { week: 'Week 3-5', title: 'Nitrate Appears', desc: 'Nitrospira bacteria convert NO₂ → NO₃. Nitrate rises while NH₃ and NO₂ drop to zero. You\'re almost there!', color: '#FF7F50', icon: 'trending_down' },
                    { week: 'Week 5-6', title: 'Stabilization', desc: 'Temporary NO₃ spike (20-40 ppm) is expected during weeks 5-6. This is normal maturation. A 25% water change before stocking will bring it down.', color: '#c5a3ff', icon: 'timeline' },
                    { week: 'Week 6+', title: 'Safe to Stock!', desc: 'NH₃ = 0, NO₂ = 0 across 2-3 consecutive tests. Cycle is complete! Do a water change and start with your Cleanup Crew.', color: '#2ff801', icon: 'check_circle' },
                  ].map((phase, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${phase.color}15` }}>
                          <span className="material-symbols-outlined text-lg" style={{ color: phase.color }}>{phase.icon}</span>
                        </div>
                        {i < 3 && <div className="w-0.5 h-6 bg-[#1c2a41] mt-1" />}
                      </div>
                      <div className="pb-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: phase.color }}>{phase.week}</p>
                        <p className="text-white font-[family-name:var(--font-headline)] font-bold text-sm">{phase.title}</p>
                        <p className="text-[#c5c6cd] text-xs mt-0.5 leading-relaxed">{phase.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bacterial Starters */}
              <div className="bg-[#2ff801]/5 border border-[#2ff801]/20 rounded-xl p-4">
                <p className="text-[10px] text-[#2ff801] uppercase tracking-widest font-bold mb-2">
                  <span className="material-symbols-outlined text-xs align-middle mr-1">biotech</span>
                  Speed Up Your Cycle
                </p>
                <p className="text-xs text-[#c5c6cd] leading-relaxed mb-2">Add bottled bacteria on Day 1 to accelerate the cycle from 6 weeks to 2-3 weeks:</p>
                <div className="space-y-1.5">
                  {['Fritz TurboStart 900', 'Dr. Tim\'s One and Only', 'MicroBacter7 (Brightwell)'].map(p => (
                    <div key={p} className="flex items-center gap-2 text-xs text-white">
                      <span className="material-symbols-outlined text-[#2ff801] text-sm">check</span> {p}
                    </div>
                  ))}
                </div>
              </div>

              {/* Lights OFF Warning */}
              <div className="bg-[#93000a]/10 border-2 border-[#ffb4ab]/30 rounded-xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ffb4ab]/15 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#ffb4ab] text-xl">lightbulb</span>
                </div>
                <div>
                  <p className="text-[#ffb4ab] font-bold text-sm">Keep Your Lights OFF During Cycling</p>
                  <p className="text-[#c5c6cd] text-xs mt-1 leading-relaxed">During the first 4-6 weeks, lights do <strong className="text-white">nothing</strong> for beneficial bacteria — but they DO trigger explosive algae blooms (green hair algae, cyanobacteria, diatoms). Keep the tank dark until ammonia and nitrite read zero. Your patience here prevents the #1 beginner frustration.</p>
                </div>
              </div>

              {/* Start Cycle Toggle */}
              <button
                onClick={() => setStartCycle(!startCycle)}
                className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${startCycle
                  ? 'bg-[#2ff801]/15 border-2 border-[#2ff801]'
                  : 'bg-[#0d1c32] border-2 border-[#1c2a41] hover:border-[#27354c]'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${startCycle ? 'bg-[#2ff801]/20' : 'bg-[#1c2a41]'}`}>
                  <span className={`material-symbols-outlined ${startCycle ? 'text-[#2ff801]' : 'text-[#8f9097]'}`}>
                    {startCycle ? 'check_circle' : 'play_circle'}
                  </span>
                </div>
                <div className="text-left flex-1">
                  <p className={`font-[family-name:var(--font-headline)] font-bold ${startCycle ? 'text-[#2ff801]' : 'text-white'}`}>
                    {startCycle ? 'Cycle Tracking Active!' : 'Start My Cycle Now'}
                  </p>
                  <p className="text-[10px] text-[#8f9097]">{startCycle ? 'ReefOS will track your ammonia, nitrite & nitrate' : 'Tap to begin tracking your nitrogen cycle'}</p>
                </div>
              </button>
            </>
          )}

          {/* ── STEP 6: Launch ──────────────────────────── */}
          {step === 5 && (
            <>
              {/* Celebration */}
              <div className="text-center py-4">
                <div className="text-6xl mb-4">🪸</div>
                <h2 className="text-xl font-[family-name:var(--font-headline)] font-extrabold text-white">Your reef journey begins!</h2>
                <p className="text-[#c5c6cd] text-sm mt-2">ReefOS will monitor, guide, and protect your ecosystem.</p>
              </div>

              {/* Setup Summary */}
              <div className="bg-[#0d1c32] rounded-2xl p-5 space-y-3 border border-[#1c2a41]">
                <p className="text-[10px] text-[#FF7F50] uppercase tracking-widest font-bold">Your Setup</p>
                {[
                  { label: 'Tank', value: `${tankName || 'My Reef'} · ${gallons || '—'} gal${tankStatus === 'existing' && tankAgeMonths ? ` · ${tankAgeMonths}mo old` : ''}`, icon: 'water' },
                  { label: 'Type', value: TANK_TYPES.find(t => t.key === tankType)?.label || tankType, icon: 'category' },
                  { label: 'Goal', value: REEF_GOALS.find(g => g.key === reefGoal)?.label || reefGoal, icon: 'flag' },
                  ...(tankStatus === 'existing' ? [
                    { label: 'Equipment', value: `${scannedGear.reduce((sum, g) => sum + g.qty, 0)} items`, icon: 'build' },
                    { label: 'Livestock', value: `${scannedLivestock.length} species found`, icon: 'pets' },
                    { label: 'Parameters', value: Object.values(params).filter(v => v !== null).length > 0 ? 'Baseline recorded ✓' : 'Not yet', icon: 'science' },
                  ] : [
                    { label: 'Equipment', value: `${haveCount} owned · ${needCount} to buy`, icon: 'build' },
                    { label: 'Cycle', value: startCycle ? 'Tracking active 🟢' : 'Not started yet', icon: 'biotech' },
                  ]),
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#FF7F50] text-lg">{row.icon}</span>
                    <div className="flex-1">
                      <p className="text-[10px] text-[#8f9097] uppercase tracking-wider">{row.label}</p>
                      <p className="text-white text-sm font-medium">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* What's Next */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-[#c5c6cd]/50 uppercase tracking-widest">What&apos;s Next</p>
                {(tankStatus === 'existing' ? [
                  { icon: 'dashboard', title: 'Check your Dashboard', desc: 'See alerts, trends, and AI recommendations from your baseline data', color: '#4cd6fb' },
                  { icon: 'trending_up', title: 'Track parameter trends', desc: 'Log weekly tests to build stability trends over time', color: '#FF7F50' },
                  { icon: 'calculate', title: 'Optimize dosing', desc: 'Get exact dosing calculations from your parameter history', color: '#2ff801' },
                ] : [
                  { icon: 'science', title: 'Log your first water test', desc: 'Start tracking NH3, NO2, NO3 for cycle monitoring', color: '#4cd6fb' },
                  { icon: 'menu_book', title: 'Read beginner guides', desc: '14 articles covering every aspect of reef keeping', color: '#FF7F50' },
                  { icon: 'pets', title: 'Browse the Species Library', desc: '180+ fish, corals & invertebrates with care guides', color: '#2ff801' },
                ]).map(card => (
                  <div key={card.title} className="bg-[#0d1c32] rounded-xl p-4 flex items-center gap-3 border border-[#1c2a41]">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${card.color}15` }}>
                      <span className="material-symbols-outlined" style={{ color: card.color }}>{card.icon}</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{card.title}</p>
                      <p className="text-[10px] text-[#8f9097]">{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Auto-maintenance note */}
              <div className="bg-[#4cd6fb]/5 border border-[#4cd6fb]/20 rounded-xl p-3 flex items-start gap-2">
                <span className="material-symbols-outlined text-[#4cd6fb] text-lg">task_alt</span>
                <p className="text-[11px] text-[#c5c6cd] leading-relaxed">
                  <strong className="text-[#4cd6fb]">14 maintenance tasks</strong> have been created for your {gallons || 40}g system — daily, weekly, monthly & quarterly routines are all set.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[#93000a]/20 border border-[#ffb4ab]/20 rounded-xl p-3 flex items-center gap-2 mt-4">
          <span className="material-symbols-outlined text-[#ffb4ab] text-sm">error</span>
          <span className="text-[#ffb4ab] text-xs">{error}</span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-6 pb-4">
        {step > 0 && (
          <button onClick={back}
            className="flex-1 py-4 bg-[#1c2a41] text-[#c5c6cd] rounded-xl font-[family-name:var(--font-headline)] font-semibold text-sm hover:bg-[#27354c] transition-colors">
            Back
          </button>
        )}
        <button onClick={next} disabled={!canAdvance() || saving}
          className="flex-[2] bg-gradient-to-br from-[#FF7F50] to-[#d35e32] text-white font-[family-name:var(--font-headline)] font-bold py-4 rounded-xl text-sm tracking-widest uppercase shadow-xl shadow-[#FF7F50]/20 active:scale-[0.98] transition-transform duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {saving ? (
            <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> Setting up...</>
          ) : step === STEPS.length - 1 ? (
            <><span className="material-symbols-outlined text-sm">rocket_launch</span> Launch ReefOS</>
          ) : (
            <>Continue <span className="material-symbols-outlined text-sm">arrow_forward</span></>
          )}
        </button>
      </div>
    </div>
  );
}
