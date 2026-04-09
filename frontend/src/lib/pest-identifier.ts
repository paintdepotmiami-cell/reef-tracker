/**
 * Pest Identifier — Expert-level pest/disease identification engine.
 *
 * Uses visual symptom matching + keyword analysis to identify common
 * reef pests and diseases. Provides expert-level treatment protocols
 * with safety warnings from marine biologists.
 *
 * CRITICAL RULES (from experts):
 * - NEVER medicate the display tank with copper (kills corals + inverts)
 * - NEVER physically remove Aiptasia (fragments regenerate)
 * - Cyanobacteria is NOT algae — it's a bacteria
 * - Ich requires 76-day fallow period for display tank
 */

export interface PestMatch {
  id: string;
  name: string;
  nameEs: string;
  confidence: 'high' | 'medium' | 'low';
  icon: string;
  color: string;
  category: 'parasite' | 'pest' | 'bacteria' | 'algae' | 'disease';
  urgency: 'critical' | 'high' | 'medium' | 'low';
  image_keywords: string[]; // what AI vision would look for
  visual_signs: string[];
  behavioral_signs: string[];
  dangerous_mistakes: { action: string; consequence: string }[];
  treatment: {
    immediate: string[];
    long_term: string[];
    biological: string[];
    products: { name: string; purpose: string }[];
  };
  prevention: string[];
  science: string; // brief biology explanation
}

