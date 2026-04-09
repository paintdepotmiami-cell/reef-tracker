// ReefOS Supplement Catalog — 200+ real reef aquarium products

export interface SupCatalogItem {
  name: string;
  brand: string;
  type: string;
  popular?: boolean;
}

export const SUPPLEMENT_CATALOG: SupCatalogItem[] = [
  // ── BRS (Bulk Reef Supply) ──────────────────────────────────────────
  { name: '2-Part Calcium', brand: 'BRS', type: 'calcium supplement', popular: true },
  { name: '2-Part Alkalinity', brand: 'BRS', type: 'alkalinity supplement', popular: true },
  { name: 'Magnesium Chloride', brand: 'BRS', type: 'magnesium supplement' },
  { name: 'Magnesium Sulfate', brand: 'BRS', type: 'magnesium supplement' },
  { name: 'Kalkwasser (Calcium Hydroxide)', brand: 'BRS', type: 'calcium supplement' },
  { name: 'GFO High Capacity', brand: 'BRS', type: 'phosphate remover', popular: true },
  { name: 'ROX 0.8 Carbon', brand: 'BRS', type: 'carbon dosing', popular: true },
  { name: 'Bulk Pharma Sodium Bicarbonate', brand: 'BRS', type: 'alkalinity supplement' },
  { name: 'Bulk Pharma Soda Ash', brand: 'BRS', type: 'alkalinity supplement' },
  { name: 'Reef Pro Carbon', brand: 'BRS', type: 'carbon dosing' },

  // ── Red Sea ─────────────────────────────────────────────────────────
  { name: 'Foundation A (Ca/Sr)', brand: 'Red Sea', type: 'calcium supplement', popular: true },
  { name: 'Foundation B (Alk)', brand: 'Red Sea', type: 'alkalinity supplement', popular: true },
  { name: 'Foundation C (Mg)', brand: 'Red Sea', type: 'magnesium supplement', popular: true },
  { name: 'Coral Colors A (I/K/Fe)', brand: 'Red Sea', type: 'trace elements' },
  { name: 'Coral Colors B (K/Boron)', brand: 'Red Sea', type: 'trace elements' },
  { name: 'Coral Colors C (Fe/Mn/Co)', brand: 'Red Sea', type: 'trace elements' },
  { name: 'Coral Colors D (Trace/Bio)', brand: 'Red Sea', type: 'trace elements' },
  { name: 'NO3:PO4-X', brand: 'Red Sea', type: 'carbon dosing', popular: true },
  { name: 'NoPox', brand: 'Red Sea', type: 'carbon dosing' },
  { name: 'Reef Energy AB+', brand: 'Red Sea', type: 'coral food', popular: true },
  { name: 'Reef Energy Plus', brand: 'Red Sea', type: 'coral food' },
  { name: 'Coral Pro Salt', brand: 'Red Sea', type: 'salt mix', popular: true },
  { name: 'Sea Salt', brand: 'Red Sea', type: 'salt mix' },
  { name: 'Aiptasia-X', brand: 'Red Sea', type: 'other', popular: true },
  { name: 'Trace Colors A Iodine+', brand: 'Red Sea', type: 'trace elements' },
  { name: 'Trace Colors B Potassium+', brand: 'Red Sea', type: 'trace elements' },
  { name: 'Trace Colors C Iron+', brand: 'Red Sea', type: 'trace elements' },
  { name: 'Trace Colors D Bioactive Elements', brand: 'Red Sea', type: 'trace elements' },
  { name: 'Reef Mature Starter Kit', brand: 'Red Sea', type: 'bacteria' },

  // ── Brightwell Aquatics ─────────────────────────────────────────────
  { name: 'Calcion', brand: 'Brightwell Aquatics', type: 'calcium supplement' },
  { name: 'Calcion-P', brand: 'Brightwell Aquatics', type: 'calcium supplement' },
  { name: 'Alkalin8.3', brand: 'Brightwell Aquatics', type: 'alkalinity supplement' },
  { name: 'Alkalin8.3-P', brand: 'Brightwell Aquatics', type: 'alkalinity supplement' },
  { name: 'Magnesion', brand: 'Brightwell Aquatics', type: 'magnesium supplement' },
  { name: 'Magnesion-P', brand: 'Brightwell Aquatics', type: 'magnesium supplement' },
  { name: 'Koralle-VM', brand: 'Brightwell Aquatics', type: 'trace elements' },
  { name: 'Replenish', brand: 'Brightwell Aquatics', type: 'trace elements' },
  { name: 'Strontion', brand: 'Brightwell Aquatics', type: 'trace elements' },
  { name: 'Restor', brand: 'Brightwell Aquatics', type: 'amino acids' },
  { name: 'Reef Snow', brand: 'Brightwell Aquatics', type: 'coral food' },
  { name: 'MicroBacter7', brand: 'Brightwell Aquatics', type: 'bacteria', popular: true },
  { name: 'MicroBacterClean', brand: 'Brightwell Aquatics', type: 'bacteria' },
  { name: 'MicroBacter Start XLM', brand: 'Brightwell Aquatics', type: 'bacteria' },
  { name: 'PhosphatR', brand: 'Brightwell Aquatics', type: 'phosphate remover' },
  { name: 'PhosphatR-FE', brand: 'Brightwell Aquatics', type: 'phosphate remover' },
  { name: 'NeoMarine', brand: 'Brightwell Aquatics', type: 'salt mix' },
  { name: 'Reef BioFuel', brand: 'Brightwell Aquatics', type: 'carbon dosing' },
  { name: 'CoralAmino', brand: 'Brightwell Aquatics', type: 'amino acids' },
  { name: 'Potassion', brand: 'Brightwell Aquatics', type: 'trace elements' },
  { name: 'Iodion', brand: 'Brightwell Aquatics', type: 'trace elements' },

  // ── Seachem ─────────────────────────────────────────────────────────
  { name: 'Reef Advantage Calcium', brand: 'Seachem', type: 'calcium supplement' },
  { name: 'Reef Builder', brand: 'Seachem', type: 'alkalinity supplement' },
  { name: 'Reef Advantage Magnesium', brand: 'Seachem', type: 'magnesium supplement' },
  { name: 'Reef Trace', brand: 'Seachem', type: 'trace elements' },
  { name: 'Reef Iodide', brand: 'Seachem', type: 'trace elements' },
  { name: 'Reef Strontium', brand: 'Seachem', type: 'trace elements' },
  { name: 'Prime', brand: 'Seachem', type: 'water conditioner', popular: true },
  { name: 'Stability', brand: 'Seachem', type: 'bacteria', popular: true },
  { name: 'PhosGuard', brand: 'Seachem', type: 'phosphate remover' },
  { name: 'Reef Buffer', brand: 'Seachem', type: 'ph buffer' },
  { name: 'Marine Buffer', brand: 'Seachem', type: 'ph buffer' },
  { name: 'Reef Dip', brand: 'Seachem', type: 'coral dip' },
  { name: 'Reef Complete', brand: 'Seachem', type: 'calcium supplement' },
  { name: 'Reef Calcium', brand: 'Seachem', type: 'calcium supplement' },
  { name: 'Reef Carbonate', brand: 'Seachem', type: 'alkalinity supplement' },
  { name: 'Reef Plus', brand: 'Seachem', type: 'trace elements' },
  { name: 'Reef Phytoplankton', brand: 'Seachem', type: 'coral food' },
  { name: 'Reef Zooplankton', brand: 'Seachem', type: 'coral food' },
  { name: 'Vibrant Sea Salt', brand: 'Seachem', type: 'salt mix' },
  { name: 'Aquavitro Calcification', brand: 'Seachem', type: 'calcium supplement' },
  { name: 'Aquavitro Eight.Four', brand: 'Seachem', type: 'alkalinity supplement' },

  // ── Tropic Marin ───────────────────────────────────────────────────
  { name: 'Bio-Calcium', brand: 'Tropic Marin', type: 'calcium supplement' },
  { name: 'Bio-Actif Salt', brand: 'Tropic Marin', type: 'salt mix' },
  { name: 'Bio-Magnesium', brand: 'Tropic Marin', type: 'magnesium supplement' },
  { name: 'All-For-Reef', brand: 'Tropic Marin', type: 'calcium supplement', popular: true },
  { name: 'Pro Reef Salt', brand: 'Tropic Marin', type: 'salt mix', popular: true },
  { name: 'K+ Elements', brand: 'Tropic Marin', type: 'trace elements' },
  { name: 'Original Balling Part A', brand: 'Tropic Marin', type: 'calcium supplement' },
  { name: 'Original Balling Part B', brand: 'Tropic Marin', type: 'alkalinity supplement' },
  { name: 'Original Balling Part C', brand: 'Tropic Marin', type: 'trace elements' },
  { name: 'NP-Bacto-Balance', brand: 'Tropic Marin', type: 'carbon dosing' },
  { name: 'Elimi-Phos Rapid', brand: 'Tropic Marin', type: 'phosphate remover' },
  { name: 'Pro-Coral A- Elements', brand: 'Tropic Marin', type: 'trace elements' },
  { name: 'Pro-Coral Organic', brand: 'Tropic Marin', type: 'coral food' },

  // ── Fauna Marin ─────────────────────────────────────────────────────
  { name: 'Balling Light Set (1+2+3)', brand: 'Fauna Marin', type: 'calcium supplement', popular: true },
  { name: 'Balling Light Part 1 (Ca)', brand: 'Fauna Marin', type: 'calcium supplement' },
  { name: 'Balling Light Part 2 (Alk)', brand: 'Fauna Marin', type: 'alkalinity supplement' },
  { name: 'Balling Light Part 3 (Trace)', brand: 'Fauna Marin', type: 'trace elements' },
  { name: 'Phosphat-E', brand: 'Fauna Marin', type: 'phosphate remover' },
  { name: 'LPS Pellets', brand: 'Fauna Marin', type: 'coral food' },
  { name: 'Ultra Min S', brand: 'Fauna Marin', type: 'trace elements' },
  { name: 'Ultra Min F', brand: 'Fauna Marin', type: 'trace elements' },
  { name: 'Amino Acids LPS/SPS', brand: 'Fauna Marin', type: 'amino acids' },
  { name: 'Color Elements Blue/Purple', brand: 'Fauna Marin', type: 'trace elements' },
  { name: 'Color Elements Green/Yellow', brand: 'Fauna Marin', type: 'trace elements' },
  { name: 'Color Elements Red/Pink', brand: 'Fauna Marin', type: 'trace elements' },
  { name: 'Ultra Organic', brand: 'Fauna Marin', type: 'coral food' },
  { name: 'Ultra Seafan', brand: 'Fauna Marin', type: 'coral food' },
  { name: 'ICP-OES Test Kit', brand: 'Fauna Marin', type: 'other' },

  // ── Two Little Fishies ──────────────────────────────────────────────
  { name: 'Kalkwasser Mix', brand: 'Two Little Fishies', type: 'calcium supplement' },
  { name: 'C-Balance 2-Part', brand: 'Two Little Fishies', type: 'calcium supplement' },
  { name: 'Revive Coral Cleaner', brand: 'Two Little Fishies', type: 'coral dip', popular: true },
  { name: 'AcroPower', brand: 'Two Little Fishies', type: 'amino acids', popular: true },
  { name: 'SeaVeggies Green Seaweed', brand: 'Two Little Fishies', type: 'fish food' },
  { name: 'SeaVeggies Purple Seaweed', brand: 'Two Little Fishies', type: 'fish food' },
  { name: 'SeaVeggies Red Seaweed', brand: 'Two Little Fishies', type: 'fish food' },
  { name: 'Marine Snow', brand: 'Two Little Fishies', type: 'coral food' },
  { name: 'PhytoPlan', brand: 'Two Little Fishies', type: 'coral food' },
  { name: 'ZoPlan', brand: 'Two Little Fishies', type: 'coral food' },
  { name: 'CDX Carbon', brand: 'Two Little Fishies', type: 'carbon dosing' },
  { name: 'PhosBan GFO', brand: 'Two Little Fishies', type: 'phosphate remover' },
  { name: 'Julian Sprung Sea Veggies', brand: 'Two Little Fishies', type: 'fish food' },

  // ── Fritz ───────────────────────────────────────────────────────────
  { name: 'FritzZyme TurboStart 900', brand: 'Fritz', type: 'bacteria', popular: true },
  { name: 'RPM Salt Mix', brand: 'Fritz', type: 'salt mix' },
  { name: 'RPM Reef Pro Mix', brand: 'Fritz', type: 'salt mix' },
  { name: 'Fritz Complete', brand: 'Fritz', type: 'water conditioner' },
  { name: 'FritzZyme 7', brand: 'Fritz', type: 'bacteria' },
  { name: 'FritzZyme 9', brand: 'Fritz', type: 'bacteria' },
  { name: 'Fritz Calcium Chloride', brand: 'Fritz', type: 'calcium supplement' },
  { name: 'Fritz Alkalinity (Soda Ash)', brand: 'Fritz', type: 'alkalinity supplement' },
  { name: 'Fritz A.C.C.R.', brand: 'Fritz', type: 'water conditioner' },
  { name: 'Fritz Dark Water', brand: 'Fritz', type: 'other' },

  // ── Aquaforest ──────────────────────────────────────────────────────
  { name: 'Component 1+ (Ca)', brand: 'Aquaforest', type: 'calcium supplement' },
  { name: 'Component 2+ (Alk)', brand: 'Aquaforest', type: 'alkalinity supplement' },
  { name: 'Component 3+ (Mg)', brand: 'Aquaforest', type: 'magnesium supplement' },
  { name: 'Reef Salt', brand: 'Aquaforest', type: 'salt mix' },
  { name: 'Probiotic Reef Salt', brand: 'Aquaforest', type: 'salt mix' },
  { name: 'AF Amino Mix', brand: 'Aquaforest', type: 'amino acids' },
  { name: 'Bio S', brand: 'Aquaforest', type: 'bacteria' },
  { name: 'NP Pro', brand: 'Aquaforest', type: 'carbon dosing' },
  { name: 'AF Power Food', brand: 'Aquaforest', type: 'coral food' },
  { name: 'AF Phyto Mix', brand: 'Aquaforest', type: 'coral food' },
  { name: 'AF Life Source', brand: 'Aquaforest', type: 'bacteria' },
  { name: 'AF Build', brand: 'Aquaforest', type: 'trace elements' },
  { name: 'AF Vitality', brand: 'Aquaforest', type: 'trace elements' },
  { name: 'Phosphate Minus', brand: 'Aquaforest', type: 'phosphate remover' },

  // ── Polyplab ────────────────────────────────────────────────────────
  { name: 'Reef-Roids', brand: 'Polyplab', type: 'coral food', popular: true },
  { name: 'Colors', brand: 'Polyplab', type: 'trace elements' },
  { name: 'One', brand: 'Polyplab', type: 'trace elements' },
  { name: 'Medic', brand: 'Polyplab', type: 'other', popular: true },
  { name: 'Polyp-Booster', brand: 'Polyplab', type: 'coral food' },

  // ── ESV ─────────────────────────────────────────────────────────────
  { name: 'B-Ionic 2-Part Calcium', brand: 'ESV', type: 'calcium supplement', popular: true },
  { name: 'B-Ionic 2-Part Alkalinity', brand: 'ESV', type: 'alkalinity supplement', popular: true },
  { name: 'B-Ionic Magnesium', brand: 'ESV', type: 'magnesium supplement' },
  { name: 'B-Ionic Calcium Buffer', brand: 'ESV', type: 'calcium supplement' },

  // ── Korallen-Zucht (KZ / ZEOvit) ───────────────────────────────────
  { name: 'Amino Acid Concentrate', brand: 'Korallen-Zucht', type: 'amino acids', popular: true },
  { name: 'ZEObak', brand: 'Korallen-Zucht', type: 'bacteria' },
  { name: 'ZEOstart3', brand: 'Korallen-Zucht', type: 'carbon dosing' },
  { name: 'Pohls Xtra', brand: 'Korallen-Zucht', type: 'trace elements' },
  { name: 'Coral Snow', brand: 'Korallen-Zucht', type: 'coral food' },
  { name: 'Coral Snow Plus', brand: 'Korallen-Zucht', type: 'coral food' },
  { name: 'Sponge Power', brand: 'Korallen-Zucht', type: 'trace elements' },
  { name: 'Flatworm Stop', brand: 'Korallen-Zucht', type: 'other' },
  { name: 'ZEOvit Zeolites', brand: 'Korallen-Zucht', type: 'other' },
  { name: 'Pohls Xtra Special', brand: 'Korallen-Zucht', type: 'trace elements' },
  { name: 'Coral Booster', brand: 'Korallen-Zucht', type: 'coral food' },

  // ── Kent Marine ─────────────────────────────────────────────────────
  { name: 'Liquid Calcium', brand: 'Kent Marine', type: 'calcium supplement' },
  { name: 'Superbuffer-dKH', brand: 'Kent Marine', type: 'alkalinity supplement' },
  { name: 'Tech-M Magnesium', brand: 'Kent Marine', type: 'magnesium supplement' },
  { name: 'Essential Elements', brand: 'Kent Marine', type: 'trace elements' },
  { name: 'Nano Reef Parts A & B', brand: 'Kent Marine', type: 'calcium supplement' },
  { name: 'Turbo Calcium', brand: 'Kent Marine', type: 'calcium supplement' },
  { name: 'Marine C', brand: 'Kent Marine', type: 'trace elements' },
  { name: 'Iodide Supplement', brand: 'Kent Marine', type: 'trace elements' },
  { name: 'Strontium & Molybdenum', brand: 'Kent Marine', type: 'trace elements' },
  { name: 'PhosCoil', brand: 'Kent Marine', type: 'phosphate remover' },

  // ── Dr. Tim's ───────────────────────────────────────────────────────
  { name: 'One and Only (Saltwater)', brand: "Dr. Tim's", type: 'bacteria', popular: true },
  { name: 'Ammonium Chloride', brand: "Dr. Tim's", type: 'other' },
  { name: 'Waste-Away (Saltwater)', brand: "Dr. Tim's", type: 'bacteria' },
  { name: 'Re-Fresh', brand: "Dr. Tim's", type: 'water conditioner' },
  { name: 'First Defense', brand: "Dr. Tim's", type: 'water conditioner' },

  // ── Prodibio ────────────────────────────────────────────────────────
  { name: 'BioDigest', brand: 'Prodibio', type: 'bacteria' },
  { name: 'BioTrace', brand: 'Prodibio', type: 'trace elements' },
  { name: 'Reef Booster', brand: 'Prodibio', type: 'coral food' },
  { name: 'Stop Ammo', brand: 'Prodibio', type: 'water conditioner' },
  { name: 'Iodi+', brand: 'Prodibio', type: 'trace elements' },
  { name: 'Stronti+', brand: 'Prodibio', type: 'trace elements' },

  // ── Hikari ──────────────────────────────────────────────────────────
  { name: 'Bio-Pure Frozen Mysis Shrimp', brand: 'Hikari', type: 'fish food', popular: true },
  { name: 'Bio-Pure Frozen Brine Shrimp', brand: 'Hikari', type: 'fish food' },
  { name: 'Marine-S Pellets', brand: 'Hikari', type: 'fish food' },
  { name: 'Marine-A Pellets', brand: 'Hikari', type: 'fish food' },
  { name: 'Mega Marine Angel', brand: 'Hikari', type: 'fish food' },
  { name: 'Spirulina Brine Shrimp', brand: 'Hikari', type: 'fish food' },

  // ── LRS (Larry's Reef Services) ─────────────────────────────────────
  { name: 'Reef Frenzy', brand: 'LRS', type: 'coral food', popular: true },
  { name: 'Fish Frenzy', brand: 'LRS', type: 'fish food', popular: true },
  { name: 'Fertility Frenzy', brand: 'LRS', type: 'coral food' },
  { name: 'Chunky Fish Frenzy', brand: 'LRS', type: 'fish food' },
  { name: 'Herbivore Frenzy', brand: 'LRS', type: 'fish food' },

  // ── Rod's Food ──────────────────────────────────────────────────────
  { name: 'Original Blend', brand: "Rod's Food", type: 'fish food', popular: true },
  { name: 'Coral Blend', brand: "Rod's Food", type: 'coral food' },
  { name: 'Fish Only Blend', brand: "Rod's Food", type: 'fish food' },
  { name: 'Fish Eggs', brand: "Rod's Food", type: 'fish food' },
  { name: 'Seaweed', brand: "Rod's Food", type: 'fish food' },

  // ── Reef Nutrition ──────────────────────────────────────────────────
  { name: 'Oyster Feast', brand: 'Reef Nutrition', type: 'coral food', popular: true },
  { name: 'Roti-Feast', brand: 'Reef Nutrition', type: 'coral food' },
  { name: 'Phyto-Feast Live', brand: 'Reef Nutrition', type: 'coral food' },
  { name: 'TDO Chroma Boost EP1', brand: 'Reef Nutrition', type: 'fish food' },
  { name: 'TDO Chroma Boost EP2', brand: 'Reef Nutrition', type: 'fish food' },
  { name: 'TDO Chroma Boost C1', brand: 'Reef Nutrition', type: 'fish food' },
  { name: 'R.O.E. Real Oceanic Eggs', brand: 'Reef Nutrition', type: 'coral food' },
  { name: 'Arcti-Pods', brand: 'Reef Nutrition', type: 'coral food' },

  // ── New Life Spectrum ───────────────────────────────────────────────
  { name: 'Marine Fish Formula', brand: 'New Life Spectrum', type: 'fish food' },
  { name: 'Thera+A', brand: 'New Life Spectrum', type: 'fish food', popular: true },
  { name: 'AlgaeMax', brand: 'New Life Spectrum', type: 'fish food' },
  { name: 'H2O Stable Wafers', brand: 'New Life Spectrum', type: 'fish food' },

  // ── Ocean Nutrition ─────────────────────────────────────────────────
  { name: 'Formula One Pellets', brand: 'Ocean Nutrition', type: 'fish food' },
  { name: 'Formula One Flakes', brand: 'Ocean Nutrition', type: 'fish food' },
  { name: 'Formula Two Pellets', brand: 'Ocean Nutrition', type: 'fish food' },
  { name: 'Formula Two Flakes', brand: 'Ocean Nutrition', type: 'fish food' },
  { name: 'Seaweed Select Green', brand: 'Ocean Nutrition', type: 'fish food' },
  { name: 'Seaweed Select Red', brand: 'Ocean Nutrition', type: 'fish food' },
  { name: 'Prime Reef Flakes', brand: 'Ocean Nutrition', type: 'fish food' },
  { name: 'Brine Shrimp Plus Flakes', brand: 'Ocean Nutrition', type: 'fish food' },

  // ── CoralRX ─────────────────────────────────────────────────────────
  { name: 'CoralRX Pro', brand: 'CoralRX', type: 'coral dip', popular: true },
  { name: 'CoralRX Industrial', brand: 'CoralRX', type: 'coral dip' },
  { name: 'CoralRX Dip', brand: 'CoralRX', type: 'coral dip' },

  // ── Instant Ocean ───────────────────────────────────────────────────
  { name: 'Sea Salt', brand: 'Instant Ocean', type: 'salt mix', popular: true },
  { name: 'Reef Crystals', brand: 'Instant Ocean', type: 'salt mix', popular: true },
  { name: 'Hydrometer', brand: 'Instant Ocean', type: 'other' },

  // ── API ─────────────────────────────────────────────────────────────
  { name: 'Stress Coat Marine', brand: 'API', type: 'water conditioner' },
  { name: 'Melafix Marine', brand: 'API', type: 'other' },
  { name: 'Reef Master Test Kit', brand: 'API', type: 'other' },
  { name: 'Saltwater Master Test Kit', brand: 'API', type: 'other' },

  // ── Boyd Enterprises ────────────────────────────────────────────────
  { name: 'Vita-Chem Marine', brand: 'Boyd', type: 'trace elements', popular: true },
  { name: 'Chemi-Pure Elite', brand: 'Boyd', type: 'carbon dosing', popular: true },
  { name: 'Chemi-Pure Blue', brand: 'Boyd', type: 'carbon dosing' },
  { name: 'Chemi-Pure', brand: 'Boyd', type: 'carbon dosing' },

  // ── AlgaeBarn ───────────────────────────────────────────────────────
  { name: 'OceanMagik (Phyto Blend)', brand: 'AlgaeBarn', type: 'coral food', popular: true },
  { name: "Poseidon's Feast Copepods", brand: 'AlgaeBarn', type: 'coral food' },
  { name: '5280 Pods (Tisbe)', brand: 'AlgaeBarn', type: 'coral food', popular: true },
  { name: 'Ecopods (Tigriopus)', brand: 'AlgaeBarn', type: 'coral food' },
  { name: 'Mandarin Feast', brand: 'AlgaeBarn', type: 'fish food' },

  // ── Additional popular products ─────────────────────────────────────
  { name: 'Phosphate Rx', brand: 'Blue Life', type: 'phosphate remover' },
  { name: 'Flux Rx', brand: 'Blue Life', type: 'other' },
  { name: 'Vibrant Aquarium Cleaner', brand: 'Underwater Creations', type: 'other', popular: true },
  { name: 'Lugols Solution (Iodine)', brand: 'Brightwell Aquatics', type: 'trace elements' },
  { name: 'Coral Rx One Shot', brand: 'CoralRX', type: 'coral dip' },
  { name: 'Cupramine', brand: 'Seachem', type: 'other' },
  { name: 'Focus', brand: 'Seachem', type: 'other' },
  { name: 'Metroplex', brand: 'Seachem', type: 'other' },
  { name: 'Kanaplex', brand: 'Seachem', type: 'other' },
  { name: 'Nori Seaweed Sheets', brand: 'Generic', type: 'fish food' },
  { name: 'PE Calanus', brand: 'Piscine Energetics', type: 'fish food', popular: true },
  { name: 'PE Mysis Shrimp', brand: 'Piscine Energetics', type: 'fish food', popular: true },
  { name: 'Benepets Benereef', brand: 'Benepets', type: 'coral food' },
  { name: 'Benepets BeneReef Powder', brand: 'Benepets', type: 'coral food' },
  { name: 'Salifert All-in-One', brand: 'Salifert', type: 'trace elements' },
  { name: 'Salifert Calcium', brand: 'Salifert', type: 'calcium supplement' },
  { name: 'Salifert KH/Alk Buffer', brand: 'Salifert', type: 'alkalinity supplement' },
  { name: 'Continuum Aquatics Reef-Basis Calcium', brand: 'Continuum', type: 'calcium supplement' },
  { name: 'Continuum Aquatics Reef-Basis Reactor', brand: 'Continuum', type: 'alkalinity supplement' },
  { name: 'Continuum Aquatics BacterGen-M', brand: 'Continuum', type: 'bacteria' },
  { name: 'Continuum Aquatics Flora Viv', brand: 'Continuum', type: 'trace elements' },
  { name: 'SPS Coral Food', brand: 'Fauna Marin', type: 'coral food' },
  { name: 'Reefy (All-in-One)', brand: 'Reefy', type: 'calcium supplement' },
  { name: 'Paraguard', brand: 'Seachem', type: 'other' },
  { name: 'Microbe-Lift Artemiss', brand: 'Microbe-Lift', type: 'other' },
  { name: 'Microbe-Lift Herbtana', brand: 'Microbe-Lift', type: 'other' },
  { name: 'Cobalt Aquatics Mysis Spirulina Flakes', brand: 'Cobalt Aquatics', type: 'fish food' },
  { name: 'H2Ocean Pro+ Salt', brand: 'D-D', type: 'salt mix' },
  { name: 'RowaPhos GFO', brand: 'Rowa', type: 'phosphate remover' },
  { name: 'Warner Marine EcoKalk', brand: 'Warner Marine', type: 'calcium supplement' },
  { name: 'Acropora Amino', brand: 'Korallen-Zucht', type: 'amino acids' },
  { name: 'AF Energy', brand: 'Aquaforest', type: 'coral food' },
  { name: 'AF Micro E', brand: 'Aquaforest', type: 'trace elements' },
  { name: 'AF Iron', brand: 'Aquaforest', type: 'trace elements' },
  { name: 'Reef Foundation A (Ca)', brand: 'Red Sea', type: 'calcium supplement' },
];

export function searchSupplements(query: string, type?: string): SupCatalogItem[] {
  if (!query || query.length < 2) return [];
  const terms = query.toLowerCase().split(/\s+/);
  let results = SUPPLEMENT_CATALOG.filter(item => {
    const text = `${item.brand} ${item.name}`.toLowerCase();
    return terms.every(t => text.includes(t));
  });
  if (type) results = results.filter(r => r.type === type);
  results.sort((a, b) => {
    if (a.popular && !b.popular) return -1;
    if (!a.popular && b.popular) return 1;
    return `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`);
  });
  return results.slice(0, 12);
}
