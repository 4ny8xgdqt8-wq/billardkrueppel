// Web Worker für schwere Berechnungen (ELO, Streaks, Achievements)

self.onmessage = function(e) {
    const { stats, spieler } = e.data; // dailyAchivs is not used in worker's processAllStats
    
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
        let blackWins = 0;
        let breakWinsCount = 0;
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
                clutchWins: 0, closeWins: 0, closeLosses: 0, dramaWins: 0, killerPoints: 0, blackWinsCount: 0, breakWins: 0,
                loseStreak: 0, maxLoseStreak: 0, eloHistory: [], maxElo: 1000, 
                maxWinRate: 0, winsVsTopElo: 0, vsNemesisWins: 0, vsWorstOpponentLosses: 0,
                regularWins: 0, foul8Wins: 0, lostBy8BallError: 0, // New
                headToHead: {}, // Format: { opponentName: { w: 0, l: 0 } }
                last30Games: [], last20Losses: [], last20WinsKiller: [], gameResultsHistory: []
            };
        };

        const matchDeltas = {};

        allMatches.forEach(({ g, i: originalIndex }) => {
            const isTeam = g.m === "2:2";
            const p1A = (isTeam ? (g.p1 ? g.p1.split(" & ") : []) : [g.p1]).map(s => String(s || '').trim()).filter(Boolean); // Sicherstellen, dass Namen getrimmt und leere entfernt werden
            const p2A = (isTeam ? (g.p2 ? g.p2.split(" & ") : []) : [g.p2]).map(s => String(s || '').trim()).filter(Boolean); // Sicherstellen, dass Namen getrimmt und leere entfernt werden
            const playersInMatch = [...p1A, ...p2A].filter(Boolean);
            playersInMatch.forEach(initP);

            // Wer war vor dem Match die Nr. 1?
            let currentTopPlayer = null;
            let highestEloFound = -1;
            Object.keys(eloRatings).forEach(p => {
                if (eloRatings[p] > highestEloFound) {
                    highestEloFound = eloRatings[p];
                    currentTopPlayer = p;
                }
            });

            const winners = (g.w == 1) ? p1A : p2A;
            const losers = (g.w == 1) ? p2A : p1A;
            const rest = parseInt(g.l || 0);

            if (g.t && (g.t.includes("Schwarz") || g.t.includes("Gegner-Fehler"))) blackWins++;

            // Global Break Win Check
            const winnerStr = String((g.w == 1) ? g.p1 : g.p2 || '').trim();
            if(g.a && winnerStr && String(g.a || '').trim() === winnerStr) {
                breakWinsCount++;
            }

            // H2H Update & Nemesis Check
            winners.forEach(w => {
                losers.forEach(l => {
                    if (!pData[w].headToHead[l]) pData[w].headToHead[l] = { w: 0, l: 0 };
                    if (!pData[l].headToHead[w]) pData[l].headToHead[w] = { w: 0, l: 0 };
                    pData[w].headToHead[l].w++;
                    pData[l].headToHead[w].l++;
                });
            });

            // ELO Logic
            const avg1 = p1A.length > 0 ? p1A.reduce((s, p) => s + getElo(p), 0) / p1A.length : 1000; // Robust gegen leere Teams
            const avg2 = p2A.length > 0 ? p2A.reduce((s, p) => s + getElo(p), 0) / p2A.length : 1000; // Robust gegen leere Teams
            const exp1 = 1 / (1 + Math.pow(10, (avg2 - avg1) / 400));
            const eloChange = (g.w == 1 ? 1 : 0) - exp1;

            matchDeltas[originalIndex] = { eloDelta: Math.round(20 * Math.abs(eloChange)) };

            // Achievements-Metriken berechnen
            winners.forEach(p => {
                // Top-Elo besiegt?
                if (currentTopPlayer && losers.includes(currentTopPlayer)) pData[p].winsVsTopElo++;
                
                // Angstgegner (Nemesis) besiegt? 
                // Def: Gegner, gegen den man die meisten Niederlagen hat
                let nemesis = null; let maxL = 0;
                Object.entries(pData[p].headToHead).forEach(([opp, stats]) => {
                    if (stats.l > maxL) { maxL = stats.l; nemesis = opp; }
                });
                if (nemesis && losers.includes(nemesis)) pData[p].vsNemesisWins++;

                if (rest === 1) {
                    pData[p].closeWins++;
                    pData[p].dramaWins++;
                }
            });

            losers.forEach(p => {
                if (rest === 1) pData[p].closeLosses++;
                
                // Gegen schlimmsten Gegner verloren?
                let worstOpp = null; let maxL = 0;
                Object.entries(pData[p].headToHead).forEach(([opp, stats]) => {
                    if (stats.l > maxL) { maxL = stats.l; worstOpp = opp; }
                });
                if (worstOpp && winners.includes(worstOpp)) pData[p].vsWorstOpponentLosses++;
            });

            playersInMatch.forEach(p => {
                const isW = winners.includes(p);
                const d = pData[p];
                d.games++;
                
                // Historie für Trends pflegen
                d.gameResultsHistory.push(isW ? 1 : 0);
                if (isW) {
                    d.last20WinsKiller.push(rest);
                    if (d.last20WinsKiller.length > 20) d.last20WinsKiller.shift();
                } else {
                    d.last20Losses.push(rest);
                    if (d.last20Losses.length > 20) d.last20Losses.shift();
                }
                d.last30Games.push(isW ? 1 : 0);
                if (d.last30Games.length > 30) d.last30Games.shift();

                if(isW) {
                    d.wins++; d.killerPoints += rest; d.lastWin = true; d.loseStreak = 0;
                    d.currentStreak++; if(d.currentStreak > d.maxStreak) d.maxStreak = d.currentStreak;
                    if(g.t && (g.t.includes("Schwarz") || g.t.includes("Gegner-Fehler"))) d.blackWinsCount++;
                    
                    // New win type counts
                    if (g.t === 'Regulär (8er gelocht)') {
                        d.regularWins++;
                    }
                    if (g.t === 'Gegner-Fehler: Foul bei der 8') {
                        d.foul8Wins++;
                    }
                    // Korrekte Break-Win Prüfung für Achievements
                    const currentWinnerStr = String((g.w == 1) ? g.p1 : g.p2 || '').trim();
                    if(g.a && currentWinnerStr && String(g.a).trim() === currentWinnerStr) {
                         // Bei Team-Anstoß bekommen beide Partner den Punkt
                         if (isTeam) {
                             const teamNames = currentWinnerStr.split(" & ").map(s => s.trim());
                             if (teamNames.includes(p)) d.breakWins++;
                         } else if (p === currentWinnerStr) {
                             d.breakWins++;
                         }
                    }
                    if(rest === 1) d.clutchWins++;
                } else {
                    d.rest += rest; d.lastWin = false; d.currentStreak = 0; d.loseStreak++;
                    if(d.loseStreak > d.maxLoseStreak) d.maxLoseStreak = d.loseStreak;
                    // New loss type counts
                    if (g.t && g.t.startsWith('Gegner-Fehler:')) {
                        d.lostBy8BallError++;
                    }
                }
                
                const k = getK(p);
                const change = p1A.includes(p) ? (k * eloChange) : -(k * eloChange);
                eloRatings[p] = getElo(p) + change;
                eloGamesCount[p] = (eloGamesCount[p] || 0) + 1;
                d.eloHistory.push(Math.round(eloRatings[p]));
                if(eloRatings[p] > d.maxElo) d.maxElo = Math.round(eloRatings[p]);
            });

            // Aggregates (Kugel-Spezis, Duos etc.) nur im Full-History Modus
            if (isFullHistory) {
                // 1. Kugel-Statistiken (Spezis & Typen)
                if (g.bt1 && g.bt2 && g.w) {
                    aggregates.totalBallMatches++;
                    const winType = (g.w == 1) ? g.bt1 : g.bt2;
                    if (winType === 'Voll') aggregates.vollWins++; 
                    else if (winType === 'Halb') aggregates.halbWins++;
                    
                    winners.forEach(n => {
                        if(!aggregates.playerBallWins[n]) aggregates.playerBallWins[n] = { Voll:0, Halb:0 };
                        aggregates.playerBallWins[n][winType]++;
                    });

                    const procSpez = (arr, type, isWin) => arr.forEach(p => {
                        if(!aggregates.ballSpez[p]) aggregates.ballSpez[p] = { Voll:{w:0,g:0}, Halb:{w:0,g:0} };
                        aggregates.ballSpez[p][type].g++; if(isWin) aggregates.ballSpez[p][type].w++;
                    });
                    procSpez(p1A, g.bt1, g.w==1); procSpez(p2A, g.bt2, g.w==2);
                }

                // 2. Duo Logic (2:2)
                if (isTeam && p1A.length === 2 && p2A.length === 2) {
                    const t1 = [...p1A].sort().join(" & "), t2 = [...p2A].sort().join(" & ");
                    if(!aggregates.teamResults[t1]) aggregates.teamResults[t1] = {w:0, g:0};
                    if(!aggregates.teamResults[t2]) aggregates.teamResults[t2] = {w:0, g:0};
                    aggregates.teamResults[t1].g++; aggregates.teamResults[t2].g++;
                    if(g.w == 1) aggregates.teamResults[t1].w++; else aggregates.teamResults[t2].w++;
                }

                // 3. Duelle & Angstgegner (1:1)
                if (!isTeam && p1A.length === 1 && p2A.length === 1) {
                    const name1 = p1A[0], name2 = p2A[0];
                    const winName = (g.w == 1) ? name1 : name2;
                    const loseName = (g.w == 1) ? name2 : name1;
                    
                    const mKey = winName + " -> " + loseName;
                    const uKey = [name1, name2].sort().join('|');
                    
                    aggregates.matchups[mKey] = (aggregates.matchups[mKey] || 0) + 1;
                    aggregates.meetings[uKey] = (aggregates.meetings[uKey] || 0) + 1;
                    
                    if(!aggregates.matchupStats[uKey]) aggregates.matchupStats[uKey] = {p1: name1, p2: name2, p1_wins:0, p2_wins:0, games:0};
                    aggregates.matchupStats[uKey].games++;
                    if(winName === aggregates.matchupStats[uKey].p1) aggregates.matchupStats[uKey].p1_wins++; else aggregates.matchupStats[uKey].p2_wins++;
                }
            }
        });

        // Finalize Player Stats (Erweiterte Metriken für Achievements)
        Object.keys(pData).forEach(p => {
            const d = pData[p];
            d.elo = Math.round(eloRatings[p]);
            d.eloGames = eloGamesCount[p];
            d.winRate = Math.round((d.wins / d.games) * 100);
            d.avgKiller = d.wins > 0 ? (d.killerPoints / d.wins) : 0;
            d.avgRest = (d.games - d.wins) > 0 ? (d.rest / (d.games - d.wins)) : 0;
            
            // Metriken für Erfolge berechnen
            if (d.eloHistory.length >= 10) {
                const prevElo = d.eloHistory.length === 10 ? 1000 : d.eloHistory[d.eloHistory.length - 11];
                d.eloDelta10 = d.eloHistory[d.eloHistory.length - 1] - prevElo;
            } else { d.eloDelta10 = 0; }

            d.winRateLast30 = d.last30Games.length > 0 ? Math.round((d.last30Games.reduce((a,b)=>a+b,0)/d.last30Games.length)*100) : 0;
            d.avgRestLossLast20 = d.last20Losses.length > 0 ? (d.last20Losses.reduce((a,b)=>a+b,0)/d.last20Losses.length) : 0;
            d.avgKillerLast20 = d.last20WinsKiller.length > 0 ? (d.last20WinsKiller.reduce((a,b)=>a+b,0)/d.last20WinsKiller.length) : 0;
            
            if (d.games >= 40) {
                const first20 = d.gameResultsHistory.slice(0, 20);
                const last20 = d.gameResultsHistory.slice(-20);
                const wrFirst = (first20.reduce((a,b)=>a+b,0)/20)*100;
                const wrLast = (last20.reduce((a,b)=>a+b,0)/20)*100;
                d.winRateDelta20 = wrLast - wrFirst;
            } else { d.winRateDelta20 = 0; }
        });

        return { pData, matchDeltas, aggregates, blackWins, breakWins: breakWinsCount };
    };

    try { // Wrap in try-catch for robustness
        // Indizieren, Filtern und Sortieren
        const indexed = (stats || []).map((g, i) => ({ g, i })).filter(x => x.g && x.g.d);
        
        const sorted = indexed.sort((a,b) => {
            const parse = (s) => {
                const str = String(s || "");
                const m = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[^\d]+(\d{1,2}):(\d{2}))?/);
                if (!m) return 0;
                const dd = parseInt(m[1], 10), mm = parseInt(m[2], 10) - 1, yy = parseInt(m[3], 10);
                const hh = m[4] ? parseInt(m[4], 10) : 0, mi = m[5] ? parseInt(m[5], 10) : 0;
                return new Date(yy, mm, dd, hh, mi).getTime();
            };
            return (parse(a.g.d) - parse(b.g.d)) || (a.i - b.i);
        });

        const careerStats = processAllStats(sorted, spieler, true);
        
        // Berechne "Vor Heute" für NEU-Badges
        const now = new Date();
        const todayStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
        const beforeToday = sorted.filter(x => x.g && !x.g.d.startsWith(todayStr));
        const careerStatsBeforeToday = processAllStats(beforeToday, spieler, false);

        self.postMessage({ careerStats: careerStats, careerStatsBeforeToday: careerStatsBeforeToday });
    } catch (err) {
        console.error("Worker Execution Error:", err);
        // Im Fehlerfall leere Objekte senden, damit die App nicht im Loader hängen bleibt
        const empty = { pData: {}, matchDeltas: {}, aggregates: {} };
        self.postMessage({ 
            careerStats: empty, 
            careerStatsBeforeToday: empty 
        });
    }
};