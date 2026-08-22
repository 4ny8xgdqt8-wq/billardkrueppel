/* ==========================================================================
   Billardkrüppel ELO Calculations & Math Utilities
   ========================================================================== */


// Hilfsfunktion für deterministische Index-Auswahl (z.B. für Achievement-Phrasen)
window.getFixedIndex = (name, arrayLength) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % arrayLength;
};

// Animation utility for numbers (moved from index.html)
window.animateNumber = (id, target) => {
  const el = document.getElementById(id);
  if (!el) return;
  const duration = 800; // Dauer der Animation in ms
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const current = Math.floor(progress * target);
    el.innerText = id.includes("winrate") ? current + "%" : current;
    if (progress < 1) window.requestAnimationFrame(step);
    else
      el.innerText = id.includes("winrate")
        ? Math.round(target) + "%"
        : Math.round(target);
  };
  window.requestAnimationFrame(step);
};
// ---------------------------------------



// Helper function to convert Arabic numerals to Roman numerals
function toRoman(num) {
  const romanMap = {
    1000: "M",
    900: "CM",
    500: "D",
    400: "CD",
    100: "C",
    90: "XC",
    50: "L",
    40: "XL",
    10: "X",
    9: "IX",
    5: "V",
    4: "IV",
    1: "I",
  };
  let roman = "";
  for (const i of Object.keys(romanMap).sort((a, b) => b - a)) {
    while (num >= i) {
      roman += romanMap[i];
      num -= i;
    }
  }
  return roman;
}

// --- DYNAMISCHE GENERIERUNG VON NAMENSBEZOGENEN ACHIEVEMENTS ---
window.generateDynamicAchievements = () => {
  const generatedKillerAchs = [];
  // 10 Tiers bis 250 Siege, also Schritte von 25
  const killerTiers = [25, 50, 75, 100, 125, 150, 175, 200, 225, 250];

  const playerNamesArray = Array.from(window.spieler || []); // Alle konfigurierten Spieler

  // Achievements für jeden möglichen Gegner definieren (einmalig für den globalen Pool)
  playerNamesArray.forEach((opponentName) => {
    killerTiers.forEach((winsNeeded, tierIdx) => {
      generatedKillerAchs.push({
        cond: (d) => d.headToHead[opponentName]?.w >= winsNeeded,
        i: "🔪", // Messer-Icon für "Killer"
        t: `${opponentName}-Killer ${toRoman(tierIdx + 1)}`, // Z.B. "Thorsten-Killer I"
        d: [
          `Du hast ${opponentName} schon ${winsNeeded} mal besiegt.`,
          `${opponentName} ist dein Lieblingsgegner.`,
        ],
        h: `Gewinne ${winsNeeded} mal gegen ${opponentName}`,
        g: `${opponentName}-Killer`, // Gruppierung für das Tier-System
        tier: tierIdx + 1,
        max: winsNeeded === 250, // Markiert das höchste Tier
        k: "fame", // Explizit als "Fame" Achievement kennzeichnen
      });
    });
  });
  window.generatedKillerAchs = generatedKillerAchs; // Global speichern
};



