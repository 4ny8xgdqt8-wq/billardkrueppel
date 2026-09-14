/* ==========================================================================
   Billardkrüppel Statistics & UI Rendering Engine
   ========================================================================== */

window.playerAvatars = window.playerAvatars || {
  Daniel: "avatars/Daniel.webp",
  Thorsten: "avatars/Thorsten.webp",
  Peter: "avatars/Peter.webp",
};
window.getAvatarUrl =
  window.getAvatarUrl ||
  ((name) => {
    return (
      (window.playerAvatars && window.playerAvatars[name]) ||
      `avatars/${name}.webp`
    );
  });

const safeGetAvatarUrl = (name) => {
  if (typeof window.getAvatarUrl === "function")
    return window.getAvatarUrl(name);
  if (window.playerAvatars && window.playerAvatars[name])
    return window.playerAvatars[name];
  return `avatars/${name}.webp`;
};
window.safeGetAvatarUrl = safeGetAvatarUrl;

window.showAppToast = function (text) {
  let toast = document.getElementById("app-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "app-toast";
    toast.style.cssText =
      "position:fixed; bottom:84px; left:50%; transform:translateX(-50%); background:rgba(15,23,42,0.95); color:#f8fafc; padding:10px 18px; border-radius:12px; font-size:13px; font-weight:600; border:1px solid rgba(212,175,55,0.4); box-shadow:0 10px 25px rgba(0,0,0,0.5); z-index:99999; pointer-events:none; transition:opacity 0.25s ease, transform 0.25s ease; opacity:0;";
    document.body.appendChild(toast);
  }
  toast.innerText = text;
  toast.style.opacity = "1";
  toast.style.transform = "translateX(-50%) translateY(0)";
  if (toast.__timer) clearTimeout(toast.__timer);
  toast.__timer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(10px)";
  }, 2200);
};

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
    if (typeof window.getAvatarUrl === "function")
      return window.getAvatarUrl(name);
    if (window.playerAvatars && window.playerAvatars[name])
      return window.playerAvatars[name];
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

  // --- HILFSFUNKTIONEN FÜR HISTORISCHE KARRIERE-KONTEXTE & TAGESSIEGER-SCORES ---
  const parseDayDate = (dStr) => {
    if (!dStr) return null;
    const s = String(dStr).split(",")[0].trim();
    let m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (m) {
      const yy = parseInt(m[3], 10);
      const mm = parseInt(m[2], 10);
      const dd = parseInt(m[1], 10);
      return { year: yy, month: mm, day: dd, num: yy * 10000 + mm * 100 + dd };
    }
    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) {
      const yy = parseInt(m[1], 10);
      const mm = parseInt(m[2], 10);
      const dd = parseInt(m[3], 10);
      return { year: yy, month: mm, day: dd, num: yy * 10000 + mm * 100 + dd };
    }
    return null;
  };

  const actualTodayObj = parseDayDate(actualTodayStr);
  const actualTodayNum = actualTodayObj ? actualTodayObj.num : null;

  const careerContextCache = new Map();
  const getCareerContext = (targetDStr) => {
    const p = parseDayDate(targetDStr);
    if (!p) {
      return {
        dAll: precalculatedCareerStats || { pData: {} },
        dBefore: precalculatedCareerStatsBeforeToday || { pData: {} },
      };
    }
    if (careerContextCache.has(p.num)) {
      return careerContextCache.get(p.num);
    }
    // Wenn das Datum exakt der aktuelle Kalendertag ist, Worker-Vorabberechnung nutzen
    if (
      actualTodayNum &&
      p.num === actualTodayNum &&
      precalculatedCareerStats &&
      precalculatedCareerStatsBeforeToday
    ) {
      const res = {
        dAll: precalculatedCareerStats,
        dBefore: precalculatedCareerStatsBeforeToday,
      };
      careerContextCache.set(p.num, res);
      return res;
    }
    const matchesBefore = allSafeStats.filter((g) => {
      const gp = parseDayDate(g.d);
      return gp && gp.num < p.num;
    });
    const matchesUpTo = allSafeStats.filter((g) => {
      const gp = parseDayDate(g.d);
      return gp && gp.num <= p.num;
    });
    const res = {
      dBefore: window.calculateStatsLocally(matchesBefore, window.spieler),
      dAll: window.calculateStatsLocally(matchesUpTo, window.spieler),
    };
    careerContextCache.set(p.num, res);
    return res;
  };

  const computeDailyWinnerScore = (d, dAllPlayer, dBeforePlayer) => {
    if (!d || !d.todayGames) return 0;

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
    const h2hBefore = dBeforePlayer?.headToHead || {};
    Object.entries(h2hBefore).forEach(([opp, st]) => {
      if (st && st.l > maxL) {
        maxL = st.l;
        nemesis = opp;
      }
    });
    if (
      nemesis &&
      d.headToHead &&
      d.headToHead[nemesis] &&
      d.headToHead[nemesis].w > 0
    ) {
      score += 4;
    }

    score -= (d.todayBlackWinsCount || 0) * 1;
    score -= (d.todayLostBy8BallError || 0) * 2;
    // Abzug für hohe Ø Restkugeln bei Niederlagen
    if (d.todayAvgRest > 0 && (d.todayGames || 0) - (d.todayWins || 0) > 0) {
      score += Math.round(d.todayAvgRest * -0.25); // -0.25 pro Ø Restkugel
    }

    let fameCount = 0,
      shameCount = 0;
    // Tägliche Pools prüfen
    (window.dailyFamePool || []).forEach((ach) => {
      if (ach.cond(d)) fameCount++;
    });
    (window.dailyShamePool || []).forEach((ach) => {
      if (ach.cond(d)) shameCount++;
    });
    // Neue Karriere-Meilensteine, die an diesem Spieltag geknackt wurden
    const targetAll = dAllPlayer || d;
    const targetBefore = dBeforePlayer || { headToHead: {} };
    (window.famePool || []).forEach((ach) => {
      if (ach.cond(targetAll) && !ach.cond(targetBefore)) fameCount++;
    });
    (window.shamePool || []).forEach((ach) => {
      if (ach.cond(targetAll) && !ach.cond(targetBefore)) shameCount++;
    });
    score += fameCount * 2 - shameCount * 2;

    return score;
  };

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
  window.currentStatScope = {
    filterToday,
    isFiltered,
    todayStr,
    statsToday,
    safeStats,
    currentStats,
    res,
  };
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

      const activePlayer = !isTodayTab
        ? window.activeAchPlayer || labels[0] || "all"
        : null;
      const activeCat = !isTodayTab ? window.activeAchCategory || "all" : "all";

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

        const borderStyle = isShame
          ? `border-left: 3px solid ${borderCol};`
          : "";
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
            ? dailyEntries
                .map(([title, cnt]) => renderDailyCard(title, cnt))
                .join("")
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
      const activePlayer = window.activeAchPlayer || labels[0] || "all";
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
        const time = (g.d || "").includes(", ")
          ? g.d.split(", ")[1]
          : g.d || "";
        const isWin1 = g.w == 1;
        const isWin2 = g.w == 2;
        const dData = deltas[i] || { eloDelta: 0 };
        const delta = typeof dData === "object" ? dData.eloDelta || 0 : dData;
        const hasBreak1 = g.a === g.p1;
        const hasBreak2 = g.a === g.p2;
        const winTypeStr = String(g.t || "").trim();
        const isRegular =
          !winTypeStr ||
          winTypeStr.includes("Regulär") ||
          winTypeStr.includes("gelocht") ||
          winTypeStr.toLowerCase().includes("normal");
        const isNonRegular = !isRegular;
        const cardAccent = isNonRegular ? "#ff9500" : "#30d158";
        const winnerName = isWin1 ? g.p1 : g.p2;
        const matchNum = statsToday.length - idx;

        const getAv = (pName, isWinner = false, size = 32) => {
          if (!pName) return "";
          const names = pName.split(" & ").map((s) => s.trim());
          return names
            .map((n, pIdx) => {
              const src = safeGetAvatarUrl(n);
              const margin = pIdx === names.length - 1 ? "0" : "-10px";
              return `<img src="${src}" class="match-avatar-chip" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex'" style="width:${size}px; height:${size}px; margin-right:${margin}; position:relative; z-index:${names.length - pIdx};">
                      <div class="match-avatar-chip" style="display:none; width:${size}px; height:${size}px; background:#1e293b; align-items:center; justify-content:center; font-size:${Math.round(size * 0.55)}px; margin-right:${margin}; position:relative; z-index:${names.length - pIdx};">👤</div>`;
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

        const ballBadge1 = g.bt1
          ? g.bt1 === "Voll"
            ? "🟡 Volle"
            : "🔵 Halbe"
          : "";
        const ballBadge2 = g.bt2
          ? g.bt2 === "Voll"
            ? "🟡 Volle"
            : "🔵 Halbe"
          : "";

        const sub1Parts = [];
        if (ballBadge1) sub1Parts.push(`<span>${ballBadge1}</span>`);
        if (hasBreak1)
          sub1Parts.push(`<span style="color:#ffcc00;">⚡ Anstoß</span>`);
        if (!isWin1 && typeof g.l !== "undefined")
          sub1Parts.push(`<span>Rest: ${g.l}</span>`);

        const sub2Parts = [];
        if (!isWin2 && typeof g.l !== "undefined")
          sub2Parts.push(`<span>Rest: ${g.l}</span>`);
        if (hasBreak2)
          sub2Parts.push(`<span style="color:#ffcc00;">⚡ Anstoß</span>`);
        if (ballBadge2) sub2Parts.push(`<span>${ballBadge2}</span>`);

        const cleanWinType = winTypeStr.replace(/^Gegner-Fehler:\s*/i, "");
        const modeWinText = isNonRegular
          ? `<span style="color:#ff9500; font-weight:800;">⚠️ ${cleanWinType || "Gegner-Fehler"}</span>`
          : `${g.m || "1:1"} · ${winTypeStr || "Regulärer Sieg"}`;
        const calloutReason = isNonRegular
          ? ` (${cleanWinType || "Gegner-Fehler"})`
          : "";

        return `
            <div onclick="window.openMatchDetails(${i})" class="match-card-modern cinematic-entry ${isNonRegular ? "non-regular" : ""}" style="--card-accent: ${cardAccent}; animation-delay: ${idx * 0.04}s;">
                <div class="match-card-header">
                    <div class="match-card-header-left">
                        <span class="match-num-tag">Match #${matchNum}</span>
                        <span>•</span>
                        <span>${time ? `${time} Uhr` : ""}</span>
                        ${time ? "<span>•</span>" : ""}
                        <span class="match-duration-tag">⏱️ ${durationDisplay}</span>
                    </div>
                    <div>${modeWinText}</div>
                </div>
                <div class="match-duel-arena">
                    <div class="match-team ${isWin1 ? "winner" : "loser"}">
                        <div style="display:flex; flex-shrink:0;">${getAv(g.p1, isWin1, 32)}</div>
                        <div style="min-width:0; overflow:hidden;">
                            <div class="match-player-name">${g.p1} ${isWin1 ? "👑" : ""}</div>
                            <div class="match-team-sub">${sub1Parts.join(" <span>•</span> ")}</div>
                        </div>
                    </div>
                    <div class="match-vs-badge">VS</div>
                    <div class="match-team right ${isWin2 ? "winner" : "loser"}">
                        <div style="min-width:0; overflow:hidden;">
                            <div class="match-player-name">${isWin2 ? "👑 " : ""}${g.p2}</div>
                            <div class="match-team-sub">${sub2Parts.join(" <span>•</span> ")}</div>
                        </div>
                        <div style="display:flex; flex-shrink:0;">${getAv(g.p2, isWin2, 32)}</div>
                    </div>
                </div>
                <div class="match-card-footer">
                    <div class="match-winner-callout">
                        <span>🏆 Sieger: ${winnerName}${calloutReason}</span>
                    </div>
                    <div class="match-elo-pill">${delta > 0 ? "+" : ""}${delta} ELO</div>
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

      const { dAll: sessionCareerStatsAll, dBefore: sessionCareerStatsBefore } =
        getCareerContext(todayStr);

      labels.forEach((p) => {
        const d = res.pData[p]; // Session-Daten des ausgewählten Tages
        if (!d || d.todayGames === 0) return;

        const dAllPlayer = sessionCareerStatsAll?.pData?.[p] || d;
        const dBeforePlayer = sessionCareerStatsBefore?.pData?.[p] || {
          headToHead: {},
        };

        const score = computeDailyWinnerScore(d, dAllPlayer, dBeforePlayer);
        const wins = d.todayWins || 0;
        const losses = Math.max(0, (d.todayGames || 0) - wins);
        const eloGain =
          res.aggregates?.sessionEloGains?.[p] ??
          window.careerStats?.aggregates?.sessionEloGains?.[p];
        playerScores.push({
          player: p,
          score: score,
          wins: wins,
          losses: losses,
          eloGain: typeof eloGain === "number" ? Math.round(eloGain) : null,
        });
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
        const uniqueScores = [
          ...new Set(playerScores.map((ps) => ps.score)),
        ].slice(0, 3);

        const places = { 1: null, 2: null, 3: null };

        if (uniqueScores.length > 0) {
          const score = uniqueScores[0];
          const matched = playerScores.filter((ps) => ps.score === score);
          places[1] = {
            players: matched.map((p) => p.player),
            details: matched,
            score,
          };
        }
        if (uniqueScores.length > 1) {
          const score = uniqueScores[1];
          const matched = playerScores.filter((ps) => ps.score === score);
          places[2] = {
            players: matched.map((p) => p.player),
            details: matched,
            score,
          };
        }
        if (uniqueScores.length > 2) {
          const score = uniqueScores[2];
          const matched = playerScores.filter((ps) => ps.score === score);
          places[3] = {
            players: matched.map((p) => p.player),
            details: matched,
            score,
          };
        }

        const getAvatarPodiumHtml = (players) => {
          return players
            .map(
              (p) =>
                `<img src="${safeGetAvatarUrl(p)}" onerror="this.style.display='none';">`,
            )
            .join("");
        };

        const getPodiumStatsSubHtml = (placeObj) => {
          if (!placeObj || !placeObj.details || placeObj.details.length === 0)
            return "";
          const m = placeObj.details[0];
          const eloText =
            m.eloGain !== null
              ? m.eloGain > 0
                ? `<span class="elo">+${m.eloGain}</span>`
                : m.eloGain < 0
                  ? `<span class="elo" style="color:#ff453a;">${m.eloGain}</span>`
                  : `<span class="elo">±0</span>`
              : "";
          const eloPart = eloText ? ` · ${eloText}` : "";
          return `<div class="podium-stats-sub"><span class="win">${m.wins}S · ${m.losses}N</span>${eloPart}</div>`;
        };

        let podiumPlacesHtml = "";
        if (places[2]) {
          podiumPlacesHtml += `
            <div class="podium-column p-2">
              <div class="podium-actor">
                <div class="podium-medal-badge">🥈</div>
                <div class="podium-avatar-wrap">${getAvatarPodiumHtml(places[2].players)}</div>
                <div class="podium-name">${places[2].players.join(" / ")}</div>
                ${getPodiumStatsSubHtml(places[2])}
              </div>
              <div class="podium-pedestal pedestal-2">
                ${getStyledScore(places[2].score)}
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
                ${getPodiumStatsSubHtml(places[1])}
              </div>
              <div class="podium-pedestal pedestal-1">
                ${getStyledScore(places[1].score)}
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
                ${getPodiumStatsSubHtml(places[3])}
              </div>
              <div class="podium-pedestal pedestal-3">
                ${getStyledScore(places[3].score)}
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
    const barVoll = byId("stat-balls-bar-voll");
    if (barVoll) barVoll.style.width = vRate + "%";

    // --- TOP KUGEL-SPIELER BERECHNEN ---
    // Use pre-calculated aggregates from worker
    const playerBallWins = agg.playerBallWins || {};

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

    // --- TOP-SPIELER BERECHNUNGEN (MODERN STAT-TILES) ---
    const renderModernStatTile = (holderId, valId, valArray, options = {}) => {
      const holderEl = byId(holderId);
      const valEl = byId(valId);
      const {
        suffix = "",
        unit = "",
        pillClass = "pill-gold",
        minThreshold = 0,
        isMin = false,
        formatVal = null,
      } = options;
      if (!holderEl) return;

      const validVals = (valArray || []).filter(
        (x) => x.relevantGames >= minThreshold && x.val > 0,
      );
      if (validVals.length === 0) {
        holderEl.innerHTML =
          '<span class="stat-card-player-label" style="color:#64748b;">-</span>';
        if (valEl)
          valEl.innerHTML = `<div class="stat-hero-pill ${pillClass}">-</div>`;
        return;
      }

      const targetVal = isMin
        ? Math.min(...validVals.map((x) => x.val))
        : Math.max(...validVals.map((x) => x.val));

      const tops = validVals.filter((x) => Math.abs(x.val - targetVal) < 0.001);
      if (tops.length === 0) {
        holderEl.innerHTML =
          '<span class="stat-card-player-label" style="color:#64748b;">-</span>';
        if (valEl)
          valEl.innerHTML = `<div class="stat-hero-pill ${pillClass}">-</div>`;
        return;
      }

      // Left side: Player Avatar & Name or Stack
      let holderHtml = "";
      if (tops.length === 1) {
        const p = tops[0].p;
        holderHtml = `
          <img src="${safeGetAvatarUrl(p)}" class="stat-card-avatar" alt="${p}" onerror="this.src='logo.png'">
          <span class="stat-card-player-label">${p}</span>
        `;
      } else if (tops.length === 2) {
        holderHtml = `
          <div class="stat-avatar-stack">
            <img src="${safeGetAvatarUrl(tops[0].p)}" alt="${tops[0].p}" onerror="this.src='logo.png'">
            <img src="${safeGetAvatarUrl(tops[1].p)}" alt="${tops[1].p}" onerror="this.src='logo.png'">
          </div>
          <span class="stat-card-player-label">${tops[0].p} & ${tops[1].p}</span>
        `;
      } else {
        const stack = tops
          .slice(0, 3)
          .map(
            (t) =>
              `<img src="${safeGetAvatarUrl(t.p)}" alt="${t.p}" onerror="this.src='logo.png'">`,
          )
          .join("");
        holderHtml = `
          <div class="stat-avatar-stack">${stack}</div>
          <span class="stat-card-player-label">Trio gleichauf</span>
        `;
      }
      holderEl.innerHTML = holderHtml;

      // Right side: Hero Pill
      const displayVal = formatVal ? formatVal(targetVal) : targetVal;
      if (valEl) {
        valEl.innerHTML = `<div class="stat-hero-pill ${pillClass}">${displayVal}${suffix ? `<span class="unit">${suffix}</span>` : ""}${unit ? ` <span class="unit">${unit}</span>` : ""}</div>`;
      }
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
    renderModernStatTile("stat-pechvogel", "stat-pechvogel-val", pechVals, {
      unit: "Ø Reste",
      pillClass: "pill-gold",
    });

    // 2. Reguläre Siege (Präzisions-Schütze)
    const regWinVals = labels.map((p) => {
      const d = res.pData[p];
      const wins = filterToday ? d.todayWins : d.wins;
      const reg = filterToday ? d.todayRegularWins : d.regularWins;
      const val = wins > 0 ? Math.round((reg / wins) * 100) : 0;
      return { p, val, relevantGames: wins };
    });
    renderModernStatTile(
      "stat-regular-wins",
      "stat-regular-wins-val",
      regWinVals,
      {
        suffix: "%",
        unit: "Quote",
        pillClass: "pill-green",
        minThreshold: filterToday ? 1 : 3,
      },
    );

    // 3. Foul-Spezialist (Absolute Siege durch Gegner-Foul an der 8)
    const foul8Vals = labels.map((p) => {
      const d = res.pData[p];
      const val = filterToday ? d.todayFoul8Wins || 0 : d.foul8Wins || 0;
      return { p, val, relevantGames: val };
    });
    renderModernStatTile("stat-foul8-wins", "stat-foul8-wins-val", foul8Vals, {
      suffix: "x",
      pillClass: "pill-purple",
    });

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
    renderModernStatTile(
      "stat-lost-by-8error",
      "stat-lost-by-8error-val",
      lost8Vals,
      {
        suffix: "%",
        unit: "Quote",
        pillClass: "pill-red",
        minThreshold: filterToday ? 1 : 3,
      },
    );

    // 5. Nutzniesser (Gesamte Siege durch Schwarz-Fehler)
    const nutzVals = labels.map((p) => {
      const d = res.pData[p];
      const val = filterToday
        ? d.todayBlackWinsCount || 0
        : d.blackWinsCount || 0;
      return { p, val, relevantGames: val };
    });
    renderModernStatTile("stat-nutzniesser", "stat-nutzniesser-val", nutzVals, {
      suffix: "x",
      pillClass: "pill-gold",
    });

    // 6. Nervenstärke (Clutch Wins)
    const clutchVals = labels.map((p) => {
      const val = filterToday
        ? res.pData[p].todayClutchWins || 0
        : res.pData[p].clutchWins || 0;
      return { p, val, relevantGames: val };
    });
    renderModernStatTile("stat-clutch", "stat-clutch-val", clutchVals, {
      suffix: "x",
      unit: "Clutch",
      pillClass: "pill-blue",
    });

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
    renderModernStatTile("stat-killer", "stat-killer-val", killerVals, {
      unit: "Ø Reste",
      pillClass: "pill-red",
    });

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
      renderModernStatTile(
        "stat-service-thief",
        "stat-service-thief-val",
        thiefVals,
        {
          suffix: "%",
          pillClass: "pill-gold",
          minThreshold: filterToday ? 1 : 5,
        },
      );

    // Top Kugel-Spezialisten (Modern Stat Cards)
    const vollCandidates = Object.keys(playerBallWins).map((p) => ({
      p,
      val: playerBallWins[p]["Voll"] || 0,
      relevantGames: playerBallWins[p]["Voll"] || 0,
    }));
    renderModernStatTile("stat-top-voll", "stat-top-voll-val", vollCandidates, {
      unit: "Siege",
      pillClass: "pill-gold",
      minThreshold: 1,
    });

    const halbCandidates = Object.keys(playerBallWins).map((p) => ({
      p,
      val: playerBallWins[p]["Halb"] || 0,
      relevantGames: playerBallWins[p]["Halb"] || 0,
    }));
    renderModernStatTile("stat-top-halb", "stat-top-halb-val", halbCandidates, {
      unit: "Siege",
      pillClass: "pill-cyan",
      minThreshold: 1,
    });

    // 9. ELO-Vampir (Wer hat wen am meisten geschröpft)
    const transfers = res.aggregates?.eloTransfers || {};
    const sortedTransfers = Object.entries(transfers).sort(
      (a, b) => b[1] - a[1],
    );
    const vampireHolder = byId("stat-vampire");
    const vampireVal = byId("stat-vampire-val");
    if (vampireHolder) {
      if (sortedTransfers.length > 0 && sortedTransfers[0][1] > 0) {
        const [key, val] = sortedTransfers[0];
        const players = key.split(" -> ");
        if (players.length === 2) {
          vampireHolder.innerHTML = `
            <img src="${safeGetAvatarUrl(players[0])}" class="stat-card-avatar" alt="${players[0]}" onerror="this.src='logo.png'">
            <span style="font-weight:900; color:#fff; font-size:0.9rem;">${players[0]}</span>
            <span style="color:var(--accent); font-size:0.8rem;">⚔️</span>
            <img src="${safeGetAvatarUrl(players[1])}" class="stat-card-avatar" alt="${players[1]}" onerror="this.src='logo.png'">
            <span style="font-weight:700; color:#94a3b8; font-size:0.9rem;">${players[1]}</span>
          `;
          if (vampireVal)
            vampireVal.innerHTML = `<div class="stat-hero-pill pill-green">+${val} <span class="unit">Pkt.</span></div>`;
        } else {
          vampireHolder.innerHTML = `<span class="stat-card-player-label">${key}</span>`;
          if (vampireVal)
            vampireVal.innerHTML = `<div class="stat-hero-pill pill-green">+${val} <span class="unit">Pkt.</span></div>`;
        }
      } else {
        vampireHolder.innerHTML = `<span class="stat-card-player-label" style="color:#64748b;">-</span>`;
        if (vampireVal)
          vampireVal.innerHTML = `<div class="stat-hero-pill pill-green">-</div>`;
      }
    }

    // 10. Session-Rekord (Höchster ELO-Gewinn an einem Tag)
    let sessionRecVal = "-";
    let sessionRecHolderHtml = '<span class="rec-name">Max Tages-ELO</span>';
    if (filterToday) {
      const dayGains =
        res.aggregates?.sessionEloGains?.[
          todayStr.split(".").reverse().join("-")
        ] || {};
      const topToday = Object.entries(dayGains).sort((a, b) => b[1] - a[1]);
      if (topToday.length > 0 && topToday[0][1] > 0) {
        const p = topToday[0][0];
        const g = Math.round(topToday[0][1]);
        sessionRecVal = `+${g} ELO`;
        sessionRecHolderHtml = `<img src="${safeGetAvatarUrl(p)}" class="rec-avatar" onerror="this.style.display='none'"><span class="rec-name">${p}</span>`;
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
        sessionRecVal = `+${Math.round(recEntry.v)} ELO`;
        sessionRecHolderHtml = `<img src="${safeGetAvatarUrl(recEntry.p)}" class="rec-avatar" onerror="this.style.display='none'"><span class="rec-name">${recEntry.p} (${formattedDate})</span>`;
      }
    }
    if (byId("stat-session-record"))
      byId("stat-session-record").innerText = sessionRecVal;
    const recSessionCard = byId("stat-rec-session-gain-card");
    if (recSessionCard) {
      const holder = recSessionCard.querySelector(".rec-holder");
      if (holder) holder.innerHTML = sessionRecHolderHtml;
    }

    // Sieg-Serie Vitrine Holder
    const streakHolder = byId("stat-rec-streak-card");
    if (streakHolder && res.maxStreakHolder) {
      const holder = streakHolder.querySelector(".rec-holder");
      if (holder) {
        holder.innerHTML = `<img src="${safeGetAvatarUrl(res.maxStreakHolder)}" class="rec-avatar" onerror="this.style.display='none'"><span class="rec-name">${res.maxStreakHolder}</span>`;
      }
    }

    // Die Mauer (Zäher Verlierer: Min Ø Restkugeln bei Niederlage)
    const wallCandidates = pechVals.filter((x) => x.relevantGames > 0);
    renderModernStatTile("stat-mauer", "stat-mauer-val", wallCandidates, {
      isMin: true,
      unit: "Ø Reste",
      pillClass: "pill-cyan",
      formatVal: (v) => v.toFixed(1),
    });

    // --- ZEITBASIERTE STATISTIKEN ---
    const timeStatsPData = filterToday
      ? res.pData
      : precalculatedCareerStats?.pData || {};
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
        const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")} Min`;
        byId("stat-fastest-win").innerText = timeStr;
        const fastHolder = byId("stat-fastest-win-holder");
        if (fastHolder) {
          fastHolder.innerHTML = fastestWinPlayers
            .map(
              (p) =>
                `<img src="${safeGetAvatarUrl(p)}" class="rec-avatar" onerror="this.style.display='none'"><span class="rec-name">${p}</span>`,
            )
            .join(" ");
        }
      } else {
        byId("stat-fastest-win").innerText = "-";
        const fastHolder = byId("stat-fastest-win-holder");
        if (fastHolder)
          fastHolder.innerHTML =
            '<span class="rec-name">Kürzeste Partie</span>';
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
        const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")} Min`;
        byId("stat-longest-match").innerText = timeStr;
        const longHolder = byId("stat-longest-match-holder");
        if (longHolder) {
          longHolder.innerHTML = longestMatchPlayers
            .map(
              (p) =>
                `<img src="${safeGetAvatarUrl(p)}" class="rec-avatar" onerror="this.style.display='none'"><span class="rec-name">${p}</span>`,
            )
            .join(" ");
        }
      } else {
        byId("stat-longest-match").innerText = "-";
        const longHolder = byId("stat-longest-match-holder");
        if (longHolder)
          longHolder.innerHTML =
            '<span class="rec-name">Längste Schlacht</span>';
      }
    }

    // Ø Siegesdauer (Effizienz)
    if (byId("stat-avg-win-duration")) {
      let bestAvgWinDur = Infinity;
      const minWinsForAvg = filterToday ? 2 : 5;

      timeStatsLabels.forEach((p) => {
        const d = timeStatsPData[p];
        const wins = filterToday
          ? d.todayWinsWithDuration || 0
          : d.winsWithDuration || 0;
        const totalDur = filterToday
          ? d.todayTotalWinDuration
          : d.totalWinDuration;
        const avgDur = wins > 0 ? totalDur / wins : 0;

        if (wins >= minWinsForAvg && avgDur > 0 && avgDur < bestAvgWinDur) {
          bestAvgWinDur = avgDur;
        }
      });

      if (bestAvgWinDur !== Infinity && bestAvgWinDur > 0) {
        const efficientPlayers = timeStatsLabels.filter((p) => {
          const d = timeStatsPData[p];
          const wins = filterToday
            ? d.todayWinsWithDuration || 0
            : d.winsWithDuration || 0;
          const totalDur = filterToday
            ? d.todayTotalWinDuration
            : d.totalWinDuration;
          const avgDur = wins > 0 ? totalDur / wins : 0;
          return (
            wins >= minWinsForAvg && Math.abs(avgDur - bestAvgWinDur) < 0.001
          );
        });
        const totalSeconds = Math.round(bestAvgWinDur);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        const timeFormatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

        const winDurHolder = byId("stat-avg-win-duration");
        const winDurVal = byId("stat-avg-win-duration-val");
        if (winDurHolder) {
          let holderHtml = "";
          if (efficientPlayers.length === 1) {
            holderHtml = `
              <img src="${safeGetAvatarUrl(efficientPlayers[0])}" class="stat-card-avatar" alt="${efficientPlayers[0]}" onerror="this.src='logo.png'">
              <span class="stat-card-player-label">${efficientPlayers[0]}</span>
            `;
          } else {
            const stack = efficientPlayers
              .map(
                (p) =>
                  `<img src="${safeGetAvatarUrl(p)}" alt="${p}" onerror="this.src='logo.png'">`,
              )
              .join("");
            holderHtml = `<div class="stat-avatar-stack">${stack}</div><span class="stat-card-player-label">${efficientPlayers.join(" & ")}</span>`;
          }
          winDurHolder.innerHTML = holderHtml;
        }
        if (winDurVal) {
          winDurVal.innerHTML = `<div class="stat-hero-pill pill-green">${timeFormatted} <span class="unit">min</span></div>`;
        }

        const subLabel = byId("stat-avg-win-duration-subtitle");
        if (subLabel) {
          subLabel.innerText = `Effizientester Sieger (min. ${minWinsForAvg} Siege)`;
        }
      } else {
        const winDurHolder = byId("stat-avg-win-duration");
        const winDurVal = byId("stat-avg-win-duration-val");
        if (winDurHolder)
          winDurHolder.innerHTML =
            '<span class="stat-card-player-label" style="color:#64748b;">-</span>';
        if (winDurVal)
          winDurVal.innerHTML =
            '<div class="stat-hero-pill pill-green">-</div>';
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
        const games = filterToday
          ? d.todayGamesWithDuration || 0
          : d.gamesWithDuration || 0;
        const totalDur = filterToday
          ? d.todayTotalMatchDuration
          : d.totalMatchDuration;
        const avgDur = games > 0 ? totalDur / games : 0;

        if (games >= minGamesForAvgMatch && avgDur > maxAvgMatchDur) {
          maxAvgMatchDur = avgDur;
        }
      });

      if (maxAvgMatchDur > 0) {
        const slowPlayers = timeStatsLabels.filter((p) => {
          const d = timeStatsPData[p];
          const games = filterToday
            ? d.todayGamesWithDuration || 0
            : d.gamesWithDuration || 0;
          const totalDur = filterToday
            ? d.todayTotalMatchDuration
            : d.totalMatchDuration;
          const avgDur = games > 0 ? totalDur / games : 0;
          return (
            games >= minGamesForAvgMatch &&
            Math.abs(avgDur - maxAvgMatchDur) < 0.001
          );
        });
        const totalSeconds = Math.round(maxAvgMatchDur);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        const timeFormatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

        const matchDurHolder = byId("stat-avg-match-duration");
        const matchDurVal = byId("stat-avg-match-duration-val");
        if (matchDurHolder) {
          let holderHtml = "";
          if (slowPlayers.length === 1) {
            holderHtml = `
              <img src="${safeGetAvatarUrl(slowPlayers[0])}" class="stat-card-avatar" alt="${slowPlayers[0]}" onerror="this.src='logo.png'">
              <span class="stat-card-player-label">${slowPlayers[0]}</span>
            `;
          } else {
            const stack = slowPlayers
              .map(
                (p) =>
                  `<img src="${safeGetAvatarUrl(p)}" alt="${p}" onerror="this.src='logo.png'">`,
              )
              .join("");
            holderHtml = `<div class="stat-avatar-stack">${stack}</div><span class="stat-card-player-label">${slowPlayers.join(" & ")}</span>`;
          }
          matchDurHolder.innerHTML = holderHtml;
        }
        if (matchDurVal) {
          matchDurVal.innerHTML = `<div class="stat-hero-pill pill-gold">${timeFormatted} <span class="unit">min</span></div>`;
        }

        const subLabel = byId("stat-avg-match-duration-subtitle");
        if (subLabel)
          subLabel.innerText = `Der Taktiker (min. ${minGamesForAvgMatch} Spiele)`;
      } else {
        const matchDurHolder = byId("stat-avg-match-duration");
        const matchDurVal = byId("stat-avg-match-duration-val");
        if (matchDurHolder)
          matchDurHolder.innerHTML =
            '<span class="stat-card-player-label" style="color:#64748b;">-</span>';
        if (matchDurVal)
          matchDurVal.innerHTML =
            '<div class="stat-hero-pill pill-gold">-</div>';
        const subLabel = byId("stat-avg-match-duration-subtitle");
        if (subLabel)
          subLabel.innerText = `Der Taktiker (min. ${minGamesForAvgMatch} Spiele)`;
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
          const targetDay = parseDayDate(dateStr);
          const dayMatches = (window.stats || []).filter((g) => {
            const gp = parseDayDate(g && g.d);
            return gp && targetDay && gp.num === targetDay.num;
          });
          if (dayMatches.length === 0) continue;

          const dayStats = window.calculateStatsLocally(
            dayMatches,
            window.spieler,
            dateStr.split("-").reverse().join("."),
          );
          const { dAll, dBefore } = getCareerContext(dateStr);

          const playerScores = Object.keys(dayStats.pData)
            .map((player) => {
              initPlayer(player);
              const d = dayStats.pData[player];
              if (!d || d.todayGames === 0) return { player, score: 0 };

              const dAllPlayer = dAll.pData ? dAll.pData[player] || d : d;
              const dBeforePlayer = dBefore.pData
                ? dBefore.pData[player] || { headToHead: {} }
                : { headToHead: {} };

              const score = computeDailyWinnerScore(
                d,
                dAllPlayer,
                dBeforePlayer,
              );
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
              .map((p, idx) => {
                const accents = ["#ffcc00", "#d1d5db", "#cd7f32"];
                const cardAccent = accents[idx] || "#64748b";
                const totalPodium = (p[1] || 0) + (p[2] || 0) + (p[3] || 0);
                const badgeLabel =
                  idx === 0
                    ? "👑 #1 · Tagessieger-König"
                    : idx === 1
                      ? "🥈 #2 · Tagessieger"
                      : idx === 2
                        ? "🥉 #3 · Tagessieger"
                        : `#${idx + 1} · Tagessieger`;
                return `
                <div class="stat-card-modern cinematic-entry" style="--card-accent: ${cardAccent}; margin-bottom:8px; animation-delay: ${1.27 + idx * 0.05}s;">
                  <div class="stat-card-main">
                    <div class="stat-card-badge-top" style="color:${cardAccent};">${badgeLabel}</div>
                    <div class="stat-card-holder-row">
                      <img src="${safeGetAvatarUrl(p.name)}" class="stat-card-avatar" style="border-color:${cardAccent};" onerror="this.style.display='none'">
                      <span class="stat-card-player-label">${p.name}</span>
                    </div>
                    <div class="stat-card-sublabel">${totalPodium}× auf dem Podium</div>
                  </div>
                  <div class="stat-metric-hero" style="flex-direction:column; gap:3px; align-items:flex-end;">
                    <div class="stat-hero-pill pill-gold">${p[1]}× 🥇</div>
                    <div style="font-size:10px; color:#94a3b8; font-weight:800; margin-top:2px;">
                      <span style="color:#d1d5db;" title="2. Plätze">🥈${p[2]}</span> · <span style="color:#cd7f32;" title="3. Plätze">🥉${p[3]}</span>
                    </div>
                  </div>
                </div>`;
              })
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
                const pNames = t.name.split(" & ");
                const avatarStack = pNames
                  .map(
                    (p, pi) =>
                      `<img src="${safeGetAvatarUrl(p)}" class="stat-card-avatar" onerror="this.style.display='none'" style="border-radius:8px; margin-left:${pi > 0 ? "-8px" : "0"}; z-index:${2 - pi};">`,
                  )
                  .join("");
                const medals = ["👑", "🥈", "🥉"];
                const duoRankLabel = medals[idx]
                  ? `${medals[idx]} #${idx + 1} · Bestes Team-Duo`
                  : `#${idx + 1} · Team-Duo`;
                return `
                <div class="stat-card-modern cinematic-entry" style="--card-accent: #30d158; margin-bottom:10px; animation-delay: ${1.1 + idx * 0.05}s;">
                  <div class="stat-card-main">
                    <div class="stat-card-badge-top">${duoRankLabel}</div>
                    <div class="stat-card-holder-row">
                      <div class="stat-avatar-stack">${avatarStack}</div>
                      <span class="stat-card-player-label">${t.name}</span>
                    </div>
                    <div class="stat-card-sublabel">${t.wins} Siege · ${t.games} Spiele als Team</div>
                  </div>
                  <div class="stat-metric-hero">
                    <div class="stat-hero-pill pill-green">${t.wr}%</div>
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
      const vollVal =
        topVollarbeiter.wr > 0 ? Math.round(topVollarbeiter.wr) + "%" : "-";
      const halbVal =
        topHalbeExperte.wr > 0 ? Math.round(topHalbeExperte.wr) + "%" : "-";
      spezEl.innerHTML = `
        <div class="stat-card-modern cinematic-entry" style="--card-accent: #ffcc00; animation-delay: 1.15s;">
          <div class="stat-card-main">
            <div class="stat-card-badge-top">🟡 Voll-Kugeln · Top-Siegrate</div>
            <div class="stat-card-holder-row">
              <img src="${safeGetAvatarUrl(topVollarbeiter.n)}" class="stat-card-avatar" onerror="this.style.display='none'" style="border:2px solid #ffcc00;">
              <span class="stat-card-player-label">${topVollarbeiter.n}</span>
            </div>
            <div class="stat-card-sublabel">Beste Winrate · Volle Kugeln</div>
          </div>
          <div class="stat-metric-hero">
            <div class="stat-hero-pill pill-gold">${vollVal}</div>
          </div>
        </div>
        <div class="stat-card-modern cinematic-entry" style="--card-accent: #4fc3f7; animation-delay: 1.2s;">
          <div class="stat-card-main">
            <div class="stat-card-badge-top">🔵 Halb-Kugeln · Top-Siegrate</div>
            <div class="stat-card-holder-row">
              <img src="${safeGetAvatarUrl(topHalbeExperte.n)}" class="stat-card-avatar" onerror="this.style.display='none'" style="border:2px solid #4fc3f7;">
              <span class="stat-card-player-label">${topHalbeExperte.n}</span>
            </div>
            <div class="stat-card-sublabel">Beste Winrate · Halbe Kugeln</div>
          </div>
          <div class="stat-metric-hero">
            <div class="stat-hero-pill pill-cyan">${halbVal}</div>
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
    const angstHolder = byId("stat-angst");
    const angstVal = byId("stat-angst-val");
    if (angstHolder) {
      if (maxWins > 0 && topMatchups.length > 0) {
        const renderedPairs = topMatchups
          .slice(0, 2)
          .map((pair) => {
            const parts = pair.split(" -> ");
            if (parts.length === 2) {
              const winner = parts[0];
              const loser = parts[1];
              return `<div style="display:inline-flex; align-items:center; gap:6px;">
                <img src="${safeGetAvatarUrl(winner)}" class="stat-card-avatar" alt="${winner}" onerror="this.style.display='none'">
                <span class="stat-card-player-label">${winner}</span>
                <span style="font-size:0.75rem; color:#94a3b8; font-weight:700;">⚔️</span>
                <img src="${safeGetAvatarUrl(loser)}" class="stat-card-avatar" alt="${loser}" onerror="this.style.display='none'">
                <span class="stat-card-player-label" style="color:#94a3b8;">${loser}</span>
              </div>`;
            }
            return `<span class="stat-card-player-label">${pair}</span>`;
          })
          .join(
            '<span style="color:#64748b; font-size:0.8rem; margin:0 6px;">&</span>',
          );

        angstHolder.innerHTML = renderedPairs;
        if (angstVal) {
          angstVal.innerHTML = `<div class="stat-hero-pill pill-red">${maxWins} <span class="unit">Siege</span></div>`;
        }
      } else {
        angstHolder.innerHTML =
          '<span class="stat-card-player-label" style="color:#64748b;">-</span>';
        if (angstVal) {
          angstVal.innerHTML = '<div class="stat-hero-pill pill-red">-</div>';
        }
      }
    }

    // --- ANSTOSS-STATISTIK ---
    const breakCountsEl = byId("stat-break-counts");
    if (breakCountsEl) {
      const breakCounts = labels
        .map((p) => {
          const d = res.pData[p];
          const count = filterToday
            ? d.todayBreakGames || 0
            : d.breakGames || 0;
          return { p, count };
        })
        .sort((a, b) => b.count - a.count);

      if (breakCounts.some((item) => item.count > 0)) {
        breakCountsEl.innerHTML = breakCounts
          .map((item, idx) => {
            const badgeLabel = idx === 0 ? "⚡ Anstoß-König" : `⚡ #${idx + 1}`;
            return `
                <div class="stat-card-modern cinematic-entry" style="--card-accent: #ffcc00; margin-bottom:8px; animation-delay: ${1.22 + idx * 0.05}s;">
                  <div class="stat-card-main">
                    <div class="stat-card-badge-top">${badgeLabel}</div>
                    <div class="stat-card-holder-row">
                      <img src="${safeGetAvatarUrl(item.p)}" class="stat-card-avatar" onerror="this.style.display='none'">
                      <span class="stat-card-player-label">${item.p}</span>
                    </div>
                    <div class="stat-card-sublabel">Meiste eigene Anstöße</div>
                  </div>
                  <div class="stat-metric-hero">
                    <div class="stat-hero-pill pill-gold">${item.count}×</div>
                  </div>
                </div>
            `;
          })
          .join("");
      } else {
        breakCountsEl.innerHTML =
          '<div style="text-align:center; color:#8e8e93; font-size:10px; padding-top: 5px;">Keine Anstoß-Daten vorhanden.</div>';
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

    const h2hEl = byId("stat-head-to-head");
    if (h2hEl) {
      h2hEl.innerHTML =
        dominantMatchups.length > 0
          ? dominantMatchups
              .map((m, idx) => {
                return `
                <div class="stat-card-modern span-2 cinematic-entry" style="--card-accent: #ffcc00; flex-direction:column; align-items:stretch; gap:8px; margin-bottom:10px; animation-delay: ${1.32 + idx * 0.05}s;">
                  <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <!-- Spieler 1 -->
                    <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:0;">
                      <img src="${safeGetAvatarUrl(m.p1)}" class="stat-card-avatar" onerror="this.style.display='none'" style="border:2px solid #ffcc00; border-radius:10px; width:32px; height:32px;">
                      <div style="min-width:0;">
                        <div class="stat-card-player-label" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.p1}</div>
                        <div class="stat-card-sublabel">${m.p1_wins}S · ${m.wr1}%</div>
                      </div>
                    </div>
                    <!-- VS-Badge & Partien -->
                    <div style="text-align:center; flex-shrink:0;">
                      <div class="h2h-vs-badge">VS</div>
                      <div class="stat-card-sublabel" style="margin-top:3px;">${m.games} Sp.</div>
                    </div>
                    <!-- Spieler 2 -->
                    <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:0; justify-content:flex-end; text-align:right;">
                      <div style="min-width:0;">
                        <div class="stat-card-player-label" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.p2}</div>
                        <div class="stat-card-sublabel">${m.p2_wins}S · ${m.wr2}%</div>
                      </div>
                      <img src="${safeGetAvatarUrl(m.p2)}" class="stat-card-avatar" onerror="this.style.display='none'" style="border:2px solid #4fc3f7; border-radius:10px; width:32px; height:32px;">
                    </div>
                  </div>
                  <!-- Progress-Bar -->
                  <div style="height:6px; background:rgba(79,195,247,0.25); border-radius:4px; overflow:hidden;">
                    <div style="height:100%; width:${m.wr1}%; background:linear-gradient(90deg,#ffcc00,#ff9500); border-radius:4px; transition:width 0.6s ease;"></div>
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
    );

    if (maxStreak > 0) {
      const topStreak = labels
        .filter((p) => (res.pData[p].maxStreak || 0) === maxStreak)
        .sort(
          (a, b) =>
            (res.pData[b].games || 0) - (res.pData[a].games || 0) ||
            a.localeCompare(b, "de"),
        );

      if (byId("stat-streak")) byId("stat-streak").innerText = `${maxStreak}x`;
      const streakCard = byId("stat-rec-streak-card");
      if (streakCard) {
        const holder = streakCard.querySelector(".rec-holder");
        if (holder) {
          holder.innerHTML = topStreak
            .map(
              (p) =>
                `<img src="${safeGetAvatarUrl(p)}" class="rec-avatar" onerror="this.style.display='none'"><span class="rec-name">${p}</span>`,
            )
            .join(" ");
        }
      }
    } else {
      if (byId("stat-streak")) byId("stat-streak").innerText = "-";
    }

    if (typeof window.updateInteractiveH2H === "function") {
      window.updateInteractiveH2H();
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
          eloHistoryContainer.style.display = "flex";
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

    // Alias für Kompatibilität mit index.html (nur setzen falls noch nicht in elo-calc.js definiert)
    if (typeof window.processAllStatsChronologically !== "function") {
      window.processAllStatsChronologically = function (
        matches,
        players,
        todayStr,
      ) {
        // Nutzt die vorhandene computeEloRatings Logik für ELO und processData für Stats
        const elo =
          typeof window.computeEloRatings === "function"
            ? window.computeEloRatings(matches)
            : {};
        const base =
          typeof window.processData === "function"
            ? window.processData(matches, todayStr)
            : { pData: {}, aggregates: {} };
        return {
          pData: base.pData,
          matchDeltas: {},
          aggregates: base.aggregates,
          blackWins: base.blackWins || 0,
          breakWins: base.breakWins || 0,
        };
      };
    }

    // --- ELO Rangliste + Erklärung (Gesamt & Session) ---
    function renderEloRanking(pData, show = true, isToday = false) {
      const el = byId("eloRanking") || document.getElementById("eloRanking");
      if (!el) return;
      if (!show) {
        el.innerHTML = "";
        return;
      }

      const rows = Object.keys(pData || {})
        .map((name) => {
          const d = pData[name] || {};
          const careerD =
            (window.careerStats &&
              window.careerStats.pData &&
              window.careerStats.pData[name]) ||
            {};
          const eloVal =
            typeof d.elo === "number"
              ? d.elo
              : typeof careerD.elo === "number"
                ? careerD.elo
                : 1000;
          const totalGames =
            typeof d.eloGames === "number"
              ? d.eloGames
              : typeof d.games === "number"
                ? d.games
                : careerD.games || 0;
          const sessionGames =
            typeof d.todayGames === "number" ? d.todayGames : 0;
          const sessionDelta =
            typeof d.sessionEloGain === "number"
              ? d.sessionEloGain
              : (window.careerStats &&
                  window.careerStats.aggregates &&
                  window.careerStats.aggregates.sessionEloGains &&
                  window.careerStats.aggregates.sessionEloGains[name]) ||
                0;

          return {
            name,
            elo: eloVal,
            games: isToday ? sessionGames : totalGames,
            totalGames,
            sessionGames,
            sessionDelta,
            streak: d.currentStreak || careerD.currentStreak || 0,
            loseStreak: d.loseStreak || careerD.loseStreak || 0,
          };
        })
        .filter((r) => (isToday ? r.sessionGames > 0 : r.games > 0));

      // nur Spieler aus spieler.json anzeigen
      if (configuredPlayers && configuredPlayers.size > 0) {
        for (let i = rows.length - 1; i >= 0; i--) {
          if (!configuredPlayers.has(String(rows[i].name || "").trim()))
            rows.splice(i, 1);
        }
      }

      // Wenn in der Session noch keine Spiele sind, zeige alle konfigurierten Spieler mit aktuellem ELO
      if (rows.length === 0 && isToday) {
        (window.spieler || ["Daniel", "Thorsten", "Peter"]).forEach((name) => {
          const careerD =
            (window.careerStats &&
              window.careerStats.pData &&
              window.careerStats.pData[name]) ||
            {};
          rows.push({
            name,
            elo: typeof careerD.elo === "number" ? careerD.elo : 1000,
            games: 0,
            totalGames: careerD.games || 0,
            sessionGames: 0,
            sessionDelta: 0,
            streak: careerD.currentStreak || 0,
            loseStreak: careerD.loseStreak || 0,
          });
        });
      }

      if (rows.length === 0) {
        el.innerHTML = "";
        return;
      }
      rows.sort((a, b) => b.elo - a.elo || a.name.localeCompare(b.name, "de"));

      const medal = (i) =>
        i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";

      const titleText = isToday ? "Session ELO-Klassement" : "ELO-Rangliste";
      const subtitleText = isToday
        ? "Aktuelle ELO-Werte und Punktebilanz dieser Session."
        : 'Start bei <b style="color:#fff;">1000</b>. Sieg gegen starke Gegner bringt <b style="color:#34c759;">mehr</b> Punkte, Niederlagen kosten Punkte.';

      let html = `
            <div style="margin-top:2px; animation: ach-card-enter 0.4s ease-out forwards; opacity: 0; animation-delay: 0.4s;">
              <div style="color:#ffcc00; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:1px;">${titleText}</div>
              <div style="margin-top:6px; font-size:10px; line-height:1.4; color:#8e8e93;">${subtitleText}</div>
              <div style="height:2px; width:24px; background:#ffcc00; margin-top:6px; border-radius:2px;"></div>
            </div>
            <div style="margin-top:10px;">
          `;

      rows.forEach((r, i) => {
        const badge = medal(i);
        const isFirst = i === 0;
        const rankLabel = badge
          ? `${badge} #${i + 1} · ELO-Rangliste`
          : `${i + 1}. · ELO-Rangliste`;
        const streakClass =
          r.streak >= 1
            ? "streak-fire"
            : r.loseStreak >= 3
              ? "streak-frost"
              : "";
        const streakBadge =
          r.streak >= 1
            ? ` <span style="display:inline-flex;align-items:center;gap:2px;color:#ffcc00;font-size:11px;font-weight:900;animation:streak-pulse 1.5s infinite ease-in-out;vertical-align:middle;">🔥${r.streak}</span>`
            : "";

        const matchesSubtitle = isToday
          ? `${r.sessionGames} Spiele heute`
          : `${r.games} Matches gespielt`;

        let deltaHtml = "";
        if (isToday && r.sessionGames > 0) {
          const deltaSign =
            r.sessionDelta > 0
              ? `+${Math.round(r.sessionDelta)}`
              : r.sessionDelta < 0
                ? `${Math.round(r.sessionDelta)}`
                : "±0";
          const deltaColor =
            r.sessionDelta > 0
              ? "#30d158"
              : r.sessionDelta < 0
                ? "#ff453a"
                : "#8e8e93";
          deltaHtml = `<div style="font-size:9px; font-weight:700; color:${deltaColor}; margin-top:2px;">${deltaSign} heute</div>`;
        }

        const pillClass = isFirst ? "pill-green" : "pill-gold";
        const cardAccent = isFirst ? "#30d158" : "#ffcc00";

        html += `
              <div onclick="window.openPlayerProfile('${r.name}')" class="stat-card-modern cinematic-entry ${isFirst ? "rank-1-card" : ""}" style="--card-accent: ${cardAccent}; margin-bottom:10px; cursor:pointer; animation-delay: ${0.5 + i * 0.05}s;">
                <div class="stat-card-main">
                  <div class="stat-card-badge-top">${rankLabel}</div>
                  <div class="stat-card-holder-row">
                    <div class="avatar-frame ${streakClass}">
                      <img src="${safeGetAvatarUrl(r.name)}" onerror="this.style.display='none'" class="stat-card-avatar" style="border-radius:10px; width:30px; height:30px;">
                    </div>
                    <span class="stat-card-player-label" style="color:${getPlayerColor(r.name)};">${r.name}${streakBadge}</span>
                  </div>
                  <div class="stat-card-sublabel">${matchesSubtitle}</div>
                </div>
                <div class="stat-metric-hero">
                  <div class="stat-hero-pill ${pillClass}" id="rank-elo-${i}" style="font-size:1.1rem;">—</div>
                  ${deltaHtml}
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

    // --- 🔥 Formanzeige / Trending Player (Session & Gesamt) ---
    function renderTrendingPlayers(allStats, show = true, isToday = false) {
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

      // In Session: alle Spiele der Session; in Gesamt: letzte 10 Spiele
      const N = isToday ? Math.max(1, (allStats || []).length) : 10;

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
        if (headEl) headEl.innerHTML = "";
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
        if (
          isToday &&
          window.careerStats &&
          window.careerStats.aggregates &&
          window.careerStats.aggregates.sessionEloGains &&
          typeof window.careerStats.aggregates.sessionEloGains[p] === "number"
        ) {
          rec[p].eloDelta = Math.round(
            window.careerStats.aggregates.sessionEloGains[p],
          );
        } else {
          rec[p].eloDelta =
            (rec[p].eloAfter || 1000) - (rec[p].eloBefore || 1000);
        }
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
        if (headEl) headEl.innerHTML = "";
        return;
      }

      const deltaStyle = (d) =>
        d > 0
          ? "color:#34c759;"
          : d < 0
            ? "color:rgba(255,69,58,0.85);"
            : "color:#8e8e93;";
      const deltaSign = (d) => (d > 0 ? `+${d}` : `${d}`);

      const headerTitle = isToday ? "🔥 Session-Form" : "🔥 Formanzeige";
      const headerSubtitle = isToday
        ? `Formkurve & Performance der heutigen Session (${ordered.length} Spiele): ELO-Änderung + aktuelle Serie.`
        : `Trending aus den letzten ${Math.min(N, ordered.length)} Spielen: ELO-Änderung + aktuelle Siegserie.`;

      if (headEl) {
        headEl.innerHTML = `
            <div style="margin-top:14px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.06);">
              <div style="color:#ffcc00; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:1px;">${headerTitle}</div>
              <div style="margin-top:6px; font-size:10px; line-height:1.4; color:#8e8e93;">${headerSubtitle}</div>
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
        const labelGames = isToday
          ? `Session: ${r.w}S · ${r.l}N · ${r.wr}%`
          : `Letzte ${r.g}: ${r.w}S · ${r.l}N · ${r.wr}%`;

        const streakPart =
          r.streak >= 1
            ? ` · 🔥${r.streak} Serie`
            : r.loseStreak >= 3
              ? ` · ❄️${r.loseStreak} Losing`
              : "";
        const rankEmoji =
          i === 0 ? "🏆" : i === 1 ? "✨" : i === 2 ? "📈" : i + 1 + ".";
        const badgeLabel = `${rankEmoji} #${i + 1} Form${streakPart}`;

        const pillClass =
          r.eloDelta > 0
            ? "pill-green"
            : r.eloDelta < 0
              ? "pill-red"
              : "pill-gold";
        const cardAccent = isTopForm
          ? "#30d158"
          : r.eloDelta < 0
            ? "#ff453a"
            : "#ffcc00";
        const deltaSign = r.eloDelta > 0 ? `+${r.eloDelta}` : `${r.eloDelta}`;

        listHtml += `
              <div onclick="window.openPlayerProfile('${r.name}')" class="stat-card-modern cinematic-entry" style="--card-accent: ${cardAccent}; margin-bottom:10px; cursor:pointer; animation-delay: ${0.5 + i * 0.05}s;">
                <div class="stat-card-main">
                  <div class="stat-card-badge-top">${badgeLabel}</div>
                  <div class="stat-card-holder-row">
                    <div class="avatar-frame ${streakClass}">
                      <img src="${safeGetAvatarUrl(r.name)}" onerror="this.style.display='none'" class="stat-card-avatar" style="border-radius:10px; width:30px; height:30px;">
                    </div>
                    <span class="stat-card-player-label" style="color:${getPlayerColor(r.name)};">${r.name}</span>
                  </div>
                  <div class="stat-card-sublabel">${labelGames}</div>
                </div>
                <div class="stat-metric-hero">
                  <div class="stat-hero-pill ${pillClass}" style="font-size:1.1rem;">${deltaSign}</div>
                  <div style="font-size:9px; color:#64748b; font-weight:700; margin-top:2px; text-align:center;">ELO Δ</div>
                </div>
              </div>
            `;
      });

      listHtml += `</div>`;
      el.innerHTML = listHtml;
    }

    // --- 🔥 Formkurve & Streak-Tracker (Letzte 5 Spiele) ---
    function renderFormCurve(playerList, pData) {
      const container =
        byId("formCurveContainer") ||
        document.getElementById("formCurveContainer");
      const card =
        byId("formCurveCard") || document.getElementById("formCurveCard");
      if (!container) return;
      if (card) card.style.display = "flex";

      const activePlayers =
        Array.isArray(playerList) && playerList.length > 0
          ? playerList
          : Object.keys(pData || {});

      if (activePlayers.length === 0) {
        container.innerHTML =
          '<div style="color:#94a3b8; font-size:12px; text-align:center; padding:10px;">Keine Spieldaten vorhanden</div>';
        return;
      }

      // Alle Matches chronologisch absteigend (neueste zuerst)
      const allMatches = (window.stats || []).slice().reverse();

      const cardsHtml = activePlayers
        .map((name) => {
          // Letzte 5 Spiele sammeln
          const recent = [];
          for (const m of allMatches) {
            if (recent.length >= 5) break;
            const isP1 =
              m.p1 === name ||
              (typeof m.p1 === "string" && m.p1.split(" & ").includes(name));
            const isP2 =
              m.p2 === name ||
              (typeof m.p2 === "string" && m.p2.split(" & ").includes(name));
            if (!isP1 && !isP2) continue;
            const won = (isP1 && m.w == 1) || (isP2 && m.w == 2);
            const opp = isP1 ? m.p2 : m.p1;
            recent.push({
              won,
              date: m.d || "",
              opp: opp || "Gegner",
              winType: m.t || "Regulär",
            });
          }

          // Streak berechnen: aufeinanderfolgende Resultate vom neuesten Match
          let streakType = "neutral";
          let streakText = "⚖️ Ausgeglichen";
          if (recent.length > 0) {
            const firstWon = recent[0].won;
            let count = 0;
            for (const g of recent) {
              if (g.won === firstWon) count++;
              else break;
            }
            if (firstWon) {
              if (count >= 3) {
                streakType = "hot";
                streakText = `🔥 ${count}er Win-Streak`;
              } else {
                streakType = "mild";
                streakText = `⚡ ${count} Siege in Folge`;
              }
            } else {
              if (count >= 2) {
                streakType = "cold";
                streakText = `❄️ ${count} Niederlagen`;
              } else {
                streakType = "neutral";
                streakText = `📉 Zuletzt verloren`;
              }
            }
          }

          // Siege in den letzten 5
          const winsCount = recent.filter((r) => r.won).length;
          const totalRecent = recent.length;
          const winPercent =
            totalRecent > 0 ? Math.round((winsCount / totalRecent) * 100) : 0;

          // Pills: chronologisch von links nach rechts (ältestes links, neuestes rechts)
          const pillsRecent = recent.slice().reverse();
          let pillsHtml = "";
          for (let i = 0; i < 5; i++) {
            if (i < pillsRecent.length) {
              const item = pillsRecent[i];
              const cls = item.won ? "win" : "loss";
              const letter = item.won ? "S" : "N";
              const tip = `${item.won ? "Sieg" : "Niederlage"} gegen ${item.opp} (${item.date})`;
              pillsHtml += `<div class="form-pill ${cls}" onclick="window.showAppToast('${tip.replace(/'/g, "\\'")}')" title="${tip}">${letter}</div>`;
            } else {
              pillsHtml += `<div class="form-pill empty" title="Noch kein 5. Spiel">-</div>`;
            }
          }

          const avatarUrl = safeGetAvatarUrl(name);

          return `
          <div class="form-player-card">
            <div class="form-player-info">
              <img src="${avatarUrl}" alt="${name}" class="form-avatar" onerror="this.src='logo.png'" />
              <div>
                <div class="form-name">${name}</div>
                <span class="form-streak-badge streak-${streakType}">${streakText}</span>
              </div>
            </div>
            <div class="form-pills">
              ${pillsHtml}
            </div>
            <div class="form-rate">
              ${winPercent}%
              <div style="font-size:10px; font-weight:700; color:#94a3b8;">${winsCount}/${totalRecent}</div>
            </div>
          </div>
        `;
        })
        .join("");

      container.innerHTML = cardsHtml;
    }

    const eloCard =
      byId("eloTrendCard") || document.getElementById("eloTrendCard");
    if (eloCard) eloCard.style.display = "block";

    if (eloHistoryContainer) {
      eloHistoryContainer.style.display = !filterToday ? "flex" : "none";
    }

    renderEloRanking(res.pData, true, filterToday);
    renderTrendingPlayers(currentStats, true, filterToday);
    renderFormCurve(window.spieler, res.pData);
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
    const dailyWinsResetEl = document.getElementById("stat-daily-wins");
    if (dailyWinsResetEl) dailyWinsResetEl.innerHTML = "";
    setText("stat-mauer", "-");
    setText("stat-longest-match", "-");
    setText("stat-avg-win-duration", "-");
    setText("stat-avg-match-duration", "-");

    [
      "stat-killer-val",
      "stat-regular-wins-val",
      "stat-clutch-val",
      "stat-mauer-val",
      "stat-pechvogel-val",
      "stat-lost-by-8error-val",
      "stat-nutzniesser-val",
      "stat-vampire-val",
      "stat-foul8-wins-val",
      "stat-service-thief-val",
      "stat-avg-win-duration-val",
      "stat-avg-match-duration-val",
      "stat-top-voll-val",
      "stat-top-halb-val",
      "stat-angst-val",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<div class="stat-hero-pill">-</div>';
    });

    const ballBarEl = document.getElementById("stat-balls-bar-voll");
    if (ballBarEl) ballBarEl.style.width = "50%";
    const breakAdvVal = document.getElementById("stat-break-adv-val");
    if (breakAdvVal)
      breakAdvVal.innerHTML =
        '<div class="stat-hero-pill pill-green"><span id="stat-break-adv">0%</span></div>';
    const blackVal = document.getElementById("stat-black-val");
    if (blackVal)
      blackVal.innerHTML =
        '<div class="stat-hero-pill pill-red"><span id="stat-black">0%</span></div>';

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
    const h2hResetEl = document.getElementById("stat-head-to-head");
    if (h2hResetEl) h2hResetEl.innerHTML = "";
    const duoResetEl = document.getElementById("stat-duo-ranking");
    if (duoResetEl) duoResetEl.innerHTML = "";
    const spezResetEl = document.getElementById("stat-ball-spez");
    if (spezResetEl) spezResetEl.innerHTML = "";

    const eloEl = document.getElementById("eloRanking");
    if (eloEl) eloEl.innerHTML = "";
    const trendEl = document.getElementById("trendPlayers");
    if (trendEl) trendEl.innerHTML = "";

    const eloTrendCard = document.getElementById("eloTrendCard");
    if (eloTrendCard) eloTrendCard.style.display = "none";
    const eloHistoryContainer = document.getElementById("eloHistoryContainer");
    if (eloHistoryContainer) eloHistoryContainer.style.display = "none";
    const formCurveContainer = document.getElementById("formCurveContainer");
    if (formCurveContainer) formCurveContainer.innerHTML = "";
    const formCurveCard = document.getElementById("formCurveCard");
    if (formCurveCard) formCurveCard.style.display = "none";

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
      canvas.height = h;
    }
  }

  if (typeof window.setStatSubTab === "function") {
    window.setStatSubTab(window.currentStatSubTab || "ranking");
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

window.renderHistory = function renderHistory(statsToRender) {
  const container = document.getElementById("history-list");
  const list = statsToRender || window.stats;

  // Nutze bereits berechnete Daten statt Neu-Berechnung
  const processed = window.careerStats || { matchDeltas: {} };
  const deltas = processed.matchDeltas || {};

  const counter = document.getElementById("match-counter");
  if (counter) counter.innerText = "Matches: " + list.length;

  const getAv = (pName, isWinner = false, size = 32) => {
    if (!pName) return "";
    const names = pName.split(" & ").map((s) => s.trim());
    return names
      .map((n, pIdx) => {
        const src = safeGetAvatarUrl
          ? safeGetAvatarUrl(n)
          : `avatars/${n}.webp`;
        const margin = pIdx === names.length - 1 ? "0" : "-10px";
        return `<img loading="lazy" src="${src}" class="match-avatar-chip" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex'" style="width:${size}px; height:${size}px; margin-right:${margin}; position:relative; z-index:${names.length - pIdx};">
                <div class="match-avatar-chip" style="display:none; width:${size}px; height:${size}px; background:#1e293b; align-items:center; justify-content:center; font-size:${Math.round(size * 0.55)}px; margin-right:${margin}; position:relative; z-index:${names.length - pIdx};">👤</div>`;
      })
      .join("");
  };

  const sortedList = list.slice().reverse();

  if (sortedList.length === 0) {
    container.innerHTML =
      '<div style="text-align:center;color:#8e8e93;padding:40px;">Keine Spiele vorhanden.</div>';
    return;
  }

  // Tageszähler vorab berechnen
  const dateCounts = {};
  sortedList.forEach((g) => {
    const d = (g.d || "").split(", ")[0];
    if (d) dateCounts[d] = (dateCounts[d] || 0) + 1;
  });

  let html = "";
  let lastDate = "";

  sortedList.forEach((g, idx) => {
    const i = window.stats.indexOf(g);
    const dateParts = (g.d || "").split(", ");
    const date = dateParts[0];
    const time = dateParts[1] || "";

    if (date !== lastDate) {
      const count = dateCounts[date] || 1;
      html += `
        <div class="history-date-header" style="animation: tip-fade 0.5s ease-out forwards; animation-delay: ${idx * 0.03}s">
          <div class="history-date-title">
            <span>📅 ${date}</span>
          </div>
          <div class="history-date-count">${count} ${count === 1 ? "Match" : "Matches"}</div>
        </div>`;
      lastDate = date;
    }

    const isWin1 = g.w == 1;
    const isWin2 = g.w == 2;
    const dData = deltas[i] || { eloDelta: 0 };
    const delta = typeof dData === "object" ? dData.eloDelta || 0 : dData;
    const hasBreak1 = g.a === g.p1;
    const hasBreak2 = g.a === g.p2;

    const winTypeStr = String(g.t || "").trim();
    const isRegular =
      !winTypeStr ||
      winTypeStr.includes("Regulär") ||
      winTypeStr.includes("gelocht") ||
      winTypeStr.toLowerCase().includes("normal");
    const isNonRegular = !isRegular;
    const cardAccent = isNonRegular ? "#ff9500" : "#30d158";
    const winnerName = isWin1 ? g.p1 : g.p2;

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

    const ballBadge1 = g.bt1
      ? g.bt1 === "Voll"
        ? "🟡 Volle"
        : "🔵 Halbe"
      : "";
    const ballBadge2 = g.bt2
      ? g.bt2 === "Voll"
        ? "🟡 Volle"
        : "🔵 Halbe"
      : "";

    const sub1Parts = [];
    if (ballBadge1) sub1Parts.push(`<span>${ballBadge1}</span>`);
    if (hasBreak1)
      sub1Parts.push(`<span style="color:#ffcc00;">⚡ Anstoß</span>`);
    if (!isWin1 && typeof g.l !== "undefined")
      sub1Parts.push(`<span>Rest: ${g.l}</span>`);

    const sub2Parts = [];
    if (!isWin2 && typeof g.l !== "undefined")
      sub2Parts.push(`<span>Rest: ${g.l}</span>`);
    if (hasBreak2)
      sub2Parts.push(`<span style="color:#ffcc00;">⚡ Anstoß</span>`);
    if (ballBadge2) sub2Parts.push(`<span>${ballBadge2}</span>`);

    const cleanWinType = winTypeStr.replace(/^Gegner-Fehler:\s*/i, "");
    const modeWinText = isNonRegular
      ? `<span style="color:#ff9500; font-weight:800;">⚠️ ${cleanWinType || "Gegner-Fehler"}</span>`
      : `${g.m || "1:1"} · ${winTypeStr || "Regulärer Sieg"}`;
    const calloutReason = isNonRegular
      ? ` (${cleanWinType || "Gegner-Fehler"})`
      : "";

    html += `
      <div onclick="window.openMatchDetails(${i})" class="match-card-modern cinematic-entry ${isNonRegular ? "non-regular" : ""}" style="--card-accent: ${cardAccent}; animation-delay: ${idx * 0.03}s;">
          <div class="match-card-header">
              <div class="match-card-header-left">
                  <span class="match-num-tag">${time ? `${time} Uhr` : `Match #${idx + 1}`}</span>
                  <span>•</span>
                  <span class="match-duration-tag">⏱️ ${durationDisplay}</span>
              </div>
              <div>${modeWinText}</div>
          </div>
          <div class="match-duel-arena">
              <div class="match-team ${isWin1 ? "winner" : "loser"}">
                  <div style="display:flex; flex-shrink:0;">${getAv(g.p1, isWin1, 32)}</div>
                  <div style="min-width:0; overflow:hidden;">
                      <div class="match-player-name">${g.p1} ${isWin1 ? "👑" : ""}</div>
                      <div class="match-team-sub">${sub1Parts.join(" <span>•</span> ")}</div>
                  </div>
              </div>
              <div class="match-vs-badge">VS</div>
              <div class="match-team right ${isWin2 ? "winner" : "loser"}">
                  <div style="min-width:0; overflow:hidden;">
                      <div class="match-player-name">${isWin2 ? "👑 " : ""}${g.p2}</div>
                      <div class="match-team-sub">${sub2Parts.join(" <span>•</span> ")}</div>
                  </div>
                  <div style="display:flex; flex-shrink:0;">${getAv(g.p2, isWin2, 32)}</div>
              </div>
          </div>
          <div class="match-card-footer">
              <div style="display:flex; align-items:center; gap:8px;">
                  <div class="match-winner-callout">
                      <span>🏆 Sieger: ${winnerName}${calloutReason}</span>
                  </div>
                  <div class="match-elo-pill">${delta > 0 ? "+" : ""}${delta} ELO</div>
              </div>
              <div class="history-actions">
                  <button class="history-btn-action" onclick="event.stopPropagation(); window.openEditMatchModal(${i})">✏️ Bearbeiten</button>
                  <button class="history-btn-action del" onclick="event.stopPropagation(); window.requestDelete(${i})">🗑️ Löschen</button>
              </div>
          </div>
      </div>`;
  });

  container.innerHTML = html;
};

window.activeAchListFilter = "all";
window.achListSearchQuery = "";
window.filterAchListSearch = (query) => {
  window.achListSearchQuery = String(query || "")
    .trim()
    .toLowerCase();
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

/* ==========================================================================
   Dashboard Sub-Tabs & Interactive H2H Logic
   ========================================================================== */
window.currentStatSubTab = "ranking";

window.setStatSubTab = function (tabName, btnEl) {
  window.currentStatSubTab = tabName;
  document.querySelectorAll(".stat-subtab-btn").forEach((btn) => {
    if (btn.getAttribute("data-tab") === tabName) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  const contentIds = {
    ranking: "stat-subtab-ranking",
    duelle: "stat-subtab-duelle",
    records: "stat-subtab-records",
    balls: "stat-subtab-balls",
  };

  for (const key in contentIds) {
    const el = document.getElementById(contentIds[key]);
    if (el) {
      if (key === tabName) {
        el.classList.add("active");
        // Sicherstellen, dass alle Karten und Elemente sichtbar sind (verhindert hängende opacity: 0)
        el.querySelectorAll(
          ".cinematic-entry, .card-modern, .card, [style*='opacity']",
        ).forEach((child) => {
          child.style.opacity = "1";
          child.style.transform = "none";
          child.style.visibility = "visible";
        });
      } else {
        el.classList.remove("active");
      }
    }
  }

  if (
    tabName === "duelle" &&
    typeof window.updateInteractiveH2H === "function"
  ) {
    window.updateInteractiveH2H();
  }

  if (tabName === "ranking") {
    const winCanvas = document.getElementById("winChart");
    if (
      winCanvas &&
      winCanvas.__myWinChart &&
      typeof winCanvas.__myWinChart.resize === "function"
    ) {
      winCanvas.__myWinChart.resize();
    }
    const eloCanvas = document.getElementById("eloHistoryChart");
    if (
      eloCanvas &&
      eloCanvas.__myEloChart &&
      typeof eloCanvas.__myEloChart.resize === "function"
    ) {
      eloCanvas.__myEloChart.resize();
    }
  }
};

window.updateInteractiveH2H = function () {
  const p1Sel = document.getElementById("h2h-player-1-select");
  const p2Sel = document.getElementById("h2h-player-2-select");
  const outputEl = document.getElementById("h2h-interactive-output");
  if (!p1Sel || !p2Sel || !outputEl) return;

  const spieler =
    window.spieler && window.spieler.length >= 2
      ? window.spieler
      : ["Daniel", "Thorsten", "Peter"];

  if (p1Sel.options.length < spieler.length) {
    const prev1 = p1Sel.value;
    p1Sel.innerHTML = spieler
      .map((p) => `<option value="${p}">${p}</option>`)
      .join("");
    p1Sel.value = prev1 && spieler.includes(prev1) ? prev1 : spieler[0];
  }
  if (p2Sel.options.length < spieler.length) {
    const prev2 = p2Sel.value;
    p2Sel.innerHTML = spieler
      .map((p) => `<option value="${p}">${p}</option>`)
      .join("");
    p2Sel.value =
      prev2 && spieler.includes(prev2) && prev2 !== p1Sel.value
        ? prev2
        : spieler.find((s) => s !== p1Sel.value) || spieler[1] || spieler[0];
  }

  let p1 = p1Sel.value;
  let p2 = p2Sel.value;
  if (p1 === p2) {
    const other = spieler.find((s) => s !== p1);
    if (other) {
      p2 = other;
      p2Sel.value = other;
    }
  }

  const scope = window.currentStatScope || {};
  const isSession = scope.filterToday || window.viewId === "heute";

  // Scope-bezogene Spieleliste ermitteln
  let matches = [];
  if (isSession) {
    matches =
      scope.statsToday ||
      (typeof window.getTodayStats === "function"
        ? window.getTodayStats()
        : []);
  } else if (scope.isFiltered) {
    matches =
      scope.currentStats ||
      (typeof window.getFilteredStats === "function"
        ? window.getFilteredStats()
        : window.stats || []);
  } else {
    matches = scope.currentStats || window.stats || [];
  }

  const totalMatchesInScope = matches.length;

  const safeAvatar = (name) =>
    typeof window.safeGetAvatarUrl === "function"
      ? window.safeGetAvatarUrl(name)
      : `avatars/${name}.webp`;

  const getE = (p) =>
    (window.careerStats &&
      window.careerStats.pData &&
      window.careerStats.pData[p] &&
      window.careerStats.pData[p].elo) ||
    (scope.res &&
      scope.res.pData &&
      scope.res.pData[p] &&
      scope.res.pData[p].elo) ||
    1200;
  const elo1 = getE(p1);
  const elo2 = getE(p2);

  // Fall 1: In der Session oder im Filter gibt es überhaupt noch keine Spiele
  if (totalMatchesInScope === 0) {
    outputEl.innerHTML = `
      <div class="h2h-radar-card" style="text-align:center; padding: 25px 12px; color: #8e8e93;">
        <div style="font-size: 28px; margin-bottom: 6px;">🎱</div>
        <div style="font-size: 13px; font-weight: 800; color: #fff;">${isSession ? "Noch keine Spiele in dieser Session" : "Keine Spiele im gewählten Zeitraum"}</div>
        <div style="font-size: 10px; margin-top: 4px; opacity: 0.7;">Sobald 1:1-Matches vorliegen, erscheint hier der direkte Vergleich.</div>
      </div>
    `;
    return;
  }

  // Direkte 1:1 Duelle zwischen p1 und p2 im aktuellen Scope filtern
  const duels = matches.filter(
    (g) =>
      g &&
      g.m === "1:1" &&
      ((g.p1 === p1 && g.p2 === p2) || (g.p1 === p2 && g.p2 === p1)) &&
      g.w,
  );

  const duelLabel = isSession
    ? "Duelle (Heute)"
    : scope.isFiltered
      ? "Duelle (Filter)"
      : "Duelle (Gesamt)";

  const eloLabel = isSession ? "Session-Delta" : "ELO-Saldo";

  // Fall 2: Spiele sind da, aber p1 und p2 haben in diesem Scope noch nicht gegeneinander gespielt
  if (duels.length === 0) {
    outputEl.innerHTML = `
      <div class="h2h-radar-card">
        <div class="h2h-fighters-row">
          <div class="h2h-fighter">
            <img src="${safeAvatar(p1)}" class="h2h-fighter-avatar" onerror="this.style.display='none'">
            <div>
              <div class="h2h-fighter-name">${p1}</div>
              <div class="h2h-fighter-elo">${Math.round(elo1)} ELO</div>
            </div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 1.4rem; font-weight: 900; color: #fff; letter-spacing: 1px;">0 : 0</div>
            <div style="font-size: 0.72rem; font-weight: 700; color: #94a3b8;">${isSession ? "Heute noch kein Duell" : "Kein direktes Duell im Zeitraum"}</div>
          </div>
          <div class="h2h-fighter right">
            <img src="${safeAvatar(p2)}" class="h2h-fighter-avatar" onerror="this.style.display='none'">
            <div style="text-align: right;">
              <div class="h2h-fighter-name">${p2}</div>
              <div class="h2h-fighter-elo">${Math.round(elo2)} ELO</div>
            </div>
          </div>
        </div>
        <div class="h2h-bar-wrap">
          <div class="h2h-bar-labels">
            <span style="color: #30d158;">${p1} (50%)</span>
            <span style="color: #ff453a;">${p2} (50%)</span>
          </div>
          <div class="h2h-bar-bg">
            <div class="h2h-bar-fill-left" style="width: 50%;"></div>
          </div>
        </div>
        <div class="h2h-insights-grid">
          <div class="h2h-insight-box">
            <div class="h2h-insight-title">${duelLabel}</div>
            <div class="h2h-insight-val">0</div>
          </div>
          <div class="h2h-insight-box">
            <div class="h2h-insight-title">Siegquote</div>
            <div class="h2h-insight-val">-</div>
          </div>
          <div class="h2h-insight-box">
            <div class="h2h-insight-title">${eloLabel}</div>
            <div class="h2h-insight-val">-</div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // Fall 3: Duelle sind im aktuellen Scope vorhanden
  let p1Wins = 0;
  let p2Wins = 0;
  let p1VollWins = 0,
    p1HalbWins = 0;
  let p2VollWins = 0,
    p2HalbWins = 0;
  let p1BreakGames = 0,
    p1BreakWins = 0;
  let p2BreakGames = 0,
    p2BreakWins = 0;
  let regWinsCount = 0;
  let p1LossesRest = [],
    p2LossesRest = [];
  let durations = [];

  duels.forEach((g) => {
    const isP1Winner = (g.w === 1 && g.p1 === p1) || (g.w === 2 && g.p2 === p1);
    const isP2Winner = (g.w === 1 && g.p1 === p2) || (g.w === 2 && g.p2 === p2);
    const winBall = g.w === 1 ? g.bt1 : g.bt2;

    if (isP1Winner) {
      p1Wins++;
      if (winBall === "Voll") p1VollWins++;
      if (winBall === "Halb") p1HalbWins++;
      p2LossesRest.push(typeof g.l === "number" ? g.l : 0);
    } else if (isP2Winner) {
      p2Wins++;
      if (winBall === "Voll") p2VollWins++;
      if (winBall === "Halb") p2HalbWins++;
      p1LossesRest.push(typeof g.l === "number" ? g.l : 0);
    }

    if (g.a === p1) {
      p1BreakGames++;
      if (isP1Winner) p1BreakWins++;
    } else if (g.a === p2) {
      p2BreakGames++;
      if (isP2Winner) p2BreakWins++;
    }

    if (g.t && (g.t.includes("Regulär") || g.t.includes("gelocht"))) {
      regWinsCount++;
    }

    if (typeof g.dur === "number" && g.dur > 0) {
      durations.push(g.dur);
    }
  });

  const total = p1Wins + p2Wins;
  const p1Rate = total > 0 ? Math.round((p1Wins / total) * 100) : 50;
  const p2Rate = total > 0 ? 100 - p1Rate : 50;

  // ELO Transfer
  const trans =
    (scope.res && scope.res.aggregates && scope.res.aggregates.eloTransfers) ||
    (window.careerStats &&
      window.careerStats.aggregates &&
      window.careerStats.aggregates.eloTransfers) ||
    {};
  const t1 = trans[`${p1} -> ${p2}`] || 0;
  const t2 = trans[`${p2} -> ${p1}`] || 0;
  let eloTransferText = "Ausgeglichen";
  if (t1 > t2) {
    eloTransferText = `+${Math.round(t1 - t2)} für ${p1}`;
  } else if (t2 > t1) {
    eloTransferText = `+${Math.round(t2 - t1)} für ${p2}`;
  }

  let leadText = "Unentschieden";
  if (p1Wins > p2Wins) {
    leadText = `+${p1Wins - p2Wins} Siege für ${p1}`;
  } else if (p2Wins > p1Wins) {
    leadText = `+${p2Wins - p1Wins} Siege für ${p2}`;
  }

  // Formkurve der letzten Duelle (bis zu 5)
  const lastDuels = duels.slice(-5);
  const formDotsHtml = lastDuels
    .map((g) => {
      const isP1 = (g.w === 1 && g.p1 === p1) || (g.w === 2 && g.p2 === p1);
      const winnerName = isP1 ? p1 : p2;
      return `<div class="h2h-form-dot ${isP1 ? "dot-p1" : "dot-p2"}" title="${winnerName} (${g.d || ""})">${isP1 ? p1[0] : p2[0]}</div>`;
    })
    .join("");

  // Streak Callout
  let currentStreakWinner = null;
  let streakCount = 0;
  for (let i = duels.length - 1; i >= 0; i--) {
    const g = duels[i];
    const isP1 = (g.w === 1 && g.p1 === p1) || (g.w === 2 && g.p2 === p1);
    const w = isP1 ? p1 : p2;
    if (!currentStreakWinner) {
      currentStreakWinner = w;
      streakCount = 1;
    } else if (w === currentStreakWinner) {
      streakCount++;
    } else {
      break;
    }
  }
  let streakLabel = "Ausgeglichen";
  if (streakCount >= 2 && currentStreakWinner) {
    streakLabel = `🔥 ${currentStreakWinner} (${streakCount} Siege in Folge)`;
  } else if (lastDuels.length > 0) {
    streakLabel = `Letzter Sieg: ${currentStreakWinner}`;
  }

  // Break Effizienz
  const p1BreakRate =
    p1BreakGames > 0
      ? Math.round((p1BreakWins / p1BreakGames) * 100) + "%"
      : "-";
  const p2BreakRate =
    p2BreakGames > 0
      ? Math.round((p2BreakWins / p2BreakGames) * 100) + "%"
      : "-";

  // Match Finish %
  const regPct = total > 0 ? Math.round((regWinsCount / total) * 100) : 0;
  const errPct = 100 - regPct;

  // Match Dauer
  let fastestStr = "-";
  let avgDurStr = "-";
  if (durations.length > 0) {
    const minDur = Math.min(...durations);
    const avgDur = Math.round(
      durations.reduce((s, v) => s + v, 0) / durations.length,
    );
    const minM = Math.floor(minDur / 60);
    const minS = minDur % 60;
    fastestStr = `${String(minM).padStart(2, "0")}:${String(minS).padStart(2, "0")} Min`;
    const avgM = Math.floor(avgDur / 60);
    const avgS = avgDur % 60;
    avgDurStr = `${String(avgM).padStart(2, "0")}:${String(avgS).padStart(2, "0")} Min`;
  }

  // Zähigkeit (Ø Restkugeln bei Niederlage)
  const p1AvgRest =
    p1LossesRest.length > 0
      ? (p1LossesRest.reduce((s, v) => s + v, 0) / p1LossesRest.length).toFixed(
          1,
        )
      : "-";
  const p2AvgRest =
    p2LossesRest.length > 0
      ? (p2LossesRest.reduce((s, v) => s + v, 0) / p2LossesRest.length).toFixed(
          1,
        )
      : "-";

  outputEl.innerHTML = `
    <div class="h2h-radar-card">
      <div class="h2h-fighters-row">
        <div class="h2h-fighter">
          <img src="${safeAvatar(p1)}" class="h2h-fighter-avatar" onerror="this.style.display='none'">
          <div>
            <div class="h2h-fighter-name">${p1}</div>
            <div class="h2h-fighter-elo">${Math.round(elo1)} ELO</div>
          </div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 1.4rem; font-weight: 900; color: #fff; letter-spacing: 1px;">${p1Wins} : ${p2Wins}</div>
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--accent);">${leadText}</div>
        </div>
        <div class="h2h-fighter right">
          <img src="${safeAvatar(p2)}" class="h2h-fighter-avatar" onerror="this.style.display='none'">
          <div style="text-align: right;">
            <div class="h2h-fighter-name">${p2}</div>
            <div class="h2h-fighter-elo">${Math.round(elo2)} ELO</div>
          </div>
        </div>
      </div>

      <!-- Dual-Tone Progress Bar -->
      <div class="h2h-bar-wrap">
        <div class="h2h-bar-labels">
          <span style="color: #30d158;">${p1} (${p1Rate}%)</span>
          <span style="color: #ff453a;">${p2} (${p2Rate}%)</span>
        </div>
        <div class="h2h-bar-bg">
          <div class="h2h-bar-fill-left" style="width: ${p1Rate}%;"></div>
        </div>
      </div>

      <!-- Formkurve der letzten Duelle -->
      <div class="h2h-form-container" style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 10px; margin-bottom: 12px;">
        <span class="h2h-form-label" style="font-size: 0.78rem; font-weight: 700; color: #94a3b8;">${streakLabel}</span>
        <div class="h2h-form-dots">
          ${formDotsHtml}
        </div>
      </div>

      <!-- Bento-Insight-Matrix -->
      <div class="h2h-insights-grid">
        <div class="h2h-insight-box">
          <div class="h2h-insight-title">⚖️ ELO-Saldo</div>
          <div class="h2h-insight-val" style="color: ${t1 > t2 ? "#30d158" : t2 > t1 ? "#ff453a" : "#fff"};">${eloTransferText}</div>
        </div>
        <div class="h2h-insight-box">
          <div class="h2h-insight-title">⚡ Anstoß-Vorteil</div>
          <div class="h2h-insight-val"><span style="color: #30d158;">${p1BreakRate}</span> : <span style="color: #ff453a;">${p2BreakRate}</span></div>
        </div>
        <div class="h2h-insight-box">
          <div class="h2h-insight-title">🎯 Regulär gelocht</div>
          <div class="h2h-insight-val" style="color: #30d158;">${regPct}% <span style="font-size: 0.72rem; color: #94a3b8; font-weight: normal;">(${errPct}% Fehler)</span></div>
        </div>
        <div class="h2h-insight-box">
          <div class="h2h-insight-title">⏱️ Duell-Speed</div>
          <div class="h2h-insight-val" style="color: var(--accent);">${fastestStr} <span style="font-size: 0.72rem; color: #94a3b8; font-weight: normal;">(Ø ${avgDurStr})</span></div>
        </div>
        <div class="h2h-insight-box" style="grid-column: 1 / -1;">
          <div class="h2h-insight-title">🛡️ Tisch-Widerstand (Ø Restkugeln bei Niederlage)</div>
          <div class="h2h-insight-val" style="font-size: 0.88rem;">
            <span style="color: #30d158;">${p1}: ${p1AvgRest}</span> &nbsp;—&nbsp; <span style="color: #ff453a;">${p2}: ${p2AvgRest}</span>
          </div>
        </div>
      </div>
    </div>
  `;
};