export const PEST_DATABASE: PestMatch[] = [
  // ── CRITICAL: Marine Ich ────────────────────────────────
  {
    id: 'ich',
    name: 'Marine Ich (White Spot Disease)',
    nameEs: 'Punto Blanco Marino',
    confidence: 'high',
    icon: 'coronavirus',
    color: '#ff4444',
    category: 'parasite',
    urgency: 'critical',
    image_keywords: ['white dots', 'salt grains', 'spots on fins', 'spots on body'],
    visual_signs: [
      'White dots up to 1mm on body and fins (like grains of salt)',
      'Dots may appear and disappear in cycles (3-day lifecycle)',
      'Cloudy eyes in advanced cases',
      'Frayed or damaged fins',
    ],
    behavioral_signs: [
      'Fish scratching/flashing against rocks (most telltale sign)',
      'Rapid breathing and gill irritation',
      'Clamped fins held close to body',
      'Hiding, loss of appetite, lethargy',
      'Swimming erratically or darting',
    ],
    dangerous_mistakes: [
      {
        action: 'Adding copper medication to the display tank',
        consequence: 'WILL KILL all corals, snails, shrimp, crabs, and invertebrates INSTANTLY. Copper is lethal to all invertebrate life and impossible to fully remove from rock.',
      },
      {
        action: 'Doing nothing and hoping it goes away',
        consequence: 'Ich never leaves the system. The parasite encysts in the sandbed and reinfects fish in cycles, getting worse each time until fish die.',
      },
      {
        action: 'Only treating the visibly sick fish',
        consequence: 'ALL fish in the display carry the parasite even if asymptomatic. The display needs 76 days fallow (no fish) to break the lifecycle.',
      },
    ],
    treatment: {
      immediate: [
        'Move ALL fish to a separate quarantine/hospital tank',
        'In QT: treat with copper sulfate (Copper Power) at therapeutic 2.0 ppm for 30 days',
        'Monitor copper levels DAILY with a copper test kit — too low = ineffective, too high = toxic',
        'Keep QT temperature at 78-80°F with good aeration',
        'Feed garlic-soaked food to boost immune response',
      ],
      long_term: [
        'Keep display tank FALLOW (fish-free) for minimum 76 days at 76°F',
        'Corals, snails, crabs can stay in display — Ich only affects fish',
        'After 76 days, the parasite lifecycle breaks and display is safe',
        'Before returning fish, do a water change on the display',
        'ALL future fish must be quarantined 30 days before entering display',
      ],
      biological: [
        'Cleaner shrimp (Lysmata amboinensis) pick parasites off fish — supportive only, NOT a cure',
        'Neon gobies also clean fish — again supportive, not curative',
      ],
      products: [
        { name: 'Copper Power', purpose: 'Copper treatment for QT (ionic copper, easier to dose)' },
        { name: 'Hanna Copper Checker', purpose: 'Precise copper level testing during treatment' },
        { name: 'Seachem Garlic Guard', purpose: 'Garlic soak for food — immune booster' },
        { name: 'UV Sterilizer', purpose: 'Kills free-swimming parasites in display water column' },
      ],
    },
    prevention: [
      'Quarantine ALL new fish for 30 days with prophylactic copper treatment',
      'Never add fish directly to display — no exceptions',
      'Maintain stable temperature (swings weaken immune system)',
      'Keep fish well-fed with varied, vitamin-enriched diet',
      'Run a UV sterilizer on the display as a secondary defense',
    ],
    science: 'Cryptocaryon irritans is an obligate parasite with a 3-phase lifecycle: trophont (feeding on fish), protomont (drops off, encysts in substrate), and theront (free-swimming, seeking new host). Copper kills the theront stage. The display must be fallow long enough for all encysted protomonts to hatch and die without a fish host.',
  },

  // ── CRITICAL: Aiptasia ────────────────────────────────
  {
    id: 'aiptasia',
    name: 'Aiptasia (Glass Anemone)',
    nameEs: 'Aiptasia (Anémona de Cristal)',
    confidence: 'high',
    icon: 'pest_control',
    color: '#FF7F50',
    category: 'pest',
    urgency: 'high',
    image_keywords: ['small anemone', 'translucent', 'brown anemone', 'tentacles', 'clear polyp'],
    visual_signs: [
      'Small translucent or brown anemones (5mm to 3cm)',
      'Long, thin tentacles radiating from oral disc',
      'Often found in shaded areas, crevices, and overhangs',
      'May be nearly invisible when retracted (looks like a small bump)',
      'Can appear tan, brown, or nearly clear',
    ],
    behavioral_signs: [
      'Nearby corals showing tissue damage or retraction from stinging',
      'Spreading rapidly — new ones appear weekly',
      'Retracts quickly when touched or disturbed',
    ],
    dangerous_mistakes: [
      {
        action: 'Pulling, scraping, or brushing them off rocks',
        consequence: 'Each fragment released into the water will regenerate into a NEW aiptasia. You will multiply the plague exponentially. One becomes dozens.',
      },
      {
        action: 'Crushing them against the rock',
        consequence: 'Same as above — tissue fragments drift and regenerate. Makes the problem 10x worse.',
      },
      {
        action: 'Removing the rock and scrubbing in freshwater',
        consequence: 'Tissue fragments survive and spread when rock is returned. Also kills beneficial bacteria on the rock.',
      },
    ],
    treatment: {
      immediate: [
        'Inject Aiptasia-X or Joe\'s Juice directly into the oral disc',
        'Alternative: inject concentrated lemon juice or kalkwasser paste',
        'Inject slowly until the anemone ingests the solution',
        'Treat ONE at a time, starting with the largest',
        'Turn off flow pumps for 15 min during injection to prevent drift',
      ],
      long_term: [
        'Add peppermint shrimp (Lysmata wurdemanni) — they eat small aiptasia',
        'Berghia nudibranch is the MOST effective biological control',
        'Copperband butterflyfish eat aiptasia but are delicate fish',
        'Matted filefish (Acreichthys tomentosus) also eat them',
        'Reduce nutrients to slow their growth rate',
      ],
      biological: [
        'Peppermint shrimp: 1 per 10 gallons, add several for bad infestations',
        'Berghia nudibranch: the nuclear option — they eat ONLY aiptasia and will starve when done',
        'Copperband butterfly: reef-safe but difficult to keep, needs established tank',
      ],
      products: [
        { name: 'Aiptasia-X (Red Sea)', purpose: 'Targeted injection — most popular solution' },
        { name: 'Joe\'s Juice', purpose: 'Alternative injection compound' },
        { name: 'Kalkwasser paste', purpose: 'DIY injection — mix Ca(OH)2 with RODI to a paste' },
      ],
    },
    prevention: [
      'DIP all new corals in CoralRx or Bayer before adding to display',
      'Inspect frag plugs under magnification — tiny aiptasia are nearly invisible',
      'Keep 2-3 peppermint shrimp as permanent biological defense',
      'Act FAST when you see the first one — they multiply exponentially',
    ],
    science: 'Aiptasia reproduce via pedal laceration — they literally tear off pieces of their foot that regenerate into clones. This is why physical removal always fails. They also reproduce sexually, releasing larvae into the water column. A single aiptasia can colonize an entire tank in weeks.',
  },

  // ── HIGH: Cyanobacteria ────────────────────────────────
  {
    id: 'cyanobacteria',
    name: 'Cyanobacteria (Red Slime)',
    nameEs: 'Cianobacteria (Limo Rojo)',
    confidence: 'high',
    icon: 'water_damage',
    color: '#F1C40F',
    category: 'bacteria',
    urgency: 'high',
    image_keywords: ['red slime', 'purple mat', 'slimy film', 'red film on sand', 'bubble mat'],
    visual_signs: [
      'Slimy mat of red, burgundy, or dark purple color',
      'Covers sand bed, rocks, and even corals',
      'Peels off in sheets when disturbed',
      'Bubbles forming under/within the slime mat (photosynthesis)',
      'Can be bright red, dark purple, or nearly black',
    ],
    behavioral_signs: [
      'Appears first in low-flow areas (dead spots)',
      'Grows rapidly under lights, recedes slightly at night',
      'Musty or earthy smell from the tank',
      'Corals underneath begin to suffocate and bleach',
    ],
    dangerous_mistakes: [
      {
        action: 'Treating it like algae and adding algae-eating CUC',
        consequence: 'Cyanobacteria is NOT algae — it\'s a photosynthetic bacteria. Snails, urchins, and crabs will not eat it. Wrong diagnosis = wasted money.',
      },
      {
        action: 'Ignoring it hoping it resolves',
        consequence: 'Cyano can smother corals and crash oxygen levels at night. It gets worse without intervention.',
      },
    ],
    treatment: {
      immediate: [
        'Test Nitrates and Phosphates immediately — cyano signals nutrient imbalance',
        'Increase flow: reposition powerheads to eliminate ALL dead spots',
        'Siphon cyano out during water changes (do not scrub into water)',
        'Reduce photoperiod to 6 hours temporarily',
        'Increase protein skimmer output',
      ],
      long_term: [
        'If persistent: dose Chemiclean (follow directions EXACTLY)',
        'When using Chemiclean: increase aeration dramatically (airstone)',
        'Run GFO/RowaPhos to reduce phosphates to <0.03 ppm',
        'Add/improve the refugium with chaetomorpha',
        'Clean filter socks every 2-3 days to reduce organic waste',
        'Replace aging light bulbs (shifted spectrum promotes cyano)',
      ],
      biological: [
        'Vibrant Liquid (bacteria-based treatment) can outcompete cyano',
        'Nassarius snails help stir sand bed and prevent dead spots',
        'Strong refugium with chaeto competes for the same nutrients',
      ],
      products: [
        { name: 'Chemiclean', purpose: 'Targeted antibiotic for cyanobacteria (use as last resort)' },
        { name: 'Vibrant (Underwater Creations)', purpose: 'Bacterial competition — fights cyano and other nuisance organisms' },
        { name: 'RowaPhos', purpose: 'Phosphate removal — reduces cyano fuel' },
      ],
    },
    prevention: [
      'Maintain strong, varied flow — no dead spots anywhere',
      'Keep phosphates below 0.03 ppm',
      'Feed conservatively and clean filter socks regularly',
      'Replace T5 bulbs every 9-12 months (spectral shift feeds cyano)',
      'Run a healthy refugium as nutrient competition',
    ],
    science: 'Cyanobacteria are among the oldest organisms on Earth (3.5 billion years). They are photosynthetic bacteria, not algae, which is why algae treatments don\'t work. They thrive in high-nutrient, low-flow conditions and produce toxins that can stress fish and corals. The bubbles you see are oxygen from photosynthesis.',
  },

  // ── MEDIUM: Flatworms ────────────────────────────────
  {
    id: 'flatworms',
    name: 'Red Planaria (Flatworms)',
    nameEs: 'Planarias Rojas',
    confidence: 'medium',
    icon: 'bug_report',
    color: '#FF7F50',
    category: 'pest',
    urgency: 'medium',
    image_keywords: ['flat red worms', 'oval worms', 'rust colored', 'worms on coral', 'worms on glass'],
    visual_signs: [
      'Small (2-5mm) rust-red or orange oval-shaped worms',
      'Found on glass, rocks, and coral tissue',
      'Move in a gliding motion',
      'Can cover coral tissue in high numbers, blocking light',
    ],
    behavioral_signs: [
      'Corals not opening fully (flatworms blocking light)',
      'Population explodes rapidly in nutrient-rich tanks',
      'Visible during feeding time, attracted to food',
    ],
    dangerous_mistakes: [
      {
        action: 'Killing them all at once with Flatworm Exit without water change prep',
        consequence: 'Dying flatworms release toxins that can wipe out the entire tank. MUST do a massive water change during treatment and run carbon.',
      },
    ],
    treatment: {
      immediate: [
        'Siphon out as many flatworms as possible manually first',
        'Prepare 50% water change BEFORE chemical treatment',
        'Dose Flatworm Exit (Salifert) following instructions exactly',
        'Have fresh carbon and new saltwater ready BEFORE dosing',
        'Immediately after treatment: 50% water change + run carbon',
      ],
      long_term: [
        'Add a six-line wrasse or yellow wrasse (natural predators)',
        'Blue velvet nudibranch (Chelidonura varians) eats flatworms',
        'Reduce nutrients to slow reproduction',
        'Dip new corals in CoralRx — kills flatworms on frags',
      ],
      biological: [
        'Six-line wrasse: aggressive eater of flatworms (but can bully other fish)',
        'Melanurus wrasse: also eats flatworms, good community fish',
        'Blue velvet nudibranch: dedicated flatworm predator',
      ],
      products: [
        { name: 'Flatworm Exit (Salifert)', purpose: 'Chemical treatment — kills flatworms (prepare water change first!)' },
        { name: 'CoralRx', purpose: 'Coral dip to kill flatworms on new frags' },
      ],
    },
    prevention: [
      'Dip ALL new corals in CoralRx or Bayer before adding',
      'Keep a six-line or melanurus wrasse as biological control',
      'Maintain low nutrients to slow reproduction',
      'Inspect frags closely before purchasing',
    ],
    science: 'Convolutriloba retrogemma reproduce via transverse fission — they literally split in half to clone. This is why populations can explode overnight. They release a toxic chemical when they die, which is why mass die-offs (from treatment) must be paired with immediate water changes.',
  },

  // ── MEDIUM: Montipora-Eating Nudibranchs ────────────
  {
    id: 'monti-nudis',
    name: 'Montipora-Eating Nudibranchs',
    nameEs: 'Nudibranquios Come-Montipora',
    confidence: 'medium',
    icon: 'pest_control',
    color: '#d7ffc5',
    category: 'pest',
    urgency: 'medium',
    image_keywords: ['white spots on montipora', 'tiny white bumps', 'egg spirals', 'montipora damage'],
    visual_signs: [
      'Tiny (1-3mm) white or cream oval-shaped slugs on Montipora',
      'White egg spirals on the underside of Montipora colonies',
      'Bare white skeleton patches on Montipora (tissue eaten away)',
      'Nearly invisible to the naked eye — use a magnifying glass',
    ],
    behavioral_signs: [
      'Montipora losing tissue from the edges inward',
      'Healthy colony suddenly developing bare patches',
      'Problem continues despite stable water parameters',
    ],
    dangerous_mistakes: [
      {
        action: 'Assuming tissue loss is from parameter swings',
        consequence: 'Nudibranchs continue eating unchecked while you chase parameter ghosts. Always inspect Montipora with a magnifying glass when tissue loss occurs.',
      },
    ],
    treatment: {
      immediate: [
        'Remove affected Montipora and dip in CoralRx or Bayer for 10 minutes',
        'Use a turkey baster to blast the coral surface during dip',
        'Inspect with magnification for remaining nudibranchs and egg spirals',
        'Scrape off any egg spirals with a toothpick (they survive dips)',
        'Re-dip 7 days later to catch newly hatched nudibranchs',
      ],
      long_term: [
        'Dip every 7 days for 3-4 weeks to break the egg cycle',
        'Inspect ALL Montipora colonies in the tank',
        'Add wrasses: melanurus, six-line, or yellow coris eat nudibranchs',
        'Quarantine all new Montipora and dip before adding',
      ],
      biological: [
        'Melanurus wrasse: excellent nudibranch predator',
        'Six-line wrasse: picks at rocks and coral bases',
        'Yellow coris wrasse: gentle nudibranch hunter',
      ],
      products: [
        { name: 'CoralRx', purpose: 'Coral dip — removes nudibranchs from coral tissue' },
        { name: 'Bayer Advanced Insect Killer', purpose: 'Alternative coral dip (diluted)' },
      ],
    },
    prevention: [
      'DIP every single new coral — no exceptions',
      'Quarantine new Montipora for 2-3 weeks with weekly dips',
      'Keep wrasses in the tank as biological defense',
      'Inspect Montipora regularly with a flashlight at night',
    ],
    science: 'These tiny aeolid nudibranchs (primarily Phestilla spp.) are obligate Montipora predators. They lay egg spirals that are resistant to dips, hatching in 5-7 days. This is why repeated dipping every week is essential — you must catch each generation before it matures and lays new eggs.',
  },

  // ── HIGH: Dinoflagellates (OTS) ────────────────────────
  {
    id: 'dinoflagellates',
    name: 'Dinoflagellates (Brown Slime)',
    nameEs: 'Dinoflagelados (Limo Café)',
    confidence: 'high',
    icon: 'coronavirus',
    color: '#FF7F50',
    category: 'algae',
    urgency: 'high',
    image_keywords: ['brown slime', 'snotty film', 'brown strings', 'bubbly brown mat', 'dinoflagellates'],
    visual_signs: [
      'Brown, snotty, stringy film on sand, rocks, and coral bases',
      'Appears during lights-on period, partially retracts at night',
      'Air bubbles trapped within the slimy film (oxygen production)',
      'Golden-brown or rust colored — distinct from red cyanobacteria',
      'Has a distinctive "snotty" texture unlike the sheet-like cyanobacteria',
    ],
    behavioral_signs: [
      'Appears in ultra-clean tanks (NO₃ = 0, PO₄ = 0)',
      'Often starts after aggressive GFO or carbon dosing crashes nutrients to zero',
      'Gets worse with water changes (further reduces nutrients)',
      'Corals begin to close and retract as dinos smother them',
      'Fish may show irritation or rapid breathing from dino toxins',
    ],
    dangerous_mistakes: [
      {
        action: 'Doing massive water changes to "clean it up"',
        consequence: 'Water changes further reduce the already-zero nutrients, making the biological vacuum WORSE. Dinos thrive when beneficial bacteria starve.',
      },
      {
        action: 'Adding more GFO or running Phosphat-E',
        consequence: 'Further phosphate removal is EXACTLY what caused the dinos. You are feeding the problem. STOP all nutrient removal immediately.',
      },
      {
        action: 'Treating it like cyanobacteria with Chemiclean',
        consequence: 'Dinoflagellates are NOT bacteria — they are protists (closer to algae). Chemiclean will NOT work and will crash your biological filter, making things worse.',
      },
      {
        action: 'Turning off lights thinking it will die',
        consequence: 'Dinos are mixotrophic — they can switch from photosynthesis to feeding on bacteria. Blackouts are only partially effective and must be combined with nutrient dosing.',
      },
    ],
    treatment: {
      immediate: [
        'STOP all nutrient removal (GFO, Phosphat-E, carbon dosing, biopellets)',
        'Dose potassium nitrate (KNO₃) to raise NO₃ to 5 ppm',
        'Dose sodium phosphate (NaH₂PO₄) to raise PO₄ to 0.03-0.05 ppm',
        'Add live phytoplankton and copepods — biological competition',
        'Increase flow to prevent dinos from settling',
        'Siphon out visible dinos during lights-on (when they\'re exposed)',
      ],
      long_term: [
        'Maintain NO₃ at 2-5 ppm and PO₄ at 0.03+ — NEVER let both hit zero',
        'Seed tank with diverse bacteria (Microbacter7, PodStart)',
        'Run a UV sterilizer to kill free-swimming dinos in water column',
        '3-day blackout (cover tank completely) COMBINED with nutrient dosing — blackout alone fails',
        'Add live copepods monthly — they graze on dinos directly',
        'Increase biodiversity: more CUC, more bacteria, more competition',
      ],
      biological: [
        'Live copepods (Tisbe, Tigriopus) — direct dino grazers and bacterial competitors',
        'Phytoplankton dosing — competes with dinos for light and nutrients',
        'Diverse bacterial supplements restore the microbiome (MicroBacter7, Dr. Tim\'s Waste Away)',
        'Cerith and Nassarius snails disturb sand bed, disrupting dino colonies',
      ],
      products: [
        { name: 'Brightwell NeoNitro', purpose: 'Safely raises NO₃ (potassium nitrate solution)' },
        { name: 'Brightwell NeoPhos', purpose: 'Safely raises PO₄ (sodium phosphate solution)' },
        { name: 'Aquaforest AF Life Source', purpose: 'Live bacteria + copepod mix to restore microbiome' },
        { name: 'UV Sterilizer', purpose: 'Kills free-swimming dino cells in the water column' },
      ],
    },
    prevention: [
      'NEVER crash nutrients to zero — maintain NO₃ 2-5, PO₄ 0.01-0.05 at minimum',
      'Be cautious with GFO, Phosphat-E, and carbon dosing — reduce gradually, never aggressively',
      'Feed your tank adequately — underfed tanks are at risk',
      'Maintain biological diversity: copepods, diverse bacteria, varied CUC',
      'If using 2-Part dosing, keep up with water changes (ionic reset)',
    ],
    science: 'Dinoflagellates are mixotrophic protists — they photosynthesize like plants BUT can also consume bacteria like predators. When nutrients crash to zero, beneficial bacteria starve and die, creating a "biological vacuum". Dinos exploit this vacuum because they can feed on the dying bacteria while also photosynthesizing. This is why nutrient-zero tanks are paradoxically the dirtiest — the ecological balance collapses. The cure is counter-intuitive: ADD nutrients to revive bacterial competition.',
  },

  // ── LOW: Asterina Starfish ────────────────────────────
  {
    id: 'asterina',
    name: 'Asterina Starfish',
    nameEs: 'Estrella Asterina',
    confidence: 'medium',
    icon: 'star',
    color: '#4cd6fb',
    category: 'pest',
    urgency: 'low',
    image_keywords: ['small starfish', 'tiny star', 'star on glass', 'white starfish'],
    visual_signs: [
      'Tiny (3-8mm) starfish on glass and rocks',
      'Often have uneven arm lengths (missing or regenerating arms)',
      'White, tan, or pale green colored',
      'Appear in large numbers seemingly overnight',
    ],
    behavioral_signs: [
      'Mostly seen on glass at night',
      'Population can explode with excess food',
      'Rarely cause coral damage (most are harmless detritivores)',
    ],
    dangerous_mistakes: [
      {
        action: 'Panicking and adding a Harlequin Shrimp',
        consequence: 'Harlequin shrimp ONLY eat starfish and will starve after asterinas are gone. Only add if you commit to feeding it starfish regularly.',
      },
    ],
    treatment: {
      immediate: [
        'In most cases: NO treatment needed — they are harmless detritivores',
        'Manually remove if populations are excessive (pick off glass at night)',
        'Monitor corals for any signs of being eaten (rare but possible)',
      ],
      long_term: [
        'Reduce feeding to control population',
        'Harlequin shrimp will eliminate them (but needs starfish to eat long-term)',
        'Most populations self-regulate over time',
      ],
      biological: [
        'Harlequin shrimp: dedicated starfish predator (will starve without starfish)',
      ],
      products: [],
    },
    prevention: [
      'Inspect new rocks and corals for hitchhikers',
      'Not really preventable — they\'re on almost all live rock',
      'Focus on population management, not elimination',
    ],
    science: 'Asterina starfish reproduce via fission (splitting) and can regenerate from a single arm. Most species are harmless coralline algae and biofilm grazers. A small percentage may nibble on soft coral tissue, but this is uncommon.',
  },
];

