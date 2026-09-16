/* ==========================================================================
   Billardkrüppel Filters & Date Logic
   ========================================================================== */

window.timeFilter = "all";
window.modeFilter = "all";
window.customStartDate = null;
window.customEndDate = null;
window.currentSessionDate = window.currentSessionDate || "all";

window.getTodayStr = () => {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const y = now.getFullYear();
  return `${d}.${m}.${y}`;
};

window.getFilteredStats = () => {
  const isSessionView = window.viewId === "heute";
  let dayFilter = "all";

  if (isSessionView) {
    const todayStr = window.getTodayStr();
    dayFilter =
      window.currentSessionDate && window.currentSessionDate !== "all"
        ? window.currentSessionDate
        : todayStr;
  }

  const extraSelect = document.querySelector(".extra-filter-select");
  if (extraSelect && extraSelect.value && extraSelect.value !== "all") {
    dayFilter = extraSelect.value;
  }

  let baseSet = window.stats || [];
  if (dayFilter !== "all") {
    baseSet = baseSet.filter((g) => g.d && g.d.startsWith(dayFilter));
  }

  if (window.modeFilter === "1:1") {
    baseSet = baseSet.filter((g) => g.m !== "2:2");
  } else if (window.modeFilter === "2:2") {
    baseSet = baseSet.filter((g) => g.m === "2:2");
  }

  if (window.selectedPlayerFilter && window.selectedPlayerFilter !== "all") {
    const pl = window.selectedPlayerFilter;
    baseSet = baseSet.filter((g) => {
      return g.p1 === pl || g.p2 === pl || g.p1_2 === pl || g.p2_2 === pl;
    });
  }

  if (isSessionView) {
    return baseSet;
  }

  if (window.timeFilter === "custom") {
    let start = null;
    if (window.customStartDate) {
      const [sy, sm, sd] = window.customStartDate.split("-").map(Number);
      start = new Date(0);
      start.setUTCFullYear(sy, sm - 1, sd);
      start.setUTCHours(0, 0, 0, 0);
    }
    let end = null;
    if (window.customEndDate) {
      const [ey, em, ed] = window.customEndDate.split("-").map(Number);
      end = new Date(0);
      end.setUTCFullYear(ey, em - 1, ed);
      end.setUTCHours(23, 59, 59, 999);
    }

    return baseSet.filter((g) => {
      if (!g || !g.d) return false;
      const parts = g.d.split(", ")[0].split(".");
      if (parts.length < 3) return false;
      const mDate = new Date(0);
      mDate.setUTCFullYear(
        parseInt(parts[2]),
        parseInt(parts[1]) - 1,
        parseInt(parts[0]),
      );
      mDate.setUTCHours(0, 0, 0, 0);

      if (start && mDate < start) return false;
      if (end && mDate > end) return false;
      return true;
    });
  }

  if (window.timeFilter === "all") return baseSet;

  const now = new Date();
  const todayStartUTC = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );

  return baseSet.filter((g) => {
    if (!g || !g.d) return false;
    const parts = g.d.split(", ")[0].split(".");
    if (parts.length < 3) return false;
    const mDate = new Date(0);
    mDate.setUTCFullYear(
      parseInt(parts[2]),
      parseInt(parts[1]) - 1,
      parseInt(parts[0]),
    );
    mDate.setUTCHours(0, 0, 0, 0);

    if (window.timeFilter === "today") {
      return mDate.getTime() === todayStartUTC.getTime();
    }
    if (window.timeFilter === "30days") {
      const limit = new Date(todayStartUTC);
      limit.setUTCDate(limit.getUTCDate() - 30);
      return mDate >= limit;
    }
    if (window.timeFilter === "60days") {
      const limit = new Date(todayStartUTC);
      limit.setUTCDate(limit.getUTCDate() - 60);
      return mDate >= limit;
    }
    if (window.timeFilter === "90days") {
      const limit = new Date(todayStartUTC);
      limit.setUTCDate(limit.getUTCDate() - 90);
      return mDate >= limit;
    }
    if (window.timeFilter === "month") {
      return (
        mDate.getUTCMonth() === now.getUTCMonth() &&
        mDate.getUTCFullYear() === now.getUTCFullYear()
      );
    }
    if (window.timeFilter === "lastMonth") {
      const lastMonthStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0),
      );
      const currentMonthStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
      );
      return mDate >= lastMonthStart && mDate < currentMonthStart;
    }
    if (window.timeFilter === "quarter") {
      const qStartMonth = Math.floor(now.getUTCMonth() / 3) * 3;
      const qStart = new Date(
        Date.UTC(now.getUTCFullYear(), qStartMonth, 1, 0, 0, 0, 0),
      );
      return mDate >= qStart;
    }
    if (window.timeFilter === "lastQuarter") {
      const currentQuarterStartMonth = Math.floor(now.getUTCMonth() / 3) * 3;
      let lastQuarterStartMonth = currentQuarterStartMonth - 3;
      let lastQuarterYear = now.getUTCFullYear();
      if (lastQuarterStartMonth < 0) {
        lastQuarterYear--;
        lastQuarterStartMonth += 12;
      }
      const lastQuarterStart = new Date(
        Date.UTC(lastQuarterYear, lastQuarterStartMonth, 1, 0, 0, 0, 0),
      );
      const currentQuarterStart = new Date(
        Date.UTC(now.getUTCFullYear(), currentQuarterStartMonth, 1, 0, 0, 0, 0),
      );
      return mDate >= lastQuarterStart && mDate < currentQuarterStart;
    }
    if (window.timeFilter === "year") {
      return mDate.getUTCFullYear() === now.getUTCFullYear();
    }
    if (window.timeFilter === "lastYear") {
      const lastYearStart = new Date(
        Date.UTC(now.getUTCFullYear() - 1, 0, 1, 0, 0, 0, 0),
      );
      const currentYearStart = new Date(
        Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0),
      );
      return mDate >= lastYearStart && mDate < currentYearStart;
    }
    return true;
  });
};

