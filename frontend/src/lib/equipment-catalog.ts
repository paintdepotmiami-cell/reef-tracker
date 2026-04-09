// ReefOS Equipment Catalog
// Searchable catalog of popular reef aquarium equipment

export interface CatalogItem {
  name: string;
  brand: string;
  category: string;
  popular?: boolean;
}

export const EQUIPMENT_CATALOG: CatalogItem[] = [
  // ── Lighting ──────────────────────────────────────────────
  { name: 'Hydra 32 HD', brand: 'Aqua Illumination', category: 'lighting', popular: true },
  { name: 'Hydra 64 HD', brand: 'Aqua Illumination', category: 'lighting', popular: true },
  { name: 'Prime 16 HD', brand: 'Aqua Illumination', category: 'lighting', popular: true },
  { name: 'Radion XR15 G6', brand: 'EcoTech Marine', category: 'lighting', popular: true },
  { name: 'Radion XR30 G6', brand: 'EcoTech Marine', category: 'lighting', popular: true },
  { name: 'Radion XR15 G6 Pro', brand: 'EcoTech Marine', category: 'lighting' },
  { name: 'A360X Tuna Blue', brand: 'Kessil', category: 'lighting', popular: true },
  { name: 'AP9X', brand: 'Kessil', category: 'lighting', popular: true },
  { name: 'A160WE Tuna Sun', brand: 'Kessil', category: 'lighting' },
  { name: 'XHO LED Strip', brand: 'Reef Brite', category: 'lighting' },
  { name: 'Lumi Lite Pro', brand: 'Reef Brite', category: 'lighting' },
  { name: 'Atlantik iCon', brand: 'Orphek', category: 'lighting' },
  { name: 'OR3 Bar LED', brand: 'Orphek', category: 'lighting' },
  { name: 'ReefLED 90', brand: 'Red Sea', category: 'lighting' },
  { name: 'ReefLED 160S', brand: 'Red Sea', category: 'lighting' },
  { name: 'Aqua Knight V2', brand: 'Hipargero', category: 'lighting' },
  { name: 'Classic LED Plus', brand: 'Nicrew', category: 'lighting' },
  { name: 'Orbit Marine IC Pro', brand: 'Current USA', category: 'lighting' },

  // ── Circulation ───────────────────────────────────────────
  { name: 'Nero 3', brand: 'Aqua Illumination', category: 'circulation' },
  { name: 'Nero 5', brand: 'Aqua Illumination', category: 'circulation', popular: true },
  { name: 'Nero 7', brand: 'Aqua Illumination', category: 'circulation' },
  { name: 'VorTech MP10', brand: 'EcoTech Marine', category: 'circulation', popular: true },
  { name: 'VorTech MP40', brand: 'EcoTech Marine', category: 'circulation', popular: true },
  { name: 'VorTech MP60', brand: 'EcoTech Marine', category: 'circulation' },
  { name: 'Turbelle Nanostream 6095', brand: 'Tunze', category: 'circulation', popular: true },
  { name: 'Turbelle Stream 6105', brand: 'Tunze', category: 'circulation' },
  { name: 'SLW-20 Sine Wave', brand: 'Jebao', category: 'circulation' },
  { name: 'SOW-8 Wave Maker', brand: 'Jebao', category: 'circulation' },
  { name: 'SOW-16 Wave Maker', brand: 'Jebao', category: 'circulation' },
  { name: 'Gyre XF250', brand: 'Maxspect', category: 'circulation' },
  { name: 'Gyre XF350', brand: 'Maxspect', category: 'circulation' },
  { name: 'IceCap Gyre 1K', brand: 'IceCap', category: 'circulation' },
  { name: 'Voyager Nano', brand: 'Sicce', category: 'circulation' },
  { name: 'Koralia 3G', brand: 'Hydor', category: 'circulation' },
  { name: 'DC-6000 Return Pump', brand: 'Waveline', category: 'circulation' },

  // ── Filtration ────────────────────────────────────────────
  { name: 'Classic 150-INT', brand: 'Reef Octopus', category: 'filtration', popular: true },
  { name: 'Classic 200-INT', brand: 'Reef Octopus', category: 'filtration' },
  { name: 'Regal 200-INT', brand: 'Reef Octopus', category: 'filtration', popular: true },
  { name: 'AE-EC Protein Skimmer', brand: 'Aqua Excel', category: 'filtration' },
  { name: 'Comline DOC 9004', brand: 'Tunze', category: 'filtration' },
  { name: 'Comline DOC 9012', brand: 'Tunze', category: 'filtration' },
  { name: 'Curve 5', brand: 'Bubble Magus', category: 'filtration', popular: true },
  { name: 'Curve 7', brand: 'Bubble Magus', category: 'filtration' },
  { name: 'Simplicity 120DC', brand: 'Simplicity', category: 'filtration' },
  { name: 'Simplicity 240DC', brand: 'Simplicity', category: 'filtration' },
  { name: 'Quantum 120', brand: 'Nyos', category: 'filtration' },
  { name: 'Quantum 160', brand: 'Nyos', category: 'filtration' },
  { name: 'GFO/Carbon Reactor', brand: 'BRS', category: 'filtration' },
  { name: 'PhosBan Reactor 150', brand: 'Two Little Fishies', category: 'filtration' },
  { name: 'Klir Di-7 Automatic Filter', brand: 'CoralVue', category: 'filtration' },
  { name: 'H80 Tuna Flora', brand: 'Kessil', category: 'filtration' },
  { name: 'Fuge Light', brand: 'Aqua Illumination', category: 'filtration' },

  // ── Water Management ──────────────────────────────────────
  { name: 'Osmolator 3155 ATO', brand: 'Tunze', category: 'water_management', popular: true },
  { name: 'Smart ATO Micro', brand: 'AutoAqua', category: 'water_management', popular: true },
  { name: 'Smart ATO Duo', brand: 'AutoAqua', category: 'water_management' },
  { name: 'Duetto ATO', brand: 'XP Aqua', category: 'water_management' },
  { name: 'ReefDose 2', brand: 'Red Sea', category: 'water_management' },
  { name: 'ReefDose 4', brand: 'Red Sea', category: 'water_management', popular: true },
  { name: 'GHL Doser 2.1 SA', brand: 'GHL', category: 'water_management' },
  { name: 'Kamoer X1 Pro2 Doser', brand: 'Kamoer', category: 'water_management' },
  { name: 'BRS 1.1mL Dosing Pump', brand: 'BRS', category: 'water_management' },
  { name: '4-Stage Value Plus RODI', brand: 'BRS', category: 'water_management', popular: true },
  { name: 'Barracuda RODI', brand: 'AquaFX', category: 'water_management' },
  { name: 'Hydra 32 RODI', brand: 'AquaFX', category: 'water_management' },

  // ── Heating ───────────────────────────────────────────────
  { name: 'Jager TruTemp 150W', brand: 'Eheim', category: 'heating', popular: true },
  { name: 'Jager TruTemp 250W', brand: 'Eheim', category: 'heating' },
  { name: 'Neo-Therm 150W', brand: 'Cobalt Aquatics', category: 'heating', popular: true },
  { name: 'Neo-Therm 200W', brand: 'Cobalt Aquatics', category: 'heating' },
  { name: 'HMX 300W Titanium', brand: 'Finnex', category: 'heating' },
  { name: 'Titanium Heater 200W', brand: 'BRS', category: 'heating' },
  { name: 'ITC-308 Temperature Controller', brand: 'Inkbird', category: 'heating', popular: true },

  // ── Testing ───────────────────────────────────────────────
  { name: 'HI772 Alkalinity Checker', brand: 'Hanna Instruments', category: 'testing', popular: true },
  { name: 'HI713 Phosphate Checker', brand: 'Hanna Instruments', category: 'testing', popular: true },
  { name: 'HI758 Calcium Checker', brand: 'Hanna Instruments', category: 'testing' },
  { name: 'HI781 Nitrate Checker', brand: 'Hanna Instruments', category: 'testing' },
  { name: 'HI774 Phosphate ULR Checker', brand: 'Hanna Instruments', category: 'testing' },
  { name: 'Reef Foundation Pro Kit', brand: 'Red Sea', category: 'testing' },
  { name: 'Coral Colors Pro Kit', brand: 'Red Sea', category: 'testing' },
  { name: 'Alkalinity Test Kit', brand: 'Salifert', category: 'testing', popular: true },
  { name: 'Calcium Test Kit', brand: 'Salifert', category: 'testing' },
  { name: 'Magnesium Test Kit', brand: 'Salifert', category: 'testing' },
  { name: 'Saltwater Master Kit', brand: 'API', category: 'testing' },
  { name: 'Trident', brand: 'Neptune Systems', category: 'testing', popular: true },

  // ── Controller ────────────────────────────────────────────
  { name: 'Apex Controller System', brand: 'Neptune Systems', category: 'controller', popular: true },
  { name: 'Apex EL', brand: 'Neptune Systems', category: 'controller' },
  { name: 'ProfiLux 4', brand: 'GHL', category: 'controller', popular: true },
  { name: 'ProfiLux Mini', brand: 'GHL', category: 'controller' },
  { name: 'Hydros Control 4', brand: 'CoralVue', category: 'controller' },
  { name: 'Reef Angel Plus', brand: 'Reef Angel', category: 'controller' },
  { name: 'Seneye Reef Monitor', brand: 'Seneye', category: 'controller' },

  // ── Sump ──────────────────────────────────────────────────
  { name: 'Ruby 36 Sump', brand: 'Trigger Systems', category: 'sump', popular: true },
  { name: 'Crystal 30 Sump', brand: 'Trigger Systems', category: 'sump' },
  { name: 'Eshopps R-200 Sump', brand: 'Eshopps', category: 'sump' },
  { name: 'Eshopps R-300 Sump', brand: 'Eshopps', category: 'sump' },
  { name: 'Fiji Cube Sump 24', brand: 'Fiji Cube', category: 'sump', popular: true },
  { name: 'Fiji Cube Sump 36', brand: 'Fiji Cube', category: 'sump' },
  { name: 'IceCap 30 Sump', brand: 'IceCap', category: 'sump' },
  { name: 'Custom/DIY Sump', brand: 'DIY', category: 'sump' },
];

/**
 * Search the equipment catalog by query string.
 * Case-insensitive match on name + brand.
 * Optionally filter by category.
 * Returns popular items first, then alphabetical. Max 8 results.
 */
export function searchCatalog(query: string, category?: string): CatalogItem[] {
  const q = query.toLowerCase().trim();

  let items = EQUIPMENT_CATALOG;

  // Filter by category if provided
  if (category) {
    items = items.filter((item) => item.category === category);
  }

  // Filter by search query
  if (q) {
    items = items.filter((item) => {
      const searchText = `${item.name} ${item.brand}`.toLowerCase();
      // Match if all query words appear somewhere in the search text
      const words = q.split(/\s+/);
      return words.every((word) => searchText.includes(word));
    });
  }

  // Sort: popular first, then alphabetical by name
  items.sort((a, b) => {
    if (a.popular && !b.popular) return -1;
    if (!a.popular && b.popular) return 1;
    return a.name.localeCompare(b.name);
  });

  return items.slice(0, 8);
}
