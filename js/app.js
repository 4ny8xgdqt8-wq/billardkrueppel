/* ==========================================================================
   Billardkrüppel App Initialization & Core Controller
   ========================================================================== */

import { initFirebaseService } from "./firebase-service.js";

// -- 1. Globale Zustandsvariablen --
window.stats = [];
window.spieler = [];
window.dailyAchivs = { days: {} };
window.viewId = "aufzeichnen";
window.careerStats = null;
window.careerStatsBeforeToday = null;
window.flags = { stats: false, spieler: false };

let workerFinished = false;
let firebaseDataReady = false;
let isCalculating = false;
let isHiding = false;

// -- 2. Zentraler View-Updater (Sofort verfügbar) --
window.updateAllViews = function () {
  const extraSelect = document.querySelector(".extra-filter-select");
  const isDayFilterActive = extraSelect && extraSelect.value !== "all";

  const startInput = document.querySelector(".custom-date-start");
  const endInput = document.querySelector(".custom-date-end");
  const isCustomDateActive =
    (startInput && startInput.value) || (endInput && endInput.value);

  const isFilterActive =
    (window.timeFilter !== "all" && window.timeFilter !== "custom") ||
    isCustomDateActive ||
    isDayFilterActive;

  document.querySelectorAll(".filter-toggle-bar").forEach((bar) => {
    bar.classList.toggle("active", isFilterActive);
  });

  if (
    window.viewId === "aufzeichnen" &&
    typeof window.updateUI === "function"
  ) {
    window.updateUI();
  }

  if (typeof window.renderBillardStats !== "function") return;

  const isToday = window.viewId === "heute";

  const statHeader = document.querySelector(
    "#view-statistik .header-container",
  );
  if (statHeader) {
    const toggleBar = statHeader.querySelector(".filter-toggle-bar");
    const titleStack = statHeader.querySelector(".title-stack");
    const mainTitle = statHeader.querySelector(".main-title");
    if (isToday) {
      if (mainTitle) mainTitle.innerText = "Session";
      if (toggleBar) toggleBar.style.display = "none";
      if (titleStack) titleStack.style.pointerEvents = "none";
      statHeader.classList.remove("filter-active");
    } else {
      if (mainTitle) mainTitle.innerText = "Statistik";
      if (toggleBar) toggleBar.style.display = "flex";
      if (titleStack) titleStack.style.pointerEvents = "auto";
    }
  }

  const statsToUse = isToday
    ? window.stats
    : typeof window.getFilteredStats === "function"
      ? window.getFilteredStats()
      : window.stats;

  if (!window.careerStats || !window.careerStatsBeforeToday) {
    if (typeof window.recalculateAndRender === "function")
      window.recalculateAndRender();
    if (window.viewId !== "aufzeichnen" && window.viewId !== "uebersicht")
      return;
  }

  if (
    window.viewId === "uebersicht" &&
    typeof window.renderHistory === "function"
  ) {
    window.renderHistory(statsToUse);
  }

  if (
    (window.viewId === "statistik" ||
      window.viewId === "heute" ||
      window.viewId === "erfolge") &&
    typeof window.renderBillardStats === "function"
  ) {
    window.renderBillardStats(
      statsToUse,
      isToday,
      false,
      document,
      window.careerStats,
      window.careerStatsBeforeToday,
    );
  }

  if (
    window.viewId === "aufzeichnen" &&
    window.careerStats &&
    window.careerStatsBeforeToday &&
    typeof window.renderBillardStats === "function"
  ) {
    window.renderBillardStats(
      window.stats,
      true,
      false,
      document,
      window.careerStats,
      window.careerStatsBeforeToday,
    );
  }

  if (typeof window.updateModeVisuals === "function") {
    window.updateModeVisuals();
  }
};

