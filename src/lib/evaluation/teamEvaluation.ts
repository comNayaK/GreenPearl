import { FootballAsset, ClashRoyaleAsset, AuctionAsset, TeamEvaluationResult } from '../types/game';

export class TeamEvaluationEngine {
  /**
   * Deterministic evaluation of a drafted football squad
   */
  public static evaluateFootballTeam(
    playerId: string,
    playerName: string,
    roster: FootballAsset[],
    startingBudget: number,
    remainingBudget: number
  ): TeamEvaluationResult {
    const budgetSpent = startingBudget - remainingBudget;
    const pros: string[] = [];
    const cons: string[] = [];

    if (roster.length === 0) {
      return {
        playerId,
        playerName,
        totalScore: 0,
        ratingTier: 'D',
        breakdown: { qualityScore: 0, positionBalance: 0, synergyScore: 0, tacticalBalance: 0, valueForMoney: 0 },
        pros: [],
        cons: ['No players drafted during the auction.'],
        summary: 'Empty squad.'
      };
    }

    // 1. Quality Score (Average rating, 70-95 mapped to 40-100)
    const avgRating = roster.reduce((sum, p) => sum + p.overallRating, 0) / roster.length;
    let qualityScore = Math.min(100, Math.max(30, Math.round(((avgRating - 70) / 24) * 70 + 30)));
    if (avgRating >= 88) {
      pros.push(`World-class squad quality with an average rating of ${avgRating.toFixed(1)}.`);
    } else if (avgRating >= 84) {
      pros.push(`Solid top-tier squad averaging ${avgRating.toFixed(1)} overall.`);
    } else {
      cons.push(`Average squad rating of ${avgRating.toFixed(1)} lacks elite superstar depth.`);
    }

    // 2. Position Coverage (GK, DEF, MID, FWD)
    const posCounts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    for (const p of roster) {
      posCounts[p.position] = (posCounts[p.position] || 0) + 1;
    }

    let positionBalance = 100;
    if (posCounts.GK === 0) {
      positionBalance -= 35;
      cons.push('Critical vulnerability: No recognized goalkeeper drafted!');
    } else if (posCounts.GK > 1 && roster.length <= 6) {
      positionBalance -= 10;
      cons.push('Wasted bench slot: Drafted multiple goalkeepers in a small squad.');
    } else {
      pros.push(`Reliable goalkeeper protection anchored by ${roster.find(p => p.position === 'GK')?.name}.`);
    }

    if (posCounts.DEF === 0) {
      positionBalance -= 25;
      cons.push('Severe defensive void: Zero central or full defenders.');
    }
    if (posCounts.MID === 0) {
      positionBalance -= 20;
      cons.push('Midfield disconnect: No playmakers or ball-winners to link play.');
    }
    if (posCounts.FWD === 0) {
      positionBalance -= 20;
      cons.push('Blunt attack: No recognized clinical strikers or wingers.');
    }
    if (posCounts.DEF > 0 && posCounts.MID > 0 && posCounts.FWD > 0 && posCounts.GK > 0) {
      pros.push('Complete tactical structure with coverage across all lines (GK, DEF, MID, FWD).');
    }
    positionBalance = Math.max(10, positionBalance);

    // 3. Tactical Balance (Attack vs Defense attributes)
    let totalAttack = 0;
    let totalDefense = 0;
    for (const p of roster) {
      const att = (p.attributes.pace + p.attributes.shooting + p.attributes.dribbling) / 3;
      const def = (p.attributes.defending + p.attributes.physical) / 2;
      totalAttack += att;
      totalDefense += def;
    }
    const attackAvg = totalAttack / roster.length;
    const defenseAvg = totalDefense / roster.length;
    const attDefRatio = attackAvg / (defenseAvg || 1);

    let tacticalBalance = 80;
    if (attDefRatio > 0.8 && attDefRatio < 1.3) {
      tacticalBalance = 95;
      pros.push(`Harmonious attack-to-defense equilibrium (${attackAvg.toFixed(0)} atk vs ${defenseAvg.toFixed(0)} def).`);
    } else if (attDefRatio >= 1.3) {
      tacticalBalance = 65;
      cons.push('Overly top-heavy: Vulnerable to quick counter-attacks.');
    } else {
      tacticalBalance = 70;
      cons.push('Defensively rigid: May struggle to generate consistent offensive creativity.');
    }

    // 4. Chemistry / Synergy (Clubs, Leagues, Nationalities)
    let chemistryPoints = 0;
    const clubs: Record<string, number> = {};
    const leagues: Record<string, number> = {};
    const nations: Record<string, number> = {};

    for (const p of roster) {
      clubs[p.club] = (clubs[p.club] || 0) + 1;
      leagues[p.league] = (leagues[p.league] || 0) + 1;
      nations[p.nationality] = (nations[p.nationality] || 0) + 1;
    }

    for (const count of Object.values(clubs)) {
      if (count > 1) chemistryPoints += (count - 1) * 15;
    }
    for (const count of Object.values(nations)) {
      if (count > 1) chemistryPoints += (count - 1) * 10;
    }
    for (const count of Object.values(leagues)) {
      if (count > 1) chemistryPoints += (count - 1) * 5;
    }

    const synergyScore = Math.min(100, Math.max(30, 40 + chemistryPoints));
    if (synergyScore >= 80) {
      pros.push('Superb squad chemistry with strong club and national links.');
    } else if (synergyScore < 50) {
      cons.push('Disjointed chemistry: Players lack shared tactical systems or national familiarity.');
    }

    // 5. Value for Money (Rating delivered per credit)
    const expectedCost = roster.reduce((sum, p) => sum + p.basePrice, 0);
    const costDiff = expectedCost - budgetSpent; // positive means got good deals
    let valueForMoney = 70;
    if (costDiff >= 4) {
      valueForMoney = 95;
      pros.push(`Masterful bidding economy: Acquired roster value below expected market valuations.`);
    } else if (costDiff <= -6) {
      valueForMoney = 50;
      cons.push('Overspent aggressively in bidding wars relative to baseline market values.');
    } else {
      valueForMoney = 75;
      pros.push('Fair financial discipline maintained throughout the draft.');
    }

    // Overall Weighted Score
    const totalScore = Math.round(
      qualityScore * 0.35 +
      positionBalance * 0.25 +
      tacticalBalance * 0.15 +
      synergyScore * 0.15 +
      valueForMoney * 0.10
    );

    let ratingTier: 'S' | 'A' | 'B' | 'C' | 'D' = 'C';
    if (totalScore >= 88) ratingTier = 'S';
    else if (totalScore >= 78) ratingTier = 'A';
    else if (totalScore >= 66) ratingTier = 'B';
    else if (totalScore >= 52) ratingTier = 'C';
    else ratingTier = 'D';

    const summary = `${playerName}'s squad scored ${totalScore}/100 (${ratingTier}-Tier), driven by a ${avgRating.toFixed(1)} average rating across ${roster.length} players.`;

    return {
      playerId,
      playerName,
      totalScore,
      ratingTier,
      breakdown: {
        qualityScore,
        positionBalance,
        synergyScore,
        tacticalBalance,
        valueForMoney,
      },
      pros,
      cons,
      summary
    };
  }

