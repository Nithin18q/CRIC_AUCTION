/**
 * Team Squad and Playing XI Evaluation Engine for IPL Auction
 *
 * Evaluates auction squads using actual player data, enforcing IPL Playing XI rules
 * (max 4 overseas players, wicketkeeper required, minimum bowling options, etc.).
 * Objectively scores squads across 10 cricket dimensions on a 100-point scale.
 */

// Known Spinners dictionary for accurate bowling type classification
const KNOWN_SPINNERS = new Set([
  'Rashid Khan', 'Kuldeep Yadav', 'Ravindra Jadeja', 'Sunil Narine',
  'Varun Chakaravarthy', 'Yuzvendra Chahal', 'Wanindu Hasaranga', 'Ravi Bishnoi',
  'Axar Patel', 'Mitch Santner', 'Maheesh Theekshana', 'Rahul Chahar',
  'Akeal Hosein', 'Sai Kishore', 'Harpreet Brar', 'Mayank Markande',
  'Suyash Sharma', 'Swapnil Singh', 'AM Ghazanfar', 'Jayant Yadav',
  'Digvesh Singh Rathi', 'Shahbaz Ahmed', 'Washington Sundar', 'Krunal Pandya',
  'Rahul Tewatia', 'Riyan Parag', 'Abhishek Sharma', 'Glenn Maxwell',
  'Will Jacks', 'Liam Livingstone', 'Ravichandran Ashwin', 'Shreyas Gopal',
  'Karn Sharma', 'Noor Ahmad', 'Allah Ghazanfar', 'Tanush Kotian',
  'Manav Suthar', 'Kumar Kartikeya', 'Shreyas Iyer', 'Nitish Rana',
  'Sameer Rizvi', 'Vicky Ostwal', 'Kumar Kushagra', 'Shubham Sharma'
]);

// Known Elite Death Bowlers
const KNOWN_DEATH_BOWLERS = new Set([
  'Jasprit Bumrah', 'Arshdeep Singh', 'Matheesha Pathirana', 'Mitchell Starc',
  'Harshal Patel', 'Sandeep Sharma', 'Thangarasu Natarajan', 'Kagiso Rabada',
  'Trent Boult', 'Jofra Archer', 'Mohammed Shami', 'Mohsin Khan',
  'Mohammed Siraj', 'Nathan Ellis', 'Tushar Deshpande', 'Avesh Khan',
  'Khaleel Ahmed', 'Pat Cummins', 'Josh Hazlewood', 'Andre Russell',
  'Sam Curran', 'Deepak Chahar', 'Harshit Rana', 'Mukesh Kumar',
  'Yash Dayal', 'Nuwan Thushara', 'Naveen-ul-Haq', 'Gerald Coetzee',
  'Fazalhaq Farooqi', 'Mustafizur Rahman', 'Spencer Johnson'
]);

// Known Elite Finishers
const KNOWN_FINISHERS = new Set([
  'Mahendra Singh Dhoni', 'MS Dhoni', 'Heinrich Klaasen', 'Andre Russell',
  'Nicholas Pooran', 'Rinku Singh', 'Tim David', 'Shimron Hetmyer',
  'Liam Livingstone', 'Marcus Stoinis', 'Rahul Tewatia', 'Hardik Pandya',
  'Shashank Singh', 'Ashutosh Sharma', 'Abdul Samad', 'Romario Shepherd',
  'Tristan Stubbs', 'David Miller', 'Glenn Phillips', 'Ramandeep Singh',
  'Dinesh Karthik', 'Shahrukh Khan', 'Abhinav Manohar', 'Jitesh Sharma'
]);

// Known Openers / Top-Order Batsmen
const KNOWN_OPENERS = new Set([
  'Virat Kohli', 'Rohit Sharma', 'Shubman Gill', 'Yashasvi Jaiswal',
  'Ruturaj Gaikwad', 'Travis Head', 'Jos Buttler', 'KL Rahul',
  'Phil Salt', 'Quinton de Kock', 'Faf du Plessis', 'Abhishek Sharma',
  'Sunil Narine', 'David Warner', 'Ishan Kishan', 'Sai Sudharsan',
  'Devon Conway', 'Prabhsimran Singh', 'Jake Fraser-McGurk', 'Rachin Ravindra',
  'Sanju Samson', 'Shikhar Dhawan', 'Mayank Agarwal', 'Rahmanullah Gurbaz',
  'Jonny Bairstow', 'Will Jacks'
]);