/* ─── Fish Behavioral Diagnostics (OTS Module: "¿Qué hace tu pez?") ─── */

export interface BehaviorDiagnosis {
  id: string;
  symptom: string;
  symptomEs: string;
  icon: string;
  color: string;
  diagnoses: {
    condition: string;
    probability: 'high' | 'medium' | 'low';
    description: string;
    immediateAction: string;
    linkTo: string;
  }[];
}

export const FISH_BEHAVIOR_DATABASE: BehaviorDiagnosis[] = [
  {
    id: 'flashing',
    symptom: 'Scratching / Flashing against rocks',
    symptomEs: 'Se rasca contra las rocas (Flashing)',
    icon: 'bolt',
    color: '#ff4444',
    diagnoses: [
      {
        condition: 'External parasites (Ich / Velvet)',
        probability: 'high',
        description: 'Cryptocaryon (Ich) or Amyloodinium (Velvet) irritate the skin and gills. Flashing is the EARLIEST sign — often days before white spots appear.',
        immediateAction: 'Inspect under white LED light. Look for fine white dust (Velvet) or salt-grain dots (Ich). Prepare quarantine tank with copper treatment.',
        linkTo: '/quarantine',
      },
      {
        condition: 'Ammonia / Nitrite irritation',
        probability: 'medium',
        description: 'Elevated NH₃ or NO₂ burns gill tissue, causing the same flashing behavior as parasites. Test water immediately.',
        immediateAction: 'Test NH₃ and NO₂ immediately. If detected, dose Seachem Prime and do an emergency water change.',
        linkTo: '/logs',
      },
      {
        condition: 'Flukes (gill or body)',
        probability: 'low',
        description: 'Monogenean trematodes (flukes) attach to gills or skin. Harder to see than Ich — requires microscope or gill scrape.',
        immediateAction: 'If water params are clean and no visible spots, suspect flukes. Treat in QT with PraziPro (praziquantel).',
        linkTo: '/quarantine',
      },
    ],
  },
  {
    id: 'surface-gasping',
    symptom: 'Gasping at the surface',
    symptomEs: 'Jadea en la superficie',
    icon: 'air',
    color: '#ff4444',
    diagnoses: [
      {
        condition: 'Hypoxia (low dissolved oxygen)',
        probability: 'high',
        description: 'High temperature, poor surface agitation, or overstocking depletes O₂. Fish go to the surface where oxygen concentration is highest.',
        immediateAction: 'Point a powerhead at the surface for agitation. Open the tank lid. If temp is high (>82°F), cool immediately with a fan.',
        linkTo: '/param-center',
      },
      {
        condition: 'Gill damage from nitrite poisoning',
        probability: 'medium',
        description: 'Nitrite (NO₂) binds to hemoglobin, forming methemoglobin which CANNOT carry oxygen. Fish suffocate even in well-oxygenated water.',
        immediateAction: 'Test NO₂ immediately. If >0.1 ppm, dose Seachem Prime and do a 25% water change. Add biological bacteria.',
        linkTo: '/bio-accelerator',
      },
      {
        condition: 'Velvet (Amyloodinium) — advanced stage',
        probability: 'medium',
        description: 'Velvet parasites coat the gills first, destroying gas exchange. By the time fish gasp at surface, infection is severe.',
        immediateAction: 'This is an EMERGENCY. Move fish to QT immediately. Treat with copper at 2.0 ppm. Velvet kills within 24-48 hours at this stage.',
        linkTo: '/quarantine',
      },
    ],
  },
  {
    id: 'appetite-loss',
    symptom: 'Loss of appetite / White stringy feces',
    symptomEs: 'Pérdida de apetito / Heces blancas',
    icon: 'restaurant',
    color: '#FF7F50',
    diagnoses: [
      {
        condition: 'Internal parasites (worms)',
        probability: 'high',
        description: 'White, stringy, mucus-like feces are the hallmark of internal parasites or bacterial infection in the gut. The fish is expelling intestinal lining.',
        immediateAction: 'Isolate in QT and treat with PraziPro (praziquantel) for intestinal worms, or Metroplex (metronidazole) for flagellate parasites. Soak food in garlic.',
        linkTo: '/quarantine',
      },
      {
        condition: 'Bacterial infection (internal)',
        probability: 'medium',
        description: 'Internal bacterial infections cause appetite loss, bloating, and abnormal feces. Often secondary to stress or poor water quality.',
        immediateAction: 'Move to QT. Treat with Kanaplex (kanamycin) in food. Ensure pristine water quality in the QT.',
        linkTo: '/quarantine',
      },
      {
        condition: 'Stress from aggression',
        probability: 'low',
        description: 'A bullied fish stops eating out of stress. Look for torn fins, hiding behavior, and observe which tankmate is the aggressor.',
        immediateAction: 'Observe the tank for 10 minutes at feeding time. If one fish chases others away from food, rearrange rockwork or separate the aggressor.',
        linkTo: '/wishlist',
      },
    ],
  },
  {
    id: 'hiding-lethargy',
    symptom: 'Hiding / Lethargy / Won\'t come out',
    symptomEs: 'Se esconde / Letárgico / No sale',
    icon: 'visibility_off',
    color: '#F1C40F',
    diagnoses: [
      {
        condition: 'Bullying / Territorial aggression',
        probability: 'high',
        description: 'A dominant tankmate has established territory. The hiding fish is avoiding conflict. Common with Damselfish, Dottybacks, and new additions.',
        immediateAction: 'Rearrange the rockwork to reset territories. Add new hiding spots. If aggression is severe, separate the bully.',
        linkTo: '/wishlist',
      },
      {
        condition: 'Thermal shock or parameter swing',
        probability: 'medium',
        description: 'Sudden temperature change (>2°F in hours) or pH/salinity shock causes fish to become lethargic and hide. Often happens after water changes with unmatched water.',
        immediateAction: 'Check temperature and salinity. Match all new water to tank parameters before adding. Stabilize environment and give the fish 24 hours to recover.',
        linkTo: '/param-center',
      },
      {
        condition: 'New arrival acclimation stress',
        probability: 'medium',
        description: 'Newly added fish hide for 3-7 days — this is NORMAL. They are establishing their territory and learning the tank\'s social hierarchy.',
        immediateAction: 'Leave the fish alone. Don\'t rearrange rocks or try to force it out. Offer food near its hiding spot. Most fish emerge within a week.',
        linkTo: '/acclimate',
      },
      {
        condition: 'Disease — early stages',
        probability: 'low',
        description: 'Sick fish instinctively hide to avoid predation. If hiding persists beyond 3 days with appetite loss, disease is likely.',
        immediateAction: 'Observe closely for other symptoms: spots, rapid breathing, color changes, fin damage. Prepare QT if symptoms develop.',
        linkTo: '/quarantine',
      },
    ],
  },
  {
    id: 'color-change',
    symptom: 'Color fading or darkening',
    symptomEs: 'Cambio de color (palidez o oscurecimiento)',
    icon: 'palette',
    color: '#c5a3ff',
    diagnoses: [
      {
        condition: 'Chronic stress',
        probability: 'high',
        description: 'Fish darken or pale under chronic stress (aggression, poor water, inadequate diet). Color loss is gradual over days/weeks.',
        immediateAction: 'Check water parameters, observe social dynamics, and ensure varied diet. Improve hiding spots and reduce stressors.',
        linkTo: '/param-center',
      },
      {
        condition: 'Nutritional deficiency',
        probability: 'medium',
        description: 'Fish fed only one type of food lose color vibrancy. Marine fish need varied diet: frozen mysis, enriched brine, pellets, and nori (for herbivores).',
        immediateAction: 'Diversify diet immediately. Add Selcon or Vitachem to food for vitamins. Offer frozen mysis shrimp as primary protein.',
        linkTo: '/tools',
      },
      {
        condition: 'Lighting too intense',
        probability: 'low',
        description: 'Some fish darken or pale as camouflage response to intense lighting. Especially common with clownfish and gobies.',
        immediateAction: 'Not a health concern — cosmetic adaptation. If desired, adjust light intensity or provide shaded areas.',
        linkTo: '/gear',
      },
    ],
  },
];