// -- 3. Tab Navigation & Ambient Moods (Sofort verfügbar) --
window.switchV = function (id, el, forcedDir) {
  const tabOrder = [
    "aufzeichnen",
    "heute",
    "statistik",
    "erfolge",
    "uebersicht",
    "regeln",
  ];
  const oldIdx = tabOrder.indexOf(window.viewId);
  const newIdx = tabOrder.indexOf(id);

  let dir = forcedDir;
  if (!dir && oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
    dir = newIdx > oldIdx ? "next" : "prev";
  }

  window.viewId = id;
  const oldActive = document.querySelector(".view.active");
  document
    .querySelectorAll(".tab-item")
    .forEach((t) => t.classList.remove("active"));

  const targetViewId =
    id === "heute" || id === "statistik" ? "view-statistik" : "view-" + id;
  const targetView = document.getElementById(targetViewId);

  if (targetView) {
    let mainStartColor = "#000000";
    let mainEndColor = "#1a2a2a";
    let gradientStart = "5%";
    let particleColor = "rgba(255,204,0,0.03)";

    if (id === "uebersicht") {
      mainEndColor = "#0a1a2e";
      particleColor = "rgba(79,195,247,0.04)";
    } else if (id === "statistik" || id === "heute" || id === "aufzeichnen") {
      mainEndColor = "#1a2a2a";
      particleColor = "rgba(52,199,89,0.03)";
    } else if (id === "regeln") {
      mainEndColor = "#2a1515";
      particleColor = "rgba(255,59,48,0.04)";
    } else if (id === "erfolge") {
      mainEndColor = "#3a2a1a";
      particleColor = "rgba(255,149,0,0.03)";
    }

    document.documentElement.style.setProperty(
      "--ambient-main-start",
      mainStartColor,
    );
    document.documentElement.style.setProperty(
      "--ambient-main-end",
      mainEndColor,
    );
    document.documentElement.style.setProperty(
      "--ambient-gradient-start",
      gradientStart,
    );
    document.documentElement.style.setProperty(
      "--ambient-particle-color",
      particleColor,
    );

    const scrollArea = document.getElementById("scroll-area");
    if (scrollArea) scrollArea.style.overflowY = "auto";

    if (oldActive && oldActive !== targetView) {
      const exitDir = dir === "next" ? "exit-left" : "exit-right";
      oldActive.classList.add(exitDir);
      oldActive.style.position = "absolute";
      oldActive.style.width = "100%";
      oldActive.style.height = "100%";
      oldActive.style.top = "0";
      oldActive.style.left = "0";

      setTimeout(() => {
        oldActive.classList.remove(exitDir);
        oldActive.classList.remove("active");
        oldActive.style.cssText = "";
      }, 400);
    } else if (oldActive === targetView) {
      oldActive.classList.remove(
        "slide-right",
        "slide-left",
        "exit-right",
        "exit-left",
      );
      oldActive.style.cssText = "";
    }

    document.querySelectorAll(".view").forEach((v) => {
      if (v !== targetView && v !== oldActive) {
        v.classList.remove(
          "active",
          "slide-right",
          "slide-left",
          "exit-right",
          "exit-left",
        );
        v.style.cssText = "";
      }
    });

    targetView.classList.add("active");
    targetView.classList.remove(
      "slide-right",
      "slide-left",
      "exit-right",
      "exit-left",
    );
    targetView.style.cssText = "";

    targetView
      .querySelectorAll(
        ".cinematic-entry, .cinematic-hud, .card-hud, .section-label",
      )
      .forEach((element) => {
        element.style.animation = "none";
        element.offsetHeight;
        element.style.animation = "";
      });

    if (dir === "next") targetView.classList.add("slide-right");
    if (dir === "prev") targetView.classList.add("slide-left");
  }

  // Aktiven Tab in Tabbar markieren
  const activeTabEl =
    el || document.querySelector(`.tab-item[onclick*="${id}"]`);
  if (activeTabEl) {
    activeTabEl.classList.add("active");
    const ind = document.getElementById("tab-indicator");
    if (ind) {
      ind.style.width = activeTabEl.offsetWidth + "px";
      ind.style.left = activeTabEl.offsetLeft + "px";
    }
  }

  requestAnimationFrame(() => {
    window.updateAllViews();
  });

  const scrollArea = document.getElementById("scroll-area");
  if (scrollArea) scrollArea.scrollTop = 0;
};

// -- 4. Service Worker & Update-Management --
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

// Versionsanzeige synchronisieren
const updateVersionUI = (v) => {
  window.BILLARD_APP_VERSION = v;
  const verEl = document.getElementById("loader-version");
  if (verEl) verEl.innerText = "App Version: " + v;
};