/**
 * Determine if a player is Overseas
 */
export function isOverseasPlayer(player) {
  if (!player) return false;
  if (player.type === 'Overseas') return true;
  if (player.country && player.country !== 'IND') return true;
  return false;
}

/**
 * Identify bowling style: 'spin' | 'pace' | null
 */
export function getBowlingType(player) {
  if (!player) return null;
  const role = (player.role || '').toLowerCase();
  const isBowlerOrAR = role.includes('bowler') || role.includes('all-rounder');
  if (!isBowlerOrAR) return null;

  if (KNOWN_SPINNERS.has(player.name)) return 'spin';
  const setName = (player.set || '').toLowerCase();
  if (setName.includes('spin') || setName.includes('sp')) return 'spin';
  if (setName.includes('fast') || setName.includes('fa')) return 'pace';

  return 'pace';
}

/**
 * Calculate individual player rating out of 100
 * Accurately uses actual stats and flags estimated ratings when data is incomplete.
 */
export function calculatePlayerRating(player) {
  if (!player) {
    return {
      rating: 60,
      isEstimated: true,
      role: 'Unknown',
      displayStats: 'No data'
    };
  }

  const role = player.role || 'Batsman';
  const isBowler = role === 'Bowler';
  const isAllRounder = role === 'All-Rounder';
  const isKeeper = role === 'Wicket-Keeper';
  const isBatsman = role === 'Batsman' || role === 'Batter';

  const stats = player.stats || {};
  const matches = stats.matches || 0;
  const runs = stats.runs || 0;
  const sr = stats.sr || 0;
  const avg = stats.avg || 0;
  const wickets = stats.wickets || 0;
  const econ = stats.econ || 0;

  // Determine if rating has to be estimated
  let isEstimated = false;
  if (!stats || matches === 0 || (isBatsman && runs === 0) || (isBowler && wickets === 0)) {
    isEstimated = true;
  }

  // Calculate Batting Component
  let batScore = 60;
  if (runs > 0 || sr > 0 || avg > 0) {
    const runsFactor = Math.min(runs / 4000, 1.0) * 20;
    const avgFactor = Math.min((avg || 20) / 40, 1.25) * 35;
    const srFactor = Math.min((sr || 120) / 155, 1.25) * 35;
    const matchFactor = Math.min(matches / 100, 1.0) * 10;
    batScore = Math.min(99, Math.max(55, runsFactor + avgFactor + srFactor + matchFactor));
  } else if (isEstimated) {
    const baseP = player.basePrice || 0.3;
    batScore = baseP >= 2.0 ? 84 : baseP >= 1.5 ? 78 : baseP >= 1.0 ? 74 : baseP >= 0.5 ? 70 : 65;
    if (player.set && player.set.includes('Marquee')) batScore += 6;
  }

  // Calculate Bowling Component
  let bowlScore = 60;
  if (wickets > 0 || (econ > 0 && econ < 12)) {
    const wktsFactor = Math.min(wickets / 120, 1.0) * 25;
    const econFactor = Math.max(0, (11.0 - (econ || 8.5)) / 4.0) * 35;
    const avgFactor = Math.max(0, (36.0 - (avg || 28.0)) / 14.0) * 30;
    const matchFactor = Math.min(matches / 100, 1.0) * 10;
    bowlScore = Math.min(99, Math.max(55, wktsFactor + econFactor + avgFactor + matchFactor));
  } else if (isEstimated) {
    const baseP = player.basePrice || 0.3;
    bowlScore = baseP >= 2.0 ? 85 : baseP >= 1.5 ? 78 : baseP >= 1.0 ? 74 : baseP >= 0.5 ? 70 : 65;
    if (player.set && player.set.includes('Marquee')) bowlScore += 6;
  }

  // Primary Overall Rating based on Role
  let rating = 60;
  if (isBatsman) {
    rating = batScore;
  } else if (isKeeper) {
    rating = Math.min(98, batScore + 3); // Wicketkeeping added value
  } else if (isBowler) {
    rating = bowlScore;
  } else if (isAllRounder) {
    if (wickets > 0 && runs > 0) {
      rating = Math.min(98, batScore * 0.52 + bowlScore * 0.48 + 4);
    } else if (wickets > 0) {
      rating = Math.min(98, bowlScore * 0.85 + (batScore || 65) * 0.15);
    } else {
      rating = Math.min(98, batScore * 0.85 + (bowlScore || 65) * 0.15);
    }
  }

  // Formatting available statistics string for display
  let displayStats = '';
  if (matches > 0) {
    const parts = [`${matches} M`];
    if (runs > 0) parts.push(`${runs} Runs`);
    if (sr > 0) parts.push(`${sr} SR`);
    if (wickets > 0) parts.push(`${wickets} Wkts`);
    if (econ > 0) parts.push(`${econ} Econ`);
    displayStats = parts.join(' • ');
  } else {
    displayStats = 'Domestic / Uncapped (Estimated)';
  }

  const bowlingType = getBowlingType(player);
  const isDeathBowler = KNOWN_DEATH_BOWLERS.has(player.name) || (isBowler && econ > 0 && econ <= 8.2 && avg <= 25);
  const isFinisher = KNOWN_FINISHERS.has(player.name) || ((isBatsman || isAllRounder || isKeeper) && sr >= 150 && avg >= 28);
  const isOpener = KNOWN_OPENERS.has(player.name) || ((isBatsman || isKeeper) && (runs > 2000 || matches > 50));

  return {
    rating: Math.round(rating * 10) / 10,
    isEstimated,
    bowlingType,
    isDeathBowler,
    isFinisher,
    isOpener,
    displayStats,
    isOverseas: isOverseasPlayer(player)
  };
}

