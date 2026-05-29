// Web Worker für schwere Berechnungen (ELO, Streaks, Achievements)

self.onmessage = function(e) {
    const { stats, spieler, dailyAchivs } = e.data;
    
    // Hilfsfunktionen innerhalb des Workers (da kein Zugriff auf window/Chart.js)
    const getFixedIndex = (name, arrayLength) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return Math.abs(hash) % arrayLength;
    };

    const processAllStats = (allMatches, playersSet, isFullHistory = true) => {
        const pData = {};
        const eloRatings = {};
        const eloGamesCount = {};
        const aggregates = {
            totalBallMatches: 0, vollWins: 0, halbWins: 0,
            playerBallWins: {}, teamResults: {}, ballSpez: {}, matchupStats: {},
            matchups: {}, meetings: {}
        };

        const getElo = (p) => eloRatings[p] || 1000;
        const getK = (p) => (eloGamesCount[p] || 0) < 20 ? 40 : 20;

        const initP = (n) => {
            if (!pData[n]) pData[n] = {
                wins: 0, games: 0, rest: 0, maxStreak: 0, currentStreak: 0, lastWin: false,
                clutchWins: 0, killerPoints: 0, blackWinsCount: 0, breakWins: 0,
                loseStreak: 0, maxLoseStreak: 0, eloHistory: [], maxElo: 1000, 
                maxWinRate: 0, headToHead: {}, achTracker: {}, achCountTotal: 0,
                last30Games: [], last20Losses: [], last20WinsKiller: [], gameResultsHistory: []
            };
        };

        const matchDeltas = {};

        allMatches.forEach((g, idx) => {
            if (!g) return;
            const isTeam = g.m === "2:2";
            const p1A = isTeam ? g.p1.split(" & ") : [g.p1];
            const p2A = isTeam ? g.p2.split(" & ") : [g.p2];
            const playersInMatch = [...p1A, ...p2A].filter(Boolean);
            
            playersInMatch.forEach(initP);

            const winners = (g.w == 1) ? p1A : p2A;
            const losers = (g.w == 1) ? p2A : p1A;
            const rest = parseInt(g.l || 0);

            // ELO Logic
            const avg1 = p1A.reduce((s, p) => s + getElo(p), 0) / p1A.length;
            const avg2 = p2A.reduce((s, p) => s + getElo(p), 0) / p2A.length;
            const exp1 = 1 / (1 + Math.pow(10, (avg2 - avg1) / 400));
            const eloChange = (g.w == 1 ? 1 : 0) - exp1;

            matchDeltas[idx] = { eloDelta: Math.round(20 * Math.abs(eloChange)), newAchievements: {} };

            playersInMatch.forEach(p => {
                const isW = winners.includes(p);
                const d = pData[p];
                d.games++;
                if(isW) {
                    d.wins++; d.killerPoints += rest; d.lastWin = true; d.loseStreak = 0;
                    d.currentStreak++; if(d.currentStreak > d.maxStreak) d.maxStreak = d.currentStreak;
                    if(g.t?.includes("Schwarz")) d.blackWinsCount++;
                    if(g.a === (g.w == 1 ? g.p1 : g.p2)) d.breakWins++;
                    if(rest === 1) d.clutchWins++;
                } else {
                    d.rest += rest; d.lastWin = false; d.currentStreak = 0; d.loseStreak++;
                    if(d.loseStreak > d.maxLoseStreak) d.maxLoseStreak = d.loseStreak;
                }
                
                const k = getK(p);
                const change = p1A.includes(p) ? (k * eloChange) : -(k * eloChange);
                eloRatings[p] = getElo(p) + change;
                eloGamesCount[p] = (eloGamesCount[p] || 0) + 1;
                d.eloHistory.push(Math.round(eloRatings[p]));
                if(eloRatings[p] > d.maxElo) d.maxElo = Math.round(eloRatings[p]);

            });

            // Aggregates (Kugel-Spezis, Duos etc.) nur im Full-History Modus
            if (isFullHistory && isTeam) {
                const t1 = p1A.sort().join(" & "), t2 = p2A.sort().join(" & ");
                if(!aggregates.teamResults[t1]) aggregates.teamResults[t1] = {w:0, g:0};
                if(!aggregates.teamResults[t2]) aggregates.teamResults[t2] = {w:0, g:0};
                aggregates.teamResults[t1].g++; aggregates.teamResults[t2].g++;
                if(g.w == 1) aggregates.teamResults[t1].w++; else aggregates.teamResults[t2].w++;
            }
        });

        // Finalize Player Stats (Winrates etc)
        Object.keys(pData).forEach(p => {
            const d = pData[p];
            d.elo = Math.round(eloRatings[p]);
            d.eloGames = eloGamesCount[p];
            d.winRate = Math.round((d.wins / d.games) * 100);
            d.avgKiller = d.wins > 0 ? (d.killerPoints / d.wins) : 0;
            d.avgRest = (d.games - d.wins) > 0 ? (d.rest / (d.games - d.wins)) : 0;
        });

        return { pData, matchDeltas, aggregates };
    };

    // Nur gültige Matches verarbeiten und Sortierung sicherstellen
    const sorted = (stats || [])
        .filter(g => g && g.d) // Verhindert Absturz bei fehlendem Datum
        .sort((a,b) => {
        const parse = (s) => {
            const m = String(s || "").match(/^(\d{2})\.(\d{2})\.(\d{4})/);
            return m ? new Date(m[3], m[2]-1, m[1]).getTime() : 0;
        };
        return parse(a.d) - parse(b.d);
    });

    const careerStats = processAllStats(sorted, spieler, true);
    
    // Berechne "Vor Heute" für NEU-Badges
    const now = new Date();
    const todayStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    const beforeToday = sorted.filter(g => !g.d.startsWith(todayStr));
    const careerStatsBeforeToday = processAllStats(beforeToday, spieler, false);

    self.postMessage({ careerStats, careerStatsBeforeToday });
};