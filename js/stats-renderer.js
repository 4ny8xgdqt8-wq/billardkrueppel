/* ==========================================================================
   Billardkrüppel Statistics & UI Rendering Engine
   ========================================================================== */

window.playerAvatars = window.playerAvatars || {
  Daniel: "avatars/Daniel.webp",
  Thorsten: "avatars/Thorsten.webp",
  Peter: "avatars/Peter.webp",
};
window.getAvatarUrl = window.getAvatarUrl || ((name) => {
  return (window.playerAvatars && window.playerAvatars[name]) || `avatars/${name}.webp`;
});

const safeGetAvatarUrl = (name) => {
  if (typeof window.getAvatarUrl === "function") return window.getAvatarUrl(name);
  if (window.playerAvatars && window.playerAvatars[name]) return window.playerAvatars[name];
  return `avatars/${name}.webp`;
};
window.safeGetAvatarUrl = safeGetAvatarUrl;

window.activeAchPlayer = null;
window.activeAchCategory = "all";

window.setAchPlayerFilter = function (p) {
  window.activeAchPlayer = p;
  if (typeof window.updateAllViews === "function") window.updateAllViews();
};

window.setAchCategoryFilter = function (cat) {
  window.activeAchCategory = cat;
  if (typeof window.updateAllViews === "function") window.updateAllViews();
};