/**
 * Select the Strongest Valid Playing XI applying IPL regulations:
 * - Exactly up to 11 players
 * - Max 4 overseas players
 * - At least 1 Wicket-Keeper
 * - At least 5 bowling options
 * - Batting depth optimization
 */
export function selectStrongestPlayingXI(squad) {
  if (!squad || squad.length === 0) {
    return { playingXI: [], backups: [], hasKeeper: false, overseasCount: 0, bowlingOptionsCount: 0 };
  }

  // Enrich squad with ratings and meta
  const enrichedSquad = squad.map(p => ({
    ...p,
    eval: calculatePlayerRating(p)
  })).sort((a, b) => b.eval.rating - a.eval.rating);

  // If squad has 11 or fewer players, take all and check constraints
  if (enrichedSquad.length <= 11) {
    const overseasCount = enrichedSquad.filter(p => p.eval.isOverseas).length;
    const hasKeeper = enrichedSquad.some(p => p.role === 'Wicket-Keeper');
    const bowlingOptions = enrichedSquad.filter(p => p.role === 'Bowler' || p.role === 'All-Rounder');
    return {
      playingXI: orderPlayingXI(enrichedSquad),
      backups: [],
      hasKeeper,
      overseasCount,
      bowlingOptionsCount: bowlingOptions.length
    };
  }

  // Partition by Overseas vs Indian
  const overseasPlayers = enrichedSquad.filter(p => p.eval.isOverseas);
  const indianPlayers = enrichedSquad.filter(p => !p.eval.isOverseas);

  // Find best available wicket-keeper
  const allKeepers = enrichedSquad.filter(p => p.role === 'Wicket-Keeper');
  const primaryKeeper = allKeepers[0] || null;

  // Find all bowling options (Bowlers & All-Rounders)
  const allBowlersAndAR = enrichedSquad.filter(p => p.role === 'Bowler' || p.role === 'All-Rounder');

  // We want to pick the optimal 11:
  // Must include: primaryKeeper (if available), at least 5 bowlers/all-rounders, and max 4 overseas.
  // Greedy approach with constraint repair:
  const selected = new Set();

  // 1. Mandatory Wicket Keeper
  if (primaryKeeper) {
    selected.add(primaryKeeper.id);
  }

  // 2. Frontline bowlers (pick top 4-5 bowling options to guarantee complete 20 overs)
  // Ensure a mix of pacers and spinners if available
  const pacers = allBowlersAndAR.filter(p => p.eval.bowlingType === 'pace');
  const spinners = allBowlersAndAR.filter(p => p.eval.bowlingType === 'spin');

  // Top 2 pacers
  pacers.slice(0, 2).forEach(p => selected.add(p.id));
  // Top spinner
  if (spinners.length > 0) selected.add(spinners[0].id);

  // Fill up to 5 bowling options
  for (const b of allBowlersAndAR) {
    const currentBowlers = enrichedSquad.filter(p => selected.has(p.id) && (p.role === 'Bowler' || p.role === 'All-Rounder'));
    if (currentBowlers.length >= 5) break;
    selected.add(b.id);
  }

  // 3. Fill remaining slots with the highest rated players from the squad
  for (const p of enrichedSquad) {
    if (selected.size >= 11) break;
    selected.add(p.id);
  }

  let playingList = enrichedSquad.filter(p => selected.has(p.id));

  // 4. Enforce Overseas Limit (Max 4)
  while (playingList.filter(p => p.eval.isOverseas).length > 4) {
    // Find the lowest rated overseas player in the current selection
    // (except don't drop the only keeper if no Indian keeper is available)
    const currentOverseas = playingList
      .filter(p => p.eval.isOverseas)
      .sort((a, b) => a.eval.rating - b.eval.rating);

    let dropped = null;
    for (const os of currentOverseas) {
      if (os.role === 'Wicket-Keeper' && playingList.filter(p => p.role === 'Wicket-Keeper').length <= 1) {
        // If this is the only keeper, check if there's an Indian keeper on the bench
        const benchKeeper = indianPlayers.find(p => p.role === 'Wicket-Keeper' && !selected.has(p.id));
        if (!benchKeeper) continue; // Keep this overseas keeper if no other keeper exists
      }
      dropped = os;
      break;
    }

    if (!dropped) dropped = currentOverseas[0];
    selected.delete(dropped.id);

    // Pick the best available Indian player from the bench
    const bestIndianBench = indianPlayers
      .filter(p => !selected.has(p.id))
      .sort((a, b) => b.eval.rating - a.eval.rating)[0];

    if (bestIndianBench) {
      selected.add(bestIndianBench.id);
    }
    playingList = enrichedSquad.filter(p => selected.has(p.id));
  }

  // 5. Ensure at least 5 bowling options exist in the XI
  let currentBowlerCount = playingList.filter(p => p.role === 'Bowler' || p.role === 'All-Rounder').length;
  if (currentBowlerCount < 5) {
    const remainingBowlers = enrichedSquad
      .filter(p => !selected.has(p.id) && (p.role === 'Bowler' || p.role === 'All-Rounder'))
      .sort((a, b) => b.eval.rating - a.eval.rating);

    for (const addB of remainingBowlers) {
      if (currentBowlerCount >= 5) break;
      const osCount = playingList.filter(p => p.eval.isOverseas).length;
      if (addB.eval.isOverseas && osCount >= 4) continue; // Can't add overseas if already 4

      // Drop the lowest rated pure batsman who is not an opener or keeper
      const candidateToDrop = playingList
        .filter(p => p.role === 'Batsman' || p.role === 'Batter')
        .sort((a, b) => a.eval.rating - b.eval.rating)[0];

      if (candidateToDrop) {
        selected.delete(candidateToDrop.id);
        selected.add(addB.id);
        playingList = enrichedSquad.filter(p => selected.has(p.id));
        currentBowlerCount++;
      }
    }
  }

  const finalXI = orderPlayingXI(playingList);
  const backups = enrichedSquad.filter(p => !selected.has(p.id));

  const overseasCount = finalXI.filter(p => p.eval.isOverseas).length;
  const hasKeeper = finalXI.some(p => p.role === 'Wicket-Keeper');
  const bowlingOptionsCount = finalXI.filter(p => p.role === 'Bowler' || p.role === 'All-Rounder').length;

  return {
    playingXI: finalXI,
    backups,
    hasKeeper,
    overseasCount,
    bowlingOptionsCount
  };
}