window.processData = function (dataArray, todayStr) {
  const now = new Date();
  const checkToday = (dateStr) => {
    if (todayStr && dateStr && dateStr.startsWith(todayStr)) return true;
    const m = String(dateStr || "").match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (!m) return false;
    return (
      parseInt(m[1], 10) === now.getDate() &&
      parseInt(m[2], 10) === now.getMonth() + 1 &&
      parseInt(m[3], 10) === now.getFullYear()
    );
  };

  const pData = {};
  let blackWins = 0,
    breakWinsCount = 0;
  const aggregates = {
    totalBallMatches: 0,
    vollWins: 0,
    halbWins: 0,
    playerBallWins: {},
    teamResults: {},
    ballSpez: {},
    matchupStats: {},
    matchups: {},
    meetings: {},
    eloTransfers: {},
    sessionEloGains: {},
  };
  const initP = (n) => {
    if (!pData[n])
      pData[n] = {
        wins: 0,
        games: 0,
        rest: 0,
        maxStreak: 0,
        streak: 0,
        lastWin: false,
        clutchWins: 0,
        killerPoints: 0,
        blackWinsCount: 0,
        breakWins: 0,
        todayGames: 0,
        todayWins: 0,
        todayMaxStreak: 0,
        todayClutchWins: 0,
        todayBreakWins: 0,
        todayBlackWinsCount: 0,
        todayKillerPoints: 0,
        todayRest: 0,
        todayAvgRest: 0,
        currentStreak: 0,
        stolenServiceWins: 0,
        opponentStartedGames: 0,
        todayStolenServiceWins: 0,
        todayOpponentStartedGames: 0,
        regularWins: 0,
        foul8Wins: 0,
        lostBy8BallError: 0, // New
        todayRegularWins: 0,
        todayFoul8Wins: 0,
        todayLostBy8BallError: 0, // New today versions
        todayCloseLosses: 0,
      };
  };

  dataArray.forEach((g) => {
    const isTodayMatch = checkToday(g.d);
    const isTeam = g.m === "2:2";
    const p1Arr = (isTeam ? (g.p1 ? g.p1.split(" & ") : []) : [g.p1])
      .map((s) => String(s || "").trim())
      .filter(Boolean);
    const p2Arr = (isTeam ? (g.p2 ? g.p2.split(" & ") : []) : [g.p2])
      .map((s) => String(s || "").trim())
      .filter(Boolean);
    const winners = g.w == 1 ? p1Arr : p2Arr;
    const losers = g.w == 1 ? p2Arr : p1Arr;
    const winnerString = String(g.w == 1 ? g.p1 : g.p2 || "").trim();
    const loserString = g.w == 1 ? String(g.p2 || "") : String(g.p1 || "");
    const breaker = String(g.a || "").trim();
    const rest = parseInt(g.l || 0);

    // Normalisierung für Team-Vampir (einmal pro Match berechnen, sortiert Kopien)
    const winnerKey = [...winners].sort().join(" & ");
    const loserKey = [...losers].sort().join(" & ");

    [...p1Arr, ...p2Arr].forEach((p) => {
      if (p) {
        initP(p);
        pData[p].games++;
        if (isTodayMatch) pData[p].todayGames++;
      }
    });
    winners.forEach((p) => {
      if (!p) return;
      pData[p].wins++;
      if (isTodayMatch) {
        pData[p].todayWins++;
        pData[p].todayKillerPoints += rest;
        if (g.t && (g.t.includes("Schwarz") || g.t.includes("Gegner-Fehler")))
          pData[p].todayBlackWinsCount++;
        if (g.t === "Regulär (8er gelocht)") pData[p].todayRegularWins++; // New
        if (g.t === "Gegner-Fehler: Foul bei der 8") pData[p].todayFoul8Wins++; // New
        if (breaker && winners.includes(breaker)) pData[p].todayBreakWins++;
        if (rest === 1) pData[p].todayClutchWins++;
      }
      pData[p].killerPoints += rest;
      pData[p].streak = pData[p].lastWin ? pData[p].streak + 1 : 1;
      pData[p].currentStreak = pData[p].streak;

      // New win type counts
      if (g.t === "Regulär (8er gelocht)") {
        pData[p].regularWins++;
      }
      if (g.t === "Gegner-Fehler: Foul bei der 8") {
        pData[p].foul8Wins++;
      }

      if (pData[p].streak > pData[p].maxStreak)
        pData[p].maxStreak = pData[p].streak;
      if (isTodayMatch)
        pData[p].todayMaxStreak = Math.max(
          pData[p].todayMaxStreak || 0,
          pData[p].streak,
        );

      pData[p].lastWin = true;
      if (g.t && (g.t.includes("Schwarz") || g.t.includes("Gegner-Fehler")))
        pData[p].blackWinsCount++;
      if (breaker && winners.includes(breaker)) pData[p].breakWins++;

      // Service thief logic
      const myTeam = winners.includes(p) ? winners : losers;
      if (
        breaker &&
        !myTeam.includes(breaker) &&
        (winners.includes(breaker) || losers.includes(breaker))
      ) {
        pData[p].opponentStartedGames++;
        if (isTodayMatch) pData[p].todayOpponentStartedGames++;
        if (winners.includes(p)) {
          pData[p].stolenServiceWins++;
          if (isTodayMatch) pData[p].todayStolenServiceWins++;
        }
      }
    });
    losers.forEach((p) => {
      if (!p) return;
      pData[p].streak = 0;
      pData[p].currentStreak = 0;
      pData[p].lastWin = false;
      pData[p].rest += rest;
      if (isTodayMatch) pData[p].todayRest += rest;
      // New loss type counts
      if (g.t && g.t.startsWith("Gegner-Fehler:")) {
        pData[p].lostBy8BallError++;
        if (isTodayMatch) pData[p].todayLostBy8BallError++;
      }
      if (isTodayMatch && rest === 1) pData[p].todayCloseLosses++;
    });
    if (rest === 1)
      winners.forEach((p) => {
        if (p) pData[p].clutchWins++;
      });
    if (g.t && (g.t.includes("Schwarz") || g.t.includes("Gegner-Fehler")))
      blackWins++;
    if (breaker && winners.includes(breaker)) breakWinsCount++;

    // Aggregates Berechnung für Dashboard (Kugeln, Teams, Duelle)
    if (g.bt1 && g.bt2 && g.w) {
      aggregates.totalBallMatches++;
      const winType = g.w == 1 ? g.bt1 : g.bt2;
      if (winType === "Voll") aggregates.vollWins++;
      else if (winType === "Halb") aggregates.halbWins++;
      winners.forEach((n) => {
        if (!aggregates.playerBallWins[n])
          aggregates.playerBallWins[n] = { Voll: 0, Halb: 0 };
        aggregates.playerBallWins[n][winType]++;
      });
      const procSpez = (arr, type, isWin) =>
        arr.forEach((p) => {
          if (!aggregates.ballSpez[p])
            aggregates.ballSpez[p] = {
              Voll: { w: 0, g: 0 },
              Halb: { w: 0, g: 0 },
            };
          aggregates.ballSpez[p][type].g++;
          if (isWin) aggregates.ballSpez[p][type].w++;
        });
      procSpez(p1Arr, g.bt1, g.w == 1);
      procSpez(p2Arr, g.bt2, g.w == 2);
    }

    if (isTeam && p1Arr.length === 2 && p2Arr.length === 2) {
      const t1 = [...p1Arr].sort().join(" & "),
        t2 = [...p2Arr].sort().join(" & ");
      if (!aggregates.teamResults[t1])
        aggregates.teamResults[t1] = { w: 0, g: 0 };
      if (!aggregates.teamResults[t2])
        aggregates.teamResults[t2] = { w: 0, g: 0 };
      aggregates.teamResults[t1].g++;
      aggregates.teamResults[t2].g++;
      if (g.w == 1) aggregates.teamResults[t1].w++;
      else aggregates.teamResults[t2].w++;
    }

    if (!isTeam && p1Arr.length === 1 && p2Arr.length === 1) {
      const name1 = p1Arr[0],
        name2 = p2Arr[0];
      const winName = g.w == 1 ? name1 : name2;
      const loseName = g.w == 1 ? name2 : name1;
      const mKey = winName + " -> " + loseName;
      const uKey = [name1, name2].sort().join("|");
      aggregates.matchups[mKey] = (aggregates.matchups[mKey] || 0) + 1;
      aggregates.meetings[uKey] = (aggregates.meetings[uKey] || 0) + 1;
      if (!aggregates.matchupStats[uKey])
        aggregates.matchupStats[uKey] = {
          p1: name1,
          p2: name2,
          p1_wins: 0,
          p2_wins: 0,
          games: 0,
        };
      aggregates.matchupStats[uKey].games++;
      if (winName === aggregates.matchupStats[uKey].p1)
        aggregates.matchupStats[uKey].p1_wins++;
      else aggregates.matchupStats[uKey].p2_wins++;
    }
  });

  Object.keys(pData).forEach((p) => {
    const d = pData[p];
    d.todayAvgRest =
      d.todayGames - d.todayWins > 0
        ? d.todayRest / (d.todayGames - d.todayWins)
        : 0;
  });

  return { pData, blackWins, breakWins: breakWinsCount, aggregates };
};

window.computeEloRatings = function (allMatches) {
  const base = 1000;
  const ratings = {};
  const games = {};
  const parseSortTime = (gd) => {
    const s = String(gd || "");
    const m = s.match(
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[^\d]+(\d{1,2}):(\d{2}))?/,
    );
    if (!m) return 0;
    return new Date(
      parseInt(m[3], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[1], 10),
      m[4] ? parseInt(m[4], 10) : 0,
      m[5] ? parseInt(m[5], 10) : 0,
    ).getTime();
  };
  const ordered = (allMatches || [])
    .map((g, i) => ({ g, i }))
    .sort(
      (a, b) =>
        (parseSortTime(a.g.d) || 0) - (parseSortTime(b.g.d) || 0) || a.i - b.i,
    )
    .map((x) => x.g);

  const getR = (p) => (typeof ratings[p] === "number" ? ratings[p] : base);
  const getG = (p) => (typeof games[p] === "number" ? games[p] : 0);
  ordered.forEach((g) => {
    if (!g) return;
    const isTeam = g.m === "2:2";
    const team1 = (isTeam ? g.p1.split(" & ") : [g.p1]).filter(Boolean);
    const team2 = (isTeam ? g.p2.split(" & ") : [g.p2]).filter(Boolean);
    const r1 = team1.reduce((sum, p) => sum + getR(p), 0) / team1.length;
    const r2 = team2.reduce((sum, p) => sum + getR(p), 0) / team2.length;
    const e1 = 1 / (1 + Math.pow(10, (r2 - r1) / 400));
    const dScore = (g.w == 1 ? 1 : 0) - e1;
    team1.forEach((p) => {
      ratings[p] = getR(p) + (getG(p) < 20 ? 40 : 20) * dScore;
      games[p] = getG(p) + 1;
    });
    team2.forEach((p) => {
      ratings[p] = getR(p) - (getG(p) < 20 ? 40 : 20) * dScore;
      games[p] = getG(p) + 1;
    });
  });
  const out = {};
  Object.keys(ratings).forEach((p) => {
    out[p] = { elo: Math.round(ratings[p]), eloGames: games[p] };
  });
  return out;
};

/**
 * Diese Funktion nimmt die Basis-Daten vom Worker und fügt die Achievement-Logik hinzu.
 * Achievements enthalten Funktionen (cond), die nicht über den Worker laufen können.
 */