window.handleQuickFilter = (val, btnEl) => {
  if (typeof window.handleFilterChange === "function") {
    window.handleFilterChange(val);
  }
  document.querySelectorAll(".quick-filter-pill").forEach((p) => {
    p.classList.remove("active");
  });
  if (btnEl) btnEl.classList.add("active");
};

window.handleFilterChange = (val) => {
  window.timeFilter = val;
  document
    .querySelectorAll(".time-filter-select")
    .forEach((s) => (s.value = val));

  document
    .querySelectorAll(".extra-filter-select")
    .forEach((s) => (s.value = "all"));

  document.querySelectorAll(".quick-filter-pill").forEach((p) => {
    if (p.getAttribute("data-filter") === val) {
      p.classList.add("active");
    } else if (p.getAttribute("data-filter")) {
      p.classList.remove("active");
    }
  });

  if (val !== "custom") {
    document
      .querySelectorAll(".custom-date-input")
      .forEach((i) => (i.value = ""));
    window.customStartDate = null;
    window.customEndDate = null;
  }
  if (typeof window.updateAllViews === "function") window.updateAllViews();
};

window.handleCustomDateChange = () => {
  const sStat = document.getElementById("date-start-stat");
  const eStat = document.getElementById("date-end-stat");
  const sErf = document.getElementById("date-start-erfolge");
  const eErf = document.getElementById("date-end-erfolge");
  const sHist = document.getElementById("date-start-hist");
  const eHist = document.getElementById("date-end-hist");

  let startVal, endVal;
  if (window.viewId === "erfolge") {
    startVal = sErf?.value;
    endVal = eErf?.value;
  } else if (window.viewId === "uebersicht") {
    startVal = sHist?.value;
    endVal = eHist?.value;
  } else {
    startVal = sStat?.value;
    endVal = eStat?.value;
  }

  document
    .querySelectorAll(".custom-date-start")
    .forEach((i) => (i.value = startVal || ""));
  document
    .querySelectorAll(".custom-date-end")
    .forEach((i) => (i.value = endVal || ""));

  window.customStartDate = startVal;
  window.customEndDate = endVal;

  if (startVal || endVal) {
    window.timeFilter = "custom";
    document
      .querySelectorAll(".extra-filter-select")
      .forEach((s) => (s.value = "all"));
    document
      .querySelectorAll(".time-filter-select")
      .forEach((s) => (s.value = "all"));
  } else {
    window.timeFilter = "all";
  }
  if (typeof window.updateAllViews === "function") window.updateAllViews();
};