/**
 * Order the 11 players into a realistic cricket batting lineup (1 to 11)
 */
function orderPlayingXI(players) {
  const list = [...players];

  // Separate by role/skill
  const openers = [];
  const middleOrder = [];
  const allRounders = [];
  const pureBowlers = [];

  list.forEach(p => {
    if (p.eval.isOpener && (p.role === 'Batsman' || p.role === 'Batter' || p.role === 'Wicket-Keeper')) {
      openers.push(p);
    } else if (p.role === 'Batsman' || p.role === 'Batter') {
      middleOrder.push(p);
    } else if (p.role === 'Wicket-Keeper') {
      middleOrder.push(p);
    } else if (p.role === 'All-Rounder') {
      allRounders.push(p);
    } else {
      pureBowlers.push(p);
    }
  });

  // Sort each group by rating descending
  openers.sort((a, b) => b.eval.rating - a.eval.rating);
  middleOrder.sort((a, b) => b.eval.rating - a.eval.rating);
  allRounders.sort((a, b) => b.eval.rating - a.eval.rating);
  pureBowlers.sort((a, b) => b.eval.rating - a.eval.rating);

  const battingOrder = [];

  // Top 2: Openers
  while (openers.length > 0 && battingOrder.length < 2) {
    battingOrder.push(openers.shift());
  }
  while (middleOrder.length > 0 && battingOrder.length < 2) {
    battingOrder.push(middleOrder.shift());
  }

  // 3 - 5: Middle order / Keepers / Any remaining openers
  const midPool = [...openers, ...middleOrder].sort((a, b) => b.eval.rating - a.eval.rating);
  while (midPool.length > 0 && battingOrder.length < 5) {
    battingOrder.push(midPool.shift());
  }

  // 6 - 7: All-rounders / Finishers
  const finishPool = [...midPool, ...allRounders].sort((a, b) => {
    // prioritize finishers
    if (a.eval.isFinisher && !b.eval.isFinisher) return -1;
    if (!a.eval.isFinisher && b.eval.isFinisher) return 1;
    return b.eval.rating - a.eval.rating;
  });
  while (finishPool.length > 0 && battingOrder.length < 7) {
    battingOrder.push(finishPool.shift());
  }

  // 8 - 11: Bowling all-rounders and pure bowlers
  const tailPool = [...finishPool, ...pureBowlers].sort((a, b) => {
    // Pure bowlers with lower batting stay at the very end
    return b.eval.rating - a.eval.rating;
  });
  while (tailPool.length > 0) {
    battingOrder.push(tailPool.shift());
  }

  return battingOrder;
}