window.enrichStatsWithAchievements = function (
  baseStats,
  allMatches,
  configuredPlayers,
  dailyAchivs,
  isFullHistory = true,
) {
  // Wir starten mit leeren/initialen Stats für die Simulation, aber übernehmen matchDeltas und aggregates
  if (!baseStats) baseStats = { pData: {}, matchDeltas: {}, aggregates: {} };
  const simPData = {};
  const matchDeltas = JSON.parse(JSON.stringify(baseStats.matchDeltas || {}));
  const aggregates = JSON.parse(JSON.stringify(baseStats.aggregates || {}));

  // Helper to sort matches chronologically, essential for correct simulation
  const parseSortTime = (gd) => {
    const s = String(gd || "");
    const m = s.match(
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[^\d]+(\d{1,2}):(\d{2}))?/,
    );
    if (!m) return 0;
    return new Date(
      parseInt(m[3], 10),
      parseInt(m[2], 10) - 1,
      parseInt(m[1], 10),
      m[4] ? parseInt(m[4], 10) : 0,
      m[5] ? parseInt(m[5], 10) : 0,
    ).getTime();
  };
  const sortedMatches = [...allMatches].sort((a, b) => (parseSortTime(a.g?.d) || 0) - (parseSortTime(b.g?.d) || 0) || a.i - b.i);

  const allPools = [
    ...window.famePool,
    ...window.shamePool,
    ...(window.generatedKillerAchs || []),
  ];

  const nowObj = new Date();
  const todayStr = `${String(nowObj.getDate()).padStart(2, "0")}.${String(nowObj.getMonth() + 1).padStart(2, "0")}.${nowObj.getFullYear()}`; // DD.MM.YYYY
  const isoTodayStr = `${nowObj.getFullYear()}-${String(nowObj.getMonth() + 1).padStart(2, "0")}-${String(nowObj.getDate()).padStart(2, "0")}`; // YYYY-MM-DD

  const initSimP = (n) => {
    if (!simPData[n])
      simPData[n] = {
        wins: 0,
        games: 0,
        rest: 0,
        maxStreak: 0,
        currentStreak: 0,
        lastWin: false,
        clutchWins: 0,
        closeWins: 0,
        closeLosses: 0,
        dramaWins: 0,
        killerPoints: 0,
        blackWinsCount: 0,
        breakWins: 0,
        todayWins: 0,
        todayGames: 0,
        todayMaxStreak: 0,
        todayClutchWins: 0,
        todayBreakWins: 0,
        todayBlackWinsCount: 0,
        todayKillerPoints: 0,
        todayRest: 0,
        todayAvgRest: 0,
        loseStreak: 0,
        maxLoseStreak: 0,
        eloHistory: [],
        maxElo: 1000,
        fastestWin: Infinity,
        longestMatch: 0,
        totalWinDuration: 0,
        avgWinDuration: 0,
        totalMatchDuration: 0,
        avgMatchDuration: 0,
        todayFastestWin: Infinity,
        todayLongestMatch: 0,
        todayTotalWinDuration: 0,
        todayAvgWinDuration: 0,
        todayTotalMatchDuration: 0,
        todayAvgMatchDuration: 0,
        gamesWithDuration: 0,
        winsWithDuration: 0,
        todayGamesWithDuration: 0,
        todayWinsWithDuration: 0,
        regularWins: 0,
        foul8Wins: 0,
        lostBy8BallError: 0,
        stolenServiceWins: 0,
        opponentStartedGames: 0,
        todayStolenServiceWins: 0,
        todayOpponentStartedGames: 0,
        todayRegularWins: 0,
        todayFoul8Wins: 0,
        todayLostBy8BallError: 0,
        todayCloseLosses: 0, // Missing Inits
        maxWinRate: 0,
        winsVsTopElo: 0,
        vsNemesisWins: 0,
        vsWorstOpponentLosses: 0, // Initialisiert
        winRate: 0,
        avgKiller: 0,
        avgRest: 0,
        winRateLast30: 0, // Initialisiert
        avgRestLossLast20: 0,
        avgKillerLast20: 0,
        eloDelta10: 0,
        winRateDelta20: 0, // Initialisiert
        headToHead: {},
        achTracker: {},
        achCountTotal: 0,
        completedTracks: 0,
        dailyDaysWithAch: 0,
        last30Games: [],
        last20Losses: [],
        last20WinsKiller: [],
        gameResultsHistory: [],
        elo: 1000,
        eloGames: 0,
        avgKiller: 0,
        avgRest: 0,
        winRate: 0, // Sicherstellen, dass diese auch initialisiert sind
      };
  };

  const getElo = (p) =>
    simPData[p] && typeof simPData[p].elo === "number" ? simPData[p].elo : 1000;

  sortedMatches.forEach(({ g, i: originalIndex }) => {
    if (!g || !g.d || !g.p1 || !g.p2 || !g.w) return; // Robustheit: Korrupte Matches überspringen
    matchDeltas[originalIndex] = matchDeltas[originalIndex] || { eloDelta: 0 };
    const dateStr = g.d.split(",")[0].trim();
    const dp = dateStr.split(".");
    const isoDate =
      dp.length === 3
        ? `${dp[2]}-${dp[1].padStart(2, "0")}-${dp[0].padStart(2, "0")}`
        : "unknown";

    const isTeam = g.m === "2:2";
    const p1A = (isTeam ? (g.p1 ? g.p1.split(" & ") : []) : [g.p1])
      .map((s) => String(s || "").trim())
      .filter(Boolean);
    const p2A = (isTeam ? (g.p2 ? g.p2.split(" & ") : []) : [g.p2])
      .map((s) => String(s || "").trim())
      .filter(Boolean);
    const players = [...p1A, ...p2A]
      .map((s) => String(s || "").trim())
      .filter(Boolean);

    players.forEach(initSimP);

    // Wer war vor dem Match die Nr. 1? (Wichtig für Riesen-Jäger)
    let currentTopPlayer = null;
    let highestEloFound = -1;
    Object.keys(simPData).forEach((pName) => {
      if (simPData[pName].elo > highestEloFound) {
        highestEloFound = simPData[pName].elo;
        currentTopPlayer = pName;
      }
    });

    // Vor dem Match: Zustand sichern für "Neu"-Erkennung
    const pDataBeforeMatch = {};
    players.forEach((p) => {
      pDataBeforeMatch[p] = JSON.parse(JSON.stringify(simPData[p]));
    });

    const winners = g.w == 1 ? p1A : p2A;
    const losers = g.w == 1 ? p2A : p1A;
    const loserString = g.w == 1 ? String(g.p2 || "") : String(g.p1 || "");
    const rest = parseInt(g.l || 0); const duration = g.durationSeconds ? Number(g.durationSeconds) : (g.duration ? Number(g.duration) * 60 : 0);
    const winnerString = String(g.w == 1 ? g.p1 : g.p2 || "").trim(); // Trimmed winner string for break check
    const breakerString = String(g.a || "").trim();
    // ELO Berechnung für die Simulation

    // Track break games
    if (breakerString) {
        const isMatchFromToday = g.d && g.d.startsWith(todayStr);
        if (p1A.includes(breakerString)) {
            p1A.forEach(p => {
                if (simPData[p]) {
                    simPData[p].breakGames = (simPData[p].breakGames || 0) + 1;
                    if (isMatchFromToday) simPData[p].todayBreakGames = (simPData[p].todayBreakGames || 0) + 1;
                }
            });
        } else if (p2A.includes(breakerString)) {
            p2A.forEach(p => {
                if (simPData[p]) {
                    simPData[p].breakGames = (simPData[p].breakGames || 0) + 1;
                    if (isMatchFromToday) simPData[p].todayBreakGames = (simPData[p].todayBreakGames || 0) + 1;
                }
            });
        }
    }

    const avg1 = p1A.reduce((s, p) => s + getElo(p), 0) / (p1A.length || 1);
    const avg2 = p2A.reduce((s, p) => s + getElo(p), 0) / (p2A.length || 1);
    const exp1 = 1 / (1 + Math.pow(10, (avg2 - avg1) / 400));
    const eloChangeBase = (g.w == 1 ? 1 : 0) - exp1;

    players.forEach((p) => {
      const d = simPData[p];
      const isW = winners.includes(p); // winners (p1A/p2A) are already trimmed arrays

      // H2H Simulation
      if (isW) {
        losers.forEach((l) => {
          // losers (p1A/p2A) are already trimmed arrays
          if (!d.headToHead[l]) d.headToHead[l] = { w: 0, l: 0 };
          d.headToHead[l].w++;
        });
      } else {
        // Current player 'p' lost
        winners.forEach((w) => {
          // winners (p1A/p2A) are already trimmed arrays
          if (!d.headToHead[w]) d.headToHead[w] = { w: 0, l: 0 };
          d.headToHead[w].l++;
        });
      }

      d.games++;
      d.longestMatch = Math.max(d.longestMatch, duration);
      d.totalMatchDuration = (d.totalMatchDuration || 0) + duration;
      if (duration > 0) d.gamesWithDuration = (d.gamesWithDuration || 0) + 1;

      d.gameResultsHistory.push(isW ? 1 : 0);
      d.last30Games.push(isW ? 1 : 0);
      if (d.last30Games.length > 30) d.last30Games.shift();

      if (isW) {
        d.wins++;
        d.currentStreak++;
        d.loseStreak = 0;
        d.lastWin = true;
        if (d.currentStreak > d.maxStreak) d.maxStreak = d.currentStreak;
        if (g.t?.includes("Schwarz") || g.t?.includes("Gegner-Fehler"))
          d.blackWinsCount++;

        if (duration > 0) {
          d.fastestWin = Math.min(d.fastestWin, duration);
        }
        d.totalWinDuration = (d.totalWinDuration || 0) + duration;
        if (duration > 0) d.winsWithDuration = (d.winsWithDuration || 0) + 1;

        // Break-Win Simulation
        if (g.t === "Regulär (8er gelocht)") {
          d.regularWins++;
        }
        if (g.t === "Gegner-Fehler: Foul bei der 8") {
          d.foul8Wins++;
        }
        // Break-Win Simulation
        if (breakerString && winners.includes(breakerString)) {
          d.breakWins++;
        }

        if (rest === 1) {
          d.clutchWins++;
          d.closeWins++;
          d.dramaWins++;
        }
        d.killerPoints += rest;
        d.last20WinsKiller.push(rest);
        if (d.last20WinsKiller.length > 20) d.last20WinsKiller.shift();

        if (currentTopPlayer && losers.includes(currentTopPlayer))
          d.winsVsTopElo++;

        let nemesis = null;
        let maxL = 0;
        Object.entries(d.headToHead).forEach(([opp, st]) => {
          if (st.l > maxL) {
            maxL = st.l;
            nemesis = opp;
          }
        });
        if (nemesis && losers.includes(nemesis)) d.vsNemesisWins++; // losers is already trimmed
      } else {
        d.rest += rest;
        d.currentStreak = 0;
        d.loseStreak++;
        d.lastWin = false;
        if (d.loseStreak > d.maxLoseStreak) d.maxLoseStreak = d.loseStreak;
        if (rest === 1) d.closeLosses++;
        d.last20Losses.push(rest);
        if (d.last20Losses.length > 20) d.last20Losses.shift();
        if (g.t && g.t.startsWith("Gegner-Fehler:")) {
          d.lostBy8BallError++;
        }
        if (rest === 1) d.closeLosses++;

        let worstOpp = null;
        let maxL = 0;
        Object.entries(d.headToHead).forEach(([opp, st]) => {
          if (st.l > maxL) {
            maxL = st.l;
            worstOpp = opp;
          }
        });
        if (worstOpp && winners.includes(worstOpp)) d.vsWorstOpponentLosses++; // winners is already trimmed
      }

      // Elo Simulation
      const k = d.eloGames < 20 ? 40 : 20;
      const change = p1A.includes(p) ? k * eloChangeBase : -(k * eloChangeBase);
      d.elo += change;
      d.eloGames++;
      d.eloHistory.push(Math.round(d.elo));
      if (d.elo > d.maxElo) d.maxElo = Math.round(d.elo);

      // Service thief logic
      const isMyTeamBreaker = isW
        ? winners.includes(breakerString)
        : losers.includes(breakerString);
      if (
        breakerString &&
        !isMyTeamBreaker &&
        (winners.includes(breakerString) || losers.includes(breakerString))
      ) {
        d.opponentStartedGames++;
        if (isW) d.stolenServiceWins++;
      }

      d.winRateLast30 =
        d.last30Games.length > 0
          ? Math.round(
              (d.last30Games.reduce((a, b) => a + b, 0) /
                d.last30Games.length) *
                100,
            )
          : 0;
      d.avgRestLossLast20 =
        d.last20Losses.length > 0
          ? d.last20Losses.reduce((a, b) => a + b, 0) / d.last20Losses.length
          : 0;
      d.avgKillerLast20 =
        d.last20WinsKiller.length > 0
          ? d.last20WinsKiller.reduce((a, b) => a + b, 0) /
            d.last20WinsKiller.length
          : 0;

      if (d.eloHistory.length >= 10) {
        const prevElo =
          d.eloHistory.length === 10
            ? 1000
            : d.eloHistory[d.eloHistory.length - 11];
        d.eloDelta10 = d.eloHistory[d.eloHistory.length - 1] - prevElo;
      }

      if (d.games >= 40) {
        const first20 = d.gameResultsHistory.slice(0, 20);
        const last20 = d.gameResultsHistory.slice(-20);
        d.winRateDelta20 =
          (last20.reduce((a, b) => a + b, 0) / 20) * 100 -
          (first20.reduce((a, b) => a + b, 0) / 20) * 100;
      }
    });

    let totalMatchDeltaSum = 0;
    winners.forEach((p) => {
      const k = simPData[p].eloGames < 20 ? 40 : 20;
      const change = p1A.includes(p) ? k * eloChangeBase : -(k * eloChangeBase);
      totalMatchDeltaSum += Math.round(Math.abs(change));
    });

    const matchEloDelta = Math.round(
      totalMatchDeltaSum / (winners.length || 1),
    );
    matchDeltas[originalIndex].eloDelta = matchEloDelta;

    // Keine Mutation mehr! Normalisierung für Vampir-Transfers (Check nur für Simulation)
    const winnerKey = [...winners].sort().join(" & ");
    const loserKey = [...losers].sort().join(" & ");

    if (g.d && g.d.startsWith(todayStr)) {
      players.forEach((p) => {
        if (!simPData[p]) return;
        const d = simPData[p];
        d.todayGames++;
        d.todayLongestMatch = Math.max(d.todayLongestMatch, duration);
        d.todayTotalMatchDuration = (d.todayTotalMatchDuration || 0) + duration;
        if (duration > 0) d.todayGamesWithDuration = (d.todayGamesWithDuration || 0) + 1;

        if (winners.includes(p)) {
          // winners is already trimmed
          d.todayWins++;
          d.todayKillerPoints += rest;
          d.todayMaxStreak = Math.max(d.todayMaxStreak, d.currentStreak);
          if (duration > 0) {
            d.todayFastestWin = Math.min(d.todayFastestWin, duration);
          }
          d.todayTotalWinDuration = (d.todayTotalWinDuration || 0) + duration;
          if (duration > 0) d.todayWinsWithDuration = (d.todayWinsWithDuration || 0) + 1;

          if (g.t?.includes("Schwarz") || g.t?.includes("Gegner-Fehler"))
            d.todayBlackWinsCount++;
          if (g.t === "Regulär (8er gelocht)") simPData[p].todayRegularWins++; // New
          if (g.t === "Gegner-Fehler: Foul bei der 8")
            d.todayFoul8Wins++; // New

          if (breakerString && winners.includes(breakerString))
            d.todayBreakWins++;
          if (rest === 1) simPData[p].todayClutchWins++;

          // Today Service thief
          const isMyTeamBreakerToday = winners.includes(breakerString);
          if (
            breakerString &&
            !isMyTeamBreakerToday &&
            (winners.includes(breakerString) || losers.includes(breakerString))
          ) {
            d.todayOpponentStartedGames++;
            d.todayStolenServiceWins++;
          }
        } else {
          d.todayRest += rest;
        }
        d.todayAvgRest =
          d.todayGames - d.todayWins > 0
            ? d.todayRest / (d.todayGames - d.todayWins)
            : 0;
      });
    }

    players.forEach((p) => {
      if (!simPData[p]) return;
      const d = simPData[p],
        dBefore = pDataBeforeMatch[p] || { achTracker: {} };

      const isMatchFromToday = g.d && g.d.startsWith(todayStr);

      // Zentrale Funktion zum Speichern neuer Erfolge (Daily + Langzeit)
      const recordNewAch = (ach, player) => {
        // player-Parameter hinzugefügt
        if (!matchDeltas[originalIndex])
          matchDeltas[originalIndex] = {
            eloDelta: Math.round(20 * Math.abs(eloChangeBase)),
          };
        matchDeltas[originalIndex].newAchievements =
          matchDeltas[originalIndex].newAchievements || {};
        matchDeltas[originalIndex].newAchievements[p] =
          matchDeltas[originalIndex].newAchievements[p] || [];
        matchDeltas[originalIndex].newAchievements[p].push({
          i: ach.i,
          t: ach.t,
          d: ach.d,
          h: ach.h,
          k: ach.k || (window.famePool.includes(ach) ? "fame" : "shame"),
          max: ach.max,
        });

        // In die persistente Tages-Statistik schreiben (für Daily-Sammler & Historie)
        if (isMatchFromToday && isFullHistory && dailyAchivs) {
          if (!dailyAchivs.days) dailyAchivs.days = {};
          if (!dailyAchivs.days[isoTodayStr])
            dailyAchivs.days[isoTodayStr] = {};
          if (!dailyAchivs.days[isoTodayStr][p])
            dailyAchivs.days[isoTodayStr][p] = [];
          if (!dailyAchivs.days[isoTodayStr][p].includes(ach.t))
            dailyAchivs.days[isoTodayStr][p].push(ach.t);
        }
      };

      // 1. Tägliche Erfolge prüfen
      if (isMatchFromToday) {
        const dailyPool = [...window.dailyFamePool, ...window.dailyShamePool];
        // Ensure today's stats are correctly calculated before checking conditions
        d.todayAvgRest =
          d.todayGames - d.todayWins > 0
            ? d.todayRest / (d.todayGames - d.todayWins)
            : 0;

        dailyPool.forEach((ach) => {
          const hasNow = ach.cond(d);
          const hadBefore = ach.cond(dBefore);
          if (hasNow && !hadBefore) recordNewAch(ach);
          else if (
            !hasNow &&
            hadBefore &&
            isFullHistory &&
            dailyAchivs?.days?.[isoTodayStr]?.[p]
          ) {
            // Entfernen, falls Bedingung nicht mehr erfüllt (z.B. Tageskönig durch Niederlage weg)
            const idx = dailyAchivs.days[isoTodayStr][p].indexOf(ach.t);
            if (idx > -1) dailyAchivs.days[isoTodayStr][p].splice(idx, 1);
          }
        });
      }

      // 2. Langzeit-Erfolge prüfen
      allPools.forEach((ach) => {
        const hasNow = ach.cond(d);
        // AchTracker muss den vollen Namen des Achievements verwenden, um Kollisionen zu vermeiden
        const achKey = ach.g ? `${ach.g}_${ach.tier}` : ach.t; // Eindeutiger Schlüssel für getrackte Achievements
        if (!d.achTracker[achKey])
          d.achTracker[achKey] = { earned: 0, lost: 0, active: false };
        if (hasNow && !d.achTracker[achKey].active) {
          d.achTracker[achKey].earned++;
          d.achTracker[achKey].active = true;
        } else if (!hasNow && d.achTracker[achKey].active) {
          d.achTracker[achKey].lost++;
          d.achTracker[achKey].active = false;
        }

        if (
          hasNow &&
          (!dBefore.achTracker[achKey] || !dBefore.achTracker[achKey].active)
        ) {
          recordNewAch(ach);
        }
      });
    });
  });

  // Finalize stats for all players AFTER the simulation loop
  Object.keys(simPData).forEach((p) => {
    const d = simPData[p];
    d.winRate = Math.round((d.wins / d.games) * 100);
    d.maxWinRate = Math.max(d.maxWinRate || 0, d.winRate);
    d.avgKiller = d.wins > 0 ? d.killerPoints / d.wins : 0;
    d.avgRest = d.games - d.wins > 0 ? d.rest / (d.games - d.wins) : 0;
    d.avgWinDuration = d.winsWithDuration > 0 ? d.totalWinDuration / d.winsWithDuration : 0;
    d.avgMatchDuration = d.gamesWithDuration > 0 ? d.totalMatchDuration / d.gamesWithDuration : 0;
    if (d.fastestWin === Infinity) d.fastestWin = 0;

    // Also finalize today's averages
    d.todayAvgRest =
      d.todayGames - d.todayWins > 0
        ? d.todayRest / (d.todayGames - d.todayWins)
        : 0;
    d.todayAvgWinDuration =
      d.todayWinsWithDuration > 0 ? d.todayTotalWinDuration / d.todayWinsWithDuration : 0;
    d.todayAvgMatchDuration =
      d.todayGamesWithDuration > 0
        ? d.todayTotalMatchDuration / d.todayGamesWithDuration
        : 0;
    if (d.todayFastestWin === Infinity) d.todayFastestWin = 0;
  });

  // Das finale pData-Objekt wird aus simPData aufgebaut, da simPData die vollständigen simulierten Werte enthält
  const finalPData = {};
  Object.keys(simPData).forEach((p) => {
    const d = simPData[p]; // Dies ist das vollständig simulierte Spieler-Datenobjekt

    // Sicherstellen, dass alle benötigten Eigenschaften vorhanden sind
    if (!d.achTracker) d.achTracker = {};
    if (typeof d.blackWinsCount === "undefined") d.blackWinsCount = 0;
    if (typeof d.regularWins === "undefined") d.regularWins = 0;
    if (typeof d.foul8Wins === "undefined") d.foul8Wins = 0;
    if (typeof d.lostBy8BallError === "undefined") d.lostBy8BallError = 0;
    if (typeof d.todayRegularWins === "undefined") d.todayRegularWins = 0;
    if (typeof d.todayFoul8Wins === "undefined") d.todayFoul8Wins = 0;
    if (typeof d.todayLostBy8BallError === "undefined")
      d.todayLostBy8BallError = 0;
    if (typeof d.todayBlackWinsCount === "undefined") d.todayBlackWinsCount = 0;

    // Achievement-Zähler und Track-Abschlüsse berechnen
    let currentAchs = []; // Achievements, die der Spieler aktuell besitzt
    allPools.forEach((ach) => {
      if (ach.cond(d)) currentAchs.push(ach);
    });

    // Tier-System für Achievements anwenden
    const tierBest = {};
    currentAchs.forEach((it) => {
      if (!it.g || !it.tier) return;
      const key = it.k + "|" + it.g;
      if (!tierBest[key] || it.tier > tierBest[key].tier) tierBest[key] = it; // Nur das höchste erreichte Tier pro Gruppe
    });
    // Filter die nicht-Tier-Achievements und füge die besten Tier-Achievements hinzu
    const finalAchs = currentAchs.filter((it) => !(it.g && it.tier));
    Object.values(tierBest).forEach((a) => finalAchs.push(a));

    d.achCountTotal = finalAchs.length;

    if (dailyAchivs && dailyAchivs.days) {
      for (const dayKey in dailyAchivs.days) {
        const dayRec = dailyAchivs.days[dayKey] || {};
        if (Array.isArray(dayRec[p]) && dayRec[p].length > 0)
          d.dailyDaysWithAch++;
      }
    }

    // Completed Tracks berechnen
    const tracks = {};
    finalAchs.forEach((ach) => {
      if (ach.g && ach.tier)
        tracks[ach.g] = Math.max(tracks[ach.g] || 0, ach.tier);
    }); // Höchstes Tier pro Track
    const allTrackNames = new Set();
    allPools.forEach((ach) => {
      if (ach.g && ach.tier) allTrackNames.add(ach.g);
    });
    allTrackNames.forEach((tn) => {
      const maxInPool = allPools
        .filter((a) => a.g === tn)
        .reduce((m, a) => Math.max(m, a.tier || 0), 0);
      if (maxInPool > 0 && tracks[tn] === maxInPool) d.completedTracks++;
    });

    finalPData[p] = d; // Füge den Spieler mit allen berechneten Werten hinzu
  });

  return {
    pData: finalPData,
    matchDeltas,
    aggregates,
    blackWins: baseStats.blackWins,
    breakWins: baseStats.breakWins,
  };
};