window.renderBillardStats = function (
  stats,
  filterToday = false,
  onlyAchievements = false,
  rootEl = document,
  precalculatedCareerStats = null,
  precalculatedCareerStatsBeforeToday = null,
) {
  // --- Scope: suche IDs nur innerhalb der aktiven View (wichtig bei doppelten IDs im DOM)
  let root = rootEl || document;
  const byId = (id) =>
    root && root.querySelector
      ? root.querySelector("#" + id)
      : document.getElementById(id);
  if (!root || typeof root.querySelector !== "function") root = document;

  // --- DAILY ACHIVS LADEN (falls nicht bereits vorhanden) ---
  if (!window.dailyAchivs) {
    window.dailyAchivs = { days: {} };
  }

  const allSafeStats = (window.stats || []).filter((m) => m && m.d);
  const isFiltered =
    !filterToday && stats && stats.length !== allSafeStats.length;

  const safeGetAvatarUrl = (name) => {
    if (typeof window.getAvatarUrl === "function") return window.getAvatarUrl(name);
    if (window.playerAvatars && window.playerAvatars[name]) return window.playerAvatars[name];
    return `avatars/${name}.webp`;
  };

  // --- Spieler aus spieler.json (kommt aus BillardPro.js: const spieler = [...]) ---
  const configuredPlayers = (() => {
    let names = [];
    try {
      if (Array.isArray(window.spieler) && window.spieler.length > 0)
        names = window.spieler;
      else if (typeof spieler !== "undefined" && Array.isArray(spieler))
        names = spieler;
    } catch (e) {}
    const filtered = names.map((s) => String(s || "").trim()).filter(Boolean);
    // Nur ein Set zurückgeben, wenn wir wirklich Namen haben, sonst null (kein Filter)
    return filtered.length > 0 ? new Set(filtered) : null;
  })();

  // --- DATUM & SICHERE DATEN ---
  const actualTodayStr = window.getTodayStr();
  let todayStr = actualTodayStr;

  // --- SPIELEABEND FILTER FÜR HEUTE-TAB IM HEADER ---
  const statHeader = document.querySelector(
    "#view-statistik .header-container",
  );
  const titleStack = statHeader
    ? statHeader.querySelector(".title-stack")
    : null;
  let todayHeaderFilterBox = statHeader
    ? statHeader.querySelector(".today-header-filter-box")
    : null;

  if (filterToday) {
    // Hide the default filter toggle bar in the "Heute" tab
    const toggleBar = statHeader
      ? statHeader.querySelector(".filter-toggle-bar")
      : null;
    if (toggleBar) toggleBar.style.display = "none";
    if (titleStack) titleStack.style.pointerEvents = "none"; // Disable click on title to toggle filter-row
    if (statHeader) statHeader.classList.remove("filter-active"); // Ensure main filter-row is hidden

    if (!todayHeaderFilterBox && titleStack) {
      todayHeaderFilterBox = document.createElement("div");
      todayHeaderFilterBox.className = "today-header-filter-box";
      todayHeaderFilterBox.style =
        "margin-top: 5px; display: flex; align-items: center; justify-content: center; width: 100%; pointer-events: auto;";

      // Verhindert, dass der Klick auf das Dropdown die normale Filterleiste öffnet
      todayHeaderFilterBox.onclick = (e) => e.stopPropagation();

      const select = document.createElement("select");
      select.className = "extra-filter-select";
      select.style =
        "flex: 1; background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 6px 10px; font-size: 12px; outline: none; max-width: 180px; text-align: center;";

      select.onchange = (e) => {
        window.currentSessionDate = e.target.value;
        if (window.updateAllViews) window.updateAllViews();
        else if (window.recalculateAndRender) window.recalculateAndRender();
      };
      todayHeaderFilterBox.appendChild(select);

      // Insert after the sub-title within the title-stack
      const subTitle = titleStack.querySelector(".sub-title");
      if (subTitle)
        subTitle.parentNode.insertBefore(
          todayHeaderFilterBox,
          subTitle.nextSibling,
        );
    }
    if (todayHeaderFilterBox) {
      todayHeaderFilterBox.style.display = "flex";
      todayHeaderFilterBox.style.pointerEvents = "auto"; // Sicherstellen, dass Klicks durchgehen
      todayHeaderFilterBox.style.maxWidth = "250px"; // Ensure it doesn't stretch too wide
      const select = todayHeaderFilterBox.querySelector(".extra-filter-select");

      const uniqueDates = [
        ...new Set(
          (window.stats || []).map((g) => (g.d ? g.d.split(",")[0] : null)),
        ),
      ]
        .filter(Boolean)
        .sort((a, b) => {
          const p = (s) => {
            const parts = s.split(".");
            return new Date(parts[2], parts[1] - 1, parts[0]);
          };
          return p(b) - p(a);
        });

      // Robustheit gegen unterschiedliches Padding (z.B. 4.6. vs 04.06.)
      const unpaddedToday = actualTodayStr
        .split(".")
        .map((p) => parseInt(p, 10).toString())
        .join(".");
      const foundTodayStr =
        uniqueDates.find((d) => d === actualTodayStr || d === unpaddedToday) ||
        actualTodayStr;

      // Fix: Falls 'all' oder nicht gesetzt, auf das gefundene heutige Datum defaulten
      let currentVal = window.currentSessionDate;
      if (!currentVal || currentVal === "all") currentVal = foundTodayStr;

      let opts = "";
      // "Heute" Option mit dem in den Daten gefundenen Format hinzufügen
      opts += `<option value="${foundTodayStr}" ${currentVal === foundTodayStr ? "selected" : ""}>Heute</option>`;

      // Add unique dates from history, excluding the actual todayStr if already present
      uniqueDates.forEach((ds) => {
        if (ds !== foundTodayStr) {
          opts += `<option value="${ds}" ${currentVal === ds ? "selected" : ""}>${ds}</option>`;
        }
      });
      select.innerHTML = opts;
      select.value = currentVal; // Wichtig: Wert explizit setzen

      // Update todayStr und globalen State basierend auf der Auswahl
      todayStr = currentVal;
      window.currentSessionDate = currentVal;
    }
  } else {
    // Revert changes for other tabs
    if (statHeader) {
      const toggleBar = statHeader.querySelector(".filter-toggle-bar");
      const titleStack = statHeader.querySelector(".title-stack");
      if (toggleBar) toggleBar.style.display = "flex"; // Show default toggle bar
      if (titleStack) titleStack.style.pointerEvents = "auto"; // Re-enable click on title
    }
    if (todayHeaderFilterBox) {
      todayHeaderFilterBox.style.display = "none"; // Hide the "Heute" tab filter
    }
  }

  const safeStats = (stats || []).filter((m) => m && m.d);

  // --- DATEN FILTERN NACHDEM todayStr FESTSTEHT ---
  const normalizeDate = (s) =>
    (s || "")
      .split(",")[0]
      .trim()
      .split(".")
      .map((p) => parseInt(p, 10))
      .join(".");
  const targetDateNorm = normalizeDate(todayStr);
  const statsToday = safeStats.filter((g) => {
    return g && g.d && normalizeDate(g.d) === targetDateNorm;
  });

  // --- Daily Achievements Storage (wird von BillardPro.js in daily_achivs.json geschrieben)
  if (!window.dailyAchivs || !window.dailyAchivs.days) {
    window.dailyAchivs = { days: {} };
  }

  function saveDailyAchivs() {
    if (window.saveDailyAchivsToFirebase)
      window.saveDailyAchivsToFirebase(window.dailyAchivs);
  }

  // --- ELO Berechnung (Team-Average, Start=1000, K=40/20) ---
  function computeEloRatings(allMatches) {
    const base = 1000;
    const ratings = {};
    const games = {};

    const parseSortTime = (gd) => {
      const s = String(gd || "");
      const m = s.match(
        /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[^\d]+(\d{1,2}):(\d{2}))?/,
      );
      if (!m) return 0;
      const dd = parseInt(m[1], 10);
      const mm = parseInt(m[2], 10) - 1;
      const yy = parseInt(m[3], 10);
      const hh = m[4] ? parseInt(m[4], 10) : 0;
      const mi = m[5] ? parseInt(m[5], 10) : 0;
      return new Date(yy, mm, dd, hh, mi, 0, 0).getTime();
    };

    const ordered = (allMatches || [])
      .map((g, i) => ({ g, i }))
      .sort((a, b) => {
        const ta = parseSortTime(a.g && a.g.d);
        const tb = parseSortTime(b.g && b.g.d);
        if (ta !== tb) return ta - tb;
        return a.i - b.i;
      })
      .map((x) => x.g);

    const getR = (p) => (typeof ratings[p] === "number" ? ratings[p] : base);
    const getG = (p) => (typeof games[p] === "number" ? games[p] : 0);
    const setR = (p, v) => {
      ratings[p] = v;
    };
    const incG = (p) => {
      games[p] = getG(p) + 1;
    };
    const getK = (p) => (getG(p) < 20 ? 40 : 20);

    ordered.forEach((g) => {
      if (!g) return;
      const isTeam = g.m === "2:2";
      const t1 = isTeam ? (g.p1 ? String(g.p1).split(" & ") : []) : [g.p1];
      const t2 = isTeam ? (g.p2 ? String(g.p2).split(" & ") : []) : [g.p2];
      const team1 = t1.map((s) => String(s || "").trim()).filter(Boolean);
      const team2 = t2.map((s) => String(s || "").trim()).filter(Boolean);
      if (!team1.length || !team2.length) return;

      const avg = (arr) =>
        arr.reduce((sum, p) => sum + getR(p), 0) / arr.length;
      const r1 = avg(team1);
      const r2 = avg(team2);
      const e1 = 1 / (1 + Math.pow(10, (r2 - r1) / 400));
      const s1 = g.w == 1 ? 1 : 0;
      const dScore = s1 - e1;

      team1.forEach((p) => {
        setR(p, getR(p) + getK(p) * dScore);
        incG(p);
      });
      team2.forEach((p) => {
        setR(p, getR(p) - getK(p) * dScore);
        incG(p);
      });
    });

    const out = {};
    Object.keys(ratings).forEach((p) => {
      out[p] = { elo: Math.round(ratings[p]), eloGames: getG(p) };
    });
    return out;
  }

  function getDailyCountsForPlayer(playerName) {
    const counts = {}; // title -> anzahl tage
    const days =
      window.dailyAchivs && window.dailyAchivs.days
        ? window.dailyAchivs.days
        : {};
    for (const dayKey in days) {
      const dayRec = days[dayKey] || {};
      const arr = dayRec[playerName] || [];
      if (Array.isArray(arr)) {
        arr.forEach((t) => {
          counts[t] = (counts[t] || 0) + 1;
        });
      }
    }
    return counts;
  }

  function getDailyMetaForPlayer(playerName) {
    const days =
      window.dailyAchivs && window.dailyAchivs.days
        ? window.dailyAchivs.days
        : {};
    let daysWithAch = 0;

    for (const dayKey in days) {
      const dayRec = days[dayKey] || {}; // Correctly access day record
      const arr = dayRec[playerName] || [];
      if (Array.isArray(arr) && arr.length > 0) daysWithAch++;
    }

    return { daysWithAch };
  }

  // --- DATEN FILTERN ---
  const statsBeforeToday = safeStats.filter(
    (g) => g && g.d && !g.d.startsWith(todayStr),
  );

  const dataAll = precalculatedCareerStats || {
    pData: {},
    matchDeltas: {},
    aggregates: {},
  }; // Worker output
  if (!precalculatedCareerStats && !filterToday) return; // Nicht rendern wenn Daten fehlen und nicht im Heute-Tab

  const dataBeforeToday = precalculatedCareerStatsBeforeToday || {
    pData: {},
    matchDeltas: {},
    aggregates: {},
  }; // Worker output
  // FIX: Nutze calculateStatsLocally für gefilterte Ansichten
  const dataToday = filterToday
    ? window.calculateStatsLocally(statsToday, window.spieler, todayStr)
    : null;
  const dataFiltered = isFiltered
    ? window.calculateStatsLocally(stats, window.spieler)
    : null; // Nutze calculateStatsLocally für gefilterte ELO
  const res = filterToday ? dataToday : isFiltered ? dataFiltered : dataAll;
  const currentStats = filterToday ? statsToday : stats;
  // Labels auf aktive Spieler filtern und sortieren
  const labels = Object.keys(res.pData)
    .filter((p) =>
      configuredPlayers ? configuredPlayers.has(String(p).trim()) : true,
    )
    .sort();

  const getAchHtml = (proc, isTodayTab, procBefore) => {
    let achHtml = "";

    if (
      isTodayTab &&
      proc.pData &&
      Object.keys(proc.pData).some((p) => proc.pData[p].todayGames > 0)
    ) {
      achHtml += `<div class="section-label" style="margin-top: 40px;">🕒 Session Erfolge</div>`;
    }

    const labels = Object.keys(proc.pData).sort();

    labels.forEach((p, idx) => {
      const d = proc.pData[p];
      const dCareer = dataAll.pData[p] || d;
      // Vergleichsdaten für "NEU" Badge (Fallback auf leere Stats, falls Spieler heute neu ist)
      const dBefore =
        procBefore && procBefore.pData[p]
          ? procBefore.pData[p]
          : {
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
            };

      const meta = getDailyMetaForPlayer(p);
      const dLvl = d; // Level und Wins sollen sich immer nach den aktuell gefilterten Daten richten
      dLvl.dailyDaysWithAch = meta.daysWithAch;

      if (isTodayTab && (!d.todayGames || d.todayGames === 0)) return;

      // --- ERWEITERTES LEVEL LOGIK (based on total wins) ---
      const levelSystem = [
        { min: 0, title: "Billard-Embryo", icon: "🥚" },
        { min: 2, title: "Kreide-Kenner", icon: "🖍️" },
        { min: 5, title: "Kneipen-Tourist", icon: "🍺" },
        { min: 9, title: "Queue-Anfänger", icon: "🦯" },
        { min: 14, title: "Winkel-Lehrling", icon: "📐" },
        { min: 20, title: "Kugel-Flüsterer", icon: "🎱" },
        { min: 28, title: "Taschen-Dieb", icon: "🧤" },
        { min: 38, title: "Bandenchef", icon: "🏦" },
        { min: 50, title: "Filz-Kontrolleur", icon: "🟩" },
        { min: 65, title: "Tisch-Dominator", icon: "🦾" },
        { min: 82, title: "Effet-Lehrmeister", icon: "🌀" },
        { min: 102, title: "Stoß-Techniker", icon: "🎯" },
        { min: 125, title: "Präzisionsspieler", icon: "🔬" },
        { min: 150, title: "Match-Maschine", icon: "⚙️" },
        { min: 180, title: "Break-Kommandant", icon: "⚡" },
        { min: 215, title: "Crunchtime-Killer", icon: "🧊" },
        { min: 255, title: "Queue-Meister", icon: "🪵" },
        { min: 300, title: "Billard-Gott", icon: "👑" },
        { min: 360, title: "Filz-Orakel", icon: "🔮" },
        { min: 430, title: "Tisch-Architekt", icon: "🏗️" },
        { min: 510, title: "Unaufhaltsam", icon: "🔥" },
        { min: 600, title: "Legende der Filzmatte", icon: "🌌" },
        { min: 700, title: "Mythos am Tisch", icon: "🐉" },
        { min: 820, title: "Zeitloser Champion", icon: "⏳" },
        { min: 960, title: "Unsterblicher", icon: "💀" },
        { min: 1120, title: "Gott-Modus", icon: "♾️" },
      ];

      let currentLvl = levelSystem[0];
      let currentLvlIndex = 1;
      let nextLvl = null;
      for (let i = 0; i < levelSystem.length; i++) {
        if (dLvl.wins >= levelSystem[i].min) {
          currentLvl = levelSystem[i];
          currentLvlIndex = i + 1;
          nextLvl = levelSystem[i + 1] || null;
        }
      }

      // --- NUTZNIESSER BERECHNUNG ---
      const nutzVals = labels.map((p) => {
        const d = res.pData[p];
        const count = filterToday
          ? d.todayBlackWinsCount || 0
          : d.blackWinsCount || 0;
        return { p, count, ga: d.games || 0 };
      });

      const maxNutz =
        nutzVals.length > 0 ? Math.max(...nutzVals.map((x) => x.count)) : 0;
      if (maxNutz > 0) {
        const topNutz = nutzVals
          .filter((x) => x.count === maxNutz)
          .sort((a, b) => b.ga - a.ga || a.p.localeCompare(b.p, "de"));

        if (byId("stat-nutzniesser")) {
          byId("stat-nutzniesser").innerText =
            topNutz.map((x) => x.p).join(" / ") + ` (${maxNutz}x)`;
        }
      } else {
        if (byId("stat-nutzniesser")) byId("stat-nutzniesser").innerText = "-";
      }

      // --- DYNAMISCHE LEVEL-INFOS ---
      let progressPercent = 100;
      let infoText = "Du hast das Ende des Universums erreicht. Respekt! 🏆";

      if (nextLvl) {
        const range = nextLvl.min - currentLvl.min;
        const earned = dLvl.wins - currentLvl.min;
        progressPercent = Math.min(100, Math.round((earned / range) * 100));
        const missing = nextLvl.min - dLvl.wins;
        if (progressPercent < 20) {
          infoText = `Frisch befördert! Nächstes Ziel: <b style="color:#fff;">${nextLvl.title}</b> (+${missing})`;
        } else if (progressPercent < 50) {
          infoText = `Auf dem Weg zum <b style="color:#fff;">${nextLvl.title}</b>. Noch ${missing} Siege nötig!`;
        } else if (progressPercent < 80) {
          infoText = `Läuft bei dir! Nur noch ${missing}x gewinnen bis zum <b style="color:#fff;">${nextLvl.title}</b>.`;
        } else if (progressPercent < 95) {
          infoText = `Fast da! Ein Endspurt von ${missing} Siegen zum <b style="color:#fff;">${nextLvl.title}</b>! ⚡`;
        } else {
          infoText = `<span style="color:#ffcc00; font-weight:bold;">Matchball!</span> Nur noch ${missing} Sieg bis zum <b style="color:#fff;">${nextLvl.title}</b>! 🔥`;
        }
      }

      const activePlayer = !isTodayTab ? (window.activeAchPlayer || (labels[0] || "all")) : null;
      const activeCat = !isTodayTab ? (window.activeAchCategory || "all") : "all";

      // Filter: Wenn ein einzelner Spieler aktiv ist, nur diesen rendern
      if (!isTodayTab && activePlayer !== "all" && p !== activePlayer) {
        return;
      }

      // Today-Unbeaten muss todayWins berücksichtigen (for achievement logic)
      const isUnbeatenToday = d.todayGames > 0 && d.todayWins === d.todayGames;

      const getFixedIndex = (name, arrayLength) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash) % (arrayLength || 1);
      };

      // --- ACHIEVEMENT SAMMLUNG ---
      let currentAchs = [];

      if (isTodayTab) {
        // "Heute" Tab: Alle heutigen Erfolge (Tages-Pool + neu erreichte Karriere-Pool)
        window.dailyFamePool.forEach((it) => {
          if (it.cond(d)) currentAchs.push({ ...it, k: "fame", isNew: false });
        });
        window.dailyShamePool.forEach((it) => {
          if (it.cond(d)) currentAchs.push({ ...it, k: "shame", isNew: false });
        });

        if (dBefore) {
          window.famePool.forEach((it) => {
            if (it.cond(d) && !it.cond(dBefore))
              currentAchs.push({ ...it, k: "fame", isNew: true });
          });
          window.shamePool.forEach((it) => {
            if (it.cond(d) && !it.cond(dBefore))
              currentAchs.push({ ...it, k: "shame", isNew: true });
          });
        }
      } else {
        // "Alle" Tab: Aktive Langzeit-Erfolge
        window.famePool.forEach((it) => {
          if (it.cond(d)) {
            const isNew = dBefore ? !it.cond(dBefore) : false;
            currentAchs.push({ ...it, k: "fame", isNew });
          }
        });
        window.shamePool.forEach((it) => {
          if (it.cond(d)) {
            const isNew = dBefore ? !it.cond(dBefore) : false;
            currentAchs.push({ ...it, k: "shame", isNew });
          }
        });
      }

      // Tier-System
      const tierBest = {};
      currentAchs.forEach((it) => {
        if (!it.g || !it.tier) return;
        const key = it.k + "|" + it.g;
        if (!tierBest[key] || it.tier > tierBest[key].tier) tierBest[key] = it;
      });
      if (Object.keys(tierBest).length) {
        currentAchs = currentAchs.filter((it) => !(it.g && it.tier));
        currentAchs.push(...Object.values(tierBest));
      }

      // Sortiere Erfolge innerhalb der Karte alphabetisch nach Titel
      currentAchs.sort((a, b) => a.t.localeCompare(b.t, "de"));

      // Calculate achCountTotal and completedTracks
      dLvl.achCountTotal = currentAchs.length;
      const tracks = {};
      currentAchs.forEach((ach) => {
        if (ach.g && ach.tier) {
          if (!tracks[ach.g] || ach.tier > tracks[ach.g]) {
            tracks[ach.g] = ach.tier;
          }
        }
      });

      let completedTracksCount = 0;
      const allTracks = new Set();
      [...window.famePool, ...window.shamePool].forEach((ach) => {
        if (ach.g && ach.tier) {
          allTracks.add(ach.g);
        }
      });

      allTracks.forEach((trackName) => {
        const maxTierInTrack = [...window.famePool, ...window.shamePool]
          .filter((ach) => ach.g === trackName)
          .reduce((max, ach) => Math.max(max, ach.tier || 0), 0);

        if (maxTierInTrack > 0 && tracks[trackName] === maxTierInTrack) {
          completedTracksCount++;
        }
      });
      dLvl.completedTracks = completedTracksCount;

      // Filtergruppen für den Spieler
      const fameAchs = currentAchs.filter((a) => a.k === "fame");
      const shameAchs = currentAchs.filter((a) => a.k === "shame");
      const maxDiamondCount = currentAchs.filter(
        (a) => a.max === true || (a.tier && a.tier >= 10),
      ).length;

      const dailyCounts = getDailyCountsForPlayer(p);
      const dailyEntries = Object.entries(dailyCounts).sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0], "de");
      });
      const totalDailySum = dailyEntries.reduce((s, e) => s + e[1], 0);
      const totalAchCount = currentAchs.length;
      const totalCombinedCount = currentAchs.length + dailyEntries.length;

      // Achievement-HTML bauen
      const createAchRow2 = (item, name, aIdx) => {
        const phraseIndex = getFixedIndex(name + item.t, item.d.length);
        const phrase = item.d[phraseIndex] || "";
        const isShame = item.k === "shame";
        const howIcon = isShame ? "💀" : "🏆";
        const isMaxTier = item.max === true;
        const newBadge = item.isNew
          ? `<span style="background:var(--accent); color:#000; font-size:8px; font-weight:900; padding:2px 5px; border-radius:4px; margin-left:8px; vertical-align:middle; animation: badge-pulse 1.5s infinite ease-in-out;">NEU</span>`
          : "";
        const achKey = item.g ? `${item.g}_${item.tier}` : item.t;
        const tracker = d.achTracker
          ? d.achTracker[achKey] || d.achTracker[item.t]
          : null;
        const trackerHtml =
          tracker && (tracker.earned > 0 || tracker.lost > 0)
            ? `<div style="font-size:9px; color:#8e8e93; margin-top:3px; font-weight:600;">Sammelrate: <span style="color:#34c759;">📈 ${tracker.earned}</span> | <span style="color:#ff3b30;">📉 ${tracker.lost}</span></div>`
            : "";

        // Holographische Trophäen-Stufen (kompakt)
        let tierClass = "";
        let tierBadge = "";
        if (item.tier) {
          if (item.tier <= 3) {
            tierClass = "ach-tier-bronze";
            tierBadge = `<span class="tier-badge-pill tier-pill-bronze">Tier ${item.tier}</span>`;
          } else if (item.tier <= 6) {
            tierClass = "ach-tier-silver";
            tierBadge = `<span class="tier-badge-pill tier-pill-silver">Tier ${item.tier}</span>`;
          } else if (item.tier <= 9) {
            tierClass = "ach-tier-gold";
            tierBadge = `<span class="tier-badge-pill tier-pill-gold">Tier ${item.tier}</span>`;
          } else {
            tierClass = "ach-tier-diamond";
            tierBadge = `<span class="tier-badge-pill tier-pill-diamond">💎 Max</span>`;
          }
        } else if (isMaxTier && !isShame) {
          tierClass = "ach-tier-diamond";
          tierBadge = `<span class="tier-badge-pill tier-pill-diamond">💎 Max</span>`;
        }

        const borderCol = isShame ? "var(--error)" : "#34c759";
        const textCol = isShame
          ? "rgba(255, 59, 48, 0.85)"
          : "rgba(52, 199, 89, 0.85)";

        const borderStyle = isShame ? `border-left: 3px solid ${borderCol};` : "";
        return `
    <div class="stat-row-item ${tierClass} ${isMaxTier && !isShame ? "achievement-glow-fame" : ""} ${isShame ? "achievement-glow-shame shame-bg" : ""}" style="${borderStyle}">
      <div class="achievement-icon">${item.i}</div>
      <div style="flex:1; min-width:0;">
        <div class="achievement-title" style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
          <span style="${isMaxTier ? "color:#4FC3F7; text-shadow: 0 0 8px rgba(79,195,247,0.4);" : ""}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.t}${isMaxTier ? " ⭐" : ""} ${newBadge}</span>
          ${tierBadge}
        </div>
        ${phrase ? `<div class="achievement-phrase">"${phrase}"</div>` : ""}
        <div class="achievement-how" style="color:${textCol};">${howIcon} ${item.h || ""}</div>
        ${trackerHtml}
      </div>
    </div>`;
      };

      const renderDailyCard = (title, cnt) => {
        const ach = [...window.dailyFamePool, ...window.dailyShamePool].find(
          (x) => x.t === title,
        );
        if (!ach) return "";
        const ic = ach.i || "🏷️";
        const isShame =
          ach.k === "shame" || window.dailyShamePool.some((s) => s.t === title);
        const categoryColor = isShame ? "var(--error)" : "#34c759";
        const howColor = isShame
          ? "rgba(255, 69, 58, 0.70)"
          : "rgba(52, 199, 89, 0.70)";
        const howIcon = isShame ? "💀" : "🏆";
        const phraseIndex = getFixedIndex(p + ach.t, ach.d.length);
        const phrase = ach.d[phraseIndex];

        const borderStyle = isShame
          ? `border-left: 3px solid ${categoryColor};`
          : "border-left: none;";
        return `<div class="stat-row-item ${isShame ? "achievement-glow-shame shame-bg" : ""}" style="${borderStyle}">
          <div class="achievement-icon">${ic}</div>
          <div style="flex:1; min-width:0;">
            <div class="achievement-title" style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
              <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</span>
              <span class="stat-value-badge" style="color:#ffcc00; background:rgba(255,204,0,0.15); border-color:rgba(255,204,0,0.2); flex-shrink:0;">${cnt}×</span>
            </div>
            ${phrase ? `<div class="achievement-phrase">"${phrase}"</div>` : ""}
            <div class="achievement-how" style="color:${howColor};">${howIcon} ${ach.h || ""}</div>
          </div>
        </div>`;
      };

      // Trophäen-Inhalt nach Kategorie-Filter
      let achHtmlContent = "";
      if (activeCat === "fame") {
        achHtmlContent =
          fameAchs.length > 0
            ? fameAchs.map((it, aIdx) => createAchRow2(it, p, aIdx)).join("")
            : `<div style="color:#555; font-size:11px; text-align:center; padding:20px; font-style:italic;">Keine Ruhmes-Erfolge vorhanden.</div>`;
      } else if (activeCat === "shame") {
        achHtmlContent =
          shameAchs.length > 0
            ? shameAchs.map((it, aIdx) => createAchRow2(it, p, aIdx)).join("")
            : `<div style="color:#555; font-size:11px; text-align:center; padding:20px; font-style:italic;">Keine Schand-Erfolge vorhanden (reine Weste!).</div>`;
      } else if (activeCat === "daily") {
        achHtmlContent =
          dailyEntries.length > 0
            ? dailyEntries.map(([title, cnt]) => renderDailyCard(title, cnt)).join("")
            : `<div style="color:#555; font-size:11px; text-align:center; padding:20px; font-style:italic;">Noch keine Tageserfolge gesammelt.</div>`;
      } else {
        // "all"
        achHtmlContent =
          currentAchs.length > 0
            ? currentAchs.map((it, aIdx) => createAchRow2(it, p, aIdx)).join("")
            : `<div style="color:#555; font-size:11px; text-align:center; padding:20px; font-style:italic;">Noch ein unbeschriebenes Blatt.</div>`;

        if (!isTodayTab && dailyEntries.length > 0) {
          achHtmlContent +=
            `
              <div style="margin-top:14px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.06);">
                <div style="color:#ffcc00; font-size:11px; font-weight:900; text-transform:uppercase; display:flex; align-items:center; gap:6px;">
                  <span>👑</span> <span>Bisherige Tageserfolge</span>
                </div>
              </div><div style="margin-top:10px;">` +
            dailyEntries
              .map(([title, cnt]) => renderDailyCard(title, cnt))
              .join("") +
            `</div>`;
        }
      }

      // --- Player-Box (Today ohne LvL, Gesamt mit LvL) ---
      let playerBoxHtml = "";

      if (isTodayTab) {
        playerBoxHtml = `
            <div class="card-modern" style="margin-bottom:15px; border-radius:22px; overflow:hidden; animation: ach-card-enter 0.5s ease-out forwards; animation-delay: ${idx * 0.1}s; opacity: 0; background: linear-gradient(145deg, #2c2c2e, #1a1a1c); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05);">
              <div onclick="const content = this.nextElementSibling; const chevron = this.querySelector('.ach-chevron'); const isHidden = content.style.display === 'none'; content.style.display = isHidden ? 'block' : 'none'; chevron.classList.toggle('expanded', isHidden); chevron.classList.toggle('collapsed', !isHidden);"
                   style="padding:15px; border-bottom: 1px solid rgba(255,255,255,0.06); cursor:pointer; -webkit-tap-highlight-color: transparent; display:flex; align-items:center; gap:12px;">
                <div class="ach-chevron expanded"></div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <img src="${safeGetAvatarUrl(p)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex'" style="width:32px; height:32px; border-radius:12px; object-fit:cover; border: 1px solid rgba(255,255,255,0.1);">
                  <div style="display:none; width:32px; height:32px; border-radius:12px; background:rgba(255,255,255,0.1); align-items:center; justify-content:center; font-size:18px; border:1px solid rgba(255,255,255,0.1);">👤</div>
                  <div style="color:#ffffff; font-weight:900; font-size:16px; line-height:1; letter-spacing: 0.5px;">${p}</div>
                </div>
              </div>
              <div style="padding:12px 12px 6px 12px; display:block;">
                ${achHtmlContent}
              </div>
            </div>`;
      } else if (activePlayer !== "all") {
        // Einzelauswahl Showcase
        playerBoxHtml = `
            <div class="ach-hero-profile" style="animation: ach-card-enter 0.4s ease-out forwards;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div style="display:flex; align-items:center; gap:14px;">
                  <div style="position:relative;">
                    <img src="${safeGetAvatarUrl(p)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex'" style="width:52px; height:52px; border-radius:16px; object-fit:cover; border:2px solid var(--accent); box-shadow: 0 0 20px rgba(255,204,0,0.35);">
                    <div style="display:none; width:52px; height:52px; border-radius:16px; background:rgba(255,255,255,0.1); align-items:center; justify-content:center; font-size:24px; border:1px solid rgba(255,255,255,0.1);">👤</div>
                    <span style="position:absolute; bottom:-4px; right:-4px; font-size:18px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8)); line-height:1;">${currentLvl.icon}</span>
                  </div>
                  <div>
                    <div style="color:#ffffff; font-weight:900; font-size:20px; line-height:1.1; letter-spacing: 0.3px;">${p}</div>
                    <div style="color:var(--accent); font-weight:800; font-size:10px; text-transform:uppercase; margin-top:4px; letter-spacing:1px; display:flex; align-items:center; gap:6px;">
                      <span>RANG ${currentLvlIndex}</span> • <span>${currentLvl.title}</span>
                    </div>
                  </div>
                </div>
                <div style="text-align:right;">
                  <div class="stat-value-badge" style="font-size:13px; padding:4px 10px; border-radius:8px; background:rgba(255,204,0,0.15); border-color:rgba(255,204,0,0.3); color:#ffcc00;">${dLvl.wins} <span style="font-size:8px; opacity:0.7;">WINS</span></div>
                </div>
              </div>

              <div class="progress-bar-container" style="margin-bottom:6px; height:8px;">
                <div class="progress-bar-fill" style="width:${progressPercent}%;"></div>
              </div>

              <div style="color:#8e8e93; font-size:10px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight: 500;">${infoText}</span>
                <span style="font-weight:900; color:#ffcc00;">${progressPercent}%</span>
              </div>

              <div class="ach-summary-pills">
                <div class="ach-summary-pill">
                  <div class="ach-summary-pill-val" style="color:#ffcc00;">${totalAchCount}</div>
                  <div class="ach-summary-pill-lbl">🏆 Erfolge</div>
                </div>
                <div class="ach-summary-pill">
                  <div class="ach-summary-pill-val" style="color:#4FC3F7;">${maxDiamondCount}</div>
                  <div class="ach-summary-pill-lbl">💎 Meister</div>
                </div>
                <div class="ach-summary-pill">
                  <div class="ach-summary-pill-val" style="color:#34c759;">${totalDailySum}×</div>
                  <div class="ach-summary-pill-lbl">👑 Daily</div>
                </div>
              </div>
            </div>

            <!-- Sub-Kategorie Filter -->
            <div class="ach-category-pills">
              <div class="ach-category-pill ${activeCat === "all" ? "active" : ""}" onclick="window.setAchCategoryFilter('all')">
                🏆 Alle (${totalCombinedCount})
              </div>
              <div class="ach-category-pill ${activeCat === "fame" ? "active-fame" : ""}" onclick="window.setAchCategoryFilter('fame')">
                ✨ Ruhm (${fameAchs.length})
              </div>
              <div class="ach-category-pill ${activeCat === "shame" ? "active-shame" : ""}" onclick="window.setAchCategoryFilter('shame')">
                💀 Schande (${shameAchs.length})
              </div>
              <div class="ach-category-pill ${activeCat === "daily" ? "active-daily" : ""}" onclick="window.setAchCategoryFilter('daily')">
                📅 Tageserfolge (${dailyEntries.length})
              </div>
            </div>

            <!-- Trophäenliste -->
            <div style="margin-bottom: 20px;">
              ${achHtmlContent}
            </div>`;
      } else {
        // "Alle Spieler" Übersicht
        playerBoxHtml = `
            <div class="achievement-card-hero" style="border-radius:24px; margin-bottom:15px; overflow:hidden; animation: ach-card-enter 0.5s ease-out forwards; animation-delay: ${idx * 0.08}s; opacity: 0; background: linear-gradient(145deg, #2c2c2e, #1a1a1c); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05);">
              <div onclick="const content = this.nextElementSibling; const chevron = this.querySelector('.ach-chevron'); const isHidden = content.style.display === 'none'; content.style.display = isHidden ? 'block' : 'none'; chevron.classList.toggle('expanded', isHidden); chevron.classList.toggle('collapsed', !isHidden);"
                   style="padding:18px; cursor:pointer; -webkit-tap-highlight-color: transparent;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                  <div style="display:flex; align-items:center; gap:12px;">
                    <div class="ach-chevron collapsed"></div>
                    <div style="display:flex; align-items:center; gap:14px;">
                      <img src="${safeGetAvatarUrl(p)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex'" style="width:44px; height:44px; border-radius:14px; object-fit:cover; border:2px solid var(--accent); box-shadow: 0 0 15px rgba(255,204,0,0.2);">
                      <div style="display:none; width:36px; height:36px; border-radius:12px; background:rgba(255,255,255,0.1); align-items:center; justify-content:center; font-size:20px; border:1px solid rgba(255,255,255,0.1);">👤</div>
                      <div>
                        <div style="color:#ffffff; font-weight:900; font-size:20px; line-height:1; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${p}</div>
                        <div style="color:var(--accent); font-weight:900; font-size:9px; text-transform:uppercase; margin-top:6px; letter-spacing:1px; display:flex; align-items:center; gap:8px;"><span style="font-size:22px; filter: drop-shadow(0 0 10px rgba(255,204,0,0.5)); line-height: 1;">${currentLvl.icon}</span> <span>RANG ${currentLvlIndex} • ${currentLvl.title}</span></div>
                      </div>
                    </div>
                  </div>
                  <div style="text-align:right;">
                    <div class="stat-value-badge" style="font-size:14px; padding:4px 10px;">${dLvl.wins} <span style="font-size:8px; opacity:0.6; margin-left:2px;">WINS</span></div>
                  </div>
                </div>

                <div class="progress-bar-container" style="margin-bottom:8px;">
                  <div class="progress-bar-fill" style="width:${progressPercent}%;"></div>
                </div>

                <div style="color:#8e8e93; font-size:10px; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-weight: 500; letter-spacing: 0.1px;">${infoText}</span>
                  <span style="font-weight:900; color:#ffcc00; background:rgba(255,204,0,0.15); padding:2px 6px; border-radius:6px; border: 1px solid rgba(255,204,0,0.2);">${progressPercent}%</span>
                </div>
              </div>

              <div style="padding:12px 12px 6px 12px; display:none;">
                ${achHtmlContent}
              </div>
            </div>`;
      }

      achHtml += playerBoxHtml;
    });

    if (!isTodayTab && labels.length > 0) {
      const activePlayer = window.activeAchPlayer || (labels[0] || "all");
      const segmentBarHtml = `
        <div class="player-segment-bar">
          <button class="player-segment-btn ${activePlayer === "all" ? "active" : ""}" onclick="window.setAchPlayerFilter('all')">
            <span style="font-size:14px;">👑</span> <span>Alle Spieler</span>
          </button>
          ${labels
            .map(
              (p) => `
            <button class="player-segment-btn ${activePlayer === p ? "active" : ""}" onclick="window.setAchPlayerFilter('${p}')">
              <img src="${safeGetAvatarUrl(p)}" onerror="this.style.display='none';">
              <span>${p}</span>
            </button>
          `,
            )
            .join("")}
        </div>
      `;
      achHtml = segmentBarHtml + achHtml;
    }

    return (
      achHtml ||
      '<div style="color:#8e8e93; text-align:center; padding:30px;">Noch keine Erfolge.</div>'
    );
  };

  // --- TODAY MATCHES RENDERN ---
  const mCard = byId("today-matches-card");
  const mList = byId("today-match-list");
  if (mCard) mCard.style.display = "none";

  if (filterToday && mCard && mList && statsToday.length > 0) {
    mCard.style.display = "block";
    const deltas =
      precalculatedCareerStats && precalculatedCareerStats.matchDeltas
        ? precalculatedCareerStats.matchDeltas
        : {};

    mList.innerHTML = [...statsToday]
      .reverse()
      .map((g, idx) => {
        const i = window.stats.indexOf(g);
        const time = (g.d || "").includes(", ") ? g.d.split(", ")[1] : "";
        const isWin1 = g.w == 1;
        const isWin2 = g.w == 2;
        const dData = deltas[i] || { eloDelta: 0 };
        const delta = typeof dData === "object" ? dData.eloDelta || 0 : dData;
        const hasBreak1 = g.a === g.p1;
        const hasBreak2 = g.a === g.p2;

        const getAv = (pName, size = 22) => {
          if (!pName) return "";
          const names = pName.split(" & ").map((s) => s.trim());
          return names
            .map((n, pIdx) => {
              const src = safeGetAvatarUrl(n);
              const margin = pIdx === names.length - 1 ? "0" : "-8px";
              return `<img src="${src}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex'" style="width:${size}px; height:${size}px; border-radius:8px; object-fit:cover; border:1.5px solid rgba(255,255,255,0.2); margin-right:${margin}; position:relative; z-index:${names.length - pIdx};">
                            <div style="display:none; width:${size}px; height:${size}px; border-radius:8px; background:rgba(255,255,255,0.1); align-items:center; justify-content:center; font-size:${size * 0.6}px; border:1px solid rgba(255,255,255,0.1); margin-right:${margin}; position:relative; z-index:${names.length - pIdx};">👤</div>`;
            })
            .join("");
        };

        // Bestimme die anzuzeigende Dauer (verwende durationFormatted, ansonsten durationSeconds, ansonsten duration)
        const pad = (n) => String(n).padStart(2, "0");
        let durationDisplay = "00:00";
        if (g && g.durationFormatted) {
          durationDisplay = g.durationFormatted;
        } else if (g && typeof g.durationSeconds === "number") {
          const m2 = Math.floor(g.durationSeconds / 60);
          const s2 = g.durationSeconds % 60;
          durationDisplay = `${pad(m2)}:${pad(s2)}`;
        } else if (g && typeof g.duration === "number") {
          durationDisplay = `${pad(g.duration)}:00`;
        }

        return `
            <div onclick="window.openMatchDetails(${i})" class="card-modern" style="padding: 12px; border-radius: 18px; margin-bottom: 12px; cursor:pointer; background: linear-gradient(145deg, #2c2c2e, #1a1a1c); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05); transition: transform 0.2s; -webkit-tap-highlight-color: transparent;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="display:flex; align-items:center; gap:8px; flex:1; overflow:hidden;">
                        <div style="display:flex; flex-shrink:0;">${getAv(g.p1)}</div>
                        <div style="font-size:13px; font-weight:900; color:${isWin1 ? "#34c759" : "#fff"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${g.p1} ${hasBreak1 ? '<span style="color:var(--accent); font-size:10px;">⚡</span>' : ""}</div>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: rgba(255,255,255,0.03); border-radius: 50%; font-size: 8px; font-weight: 900; color: #555; margin: 0 10px; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.06); letter-spacing: 0.5px;">VS</div>
                    <div style="display:flex; align-items:center; gap:8px; flex:1; justify-content:flex-end; overflow:hidden; text-align:right;">
                        <div style="font-size:13px; font-weight:900; color:${isWin2 ? "#34c759" : "#fff"}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${hasBreak2 ? '<span style="color:var(--accent); font-size:10px;">⚡</span>' : ""} ${g.p2}</div>
                        <div style="display:flex; flex-shrink:0;">${getAv(g.p2)}</div>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05);">
                    <div style="font-size:10px; color:#8e8e93; font-weight:600; display:flex; align-items:center; gap:6px;">
                        <span style="color:var(--accent); font-weight:900;">${time}</span>
                        <span style="opacity:0.4;">•</span>
                        <span style="color:#7fc9ff; font-weight:800;">${durationDisplay}</span>
                        <span style="opacity:0.4;">•</span>
                        <span>${g.t || "Match"}</span>
                        <span style="opacity:0.4;">•</span>
                        <span>Rest: ${g.l}</span>
                    </div>
                    <div class="stat-value-badge ${delta > 0 ? "green" : delta < 0 ? "red" : ""}" style="font-size:9px; padding:2px 6px;">${delta > 0 ? "+" : ""}${delta} ELO</div>
                </div>
            </div>`;
      })
      .join("");
  }

  // --- UI UPDATE ---
  const tEl = byId("achievements-today");
  const aEl = byId("achievements-alltime");
  const sEl = byId("achievements-stat-view");

  if (tEl) tEl.innerHTML = "";
  if (aEl) aEl.innerHTML = "";
  if (sEl) sEl.innerHTML = "";

  if (filterToday) {
    if (aEl) aEl.style.display = "none";
    if (sEl) {
      sEl.innerHTML = getAchHtml(res, true, dataBeforeToday);
      sEl.style.display = "block";
    }
  } else {
    // Overall or Achievements tab
    if (tEl) tEl.style.display = "none";
    if (sEl) sEl.style.display = "none";
    if (aEl) {
      aEl.innerHTML = getAchHtml(res, false, dataBeforeToday);
      aEl.style.display = "block";
    }
  }

  if (onlyAchievements) return;

  // --- DASHBOARD KACHELN BEFÜLLEN ---

  // --- ZENTRALE FARB-LOGIK FÜR GRAPH & LISTEN ---
  const graphColors = ["#ffcc00", "#4FC3F7", "#34c759", "#ff3b30", "#5856d6"];
  const topEloPlayers = labels
    .filter((p) => res.pData[p].games > 0)
    .sort((a, b) => res.pData[b].elo - res.pData[a].elo)
    .slice(0, 5); // Top 5 players for ELO chart
  const getPlayerColor = (name) => {
    const idx = topEloPlayers.indexOf(name);
    return idx > -1 ? graphColors[idx] : "#ffffff";
  };

  if (labels.length > 0) {
    byId("stat-total").innerText = currentStats.length;

    // --- TAGESSIEGER-BERECHNUNG (Session- und Matchseite) ---
    const dailyWinnerCards = [
      byId("stat-daily-winner-card"),
      document.getElementById("match-daily-winner")?.closest(".card"),
    ].filter(Boolean);
    const dailyWinnerEls = [
      byId("stat-daily-winner"),
      document.getElementById("match-daily-winner"),
    ].filter(Boolean);

    if (filterToday) {
      // Session-Daten für Session- und Matchseite
      const playerScores = [];

      // ISO Key für ELO-Gains generieren (YYYY-MM-DD) zur Abfrage der Session-Daten
      const dateParts = todayStr.split(".");
      const isoDateKey =
        dateParts.length === 3
          ? `${dateParts[2]}-${dateParts[1].padStart(2, "0")}-${dateParts[0].padStart(2, "0")}`
          : "unknown";

      labels.forEach((p) => {
        const d = res.pData[p]; // Heutige Session-Daten
        const dAll = precalculatedCareerStats?.pData[p] || d;
        const dBefore = precalculatedCareerStatsBeforeToday?.pData?.[p] || {
          headToHead: {},
        };

        if (!d || d.todayGames === 0) return;

        // --- PERFORMANCE-INDEX (SESSION MVP) BERECHNUNG ---
        let score = (d.todayGames || 0) * 1; // +1 pro Spiel (Teilnahme)
        score += (d.todayWins || 0) * 3; // +3 pro Sieg
        score += ((d.todayGames || 0) - (d.todayWins || 0)) * -1; // -1 pro Niederlage

        score += (d.todayRegularWins || 0) * 1;
        score += (d.todayBreakWins || 0) * 3;
        score += (d.todayClutchWins || 0) * 2;
        score += (d.todayCloseLosses || 0) * 1;

        score += (d.todayMaxStreak || 0) * 1; // +1 pro Sieg in der längsten Serie
        score += (d.todayStolenServiceWins || 0) * 2;

        if (d.todayWins > 0)
          score += Math.round((d.todayKillerPoints / d.todayWins) * 0.5); // +0.5 pro Ø Restkugel

        let nemesis = null;
        let maxL = 0;
        Object.entries(dBefore.headToHead || {}).forEach(([opp, st]) => {
          if (st.l > maxL) {
            maxL = st.l;
            nemesis = opp;
          }
        });
        if (
          nemesis &&
          d.headToHead &&
          d.headToHead[nemesis] &&
          d.headToHead[nemesis].w > 0
        )
          score += 4;

        score -= (d.todayBlackWinsCount || 0) * 1;
        score -= (d.todayLostBy8BallError || 0) * 2;
        // Abzug für hohe Ø Restkugeln bei Niederlagen
        if (
          d.todayAvgRest > 0 &&
          (d.todayGames || 0) - (d.todayWins || 0) > 0
        ) {
          score += Math.round(d.todayAvgRest * -0.25); // -0.25 pro Ø Restkugel
        }

        let fameCount = 0,
          shameCount = 0;
        // Tägliche Pools prüfen
        window.dailyFamePool.forEach((ach) => {
          if (ach.cond(d)) fameCount++;
        });
        window.dailyShamePool.forEach((ach) => {
          if (ach.cond(d)) shameCount++;
        });
        // Neue Karriere-Meilensteine, die heute geknackt wurden
        window.famePool.forEach((ach) => {
          if (ach.cond(dAll) && !ach.cond(dBefore)) fameCount++;
        });
        window.shamePool.forEach((ach) => {
          if (ach.cond(dAll) && !ach.cond(dBefore)) shameCount++;
        });
        score += fameCount * 2 - shameCount * 2;

        // Store player score for later sorting
        playerScores.push({ player: p, score: score });
      });

      // Sort players by score (descending)
      playerScores.sort((a, b) => b.score - a.score);

      dailyWinnerCards.forEach((card) => {
        card.style.display = "block";
      });

      const getStyledScore = (score) => {
        if (score < 0) {
          return `<span class="podium-score-pill" style="background:rgba(255,59,48,0.18); color:#ff3b30; border:1px solid rgba(255,59,48,0.35);">${score} Pkt.</span>`;
        } else if (score > 0) {
          return `<span class="podium-score-pill" style="background:rgba(52,199,89,0.18); color:#34c759; border:1px solid rgba(52,199,89,0.35);">+${score} Pkt.</span>`;
        }
        return `<span class="podium-score-pill" style="background:rgba(255,255,255,0.08); color:#8e8e93; border:1px solid rgba(255,255,255,0.15);">${score} Pkt.</span>`;
      };

      if (playerScores.length > 0) {
        let winnerPodiumHtml = "";
        const uniqueScores = [...new Set(playerScores.map((ps) => ps.score))].slice(0, 3);

        const places = { 1: null, 2: null, 3: null };

        if (uniqueScores.length > 0) {
          const score = uniqueScores[0];
          const players = playerScores.filter((ps) => ps.score === score).map((p) => p.player);
          places[1] = { players, score };
        }
        if (uniqueScores.length > 1) {
          const score = uniqueScores[1];
          const players = playerScores.filter((ps) => ps.score === score).map((p) => p.player);
          places[2] = { players, score };
        }
        if (uniqueScores.length > 2) {
          const score = uniqueScores[2];
          const players = playerScores.filter((ps) => ps.score === score).map((p) => p.player);
          places[3] = { players, score };
        }

        const getAvatarPodiumHtml = (players) => {
          return players
            .map(
              (p) =>
                `<img src="${safeGetAvatarUrl(p)}" onerror="this.style.display='none';">`,
            )
            .join("");
        };

        let podiumPlacesHtml = "";
        if (places[2]) {
          podiumPlacesHtml += `
            <div class="podium-column p-2">
              <div class="podium-actor">
                <div class="podium-medal-badge">🥈</div>
                <div class="podium-avatar-wrap">${getAvatarPodiumHtml(places[2].players)}</div>
                <div class="podium-name">${places[2].players.join(" / ")}</div>
                ${getStyledScore(places[2].score)}
              </div>
              <div class="podium-pedestal pedestal-2">
                <span class="pedestal-num">2</span>
              </div>
            </div>`;
        }
        if (places[1]) {
          podiumPlacesHtml += `
            <div class="podium-column p-1">
              <div class="podium-actor">
                <div class="podium-crown-badge">👑</div>
                <div class="podium-avatar-wrap">${getAvatarPodiumHtml(places[1].players)}</div>
                <div class="podium-name">${places[1].players.join(" / ")}</div>
                ${getStyledScore(places[1].score)}
              </div>
              <div class="podium-pedestal pedestal-1">
                <div class="pedestal-gold-accent"></div>
                <span class="pedestal-num">1</span>
              </div>
            </div>`;
        }
        if (places[3]) {
          podiumPlacesHtml += `
            <div class="podium-column p-3">
              <div class="podium-actor">
                <div class="podium-medal-badge">🥉</div>
                <div class="podium-avatar-wrap">${getAvatarPodiumHtml(places[3].players)}</div>
                <div class="podium-name">${places[3].players.join(" / ")}</div>
                ${getStyledScore(places[3].score)}
              </div>
              <div class="podium-pedestal pedestal-3">
                <span class="pedestal-num">3</span>
              </div>
            </div>`;
        }

        if (podiumPlacesHtml) {
          winnerPodiumHtml = `<div class="podium-container">${podiumPlacesHtml}</div>`;
        }

        dailyWinnerEls.forEach((el) => {
          el.innerHTML = winnerPodiumHtml || "-";
        });
      } else {
        dailyWinnerEls.forEach((el) => {
          el.innerText = "-";
        });
      }
    } else {
      // Nur die Session-Kachel ausblenden. Die Match-Kachel behält ihren letzten Session-Stand.
      const statDailyWinnerCard = byId("stat-daily-winner-card");
      if (statDailyWinnerCard) statDailyWinnerCard.style.display = "none";
    }
    // --- KUGEL-STATISTIK BERECHNEN ---
    const agg = res.aggregates || {
      totalBallMatches: 0,
      vollWins: 0,
      halbWins: 0,
      playerBallWins: {},
    };
    const vRate =
      agg.totalBallMatches > 0
        ? Math.round((agg.vollWins / (agg.totalBallMatches || 1)) * 100)
        : 0;
    const hRate =
      agg.totalBallMatches > 0
        ? Math.round((agg.halbWins / (agg.totalBallMatches || 1)) * 100)
        : 0;
    const vEl = byId("stat-balls-voll"),
      hEl = byId("stat-balls-halb");
    if (vEl) vEl.innerText = vRate + "%";
    if (hEl) hEl.innerText = hRate + "%";

    // --- TOP KUGEL-SPIELER BERECHNEN ---
    // Use pre-calculated aggregates from worker
    const playerBallWins = agg.playerBallWins || {};

    let topVollPlayers = [],
      maxVollWins = 0;
    let topHalbPlayers = [],
      maxHalbWins = 0;

    for (const player in playerBallWins) {
      const vollWins = playerBallWins[player]["Voll"];
      const halbWins = playerBallWins[player]["Halb"];

      if (vollWins > maxVollWins) {
        maxVollWins = vollWins;
        topVollPlayers = [player];
      } else if (vollWins === maxVollWins && vollWins > 0) {
        topVollPlayers.push(player);
      }

      if (halbWins > maxHalbWins) {
        maxHalbWins = halbWins;
        topHalbPlayers = [player];
      } else if (halbWins === maxHalbWins && halbWins > 0) {
        topHalbPlayers.push(player);
      }
    }

    if (byId("stat-top-voll"))
      byId("stat-top-voll").innerText =
        maxVollWins > 0
          ? `${topVollPlayers.join(" / ")} (${maxVollWins}x)`
          : "-";
    if (byId("stat-top-halb"))
      byId("stat-top-halb").innerText =
        maxHalbWins > 0
          ? `${topHalbPlayers.join(" / ")} (${maxHalbWins}x)`
          : "-";

    // Global-Stats berechnen (unabhängig vom Filter für Vergleichswerte sinnvoll)
    const breakRate = Math.round(
      ((res.breakWins || 0) / (currentStats.length || 1)) * 100,
    );
    const bAdvEl = byId("stat-break-adv");
    if (bAdvEl) bAdvEl.innerText = breakRate + "%";

    const blackRate = Math.round(
      ((res.blackWins || 0) / (currentStats.length || 1)) * 100,
    );
    if (byId("stat-black")) byId("stat-black").innerText = blackRate + "%";

    // --- TOP-SPIELER BERECHNUNGEN ---
    const getTopPlayerStr = (valArray, key, suffix = "", minThreshold = 0) => {
      const maxVal =
        valArray.length > 0 ? Math.max(...valArray.map((x) => x.val)) : 0;
      if (maxVal <= 0) return "-";
      const tops = valArray.filter(
        (x) => x.val === maxVal && x.relevantGames >= minThreshold,
      );
      if (tops.length === 0) return "-";
      return tops.map((x) => x.p).join(" / ") + ` (${maxVal}${suffix})`;
    };

    // 1. Pechvogel (Ø Restkugeln bei Niederlage)
    const pechVals = labels.map((p) => {
      const d = res.pData[p];
      const losses = filterToday
        ? d.todayGames - d.todayWins
        : d.games - d.wins;
      const rest = filterToday ? d.todayRest : d.rest;
      const val = losses > 0 ? parseFloat((rest / losses).toFixed(1)) : 0;
      return { p, val, relevantGames: losses };
    });
    if (byId("stat-pechvogel"))
      byId("stat-pechvogel").innerText = getTopPlayerStr(pechVals, "val");

    // 2. Reguläre Siege (Präzisions-Schütze)
    const regWinVals = labels.map((p) => {
      const d = res.pData[p];
      const wins = filterToday ? d.todayWins : d.wins;
      const reg = filterToday ? d.todayRegularWins : d.regularWins;
      const val = wins > 0 ? Math.round((reg / wins) * 100) : 0;
      return { p, val, relevantGames: wins };
    });
    if (byId("stat-regular-wins"))
      byId("stat-regular-wins").innerText = getTopPlayerStr(
        regWinVals,
        "val",
        "%",
        filterToday ? 1 : 3,
      );

    // 3. Foul-Spezialist (Absolute Siege durch Gegner-Foul an der 8)
    const foul8Vals = labels.map((p) => {
      const d = res.pData[p];
      const val = filterToday ? d.todayFoul8Wins || 0 : d.foul8Wins || 0;
      return { p, val, relevantGames: val };
    });
    if (byId("stat-foul8-wins"))
      byId("stat-foul8-wins").innerText = getTopPlayerStr(
        foul8Vals,
        "val",
        "x",
      );

    // 4. 8er-Fehler-Quote (Niederlagen durch eigenen Fehler an der 8)
    const lost8Vals = labels.map((p) => {
      const d = res.pData[p];
      const games = filterToday ? d.todayGames : d.games;
      const errLosses = filterToday
        ? d.todayLostBy8BallError || 0
        : d.lostBy8BallError || 0;
      const val = games > 0 ? Math.round((errLosses / games) * 100) : 0;
      return { p, val, relevantGames: games };
    });
    if (byId("stat-lost-by-8error"))
      byId("stat-lost-by-8error").innerText = getTopPlayerStr(
        lost8Vals,
        "val",
        "%",
        filterToday ? 1 : 3,
      );

    // 5. Nutzniesser (Gesamte Siege durch Schwarz-Fehler)
    const nutzVals = labels.map((p) => {
      const d = res.pData[p];
      const val = filterToday
        ? d.todayBlackWinsCount || 0
        : d.blackWinsCount || 0;
      return { p, val, relevantGames: val };
    });
    if (byId("stat-nutzniesser"))
      byId("stat-nutzniesser").innerText = getTopPlayerStr(
        nutzVals,
        "val",
        "x",
      );

    // 6. Nervenstärke (Clutch Wins)
    const clutchVals = labels.map((p) => {
      const val = filterToday
        ? res.pData[p].todayClutchWins || 0
        : res.pData[p].clutchWins || 0;
      return { p, val, relevantGames: val };
    });
    if (byId("stat-clutch"))
      byId("stat-clutch").innerText = getTopPlayerStr(clutchVals, "val", "x");

    // 7. Killer-Instinkt
    const killerVals = labels.map((p) => {
      const d = res.pData[p];
      const wins = filterToday ? d.todayWins : d.wins;
      const val =
        wins > 0
          ? parseFloat(
              (
                (filterToday ? d.todayKillerPoints : d.killerPoints) / wins
              ).toFixed(1),
            )
          : 0;
      return { p, val, relevantGames: wins };
    });
    if (byId("stat-killer"))
      byId("stat-killer").innerText = getTopPlayerStr(killerVals, "val");

    // 8. Service-Dieb (Best Winrate after Opponent Break)
    const thiefVals = labels.map((p) => {
      const d = res.pData[p];
      const stolenWins = filterToday
        ? d.todayStolenServiceWins || 0
        : d.stolenServiceWins || 0;
      const oppGames = filterToday
        ? d.todayOpponentStartedGames || 0
        : d.opponentStartedGames || 0;
      const val = oppGames > 0 ? Math.round((stolenWins / oppGames) * 100) : 0;
      return { p, val, relevantGames: oppGames };
    });
    if (byId("stat-service-thief"))
      byId("stat-service-thief").innerText = getTopPlayerStr(
        thiefVals,
        "val",
        "%",
        filterToday ? 1 : 5,
      );

    // 9. ELO-Vampir (Wer hat wen am meisten geschröpft)
    const transfers = res.aggregates?.eloTransfers || {};
    let topVampireStr = "-";
    const sortedTransfers = Object.entries(transfers).sort(
      (a, b) => b[1] - a[1],
    );
    if (sortedTransfers.length > 0) {
      const [key, val] = sortedTransfers[0];
      topVampireStr = `${key} (${val} Pkt.)`;
    }
    if (byId("stat-vampire")) byId("stat-vampire").innerText = topVampireStr;

    // 10. Session-Rekord (Höchster ELO-Gewinn an einem Tag)
    let sessionRecStr = "-";
    if (filterToday) {
      const dayGains =
        res.aggregates?.sessionEloGains?.[
          todayStr.split(".").reverse().join("-")
        ] || {};
      const topToday = Object.entries(dayGains).sort((a, b) => b[1] - a[1]);
      if (topToday.length > 0 && topToday[0][1] > 0) {
        sessionRecStr = `${topToday[0][0]} (+${Math.round(topToday[0][1])})`;
      }
    } else {
      const allSessionGains = res.aggregates?.sessionEloGains || {};
      let maxGain = 0;
      let recEntry = null;
      for (const date in allSessionGains) {
        for (const player in allSessionGains[date]) {
          if (allSessionGains[date][player] > maxGain) {
            maxGain = allSessionGains[date][player];
            recEntry = { p: player, d: date, v: maxGain };
          }
        }
      }
      if (recEntry) {
        const dParts = recEntry.d.split("-");
        const formattedDate = `${dParts[2]}.${dParts[1]}.`;
        sessionRecStr = `${recEntry.p} (+${Math.round(recEntry.v)}) am ${formattedDate}`;
      }
    }
    if (byId("stat-session-record"))
      byId("stat-session-record").innerText = sessionRecStr;

    // Die Mauer (Zäher Verlierer: Min Ø Restkugeln bei Niederlage)
    const wallCandidates = pechVals.filter((x) => x.relevantGames > 0);
    if (wallCandidates.length > 0) {
      const minWall = Math.min(...wallCandidates.map((x) => x.val));
      const topWall = wallCandidates
        .filter((x) => x.val === minWall)
        .sort(
          (a, b) =>
            b.relevantGames - a.relevantGames || a.p.localeCompare(b.p, "de"),
        );

      if (byId("stat-mauer"))
        byId("stat-mauer").innerText =
          topWall.map((x) => x.p).join(" / ") + " (" + minWall.toFixed(1) + ")";
    } else {
      if (byId("stat-mauer")) byId("stat-mauer").innerText = "-";
    }

    // --- ZEITBASIERTE STATISTIKEN ---
    // Diese Kacheln sollen im "Gesamt"-Tab immer die All-Time-Werte zeigen,
    // auch wenn ein Zeitfilter aktiv ist. Im "Session"-Tab zeigen sie die Tageswerte.
    const timeStatsPData = filterToday ? res.pData : (precalculatedCareerStats?.pData || {});
    const timeStatsLabels = Object.keys(timeStatsPData);

    // Schnellster Sieg
    if (byId("stat-fastest-win")) {
      let fastestWinVal = Infinity;
      timeStatsLabels.forEach((p) => {
        const d = timeStatsPData[p];
        const val = filterToday ? d.todayFastestWin : d.fastestWin;
        if (val > 0 && val < fastestWinVal) {
          fastestWinVal = val;
        }
      });

      if (fastestWinVal !== Infinity && fastestWinVal > 0) {
        const fastestWinPlayers = timeStatsLabels.filter((p) => {
          const d = timeStatsPData[p];
          const val = filterToday ? d.todayFastestWin : d.fastestWin;
          return val === fastestWinVal;
        });
        const mins = Math.floor(fastestWinVal / 60);
        const secs = fastestWinVal % 60;
        byId("stat-fastest-win").innerText = `${fastestWinPlayers.join(" / ")} (${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")})`;
      } else {
        byId("stat-fastest-win").innerText = "-";
      }
    }

    // Längstes Match
    if (byId("stat-longest-match")) {
      let longestMatchVal = 0;
      timeStatsLabels.forEach((p) => {
        const d = timeStatsPData[p];
        const val = filterToday ? d.todayLongestMatch : d.longestMatch;
        if (val > longestMatchVal) {
          longestMatchVal = val;
        }
      });

      if (longestMatchVal > 0) {
        const longestMatchPlayers = timeStatsLabels.filter((p) => {
            const d = timeStatsPData[p];
            const val = filterToday ? d.todayLongestMatch : d.longestMatch;
            return val === longestMatchVal;
        });
        const mins = Math.floor(longestMatchVal / 60);
        const secs = longestMatchVal % 60;
        byId("stat-longest-match").innerText = `${longestMatchPlayers.join(" / ")} (${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")})`;
      } else {
        byId("stat-longest-match").innerText = "-";
      }
    }

    // Ø Siegesdauer (Effizienz)
    if (byId("stat-avg-win-duration")) {
      let bestAvgWinDur = Infinity;
      const minWinsForAvg = filterToday ? 2 : 5;

      timeStatsLabels.forEach((p) => {
        const d = timeStatsPData[p];
        const wins = filterToday ? (d.todayWinsWithDuration || 0) : (d.winsWithDuration || 0);
        const totalDur = filterToday ? d.todayTotalWinDuration : d.totalWinDuration;
        const avgDur = wins > 0 ? totalDur / wins : 0;

        if (wins >= minWinsForAvg && avgDur > 0 && avgDur < bestAvgWinDur) {
          bestAvgWinDur = avgDur;
        }
      });

      if (bestAvgWinDur !== Infinity && bestAvgWinDur > 0) {
        const efficientPlayers = timeStatsLabels.filter((p) => {
          const d = timeStatsPData[p];
          const wins = filterToday ? (d.todayWinsWithDuration || 0) : (d.winsWithDuration || 0);
          const totalDur = filterToday ? d.todayTotalWinDuration : d.totalWinDuration;
          const avgDur = wins > 0 ? totalDur / wins : 0;
          return wins >= minWinsForAvg && Math.abs(avgDur - bestAvgWinDur) < 0.001;
        });
        const totalSeconds = Math.round(bestAvgWinDur);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        byId("stat-avg-win-duration").innerText = `${efficientPlayers.join(" / ")} (${String(mins).padStart(2, "0")}:${String(secs).padStart(2, '0')})`;

        const subLabel = byId("stat-avg-win-duration-subtitle");
        if (subLabel) {
            subLabel.innerText = `Effizientester Sieger (min. ${minWinsForAvg} Siege)`;
        }
      } else {
        byId("stat-avg-win-duration").innerText = "-";
        const subLabel = byId("stat-avg-win-duration-subtitle");
        if (subLabel) {
            subLabel.innerText = `Effizientester Sieger (min. ${minWinsForAvg} Siege)`;
        }
      }
    }

    // Längste Ø Spieldauer (Taktiker)
    if (byId("stat-avg-match-duration")) {
      let maxAvgMatchDur = 0;
      const minGamesForAvgMatch = filterToday ? 2 : 5;

      timeStatsLabels.forEach((p) => {
        const d = timeStatsPData[p];
        const games = filterToday ? (d.todayGamesWithDuration || 0) : (d.gamesWithDuration || 0);
        const totalDur = filterToday ? d.todayTotalMatchDuration : d.totalMatchDuration;
        const avgDur = games > 0 ? totalDur / games : 0;

        if (games >= minGamesForAvgMatch && avgDur > maxAvgMatchDur) {
          maxAvgMatchDur = avgDur;
        }
      });

      if (maxAvgMatchDur > 0) {
        const slowPlayers = timeStatsLabels.filter((p) => {
          const d = timeStatsPData[p];
          const games = filterToday ? (d.todayGamesWithDuration || 0) : (d.gamesWithDuration || 0);
          const totalDur = filterToday ? d.todayTotalMatchDuration : d.totalMatchDuration;
          const avgDur = games > 0 ? totalDur / games : 0;
          return games >= minGamesForAvgMatch && Math.abs(avgDur - maxAvgMatchDur) < 0.001;
        });
        const totalSeconds = Math.round(maxAvgMatchDur);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        byId("stat-avg-match-duration").innerText = `${slowPlayers.join(" / ")} (${String(mins).padStart(2, "0")}:${String(secs).padStart(2, '0')})`;

        const subLabel = byId("stat-avg-match-duration-subtitle");
        if (subLabel) subLabel.innerText = `Der Taktiker (min. ${minGamesForAvgMatch} Spiele)`;
      } else {
        byId("stat-avg-match-duration").innerText = "-";
        const subLabel = byId("stat-avg-match-duration-subtitle");
        if (subLabel) subLabel.innerText = `Der Taktiker (min. ${minGamesForAvgMatch} Spiele)`;
      }
    }

    // --- TAGESSIEG-STATISTIK (MODERNISIERT) ---
    const dailyWinsEl = byId("stat-daily-wins");
    if (dailyWinsEl) {
      const dailyPlacements = {};

      // Hilfsfunktion zum Initialisieren eines Spielers
      const initPlayer = (name) => {
        if (!dailyPlacements[name]) {
          dailyPlacements[name] = { 1: 0, 2: 0, 3: 0, name: name };
        }
      };

      if (window.dailyAchivs && window.dailyAchivs.days) {
        for (const dateStr in window.dailyAchivs.days) {
          const dayData = window.dailyAchivs.days[dateStr];
          const dayMatches = (window.stats || []).filter(
            (g) =>
              g.d && g.d.startsWith(dateStr.split("-").reverse().join(".")),
          );
          if (dayMatches.length === 0) continue;

          const dayStats = window.calculateStatsLocally(
            dayMatches,
            window.spieler,
            dateStr.split("-").reverse().join("."),
          );
          const dAll = precalculatedCareerStats || { pData: {} };
          const dBefore = precalculatedCareerStatsBeforeToday || { pData: {} };

          const playerScores = Object.keys(dayStats.pData)
            .map((player) => {
              initPlayer(player);
              const d = dayStats.pData[player];
              if (!d || d.todayGames === 0) return { player, score: 0 };

              let score = (d.todayGames || 0) * 1; // +1 pro Spiel (Teilnahme)
              score += (d.todayWins || 0) * 3; // +3 pro Sieg
              score += ((d.todayGames || 0) - (d.todayWins || 0)) * -1; // -1 pro Niederlage

              score += (d.todayRegularWins || 0) * 1;
              score += (d.todayBreakWins || 0) * 3;
              score += (d.todayClutchWins || 0) * 2;
              score += (d.todayCloseLosses || 0) * 1;

              score += (d.todayMaxStreak || 0) * 1; // +1 pro Sieg in der längsten Serie
              score += (d.todayStolenServiceWins || 0) * 2;

              if (d.todayWins > 0)
                score += Math.round((d.todayKillerPoints / d.todayWins) * 0.5); // +0.5 pro Ø Restkugel

              let nemesis = null;
              let maxL = 0;
              const dBeforePlayer = dBefore.pData
                ? dBefore.pData[player] || { headToHead: {} }
                : { headToHead: {} };
              Object.entries(dBeforePlayer.headToHead || {}).forEach(
                ([opp, st]) => {
                  if (st.l > maxL) {
                    maxL = st.l;
                    nemesis = opp;
                  }
                },
              );
              if (
                nemesis &&
                d.headToHead &&
                d.headToHead[nemesis] &&
                d.headToHead[nemesis].w > 0
              )
                score += 4;

              score -= (d.todayBlackWinsCount || 0) * 1;
              score -= (d.todayLostBy8BallError || 0) * 2;
              if (
                d.todayAvgRest > 0 &&
                (d.todayGames || 0) - (d.todayWins || 0) > 0
              ) {
                score += Math.round(d.todayAvgRest * -0.25);
              }

              let fameCount = 0,
                shameCount = 0;
              const dAllPlayer = dAll.pData ? dAll.pData[player] || d : d;
              window.dailyFamePool.forEach((ach) => {
                if (ach.cond(d)) fameCount++;
              });
              window.dailyShamePool.forEach((ach) => {
                if (ach.cond(d)) shameCount++;
              });
              window.famePool.forEach((ach) => {
                if (ach.cond(dAllPlayer) && !ach.cond(dBeforePlayer))
                  fameCount++;
              });
              window.shamePool.forEach((ach) => {
                if (ach.cond(dAllPlayer) && !ach.cond(dBeforePlayer))
                  shameCount++;
              });
              score += fameCount * 2 - shameCount * 2;

              return { player, score };
            })
            .sort((a, b) => b.score - a.score);

          // Eindeutige Scores für die Top 3 Plätze ermitteln
          const uniqueScores = [
            ...new Set(playerScores.map((p) => p.score)),
          ].sort((a, b) => b - a);

          // Platz 1
          if (uniqueScores.length > 0) {
            playerScores
              .filter((p) => p.score === uniqueScores[0])
              .forEach((p) => dailyPlacements[p.player][1]++);
          }
          // Platz 2
          if (uniqueScores.length > 1) {
            playerScores
              .filter((p) => p.score === uniqueScores[1])
              .forEach((p) => dailyPlacements[p.player][2]++);
          }
          // Platz 3
          if (uniqueScores.length > 2) {
            playerScores
              .filter((p) => p.score === uniqueScores[2])
              .forEach((p) => dailyPlacements[p.player][3]++);
          }
        }
      }

      // Sortiere Spieler nach: 1. Platz, dann 2. Platz, dann 3. Platz
      const sortedPlayers = Object.values(dailyPlacements).sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        if (b[2] !== a[2]) return b[2] - a[2];
        return b[3] - a[3];
      });

      const dailyWinsHtml =
        sortedPlayers.length > 0
          ? sortedPlayers
              .map( // FIX: Animation delay was wrong
                (p, idx) => `
                <div class="card-modern" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding: 10px; border-radius:16px; animation: ach-card-enter 0.4s ease-out forwards; opacity: 0; animation-delay: ${1.27 + idx * 0.05}s;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="font-size:14px; font-weight:900; color:var(--accent); min-width:20px; text-align:center;">${idx + 1}.</div>
                        <img src="${safeGetAvatarUrl(p.name)}" style="width:30px; height:30px; border-radius:8px; object-fit:cover; border:1px solid rgba(255,255,255,0.1);">
                        <div style="font-size:13px; font-weight:800; color:#fff;">${p.name}</div>
                    </div>
                    <div style="display:flex; gap:8px; font-size:11px; font-weight:900;">
                        <span title="1. Plätze">🥇 ${p[1]}</span>
                        <span title="2. Plätze" style="opacity:0.7;">🥈 ${p[2]}</span>
                        <span title="3. Plätze" style="opacity:0.5;">🥉 ${p[3]}</span>
                    </div>
                </div>`,
              )
              .join("")
          : '<div style="font-size:10px; color:#8e8e93; text-align:center; padding:5px;">Noch keine Tagessieger ermittelt.</div>';
      dailyWinsEl.innerHTML = dailyWinsHtml;
    }

    // --- TEAM-AUSWERTUNG ---
    const normTeamKey = (teamStr) => {
      const parts = String(teamStr || "")
        .split(" & ")
        .map((s) => s.trim())
        .filter(Boolean)
        .sort(); // A & B == B & A
      return parts.length ? parts.join(" & ") : "";
    };

    // Render Partner-Power
    const teamResults = agg.teamResults || {};
    const duoRanking = Object.entries(teamResults)
      .map(([name, s]) => ({
        name,
        wr: Math.round((s.w / s.g) * 100),
        games: s.g,
        wins: s.w,
      }))
      .filter((t) => t.games >= 3)
      .sort((a, b) => b.wr - a.wr || b.games - a.games)
      .slice(0, 3);

    const duoEl = byId("stat-duo-ranking");
    if (duoEl) {
      duoEl.innerHTML =
        duoRanking.length > 0
          ? duoRanking
              .map((t, idx) => {
                // Added idx for animation-delay
                const pNames = t.name.split(" & "); // This is inside a parent card that needs styling
                return `
                <div class="card-modern" style="display:flex; justify-content:space-between; align-items:center; font-size:11px; margin-bottom:10px; padding: 12px; border-radius:18px; animation: ach-card-enter 0.4s ease-out forwards; opacity: 0; animation-delay: ${1.1 + idx * 0.05}s; background: linear-gradient(145deg, #2c2c2e, #1a1a1c); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05);">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div style="display:flex; flex-direction:column; align-items:center; min-width:18px; margin-right:4px;">
                            <span style="color:var(--accent); font-weight:900; font-size:14px;">${idx + 1}</span>
                        </div>
                        <div style="display:flex; align-items:center; position:relative; width:45px; height:30px;">
                            ${pNames.map((p, pIdx) => `<img src="${safeGetAvatarUrl(p)}" style="position:absolute; left:${pIdx * 15}px; width:28px; height:30px; border-radius:8px; object-fit:cover; border:1px solid rgba(255,255,255,0.2); z-index:${2 - pIdx}; transform: rotate(${pIdx === 0 ? "-5deg" : "5deg"}); box-shadow: 4px 0 10px rgba(0,0,0,0.3);">`).join("")}
                        </div>
                        <div style="margin-left:12px;">
                            <div style="color:#fff; font-weight:900; font-size:13px; letter-spacing:0.3px;">${t.name}</div>
                            <div style="font-size:8px; color:#8e8e93; font-weight:700; text-transform:uppercase; margin-top:2px;">Elite Duo Synergy</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div class="stat-value-badge green">${t.wr}%</div>
                        <div style="font-size:8px; color:#8e8e93; font-weight:800; margin-top:4px;">${t.wins}W / ${t.games}G</div>
                    </div>
                </div>`;
              })
              .join("")
          : '<div style="font-size:10px; color:#8e8e93; text-align:center; padding:5px;">Mindestens 3 Spiele als Team nötig</div>';
    }

    // Render Kugel-Spezis
    let topVollarbeiter = { n: "-", wr: 0 };
    let topHalbeExperte = { n: "-", wr: 0 };

    const ballSpez = agg.ballSpez || {};
    Object.entries(ballSpez).forEach(([name, data]) => {
      if (data.Voll.g >= 3) {
        // Schwelle auf 3 Spiele gesetzt
        const wr = (data.Voll.w / data.Voll.g) * 100;
        if (wr > topVollarbeiter.wr) topVollarbeiter = { n: name, wr };
      }
      if (data.Halb.g >= 3) {
        // Schwelle auf 3 Spiele gesetzt
        const wr = (data.Halb.w / data.Halb.g) * 100;
        if (wr > topHalbeExperte.wr) topHalbeExperte = { n: name, wr };
      }
    });

    const spezEl = byId("stat-ball-spez");
    if (spezEl) {
      spezEl.innerHTML = `<div style="animation: ach-card-enter 0.4s ease-out forwards; opacity: 0; animation-delay: 1.15s;">
                <div style="display:flex; justify-content:space-around; align-items:center; padding: 10px 0; ">
                    <div style="text-align:center; display:flex; flex-direction:column; align-items:center; gap:4px;">
                        <div style="font-size:8px; color:#8e8e93; font-weight:900; letter-spacing:1px; text-transform:uppercase;">Voll-Profi</div>
                        <img src="${safeGetAvatarUrl(topVollarbeiter.n)}" style="width:36px; height:36px; border-radius:12px; border:3px solid #ffcc00; box-shadow: 0 0 15px rgba(255,204,0,0.3);">
                        <div style="font-size:14px; font-weight:900; color:#fff; text-shadow: 0 0 8px rgba(255,255,255,0.2);">${topVollarbeiter.n}</div>
                        <div style="font-size:11px; color:#34c759; font-weight:900; text-shadow: 0 0 8px rgba(52,199,89,0.3);">${topVollarbeiter.wr > 0 ? Math.round(topVollarbeiter.wr) + "%" : "-"}</div>
                    </div>
                    <div style="height:40px; width:1px; background:rgba(255,255,255,0.1);"></div>
                    <div style="text-align:center; display:flex; flex-direction:column; align-items:center; gap:4px;">
                        <div style="font-size:8px; color:#8e8e93; font-weight:900; letter-spacing:1px; text-transform:uppercase;">Halbe-As</div>
                        <img src="${safeGetAvatarUrl(topHalbeExperte.n)}" style="width:36px; height:36px; border-radius:12px; border:3px solid #4FC3F7; box-shadow: 0 0 15px rgba(79,195,247,0.3);">
                        <div style="font-size:14px; font-weight:900; color:#fff; text-shadow: 0 0 8px rgba(255,255,255,0.2);">${topHalbeExperte.n}</div>
                        <div style="font-size:11px; color:#34c759; font-weight:900; text-shadow: 0 0 8px rgba(52,199,89,0.3);">${topHalbeExperte.wr > 0 ? Math.round(topHalbeExperte.wr) + "%" : "-"}</div>
                    </div>
                </div>
              </div>`;
    }

    // --- ANGSTGEGNER LOGIK (Wer dominiert wen am meisten?) ---
    // Use pre-calculated aggregates from worker
    const matchups = agg.matchups || {};
    const meetings = agg.meetings || {};
    let maxWins = 0;
    for (const pair in matchups) {
      if (matchups[pair] > maxWins) maxWins = matchups[pair];
    }
    let topMatchups = Object.keys(matchups)
      .filter((p) => matchups[p] === maxWins)
      .sort((a, b) => {
        const pa = a.split(" -> ");
        const pb = b.split(" -> ");
        const ka = pa.length === 2 ? [pa[0], pa[1]].sort().join("|") : "";
        const kb = pb.length === 2 ? [pb[0], pb[1]].sort().join("|") : "";
        const ma = ka ? meetings[ka] || 0 : 0;
        const mb = kb ? meetings[kb] || 0 : 0;
        return mb - ma || a.localeCompare(b, "de");
      });
    if (maxWins > 0) {
      if (byId("stat-angst"))
        byId("stat-angst").innerText =
          topMatchups.join(" / ") + ` (${maxWins} Siege)`;
    } else {
      if (byId("stat-angst")) byId("stat-angst").innerText = "-";
    }

    // --- ANSTOSS-STATISTIK ---
    const breakCountsEl = byId("stat-break-counts");
    if (breakCountsEl) {
        const breakCounts = labels.map(p => {
            const d = res.pData[p];
            const count = filterToday ? d.todayBreakGames || 0 : d.breakGames || 0;
            return { p, count };
        }).sort((a, b) => b.count - a.count);

        if (breakCounts.some(item => item.count > 0)) {
            breakCountsEl.innerHTML = breakCounts.map((item, idx) => `
                <div class="card-modern" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding: 10px; border-radius:16px; animation: ach-card-enter 0.4s ease-out forwards; opacity: 0; animation-delay: ${1.22 + idx * 0.05}s;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="font-size:14px; font-weight:900; color:var(--accent); min-width:20px; text-align:center;">${idx + 1}.</div>
                        <img src="${safeGetAvatarUrl(item.p)}" style="width:30px; height:30px; border-radius:8px; object-fit:cover; border:1px solid rgba(255,255,255,0.1);">
                        <div style="font-size:13px; font-weight:800; color:#fff;">${item.p}</div>
                    </div>
                    <div style="font-size:13px; font-weight:900; color: #fff;">
                        ${item.count}x
                    </div>
                </div>
            `).join('');
        } else {
            breakCountsEl.innerHTML = '<div style="text-align:center; color:#8e8e93; font-size:10px; padding-top: 5px;">Keine Anstoß-Daten vorhanden.</div>';
        }
    }

    // --- DIREKTE DUELLE (Dominanz) ---
    // Use pre-calculated aggregates from worker
    const matchupStats = agg.matchupStats || {};
    const dominantMatchups = Object.values(matchupStats)
      .map((m) => {
        const wr1 = Math.round((m.p1_wins / m.games) * 100);
        const wr2 = Math.round((m.p2_wins / m.games) * 100);
        const dominance = Math.abs(wr1 - wr2);
        return { ...m, wr1, wr2, dominance };
      })
      .sort((a, b) => b.dominance - a.dominance || b.games - a.games); // Nach Dominanz, dann Spielen sortieren

    const h2hEl = byId("stat-head-to-head"); // Behalte die ID für die Kachel
    if (h2hEl) {
      h2hEl.innerHTML =
        dominantMatchups.length > 0
          ? dominantMatchups
              .map((m, idx) => {
                const c1_win = m.wr1 >= m.wr2;
                const c2_win = m.wr2 > m.wr1;

                const c1_style = c1_win 
                    ? 'color: #34c759; border-color: rgba(52, 199, 89, 0.3); background: rgba(52, 199, 89, 0.1);' 
                    : 'color: #ff3b30; border-color: rgba(255, 59, 48, 0.3); background: rgba(255, 59, 48, 0.1);';
                const c2_style = c2_win 
                    ? 'color: #34c759; border-color: rgba(52, 199, 89, 0.3); background: rgba(52, 199, 89, 0.1);' 
                    : 'color: #ff3b30; border-color: rgba(255, 59, 48, 0.3); background: rgba(255, 59, 48, 0.1);';
                
                const p1_bg = c1_win 
                    ? `linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%), linear-gradient(90deg, #013b0f, #43e97b)` 
                    : `linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%), linear-gradient(90deg, #a10800, #d55555)`;

                const p2_bg = c2_win 
                    ? `linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%), linear-gradient(90deg, #43e97b, #013b0f)` 
                    : `linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%), linear-gradient(90deg, #d55555, #a10800)`;

                return `
                <div class="card-modern" style="display:flex; flex-direction:column; gap:10px; margin-bottom:12px; padding: 12px; border-radius:20px; animation: ach-card-enter 0.4s ease-out forwards; opacity: 0; animation-delay: ${1.32 + idx * 0.05}s; background: linear-gradient(145deg, #2c2c2e, #1a1a1c); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:center; position: relative; z-index: 1;">
                        <!-- Linker Spieler -->
                        <div style="display:flex; align-items:center; gap:10px; flex:1; overflow:hidden;">
                            <img src="${safeGetAvatarUrl(m.p1)}" style="width:36px; height:36px; border-radius:10px; border:1px solid rgba(255,255,255,0.1); object-fit:cover; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                            <div style="overflow:hidden;">
                                <div style="font-size:11px; font-weight:900; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.p1}</div>
                                <div class="stat-value-badge" style="margin-top:3px; display:inline-block; ${c1_style}">${m.wr1}%</div>
                                <div style="font-size: 10px; opacity: 0.8; color: #8e8e93; margin-top: 4px;"><span style="color:#34c759;">S: ${m.p1_wins}</span> / <span style="color:#ff3b30;">N: ${m.p2_wins}</span></div>
                            </div>
                        </div>
                        
                        <!-- Trenner -->
                        <div style="text-align:center; min-width:45px; padding: 0 5px;">
                            <div style="font-size:10px; font-weight:900; color:var(--accent); opacity:0.7; letter-spacing:1px;">VS</div>
                            <div style="font-size:8px; color:#8e8e93; font-weight:800; margin-top:2px;">${m.games} Partien</div>
                        </div>

                        <!-- Rechter Spieler -->
                        <div style="display:flex; align-items:center; gap:10px; flex:1; justify-content:flex-end; text-align:right; overflow:hidden;">
                            <div style="overflow:hidden;">
                                <div style="font-size:11px; font-weight:900; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.p2}</div>
                                <div class="stat-value-badge" style="margin-top:3px; display:inline-block; ${c2_style}">${m.wr2}%</div>
                                <div style="font-size: 10px; opacity: 0.8; color: #8e8e93; margin-top: 4px;"><span style="color:#34c759;">S: ${m.p2_wins}</span> / <span style="color:#ff3b30;">N: ${m.p1_wins}</span></div>
                            </div>
                            <img src="${safeGetAvatarUrl(m.p2)}" style="width:36px; height:36px; border-radius:10px; border:1px solid rgba(255,255,255,0.1); object-fit:cover; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                        </div>
                    </div>
                    <!-- Visueller Kräftevergleich -->
                    <div style="height:6px; background:rgba(0,0,0,0.4); border-radius:6px; overflow:hidden; display:flex; border: 1px solid rgba(255,255,255,0.08); box-shadow: inset 0 1px 3px rgba(0,0,0,0.6);">
                        <div style="width:${m.wr1}%; background: ${p1_bg}; animation: bar-grow 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; animation-delay: ${1.32 + idx * 0.05}s; transform-origin: left; transform: scaleX(0);"></div>
                        <div style="width:${m.wr2}%; background: ${p2_bg}; animation: bar-grow 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; animation-delay: ${1.32 + idx * 0.05}s; transform-origin: left; transform: scaleX(0);"></div>
                    </div>
                </div>`;
              })
              .join("")
          : '<div style="font-size:10px; color:#8e8e93; text-align:center; padding:5px;">Noch keine 1:1-Duelle vorhanden</div>';
    }

    // --- Dashboard Kacheln anpassen ---
    const dashboardCards = [
      "stat-daily-winner-card",
      "stat-duo-card",
      "stat-ball-spez-card",
      "stat-h2h-card",
      "stat-daily-wins-card",
    ];
    dashboardCards.forEach((cardId) => {
      const card = byId(cardId);
      if (card) {
        card.style.background = "linear-gradient(145deg, #2c2c2e, #1a1a1c)";
        card.style.border = "1px solid rgba(255, 255, 255, 0.1)";
        card.style.boxShadow =
          "0 8px 24px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05)";
      }
    });

    // Längste Serie – bei Gleichstand mehrere anzeigen
    const maxStreak = Math.max(
      ...labels.map((p) => res.pData[p].maxStreak || 0),
    ); // Max streak is calculated in worker

    if (maxStreak > 0) {
      const topStreak = labels
        .filter((p) => (res.pData[p].maxStreak || 0) === maxStreak)
        .sort(
          (a, b) =>
            (res.pData[b].games || 0) - (res.pData[a].games || 0) ||
            a.localeCompare(b, "de"),
        );

      if (byId("stat-streak"))
        byId("stat-streak").innerText =
          topStreak.join(" / ") + ` (${maxStreak})`;
    } else {
      if (byId("stat-streak")) byId("stat-streak").innerText = "-";
    }

    // Chart.js Diagramm
    const canvas = byId("winChart");
    if (canvas && typeof Chart !== "undefined") {
      const canvasEl = document.getElementById("winChart");
      if (canvasEl) canvasEl.style.display = "block";
      const ctx = canvas.getContext("2d");

      // Chart-Instanz am Canvas speichern (statt global), damit keine falsche Instanz zerstört wird
      if (canvas.__myWinChart) canvas.__myWinChart.destroy();
      canvas.__myWinChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels.map((p) => {
            const d = res.pData[p];
            const losses = d.games - d.wins;
            const rate = d.games > 0 ? Math.round((d.wins / d.games) * 100) : 0;
            // Für Handys (schmale Screens) teilen wir die Info auf 3 Zeilen auf, um Breite zu sparen
            if (window.innerWidth < 500) {
              return [p, `🔵${d.games} 🟢${d.wins} 🔴${losses}`, `${rate}%`];
            }
            return [p, `🔵${d.games}  🟢${d.wins}  🔴${losses}  📈${rate}%`];
          }),
          datasets: [
            {
              data: labels.map((p) =>
                Math.round((res.pData[p].wins / res.pData[p].games) * 100),
              ),
              backgroundColor: "#34c759",
              borderRadius: 8,
            },
          ],
        },
        plugins: [
          {
            id: "barAvatars",
            afterDatasetsDraw: (chart) => {
              const { ctx } = chart;
              chart.getDatasetMeta(0).data.forEach((bar, index) => {
                const playerName = labels[index];
                if (!playerName) return;

                const url = safeGetAvatarUrl(playerName);
                if (!window._avatarCache) window._avatarCache = {};

                if (!window._avatarCache[url]) {
                  const img = new Image();
                  img.src = url;
                  img.onload = () => chart.draw();
                  img.onerror = () => {
                    img.isError = true;
                    chart.draw();
                  };
                  window._avatarCache[url] = img;
                }

                const img = window._avatarCache[url];
                // Berechne Avatar-Größe dynamisch: Kleiner bei vielen Spielern
                const maxPossibleSize =
                  (chart.scales.x.width / labels.length) * 0.8;
                const size = Math.min(30, Math.max(16, maxPossibleSize));
                const posY = bar.y - size - 6;

                ctx.save();
                ctx.beginPath();
                ctx.roundRect(bar.x - size / 2, posY, size, size, 8);
                ctx.fillStyle = "rgba(255,255,255,0.05)";
                ctx.fill();
                ctx.clip();

                if (img.complete && !img.isError && img.naturalWidth !== 0) {
                  ctx.drawImage(img, bar.x - size / 2, posY, size, size);
                } else {
                  ctx.fillStyle = "rgba(255,255,255,0.3)";
                  ctx.font = size * 0.6 + "px Arial";
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillText("👤", bar.x, posY + size / 2 + 1);
                }
                ctx.restore();
                ctx.beginPath();
                ctx.roundRect(bar.x - size / 2, posY, size, size, 8);
                ctx.strokeStyle = "rgba(255, 204, 0, 0.4)";
                ctx.lineWidth = 1;
                ctx.stroke();
              });
            },
          },
        ],
        options: {
          layout: { padding: { top: 40 } },
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }, // Legende bleibt ausgeblendet
            tooltip: { enabled: false }, // Tooltips komplett deaktivieren
          },
          scales: {
            y: {
              min: 0,
              max: 100,
              ticks: { color: "#8e8e93" },
              grid: { color: "rgba(255,255,255,0.05)" },
            },
            x: {
              ticks: {
                color: "#fff",
                font: {
                  // Schrift wird auf dem Handy bei > 5 Spielern noch etwas kleiner
                  size:
                    window.innerWidth < 500 ? (labels.length > 5 ? 8 : 9) : 10,
                },
                maxRotation: 0, // Verhindert schräge Texte, die bei Mehrzeiligkeit schlecht aussehen
                minRotation: 0,
                autoSkip: false, // Stellt sicher, dass jeder Spieler angezeigt wird
              },
            },
          },
        },
      });
    }

    // --- ELO HISTORY CHART (LINE) ---
    const eloHistoryContainer = document.getElementById("eloHistoryContainer");
    const eloCanvas = document.getElementById("eloHistoryChart");
    const eloTrendCard = document.getElementById("eloTrendCard");

    // Karten im Heute-Tab IMMER ausblenden
    if (filterToday) {
      if (eloTrendCard) eloTrendCard.style.display = "none";
    } else {
      if (eloTrendCard) eloTrendCard.style.display = "block";

      // Diagramm nur zeichnen, wenn wir nicht im Heute-Tab sind
      if (eloCanvas && eloHistoryContainer && typeof Chart !== "undefined") {
        const eloCtx = eloCanvas.getContext("2d");
        if (eloCanvas.__myEloChart) eloCanvas.__myEloChart.destroy();

        if (topEloPlayers.length > 0) {
          eloHistoryContainer.style.display = "block";
          const WINDOW_SIZE = 10; // Fokus auf die Form (letzte 10 Spiele)
          const totalMatchCount = currentStats.length; // Gesamtanzahl der Matches in der Auswahl
          const displayCount = Math.min(WINDOW_SIZE, totalMatchCount);

          const startLabel = Math.max(1, totalMatchCount - displayCount + 1);
          const chartLabels = Array.from(
            { length: displayCount },
            (_, i) => startLabel + i,
          );

          const datasets = topEloPlayers.map((p, i) => {
            // ELO-Historie jetzt auf Basis der gefilterten Daten
            const h = res.pData[p].eloHistory || [];
            const realDataCount = Math.min(h.length, displayCount);
            const d = h.slice(-displayCount);

            // Falls ein Spieler weniger Spiele hat, wird die Linie bis zum rechten Rand
            // mit seinem aktuellsten Wert verlängert.
            const lastVal = d.length > 0 ? d[d.length - 1] : 1000;
            while (d.length < displayCount) d.push(lastVal);

            return {
              label: p,
              data: d,
              borderColor: graphColors[i % graphColors.length],
              backgroundColor: graphColors[i % graphColors.length] + "22",
              tension: 0.3,
              pointRadius: 0,
              pointHoverRadius: 0,
              borderWidth: 2,
              fill: false,
            };
          });

          eloCanvas.__myEloChart = new Chart(eloCtx, {
            type: "line",
            data: { labels: chartLabels, datasets },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: {
                  ticks: { color: "#8e8e93", font: { size: 10 } },
                  grid: { color: "rgba(255,255,255,0.05)" },
                },
                x: {
                  ticks: { color: "#444", font: { size: 8 } },
                  grid: { display: false },
                },
              },
            },
          });
        } else {
          eloHistoryContainer.style.display = "none";
        }
      }
    }

    // Alias für Kompatibilität mit index.html
    window.processAllStatsChronologically = function (matches, players) {
      // Nutzt die vorhandene computeEloRatings Logik für ELO und processData für Stats
      const elo = window.computeEloRatings(matches);
      const base = window.processData(matches);
      return {
        pData: base.pData,
        matchDeltas: {},
        aggregates: base.aggregates,
        blackWins: base.blackWins,
        breakWins: base.breakWins,
      };
    };

    // --- ELO Rangliste + Erklärung (nur Gesamt) ---
    function renderEloRanking(pData, show) {
      const el = byId("eloRanking") || document.getElementById("eloRanking");
      if (!el) return;
      if (!show) {
        el.innerHTML = "";
        return;
      }

      const rows = Object.keys(pData || {})
        .map((name) => {
          const d = pData[name] || {};
          return {
            name,
            elo: typeof d.elo === "number" ? d.elo : 1000,
            games: typeof d.eloGames === "number" ? d.eloGames : 0,
            streak: d.currentStreak || 0,
            loseStreak: d.loseStreak || 0,
          };
        })
        .filter((r) => r.games > 0);

      // nur Spieler aus spieler.json anzeigen (und nur wenn Spiele vorhanden sind)
      if (configuredPlayers && configuredPlayers.size > 0) {
        for (let i = rows.length - 1; i >= 0; i--) {
          if (!configuredPlayers.has(String(rows[i].name || "").trim()))
            rows.splice(i, 1);
        }
      }

      if (rows.length === 0) {
        el.innerHTML = "";
        return;
      }
      rows.sort((a, b) => b.elo - a.elo || a.name.localeCompare(b.name, "de"));

      const medal = (i) =>
        i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";

      let html = `
            <div style="margin-top:2px; animation: ach-card-enter 0.4s ease-out forwards; opacity: 0; animation-delay: 0.4s;">
              <div style="color:#ffcc00; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:1px;">ELO-Rangliste</div>
              <div style="margin-top:6px; font-size:10px; line-height:1.4; color:#8e8e93;">Start bei <b style=\"color:#fff;\">1000</b>. Sieg gegen starke Gegner bringt <b style=\"color:#34c759;\">mehr</b> Punkte, Niederlagen kosten Punkte. Neue Spieler bewegen sich anfangs <b style=\"color:#4FC3F7;\">schneller</b>.</div>
              <div style="height:2px; width:24px; background:#ffcc00; margin-top:6px; border-radius:2px;"></div>
            </div>
            <div style="margin-top:10px;">
          `;

      rows.forEach((r, i) => {
        const badge = medal(i);
        const isFirst = i === 0;
        const streakClass =
          r.streak >= 1
            ? "streak-fire"
            : r.loseStreak >= 3
              ? "streak-frost"
              : "";
        const streakEmoji =
          r.streak >= 1
            ? ` <span style="display:inline-flex; align-items:center; gap:2px; color:var(--accent); text-shadow: 0 0 8px rgba(255,204,0,0.4); animation: streak-pulse 1.5s infinite ease-in-out; vertical-align: middle;"><span style="font-size:14px;">🔥</span><span style="font-size:11px; font-weight:900;">${r.streak}</span></span>`
            : ""; // Pulsierendes Flammen-Emoji mit Zähler
        html += `
              <div onclick="window.openPlayerProfile('${r.name}')" class="card-modern ${isFirst ? "rank-1-card" : ""}" style="display:flex; align-items:center; gap:12px; margin-bottom:12px; padding: 12px; border-radius: 20px; cursor:pointer; ${isFirst ? "" : "animation: ach-card-enter 0.4s ease-out forwards; opacity: 0;"} animation-delay: ${0.5 + i * 0.05}s; background: linear-gradient(145deg, #2c2c2e, #1a1a1c); border: 1px solid ${isFirst ? "#ffcc00" : "rgba(255, 255, 255, 0.1)"}; box-shadow: ${isFirst ? "0 0 20px rgba(255,204,0,0.2)" : "0 8px 24px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05)"};">
                <div style="min-width:28px; text-align:center; font-size:16px;">${badge || i + 1 + "."}</div>
                <div class="avatar-frame ${streakClass}">
                  <img src="${safeGetAvatarUrl(r.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex'" style="width:32px; height:32px; border-radius:10px; object-fit:cover; border:2px solid rgba(255,255,255,0.15);">
                </div>
                <div style="display:none; width:30px; height:30px; border-radius:10px; background:rgba(255,255,255,0.1); align-items:center; justify-content:center; font-size:16px; border:1px solid rgba(255,255,255,0.1);">👤</div>
                <div style="flex:1; overflow:hidden;">
                  <div style="font-size:14px; font-weight:900; color:${getPlayerColor(r.name)}; text-shadow: 0 0 8px rgba(255,204,0,0.2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${r.name} ${streakEmoji}</div>
                  <div style="font-size:10px; color:#acacb0; margin-top:2px;">Matches: ${r.games}</div>
                </div>
                <div style="text-align:right;">
                  <div id="rank-elo-${i}" style="font-size:16px; font-weight:900; color:#34c759; text-shadow: 0 0 10px rgba(52,199,89,0.3);">0</div>
                  <div style="font-size:9px; color:#8e8e93; text-transform:uppercase; font-weight:800; margin-top:2px;">ELO</div>
                </div>
              </div>
            `;
      });

      html += `</div>`;
      el.innerHTML = html;
      // Synchronisiere die Zahlen-Animation mit dem Einblenden der Karten (matching animation-delay)
      rows.forEach((r, i) => {
        setTimeout(
          () => window.animateNumber(`rank-elo-${i}`, r.elo),
          500 + i * 50,
        );
      });
    }

    // --- 🔥 Formanzeige / Trending Player (letzte 10 Spiele) ---
    function renderTrendingPlayers(allStats, show) {
      const el =
        byId("trendPlayers") || document.getElementById("trendPlayers");
      const headEl =
        byId("trendHeader") || document.getElementById("trendHeader");
      if (!el) return;
      if (!show) {
        el.innerHTML = "";
        if (headEl) headEl.innerHTML = "";
        return;
      }

      const N = 10;

      // sortiere Matches stabil nach Datum/Zeit
      const parseSortTime = (gd) => {
        const s = String(gd || "");
        const m = s.match(
          /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[^\d]+(\d{1,2}):(\d{2}))?/,
        );
        if (!m) return 0;
        const dd = parseInt(m[1], 10);
        const mm = parseInt(m[2], 10) - 1;
        const yy = parseInt(m[3], 10);
        const hh = m[4] ? parseInt(m[4], 10) : 0;
        const mi = m[5] ? parseInt(m[5], 10) : 0;
        return new Date(yy, mm, dd, hh, mi, 0, 0).getTime();
      };

      const ordered = (allStats || [])
        .map((g, i) => ({ g, i }))
        .sort((a, b) => {
          const ta = parseSortTime(a.g && a.g.d);
          const tb = parseSortTime(b.g && b.g.d);
          if (ta !== tb) return ta - tb;
          return a.i - b.i;
        })
        .map((x) => x.g);

      if (!ordered || ordered.length === 0) {
        el.innerHTML = "";
        return;
      }

      const windowStartIndex = Math.max(0, ordered.length - N);

      const rec = {};
      const init = (p) => {
        if (!rec[p])
          rec[p] = {
            g: 0,
            w: 0,
            l: 0,
            streak: 0,
            loseStreak: 0,
            lastWasWin: null,
            eloBefore: 1000,
            eloAfter: 1000,
            eloDelta: 0,
          };
      };

      // ELO Simulation (gleiches Modell wie oben)
      const base = 1000;
      const ratings = {};
      const games = {};
      const getR = (p) => (typeof ratings[p] === "number" ? ratings[p] : base);
      const getG = (p) => (typeof games[p] === "number" ? games[p] : 0);
      const setR = (p, v) => {
        ratings[p] = v;
      };
      const incG = (p) => {
        games[p] = getG(p) + 1;
      };
      const getK = (p) => (getG(p) < 20 ? 40 : 20);

      ordered.forEach((g, idx) => {
        if (!g) return;
        const isTeam = g.m === "2:2";
        const t1 = isTeam ? (g.p1 ? String(g.p1).split(" & ") : []) : [g.p1];
        const t2 = isTeam ? (g.p2 ? String(g.p2).split(" & ") : []) : [g.p2];
        const team1 = t1.map((s) => String(s || "").trim()).filter(Boolean);
        const team2 = t2.map((s) => String(s || "").trim()).filter(Boolean);
        if (!team1.length || !team2.length) return;

        if (idx === windowStartIndex) {
          [...team1, ...team2].forEach((p) => {
            init(p);
            rec[p].eloBefore = Math.round(getR(p));
          });
        }

        const avg = (arr) =>
          arr.reduce((sum, p) => sum + getR(p), 0) / arr.length;
        const r1 = avg(team1);
        const r2 = avg(team2);
        const e1 = 1 / (1 + Math.pow(10, (r2 - r1) / 400));
        const s1 = g.w == 1 ? 1 : 0;
        const dScore = s1 - e1;

        team1.forEach((p) => {
          setR(p, getR(p) + getK(p) * dScore);
          incG(p);
        });
        team2.forEach((p) => {
          setR(p, getR(p) - getK(p) * dScore);
          incG(p);
        });

        if (idx >= windowStartIndex) {
          const winners = g.w == 1 ? team1 : team2;
          const losers = g.w == 1 ? team2 : team1;

          winners.forEach((p) => {
            init(p);
            rec[p].g++;
            rec[p].w++;
            rec[p].streak = rec[p].lastWasWin === true ? rec[p].streak + 1 : 1;
            rec[p].loseStreak = 0;
            rec[p].lastWasWin = true;
          });
          losers.forEach((p) => {
            init(p);
            rec[p].g++;
            rec[p].l++;
            rec[p].loseStreak =
              rec[p].lastWasWin === false ? rec[p].loseStreak + 1 : 1;
            rec[p].streak = 0;
            rec[p].lastWasWin = false;
          });

          [...team1, ...team2].forEach((p) => {
            init(p);
            rec[p].eloAfter = Math.round(getR(p));
          });
        }
      });

      Object.keys(rec).forEach((p) => {
        rec[p].eloDelta =
          (rec[p].eloAfter || 1000) - (rec[p].eloBefore || 1000);
      });

      const rows = Object.keys(rec)
        .map((name) => {
          const r = rec[name];
          const wr = r.g ? Math.round((r.w / r.g) * 100) : 0;
          return {
            name,
            g: r.g,
            w: r.w,
            l: r.l,
            wr,
            streak: r.streak,
            loseStreak: r.loseStreak,
            eloDelta: r.eloDelta,
          };
        })
        .filter((r) => r.g >= 1)
        .sort(
          (a, b) =>
            b.eloDelta - a.eloDelta ||
            b.wr - a.wr ||
            b.g - a.g ||
            a.name.localeCompare(b.name, "de"),
        );

      // Top = Anzahl Spieler mit mindestens 1 Spiel in den letzten 10 (und nur aus spieler.json)
      if (configuredPlayers) {
        for (let i = rows.length - 1; i >= 0; i--) {
          if (!configuredPlayers.has(String(rows[i].name || "").trim()))
            rows.splice(i, 1);
        }
      }

      if (!rows.length) {
        el.innerHTML = "";
        return;
      }

      const deltaStyle = (d) =>
        d > 0
          ? "color:#34c759;"
          : d < 0
            ? "color:rgba(255,69,58,0.85);"
            : "color:#8e8e93;";
      const deltaSign = (d) => (d > 0 ? `+${d}` : `${d}`);

      if (headEl) {
        headEl.innerHTML = `
            <div style="margin-top:14px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.06);">
              <div style="color:#ffcc00; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:1px;">🔥 Formanzeige</div>
              <div style="margin-top:6px; font-size:10px; line-height:1.4; color:#8e8e93;">Trending aus den letzten ${N} Spielen: ELO-Änderung + aktuelle Siegserie.</div>
              <div style="height:2px; width:24px; background:#ffcc00; margin-top:6px; border-radius:2px;"></div>
            </div>`;
      }

      let listHtml = `<div style="margin-top:10px;">`;

      rows.forEach((r, i) => {
        const isTopForm = i === 0;
        const streakClass =
          r.streak >= 1
            ? "streak-fire"
            : r.loseStreak >= 3
              ? "streak-frost"
              : "";
        listHtml += `
              <div onclick="window.openPlayerProfile('${r.name}')" class="card-modern" style="display:flex; align-items:center; gap:12px; margin-bottom:12px; background: ${isTopForm ? "linear-gradient(135deg, rgba(52, 199, 89, 0.2) 0%, #1a1a1c 100%)" : "linear-gradient(145deg, #2c2c2e, #1a1a1c)"}; padding: 12px; border-radius: 20px; border: 1px solid ${isTopForm ? "#34c759" : "rgba(255, 255, 255, 0.1)"}; box-shadow: ${isTopForm ? "0 0 20px rgba(52,199,89,0.2)" : "0 8px 24px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05)"}; cursor:pointer; animation: ach-card-enter 0.4s ease-out forwards; opacity: 0; animation-delay: ${0.5 + i * 0.05}s;">
                <div style="min-width:28px; text-align:center; font-size:16px;">${i === 0 ? "🔥" : i === 1 ? "✨" : i === 2 ? "📈" : i + 1 + "."}</div>
                <div class="avatar-frame ${streakClass}">
                  <img src="${safeGetAvatarUrl(r.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex'" style="width:32px; height:32px; border-radius:10px; object-fit:cover; border:2px solid rgba(255,255,255,0.15);">
                </div>
                <div style="display:none; width:30px; height:30px; border-radius:10px; background:rgba(255,255,255,0.1); align-items:center; justify-content:center; font-size:16px; border:1px solid rgba(255,255,255,0.1);">👤</div>
                <div style="flex:1; overflow:hidden;">
                  <div style="font-size:14px; font-weight:900; color:${getPlayerColor(r.name)}; text-shadow: 0 0 8px rgba(255,204,0,0.2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${r.name}</div>
                  <div style="font-size:10px; color:#acacb0; margin-top:2px;">Letzte ${r.g}: ${r.w}-${r.l} (${r.wr}%)${r.streak >= 1 ? ` • S: ${r.streak}` : ""}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:16px; font-weight:900; ${deltaStyle(r.eloDelta)} text-shadow: 0 0 10px ${r.eloDelta > 0 ? "rgba(52,199,89,0.3)" : r.eloDelta < 0 ? "rgba(255,59,48,0.3)" : "rgba(255,255,255,0.1)"};">${deltaSign(r.eloDelta)}</div>
                  <div style="font-size:9px; color:#8e8e93; text-transform:uppercase; font-weight:800; margin-top:2px;">ELO Δ</div>
                </div>
              </div>
            `;
      });

      listHtml += `</div>`;
      el.innerHTML = listHtml;
    }

    const eloCard =
      byId("eloTrendCard") || document.getElementById("eloTrendCard");
    if (eloCard) eloCard.style.display = !filterToday ? "block" : "none";

    renderEloRanking(res.pData, !filterToday); // ELO-Ranking jetzt auf Basis der gefilterten Daten
    renderTrendingPlayers(stats, !filterToday);
  } else {
    // --- Keine Daten: UI sauber zurücksetzen ---
    const setText = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.innerText = txt;
    };

    // Kacheln
    setText("stat-total", "0");
    setText("stat-balls-voll", "0%");
    setText("stat-balls-halb", "0%");
    setText("stat-break-adv", "0%");
    setText("stat-black", "0%");
    setText("stat-pechvogel", "-");
    setText("stat-killer", "-");
    setText("stat-clutch", "-");
    setText("stat-nutzniesser", "-");
    setText("stat-top-voll", "-");
    setText("stat-top-halb", "-");
    setText("stat-regular-wins", "0%");
    setText("stat-foul8-wins", "0x");
    setText("stat-lost-by-8error", "0%");
    setText("stat-service-thief", "0%");
    setText("stat-vampire", "-");
    setText("stat-session-record", "-");
    setText("stat-angst", "-");
    setText("stat-fastest-win", "-");
    setText("stat-streak", "-");
    if (byId("stat-break-counts")) byId("stat-break-counts").innerHTML = "";
    setText("stat-mauer", "-");
    setText("stat-longest-match", "-");
    setText("stat-avg-win-duration", "-");
    setText("stat-avg-match-duration", "-");
    setText("stat-daily-wins", "-");

    const dailyWinnerCards = [
      document.getElementById("stat-daily-winner-card"),
      document.getElementById("match-daily-winner")?.closest(".card"),
    ].filter(Boolean);
    const dailyWinnerEls = [
      document.getElementById("stat-daily-winner"),
      document.getElementById("match-daily-winner"),
    ].filter(Boolean);
    if (filterToday) {
      dailyWinnerCards.forEach((card) => {
        card.style.display = "block";
      });
      dailyWinnerEls.forEach((el) => {
        el.innerText = "-";
      });
    } else {
      const statDailyWinnerCard = document.getElementById(
        "stat-daily-winner-card",
      );
      const statDailyWinnerEl = document.getElementById("stat-daily-winner");
      if (statDailyWinnerCard) statDailyWinnerCard.style.display = "none";
      if (statDailyWinnerEl) statDailyWinnerEl.innerText = "";
    }
    setText("stat-head-to-head", "-");
    setText("stat-duo-ranking", "-");
    setText("stat-ball-spez", "-");

    const eloEl = document.getElementById("eloRanking");
    if (eloEl) eloEl.innerHTML = "";
    const trendEl = document.getElementById("trendPlayers");
    if (trendEl) trendEl.innerHTML = "";

    const eloTrendCard = document.getElementById("eloTrendCard");
    if (eloTrendCard) eloTrendCard.style.display = "none";
    const eloHistoryContainer = document.getElementById("eloHistoryContainer");
    if (eloHistoryContainer) eloHistoryContainer.style.display = "none";

    // Chart-Reset Fix
    const oldWinChart = document.getElementById("winChart");
    if (oldWinChart && oldWinChart.__myWinChart) {
      oldWinChart.__myWinChart.destroy();
    }

    const eloCanvas = document.getElementById("eloHistoryChart");
    if (eloCanvas && eloCanvas.__myEloChart) {
      eloCanvas.__myEloChart.destroy();
    }

    const canvas = document.getElementById("winChart");
    if (canvas) {
      // Canvas ausblenden, damit garantiert nichts "Altes" sichtbar bleibt
      canvas.style.display = "none";

      // Hard reset des Canvas-Backbuffers (zuverlässiger als clearRect allein)
      const w = canvas.width,
        h = canvas.height;
      canvas.width = 1;
      canvas.height = 1;
      canvas.width = w;
      canvas.height = h;
    }
  }
};



      window.openPlayerProfile = (name) => {
        // Nutze careerStats statt lastProcessedStats, um Filter-Einfluss zu vermeiden
        const stats = window.careerStats || window.lastProcessedStats;
        if (!stats || !stats.pData[name]) return;
        const d = stats.pData[name];

        const header = document.getElementById("profileHeader");
        const content = document.getElementById("profileStats");

        if (content) content.scrollTop = 0;
        setTimeout(() => {
          if (content) content.scrollTop = 0;
        }, 50);

        const streakClass =
          d.currentStreak >= 1
            ? "streak-fire"
            : d.loseStreak >= 3
              ? "streak-frost"
              : "";
        header.innerHTML = `
                <div class="avatar-frame ${streakClass}" style="margin-bottom:15px;">
                    <img loading="lazy" src="${safeGetAvatarUrl(name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'" style="width:90px; height:90px; border-radius:22px; border:4px solid var(--accent); object-fit:cover; box-shadow: 0 0 20px rgba(255,204,0,0.5);">
                </div>
                <div style="font-size:28px; font-weight:900; color:#fff; text-shadow: 0 0 15px rgba(255,204,0,0.4);">${name}</div>
                <div style="font-size:10px; color:#8e8e93; font-weight:800; text-transform:uppercase; margin-top:8px; letter-spacing:1.5px;">Spieler-Steckbrief</div>
            `;

        const winRate = d.games > 0 ? Math.round((d.wins / d.games) * 100) : 0;

        // Bestimme Lieblingskugel basierend auf allen Spielen (Karriere)
        let favBall = "-";
        if (window.stats) {
          let v = 0,
            h = 0;
          window.stats.forEach((g) => {
            const p1Arr = (g.p1 || "").split(" & ").map((s) => s.trim());
            const p2Arr = (g.p2 || "").split(" & ").map((s) => s.trim());
            if (p1Arr.includes(name) && g.bt1 && g.w == 1)
              g.bt1 === "Voll" ? v++ : h++;
            if (p2Arr.includes(name) && g.bt2 && g.w == 2)
              g.bt2 === "Voll" ? v++ : h++;
          });
          if (v > h) favBall = "🟡 Voll";
          else if (h > v) favBall = "🔵 Halb";
        }

        content.innerHTML = `
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:20px;">
                    <div class="card" style="margin-bottom:0; padding:15px; background: linear-gradient(135deg, rgba(255, 204, 0, 0.05) 0%, rgba(28, 28, 30, 0.8) 100%); border: 1px solid rgba(255,204,0,0.25); box-shadow: inset 0 0 10px rgba(255,204,0,0.05), 0 4px 15px rgba(0,0,0,0.3); text-align:center;">
                        <label style="padding:0; font-size: 9px; letter-spacing: 1px;">Aktuelles ELO</label>
                        <div id="prof-elo" style="font-size:24px; font-weight:900; color:var(--accent); text-shadow: 0 0 10px rgba(255,204,0,0.3);">0</div>
                    </div>
                    <div class="card" style="margin-bottom:0; padding:15px; background: linear-gradient(135deg, rgba(52, 199, 89, 0.05) 0%, rgba(28, 28, 30, 0.8) 100%); border: 1px solid rgba(52, 199, 89, 0.25); box-shadow: inset 0 0 10px rgba(52, 199, 89, 0.05), 0 4px 15px rgba(0,0,0,0.3); text-align:center;">
                        <label style="padding:0; font-size: 9px; letter-spacing: 1px;">Siegquote</label>
                        <div id="prof-winrate" style="font-size:24px; font-weight:900; color:#34c759; text-shadow: 0 0 10px rgba(52,199,89,0.3);">0%</div>
                    </div>
                </div>
                
                <!-- Call animateNumber directly after content is set -->

                
                <div class="section-label" style="margin-top:0;">📊 Karriere-Highlights</div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; justify-content:space-between; font-size:13px; padding:12px; background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border-radius:14px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                        <span style="color:#acacb0; font-weight: 600;">Spiele gesamt</span><span style="font-weight:900; color:#fff;">${d.games}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; padding:12px; background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border-radius:14px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                        <span style="color:#acacb0; font-weight: 600;">Abstauber-Siege (Foul)</span><span style="font-weight:900; color:#ff3b30; text-shadow: 0 0 8px rgba(255,59,48,0.4);">🪤 ${d.blackWinsCount || 0}x</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; padding:12px; background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border-radius:14px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                        <span style="color:#acacb0; font-weight: 600;">Höchste Serie</span><span style="font-weight:900; color:var(--accent); text-shadow: 0 0 8px rgba(255,204,0,0.4);">🔥 ${d.maxStreak}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; padding:12px; background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border-radius:14px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                        <span style="color:#acacb0; font-weight: 600;">Lieblingskugeln</span><span style="font-weight:900; color:#fff;">${favBall}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; padding:12px; background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border-radius:14px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                        <span style="color:#acacb0; font-weight: 600;">Nervenstärke (Clutch)</span><span style="font-weight:900; color:#4FC3F7; text-shadow: 0 0 8px rgba(79,195,247,0.4);">🦾 ${d.clutchWins}x</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; padding:12px; background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border-radius:14px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                        <span style="color:#acacb0; font-weight: 600;">ELO-Rekord</span><span style="font-weight:900; color:var(--accent); text-shadow: 0 0 8px rgba(255,204,0,0.4);">📈 ${d.maxElo}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; padding:12px; background: linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%); border-radius:14px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                        <span style="color:#acacb0; font-weight: 600;">Achievements</span><span style="font-weight:900; color:#fff;">🏆 ${d.achCountTotal}</span>
                    </div>
                </div>
            `;
        // Call animateNumber directly after content is set
        window.animateNumber("prof-elo", d.elo || 1000);
        window.animateNumber("prof-winrate", winRate);

        document.getElementById("playerProfileModal").style.display = "flex";
      };

      window.closeMatchDetailsModal = () => {
        document.getElementById("matchDetailsModal").style.display = "none";
      };

      window.openMatchDetails = (index) => {
        window.currentViewingMatchIndex = index;
        const g = window.stats[index];
        if (!g) return;

        // Nutze die bereits vom Worker berechneten globalen Stats
        const matchData =
          window.careerStats && window.careerStats.matchDeltas
            ? window.careerStats.matchDeltas[index]
            : {};
        const delta = matchData.eloDelta || 0;

        const header = document.getElementById("matchDetailsHeader");
        const content = document.getElementById("matchDetailsContent");

        if (content) content.scrollTop = 0;

        const isWin1 = parseInt(g.w) === 1;
        const isWin2 = parseInt(g.w) === 2;

        if (typeof window.processAllStatsChronologically !== "function") return; // Guard against Chart.js not loaded

        header.innerHTML = `
                <div style="font-weight:900; color:var(--accent); font-size:18px; text-transform:uppercase; letter-spacing:1px;">Match Details</div>
                <div style="font-size:11px; color:#8e8e93; font-weight:700; margin-top:4px;">${g.d || ""}</div>
            `;

        const getAvatarStack = (playerName, size = 50, effectClass = "") => {
          const names = (playerName || "")
            .split(" & ")
            .map((n) => n.trim())
            .filter(Boolean);
          return names
            .map(
              (n) => `
                    <div class="avatar-frame ${effectClass}" style="position:relative; width:${size}px; height:${size}px; min-width:${size}px;">
                        <img loading="lazy" src="${safeGetAvatarUrl(n)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'" style="position:absolute; top:0; left:0; width:${size}px; height:${size}px; border-radius:12px; object-fit:cover; border:2px solid rgba(255,255,255,0.2); z-index:2; background:transparent; ${effectClass === "match-shame" ? "filter: grayscale(0.1); opacity: 0.9;" : ""}">
                        <div style="display:none; width:${size}px; height:${size}px; border-radius:12px; background:rgba(255,255,255,0.05); align-items:center; justify-content:center; font-size:${size * 0.5}px; border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.2);">👤</div>
                    </div>
                `,
            )
            .join("");
        };

        content.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
                    <div style="flex:1; text-align:center; opacity:${isWin1 ? "1" : "0.5"}; transform:${isWin1 ? "scale(1.1)" : "scale(0.95) translateY(5px)"}; transition:all 0.3s;">
                        <div style="display:flex; justify-content:center; gap:12px; margin-bottom:10px;">${getAvatarStack(g.p1, 50, isWin1 ? "streak-fire" : "match-shame")}</div>
                        <div style="font-weight:900; font-size:16px; color:#fff;">${g.p1 || "-"}</div>
                    </div>
                    <div style="padding:0 15px; font-weight:900; color:#8e8e93; font-size:12px;">VS</div>
                    <div style="flex:1; text-align:center; opacity:${isWin2 ? "1" : "0.5"}; transform:${isWin2 ? "scale(1.1)" : "scale(0.95) translateY(5px)"}; transition:all 0.3s;">
                        <div style="display:flex; justify-content:center; gap:12px; margin-bottom:10px;">${getAvatarStack(g.p2, 50, isWin2 ? "streak-fire" : "match-shame")}</div>
                        <div style="font-weight:900; font-size:16px; color:#fff;">${g.p2 || "-"}</div>
                    </div>
                </div>

                <div class="section-label" style="margin-top:0;">📝 Spielbericht</div>
                <div class="card" style="margin-bottom:0; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);">
                    <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px;">
                        <span style="color:#8e8e93;">Modus</span><span style="color:#fff; font-weight:800;">${g.m || "-"}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px;">
                        <span style="color:#8e8e93;">ELO Änderung</span><span style="color:#34c759; font-weight:800;">± ${delta} Pkt.</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px;">
                        <span style="color:#8e8e93;">Sieg-Typ</span><span style="color:#fff; font-weight:800;">${g.t || "-"}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px;">
                        <span style="color:#8e8e93;">Anstoß durch</span><span style="color:var(--accent); font-weight:800;">⚡ ${g.a || "-"}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:12px;">
                        <span style="color:#8e8e93;">Restkugeln</span><span style="color:#fff; font-weight:800;">${g.l || 0}</span>
                    </div>
                    <div style="display:flex; justify-content:center; gap:20px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.06);">
                        <div style="display:flex; align-items:center; gap:6px; font-size:11px; font-weight:800; color:#8e8e93;">${window.getBallIcon ? window.getBallIcon(g.bt1) : ""} ${g.p1 || ""}</div>
                        <div style="display:flex; align-items:center; gap:6px; font-size:11px; font-weight:800; color:#8e8e93;">${window.getBallIcon ? window.getBallIcon(g.bt2) : ""} ${g.p2 || ""}</div>
                    </div>
                </div>

                ${
                  Object.keys(matchData.newAchievements || {}).length > 0
                    ? `
                    <div class="section-label" style="margin-top:20px;">🏆 Match-Erfolge</div>
                    <div style="display:flex; flex-direction:column; gap:15px;">
                        ${Object.entries(matchData.newAchievements)
                          .map(
                            ([playerName, achs], pIdx) => `
                            <div class="card" style="margin-bottom:0; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding: 15px; border-radius: 20px; animation: ach-card-enter 0.5s ease-out forwards; animation-delay: ${pIdx * 0.1}s; opacity: 0;">
                                <div style="font-weight:900; font-size:14px; color:var(--accent); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                                    <img loading="lazy" src="${safeGetAvatarUrl(playerName)}" style="width:20px; height:20px; border-radius:50%; border:1px solid var(--accent); object-fit:cover;">
                                    ${playerName} hat erreicht:
                                </div>
                                ${achs
                                  .map((ach, aIdx) => {
                                    const isShame = ach.k === "shame";
                                    const categoryColor = isShame
                                      ? "var(--error)"
                                      : "#34c759";
                                    const howColor = isShame
                                      ? "rgba(255, 59, 48, 0.85)"
                                      : "rgba(52, 199, 89, 0.85)";
                                    const howIcon = isShame ? "💀" : "🏆";
                                    const isMaxTier = ach.max === true;
                                    const phraseIndex = window.getFixedIndex
                                      ? window.getFixedIndex(
                                          playerName + ach.t,
                                          ach.d.length,
                                        )
                                      : 0;
                                    const phrase = ach.d[phraseIndex] || "";
                                    const borderStyle = isShame
                                      ? `border-left: 4px solid ${categoryColor};`
                                      : "border-left: none;";
                                    return `
                                        <div class="stat-row-item ${isMaxTier && !isShame ? "achievement-glow-fame" : ""} ${isShame ? "achievement-glow-shame shame-bg" : ""}" style="${borderStyle}">
                                            <div style="font-size:22px; min-width:35px; text-align:center;">${ach.i}</div>
                                            <div style="flex:1;">
                                                <div style="font-size:12px; font-weight:900; color:#fff;">
                                                    <span style="${isMaxTier ? "color:#4FC3F7; text-shadow: 0 0 8px rgba(79,195,247,0.4);" : ""}">${ach.t}${isMaxTier ? " ⭐" : ""}</span>
                                                </div>
                                                <div style="font-size:10px; color:#acacb0; font-style:italic; margin-top:2px;">"${phrase}"</div>
                                                <div style="font-size:10px; margin-top:3px; color:${howColor}; font-weight:600;">${howIcon} ${ach.h || ""}</div>
                                            </div>
                                        </div>
                                    `;
                                  })
                                  .join("")}
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                `
                    : ""
                }
            `;

        document.getElementById("matchDetailsModal").style.display = "flex";
        if (content) content.scrollTop = 0;
      };



window.renderHistory =       function renderHistory(statsToRender) {
        const container = document.getElementById("history-list");
        const list = statsToRender || window.stats;

        // Nutze bereits berechnete Daten statt Neu-Berechnung
        const processed = window.careerStats || { matchDeltas: {} };
        const deltas = processed.matchDeltas || {};

        const counter = document.getElementById("match-counter");
        if (counter) counter.innerText = "Matches: " + list.length;

        const getAvatarHtml = (playerName, size = 18) => {
          if (!playerName) return "";
          const players = playerName.split(" & ").map((p) => p.trim());
          return players
            .map((p, idx) => {
              const avatarSrc = safeGetAvatarUrl
                ? safeGetAvatarUrl(p)
                : `avatars/${p}.png`;
              const isLast = idx === players.length - 1;
              const margin = isLast ? "0" : "-6px";
              return `<img loading="lazy" src="${avatarSrc}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex'" style="width:${size}px; height:${size}px; border-radius:6px; object-fit:cover; border:1px solid rgba(255,255,255,0.2); margin-right:${margin}; position:relative; z-index:${players.length - idx}; vertical-align:middle;"><div style="display:none; width:${size}px; height:${size}px; border-radius:6px; background:rgba(255,255,255,0.1); align-items:center; justify-content:center; font-size:${size * 0.6}px; border:1px solid rgba(255,255,255,0.1); margin-right:${margin}; position:relative; z-index:${players.length - idx}; vertical-align:middle;">👤</div>`;
            })
            .join("");
        };

        const getBallBadge = (type) => {
          if (!type) return "";
          return `<span style="display:inline-flex; align-items:center; opacity:0.8;">${window.getBallIcon(type).replace('width="14"', 'width="12"').replace('height="14"', 'height="12"').replace("margin-right:4px;", "")}</span>`;
        };

        let html = "";
        let lastDate = "";

        const sortedList = list.slice().reverse().slice(0, 50); // Performance-Limit

        if (sortedList.length === 0) {
          container.innerHTML =
            '<div style="text-align:center;color:#8e8e93;padding:40px;">Keine Spiele vorhanden.</div>';
          return;
        }

        sortedList.forEach((g, idx) => {
          const i = window.stats.indexOf(g);
          const dateParts = (g.d || "").split(", ");
          const date = dateParts[0];
          const time = dateParts[1] || "";

          if (date !== lastDate) {
            html += `<div class="history-date-header" style="animation: tip-fade 0.5s ease-out forwards; animation-delay: ${idx * 0.05}s"><span>${date}</span></div>`;
            lastDate = date;
          }

          const isWin1 = g.w == 1;
          const isWin2 = g.w == 2;
          const dData = deltas[i] || { eloDelta: 0 };
          const delta = typeof dData === "object" ? dData.eloDelta || 0 : dData;
 
          // Dauer-Display berechnen (formatierte Dauer, Sekunden, fallback auf Minuten)
          const pad = (n) => String(n).padStart(2, "0");
          let durationDisplay = "00:00";
          if (g && g.durationFormatted) {
            durationDisplay = g.durationFormatted;
          } else if (g && typeof g.durationSeconds === "number") {
            const m2 = Math.floor(g.durationSeconds / 60);
            const s2 = g.durationSeconds % 60;
            durationDisplay = `${pad(m2)}:${pad(s2)}`;
          } else if (g && typeof g.duration === "number") {
            durationDisplay = `${pad(g.duration)}:00`;
          }
 
          // Cinematic Card Style
          const winGlow = "0 0 20px rgba(52, 199, 89, 0.15)";
          const borderStyle = isWin1
            ? `border-left: 3px solid #34c759;`
            : `border-right: 3px solid #34c759;`;
          const hasBreak1 = g.a === g.p1;
          const hasBreak2 = g.a === g.p2;
 
          html += ` 
                <div class="card" onclick="window.openMatchDetails(${i})" style="padding: 0; overflow: hidden; display: flex; flex-direction: column; ${borderStyle} animation: history-card-enter 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; animation-delay: ${idx * 0.05}s; opacity: 0; box-shadow: 0 4px 20px rgba(0,0,0,0.5); background: var(--card); transition: all 0.3s ease; cursor:pointer;">
                    <div style="padding: 15px 14px 12px 14px; display: flex; align-items: center; justify-content: space-between; position: relative;">
                        <!-- Team 1 -->
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; overflow: hidden;">
                            <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
                                <div style="display: flex; align-items: center; flex-shrink: 0; border: 1px solid ${isWin1 ? "#34c759" : "transparent"}; border-radius: 8px; padding: 2px;">${getAvatarHtml(g.p1, 22)}</div>
                                <div style="font-size: 14px; font-weight: 900; color: ${isWin1 ? "#fff" : "var(--error)"}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; display: flex; align-items: center; gap: 4px;">
                                    ${g.p1} ${hasBreak1 ? '<span title="Anstoß" style="color:var(--accent); font-size:10px;">⚡</span>' : ""}
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                ${isWin1 ? `<span style="font-size: 10px; font-weight: 900; color: #34c759; background: rgba(52,199,89,0.1); padding: 1px 5px; border-radius: 4px;">+${delta}</span>` : `<span style="font-size: 10px; font-weight: 900; color: var(--error); background: rgba(255,59,48,0.1); padding: 1px 5px; border-radius: 4px;">-${delta}</span>`} ${getBallBadge(g.bt1)}
                                <span style="font-size: 8px; font-weight: 800; color: #444; text-transform: uppercase;">${g.bt1}</span>
                            </div>
                        </div>

                        <!-- VS Divider -->
                        <div style="padding: 0 15px; display: flex; flex-direction: column; align-items: center; opacity: 0.2;">
                            <div style="font-size: 9px; font-weight: 900; color: #fff; letter-spacing: 1px;">VS</div>
                        </div>

                        <!-- Team 2 -->
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; overflow: hidden; text-align: right;">
                            <div style="display: flex; align-items: center; gap: 10px; width: 100%; justify-content: flex-end;">
                                <div style="font-size: 14px; font-weight: 900; color: ${isWin2 ? "#fff" : "var(--error)"}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; display: flex; align-items: center; justify-content: flex-end; gap: 4px;">
                                    ${hasBreak2 ? '<span title="Anstoß" style="color:var(--accent); font-size:10px;">⚡</span>' : ""} ${g.p2}
                                </div>
                                <div style="display: flex; align-items: center; flex-shrink: 0; border: 1px solid ${isWin2 ? "#34c759" : "transparent"}; border-radius: 8px; padding: 2px;">${getAvatarHtml(g.p2, 22)}</div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px;">
                                <span style="font-size: 8px; font-weight: 800; color: #444; text-transform: uppercase;">${g.bt2}</span>
                                ${getBallBadge(g.bt2)} ${isWin2 ? `<span style="font-size: 10px; font-weight: 900; color: #34c759; background: rgba(52,199,89,0.1); padding: 1px 5px; border-radius: 4px;">+${delta}</span>` : `<span style="font-size: 10px; font-weight: 900; color: var(--error); background: rgba(255,59,48,0.1); padding: 1px 5px; border-radius: 4px;">-${delta}</span>`}
                            </div>
                        </div>
                    </div>

                    <!-- Footer Info -->
                    <div style="background: rgba(0,0,0,0.2); padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.03);">
                        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex: 1;">
                            <span style="font-size: 9px; color: #8e8e93; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">${time}</span>
                            <span style="opacity:0.4;">•</span>
                            <span style="font-size: 9px; color: #7fc9ff; font-weight: 800;">${durationDisplay}</span>
                            <span style="height: 3px; width: 3px; border-radius: 50%; background: #444;"></span>
                            <span style="font-size: 9px; color: var(--accent); font-weight: 800;">MODUS: ${g.m === "1:1" ? "1 VS 1" : "2 VS 2"}</span>
                            <span style="height: 3px; width: 3px; border-radius: 50%; background: #444;"></span>
                            <span style="font-size: 9px; color: #8e8e93; font-weight: 700;">REST: ${g.l}</span>
                            <span style="height: 3px; width: 3px; border-radius: 50%; background: #444;"></span>
                            <span style="font-size: 9px; color: #8e8e93; font-weight: 700;">SIEG: ${g.t}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
                             <div style="font-size:10px; color:rgba(255,204,0,0.7); transition: color 0.3s; cursor:pointer;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color='rgba(255,204,0,0.7)'" onclick="event.stopPropagation(); window.openEditMatchModal(${i})">Bearbeiten</div>
                             <div style="font-size:10px; color:rgba(255,255,255,0.2); transition: color 0.3s; cursor:pointer;" onmouseover="this.style.color='var(--error)'" onmouseout="this.style.color='rgba(255,255,255,0.2)'" onclick="event.stopPropagation(); window.requestDelete(${i})">Löschen</div>
                        </div>
                    </div>
                </div>`;
        });

        container.innerHTML = html;
      }



      window.activeAchListFilter = "all";
      window.achListSearchQuery = "";
      window.filterAchListSearch = (query) => {
        window.achListSearchQuery = String(query || "").trim().toLowerCase();
        window.renderAchList(window.activeAchListFilter || "all");
      };

      window.openAchListModal = () => {
        const container = document.getElementById("achListContainer");
        const searchInp = document.getElementById("ach-search-input");
        if (searchInp) searchInp.value = "";
        window.achListSearchQuery = "";
        if (typeof window.renderAchList === "function") {
          window.renderAchList("all");
        }
        const modal = document.getElementById("achListModal");
        if (modal) modal.style.display = "flex";
        if (container) container.scrollTop = 0;
      };
      window.closeAchListModal = () => {
        const modal = document.getElementById("achListModal");
        if (modal) modal.style.display = "none";
      };
      window.renderAchList = (filter) => {
        window.activeAchListFilter = filter;
        const c = document.getElementById("achListContainer");
        if (c) c.scrollTop = 0;
        const pills = document.querySelectorAll("#achListModal .filter-pill");
        const fNames = ["all", "fame", "shame", "daily"];
        pills.forEach((p, idx) =>
          p.classList.toggle("active", fNames[idx] === filter),
        );

        // 1. Alle verfügbaren Karriere-Achievements sammeln (Fame + Shame + Killer)
        let pool = [
          ...(window.famePool || []).map((a) => ({ ...a, k: "fame" })),
          ...(window.shamePool || []).map((a) => ({ ...a, k: "shame" })),
          ...(window.generatedKillerAchs || []).map((a) => ({
            ...a,
            k: "fame",
          })),
        ];

        // 2. Pool basierend auf Filter bestimmen
        if (filter === "all") {
          pool = [
            ...pool,
            ...(window.dailyFamePool || []).map((a) => ({
              ...a,
              k: "fame",
              isDaily: true,
            })),
            ...(window.dailyShamePool || []).map((a) => ({
              ...a,
              k: "shame",
              isDaily: true,
            })),
          ];
        } else if (filter === "fame") {
          pool = pool.filter((a) => a.k === "fame");
        } else if (filter === "shame") {
          pool = pool.filter((a) => a.k === "shame");
        } else {
          // 'daily' filter
          pool = [
            ...(window.dailyFamePool || []).map((a) => ({ ...a, isDaily: true })),
            ...(window.dailyShamePool || []).map((a) => ({ ...a, isDaily: true })),
          ];
        }

        // Live-Suche filtern
        if (window.achListSearchQuery) {
          const q = window.achListSearchQuery;
          pool = pool.filter((a) => {
            const t = (a.t || "").toLowerCase();
            const h = (a.h || "").toLowerCase();
            const d = Array.isArray(a.d)
              ? a.d.join(" ").toLowerCase()
              : (a.d || "").toLowerCase();
            return t.includes(q) || h.includes(q) || d.includes(q);
          });
        }

        // 3. Sortierung: Kategorie (Fame vor Shame) -> Dann alphabetisch nach Name
        pool.sort((a, b) => {
          if (a.k !== b.k) return a.k === "fame" ? -1 : 1;
          return (a.t || "").localeCompare(b.t || "", "de");
        });

        // 4. HTML generieren
        if (!c) return;
        c.innerHTML = pool
          .map((a, idx) => {
            const isShame = a.k === "shame";
            const categoryColor = isShame ? "var(--error)" : "#34c759";
            const howColor = isShame
              ? "rgba(255, 59, 48, 0.85)"
              : "rgba(52, 199, 89, 0.85)";
            const howIcon = isShame ? "💀" : "🏆";
            const isMaxTier = a.max === true;
            const phrase = Array.isArray(a.d) ? a.d[0] || "" : a.d || "";

            let tierClass = "";
            let tierBadge = "";
            if (a.tier) {
              if (a.tier <= 3) {
                tierClass = "ach-tier-bronze";
                tierBadge = `<span class="tier-badge-pill tier-pill-bronze">Tier ${a.tier}</span>`;
              } else if (a.tier <= 6) {
                tierClass = "ach-tier-silver";
                tierBadge = `<span class="tier-badge-pill tier-pill-silver">Tier ${a.tier}</span>`;
              } else if (a.tier <= 9) {
                tierClass = "ach-tier-gold";
                tierBadge = `<span class="tier-badge-pill tier-pill-gold">Tier ${a.tier}</span>`;
              } else {
                tierClass = "ach-tier-diamond";
                tierBadge = `<span class="tier-badge-pill tier-pill-diamond">💎 Max</span>`;
              }
            } else if (isMaxTier && !isShame) {
              tierClass = "ach-tier-diamond";
              tierBadge = `<span class="tier-badge-pill tier-pill-diamond">💎 Max</span>`;
            }

            const borderStyle = isShame
              ? `border-left: 3px solid ${categoryColor};`
              : "";
            return `
                <div class="stat-row-item ${tierClass} ${isMaxTier && !isShame ? "achievement-glow-fame" : ""} ${isShame ? "achievement-glow-shame shame-bg" : ""}" style="${borderStyle} animation: ach-card-enter 0.3s ease-out forwards; animation-delay: ${Math.min(idx * 0.015, 0.5)}s; opacity: 0;">
                  <div class="achievement-icon">${a.i}</div>
                  <div style="flex:1; min-width:0;">
                    <div class="achievement-title" style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                        <span style="${isMaxTier ? "color:#4FC3F7; text-shadow: 0 0 8px rgba(79,195,247,0.4);" : ""}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${a.t}${isMaxTier ? " ⭐" : ""}</span>
                        <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
                          ${tierBadge}
                          ${a.isDaily ? '<span style="font-size:7px; color:var(--accent); border:1px solid rgba(255,204,0,0.3); padding:1px 3px; border-radius:3px; vertical-align:middle; opacity:0.8;">DAILY</span>' : ""}
                        </div>
                    </div>
                    ${phrase ? `<div class="achievement-phrase">${phrase}</div>` : ""}
                    <div class="achievement-how" style="color:${howColor};">${howIcon} ${a.h || ""}</div>
                  </div>
                </div>`;
          })
          .join("");
      };