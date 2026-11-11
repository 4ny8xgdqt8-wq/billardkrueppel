/* Verbindungsstatus und lokal gespeicherte, serverbestätigte Daten je Liga. */
(() => {
  let mode = "main";
  let confirmed = new Set();
  let failed = false;
  let cached = {};
  const key = () => `bk_offline_snapshot_${mode}`;

  function read() {
    try { return JSON.parse(localStorage.getItem(key()) || "{}"); }
    catch (_) { return {}; }
  }
  function render() {
    const el = document.getElementById("connection-status");
    if (!el) return;
    const dates = [cached.stats?.at, cached.spieler?.at].filter(Boolean);
    const last = dates.length === 2 ? Math.min(...dates) : null;
    let label;
    if (!navigator.onLine) label = "Offline";
    else if (failed) label = "Synchronisierung fehlgeschlagen";
    else if (confirmed.has("stats") && confirmed.has("spieler") && confirmed.has("daily")) label = "Online · synchronisiert";
    else label = "Verbindung wird synchronisiert";
    if (last && (failed || !navigator.onLine || confirmed.size < 3)) {
      label += " · Stand: " + new Date(last).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
    } else if (!last && (failed || !navigator.onLine)) label += " · Keine gespeicherten Daten";
    el.textContent = label;
    el.dataset.state = !navigator.onLine ? "offline" : failed ? "error" : confirmed.size === 3 ? "online" : "syncing";
  }
  function applyCache() {
    if (cached.stats && Array.isArray(cached.stats.value)) {
      window.stats = cached.stats.value;
      window.flags.stats = true;
    }
    if (cached.spieler && Array.isArray(cached.spieler.value)) {
      window.spieler = cached.spieler.value;
      window.flags.spieler = true;
    }
    if (cached.daily?.value) window.dailyAchivs = cached.daily.value;
    if (window.flags.spieler && typeof window.initDropdowns === "function") window.initDropdowns();
    if (window.flags.spieler && typeof window.generateDynamicAchievements === "function") window.generateDynamicAchievements();
    if (typeof window.recalculateAndRender === "function") window.recalculateAndRender();
  }
  window.offlineState = {
    start(nextMode) {
      mode = nextMode === "dt" ? "dt" : "main";
      confirmed = new Set(); failed = false; cached = read();
      applyCache(); render();
    },
    hasCached(name) { return !!cached[name]; },
    retry() { confirmed.clear(); failed = false; render(); },
    snapshot(name, value, metadata) {
      if (metadata.fromCache || metadata.hasPendingWrites) {
        confirmed.delete(name);
      } else {
        confirmed.add(name);
        const next = { ...cached, [name]: { value, at: Date.now() } };
        try {
          localStorage.setItem(key(), JSON.stringify(next));
          cached = next;
        } catch (_) { /* Speicher kann voll oder gesperrt sein. */ }
      }
      render();
    },
    error() { failed = true; render(); },
    canWrite() {
      if (navigator.onLine && !failed && confirmed.has("stats") && confirmed.has("spieler") && confirmed.has("daily")) return true;
      if (typeof window.openErrorModal === "function") window.openErrorModal("Änderungen sind erst möglich, wenn die Verbindung wiederhergestellt und die Liga synchronisiert ist.");
      return false;
    },
  };
  window.addEventListener("offline", () => { confirmed.clear(); render(); });
  window.addEventListener("online", () => { confirmed.clear(); render(); });
})();