/* ─── Coral Stress Signal Diagnostics (OTS) ─── */

export interface CoralStressDiagnosis {
  id: string;
  signal: string;
  signalEs: string;
  icon: string;
  color: string;
  urgency: 'critical' | 'high' | 'medium';
  causes: string[];
  immediateAction: string;
  linkTo: string;
}

export const CORAL_STRESS_DATABASE: CoralStressDiagnosis[] = [
  {
    id: 'mucus-production',
    signal: 'Excessive mucus / slime on coral',
    signalEs: 'Mucosidad excesiva en el coral',
    icon: 'water_damage',
    color: '#FF7F50',
    urgency: 'high',
    causes: [
      'Chemical warfare (allelopathy) — nearby soft coral releasing terpenes',
      'Sediment settling on tissue (poor flow)',
      'Water quality stress (NH₃, NO₂, pH swing)',
      'Physical contact from neighboring coral sweeper tentacles',
    ],
    immediateAction: 'Check for touching corals, increase flow, run fresh activated carbon. Test water immediately. If near a leather coral, move the affected coral away.',
    linkTo: '/param-center',
  },
  {
    id: 'rtn',
    signal: 'Rapid Tissue Necrosis (RTN) — tissue peeling fast',
    signalEs: 'Necrosis Tisular Rápida (RTN)',
    icon: 'emergency',
    color: '#ff4444',
    urgency: 'critical',
    causes: [
      'Alkalinity spike or crash (>1.5 dKH change in 24 hours)',
      'Temperature spike above 82°F',
      'Allelopathy (terpene exposure from soft corals)',
      'Bacterial infection (Vibrio) — often follows physical damage',
    ],
    immediateAction: 'FRAG immediately — cut healthy tissue AWAY from the necrosis line. Dip in iodine (Lugol\'s) or CoralRx. The necrosis will keep advancing — you cannot save the infected tissue, only rescue what\'s ahead of it.',
    linkTo: '/sos',
  },
  {
    id: 'bleaching',
    signal: 'Coral turning white (bleaching)',
    signalEs: 'Coral blanqueándose (bleaching)',
    icon: 'brightness_high',
    color: '#F1C40F',
    urgency: 'high',
    causes: [
      'Temperature above 82°F for >48 hours (zooxanthellae expulsion)',
      'Light shock — too intense or sudden change in spectrum/PAR',
      'Nutrient starvation (NO₃=0, PO₄=0) — zooxanthellae starve',
      'Extreme alkalinity (>12 dKH) or pH spike (>8.6)',
    ],
    immediateAction: 'Reduce light intensity by 30%. Check temperature. If nutrients are zero, DOSE NO₃ and PO₄ gently. Move bleached coral to a shaded lower area. Bleached coral can recover if stress is removed within 1-2 weeks.',
    linkTo: '/param-center',
  },
  {
    id: 'polyp-retraction',
    signal: 'Polyps not opening / staying retracted',
    signalEs: 'Pólipos cerrados / retraídos',
    icon: 'brightness_low',
    color: '#F1C40F',
    urgency: 'medium',
    causes: [
      'Flow too strong or too weak at the coral\'s location',
      'Recent parameter change (coral is "sulking" while acclimating)',
      'Pest on the coral (inspect for flatworms, nudibranchs, or bite marks)',
      'Allelopathy — chemical stress from nearby coral',
    ],
    immediateAction: 'Inspect with a magnifying glass for pests. Check flow direction. Test water parameters. If recently added, give 3-5 days to acclimate before intervening.',
    linkTo: '/pest-id',
  },
];

