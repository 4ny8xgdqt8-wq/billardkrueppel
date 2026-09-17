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
    if (typeof window.updateStatHeaderOffset === "function") {
      window.updateStatHeaderOffset();
    }
  }

  if (typeof window.updateSegmentBarForView === "function") {
    window.updateSegmentBarForView(window.viewId);
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
    if (scrollArea) {
      scrollArea.style.overflowY = "auto";
      scrollArea.scrollTop = 0;
    }

    // Sofortige Bereinigung aller inaktiven Views (verhindert GPU-Überlastung durch Doppel-Compositing zweier Großansichten)
    document.querySelectorAll(".view").forEach((v) => {
      if (v !== targetView) {
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

    targetView.classList.remove(
      "slide-right",
      "slide-left",
      "exit-right",
      "exit-left",
    );
    targetView.style.cssText = "";
    targetView.classList.add("active");

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

  // Schwere DOM- und Chart-Berechnungen erst NACH Abschluss des 250ms-Slides ausführen (garantiert 60fps ohne Ruckler)
  setTimeout(() => {
    if (typeof window.updateAllViews === "function") {
      window.updateAllViews();
    }
    const scrollArea = document.getElementById("scroll-area");
    if (scrollArea) {
      scrollArea.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, 260);
};

// Spielmodus-Umschaltung für Segmented Pills (Cyber-Duel HUD)
window.setMatchMode = (mode) => {
  const modeSel = document.getElementById("mode");
  if (modeSel) modeSel.value = mode;

  const p1 = document.getElementById("match-pill-1v1");
  const p2 = document.getElementById("match-pill-2v2");
  if (p1) p1.classList.toggle("active", mode === "1:1");
  if (p2) p2.classList.toggle("active", mode === "2:2");

  if (typeof window.updateUI === "function") {
    window.updateUI();
  }
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
      /CACHE_NAME\s*=\s*['"]billard-(?:v)?([a-zA-Z0-9_.]+)['"]/,
    );
    if (match && match[1]) updateVersionUI(match[1]);
    else updateVersionUI("20260917.02");
  })
  .catch(() => {
    updateVersionUI("20260917.02");
  });

// -- 5. Loader Controls & Champions Break Arena --
let breakTriggered = false;
let crackPlayed = false;

function playLoaderBallCrack() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1900, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.045);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);

    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.13);
  } catch (e) {}
}

window.hideLoader = () => {
  const l = document.getElementById("loading-overlay");
  const content = document.getElementById("loader-content");
  if (l && l.style.display !== "none") {
    if (content) {
      content.style.transform = "scale(1.06)";
      content.style.opacity = "0";
    }
    l.style.opacity = "0";
    l.style.filter = "blur(10px)";
    setTimeout(() => (l.style.display = "none"), 500);
  }
};

window.resetLoaderState = () => {
  isHiding = false;
  firebaseDataReady = false;
  workerFinished = false;
  isCalculating = false;
  breakTriggered = false;
  crackPlayed = false;
};

window.checkAllReadyAndHideLoader = () => {
  if (!firebaseDataReady || !workerFinished || isHiding) return;
  isHiding = true;

  const arena = document.getElementById("breakArena");
  const triangle = document.getElementById("rackTriangle");

  if (!breakTriggered && arena) {
    breakTriggered = true;
    arena.classList.add("break-active");
  }

  window.updateLoaderStatus("BREAK! Bereit für die Arena!", 100);

  setTimeout(() => {
    if (!crackPlayed && triangle) {
      crackPlayed = true;
      playLoaderBallCrack();
      triangle.classList.add("break-exploded");
    }
    setTimeout(() => window.hideLoader(), 450);
  }, 250);
};

window.updateLoaderStatus = (msg, percent) => {
  if (isHiding && percent < 100) return;
  const el = document.getElementById("loader-status");
  const bar = document.getElementById("loader-progress");
  if (el) el.innerText = msg;
  if (bar && percent !== undefined) bar.style.width = percent + "%";

  const arena = document.getElementById("breakArena");
  const triangle = document.getElementById("rackTriangle");

  if (percent >= 65 && !breakTriggered && arena) {
    breakTriggered = true;
    arena.classList.add("break-active");
  }
  if (percent >= 95 && !crackPlayed && triangle) {
    crackPlayed = true;
    playLoaderBallCrack();
    triangle.classList.add("break-exploded");
  }
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
}

// Dynamische Status-Botschaften
const statusEl = document.getElementById("loader-status");
if (statusEl) {
  const statuses = [
    "Tuch wird gebürstet & Queues eingekreidet...",
    "ELO-Historie & Rangliste synchronisieren...",
    "Die Weiße nimmt Maß...",
    "Bereite Arena vor...",
  ];
  let sIdx = 0;
  statusEl.innerText = statuses[sIdx];
  setInterval(() => {
    if (isHiding) return;
    sIdx = (sIdx + 1) % statuses.length;
    statusEl.innerText = statuses[sIdx];
  }, 900);
}

// Avatare im Loader
const loaderAvatars = document.getElementById("loader-avatars");
if (loaderAvatars) {
  const playersToShow = ["Daniel", "Thorsten", "Peter", "Sascha"];
  loaderAvatars.innerHTML = playersToShow
    .map((p, i) => {
      const src = window.getAvatarUrl
        ? window.getAvatarUrl(p)
        : `avatars/${p}.webp`;
      return `
        <div class="gold-avatar-frame" style="animation-delay: ${i * 0.15}s">
          <img loading="lazy" src="${src}" alt="${p}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
          <div style="display:none; width:100%; height:100%; border-radius:50%; background:rgba(255,255,255,0.05); align-items:center; justify-content:center; font-size:18px; color:rgba(255,255,255,0.4);">👤</div>
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

window.updateStatHeaderOffset = () => {
  const statHeader = document.querySelector(
    "#view-statistik .header-container",
  );
  if (!statHeader) return;
  const h = statHeader.getBoundingClientRect().height;
  if (h > 0) {
    document.documentElement.style.setProperty(
      "--stat-header-offset",
      `${Math.ceil(h)}px`,
    );
  }
};

function initStatHeaderObserver() {
  const statHeader = document.querySelector(
    "#view-statistik .header-container",
  );
  if (!statHeader) return;
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => {
      window.updateStatHeaderOffset();
    });
    ro.observe(statHeader);
  }
  window.addEventListener("resize", window.updateStatHeaderOffset, {
    passive: true,
  });
  window.updateStatHeaderOffset();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initSecretModeTrigger();
    initStatHeaderObserver();
  });
} else {
  initSecretModeTrigger();
  initStatHeaderObserver();
}
