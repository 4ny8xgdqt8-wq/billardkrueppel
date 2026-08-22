/* ==========================================================================
   Billardkrüppel Filters & Date Logic
   ========================================================================== */

window.timeFilter = "all";
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
  const extraSelect = document.querySelector(".extra-filter-select");
  const dayFilter = extraSelect ? extraSelect.value : "all";

  let baseSet = window.stats || [];
  if (dayFilter !== "all") {
    baseSet = baseSet.filter((g) => g.d && g.d.startsWith(dayFilter));
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

window.handleFilterChange = (val) => {
  window.timeFilter = val;
  document
    .querySelectorAll(".time-filter-select")
    .forEach((s) => (s.value = val));

  document
    .querySelectorAll(".extra-filter-select")
    .forEach((s) => (s.value = "all"));

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

window.updateErfolgeMask = () => {
  const wrapper = document.getElementById("erfolge-header-wrapper");
  const header = wrapper?.querySelector(".header-container");
  if (!wrapper || !header) return;

  if (header.classList.contains("filter-active")) {
    wrapper.style.background = "rgba(0, 0, 0, 0.98)";
    wrapper.style.maskImage = "none";
    wrapper.style.webkitMaskImage = "none";
  } else {
    wrapper.style.background =
      "linear-gradient(to bottom, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.8) 80%, rgba(0, 0, 0, 0) 100%)";
    wrapper.style.maskImage =
      "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)";
    wrapper.style.webkitMaskImage =
      "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)";
  }
};

window.toggleHeaderFilter = (trigger) => {
  const header = trigger.closest(".header-container");
  if (!header) return;
  const isActive = header.classList.toggle("filter-active");
  if (isActive) window.populateDateFilter();
  window.updateErfolgeMask();
};