window.processAllStatsChronologically = function (matches, players, todayStr) {
  // Nutzt die vorhandene computeEloRatings Logik für ELO und processData für Stats
  const elo = window.computeEloRatings(matches);
  const base = window.processData(matches, todayStr);
  return {
    pData: base.pData,
    matchDeltas: {},
    aggregates: base.aggregates,
    blackWins: base.blackWins,
    breakWins: base.breakWins,
  };
};

// Hilfsfunktion für lokale Berechnungen (Fallback, wenn Worker blockiert ist)
window.calculateStatsLocally = function (allMatches, players, todayStr = null) {
  const pData = {};
  const eloRatings = {};
  const eloGamesCount = {};
  let blackWins = 0;
  let breakWinsCount = 0;
  const aggregates = {
    totalBallMatches: 0,
    vollWins: 0,
    halbWins: 0,
    playerBallWins: {},
    teamResults: {},
    ballSpez: {},
    matchupStats: {},
    matchups: {},
    meetings: {},
    eloTransfers: {},
    sessionEloGains: {},
  };
  const matchDeltas = {};

  const initP = (n) => {
    if (!pData[n])
      pData[n] = {
        wins: 0,
        games: 0,
        rest: 0,
        maxStreak: 0,
        currentStreak: 0,
        lastWin: false,
        clutchWins: 0,
        killerPoints: 0,
        blackWinsCount: 0,
        breakWins: 0,
        breakGames: 0,
        loseStreak: 0,
        maxLoseStreak: 0,
        eloHistory: [],
        maxElo: 1000,
        maxWinRate: 0,
        last30Games: [],
        last20Losses: [],
        last20WinsKiller: [],
        gameResultsHistory: [],
        regularWins: 0,
        foul8Wins: 0,
        lostBy8BallError: 0,
        headToHead: {},
        winsVsTopElo: 0,
        vsNemesisWins: 0,
        vsWorstOpponentLosses: 0,
        closeWins: 0,
        closeLosses: 0,
        dramaWins: 0,
        todayGames: 0,
        todayWins: 0,
        todayMaxStreak: 0,
        todayClutchWins: 0,
        todayBreakWins: 0,
        todayBreakGames: 0,
        todayBlackWinsCount: 0,
        todayKillerPoints: 0,
        todayRest: 0,
        todayAvgRest: 0,
        todayRegularWins: 0,
        todayFoul8Wins: 0,
        todayLostBy8BallError: 0,
        stolenServiceWins: 0,
        opponentStartedGames: 0,
        todayStolenServiceWins: 0,
        todayOpponentStartedGames: 0,
        fastestWin: Infinity,
        longestMatch: 0,
        totalWinDuration: 0,
        avgWinDuration: 0,
        totalMatchDuration: 0,
        avgMatchDuration: 0,
        todayFastestWin: Infinity,
        todayLongestMatch: 0,
        todayTotalWinDuration: 0,
        todayAvgWinDuration: 0,
        todayTotalMatchDuration: 0,
        todayAvgMatchDuration: 0,
        gamesWithDuration: 0,
        winsWithDuration: 0,
        todayGamesWithDuration: 0,
        todayWinsWithDuration: 0,
      };
  };

  const sorted = [...allMatches].sort((a, b) => {
    const parse = (s) => {
      const m = String(s || "").match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      return m
        ? new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1])).getTime()
        : 0;
    };
    return parse(a.d) - parse(b.d);
  });

  sorted.forEach((g, originalIndex) => {
    const dateStr = g.d.split(",")[0].trim();
    const dp = dateStr.split(".");
    const isoDate =
      dp.length === 3
        ? `${dp[2]}-${dp[1].padStart(2, "0")}-${dp[0].padStart(2, "0")}`
        : "unknown";
    const normalizeDate = (s) =>
      (s || "")
        .split(",")[0]
        .trim()
        .split(".")
        .map((p) => parseInt(p, 10))
        .join(".");
    const targetNorm = todayStr ? normalizeDate(todayStr) : null;
    const isTodayMatch = targetNorm && g.d && normalizeDate(g.d) === targetNorm;

    const isTeam = g.m === "2:2";
    const p1A = (isTeam ? (g.p1 ? g.p1.split(" & ") : []) : [g.p1])
      .map((s) => String(s || "").trim())
      .filter(Boolean);
    const p2A = (isTeam ? (g.p2 ? g.p2.split(" & ") : []) : [g.p2])
      .map((s) => String(s || "").trim())
      .filter(Boolean);
    const winnerStr = String(g.w == 1 ? g.p1 : g.p2 || "").trim();
    const loserStr = String(g.w == 1 ? g.p2 : g.p1 || "").trim();
    const breakerString = String(g.a || "").trim();
    const playersInMatch = [...p1A, ...p2A];
    playersInMatch.forEach(initP);

    // Track break games
    if (breakerString) {
        if (p1A.includes(breakerString)) {
            p1A.forEach(p => {
                if (pData[p]) {
                    pData[p].breakGames = (pData[p].breakGames || 0) + 1;
                    if (isTodayMatch) pData[p].todayBreakGames = (pData[p].todayBreakGames || 0) + 1;
                }
            });
        } else if (p2A.includes(breakerString)) {
            p2A.forEach(p => {
                if (pData[p]) {
                    pData[p].breakGames = (pData[p].breakGames || 0) + 1;
                    if (isTodayMatch) pData[p].todayBreakGames = (pData[p].todayBreakGames || 0) + 1;
                }
            });
        }
    }

    const winners = g.w == 1 ? p1A : p2A;
    const losers = g.w == 1 ? p2A : p1A;
    const rest = parseInt(g.l || 0);
    const duration = g.durationSeconds ? Number(g.durationSeconds) : (g.duration ? Number(g.duration) * 60 : 0);

    if (g.t && (g.t.includes("Schwarz") || g.t.includes("Gegner-Fehler")))
      blackWins++;
    if (breakerString && winners.includes(breakerString)) {
      breakWinsCount++;
    }

    // H2H Update for fallback
    winners.forEach((w) => {
      losers.forEach((l) => {
        if (!pData[w].headToHead[l]) pData[w].headToHead[l] = { w: 0, l: 0 };
        if (!pData[l].headToHead[w]) pData[l].headToHead[w] = { w: 0, l: 0 };
        pData[w].headToHead[l].w++;
        pData[l].headToHead[w].l++;
      });
    });

    // Wer war vor dem Match die Nr. 1?
    let currentTopPlayer = null;
    let highestEloFound = -1;
    Object.keys(eloRatings).forEach((p) => {
      if (eloRatings[p] > highestEloFound) {
        highestEloFound = eloRatings[p];
        currentTopPlayer = p;
      }
    });

    const avg1 =
      p1A.reduce((s, p) => s + (eloRatings[p] || 1000), 0) / (p1A.length || 1);
    const avg2 =
      p2A.reduce((s, p) => s + (eloRatings[p] || 1000), 0) / (p2A.length || 1);
    const exp1 = 1 / (1 + Math.pow(10, (avg2 - avg1) / 400));
    const eloChange = (g.w == 1 ? 1 : 0) - exp1;

    // Achievements-Metriken berechnen (for fallback)
    winners.forEach((p) => {
      if (currentTopPlayer && losers.includes(currentTopPlayer))
        pData[p].winsVsTopElo++;
      let nemesis = null;
      let maxL = 0;
      Object.entries(pData[p].headToHead).forEach(([opp, stats]) => {
        if (stats.l > maxL) {
          maxL = stats.l;
          nemesis = opp;
        }
      });
      if (nemesis && losers.includes(nemesis)) pData[p].vsNemesisWins++;
      if (rest === 1) {
        pData[p].closeWins++;
        pData[p].dramaWins++;
      }
    });
    losers.forEach((p) => {
      if (rest === 1) pData[p].closeLosses++;
      // New loss type counts
      if (g.t && g.t.startsWith("Gegner-Fehler:")) {
        pData[p].lostBy8BallError++;
      }

      let worstOpp = null;
      let maxL = 0;
      Object.entries(pData[p].headToHead).forEach(([opp, stats]) => {
        if (stats.l > maxL) {
          maxL = stats.l;
          worstOpp = opp;
        }
      });
      if (worstOpp && winners.includes(worstOpp))
        pData[p].vsWorstOpponentLosses++;
    });

    playersInMatch.forEach((p) => {
      const isW = winners.includes(p);
      const d = pData[p];
      d.games++;
      d.longestMatch = Math.max(d.longestMatch, duration);
      d.totalMatchDuration += duration;
    if (duration > 0) {
      d.gamesWithDuration = (d.gamesWithDuration || 0) + 1;
    }
      d.gameResultsHistory.push(isW ? 1 : 0);

      if (isTodayMatch) {
        d.todayGames++;
        d.todayLongestMatch = Math.max(d.todayLongestMatch, duration);
        d.todayTotalMatchDuration += duration;
      if (duration > 0) {
        d.todayGamesWithDuration = (d.todayGamesWithDuration || 0) + 1;
      }
      }

      if (isW) {
        d.wins++;
        if (duration > 0) {
          d.fastestWin = Math.min(d.fastestWin, duration);
        }
      if (duration > 0) {
        d.winsWithDuration = (d.winsWithDuration || 0) + 1;
      }
        d.totalWinDuration += duration;
        d.killerPoints += rest;
        d.currentStreak++;
        d.loseStreak = 0;
        d.lastWin = true;
        if (d.currentStreak > d.maxStreak) d.maxStreak = d.currentStreak;

        if (isTodayMatch) {
          d.todayWins++;
          d.todayKillerPoints += rest;
          d.todayMaxStreak = Math.max(d.todayMaxStreak, d.currentStreak);
          if (rest === 1) d.todayClutchWins++;
          if (duration > 0) {
            d.todayFastestWin = Math.min(d.todayFastestWin, duration);
          }
        if (duration > 0) {
          d.todayWinsWithDuration = (d.todayWinsWithDuration || 0) + 1;
        }
          d.todayTotalWinDuration += duration;
        }

        if (g.t && (g.t.includes("Schwarz") || g.t.includes("Gegner-Fehler"))) {
          d.blackWinsCount++;
          if (isTodayMatch) d.todayBlackWinsCount++;
        }
        // New win type counts
        if (g.t === "Regulär (8er gelocht)") {
          d.regularWins++;
          if (isTodayMatch) d.todayRegularWins++;
        }
        if (g.t === "Gegner-Fehler: Foul bei der 8") {
          d.foul8Wins++;
          if (isTodayMatch) d.todayFoul8Wins++;
        }
        // Corrected breakWins logic for individual players in fallback
        if (breakerString && winners.includes(breakerString)) {
          d.breakWins++;
          if (isTodayMatch) d.todayBreakWins++;
        }
        if (rest === 1) {
          d.clutchWins++;
          if (isTodayMatch) d.todayClutchWins++;
        }
        d.last20WinsKiller.push(rest);
        if (d.last20WinsKiller.length > 20) d.last20WinsKiller.shift();
      } else {
        d.rest += rest;
        d.currentStreak = 0;
        d.loseStreak++;
        d.lastWin = false;
        if (d.loseStreak > d.maxLoseStreak) d.maxLoseStreak = d.loseStreak;
        if (isTodayMatch) d.todayRest += rest;
        if (isTodayMatch && rest === 1) d.todayCloseLosses++;
        // New loss type counts
        if (g.t && g.t.startsWith("Gegner-Fehler:")) {
          d.lostBy8BallError++;
          if (isTodayMatch) d.todayLostBy8BallError++;
        }
        d.last20Losses.push(rest);
        if (d.last20Losses.length > 20) d.last20Losses.shift();
      }

      d.last30Games.push(isW ? 1 : 0);
      if (d.last30Games.length > 30) d.last30Games.shift();

      const k = (eloGamesCount[p] || 0) < 20 ? 40 : 20;
      const change = p1A.includes(p) ? k * eloChange : -(k * eloChange);

      // Service thief logic (Fallback)
      const myTeam = winners.includes(p) ? winners : losers;
      if (
        breakerString &&
        !myTeam.includes(breakerString) &&
        (winners.includes(breakerString) || losers.includes(breakerString))
      ) {
        d.opponentStartedGames++;
        if (isW) d.stolenServiceWins++;
        if (isTodayMatch) {
          d.todayOpponentStartedGames++;
          if (isW) d.todayStolenServiceWins++;
        }
      }

      eloRatings[p] = (eloRatings[p] || 1000) + change;
      eloGamesCount[p] = (eloGamesCount[p] || 0) + 1;
      d.eloHistory.push(Math.round(eloRatings[p]));
      if (eloRatings[p] > d.maxElo) d.maxElo = Math.round(eloRatings[p]);

      // Session gain logic
      if (isoDate !== "unknown") {
        if (!aggregates.sessionEloGains[isoDate])
          aggregates.sessionEloGains[isoDate] = {};
        aggregates.sessionEloGains[isoDate][p] =
          (aggregates.sessionEloGains[isoDate][p] || 0) + change;
      }
    });

    // Calculate total ELO transferred for the match (for ELO-Vampir and matchDelta)
    let totalEloTransferredForMatch = 0;
    winners.forEach((p) => {
      const k = (eloGamesCount[p] || 0) < 20 ? 40 : 20; // Get K-factor for this player
      const change = p1A.includes(p) ? k * eloChange : -(k * eloChange);
      totalEloTransferredForMatch += Math.round(Math.abs(change));
    });

    if (winnerStr && loserStr && totalEloTransferredForMatch > 0) {
      const transferKey = `${winnerStr} -> ${loserStr}`;
      aggregates.eloTransfers[transferKey] =
        (aggregates.eloTransfers[transferKey] || 0) +
        totalEloTransferredForMatch;
    }
    matchDeltas[originalIndex] = { eloDelta: totalEloTransferredForMatch }; // Use the actual sum of ELO changes for matchDelta

    // Duo & Duell Logic für Aggregates (Hier außerhalb des Spieler-Loops, damit nicht mehrfach gezählt wird!)
    if (isTeam && p1A.length === 2 && p2A.length === 2) {
      const t1 = [...p1A].sort().join(" & "),
        t2 = [...p2A].sort().join(" & ");
      if (!aggregates.teamResults[t1])
        aggregates.teamResults[t1] = { w: 0, g: 0 };
      if (!aggregates.teamResults[t2])
        aggregates.teamResults[t2] = { w: 0, g: 0 };
      aggregates.teamResults[t1].g++;
      aggregates.teamResults[t2].g++;
      if (g.w == 1) aggregates.teamResults[t1].w++;
      else aggregates.teamResults[t2].w++;
    }

    if (!isTeam && p1A.length === 1 && p2A.length === 1) {
      const name1 = p1A[0],
        name2 = p2A[0];
      const winName = g.w == 1 ? name1 : name2;
      const loseName = g.w == 1 ? name2 : name1;
      const mKey = winName + " -> " + loseName;
      const uKey = [name1, name2].sort().join("|");

      aggregates.matchups[mKey] = (aggregates.matchups[mKey] || 0) + 1;
      aggregates.meetings[uKey] = (aggregates.meetings[uKey] || 0) + 1;

      if (!aggregates.matchupStats[uKey])
        aggregates.matchupStats[uKey] = {
          p1: name1,
          p2: name2,
          p1_wins: 0,
          p2_wins: 0,
          games: 0,
        };
      aggregates.matchupStats[uKey].games++;
      if (winName === aggregates.matchupStats[uKey].p1)
        aggregates.matchupStats[uKey].p1_wins++;
      else aggregates.matchupStats[uKey].p2_wins++;
    }

    // Aggregates (Spezis etc.)
    if (g.bt1 && g.bt2) {
      aggregates.totalBallMatches++;
      const winType = g.w == 1 ? g.bt1 : g.bt2;
      if (winType === "Voll") aggregates.vollWins++;
      else if (winType === "Halb") aggregates.halbWins++;
      winners.forEach((n) => {
        if (!aggregates.playerBallWins[n])
          aggregates.playerBallWins[n] = { Voll: 0, Halb: 0 };
        aggregates.playerBallWins[n][winType]++;
      });
      const procSpez = (arr, type, isWin) =>
        arr.forEach((p) => {
          if (!aggregates.ballSpez[p])
            aggregates.ballSpez[p] = {
              Voll: { w: 0, g: 0 },
              Halb: { w: 0, g: 0 },
            };
          aggregates.ballSpez[p][type].g++;
          if (isWin) aggregates.ballSpez[p][type].w++;
        });
      procSpez(p1A, g.bt1, g.w == 1);
      procSpez(p2A, g.bt2, g.w == 2);
    }
  });

  Object.keys(pData).forEach((p) => {
    const d = pData[p];
    d.elo = Math.round(eloRatings[p]);
    d.todayAvgRest =
      d.todayGames - d.todayWins > 0
        ? d.todayRest / (d.todayGames - d.todayWins)
        : 0;
    d.avgWinDuration = d.winsWithDuration > 0 ? d.totalWinDuration / d.winsWithDuration : 0;
    d.avgMatchDuration = d.gamesWithDuration > 0 ? d.totalMatchDuration / d.gamesWithDuration : 0;
    if (d.fastestWin === Infinity) d.fastestWin = 0;

    d.todayAvgWinDuration = d.todayWinsWithDuration > 0
        ? d.todayTotalWinDuration / d.todayWinsWithDuration
        : 0;
    d.todayAvgMatchDuration = d.todayGamesWithDuration > 0
        ? d.todayTotalMatchDuration / d.todayGamesWithDuration
        : 0;
    if (d.todayFastestWin === Infinity) d.todayFastestWin = 0;

    d.eloGames = eloGamesCount[p];
    d.winRate = Math.round((d.wins / d.games) * 100);
    d.maxWinRate = Math.max(d.maxWinRate || 0, d.winRate);
    d.avgKiller = d.wins > 0 ? d.killerPoints / d.wins : 0;
    d.avgRest = d.games - d.wins > 0 ? d.rest / (d.games - d.wins) : 0;
    d.todayCloseLosses = 0; // Init für Fallback
    if (d.eloHistory.length >= 10) {
      const prevElo =
        d.eloHistory.length === 10
          ? 1000
          : d.eloHistory[d.eloHistory.length - 11];
      d.eloDelta10 = d.eloHistory[d.eloHistory.length - 1] - prevElo;
    } else d.eloDelta10 = 0;

    d.winRateLast30 =
      d.last30Games.length > 0
        ? Math.round(
            (d.last30Games.reduce((a, b) => a + b, 0) / d.last30Games.length) *
              100,
          )
        : 0;
    d.avgRestLossLast20 =
      d.last20Losses.length > 0
        ? d.last20Losses.reduce((a, b) => a + b, 0) / d.last20Losses.length
        : 0;
    d.avgKillerLast20 =
      d.last20WinsKiller.length > 0
        ? d.last20WinsKiller.reduce((a, b) => a + b, 0) /
          d.last20WinsKiller.length
        : 0;

    if (d.games >= 40) {
      const first20 = d.gameResultsHistory.slice(0, 20);
      const last20 = d.gameResultsHistory.slice(-20);
      const wrFirst = (first20.reduce((a, b) => a + b, 0) / 20) * 100;
      const wrLast = (last20.reduce((a, b) => a + b, 0) / 20) * 100;
      d.winRateDelta20 = wrLast - wrFirst;
    } else {
      d.winRateDelta20 = 0;
    }
  });

  return {
    pData,
    matchDeltas,
    aggregates,
    blackWins: blackWins,
    breakWins: breakWinsCount,
  };
};