fetch("sw.js?t=" + Date.now())
  .then((r) => {
    if (!r.ok) throw new Error();
    return r.text();
  })
  .then((text) => {
    const match = text.match(
      /CACHE_NAME\s*=\s*['"][^'"]*?v?(\d+(?:\.\d+)*)['"]/,
    );
    if (match && match[1]) updateVersionUI(match[1]);
    else updateVersionUI("v16.2");
  })
  .catch(() => {
    updateVersionUI("v16.2");
  });

// -- 5. Loader Controls --
window.hideLoader = () => {
  const l = document.getElementById("loading-overlay");
  const content = document.getElementById("loader-content");
  if (l && l.style.display !== "none") {
    if (content) {
      content.style.transform = "scale(1.05)";
      content.style.opacity = "0";
    }
    l.style.opacity = "0";
    l.style.filter = "blur(10px)";
    setTimeout(() => (l.style.display = "none"), 300);
  }
};

window.resetLoaderState = () => {
  isHiding = false;
  firebaseDataReady = false;
  workerFinished = false;
  isCalculating = false;
};

window.checkAllReadyAndHideLoader = () => {
  if (!firebaseDataReady || !workerFinished || isHiding) return;
  isHiding = true;
  window.updateLoaderStatus("Bereit", 100);
  setTimeout(() => window.hideLoader(), 200);
};

window.updateLoaderStatus = (msg, percent) => {
  if (isHiding && percent < 100) return;
  const el = document.getElementById("loader-status");
  const bar = document.getElementById("loader-progress");
  if (el) el.innerText = msg + "...";
  if (bar && percent !== undefined) bar.style.width = percent + "%";
};

// Fallback Timeout für Loader
setTimeout(() => {
  if (!firebaseDataReady || !workerFinished) {
    firebaseDataReady = true;
    workerFinished = true;
    window.checkAllReadyAndHideLoader();
  }
}, 3000);

// Zufälliger Billard-Tipp im Loader
const tips = [
  "Die 8 muss immer als letzte versenkt werden.",
  "Kreide dein Queue vor jedem wichtigen Stoß.",
  "Billard ist 10% Talent und 90% Konzentration.",
  "Ein sanfter Stoß ist oft präziser als rohe Gewalt.",
  "Achte auf den Winkel der Weißen nach dem Einschlag.",
  "Symmetrie im Aufbau ist das A und O.",
  "Ein Queue ist kein Wanderstock – fass ihn mit Gefühl an.",
  "Wenn die Weiße fällt, weint der Spieler.",
  "Banden sind deine Freunde, wenn du sie richtig ansprichst.",
  "Loch ist Loch – egal wie die Kugel reingeeiert ist.",
  "Wer die 8 zu früh locht, hat mehr Zeit für Kaltgetränke.",
  "Nicht gezielt ist auch daneben.",
  "Billard: Das ist wie Schach, nur mit mehr Physik.",
  "Der Tisch verzeiht nichts, aber er vergisst schnell.",
  "Ein guter Stoß beginnt mit einem ruhigen Atemzug.",
  "Effet ist keine Zauberei, sondern pure Wissenschaft.",
  "Wer zittert, verliert – wer zielt, gewinnt.",
  "Ein blindes Huhn locht auch mal eine Schwarze.",
  "Spielst du noch oder lochst du schon?",
  "Die Kugel weiß nicht, wer du bist. Überzeuge sie.",
  "Geduld ist die wichtigste Eigenschaft am Tisch.",
  "Manchmal ist ein Sicherheitsschlag besser als ein Risiko.",
  "Der Diamant am Rand ist nicht nur Deko.",
  "Bleib tief über dem Queue für mehr Präzision.",
  "Ein sauberer Stand ist das Fundament des Erfolgs.",
];

const tipEl = document.getElementById("loader-tip");
if (tipEl) {
  tipEl.innerText = "» " + tips[Math.floor(Math.random() * tips.length)] + " «";
  tipEl.style.animation = "tip-fade 1.2s ease-out forwards";
}

// Dynamische Status-Botschaften
const statusEl = document.getElementById("loader-status");
if (statusEl) {
  const statuses = [
    "Kreide Queues",
    "Mische Kugeln",
    "Poliere Filz",
    "Bereite Arena vor",
  ];
  let sIdx = 0;
  statusEl.innerText = statuses[sIdx] + "...";
  setInterval(() => {
    sIdx = (sIdx + 1) % statuses.length;
    statusEl.innerText = statuses[sIdx] + "...";
  }, 900);
}