window.handleExtraFilterChange = (val) => {
  document
    .querySelectorAll(".extra-filter-select")
    .forEach((s) => (s.value = val));
  if (val !== "all") {
    window.timeFilter = "all";
    document
      .querySelectorAll(".time-filter-select")
      .forEach((s) => (s.value = "all"));
    document
      .querySelectorAll(".custom-date-input")
      .forEach((i) => (i.value = ""));
    window.customStartDate = null;
    window.customEndDate = null;
  }
  if (typeof window.updateAllViews === "function") window.updateAllViews();
};

window.populateDateFilter = () => {
  const dropdowns = document.querySelectorAll(".extra-filter-select");
  if (!dropdowns.length || !window.stats) return;

  const dates = window.stats
    .map((g) => (g.d ? g.d.split(",")[0].trim() : null))
    .filter(Boolean);
  const uniqueDates = [...new Set(dates)].sort((a, b) => {
    const parse = (s) => {
      const parts = s.split(".");
      if (parts.length < 3) return 0;
      return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
    };
    return parse(b) - parse(a);
  });

  dropdowns.forEach((s) => {
    const currentVal = s.value;
    s.innerHTML = '<option value="all">Alle Tage</option>';
    uniqueDates.forEach((d) => s.options.add(new Option(d, d)));
    if (
      currentVal &&
      Array.from(s.options).some((opt) => opt.value === currentVal)
    )
      s.value = currentVal;
  });
};

window.toggleHeaderFilter = (trigger) => {
  const header = trigger.closest(".header-container");
  if (!header) return;
  const isActive = header.classList.toggle("filter-active");
  if (isActive && typeof window.populateDateFilter === "function") {
    window.populateDateFilter();
  }
};

