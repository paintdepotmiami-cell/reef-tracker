/**
 * ReefOS Compatibility Advisor
 *
 * Answers the #1 question every reefer asks: "Can I add this to my tank?"
 * Evaluates aggression, reef-safety, space, and known species conflicts
 * against the user's ACTUAL tank inhabitants.
 */

import type { Animal, Species } from './queries';

export interface CompatibilityResult {
  safe: boolean;
  score: number; // 0-100 (100 = perfectly safe)
  level: 'safe' | 'caution' | 'risky' | 'dangerous';
  issues: CompatibilityIssue[];
  tips: string[];
}

export interface CompatibilityIssue {
  severity: 'critical' | 'warning' | 'info';
  icon: string;
  title: string;
  description: string;
  relatedAnimal?: string; // existing animal that conflicts
}

// Known species conflict matrix — the top 30+ conflicts reefers encounter
// Format: [candidate_pattern, existing_pattern, severity, description]
const CONFLICT_MATRIX: [string, string, 'critical' | 'warning' | 'info', string][] = [
  // Angelfish vs corals
  ['Angelfish', 'Zoanthid', 'warning', 'Many angelfish nip at Zoanthid polyps. Monitor closely and have a backup plan.'],
  ['Angelfish', 'LPS', 'warning', 'Angelfish may pick at LPS coral flesh, especially Acans and Scolymia.'],
  ['Angelfish', 'Clam', 'warning', 'Angelfish are known to pick at clam mantles.'],
  ['Lemonpeel', 'Zoanthid', 'critical', 'Lemonpeel Angelfish are notorious Zoanthid nippers. High risk of coral damage.'],
  ['Lemonpeel', 'SPS', 'warning', 'Lemonpeel Angels may nip at SPS polyps, especially Montipora.'],

  // Damselfish aggression
  ['Damselfish', 'Goby', 'warning', 'Damselfish are territorial and may harass smaller gobies.'],
  ['Damselfish', 'Blenny', 'warning', 'Damselfish can be aggressive toward blennies competing for the same territory.'],
  ['Damsel', 'Damsel', 'warning', 'Multiple damselfish in a small tank leads to territorial fighting. Only one per 20 gallons.'],

  // Clownfish
  ['Clownfish', 'Clownfish', 'warning', 'Only keep clownfish in pairs. Adding a third causes lethal aggression.'],
  ['Clownfish', 'Anemone', 'info', 'Clownfish will host in the anemone — this is natural and beneficial for both.'],

  // Wrasse vs inverts
  ['Wrasse', 'Shrimp', 'warning', 'Many wrasses eat ornamental shrimp. Research the specific species first.'],
  ['Wrasse', 'Snail', 'warning', 'Wrasses may eat small snails and hermit crabs.'],
  ['Wrasse', 'Crab', 'warning', 'Wrasses hunt small crabs. Your cleanup crew may be at risk.'],

  // Triggers & Puffers
  ['Trigger', 'coral', 'critical', 'Triggers are NOT reef safe. They will destroy corals and eat invertebrates.'],
  ['Puffer', 'coral', 'critical', 'Puffers are NOT reef safe. They eat corals, clams, and invertebrates.'],
  ['Puffer', 'Shrimp', 'critical', 'Puffers eat shrimp and crabs.'],

  // Coral vs coral
  ['Torch', 'Hammer', 'info', 'Euphyllia species (Torch, Hammer, Frogspawn) can touch each other safely. Keep 6" from non-Euphyllia.'],
  ['Hammer', 'Torch', 'info', 'Euphyllia species can coexist. They share the same chemical defenses.'],
  ['Torch', 'Acropora', 'critical', 'Torch coral sweeper tentacles (4-6") will kill Acropora on contact. Maintain 6"+ distance.'],
  ['Hammer', 'Acropora', 'critical', 'Hammer coral sweeper tentacles will kill SPS corals on contact. Keep far apart.'],
  ['Torch', 'Mushroom', 'warning', 'Euphyllia sweepers can damage mushroom corals. Keep 6" minimum distance.'],
  ['Galaxy Coral', '*', 'warning', 'Galaxy coral (Galaxea) has very long sweeper tentacles (up to 12"). Keep far from all other corals.'],
  ['Leather', 'SPS', 'warning', 'Leather corals release terpenes that can inhibit SPS growth. Run activated carbon.'],
  ['Sarcophyton', 'SPS', 'critical', '⚠️ ALLELOPATHY: Sarcophyton (Toadstool Leather) releases potent terpenes that cause tissue necrosis in SPS corals (especially Acropora). Requires continuous high-quality activated carbon AND strong flow to dilute toxins. Many expert reefers avoid mixing these genera entirely.'],
  ['Sarcophyton', 'Acropora', 'critical', '⚠️ ALLELOPATHY: Sarcophyton terpenes are lethal to Acropora. Chemical warfare occurs even without physical contact — toxins travel through the water column. Run carbon 24/7 and replace every 3 weeks.'],
  ['Sinularia', 'SPS', 'critical', '⚠️ ALLELOPATHY: Sinularia (Finger Leather) produces terpenes toxic to SPS corals. Same chemical warfare as Sarcophyton. Continuous activated carbon is mandatory in mixed reefs with Sinularia + SPS.'],
  ['Sinularia', 'Acropora', 'critical', '⚠️ ALLELOPATHY: Sinularia terpenes cause RTN (Rapid Tissue Necrosis) in Acropora and other SPS. These cannot safely coexist without aggressive chemical filtration.'],
  ['Galaxea', '*', 'critical', '⚠️ ALLELOPATHY: Galaxea (Galaxy Coral) has sweeper tentacles up to 20cm (8 inches) — much longer than most corals. Will kill ANYTHING within reach at night when tentacles fully extend. Keep 20cm+ minimum from ALL neighbors.'],
  ['GSP', '*', 'warning', 'Green Star Polyps grow aggressively and will overgrow neighboring corals. Keep on isolated rock.'],
  ['Xenia', '*', 'info', 'Xenia spreads rapidly and can become invasive. Consider keeping on a frag island.'],
  ['Kenya Tree', '*', 'info', 'Kenya Trees drop branches that root everywhere. Can become a nuisance. Place carefully.'],
  ['Palythoa', '*', 'warning', 'Palythoa contain palytoxin — one of the deadliest natural toxins. NEVER boil, frag with open cuts, or scrub without gloves. Dangerous to humans, not just tankmates.'],

  // Anemone conflicts
  ['Anemone', 'coral', 'warning', 'Anemones move freely and will sting any coral they touch. They need space.'],
  ['Bubble Tip', 'coral', 'warning', 'BTAs can walk toward corals and sting them. Protect your coral colonies with distance.'],
  ['Carpet Anemone', '*', 'critical', 'Carpet anemones eat fish and sting everything nearby. Expert only. Very dangerous in mixed reefs.'],

  // Urchin risks
  ['Urchin', 'coral', 'info', 'Urchins may knock over unsecured coral frags while grazing. Glue your frags down.'],

  // Shrimp compatibility
  ['Coral Banded Shrimp', 'Shrimp', 'warning', 'Coral Banded Shrimp are aggressive to other shrimp. Only keep one or a mated pair.'],
  ['Coral Banded', 'Peppermint', 'critical', 'Coral Banded Shrimp will kill Peppermint Shrimp. Do not combine.'],
];

