// ReefOS Equipment Catalog
// Searchable catalog of popular reef aquarium equipment

export interface CatalogItem {
  name: string;
  brand: string;
  category: string;
  popular?: boolean;
}

export const EQUIPMENT_CATALOG: CatalogItem[] = [
  // ── Lighting (35 items) ──────────────────────────────────────
  { name: 'Hydra 32 HD', brand: 'Aqua Illumination', category: 'lighting', popular: true },
  { name: 'Hydra 64 HD', brand: 'Aqua Illumination', category: 'lighting', popular: true },
  { name: 'Prime 16 HD', brand: 'Aqua Illumination', category: 'lighting', popular: true },
  { name: 'Radion XR15 G6', brand: 'EcoTech Marine', category: 'lighting', popular: true },
  { name: 'Radion XR30 G6', brand: 'EcoTech Marine', category: 'lighting', popular: true },
  { name: 'Radion XR15 G6 Pro', brand: 'EcoTech Marine', category: 'lighting' },
  { name: 'A360X Tuna Blue', brand: 'Kessil', category: 'lighting', popular: true },
  { name: 'AP9X', brand: 'Kessil', category: 'lighting', popular: true },
  { name: 'A160WE Tuna Sun', brand: 'Kessil', category: 'lighting' },
  { name: 'H80 Tuna Flora', brand: 'Kessil', category: 'lighting' },
  { name: 'H160 Tuna Flora', brand: 'Kessil', category: 'lighting' },
  { name: 'XHO LED Strip', brand: 'Reef Brite', category: 'lighting' },
  { name: 'Lumi Lite Pro', brand: 'Reef Brite', category: 'lighting' },
  { name: 'Atlantik iCon', brand: 'Orphek', category: 'lighting' },
  { name: 'OR3 Bar LED', brand: 'Orphek', category: 'lighting' },
  { name: 'ReefLED 90', brand: 'Red Sea', category: 'lighting' },
  { name: 'ReefLED 160S', brand: 'Red Sea', category: 'lighting' },
  { name: 'Aqua Knight V2', brand: 'Hipargero', category: 'lighting' },
  { name: 'Classic LED Plus', brand: 'Nicrew', category: 'lighting' },
  { name: 'Marine LED 30W', brand: 'NICREW', category: 'lighting' },
  { name: 'Orbit Marine IC Pro', brand: 'Current USA', category: 'lighting' },
  { name: 'Marine Nano LED', brand: 'Fluval', category: 'lighting' },
  { name: 'Marine 3.0 LED', brand: 'Fluval', category: 'lighting' },
  { name: 'Timer Pro V2 165W', brand: 'Viparspectra', category: 'lighting' },
  { name: 'Dimmable 165W', brand: 'Mars Aqua', category: 'lighting' },
  { name: 'SP200 LED', brand: 'MarsHydra', category: 'lighting' },
  { name: 'K7 Pro V2 LED', brand: 'SANRISE', category: 'lighting' },
  { name: 'Mini LED Aquarium Light', brand: 'LOMINIE', category: 'lighting' },
  { name: 'AP700 LED', brand: 'PopBloom', category: 'lighting' },
  { name: 'LED Reef Light 55x3W', brand: 'Galaxyhydro', category: 'lighting' },
  { name: 'Sunpower 8x39W T5HO', brand: 'ATI', category: 'lighting', popular: true },
  { name: 'Sunpower 6x39W T5HO', brand: 'ATI', category: 'lighting' },
  { name: 'T5HO Hybrid 36"', brand: 'Aquatic Life', category: 'lighting' },
  { name: 'MQ-510 PAR Meter', brand: 'Apogee', category: 'lighting' },
  { name: 'Reef Monitor PAR', brand: 'Seneye', category: 'lighting' },
  { name: 'AI Fuge Light', brand: 'Aqua Illumination', category: 'lighting' },

  // ── Circulation (35 items) ───────────────────────────────────
  { name: 'Nero 3', brand: 'Aqua Illumination', category: 'circulation' },
  { name: 'Nero 5', brand: 'Aqua Illumination', category: 'circulation', popular: true },
  { name: 'Nero 7', brand: 'Aqua Illumination', category: 'circulation' },
  { name: 'VorTech MP10', brand: 'EcoTech Marine', category: 'circulation', popular: true },
  { name: 'VorTech MP40', brand: 'EcoTech Marine', category: 'circulation', popular: true },
  { name: 'VorTech MP60', brand: 'EcoTech Marine', category: 'circulation' },
  { name: 'Turbelle Nanostream 6095', brand: 'Tunze', category: 'circulation', popular: true },
  { name: 'Turbelle Stream 6105', brand: 'Tunze', category: 'circulation' },
  { name: 'Turbelle Nanostream 6040', brand: 'Tunze', category: 'circulation' },
  { name: 'Turbelle Stream 6055', brand: 'Tunze', category: 'circulation' },
  { name: 'Turbelle Stream 6085', brand: 'Tunze', category: 'circulation' },
  { name: 'Silence 1073.050 Return', brand: 'Tunze', category: 'circulation' },
  { name: 'Comline Pump 2500', brand: 'Tunze', category: 'circulation' },
  { name: 'SLW-10 Sine Wave', brand: 'Jebao', category: 'circulation' },
  { name: 'SLW-20 Sine Wave', brand: 'Jebao', category: 'circulation' },
  { name: 'SLW-30 Sine Wave', brand: 'Jebao', category: 'circulation' },
  { name: 'SOW-4 Wave Maker', brand: 'Jebao', category: 'circulation' },
  { name: 'SOW-8 Wave Maker', brand: 'Jebao', category: 'circulation' },
  { name: 'SOW-16 Wave Maker', brand: 'Jebao', category: 'circulation' },
  { name: 'OW-10 Wave Maker', brand: 'Jebao', category: 'circulation' },
  { name: 'OW-25 Wave Maker', brand: 'Jebao', category: 'circulation' },
  { name: 'OW-40 Wave Maker', brand: 'Jebao', category: 'circulation' },
  { name: 'DCP-5000 Return Pump', brand: 'Jebao', category: 'circulation' },
  { name: 'DCP-8000 Return Pump', brand: 'Jebao', category: 'circulation' },
  { name: 'DCT-6000 Return Pump', brand: 'Jebao', category: 'circulation' },
  { name: 'Gyre XF250', brand: 'Maxspect', category: 'circulation' },
  { name: 'Gyre XF350', brand: 'Maxspect', category: 'circulation' },
  { name: 'IceCap Gyre 1K', brand: 'IceCap', category: 'circulation' },
  { name: 'Syncra SDC 7.0', brand: 'Sicce', category: 'circulation' },
  { name: 'Syncra SDC 9.0', brand: 'Sicce', category: 'circulation' },
  { name: 'Voyager Nano', brand: 'Sicce', category: 'circulation' },
  { name: 'Syncra Silent 3.0', brand: 'Sicce', category: 'circulation' },
  { name: 'Syncra Silent 5.0', brand: 'Sicce', category: 'circulation' },
  { name: 'Mover MX11600', brand: 'Rossmont', category: 'circulation' },
  { name: 'Mover MX15200', brand: 'Rossmont', category: 'circulation' },
  { name: 'CompactON 5000', brand: 'Eheim', category: 'circulation' },
  { name: 'VarioS-4 Return Pump', brand: 'Reef Octopus', category: 'circulation', popular: true },
  { name: 'VarioS-6 Return Pump', brand: 'Reef Octopus', category: 'circulation' },
  { name: 'Water Blaster HY-3000', brand: 'Water Blaster', category: 'circulation' },
  { name: 'Water Blaster HY-5000', brand: 'Water Blaster', category: 'circulation' },
  { name: 'Mag Drive 7', brand: 'Danner', category: 'circulation' },
  { name: 'Mag Drive 9.5', brand: 'Danner', category: 'circulation' },
  { name: 'DC-6000 Return Pump', brand: 'Waveline', category: 'circulation' },
  { name: 'Koralia 3G', brand: 'Hydor', category: 'circulation' },
  { name: 'Circulation Pump 700', brand: 'Aqueon', category: 'circulation' },

  // ── Filtration (40 items) ────────────────────────────────────
  // Protein Skimmers
  { name: 'Classic 150-INT', brand: 'Reef Octopus', category: 'filtration', popular: true },
  { name: 'Classic 200-INT', brand: 'Reef Octopus', category: 'filtration' },
  { name: 'Regal 200-INT', brand: 'Reef Octopus', category: 'filtration', popular: true },
  { name: 'Regal 250-INT', brand: 'Reef Octopus', category: 'filtration' },
  { name: 'AE-EC Protein Skimmer', brand: 'Aqua Excel', category: 'filtration' },
  { name: 'Comline DOC 9004', brand: 'Tunze', category: 'filtration' },
  { name: 'Comline DOC 9012', brand: 'Tunze', category: 'filtration' },
  { name: 'Curve 5', brand: 'Bubble Magus', category: 'filtration', popular: true },
  { name: 'Curve 7', brand: 'Bubble Magus', category: 'filtration' },
  { name: 'Simplicity 120DC', brand: 'Simplicity', category: 'filtration' },
  { name: 'Simplicity 240DC', brand: 'Simplicity', category: 'filtration' },
  { name: 'Quantum 120', brand: 'Nyos', category: 'filtration' },
  { name: 'Quantum 160', brand: 'Nyos', category: 'filtration' },
  { name: 'S-120 Protein Skimmer', brand: 'Eshopps', category: 'filtration' },
  { name: 'S-200 Protein Skimmer', brand: 'Eshopps', category: 'filtration' },
  { name: 'SCA-301 Protein Skimmer', brand: 'SCA', category: 'filtration' },
  { name: 'SCA-302 Protein Skimmer', brand: 'SCA', category: 'filtration' },
  { name: 'SC 1455 Skimmer', brand: 'Deltec', category: 'filtration' },
  { name: 'Omega 150 Skimmer', brand: 'Vertex', category: 'filtration' },
  // Reactors
  { name: 'GFO/Carbon Reactor', brand: 'BRS', category: 'filtration' },
  { name: 'Dual Reactor', brand: 'BRS', category: 'filtration' },
  { name: 'PhosBan Reactor 150', brand: 'Two Little Fishies', category: 'filtration' },
  { name: 'MR1 Media Reactor', brand: 'Avast Marine', category: 'filtration' },
  { name: 'MR10 Media Reactor', brand: 'NextReef', category: 'filtration' },
  { name: 'BR-70 BioPellet Reactor', brand: 'Reef Octopus', category: 'filtration' },
  // Filter Media
  { name: 'Matrix Bio Media', brand: 'Seachem', category: 'filtration' },
  { name: 'MarinePure Block', brand: 'CerMedia', category: 'filtration', popular: true },
  { name: 'MarinePure Spheres', brand: 'CerMedia', category: 'filtration' },
  { name: 'Siporax 15mm', brand: 'Sera', category: 'filtration' },
  // Filter Rollers
  { name: 'Klir Di-4 Automatic Filter', brand: 'CoralVue', category: 'filtration' },
  { name: 'Klir Di-7 Automatic Filter', brand: 'CoralVue', category: 'filtration' },
  { name: 'Rollermat Compact', brand: 'Theiling', category: 'filtration' },
  { name: 'Smart ATO Roller', brand: 'AutoAqua', category: 'filtration' },
  // UV Sterilizers
  { name: 'Classic UV 8W', brand: 'Aqua Ultraviolet', category: 'filtration' },
  { name: 'Classic UV 15W', brand: 'Aqua Ultraviolet', category: 'filtration' },
  { name: 'Turbo Twist 3x 9W', brand: 'Coralife', category: 'filtration' },
  { name: 'SUBMarine UV 13W', brand: 'JBJ', category: 'filtration' },
  { name: 'Smart UV Lite 40W', brand: 'Pentair', category: 'filtration' },
  // Carbon & GFO
  { name: 'ROX 0.8 Carbon', brand: 'BRS', category: 'filtration' },
  { name: 'Bulk Activated Carbon', brand: 'BRS', category: 'filtration' },
  { name: 'Chemi-Pure Elite', brand: 'Boyd', category: 'filtration', popular: true },
  { name: 'Chemi-Pure Blue', brand: 'Boyd', category: 'filtration' },
  { name: 'BRS GFO High Capacity', brand: 'BRS', category: 'filtration' },
  { name: 'RowaPhos GFO', brand: 'Rowa', category: 'filtration', popular: true },
  { name: 'PhosGuard', brand: 'Seachem', category: 'filtration' },
  // Fuge Lights (now under filtration since refugium is part of filtration)
  { name: 'Fuge Light', brand: 'Aqua Illumination', category: 'filtration' },
  // Ozone
  { name: '100mg Ozone Generator', brand: 'Enaly', category: 'filtration' },

  // ── Water Management (30 items) ──────────────────────────────
  // ATO
  { name: 'Osmolator 3155 ATO', brand: 'Tunze', category: 'water_management', popular: true },
  { name: 'Smart ATO Micro', brand: 'AutoAqua', category: 'water_management', popular: true },
  { name: 'Smart ATO Duo', brand: 'AutoAqua', category: 'water_management' },
  { name: 'Duetto ATO', brand: 'XP Aqua', category: 'water_management' },
  { name: 'Smart Level ATO', brand: 'Hydor', category: 'water_management' },
  { name: 'Osmo Controller ATO', brand: 'Elos', category: 'water_management' },
  { name: 'Reef Fill ATO', brand: 'IceCap', category: 'water_management' },
  // Dosers
  { name: 'ReefDose 2', brand: 'Red Sea', category: 'water_management' },
  { name: 'ReefDose 4', brand: 'Red Sea', category: 'water_management', popular: true },
  { name: 'GHL Doser 2.1 SA', brand: 'GHL', category: 'water_management' },
  { name: 'Kamoer X1 Pro2 Doser', brand: 'Kamoer', category: 'water_management' },
  { name: 'BRS 1.1mL Dosing Pump', brand: 'BRS', category: 'water_management' },
  { name: 'DP-4 Dosing Pump', brand: 'Jebao', category: 'water_management' },
  { name: 'T11 Dosing Pump', brand: 'Bubble Magus', category: 'water_management' },
  { name: 'T01 Dosing Pump', brand: 'Bubble Magus', category: 'water_management' },
  { name: 'WiFi Doser D4', brand: 'Coral Box', category: 'water_management' },
  { name: 'DOS Fluid Metering System', brand: 'Neptune Systems', category: 'water_management', popular: true },
  // RODI
  { name: '4-Stage Value Plus RODI', brand: 'BRS', category: 'water_management', popular: true },
  { name: 'Barracuda RODI', brand: 'AquaFX', category: 'water_management' },
  { name: 'Hydra 32 RODI', brand: 'AquaFX', category: 'water_management' },
  { name: 'MaxCap 90GPD RODI', brand: 'SpectraPure', category: 'water_management' },
  { name: 'CSPDI 90GPD RODI', brand: 'SpectraPure', category: 'water_management' },
  { name: 'Twist-In RODI System', brand: 'Aquatic Life', category: 'water_management' },
  { name: 'Pure-Flo II RODI', brand: 'Coralife', category: 'water_management' },
  // Salt Mixes
  { name: 'Coral Pro Salt', brand: 'Red Sea', category: 'water_management', popular: true },
  { name: 'Reef Crystals', brand: 'Instant Ocean', category: 'water_management' },
  { name: 'Instant Ocean Salt', brand: 'Instant Ocean', category: 'water_management' },
  { name: 'RPM Reef Pro Mix', brand: 'Fritz', category: 'water_management' },
  { name: 'Pro Reef Salt', brand: 'Tropic Marin', category: 'water_management' },
  { name: 'HW Marinemix Reefer', brand: 'HW', category: 'water_management' },
  // Refractometers
  { name: 'MA887 Digital Refractometer', brand: 'Milwaukee', category: 'water_management', popular: true },
  { name: 'Dual-Scale Refractometer', brand: 'BRS', category: 'water_management' },

  // ── Heating (18 items) ───────────────────────────────────────
  // Heaters
  { name: 'Jager TruTemp 150W', brand: 'Eheim', category: 'heating', popular: true },
  { name: 'Jager TruTemp 250W', brand: 'Eheim', category: 'heating' },
  { name: 'Neo-Therm 150W', brand: 'Cobalt Aquatics', category: 'heating', popular: true },
  { name: 'Neo-Therm 200W', brand: 'Cobalt Aquatics', category: 'heating' },
  { name: 'Theo 200W', brand: 'Hydor', category: 'heating' },
  { name: 'Theo 300W', brand: 'Hydor', category: 'heating' },
  { name: 'Pro 200W Heater', brand: 'Aqueon', category: 'heating' },
  { name: 'M Series 200W', brand: 'Fluval', category: 'heating' },
  { name: 'M Series 300W', brand: 'Fluval', category: 'heating' },
  { name: 'True Temp Titanium 300W', brand: 'JBJ', category: 'heating' },
  { name: 'Titanium Heater 200W', brand: 'BRS', category: 'heating' },
  { name: 'Titanium Heater 300W', brand: 'BRS', category: 'heating' },
  { name: 'Titanium Heater 500W', brand: 'BRS', category: 'heating' },
  { name: 'HMX 200W Titanium', brand: 'Finnex', category: 'heating' },
  { name: 'HMX 300W Titanium', brand: 'Finnex', category: 'heating' },
  // Temperature Controllers
  { name: 'ITC-306A WiFi Controller', brand: 'Inkbird', category: 'heating' },
  { name: 'ITC-308 Temperature Controller', brand: 'Inkbird', category: 'heating', popular: true },
  { name: 'ITC-310T Timer Controller', brand: 'Inkbird', category: 'heating' },
  { name: 'ETC-111000 Controller', brand: 'Ranco', category: 'heating' },
  // Chillers
  { name: 'Arctica 1/10 HP Chiller', brand: 'JBJ', category: 'heating' },
  { name: 'Arctica 1/5 HP Chiller', brand: 'JBJ', category: 'heating' },
  { name: 'TK500 Chiller', brand: 'Teco', category: 'heating' },
  { name: 'IceProbe Thermoelectric Chiller', brand: 'CoolWorks', category: 'heating' },

  // ── Testing (28 items) ───────────────────────────────────────
  // Hanna Checkers
  { name: 'HI772 Alkalinity Checker', brand: 'Hanna Instruments', category: 'testing', popular: true },
  { name: 'HI713 Phosphate Checker', brand: 'Hanna Instruments', category: 'testing', popular: true },
  { name: 'HI758 Calcium Checker', brand: 'Hanna Instruments', category: 'testing' },
  { name: 'HI781 Nitrate Checker', brand: 'Hanna Instruments', category: 'testing' },
  { name: 'HI774 Phosphate ULR Checker', brand: 'Hanna Instruments', category: 'testing' },
  { name: 'HI98107 pH Checker', brand: 'Hanna Instruments', category: 'testing' },
  { name: 'HI98319 Salinity Checker', brand: 'Hanna Instruments', category: 'testing' },
  { name: 'HI747 Copper Checker', brand: 'Hanna Instruments', category: 'testing' },
  // Test Kit Brands
  { name: 'Reef Foundation Pro Kit', brand: 'Red Sea', category: 'testing' },
  { name: 'Coral Colors Pro Kit', brand: 'Red Sea', category: 'testing' },
  { name: 'Alkalinity Test Kit', brand: 'Salifert', category: 'testing', popular: true },
  { name: 'Calcium Test Kit', brand: 'Salifert', category: 'testing' },
  { name: 'Magnesium Test Kit', brand: 'Salifert', category: 'testing' },
  { name: 'Nitrate/Nitrite Test Kit', brand: 'Salifert', category: 'testing' },
  { name: 'Reefer Test Kit', brand: 'Nyos', category: 'testing' },
  { name: 'Expert KH/Alk Test', brand: 'Fauna Marin', category: 'testing' },
  { name: 'Aqua Test Kit', brand: 'Elos', category: 'testing' },
  { name: 'MultiTest Marine pH/Alk', brand: 'Seachem', category: 'testing' },
  { name: 'Saltwater Master Kit', brand: 'API', category: 'testing' },
  // ICP Testing
  { name: 'N-DOC ICP Test', brand: 'Triton', category: 'testing' },
  { name: 'ICP-OES Test Kit', brand: 'ATI', category: 'testing', popular: true },
  { name: 'ICP Analysis Kit', brand: 'Fauna Marin', category: 'testing' },
  // pH Monitors / Probes
  { name: 'Pinpoint pH Monitor', brand: 'American Marine', category: 'testing' },
  { name: 'MC122 pH Controller', brand: 'Milwaukee', category: 'testing' },
  { name: 'pH Probe', brand: 'Neptune Systems', category: 'testing' },
  { name: 'ORP Probe', brand: 'Neptune Systems', category: 'testing' },
  { name: 'Conductivity Probe', brand: 'Neptune Systems', category: 'testing' },
  // Automated Testers
  { name: 'Trident', brand: 'Neptune Systems', category: 'testing', popular: true },
  { name: 'KH Director', brand: 'GHL', category: 'testing', popular: true },

  // ── Controller (18 items) ────────────────────────────────────
  // Neptune Apex ecosystem
  { name: 'Apex Controller System', brand: 'Neptune Systems', category: 'controller', popular: true },
  { name: 'Apex EL', brand: 'Neptune Systems', category: 'controller' },
  { name: 'Energy Bar 832', brand: 'Neptune Systems', category: 'controller', popular: true },
  { name: 'FMM Fluid Monitoring Module', brand: 'Neptune Systems', category: 'controller' },
  { name: 'PM2 Probe Module', brand: 'Neptune Systems', category: 'controller' },
  { name: 'WAV Module', brand: 'Neptune Systems', category: 'controller' },
  { name: 'ATK Auto Top-Off Kit', brand: 'Neptune Systems', category: 'controller' },
  // GHL ecosystem
  { name: 'ProfiLux 4', brand: 'GHL', category: 'controller', popular: true },
  { name: 'ProfiLux Mini', brand: 'GHL', category: 'controller' },
  { name: 'Doser 2.1 Standalone', brand: 'GHL', category: 'controller' },
  { name: 'ION Director', brand: 'GHL', category: 'controller' },
  { name: 'PowerBar 6', brand: 'GHL', category: 'controller' },
  // Others
  { name: 'Hydros Control 4', brand: 'CoralVue', category: 'controller' },
  { name: 'Hydros Control X4', brand: 'CoralVue', category: 'controller' },
  { name: 'Reef Angel Plus', brand: 'Reef Angel', category: 'controller' },
  { name: 'Reef Angel Basic', brand: 'Reef Angel', category: 'controller' },
  { name: 'Seneye Reef Monitor', brand: 'Seneye', category: 'controller' },
  { name: 'IceCap ATO Controller', brand: 'IceCap', category: 'controller' },

  // ── Sump & Tanks (22 items) ──────────────────────────────────
  // Sumps
  { name: 'Ruby 36 Sump', brand: 'Trigger Systems', category: 'sump', popular: true },
  { name: 'Crystal 30 Sump', brand: 'Trigger Systems', category: 'sump' },
  { name: 'Triton 34 Sump', brand: 'Trigger Systems', category: 'sump' },
  { name: 'Triton 44 Sump', brand: 'Trigger Systems', category: 'sump' },
  { name: 'Emerald 34 Sump', brand: 'Trigger Systems', category: 'sump' },
  { name: 'Emerald 39 Sump', brand: 'Trigger Systems', category: 'sump' },
  { name: 'Eshopps RS-100 Sump', brand: 'Eshopps', category: 'sump' },
  { name: 'Eshopps R-200 Sump', brand: 'Eshopps', category: 'sump' },
  { name: 'Eshopps R-300 Sump', brand: 'Eshopps', category: 'sump' },
  { name: 'Fiji Cube Sump 20x12', brand: 'Fiji Cube', category: 'sump' },
  { name: 'Fiji Cube Sump 24', brand: 'Fiji Cube', category: 'sump', popular: true },
  { name: 'Fiji Cube Sump 36', brand: 'Fiji Cube', category: 'sump' },
  { name: 'Pro Series Sump 24', brand: 'Fiji Cube', category: 'sump' },
  { name: 'IceCap 30 Sump', brand: 'IceCap', category: 'sump' },
  { name: 'Signature Series 30 Sump', brand: 'Bashsea', category: 'sump' },
  { name: 'Synergy Shadow Overflow Sump', brand: 'Synergy Reef', category: 'sump' },
  // AIO Tanks
  { name: 'AIO 20 Cube', brand: 'Waterbox', category: 'sump', popular: true },
  { name: 'Peninsula 48.3', brand: 'Waterbox', category: 'sump' },
  { name: 'Evo 13.5', brand: 'Fluval', category: 'sump', popular: true },
  { name: 'Nuvo Fusion 20', brand: 'Innovative Marine', category: 'sump' },
  { name: 'Nano Cube 28 LED', brand: 'JBJ', category: 'sump' },
  { name: 'MAX Nano Cube', brand: 'Red Sea', category: 'sump' },
  { name: 'BioCube 32', brand: 'Coralife', category: 'sump' },
  { name: 'Custom/DIY Sump', brand: 'DIY', category: 'sump' },

  // ── Accessories (30 items) ───────────────────────────────────
  // Dosing Containers
  { name: '1.5L Dosing Container', brand: 'BRS', category: 'accessories' },
  { name: '5L Dosing Container Set', brand: 'Kamoer', category: 'accessories' },
  // Magnetic Cleaners
  { name: 'Flipper Standard', brand: 'Flipper', category: 'accessories', popular: true },
  { name: 'Flipper Max', brand: 'Flipper', category: 'accessories' },
  { name: 'Flipper Nano', brand: 'Flipper', category: 'accessories' },
  { name: 'Mag-Float Large', brand: 'Mag-Float', category: 'accessories' },
  { name: 'Mag-Float Small', brand: 'Mag-Float', category: 'accessories' },
  { name: 'Care Magnet Strong', brand: 'Tunze', category: 'accessories' },
  // Feeding Tools
  { name: "Julian's Thing Target Feeder", brand: 'Two Little Fishies', category: 'accessories' },
  { name: 'Coral Frenzy Pellets', brand: 'Coral Frenzy', category: 'accessories' },
  { name: 'Reef Roids', brand: 'Polyp Lab', category: 'accessories', popular: true },
  { name: 'Reef Energy Plus AB+', brand: 'Red Sea', category: 'accessories' },
  // Coral Dips
  { name: 'CoralRX Pro Dip', brand: 'CoralRX', category: 'accessories', popular: true },
  { name: 'Bayer Insect Killer (Dip)', brand: 'Bayer', category: 'accessories' },
  { name: "Lugol's Iodine Solution", brand: 'Brightwell', category: 'accessories' },
  { name: 'Coral Revive Dip', brand: 'Two Little Fishies', category: 'accessories' },
  { name: 'Tmpro Coral Dip', brand: 'Tropic Marin', category: 'accessories' },
  // Frag Supplies
  { name: 'Frag Plugs 100pk', brand: 'BRS', category: 'accessories' },
  { name: 'Frag Rack Magnetic', brand: 'IceCap', category: 'accessories' },
  { name: 'IC-Gel Super Glue', brand: 'IC Gel', category: 'accessories', popular: true },
  { name: 'BSI Insta-Cure Super Glue', brand: 'BSI', category: 'accessories' },
  { name: 'Loctite Gel Super Glue', brand: 'Loctite', category: 'accessories' },
  { name: 'Coral Epoxy Putty', brand: 'Two Little Fishies', category: 'accessories' },
  // Probe Holders & Mounts
  { name: 'Probe Holder Magnetic', brand: 'IceCap', category: 'accessories' },
  { name: 'Multi-Probe Holder', brand: 'Avast Marine', category: 'accessories' },
  { name: 'Neptune Probe Rack', brand: 'Neptune Systems', category: 'accessories' },
  // Misc Maintenance
  { name: 'Gravel Vacuum Mini', brand: 'Python', category: 'accessories' },
  { name: 'No Spill Clean & Fill', brand: 'Python', category: 'accessories' },
  { name: 'Turkey Baster 12"', brand: 'Generic', category: 'accessories' },
  { name: 'Aquascape Epoxy', brand: 'MarcoRocks', category: 'accessories' },
];

/**
 * Search the equipment catalog by query string.
 * Case-insensitive match on name + brand.
 * Optionally filter by category.
 * Returns popular items first, then alphabetical. Max 12 results.
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

  return items.slice(0, 12);
}