/* ─── Symptom-based matching ─── */
export interface SymptomQuestion {
  id: string;
  question: string;
  icon: string;
  options: { label: string; pestIds: string[]; weight: number }[];
}

export const SYMPTOM_QUESTIONS: SymptomQuestion[] = [
  {
    id: 'location',
    question: 'Where do you see the problem?',
    icon: 'location_on',
    options: [
      { label: 'On fish body/fins', pestIds: ['ich', 'flatworms'], weight: 2 },
      { label: 'On coral tissue', pestIds: ['aiptasia', 'flatworms', 'monti-nudis'], weight: 2 },
      { label: 'On rocks/sand', pestIds: ['aiptasia', 'cyanobacteria', 'dinoflagellates', 'asterina'], weight: 2 },
      { label: 'On glass', pestIds: ['flatworms', 'asterina'], weight: 1 },
      { label: 'Everywhere', pestIds: ['cyanobacteria', 'dinoflagellates'], weight: 2 },
    ],
  },
  {
    id: 'appearance',
    question: 'What does it look like?',
    icon: 'visibility',
    options: [
      { label: 'White dots/spots', pestIds: ['ich'], weight: 3 },
      { label: 'Slimy red/purple mat', pestIds: ['cyanobacteria'], weight: 3 },
      { label: 'Brown snotty/stringy film', pestIds: ['dinoflagellates'], weight: 3 },
      { label: 'Small anemone-like polyps', pestIds: ['aiptasia'], weight: 3 },
      { label: 'Tiny worms or slugs', pestIds: ['flatworms', 'monti-nudis'], weight: 3 },
      { label: 'Small starfish', pestIds: ['asterina'], weight: 3 },
      { label: 'White patches on coral', pestIds: ['monti-nudis', 'flatworms'], weight: 2 },
    ],
  },
  {
    id: 'behavior',
    question: 'Any unusual fish behavior?',
    icon: 'pets',
    options: [
      { label: 'Scratching against rocks', pestIds: ['ich'], weight: 3 },
      { label: 'Rapid breathing / gasping at surface', pestIds: ['ich', 'dinoflagellates'], weight: 2 },
      { label: 'Hiding / not eating', pestIds: ['ich'], weight: 1 },
      { label: 'Fish seem normal', pestIds: ['aiptasia', 'cyanobacteria', 'dinoflagellates', 'flatworms', 'monti-nudis', 'asterina'], weight: 1 },
    ],
  },
  {
    id: 'speed',
    question: 'How fast is it spreading?',
    icon: 'speed',
    options: [
      { label: 'Very fast (days)', pestIds: ['cyanobacteria', 'dinoflagellates', 'flatworms'], weight: 2 },
      { label: 'Moderate (weeks)', pestIds: ['aiptasia', 'monti-nudis'], weight: 2 },
      { label: 'Slowly', pestIds: ['asterina'], weight: 2 },
      { label: 'Not sure / just noticed', pestIds: ['ich', 'aiptasia', 'cyanobacteria', 'flatworms', 'monti-nudis', 'asterina'], weight: 0 },
    ],
  },
];

/**
 * Score pests based on selected symptoms
 */
export function matchPestsBySymptoms(
  answers: Record<string, string[]>, // questionId -> selected option labels
): { pest: PestMatch; score: number }[] {
  const scores: Record<string, number> = {};

  for (const [questionId, selectedLabels] of Object.entries(answers)) {
    const question = SYMPTOM_QUESTIONS.find(q => q.id === questionId);
    if (!question) continue;

    for (const label of selectedLabels) {
      const option = question.options.find(o => o.label === label);
      if (!option) continue;

      for (const pestId of option.pestIds) {
        scores[pestId] = (scores[pestId] || 0) + option.weight;
      }
    }
  }

  return Object.entries(scores)
    .map(([id, score]) => ({
      pest: PEST_DATABASE.find(p => p.id === id)!,
      score,
    }))
    .filter(r => r.pest)
    .sort((a, b) => b.score - a.score);
}