// Avatare im Loader
const loaderAvatars = document.getElementById("loader-avatars");
if (loaderAvatars) {
  const playersToShow = ["Daniel", "Thorsten", "Peter"];
  loaderAvatars.innerHTML = playersToShow
    .map((p, i) => {
      const src = window.getAvatarUrl
        ? window.getAvatarUrl(p)
        : `avatars/${p}.webp`;
      return `
        <div class="loader-avatar-container" style="animation-delay: ${i * 0.2}s">
          <img loading="lazy" src="${src}" class="loader-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
          <div style="display:none; width:100%; height:100%; border-radius:50%; background:rgba(255,255,255,0.05); align-items:center; justify-content:center; font-size:24px; border:1px solid var(--accent); color:rgba(255,255,255,0.2);">👤</div>
        </div>`;
    })
    .join("");
}

// -- 6. Web Worker & Berechnung --
let statsWorker;
try {
  statsWorker = new Worker("worker.js");
  statsWorker.onmessage = (e) => handleWorkerResult(e.data);
  statsWorker.onerror = () => handleCalculationFallback();
} catch (e) {
  handleCalculationFallback();
}

function handleWorkerResult(data) {
  try {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const todayStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;

    if (typeof window.enrichStatsWithAchievements === "function") {
      window.careerStats = window.enrichStatsWithAchievements(
        data.careerStats,
        window.stats.map((g, i) => ({ g, i })),
        window.spieler,
        window.dailyAchivs,
      );
      window.careerStatsBeforeToday = window.enrichStatsWithAchievements(
        data.careerStatsBeforeToday,
        window.stats
          .map((g, i) => ({ g, i }))
          .filter((x) => x.g && x.g.d && !x.g.d.startsWith(todayStr)),
        window.spieler,
        window.dailyAchivs,
        false,
      );
    } else {
      window.careerStats = data.careerStats;
      window.careerStatsBeforeToday = data.careerStatsBeforeToday;
    }
    window.updateAllViews();
  } catch (err) {
    console.error("Error processing worker data:", err);
  } finally {
    workerFinished = true;
    isCalculating = false;
    window.checkAllReadyAndHideLoader();
  }
}

function handleCalculationFallback() {
  console.warn("Using local calculation fallback (Worker blocked).");
  if (typeof window.calculateStatsLocally === "function") {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const todayStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;
    const career = window.calculateStatsLocally(window.stats, window.spieler);
    const before = window.calculateStatsLocally(
      window.stats.filter((g) => g && g.d && !g.d.startsWith(todayStr)),
      window.spieler,
    );

    handleWorkerResult({
      careerStats: career,
      careerStatsBeforeToday: before,
    });
  }
}

window.recalculateAndRender = () => {
  if (
    window.flags.stats &&
    window.flags.spieler &&
    !isCalculating &&
    typeof window.enrichStatsWithAchievements === "function"
  ) {
    isCalculating = true;
    if (!isHiding) window.updateLoaderStatus("Analysiere Billard-Historie", 85);

    if (typeof window.populateDateFilter === "function") {
      window.populateDateFilter();
    }

    if (statsWorker && statsWorker.postMessage) {
      statsWorker.postMessage({
        stats: JSON.parse(JSON.stringify(window.stats)),
        spieler: Array.from(window.spieler),
      });
    } else {
      handleCalculationFallback();
    }
    firebaseDataReady = true;
  }
};

// -- 7. Touch Swipe Navigation deaktiviert auf Wunsch --

// Klick außerhalb schließt Filter
document.addEventListener("click", (e) => {
  const activeHeader = document.querySelector(
    ".header-container.filter-active",
  );
  if (activeHeader && !activeHeader.contains(e.target)) {
    activeHeader.classList.remove("filter-active");
    if (window.updateErfolgeMask) window.updateErfolgeMask();
  }
});

// Scroll schließt Filter
document.getElementById("scroll-area")?.addEventListener(
  "scroll",
  () => {
    const active = document.querySelector(".header-container.filter-active");
    if (active) {
      active.classList.remove("filter-active");
      if (window.updateErfolgeMask) window.updateErfolgeMask();
    }
  },
  { passive: true },
);

