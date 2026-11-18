/* ==========================================================================
   Billardkrüppel Firebase Service & Cloud Persistence
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD7bNfdV48Setz8aRNd4i3kzKO41kNOHio",
  authDomain: "billardpro-35edb.firebaseapp.com",
  projectId: "billardpro-35edb",
  storageBucket: "billardpro-35edb.firebasestorage.app",
  messagingSenderId: "772454762231",
  appId: "1:772454762231:web:c8fb5794d5af99b045f5f2",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

window.db = db;
window.dbFns = { doc, setDoc, getDoc, updateDoc };

// Aktiver App-Modus ('main' = Hauptliga, 'dt' = Nebenliga)
window.currentAppMode = localStorage.getItem("bk_active_mode") || "main";

window.getDocName = function (baseName) {
  return window.currentAppMode === "dt" ? `${baseName}_DT` : baseName;
};

let statsUnsub = null;
let spielerUnsub = null;
let dailyUnsub = null;
let firebaseReady = false;
let signingIn = false;
let retrySignIn = false;
window.matchWriteInProgress = false;

// Vergleicht Firestore-Daten unabhängig von der Reihenfolge der Objektfelder.
function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}
function sameData(a, b) {
  return JSON.stringify(stableValue(a)) === JSON.stringify(stableValue(b));
}
window.changeStoredMatch = async (mode, index, expected, replacement) => {
  const ref = doc(db, "billard_data", mode === "dt" ? "stats_DT" : "stats");
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const matches = snap.exists() ? snap.data().matches || [] : [];
    if (!expected || !sameData(matches[index], expected)) {
      throw new Error("Das Spiel wurde zwischenzeitlich geändert. Bitte die Liste aktualisieren und erneut versuchen.");
    }
    const next = matches.slice();
    if (replacement === null) next.splice(index, 1);
    else next[index] = replacement;
    tx.set(ref, { matches: next });
  });
};

window.addEventListener("online", () => {
  window.offlineState?.retry();
  if (firebaseReady) subscribeToCollections();
  else if (signingIn) retrySignIn = true;
  else initFirebaseService();
});

function subscribeToCollections() {
  if (statsUnsub) {
    statsUnsub();
    statsUnsub = null;
  }
  if (spielerUnsub) {
    spielerUnsub();
    spielerUnsub = null;
  }
  if (dailyUnsub) {
    dailyUnsub();
    dailyUnsub = null;
  }

  const statsDoc = window.getDocName("stats");
  const spielerDoc = window.getDocName("spieler");
  const dailyDoc = window.getDocName("daily_achivs");

  statsUnsub = onSnapshot(
    doc(db, "billard_data", statsDoc),
    { includeMetadataChanges: true },
    (snap) => {
      window.offlineState?.snapshot("stats", snap.exists() ? snap.data().matches || [] : [], snap.metadata);
      if (snap.metadata.fromCache && window.offlineState?.hasCached("stats")) return;
      window.stats = snap.exists() ? snap.data().matches || [] : [];
      window.flags.stats = true;
      if (typeof window.recalculateAndRender === "function") {
        window.recalculateAndRender();
      }
      if (typeof window.checkAllReadyAndHideLoader === "function") {
        window.checkAllReadyAndHideLoader();
      }
    },
    (err) => {
      console.error(`Firebase Stats Fehler (${statsDoc}):`, err);
      window.offlineState?.error();
      window.flags.stats = true;
      if (typeof window.checkAllReadyAndHideLoader === "function") {
        window.checkAllReadyAndHideLoader();
      }
    },
  );

  spielerUnsub = onSnapshot(
    doc(db, "billard_data", spielerDoc),
    { includeMetadataChanges: true },
    (snap) => {
      let names = snap.exists() ? snap.data().names || [] : [];
      if (window.currentAppMode === "dt") {
        names = [...new Set([...names, "Daniel", "Thorsten", "Sascha"])];
      }
      window.offlineState?.snapshot("spieler", names, snap.metadata);
      if (snap.metadata.fromCache && window.offlineState?.hasCached("spieler")) return;
      window.spieler = names;
      window.flags.spieler = true;
      if (window.updateLoaderStatus)
        window.updateLoaderStatus("Spieler geladen", 60);
      if (typeof window.initDropdowns === "function") window.initDropdowns();
      if (typeof window.generateDynamicAchievements === "function") {
        window.generateDynamicAchievements();
      }
      if (typeof window.recalculateAndRender === "function") {
        window.recalculateAndRender();
      }
      if (typeof window.checkAllReadyAndHideLoader === "function") {
        window.checkAllReadyAndHideLoader();
      }
    },
    (err) => {
      console.error(`Firebase Spieler Fehler (${spielerDoc}):`, err);
      window.offlineState?.error();
      if (window.currentAppMode === "dt") {
        window.spieler = ["Daniel", "Thorsten", "Sascha"];
        window.flags.spieler = true;
        if (typeof window.initDropdowns === "function") window.initDropdowns();
        if (typeof window.recalculateAndRender === "function")
          window.recalculateAndRender();
        if (typeof window.checkAllReadyAndHideLoader === "function")
          window.checkAllReadyAndHideLoader();
      }
    },
  );

  dailyUnsub = onSnapshot(doc(db, "billard_data", dailyDoc), { includeMetadataChanges: true }, (snap) => {
    window.offlineState?.snapshot("daily", snap.exists() ? snap.data() : { days: {} }, snap.metadata);
    if (snap.metadata.fromCache && window.offlineState?.hasCached("daily")) return;
    if (snap.exists()) {
      window.dailyAchivs = snap.data();
    } else {
      window.dailyAchivs = { days: {} };
    }
    if (typeof window.recalculateAndRender === "function") {
      window.recalculateAndRender();
    }
  }, (err) => {
    console.error(`Firebase Tageserfolge Fehler (${dailyDoc}):`, err);
    window.offlineState?.error();
  });

  if (typeof window.updateModeVisuals === "function") {
    window.updateModeVisuals();
  }
}

window.switchAppMode = async function (newMode) {
  if (window.currentAppMode === newMode) return;
  if (window.matchWriteInProgress) {
    window.openErrorModal?.("Bitte warten, bis der Speichervorgang abgeschlossen ist.");
    return;
  }

  window.currentAppMode = newMode;
  localStorage.setItem("bk_active_mode", newMode);
  if (newMode === "dt") {
    const p1El = document.getElementById("p1");
    const p2El = document.getElementById("p2");
    if (p1El) p1El.value = "";
    if (p2El) p2El.value = "";
  }

  // Caches & Daten zurücksetzen
  if (window.careerContextCache) window.careerContextCache = {};
  window.stats = [];
  window.spieler = [];
  window.dailyAchivs = { days: {} };
  window.flags = { stats: false, spieler: false };

  // Loader reaktivieren
  if (typeof window.resetLoaderState === "function") {
    window.resetLoaderState();
  }
  window.offlineState?.start(newMode);
  const l = document.getElementById("loading-overlay");
  const content = document.getElementById("loader-content");
  if (l) {
    l.style.display = "flex";
    l.style.opacity = "1";
    l.style.filter = "none";
    if (content) {
      content.style.transform = "scale(1)";
      content.style.opacity = "1";
    }
    if (window.updateLoaderStatus) {
      window.updateLoaderStatus(
        "Lade " + (newMode === "dt" ? "Nebenliga" : "Hauptliga"),
        25,
      );
    }
  }

  subscribeToCollections();
};

// Firebase Listeners starten
export function initFirebaseService() {
  if (signingIn || firebaseReady) return;
  signingIn = true;
  if (window.updateLoaderStatus)
    window.updateLoaderStatus("Verbinde zur Cloud", 15);

  signInAnonymously(auth)
    .then(() => {
      firebaseReady = true;
      if (window.updateLoaderStatus)
        window.updateLoaderStatus("Synchronisiere Daten", 40);
      subscribeToCollections();
    })
    .catch((err) => {
      console.error("Firebase Login Fehler:", err);
      window.offlineState?.error();
      if (typeof window.hideLoader === "function") window.hideLoader();
    })
    .finally(() => {
      signingIn = false;
      if (retrySignIn && !firebaseReady && navigator.onLine) {
        retrySignIn = false;
        initFirebaseService();
      } else {
        retrySignIn = false;
      }
    });
}

window.doSave = async () => {
  if (window.offlineState && !window.offlineState.canWrite()) return;
  const saveBtn = document.querySelector(".btn-save");
  if (window.matchWriteInProgress || (saveBtn && saveBtn.disabled)) return;

  const m = document.getElementById("mode")?.value || "1:1";
  const b = document.getElementById("breakPlayer")?.value || "";
  const bt1 = document.getElementById("ballType1")?.value || "";
  const bt2 = document.getElementById("ballType2")?.value || "";
  let p1, p2;

  const missingMessages = [];
  const missingElements = [];

  // Alte Highlights entfernen
  if (window.highlightedElements) {
    window.highlightedElements.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.remove("error-highlight");
    });
  }

  const getTN = (a, b) => [a, b].filter(Boolean).join(" & ");
  p1 =
    m === "1:1"
      ? document.getElementById("p1")?.value || ""
      : getTN(
          document.getElementById("t1p1")?.value,
          document.getElementById("t1p2")?.value,
        );
  p2 =
    m === "1:1"
      ? document.getElementById("p2")?.value || ""
      : getTN(
          document.getElementById("t2p1")?.value,
          document.getElementById("t2p2")?.value,
        );

  if (!p1) {
    missingMessages.push(m === "1:1" ? "Spieler 1" : "Team 1");
    missingElements.push(m === "1:1" ? "p1" : "t1p1");
  }
  if (!p2) {
    missingMessages.push(m === "1:1" ? "Spieler 2" : "Team 2");
    missingElements.push(m === "1:1" ? "p2" : "t2p1");
  }
  if (m === "2:2" && p1.split("&").length < 2) {
    missingMessages.push("Team 1 unvollständig");
    missingElements.push("t1p2");
  }
  if (m === "2:2" && p2.split("&").length < 2) {
    missingMessages.push("Team 2 unvollständig");
    missingElements.push("t2p2");
  }

  const playerIds = m === "1:1" ? ["p1", "p2"] : ["t1p1", "t1p2", "t2p1", "t2p2"];
  const selectedPlayers = playerIds.map((id) => document.getElementById(id)?.value).filter(Boolean);
  if (new Set(selectedPlayers).size !== selectedPlayers.length) {
    missingMessages.push("Jeder Spieler darf nur einmal ausgewählt werden");
    missingElements.push(...playerIds);
  }

  if (!b) {
    missingMessages.push("Anstoß");
    missingElements.push("breakPlayer");
  }
  if (!bt1) {
    missingMessages.push("Kugeln Team 1");
    missingElements.push("ballType1");
  }
  if (!bt2) {
    missingMessages.push("Kugeln Team 2");
    missingElements.push("ballType2");
  }
  const wt = document.getElementById("winType")?.value || "";
  if (!wt) {
    missingMessages.push("Sieg-Art");
    missingElements.push("winType");
  }
  const lo = document.getElementById("leftover")?.value;
  if (lo === "" || lo === undefined) {
    missingMessages.push("Restkugeln Verlierer");
    missingElements.push("leftover");
  }
  if (!window.winnerNum) {
    missingMessages.push("Gewinner");
    missingElements.push("btn-win1", "btn-win2");
  }

  if (missingMessages.length > 0) {
    const formattedMsg =
      "Folgende Angaben fehlen:\n\n" +
      missingMessages.map((msg) => "• " + msg).join("\n");
    if (window.openErrorModal)
      window.openErrorModal(formattedMsg, missingElements);
    return;
  }

  if (
    typeof window.processAllStatsChronologically !== "function" ||
    !window.dailyFamePool ||
    !window.spieler ||
    window.spieler.length === 0
  ) {
    if (window.openErrorModal) {
      window.openErrorModal(
        "Die App-Logik wird noch geladen. Bitte kurz warten...",
      );
    }
    return;
  }

  window.matchWriteInProgress = true;
  const saveMode = window.currentAppMode;
  const savePlayers = [...window.spieler];
  if (saveBtn) saveBtn.disabled = true;
  const originalText = saveBtn ? saveBtn.innerText : "Speichern";
  if (saveBtn) saveBtn.innerText = "Speichert...";

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const dStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const totalSeconds = Math.round((window.matchDurationInMinutes || 0) * 60);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  const data = {
    m,
    p1,
    p2,
    w: window.winnerNum,
    t: wt,
    a: b,
    l: parseInt(lo),
    d: dStr,
    bt1,
    bt2,
    duration: Math.round(window.matchDurationInMinutes || 0),
    durationSeconds: totalSeconds,
    durationFormatted: `${pad(mins)}:${pad(secs)}`,
  };

  let saved = false;
  try {
    const isoDay = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const todayStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;
    const statsRef = doc(db, "billard_data", saveMode === "dt" ? "stats_DT" : "stats");
    const dailyRef = doc(db, "billard_data", saveMode === "dt" ? "daily_achivs_DT" : "daily_achivs");
    await runTransaction(db, async (tx) => {
      const statsSnap = await tx.get(statsRef);
      const dailySnap = await tx.get(dailyRef);
      const updatedStats = [...(statsSnap.exists() ? statsSnap.data().matches || [] : []), data];
      const daily = dailySnap.exists() ? dailySnap.data() : { days: {} };
      const todayMatches = updatedStats.filter((g) => {
        const match = String(g?.d || "").match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        return match && Number(match[1]) === now.getDate() &&
          Number(match[2]) === now.getMonth() + 1 && Number(match[3]) === now.getFullYear();
      });
      const procData = window.processAllStatsChronologically(todayMatches, savePlayers, todayStr);
      const existingDayData = daily.days?.[isoDay] || {};
      const dayResults = { ...existingDayData };
      Object.keys(procData.pData).forEach((player) => {
        const d = procData.pData[player];
        const active = [
          ...window.dailyFamePool.filter((ach) => ach.cond(d)),
          ...window.dailyShamePool.filter((ach) => ach.cond(d)),
        ].map((ach) => ach.t);
        const merged = Array.from(new Set([...(existingDayData[player] || []), ...active]));
        if (merged.length) dayResults[player] = merged;
      });
      tx.set(statsRef, { matches: updatedStats });
      if (Object.keys(dayResults).length) {
        tx.set(dailyRef, { ...daily, days: { ...(daily.days || {}), [isoDay]: dayResults } });
      }
    });

    saved = true;
    window.currentSessionDate = todayStr;
    const winnerName = data.w === 1 ? p1 : p2;
    const loserName = data.w === 1 ? p2 : p1;
    const prevMode = m;

    window.winnerNum = 0;
    window.breakLocked = false;
    document
      .querySelectorAll(".win-btn")
      .forEach((btn) => btn.classList.remove("selected"));
    document.querySelectorAll(".player-sel").forEach((sel) => (sel.value = ""));

    // Gewinner als Spieler 1 / Team 1 setzen
    if (prevMode === "1:1") {
      const p1El = document.getElementById("p1");
      if (p1El) p1El.value = winnerName;

      // Folgespiel nur mit Spielern aus dem ausgewählten Abend-Pool besetzen.
      // Bei drei oder mehr Anwesenden rückt ein pausierender Spieler nach;
      // bei nur zwei Anwesenden bleibt der Verlierer als Gegner stehen.
      let pool =
        typeof window.getActiveEveningPlayers === "function"
          ? window.getActiveEveningPlayers()
          : [];
      pool = Array.isArray(pool)
        ? pool.map((name) => String(name).trim()).filter(Boolean)
        : [];

      let nextChallenger = pool.find(
        (name) => name !== winnerName && name !== loserName,
      );
      if (!nextChallenger && pool.includes(loserName)) {
        nextChallenger = loserName;
      }

      // Ohne gepflegten Anwesenheitspool die bisherige Ligalogik beibehalten.
      if (!pool.length && window.currentAppMode === "dt") {
        nextChallenger = (window.spieler || []).find(
          (name) => name !== winnerName && name !== loserName,
        );
      }

      const p2El = document.getElementById("p2");
      if (p2El) p2El.value = nextChallenger || "";
    }

    const breakPlayerEl = document.getElementById("breakPlayer");
    if (breakPlayerEl) breakPlayerEl.value = "";
    const bt1El = document.getElementById("ballType1");
    if (bt1El) bt1El.value = "";
    const bt2El = document.getElementById("ballType2");
    if (bt2El) bt2El.value = "";
    const winTypeEl = document.getElementById("winType");
    if (winTypeEl) winTypeEl.value = "";
    const leftoverEl = document.getElementById("leftover");
    if (leftoverEl) leftoverEl.value = "";

    document
      .querySelectorAll(".ball-type-btn")
      .forEach((b) => b.classList.remove("selected"));
    document
      .querySelectorAll(".win-type-chip")
      .forEach((c) => c.classList.remove("selected"));

    if (window.stopMatchTimer) window.stopMatchTimer();
    const durationDisplay = document.getElementById("matchDurationDisplay");
    if (durationDisplay) durationDisplay.textContent = "00:00";
    window.matchDurationInMinutes = 0;
    if (typeof window.updateUI === "function") window.updateUI();
    if (typeof window.recalculateAndRender === "function") {
      window.recalculateAndRender();
    }
    if (typeof window.updateAllViews === "function") {
      window.updateAllViews();
    }

    const durFormatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")} min`;
    if (window.openSuccessModal) {
      window.openSuccessModal({
        winner: winnerName,
        loser: loserName,
        rest: parseInt(lo, 10) || 0,
        winType: wt,
        mode: prevMode,
        durationFormatted: durFormatted,
      });
    } else if (typeof window.triggerVictoryFx === "function") {
      window.triggerVictoryFx();
    }
  } catch (err) {
    console.error(saved ? "Fehler nach dem Speichern:" : "Firebase Save Error:", err);
    if (window.openErrorModal) {
      window.openErrorModal(saved
        ? "Das Spiel wurde gespeichert. Die Anzeige konnte nicht vollständig aktualisiert werden. Bitte die Seite neu laden und das Spiel nicht erneut speichern."
        : "Fehler beim Speichern:\n" + (err.message || "Unbekannter Fehler"));
    }
  } finally {
    window.matchWriteInProgress = false;
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerText = originalText;
    }
  }
};

window.doDeleteMatch = async () => {
  if (window.offlineState && !window.offlineState.canWrite()) return;
  if (window.matchWriteInProgress || window.matchToDeleteIndex < 0 || !window.matchToDeleteTarget) return;
  window.matchWriteInProgress = true;
  try {
    const target = window.matchToDeleteTarget;
    if (target.mode !== window.currentAppMode) throw new Error("Die Liga wurde gewechselt. Bitte das Spiel erneut auswählen.");
    await window.changeStoredMatch(target.mode, target.index, target.match, null);
    if (window.closeDeleteConfirmModal) window.closeDeleteConfirmModal();
  } catch (err) {
    console.error("Fehler beim Löschen:", err);
    window.openErrorModal?.("Fehler beim Löschen:\n" + (err.message || "Unbekannter Fehler"));
  } finally {
    window.matchWriteInProgress = false;
  }
};

window.openSyncConfirmModal = () => {
  const modal = document.getElementById("syncConfirmModal");
  if (modal) modal.style.display = "flex";
};

window.closeSyncConfirmModal = () => {
  const modal = document.getElementById("syncConfirmModal");
  if (modal) modal.style.display = "none";
};

window.doRetroSync = () => {
  window.closeSyncConfirmModal();
  window.syncDailyAchievementsWithHistory(true);
};

window.syncDailyAchievementsWithHistory = async function (
  bypassConfirm = false,
) {
  if (window.offlineState && !window.offlineState.canWrite()) return;
  if (
    !window.stats ||
    !window.spieler ||
    !window.dailyFamePool ||
    !window.dailyShamePool
  ) {
    if (window.openErrorModal)
      window.openErrorModal("Daten noch nicht geladen. Bitte kurz warten.");
    return;
  }

  if (!bypassConfirm) {
    if (typeof window.closeAchListModal === "function")
      window.closeAchListModal();
    if (typeof window.openSyncConfirmModal === "function")
      window.openSyncConfirmModal();
    return;
  }

  if (window.matchWriteInProgress) return;
  const syncMode = window.currentAppMode;
  const expectedStats = JSON.parse(JSON.stringify(window.stats));
  const expectedDaily = window.offlineState?.confirmedValue("daily") || JSON.parse(JSON.stringify(window.dailyAchivs || { days: {} }));
  const matchesByDate = {};
  expectedStats.forEach((g) => {
    if (!g.d) return;
    const dateStr = g.d.split(",")[0].trim();
    if (!matchesByDate[dateStr]) matchesByDate[dateStr] = [];
    matchesByDate[dateStr].push(g);
  });

  const newDailyDays = {};

  for (const dateStr in matchesByDate) {
    const matches = matchesByDate[dateStr];
    const parts = dateStr.split(".");
    if (parts.length < 3) continue;

    const yyyy = parts[2];
    const mm = parts[1].padStart(2, "0");
    const dd = parts[0].padStart(2, "0");
    const isoDate = `${yyyy}-${mm}-${dd}`;

    // Erfolge nach jedem Spiel prüfen, damit vorübergehend erreichte Erfolge erhalten bleiben.
    for (let i = 0; i < matches.length; i++) {
      const dayProc = window.processData(matches.slice(0, i + 1), dateStr);
      Object.keys(dayProc.pData).forEach((player) => {
        const d = dayProc.pData[player];
        const earned = [
          ...window.dailyFamePool.filter((ach) => ach.cond(d)),
          ...window.dailyShamePool.filter((ach) => ach.cond(d)),
        ].map((ach) => ach.t);
        if (earned.length) {
          if (!newDailyDays[isoDate]) newDailyDays[isoDate] = {};
          const existing = newDailyDays[isoDate][player] || [];
          newDailyDays[isoDate][player] = Array.from(new Set([...existing, ...earned]));
        }
      });
    }
  }

  window.matchWriteInProgress = true;
  try {
    const statsRef = doc(db, "billard_data", syncMode === "dt" ? "stats_DT" : "stats");
    const dailyRef = doc(db, "billard_data", syncMode === "dt" ? "daily_achivs_DT" : "daily_achivs");
    await runTransaction(db, async (tx) => {
      const statsSnap = await tx.get(statsRef);
      const dailySnap = await tx.get(dailyRef);
      const stats = statsSnap.exists() ? statsSnap.data().matches || [] : [];
      const daily = dailySnap.exists() ? dailySnap.data() : { days: {} };
      if (!sameData(stats, expectedStats) || !sameData(daily, expectedDaily)) {
        throw new Error("Die Daten wurden zwischenzeitlich geändert. Bitte erneut synchronisieren.");
      }
      tx.set(dailyRef, { ...daily, days: newDailyDays });
    });
    if (window.openSuccessModal) window.openSuccessModal();
    if (window.recalculateAndRender) window.recalculateAndRender();
  } catch (err) {
    console.error("Sync Error:", err);
    if (window.openErrorModal) {
      window.openErrorModal("Fehler bei der Synchronisierung:\n" + err.message);
    }
  } finally {
    window.matchWriteInProgress = false;
  }
};

window.forceUpdate = () => {
  const modal = document.getElementById("confirmModal");
  if (modal) modal.style.display = "flex";
};

window.closeConfirmModal = () => {
  const modal = document.getElementById("confirmModal");
  if (modal) modal.style.display = "none";
};

window.doForceUpdate = async () => {
  if ("caches" in window) {
    const keys = await caches.keys();
    for (const key of keys) {
      await caches.delete(key);
    }
  }
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  }
  const url = window.location.href.split("?")[0];
  window.location.href = url + "?u=" + Date.now();
};
