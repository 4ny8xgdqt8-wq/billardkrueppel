/* ==========================================================================
   Billardkrüppel Firebase Service & Cloud Persistence
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

// Firebase Listeners starten
export function initFirebaseService() {
  if (window.updateLoaderStatus) window.updateLoaderStatus("Verbinde zur Cloud", 15);

  signInAnonymously(auth)
    .then(() => {
      if (window.updateLoaderStatus) window.updateLoaderStatus("Synchronisiere Daten", 40);

      onSnapshot(
        doc(db, "billard_data", "stats"),
        (snap) => {
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
          console.error("Firebase Stats Fehler:", err);
          window.flags.stats = true;
          if (typeof window.checkAllReadyAndHideLoader === "function") {
            window.checkAllReadyAndHideLoader();
          }
        },
      );

      onSnapshot(
        doc(db, "billard_data", "spieler"),
        (snap) => {
          window.spieler = snap.exists() ? snap.data().names || [] : [];
          window.flags.spieler = true;
          if (window.updateLoaderStatus) window.updateLoaderStatus("Spieler geladen", 60);
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
        (err) => console.error("Firebase Spieler Fehler:", err),
      );

      onSnapshot(doc(db, "billard_data", "daily_achivs"), (snap) => {
        if (snap.exists()) {
          window.dailyAchivs = snap.data();
          if (typeof window.recalculateAndRender === "function") {
            window.recalculateAndRender();
          }
        }
      });
    })
    .catch((err) => {
      console.error("Firebase Login Fehler:", err);
      if (typeof window.hideLoader === "function") window.hideLoader();
    });
}

window.doSave = async () => {
  const saveBtn = document.querySelector(".btn-save");
  if (saveBtn && saveBtn.disabled) return;

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
    if (window.openErrorModal) window.openErrorModal(formattedMsg, missingElements);
    return;
  }

  if (
    typeof window.processAllStatsChronologically !== "function" ||
    !window.dailyFamePool ||
    !window.spieler ||
    window.spieler.length === 0
  ) {
    if (window.openErrorModal) {
      window.openErrorModal("Die App-Logik wird noch geladen. Bitte kurz warten...");
    }
    return;
  }

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

  try {
    const isoDay = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const todayStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;
    const updatedStats = [...(window.stats || []), data];

    const isSameDay = (dateString, refDate) => {
      const match = String(dateString || "").match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      if (!match) return false;
      return (
        parseInt(match[1], 10) === refDate.getDate() &&
        parseInt(match[2], 10) === refDate.getMonth() + 1 &&
        parseInt(match[3], 10) === refDate.getFullYear()
      );
    };

    // 1. Match in der Cloud speichern
    window.stats = updatedStats;
    await setDoc(doc(db, "billard_data", "stats"), { matches: updatedStats });

    // 2. Tageserfolge berechnen und mergen
    try {
      const todayMatches = updatedStats.filter((g) => g && g.d && isSameDay(g.d, now));
      const procData = window.processAllStatsChronologically(
        todayMatches,
        window.spieler,
        todayStr,
      );
      const dayResults = {};
      const existingDayData =
        window.dailyAchivs && window.dailyAchivs.days && window.dailyAchivs.days[isoDay]
          ? window.dailyAchivs.days[isoDay]
          : {};

      Object.keys(procData.pData).forEach((player) => {
        const d = procData.pData[player];
        const active = [
          ...window.dailyFamePool.filter((ach) => ach.cond(d)),
          ...window.dailyShamePool.filter((ach) => ach.cond(d)),
        ].map((ach) => ach.t);

        const existingForPlayer = existingDayData[player] || [];
        const merged = Array.from(new Set([...existingForPlayer, ...active]));
        if (merged.length > 0) dayResults[player] = merged;
      });

      const finalDayResults = { ...existingDayData, ...dayResults };
      if (Object.keys(finalDayResults).length > 0) {
        const newDaily = { days: {}, ...window.dailyAchivs };
        newDaily.days[isoDay] = finalDayResults;
        await setDoc(doc(db, "billard_data", "daily_achivs"), newDaily);
      }
    } catch (achErr) {
      console.warn("Erfolge konnten nicht aktualisiert werden, Match wurde aber gespeichert:", achErr);
    }

    const winnerName = window.winnerNum === 1 ? p1 : p2;
    const prevMode = m;

    window.winnerNum = 0;
    window.breakLocked = false;
    document.querySelectorAll(".win-btn").forEach((btn) => btn.classList.remove("selected"));
    document.querySelectorAll(".player-sel").forEach((sel) => (sel.value = ""));

    // Gewinner als Spieler 1 / Team 1 setzen
    if (prevMode === "1:1") {
      const p1El = document.getElementById("p1");
      if (p1El) p1El.value = winnerName;
    } else {
      const names = (winnerName || "").split(" & ").map((n) => n.trim());
      if (names.length === 2) {
        const t1p1 = document.getElementById("t1p1");
        const t1p2 = document.getElementById("t1p2");
        if (t1p1) t1p1.value = names[0];
        if (t1p2) t1p2.value = names[1];
      }
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

    document.querySelectorAll(".ball-type-btn").forEach((b) => b.classList.remove("selected"));
    document.querySelectorAll(".win-type-chip").forEach((c) => c.classList.remove("selected"));

    if (window.stopMatchTimer) window.stopMatchTimer();
    const durationDisplay = document.getElementById("matchDurationDisplay");
    if (durationDisplay) durationDisplay.textContent = "00:00";
    window.matchDurationInMinutes = 0;
    if (typeof window.updateUI === "function") window.updateUI();

    if (window.openSuccessModal) window.openSuccessModal();

    if (typeof confetti === "function") {
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#ffcc00", "#34c759", "#ffffff"],
          zIndex: 99999,
        });
      }, 50);
    }
  } catch (err) {
    console.error("Firebase Save Error:", err);
    if (window.openErrorModal) {
      window.openErrorModal("Fehler beim Speichern:\n" + (err.message || "Unbekannter Fehler"));
    }
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerText = originalText;
    }
  }
};

window.doDeleteMatch = async () => {
  if (window.matchToDeleteIndex === -1 || window.matchToDeleteIndex === undefined) return;
  window.stats.splice(window.matchToDeleteIndex, 1);
  await setDoc(doc(db, "billard_data", "stats"), { matches: window.stats });
  if (window.closeDeleteConfirmModal) window.closeDeleteConfirmModal();
  if (typeof window.updateAllViews === "function") window.updateAllViews();
};

window.syncDailyAchievementsWithHistory = async function (bypassConfirm = false) {
  if (!window.stats || !window.spieler || !window.dailyFamePool || !window.dailyShamePool) {
    if (window.openErrorModal) window.openErrorModal("Daten noch nicht geladen. Bitte kurz warten.");
    return;
  }

  if (!bypassConfirm) {
    if (typeof window.closeAchListModal === "function") window.closeAchListModal();
    if (typeof window.openSyncConfirmModal === "function") window.openSyncConfirmModal();
    return;
  }

  const matchesByDate = {};
  window.stats.forEach((g) => {
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

    const dayProc = window.processData(matches, dateStr);

    Object.keys(dayProc.pData).forEach((player) => {
      const d = dayProc.pData[player];
      const earned = [
        ...window.dailyFamePool.filter((ach) => ach.cond(d)),
        ...window.dailyShamePool.filter((ach) => ach.cond(d)),
      ].map((ach) => ach.t);

      if (earned.length > 0) {
        if (!newDailyDays[isoDate]) newDailyDays[isoDate] = {};
        const existing = newDailyDays[isoDate][player] || [];
        newDailyDays[isoDate][player] = Array.from(new Set([...existing, ...earned]));
      }
    });
  }

  try {
    await setDoc(doc(db, "billard_data", "daily_achivs"), { days: newDailyDays });
    if (window.openSuccessModal) window.openSuccessModal();
    if (window.recalculateAndRender) window.recalculateAndRender();
  } catch (err) {
    console.error("Sync Error:", err);
    if (window.openErrorModal) {
      window.openErrorModal("Fehler bei der Synchronisierung:\n" + err.message);
    }
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