// -- 8. Firebase Service initialisieren --
initFirebaseService();

// Init Tab-Indikator & Default Tab
setTimeout(() => {
  window.switchV("aufzeichnen", document.querySelector(".tab-item.active"));
}, 50);

// -- 9. Modus-Verwaltung (Hauptliga vs. D&T Duell) & Geheimer Trigger --
window.openModeSelectModal = () => {
  const modal = document.getElementById("modeSelectModal");
  if (!modal) return;
  const isDt = window.currentAppMode === "dt";
  const checkMain = document.getElementById("mode-check-main");
  const checkDt = document.getElementById("mode-check-dt");
  const btnMain = document.getElementById("mode-btn-main");
  const btnDt = document.getElementById("mode-btn-dt");

  if (checkMain) checkMain.style.display = !isDt ? "inline" : "none";
  if (checkDt) checkDt.style.display = isDt ? "inline" : "none";
  if (btnMain) {
    btnMain.style.borderColor = !isDt
      ? "var(--accent)"
      : "rgba(255, 255, 255, 0.12)";
    btnMain.style.background = !isDt
      ? "rgba(255, 204, 0, 0.08)"
      : "rgba(255, 255, 255, 0.06)";
  }
  if (btnDt) {
    btnDt.style.borderColor = isDt
      ? "var(--accent)"
      : "rgba(255, 255, 255, 0.12)";
    btnDt.style.background = isDt
      ? "rgba(255, 204, 0, 0.08)"
      : "rgba(255, 255, 255, 0.06)";
  }

  modal.style.display = "flex";
};

window.closeModeSelectModal = () => {
  const modal = document.getElementById("modeSelectModal");
  if (modal) modal.style.display = "none";
};

window.selectAppMode = async (mode) => {
  window.closeModeSelectModal();
  if (typeof window.switchAppMode === "function") {
    await window.switchAppMode(mode);
  }
};

window.updateModeVisuals = () => {
  const isDt = window.currentAppMode === "dt";

  // Diskretes D&T-Badge an jedem Haupttitel
  document.querySelectorAll(".main-title").forEach((t) => {
    let badge = t.querySelector(".mode-subtle-badge");
    if (isDt) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "mode-subtle-badge";
        badge.style.cssText =
          "font-size: 11px; margin-left: 8px; padding: 2px 7px; border-radius: 8px; background: rgba(255, 204, 0, 0.15); border: 1px solid rgba(255, 204, 0, 0.3); color: var(--accent); font-weight: 800; vertical-align: middle; cursor: pointer; letter-spacing: 0.5px;";
        badge.innerText = "⚔️ D&T";
        badge.title = "D&T Duell aktiv (Tippen zum Wechseln)";
        badge.onclick = (e) => {
          e.stopPropagation();
          window.openModeSelectModal();
        };
        t.appendChild(badge);
      }
    } else {
      if (badge) badge.remove();
    }
  });

  // Untertitel im Aufzeichnen-Header
  const greetingEl = document.getElementById("dynamic-greeting");
  if (greetingEl) {
    if (isDt) {
      greetingEl.innerText = "D&T Duell · 1 gegen 1";
    } else if (greetingEl.innerText.startsWith("D&T")) {
      greetingEl.innerText = "Match erfassen";
    }
  }

  // 3. Spielmodus-Kachel im Aufzeichnen-Tab (1:1 / 2:2 & Würfelbutton) im DT-Modus komplett ausblenden
  const modeSel = document.getElementById("mode");
  const modeCard = modeSel ? modeSel.closest(".card") : null;
  if (modeCard) {
    modeCard.style.display = isDt ? "none" : "";
  }
  if (modeSel && isDt) {
    modeSel.value = "1:1";
  }

  // 4. Partner-Power (Top Duos %) in den Statistiken im DT-Modus ausblenden
  const duoRankingEl = document.getElementById("stat-duo-ranking");
  const duoCard = duoRankingEl ? duoRankingEl.closest(".card") : null;
  if (duoCard) {
    duoCard.style.display = isDt ? "none" : "";
  }

  // 5. Spielmodus im Match-Bearbeiten-Modal (#edit-mode) im DT-Modus ausblenden
  const editModeSel = document.getElementById("edit-mode");
  const editModeContainer = editModeSel ? editModeSel.closest("div") : null;
  if (editModeContainer) {
    editModeContainer.style.display = isDt ? "none" : "";
  }
  if (editModeSel && isDt) {
    editModeSel.value = "1:1";
    if (typeof window.updateEditUI === "function") {
      window.updateEditUI();
    }
  }
};