/**
 * Evaluate squad across all 10 cricket dimensions and return a score out of 100.
 */
export function evaluateSquad(teamId, squad) {
  if (!squad || squad.length === 0) {
    return {
      score: 0,
      dimensions: {},
      playingXI: [],
      backups: [],
      strengths: [],
      weaknesses: ['Squad has no purchased players.'],
      explanation: 'No players purchased during the auction.'
    };
  }

  const { playingXI, backups, hasKeeper, overseasCount, bowlingOptionsCount } = selectStrongestPlayingXI(squad);

  // 1. Opening Pair (Positions 1-2)
  const openers = playingXI.slice(0, 2);
  let openingScore = 60;
  if (openers.length >= 2) {
    const avgRating = (openers[0].eval.rating + openers[1].eval.rating) / 2;
    const bothRecognized = openers.every(p => p.role === 'Batsman' || p.role === 'Batter' || p.role === 'Wicket-Keeper');
    const openerPedigree = openers.filter(p => p.eval.isOpener).length;
    openingScore = Math.min(98, avgRating + (bothRecognized ? 3 : -15) + (openerPedigree * 2));
  } else if (openers.length === 1) {
    openingScore = openers[0].eval.rating * 0.7;
  }

  // 2. Middle Order (Positions 3, 4, 5)
  const middle = playingXI.slice(2, 5);
  let middleScore = 60;
  if (middle.length > 0) {
    const avgRating = middle.reduce((acc, p) => acc + p.eval.rating, 0) / middle.length;
    const recognizedCount = middle.filter(p => p.role === 'Batsman' || p.role === 'Batter' || p.role === 'Wicket-Keeper' || p.role === 'All-Rounder').length;
    middleScore = Math.min(98, avgRating + (recognizedCount === 3 ? 3 : -6));
  }

  // 3. Finishing Ability (Positions 5, 6, 7 & Finishers in XI)
  const finishersInXI = playingXI.filter(p => p.eval.isFinisher);
  const deathBatters = playingXI.slice(4, 7);
  let finishingScore = 65;
  if (finishersInXI.length > 0) {
    const topFinisherRating = Math.max(...finishersInXI.map(p => p.eval.rating));
    finishingScore = Math.min(98, topFinisherRating * 0.8 + (finishersInXI.length >= 2 ? 16 : 8));
  } else {
    const avgDeathBat = deathBatters.length > 0 ? deathBatters.reduce((acc, p) => acc + p.eval.rating, 0) / deathBatters.length : 60;
    finishingScore = Math.max(50, avgDeathBat - 8);
  }

  // 4. Wicketkeeper (8%)
  const keeper = playingXI.find(p => p.role === 'Wicket-Keeper');
  let keeperScore = 40; // Heavy penalty if no keeper
  if (keeper) {
    keeperScore = Math.min(98, keeper.eval.rating + 2);
  }

  // 5. All-Rounders & Batting Depth (Positions 6-8 + AR count)
  const allRoundersInXI = playingXI.filter(p => p.role === 'All-Rounder');
  const number8 = playingXI[7];
  let battingDepthScore = 60;
  const num8Rating = number8 ? (number8.stats?.runs > 200 || number8.role === 'All-Rounder' ? 85 : 68) : 50;
  battingDepthScore = Math.min(98, (allRoundersInXI.length >= 3 ? 92 : allRoundersInXI.length >= 2 ? 86 : allRoundersInXI.length === 1 ? 76 : 65) * 0.6 + num8Rating * 0.4);

  // 6. Pace Bowling (Frontline Fast Bowlers in XI)
  const pacersInXI = playingXI.filter(p => p.eval.bowlingType === 'pace');
  let paceScore = 55;
  if (pacersInXI.length > 0) {
    pacersInXI.sort((a, b) => b.eval.rating - a.eval.rating);
    const topPacerAvg = pacersInXI.slice(0, 3).reduce((acc, p) => acc + p.eval.rating, 0) / Math.min(pacersInXI.length, 3);
    const depthBonus = pacersInXI.length >= 3 ? 5 : pacersInXI.length >= 2 ? 2 : -10;
    paceScore = Math.min(98, Math.max(50, topPacerAvg + depthBonus));
  }

  // 7. Spin Bowling (Frontline Spinners in XI)
  const spinnersInXI = playingXI.filter(p => p.eval.bowlingType === 'spin');
  let spinScore = 55;
  if (spinnersInXI.length > 0) {
    spinnersInXI.sort((a, b) => b.eval.rating - a.eval.rating);
    const leadSpinnerRating = spinnersInXI[0].eval.rating;
    const depthBonus = spinnersInXI.length >= 2 ? 6 : 0;
    spinScore = Math.min(98, Math.max(50, leadSpinnerRating + depthBonus));
  } else {
    spinScore = 50; // No genuine spinner
  }

  // 8. Death Bowling (Overs 16-20 Specialists)
  const deathBowlersInXI = playingXI.filter(p => p.eval.isDeathBowler);
  let deathScore = 58;
  if (deathBowlersInXI.length > 0) {
    deathBowlersInXI.sort((a, b) => b.eval.rating - a.eval.rating);
    const leadDeath = deathBowlersInXI[0].eval.rating;
    deathScore = Math.min(99, leadDeath * 0.75 + (deathBowlersInXI.length >= 2 ? 22 : 12));
  } else {
    // Fallback to top pacer rating minus penalty
    deathScore = Math.max(50, paceScore - 12);
  }

  // 9. Squad Balance & IPL Rules Compliance
  let balanceScore = 80;
  if (overseasCount <= 4) balanceScore += 6; // Valid overseas rule
  if (hasKeeper) balanceScore += 6;
  if (bowlingOptionsCount >= 6) balanceScore += 6;
  else if (bowlingOptionsCount >= 5) balanceScore += 3;
  else balanceScore -= 18; // Under 5 bowling options is disastrous

  if (pacersInXI.length >= 2 && spinnersInXI.length >= 1) balanceScore += 4;
  balanceScore = Math.min(98, Math.max(45, balanceScore));

  // 10. Backup Depth (Bench Strength from Remaining Purchased Squad)
  let backupScore = 60;
  if (backups.length > 0) {
    const topBackups = backups.slice(0, 4);
    const backupAvg = topBackups.reduce((acc, p) => acc + p.eval.rating, 0) / topBackups.length;
    const hasBackupKeeper = backups.some(p => p.role === 'Wicket-Keeper');
    const hasBackupBowler = backups.some(p => p.role === 'Bowler' || p.role === 'All-Rounder');
    backupScore = Math.min(96, Math.max(55, backupAvg + (hasBackupKeeper ? 3 : 0) + (hasBackupBowler ? 3 : 0)));
  } else {
    backupScore = 50; // Bare 11 with no bench
  }

  // Weighted Total Score out of 100
  const weights = {
    opening: 0.10,
    middle: 0.12,
    finishing: 0.10,
    keeper: 0.08,
    allRounder: 0.12,
    pace: 0.12,
    spin: 0.10,
    death: 0.10,
    balance: 0.08,
    backup: 0.08
  };

  const weightedTotal =
    openingScore * weights.opening +
    middleScore * weights.middle +
    finishingScore * weights.finishing +
    keeperScore * weights.keeper +
    battingDepthScore * weights.allRounder +
    paceScore * weights.pace +
    spinScore * weights.spin +
    deathScore * weights.death +
    balanceScore * weights.balance +
    backupScore * weights.backup;

  const finalScore = Math.round(weightedTotal * 10) / 10;

  // Identify Strengths
  const dimensionList = [
    { label: 'Explosive Opening Pair', score: openingScore, desc: `${openers.map(p => p.name).join(' & ')} form a lethal top order.` },
    { label: 'Dominant Middle Order', score: middleScore, desc: 'Solid run accumulation and anchor stability at #3-#5.' },
    { label: 'Lethal Death Overs Finishing', score: finishingScore, desc: 'High-strike-rate power hitters equipped to accelerate late.' },
    { label: 'World-Class Wicketkeeper', score: keeperScore, desc: `${keeper?.name || 'Top keeper'} anchors glovework and middle order.` },
    { label: 'Batting Depth & All-Round Balance', score: battingDepthScore, desc: 'Multiple two-way all-rounders extend batting down the order.' },
    { label: 'Formidable Pace Attack', score: paceScore, desc: 'Penetrative pace spearheads with fiery wicket-taking pedigree.' },
    { label: 'Championship Spin Department', score: spinScore, desc: 'Quality spin variations capable of choking middle overs.' },
    { label: 'Elite Death Bowling', score: deathScore, desc: 'Clutch specialists capable of nailing yorkers and containing runs in overs 16-20.' },
    { label: 'Deep Bench & Quality Backups', score: backupScore, desc: `${backups.length} reserve options provide tactical versatility.` },
    { label: 'Impeccable Squad Balance', score: balanceScore, desc: 'Flawless role distribution strictly conforming to IPL regulations.' }
  ];

  dimensionList.sort((a, b) => b.score - a.score);
  const strengths = dimensionList.filter(d => d.score >= 82).slice(0, 3).map(d => d.label);

  // Identify Weaknesses
  const weaknesses = [];
  if (!hasKeeper) weaknesses.push('Missing a specialist wicket-keeper');
  else if (keeperScore < 72) weaknesses.push('Wicketkeeper lacks high T20 run output');

  if (spinScore < 72) weaknesses.push('Thin frontline spin bowling attack');
  if (paceScore < 72) weaknesses.push('Pace attack lacks proven wicket-takers');
  if (deathScore < 72) weaknesses.push('Vulnerable in death overs (overs 16-20)');
  if (finishingScore < 72) weaknesses.push('Lack of proven explosive power finishers');
  if (bowlingOptionsCount < 5) weaknesses.push('Critically short on 5 complete bowling options');
  if (backups.length < 3) weaknesses.push('Thin bench strength for long tournament campaigns');

  if (weaknesses.length === 0) {
    const lowest = [...dimensionList].reverse()[0];
    weaknesses.push(`Minor room for improvement in ${lowest.label.toLowerCase()}`);
  }

  // Explanation
  const topTwoStrengths = dimensionList.slice(0, 2).map(d => d.label).join(' and ');
  const explanation = `Constructed with outstanding ${topTwoStrengths}, boasting a well-rounded ${overseasCount}/4 overseas Playing XI with ${bowlingOptionsCount} capable bowling options.`;

  return {
    score: finalScore,
    dimensions: {
      openingPair: Math.round(openingScore * 10) / 10,
      middleOrder: Math.round(middleScore * 10) / 10,
      finishing: Math.round(finishingScore * 10) / 10,
      wicketkeeper: Math.round(keeperScore * 10) / 10,
      allRoundersAndDepth: Math.round(battingDepthScore * 10) / 10,
      paceBowling: Math.round(paceScore * 10) / 10,
      spinBowling: Math.round(spinScore * 10) / 10,
      deathBowling: Math.round(deathScore * 10) / 10,
      squadBalance: Math.round(balanceScore * 10) / 10,
      backupDepth: Math.round(backupScore * 10) / 10
    },
    playingXI,
    backups,
    hasKeeper,
    overseasCount,
    bowlingOptionsCount,
    strengths,
    weaknesses: weaknesses.slice(0, 2),
    explanation
  };
}