  /**
   * Deterministic evaluation of a drafted Clash Royale deck (8 cards standard)
   */
  public static evaluateClashRoyaleDeck(
    playerId: string,
    playerName: string,
    deck: ClashRoyaleAsset[],
    startingBudget: number,
    remainingBudget: number
  ): TeamEvaluationResult {
    const budgetSpent = startingBudget - remainingBudget;
    const pros: string[] = [];
    const cons: string[] = [];

    if (deck.length === 0) {
      return {
        playerId,
        playerName,
        totalScore: 0,
        ratingTier: 'D',
        breakdown: { qualityScore: 0, positionBalance: 0, synergyScore: 0, tacticalBalance: 0, valueForMoney: 0 },
        pros: [],
        cons: ['No cards drafted.'],
        summary: 'Empty deck.'
      };
    }

    // 1. Elixir Curve (Quality/Cycle Score)
    const avgElixir = deck.reduce((sum, c) => sum + c.elixirCost, 0) / deck.length;
    let qualityScore = 75;
    if (avgElixir >= 2.9 && avgElixir <= 4.0) {
      qualityScore = 95;
      pros.push(`Optimal Elixir curve averaging ${avgElixir.toFixed(1)} for healthy card cycling.`);
    } else if (avgElixir > 4.4) {
      qualityScore = 55;
      cons.push(`Heavy and sluggish deck (avg ${avgElixir.toFixed(1)} Elixir); vulnerable to quick bridge-spam punishment.`);
    } else if (avgElixir < 2.7) {
      qualityScore = 65;
      cons.push(`Ultra-light cycle (avg ${avgElixir.toFixed(1)} Elixir); may struggle to defend against heavy beatdown pushes.`);
    } else {
      qualityScore = 80;
    }

    // 2. Win Condition & Archetype Balance
    const winConditions = deck.filter(c => c.attributes.winCondition);
    let positionBalance = 80;
    if (winConditions.length === 0) {
      positionBalance -= 35;
      cons.push('Severe flaw: No dedicated win-condition (e.g. Hog, Giant, Miner, Golem) to reliably take towers.');
    } else if (winConditions.length === 1 || winConditions.length === 2) {
      positionBalance += 15;
      pros.push(`Well-defined offensive focus with ${winConditions.map(w => w.name).join(' & ')} as the primary tower threat.`);
    } else {
      positionBalance -= 15;
      cons.push('Conflicting win-conditions: Too many tower-targeting cards dilute deck synergy.');
    }
    positionBalance = Math.min(100, Math.max(20, positionBalance));

    // 3. Air Defense & Counter Versatility (Tactical Balance)
    const airTargets = deck.filter(c => c.target === 'Air' || c.target === 'All');
    let tacticalBalance = 80;
    if (airTargets.length === 0) {
      tacticalBalance -= 40;
      cons.push('Fatal weakness: Zero air defense! Balloon and Lava Hound will dominate unchecked.');
    } else if (airTargets.length === 1) {
      tacticalBalance -= 15;
      cons.push('Fragile air coverage: Only 1 card capable of targeting flying threats.');
    } else {
      tacticalBalance += 15;
      pros.push(`Robust air defense with ${airTargets.length} anti-air answers.`);
    }
    tacticalBalance = Math.min(100, Math.max(20, tacticalBalance));

    // 4. Spell & Building Coverage (Synergy)
    const spells = deck.filter(c => c.cardType === 'Spell');
    const buildings = deck.filter(c => c.cardType === 'Building');
    let synergyScore = 75;

    if (spells.length === 0) {
      synergyScore -= 25;
      cons.push('No direct damage spells to finish low-health towers or clear swarms.');
    } else if (spells.length >= 2) {
      synergyScore += 15;
      pros.push(`Great spell versatility featuring ${spells.map(s => s.name).join(' + ')} for crowd control and clutch tower finishes.`);
    }

    if (buildings.length > 0) {
      pros.push(`Defensive anchor secured with ${buildings[0].name} to kite win conditions.`);
    }

    synergyScore = Math.min(100, Math.max(30, synergyScore));

    // 5. Value for Money
    const valueForMoney = Math.min(100, Math.max(50, 70 + (startingBudget - budgetSpent) * 2));
    if (valueForMoney >= 85) {
      pros.push('Superb auction budget management, retaining excess credits.');
    }

    // Overall Score
    const totalScore = Math.round(
      qualityScore * 0.25 +
      positionBalance * 0.30 +
      tacticalBalance * 0.25 +
      synergyScore * 0.15 +
      valueForMoney * 0.05
    );

    let ratingTier: 'S' | 'A' | 'B' | 'C' | 'D' = 'C';
    if (totalScore >= 88) ratingTier = 'S';
    else if (totalScore >= 78) ratingTier = 'A';
    else if (totalScore >= 66) ratingTier = 'B';
    else if (totalScore >= 52) ratingTier = 'C';
    else ratingTier = 'D';

    const summary = `${playerName}'s deck scored ${totalScore}/100 (${ratingTier}-Tier) with an average cost of ${avgElixir.toFixed(1)} Elixir.`;

    return {
      playerId,
      playerName,
      totalScore,
      ratingTier,
      breakdown: {
        qualityScore,
        positionBalance,
        synergyScore,
        tacticalBalance,
        valueForMoney,
      },
      pros,
      cons,
      summary
    };
  }

  /**
   * Generic router for evaluating any category
   */
  public static evaluateTeam(
    category: 'football' | 'clash_royale',
    playerId: string,
    playerName: string,
    assets: AuctionAsset[],
    startingBudget: number,
    remainingBudget: number
  ): TeamEvaluationResult {
    if (category === 'clash_royale') {
      return this.evaluateClashRoyaleDeck(
        playerId,
        playerName,
        assets as ClashRoyaleAsset[],
        startingBudget,
        remainingBudget
      );
    }
    return this.evaluateFootballTeam(
      playerId,
      playerName,
      assets as FootballAsset[],
      startingBudget,
      remainingBudget
    );
  }
}