// -- 10. App-Info & Changelog Modal --
function parseMarkdownToHtml(md) {
  if (!md) return "";
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /^### (.*$)/gim,
      '<h4 style="color: var(--accent); font-size: 0.95rem; font-weight: 800; margin: 16px 0 6px 0;">$1</h4>',
    )
    .replace(
      /^## (.*$)/gim,
      '<h3 style="color: #ffffff; font-size: 1.05rem; font-weight: 800; margin: 20px 0 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">$1</h3>',
    )
    .replace(
      /^# (.*$)/gim,
      '<h2 style="color: var(--accent); font-size: 1.2rem; font-weight: 900; margin: 0 0 10px 0;">$1</h2>',
    )
    .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: #ffffff;">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<span style="color: #fde047;">$1</span>')
    .replace(
      /^---$/gim,
      '<hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 14px 0;">',
    )
    .replace(
      /^\* (.*$)/gim,
      '<li style="margin-bottom: 6px; margin-left: 18px; color: #cbd5e1;">$1</li>',
    )
    .replace(
      /^- (.*$)/gim,
      '<li style="margin-bottom: 6px; margin-left: 18px; color: #cbd5e1;">$1</li>',
    )
    .replace(
      /`([^`]+)`/gim,
      '<code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; color: var(--accent); font-size: 0.82rem;">$1</code>',
    );

  return html;
}

window.openAppInfoModal = async function () {
  const modal = document.getElementById("appInfoModal");
  const body = document.getElementById("app-info-body");
  const verEl = document.getElementById("app-info-version");
  if (!modal) return;

  modal.style.display = "flex";
  if (verEl) {
    verEl.textContent = "v19.5";
  }

  if (body) {
    try {
      const res = await fetch("README.md?t=" + Date.now());
      if (!res.ok) throw new Error("README.md konnte nicht geladen werden");
      const text = await res.text();
      body.innerHTML = parseMarkdownToHtml(text);
    } catch (e) {
      body.innerHTML = `<div style="color: #f87171; text-align: center; padding: 20px;">Fehler beim Laden des Changelogs: ${e.message}</div>`;
    }
  }
};

window.closeAppInfoModal = function () {
  const modal = document.getElementById("appInfoModal");
  if (modal) modal.style.display = "none";
};

// Geheimer Trigger: 3-fach Tap oder Long Press (>1.2s) auf Header-Titel oder linkes Logo
function initSecretModeTrigger() {
  let tapCount = 0;
  let tapTimer = null;
  let pressTimer = null;

  const trigger = () => {
    if (navigator.vibrate) {
      try {
        navigator.vibrate([30, 40, 30]);
      } catch (e) {}
    }
    window.openModeSelectModal();
  };

  const handlePointerDown = () => {
    pressTimer = setTimeout(trigger, 1200);
  };

  const handlePointerUp = () => {
    clearTimeout(pressTimer);
  };

  document
    .querySelectorAll(".main-title, .header-side:not(.right)")
    .forEach((el) => {
      // 3-fach schneller Tap
      el.addEventListener("click", () => {
        tapCount++;
        clearTimeout(tapTimer);
        if (tapCount >= 3) {
          tapCount = 0;
          trigger();
        } else {
          tapTimer = setTimeout(() => {
            tapCount = 0;
          }, 500);
        }
      });

      // Long Press
      el.addEventListener("touchstart", handlePointerDown, { passive: true });
      el.addEventListener("touchend", handlePointerUp, { passive: true });
      el.addEventListener("touchcancel", handlePointerUp, { passive: true });
      el.addEventListener("mousedown", handlePointerDown);
      el.addEventListener("mouseup", handlePointerUp);
      el.addEventListener("mouseleave", handlePointerUp);
    });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSecretModeTrigger);
} else {
  initSecretModeTrigger();
}