window.setGlobalModeFilter = (mode) => {
  window.modeFilter = mode;

  // Sync aller Modus-Buttons in der UI
  document
    .querySelectorAll(".segment-btn-mode, .btn-mode-filter")
    .forEach((btn) => {
      if (btn.getAttribute("data-mode") === mode) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

  if (typeof window.updateAllViews === "function") {
    window.updateAllViews();
  }
  const filtered =
    typeof window.getFilteredStats === "function"
      ? window.getFilteredStats()
      : window.stats;
  if (typeof window.renderHistory === "function") {
    window.renderHistory(filtered);
  }
};

window.handleModeFilter = window.setGlobalModeFilter;

window.setGlobalTimeFilter = (timeVal) => {
  window.timeFilter = timeVal;

  if (timeVal === "today") {
    window.currentSessionDate = window.getCurrentSessionDateStr();
  } else if (timeVal !== "session_date") {
    // Bei Zeitfiltern wie 30days oder month nicht die Session festsetzen
  }

  // Reset 'Mehr...' Label falls Standard gewählt
  if (timeVal === "all" || timeVal === "today" || timeVal === "30days") {
    document.querySelectorAll(".segment-btn-time-more").forEach((btn) => {
      btn.innerHTML = `⚙️ Mehr...`;
    });
  }

  // Sync Zeit-Buttons
  document.querySelectorAll(".segment-btn-time").forEach((btn) => {
    if (btn.getAttribute("data-time") === timeVal) {
      btn.classList.add("active-gold");
    } else {
      btn.classList.remove("active-gold");
    }
  });

  if (typeof window.updateAllViews === "function") {
    window.updateAllViews();
  }
  const filtered =
    typeof window.getFilteredStats === "function"
      ? window.getFilteredStats()
      : window.stats;
  if (typeof window.renderHistory === "function") {
    window.renderHistory(filtered);
  }
};

window.selectedPlayerFilter = "all";

let modalMode = "all";
let modalTime = "all";
let modalSession = "all";
let modalPlayer = "all";

window.getSortedSessionDates = () => {
  if (!window.stats) return [];
  const datesCount = {};
  window.stats.forEach((g) => {
    if (g && g.d) {
      const dStr = g.d.split(",")[0].trim();
      datesCount[dStr] = (datesCount[dStr] || 0) + 1;
    }
  });
  return Object.keys(datesCount).sort((a, b) => {
    const p = (s) => {
      const parts = s.split(".");
      return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
    };
    return p(b) - p(a);
  });
};

window.getCurrentSessionDateStr = () => {
  return window.getTodayStr();
};

window.getLastSessionDateStr = () => {
  const dates = window.getSortedSessionDates();
  const todayStr = window.getTodayStr();
  const pastDates = dates.filter((d) => d !== todayStr);
  return pastDates.length > 0 ? pastDates[0] : dates[0] || todayStr;
};

window.getPreviousSessionDateStr = window.getLastSessionDateStr;

window.selectCurrentSessionDate = () => {
  window.currentSessionDate = window.getTodayStr();
  if (typeof window.updateSegmentBarForView === "function") {
    window.updateSegmentBarForView("heute");
  }
  if (typeof window.updateAllViews === "function") window.updateAllViews();
  const filtered =
    typeof window.getFilteredStats === "function"
      ? window.getFilteredStats()
      : window.stats;
  if (typeof window.renderHistory === "function")
    window.renderHistory(filtered);
};

window.selectPreviousSessionDate = () => {
  const lastDate = window.getLastSessionDateStr();
  if (lastDate) {
    window.currentSessionDate = lastDate;
  }
  if (typeof window.updateSegmentBarForView === "function") {
    window.updateSegmentBarForView("heute");
  }
  if (typeof window.updateAllViews === "function") window.updateAllViews();
  const filtered =
    typeof window.getFilteredStats === "function"
      ? window.getFilteredStats()
      : window.stats;
  if (typeof window.renderHistory === "function")
    window.renderHistory(filtered);
};

window.selectSessionDate = (dateStr) => {
  window.currentSessionDate = dateStr;
  window.closeMoreFilterMenu();
  if (typeof window.updateSegmentBarForView === "function") {
    window.updateSegmentBarForView("heute");
  }
  if (typeof window.updateAllViews === "function") window.updateAllViews();
  const filtered =
    typeof window.getFilteredStats === "function"
      ? window.getFilteredStats()
      : window.stats;
  if (typeof window.renderHistory === "function")
    window.renderHistory(filtered);
};

window.openMoreFilterMenu = (context) => {
  const el = document.getElementById("segment-popunder-backdrop");
  if (!el) return;

  const currentCtx = context || window.viewId || "statistik";
  const isSessionCtx = currentCtx === "heute";

  const titleEl = document.getElementById("sheet-title-text");
  const secTime = document.getElementById("sheet-section-time");
  const secSessions = document.getElementById("sheet-section-sessions");
  const secPlayers = document.getElementById("sheet-section-players");
  const secActions = document.getElementById("sheet-actions-row");

  if (isSessionCtx) {
    if (titleEl) titleEl.innerHTML = "📅 Spieleabend auswählen";
    if (secTime) secTime.style.display = "none";
    if (secPlayers) secPlayers.style.display = "none";
    if (secSessions) secSessions.style.display = "block";
    if (secActions) secActions.style.display = "none";
  } else {
    if (titleEl) titleEl.innerHTML = "⚙️ Gesamt-Filter";
    if (secTime) secTime.style.display = "block";
    if (secPlayers) secPlayers.style.display = "block";
    if (secSessions) secSessions.style.display = "none";
    if (secActions) secActions.style.display = "flex";
  }

  modalTime = window.timeFilter || "all";
  modalSession =
    window.currentSessionDate && window.currentSessionDate !== "all"
      ? window.currentSessionDate
      : window.getTodayStr();
  modalPlayer = window.selectedPlayerFilter || "all";

  window.syncModalChips();
  window.populateModalSessions();
  window.populateModalPlayers();

  el.classList.add("open");
};

window.closeMoreFilterMenu = () => {
  const el = document.getElementById("segment-popunder-backdrop");
  if (el) el.classList.remove("open");
};

window.setModalChip = (type, val) => {
  if (type === "time") {
    modalTime = val;
  } else if (type === "session") {
    modalSession = val;
  } else if (type === "player") {
    modalPlayer = val;
  }
  window.syncModalChips();
};

window.syncModalChips = () => {
  // Sektion: Zeitraum
  document.querySelectorAll("[data-sheet-time]").forEach((btn) => {
    if (btn.getAttribute("data-sheet-time") === modalTime) {
      btn.classList.add("active-gold");
    } else {
      btn.classList.remove("active-gold");
    }
  });

  // Sektion: Sessions
  document.querySelectorAll("[data-sheet-session]").forEach((btn) => {
    if (btn.getAttribute("data-sheet-session") === modalSession) {
      btn.classList.add("active-gold");
    } else {
      btn.classList.remove("active-gold");
    }
  });

  // Sektion: Players
  document.querySelectorAll("[data-sheet-player]").forEach((btn) => {
    if (btn.getAttribute("data-sheet-player") === modalPlayer) {
      btn.classList.add("active-gold");
    } else {
      btn.classList.remove("active-gold");
    }
  });
};

window.resetAllFiltersFromModal = () => {
  modalTime = "all";
  modalPlayer = "all";
  window.timeFilter = "all";
  window.selectedPlayerFilter = "all";
  window.syncModalChips();
  window.applyFiltersFromModal();
};

window.applyFiltersFromModal = () => {
  window.timeFilter = modalTime;
  window.selectedPlayerFilter = modalPlayer;

  // Sync Zeit-Buttons
  document.querySelectorAll(".segment-btn-time").forEach((btn) => {
    if (!btn.classList.contains("segment-btn-time-more")) {
      btn.classList.toggle(
        "active-gold",
        btn.getAttribute("data-time") === window.timeFilter,
      );
    }
  });

  window.closeMoreFilterMenu();

  if (typeof window.updateSegmentBarForView === "function") {
    window.updateSegmentBarForView(window.viewId || "statistik");
  }
  if (typeof window.updateAllViews === "function") window.updateAllViews();
  const filtered =
    typeof window.getFilteredStats === "function"
      ? window.getFilteredStats()
      : window.stats;
  if (typeof window.renderHistory === "function")
    window.renderHistory(filtered);
};

window.updateSegmentBarForView = (viewId) => {
  const row = document.getElementById("stat-segment-time-row");
  if (!row) return;

  const todayStr = window.getTodayStr();
  const lastDate = window.getLastSessionDateStr();
  const activeSession =
    window.currentSessionDate && window.currentSessionDate !== "all"
      ? window.currentSessionDate
      : todayStr;

  if (viewId === "heute") {
    // Session-Seite: Fokus auf aktuellen (Heute) vs. letzten Abend vs. weitere
    const isTodayActive = activeSession === todayStr;
    const isLastActive =
      activeSession === lastDate && lastDate !== "" && !isTodayActive;
    const isOtherSessionActive = !isTodayActive && !isLastActive;

    let moreLabel = "Mehr Abende...";
    if (isOtherSessionActive && activeSession !== "all") {
      const parts = activeSession.split(".");
      moreLabel =
        parts.length >= 2 ? `${parts[0]}.${parts[1]}.` : activeSession;
    }

    const lastLabel = lastDate ? `📅 ${lastDate}` : "📅 Letzter Abend";

    row.innerHTML = `
      <button
        type="button"
        class="segment-btn segment-btn-time ${isTodayActive ? "active-gold" : ""}"
        data-time="today"
        onclick="window.selectCurrentSessionDate()"
      >
        📅 Aktuelle Session
      </button>
      <button
        type="button"
        class="segment-btn segment-btn-time ${isLastActive ? "active-gold" : ""}"
        data-time="last_session"
        onclick="window.selectPreviousSessionDate()"
        title="${lastDate ? `Letzter Abend: ${lastDate}` : "Letzter Abend"}"
      >
        ${lastLabel}
      </button>
      <button
        type="button"
        class="segment-btn segment-btn-time segment-btn-time-more ${isOtherSessionActive ? "active-gold" : ""}"
        onclick="window.openMoreFilterMenu('heute')"
      >
        ⚙️ ${moreLabel}
      </button>
    `;
  } else if (viewId === "statistik") {
    // Gesamt-Seite: Fokus auf Gesamt & größere Intervalle
    const isMonthActive = window.timeFilter === "month";
    const is30Active = window.timeFilter === "30days";
    const isAllActive =
      window.timeFilter === "all" &&
      (!window.selectedPlayerFilter || window.selectedPlayerFilter === "all");
    const isOtherActive = !isAllActive && !is30Active && !isMonthActive;

    let moreLabel = "Mehr...";
    if (isOtherActive) {
      if (
        window.selectedPlayerFilter &&
        window.selectedPlayerFilter !== "all"
      ) {
        moreLabel = window.selectedPlayerFilter;
      } else if (window.timeFilter === "60days") {
        moreLabel = "60 Tage";
      } else if (window.timeFilter === "90days") {
        moreLabel = "90 Tage";
      } else if (window.timeFilter === "lastMonth") {
        moreLabel = "Letzter Monat";
      } else if (window.timeFilter === "year") {
        moreLabel = "Dieses Jahr";
      } else if (window.timeFilter === "lastYear") {
        moreLabel = "Letztes Jahr";
      }
    }

    row.innerHTML = `
      <button
        type="button"
        class="segment-btn segment-btn-time ${isAllActive ? "active-gold" : ""}"
        data-time="all"
        onclick="window.setGlobalTimeFilter('all')"
      >
        🌐 Gesamt
      </button>
      <button
        type="button"
        class="segment-btn segment-btn-time ${is30Active ? "active-gold" : ""}"
        data-time="30days"
        onclick="window.setGlobalTimeFilter('30days')"
      >
        ⏳ 30 Tage
      </button>
      <button
        type="button"
        class="segment-btn segment-btn-time ${isMonthActive ? "active-gold" : ""}"
        data-time="month"
        onclick="window.setGlobalTimeFilter('month')"
      >
        🗓️ Dieser Monat
      </button>
      <button
        type="button"
        class="segment-btn segment-btn-time segment-btn-time-more ${isOtherActive ? "active-gold" : ""}"
        onclick="window.openMoreFilterMenu('statistik')"
      >
        ⚙️ ${moreLabel}
      </button>
    `;
  }
};

window.populateModalSessions = () => {
  const container = document.getElementById("sheet-sessions-list");
  if (!container || !window.stats) return;

  const datesCount = {};
  window.stats.forEach((g) => {
    if (g && g.d) {
      const dStr = g.d.split(",")[0].trim();
      datesCount[dStr] = (datesCount[dStr] || 0) + 1;
    }
  });

  const sortedDates = Object.keys(datesCount).sort((a, b) => {
    const p = (s) => {
      const parts = s.split(".");
      return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
    };
    return p(b) - p(a);
  });

  const activeDate =
    window.currentSessionDate && window.currentSessionDate !== "all"
      ? window.currentSessionDate
      : window.getTodayStr();

  let html = "";
  sortedDates.forEach((ds) => {
    const isAct = activeDate === ds;
    let weekdayStr = "";
    try {
      const parts = ds.split(".");
      const dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
      const weekdays = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
      weekdayStr = ` (${weekdays[dateObj.getDay()]})`;
    } catch (e) {}

    html += `
      <div
        class="popunder-btn ${isAct ? "active-gold" : ""}"
        data-sheet-session="${ds}"
        onclick="window.selectSessionDate('${ds}')"
        style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; font-size: 12px; border-radius: 10px; cursor: pointer; background: ${isAct ? "rgba(255, 204, 0, 0.15)" : "rgba(255, 255, 255, 0.04)"}; border: 1px solid ${isAct ? "rgba(255, 204, 0, 0.5)" : "rgba(255, 255, 255, 0.08)"}; transition: all 0.2s;"
      >
        <span style="font-weight: 700; color: ${isAct ? "var(--accent)" : "#fff"};">📅 ${ds}${weekdayStr}</span>
        <span style="font-size: 11px; opacity: 0.8; color: ${isAct ? "var(--accent)" : "#8e8e93"};">${datesCount[ds]} Matches</span>
      </div>
    `;
  });

  container.innerHTML = html;
};

window.populateModalPlayers = () => {
  const container = document.getElementById("sheet-players-grid");
  if (!container) return;

  const players =
    Array.isArray(window.spieler) && window.spieler.length > 0
      ? window.spieler
      : ["Thorsten", "Daniel", "Peter", "Sascha"];

  let html = `
    <button type="button" class="sheet-chip-btn ${modalPlayer === "all" ? "active-gold" : ""}" data-sheet-player="all" onclick="window.setModalChip('player', 'all')" style="grid-column: span 2;">
      👑 Alle Spieler
    </button>
  `;

  players.forEach((p) => {
    const isAct = modalPlayer === p;
    const avatar =
      typeof window.safeGetAvatarUrl === "function"
        ? window.safeGetAvatarUrl(p)
        : `avatars/${p}.webp`;

    html += `
      <button type="button" class="sheet-chip-btn ${isAct ? "active-gold" : ""}" data-sheet-player="${p}" onclick="window.setModalChip('player', '${p}')">
        <img src="${avatar}" style="width:16px; height:16px; border-radius:50%; object-fit:cover;" onerror="this.src='logo.png'">
        <span>${p}</span>
      </button>
    `;
  });

  container.innerHTML = html;
};