/**
 * Rank all teams participating in the auction based on their purchased squads
 */
export function rankAllTeams(activeTeams, allPlayersMaster = [], allTeamsMaster = []) {
  if (!activeTeams || activeTeams.length === 0) return [];

  const evaluatedTeams = activeTeams.map(teamDoc => {
    const teamMeta = allTeamsMaster.find(t => t.id === teamDoc.teamId) || {
      id: teamDoc.teamId || teamDoc.id,
      name: teamDoc.teamName || teamDoc.name || 'Team',
      color: 'bg-gray-700',
      textColor: 'text-white',
      logo: ''
    };

    // Hydrate squad from player IDs or player objects
    const purchasedSquad = (teamDoc.squad || []).map(s => {
      const pid = typeof s === 'string' ? s : s.id;
      const bid = typeof s === 'string' ? 0 : (s.bid || 0);
      const masterPlayer = allPlayersMaster.find(p => p.id === pid) || {};
      return {
        ...masterPlayer,
        ...(typeof s === 'object' ? s : {}),
        id: pid,
        bid
      };
    }).filter(p => p && p.id);

    const evaluation = evaluateSquad(teamMeta.id, purchasedSquad);

    return {
      teamId: teamMeta.id,
      teamName: teamMeta.name,
      teamLogo: teamMeta.logo,
      teamColor: teamMeta.color,
      teamTextColor: teamMeta.textColor,
      budgetRemaining: teamDoc.budgetRemaining ?? 0,
      spent: teamDoc.spent || 0,
      squadCount: purchasedSquad.length,
      purchasedSquad,
      ...evaluation
    };
  });

  // Sort descending by score out of 100
  evaluatedTeams.sort((a, b) => b.score - a.score);

  // Assign ranks
  return evaluatedTeams.map((team, index) => ({
    ...team,
    rank: index + 1
  }));
}