/**
 * Check if a candidate species is compatible with current tank inhabitants.
 */
export function checkCompatibility(
  candidate: Species,
  currentAnimals: Animal[],
  tankGallons: number | null,
): CompatibilityResult {
  const issues: CompatibilityIssue[] = [];
  const tips: string[] = [];
  let score = 100;

  const candidateName = candidate.common_name;
  const candidateCat = candidate.category; // fish, coral, invertebrate
  const candidateSub = candidate.subcategory || '';

  // 1. Reef safety check
  if (candidate.reef_safe === 'No') {
    issues.push({
      severity: 'critical',
      icon: 'block',
      title: 'NOT reef safe',
      description: `${candidateName} is not reef safe and will damage or eat corals and invertebrates.`,
    });
    score -= 50;
  } else if (candidate.reef_safe === 'Caution') {
    issues.push({
      severity: 'warning',
      icon: 'warning',
      title: 'Reef safe with caution',
      description: `${candidateName} is generally reef safe but may nip at corals or small invertebrates. Monitor closely.`,
    });
    score -= 15;
  }

  // 2. Tank size check
  if (tankGallons && candidate.max_size) {
    const sizeMatch = candidate.max_size.match(/(\d+)/);
    if (sizeMatch) {
      const maxInches = parseInt(sizeMatch[1]);
      // Rule of thumb: 1 inch of fish per 2-3 gallons for marine
      if (candidateCat === 'fish' && maxInches > tankGallons / 3) {
        issues.push({
          severity: 'critical',
          icon: 'straighten',
          title: 'Tank too small',
          description: `${candidateName} grows to ${candidate.max_size}. A ${tankGallons}-gallon tank is too small for this fish. It will be stressed and may become aggressive.`,
        });
        score -= 40;
      } else if (candidateCat === 'fish' && maxInches > tankGallons / 5) {
        issues.push({
          severity: 'warning',
          icon: 'straighten',
          title: 'Tight fit',
          description: `${candidateName} grows to ${candidate.max_size}. It will be comfortable short-term but may outgrow a ${tankGallons}-gallon tank.`,
        });
        score -= 10;
      }
    }
  }

  // 3. Aggression check against existing animals
  if (candidate.aggression === 'High' || candidate.aggression === 'Very High') {
    const vulnerableAnimals = currentAnimals.filter(a =>
      a.type === candidateCat &&
      (a.aggression === 'Low' || a.aggression === 'Peaceful')
    );
    if (vulnerableAnimals.length > 0) {
      issues.push({
        severity: 'warning',
        icon: 'swords',
        title: `Aggression conflict`,
        description: `${candidateName} is highly aggressive. May harass: ${vulnerableAnimals.slice(0, 3).map(a => a.name).join(', ')}${vulnerableAnimals.length > 3 ? ` and ${vulnerableAnimals.length - 3} more` : ''}.`,
        relatedAnimal: vulnerableAnimals[0].name,
      });
      score -= 20;
    }
  }

  // 4. Known conflict matrix
  for (const [candPattern, existPattern, severity, desc] of CONFLICT_MATRIX) {
    const candidateMatches = candidateName.toLowerCase().includes(candPattern.toLowerCase()) ||
      candidateSub.toLowerCase().includes(candPattern.toLowerCase());

    if (!candidateMatches) continue;

    // Check against existing animals
    for (const existing of currentAnimals) {
      const existMatches = existPattern === '*' ||
        existing.name.toLowerCase().includes(existPattern.toLowerCase()) ||
        (existing.subtype || '').toLowerCase().includes(existPattern.toLowerCase()) ||
        existing.type.toLowerCase().includes(existPattern.toLowerCase());

      if (existMatches) {
        issues.push({
          severity,
          icon: severity === 'critical' ? 'dangerous' : severity === 'warning' ? 'warning' : 'info',
          title: `${candidateName} vs ${existing.name}`,
          description: desc,
          relatedAnimal: existing.name,
        });
        score -= severity === 'critical' ? 30 : severity === 'warning' ? 15 : 5;
      }
    }
  }

  // Also check reverse: existing animals that conflict with the candidate
  for (const [candPattern, existPattern, severity, desc] of CONFLICT_MATRIX) {
    for (const existing of currentAnimals) {
      const existingMatches = existing.name.toLowerCase().includes(candPattern.toLowerCase()) ||
        (existing.subtype || '').toLowerCase().includes(candPattern.toLowerCase());

      if (!existingMatches) continue;

      const candidateIsTarget = existPattern === '*' ||
        candidateName.toLowerCase().includes(existPattern.toLowerCase()) ||
        candidateSub.toLowerCase().includes(existPattern.toLowerCase()) ||
        candidateCat.toLowerCase().includes(existPattern.toLowerCase());

      if (candidateIsTarget) {
        // Avoid duplicates
        const alreadyReported = issues.some(i =>
          i.relatedAnimal === existing.name && i.title.includes(existing.name)
        );
        if (!alreadyReported) {
          issues.push({
            severity,
            icon: severity === 'critical' ? 'dangerous' : severity === 'warning' ? 'warning' : 'info',
            title: `${existing.name} vs ${candidateName}`,
            description: desc,
            relatedAnimal: existing.name,
          });
          score -= severity === 'critical' ? 30 : severity === 'warning' ? 15 : 5;
        }
      }
    }
  }

  // 5. Euphyllia distance check
  if (candidateCat === 'coral' && candidate.min_distance_inches) {
    const tooClose = currentAnimals.filter(a =>
      a.type === 'coral' &&
      a.name !== candidateName &&
      !isEuphylliaFamily(candidateName, a.name) // Euphyllia can touch each other
    );
    if (tooClose.length > 0) {
      tips.push(`${candidateName} needs ${candidate.min_distance_inches}" minimum distance from other corals (except fellow Euphyllia). Use the 3D Planner to check spacing.`);
    }
  }

  // 6. Duplicate species check (same fish twice)
  if (candidateCat === 'fish') {
    const sameSpecies = currentAnimals.filter(a =>
      a.species === candidate.scientific_name && a.type === 'fish'
    );
    if (sameSpecies.length > 0 && !isSchoolingFish(candidateName)) {
      issues.push({
        severity: 'warning',
        icon: 'group',
        title: `Already have ${sameSpecies[0].name}`,
        description: `Most marine fish are territorial with their own species. Adding another ${candidateName} may cause fighting unless your tank is large enough for separate territories.`,
        relatedAnimal: sameSpecies[0].name,
      });
      score -= 15;
    }
  }

  // 7. Difficulty warning
  if (candidate.difficulty === 'Hard' || candidate.difficulty === 'Expert') {
    tips.push(`${candidateName} is rated "${candidate.difficulty}". Make sure your parameters are stable and you have experience with similar species before adding.`);
  }

  // 8. OTS: Allelopathy general warning for mixed reefs (soft + SPS)
  if (candidateCat === 'coral') {
    const hasSoftCorals = currentAnimals.some(a =>
      a.type === 'coral' && ['Leather', 'Sarcophyton', 'Sinularia', 'Toadstool', 'Xenia', 'Kenya', 'Mushroom', 'Rhodactis', 'Ricordea'].some(s => a.name.includes(s) || (a.subtype || '').includes(s))
    );
    const hasSPS = currentAnimals.some(a =>
      a.type === 'coral' && ['Acropora', 'Montipora', 'Stylophora', 'Pocillopora', 'Seriatopora', 'SPS'].some(s => a.name.includes(s) || (a.subtype || '').includes(s))
    );
    const candidateIsSoft = ['Leather', 'Sarcophyton', 'Sinularia', 'Toadstool', 'Xenia', 'Kenya', 'Mushroom'].some(s => candidateName.includes(s) || candidateSub.includes(s));
    const candidateIsSPS = ['Acropora', 'Montipora', 'Stylophora', 'Pocillopora', 'Seriatopora', 'SPS'].some(s => candidateName.includes(s) || candidateSub.includes(s));

    if ((candidateIsSoft && hasSPS) || (candidateIsSPS && hasSoftCorals)) {
      tips.push('🧪 OTS Allelopathy Warning: Mixing soft corals with SPS in the same system requires continuous activated carbon filtration. Soft corals release terpenes that inhibit SPS growth and can cause tissue necrosis. Replace carbon every 3-4 weeks.');
    }

    // Growth spacing warning
    tips.push(`📐 Plan for FUTURE growth: ${candidateName} will grow over time. Leave space between colonies — corals that touch compete chemically. Use the Planner to visualize spacing.`);
  }

  // 8. Diet/feeding tips
  if (candidate.diet) {
    tips.push(`Feeding: ${candidate.diet}`);
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine level
  const level: CompatibilityResult['level'] =
    score >= 80 ? 'safe' :
    score >= 60 ? 'caution' :
    score >= 40 ? 'risky' : 'dangerous';

  // Deduplicate issues
  const seen = new Set<string>();
  const uniqueIssues = issues.filter(i => {
    const key = `${i.title}-${i.relatedAnimal}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    safe: score >= 60,
    score,
    level,
    issues: uniqueIssues,
    tips,
  };
}

function isEuphylliaFamily(name1: string, name2: string): boolean {
  const euphyllia = ['Torch', 'Hammer', 'Frogspawn', 'Euphyllia'];
  const is1 = euphyllia.some(e => name1.includes(e));
  const is2 = euphyllia.some(e => name2.includes(e));
  return is1 && is2;
}

function isSchoolingFish(name: string): boolean {
  const schooling = ['Chromis', 'Anthias', 'Cardinalfish', 'Dartfish'];
  return schooling.some(s => name.includes(s));
}
