/* ==========================================================================
   Billardkrüppel Match Controller, Form Handling, Timer & AI Coach
   ========================================================================== */

window.lastMode = "1:1";
window.winnerNum = 0;
window.breakLocked = false;
window.matchTimerInterval = null;
window.matchStartTime = null;
window.matchDurationInMinutes = 0;
window.highlightedElements = [];
window.matchToDeleteIndex = -1;


      window.updateAvatarPreviews = () => {
        const ids = ["p1", "p2", "t1p1", "t1p2", "t2p1", "t2p2", "breakPlayer"];
        ids.forEach((id) => {
          const sel = document.getElementById(id);
          const preview = document.getElementById(id + "-avatar-preview");
          if (!sel || !preview) return;

          const val = sel.value;
          const names = val ? val.split(" & ").map((n) => n.trim()) : [null];
          const size = id.startsWith("t") ? 36 : 40; // 36px für Teams, 40px für 1v1 & Anstoß

          preview.innerHTML = names
            .map((n, idx) => {
              const silhouette = `<div style="width:${size}px; height:${size}px; min-width:${size}px; border-radius:10px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; font-size:${size * 0.5}px; border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.2);">👤</div>`;
              if (!n) return silhouette;

              const src =
                window.getAvatarUrl && typeof window.getAvatarUrl === "function"
                  ? window.getAvatarUrl(n)
                  : `avatars/${n}.png`;

              // Zeige animierte Umrandung, wenn Spieler auf einer Siegesserie ist
              const streakClass = (window.careerStats && window.careerStats.pData && window.careerStats.pData[n] && window.careerStats.pData[n].currentStreak >= 1) ? 'streak-fire' : '';

              return `<div class="avatar-frame ${streakClass}" style="position:relative; width:${size}px; height:${size}px; min-width:${size}px;">
                        <img loading="lazy" src="${src}" onerror="this.style.display='none'" style="width:${size}px; height:${size}px; border-radius:10px; object-fit:cover;">
                      </div>`;
            })
            .join("");
        });
      };



      window.startMatchTimer = () => {
        if (window.matchTimerInterval) return; // Timer läuft bereits

        window.matchStartTime = new Date();
        const display = document.getElementById("matchDurationDisplay");

        window.matchTimerInterval = setInterval(() => {
          const now = new Date();
          const elapsed = Math.floor((now - window.matchStartTime) / 1000);
          const minutes = Math.floor(elapsed / 60);
          const seconds = elapsed % 60;
          window.matchDurationInMinutes = minutes + seconds / 60;

          if (display) {
            display.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
          }
        }, 1000);
      };

      window.stopMatchTimer = () => {
        if (window.matchTimerInterval) {
          clearInterval(window.matchTimerInterval);
          window.matchTimerInterval = null;
        }
        window.matchStartTime = null;
      };



      window.openSuccessModal = () => {
        document.getElementById("successModal").style.display = "flex";
      };

      window.closeSuccessModal = () => {
        document.getElementById("successModal").style.display = "none";
      };

      window.closePlayerProfileModal = () => {
        document.getElementById("playerProfileModal").style.display = "none";
      };

      window.closeDiceModal = () => {
        document.getElementById("diceModal").style.display = "none";
      };

      window.highlightedElements = []; // Global array to keep track of highlighted elements

      window.openErrorModal = (
        msg,
        elementIdsToHighlight = [],
        title = "Etwas fehlt!",
        icon = "⚠️",
      ) => {
        const modal = document.getElementById("errorModal");
        document.getElementById("errorModalIcon").innerText = icon;
        const titleEl = document.getElementById("errorModalTitle");
        titleEl.innerText = title;
        titleEl.style.color = "var(--error)"; // Standardfarbe zurücksetzen

        // Button & Text Styles zurücksetzen (falls vorher Info-Modus aktiv war)
        const btn = modal.querySelector(".btn-save");
        btn.style.background = "var(--error)";
        btn.style.color = "#fff";
        document.getElementById("errorModalText").style.fontSize = "14px";

        document.getElementById("errorModalText").innerText = msg;
        modal.style.display = "flex";

        // Shake Animation triggern
        const card = modal.querySelector(".modal-card");
        card.style.animation = "none";
        card.offsetHeight; // Reflow
        card.style.animation = "modal-shake 0.4s ease-in-out";

        // Clear previous highlights
        window.highlightedElements.forEach((id) => {
          const el = document.getElementById(id);
          if (el) {
            el.classList.remove("error-highlight");
            let prev = el.previousElementSibling;
            if (prev && prev.tagName === "LABEL") prev.style.color = "";
            let pPrev = el.parentElement.previousElementSibling;
            if (pPrev && pPrev.tagName === "LABEL") pPrev.style.color = "";
          }
        });
        window.highlightedElements = [];

        // Apply new highlights
        elementIdsToHighlight.forEach((id) => {
          const el = document.getElementById(id);
          if (el) {
            el.classList.add("error-highlight");
            window.highlightedElements.push(id);

            // Das zugehörige Label ebenfalls rot einfärben
            let prev = el.previousElementSibling;
            if (prev && prev.tagName === "LABEL")
              prev.style.color = "var(--error)";
            let pPrev = el.parentElement.previousElementSibling;
            if (pPrev && pPrev.tagName === "LABEL")
              pPrev.style.color = "var(--error)";
          }
        });
      };

      window.showDailyWinnerInfo = () => {
        const msg =
          `Der Tagessieger (Session-MVP) wird durch Leistungspunkte ermittelt:\n\n` +
          `🕹️ Pro Spiel: +1 (Teilnahme)\n` +
          `🏆 Pro Sieg: +3\n` +
          `📉 Pro Niederlage: -1\n` +
          `🎯 Regulärer Sieg: +1\n` +
          `⚡ Break-Sieg: +3\n` +
          `🥶 Clutch (Gegner Rest 1): +2\n` +
          `🕯️ Knappe Niederlage (Du Rest 1): +1\n` +
          `🔥 Längste Serie: +1 pro Sieg in Serie\n` +
          `🕵️ Service-Klau: +2 (Sieg bei Gegner-Anstoß)\n` +
          `🪓 Dominanz: +0.5 pro Ø Restkugel (Sieg)\n` +
          `🗡️ Nemesis besiegt: +4\n` +
          `🏆 Fame Achievement: +2\n\n` +
          `Abzüge:\n` +
          `🐀 Sieg durch Foul: -1\n` +
          `🤦 8er-Fehler: -2\n` +
          `💀 Shame Achievement: -2\n` +
          `🧟 Hoher Ø Rest bei Niederlage: -0.25 pro Ø Restkugel`;
        window.openErrorModal(msg, [], "Punkte-Logik", "🏆");
        document.getElementById("errorModalTitle").style.color =
          "var(--accent)";
        document.querySelector("#errorModal .btn-save").style.background =
          "var(--accent)";
        document.querySelector("#errorModal .btn-save").style.color = "#000";
        document.querySelector("#errorModalText").style.fontSize = "12px";
      };

      window.removeHighlight = (id) => {
        const el = document.getElementById(id);
        if (el && el.classList.contains("error-highlight")) {
          el.classList.remove("error-highlight");
          let prev = el.previousElementSibling;
          if (prev && prev.tagName === "LABEL") prev.style.color = "";
          let pPrev = el.parentElement.previousElementSibling;
          if (pPrev && pPrev.tagName === "LABEL") pPrev.style.color = "";
          window.highlightedElements = window.highlightedElements.filter(
            (hid) => hid !== id,
          );
        }
      };

      window.closeErrorModal = () => {
        document.getElementById("errorModal").style.display = "none";
      };



      window.openDeleteConfirmModal = (index) => {
        window.matchToDeleteIndex = index;
        document.getElementById("deleteConfirmModal").style.display = "flex";
      };

      window.closeDeleteConfirmModal = () => {
        window.matchToDeleteIndex = -1;
        document.getElementById("deleteConfirmModal").style.display = "none";
      };



      window.getBallIcon = (type, size = 15) => {
        if (type === "Voll")
          return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="margin-right:4px; display:inline-block; vertical-align:middle; filter:drop-shadow(0 2px 3px rgba(0,0,0,0.5)); flex-shrink:0;"><defs><radialGradient id="gradVoll3D" cx="30%" cy="25%" r="65%"><stop offset="0%" stop-color="#fffbe6"/><stop offset="20%" stop-color="#ffd700"/><stop offset="70%" stop-color="#d49200"/><stop offset="100%" stop-color="#543800"/></radialGradient></defs><circle cx="12" cy="12" r="11" fill="url(#gradVoll3D)"/><ellipse cx="8.5" cy="7" rx="3" ry="2" fill="#ffffff" opacity="0.6" transform="rotate(-20 8.5 7)"/></svg>`;
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="margin-right:4px; display:inline-block; vertical-align:middle; filter:drop-shadow(0 2px 3px rgba(0,0,0,0.5)); flex-shrink:0;"><defs><radialGradient id="gradHalbBase3D" cx="30%" cy="25%" r="65%"><stop offset="0%" stop-color="#ffffff"/><stop offset="60%" stop-color="#e2e8f0"/><stop offset="100%" stop-color="#64748b"/></radialGradient><radialGradient id="gradHalbStripe3D" cx="30%" cy="25%" r="65%"><stop offset="0%" stop-color="#7fe3ff"/><stop offset="35%" stop-color="#00a6ff"/><stop offset="85%" stop-color="#005db3"/><stop offset="100%" stop-color="#002b54"/></radialGradient><clipPath id="clipHalb3D"><circle cx="12" cy="12" r="11"/></clipPath></defs><circle cx="12" cy="12" r="11" fill="url(#gradHalbBase3D)"/><path d="M 1 7.5 Q 12 12 23 7.5 L 23 16.5 Q 12 21 1 16.5 Z" fill="url(#gradHalbStripe3D)" clip-path="url(#clipHalb3D)"/><ellipse cx="8.5" cy="7" rx="3" ry="2" fill="#ffffff" opacity="0.6" transform="rotate(-20 8.5 7)"/></svg>`;
      };



      window.selectWinner = (n) => {
        window.winnerNum = n;
        document
          .getElementById("btn-win1")
          .classList.toggle("selected", n === 1);
        document
          .getElementById("btn-win2")
          .classList.toggle("selected", n === 2);
        window.removeHighlight("btn-win1");
        window.removeHighlight("btn-win2");
        // Timer anhalten, sobald ein Gewinner ausgewählt wurde
        if (typeof window.stopMatchTimer === "function") window.stopMatchTimer();
        window.openResultModal();
      };



      window.initDropdowns = () => {
        document.querySelectorAll(".player-sel").forEach((s) => {
          s.innerHTML = '<option disabled selected value="">Wählen</option>';
          window.spieler.forEach((p) => s.options.add(new Option(p, p)));
          s.onchange = () => {
            window.breakLocked = false;
            window.winnerNum = 0;
            document
              .querySelectorAll(".win-btn")
              .forEach((btn) => btn.classList.remove("selected"));
            // Timer stoppen und zurücksetzen, wenn ein Spieler geändert wird
            if (typeof window.stopMatchTimer === "function") window.stopMatchTimer();
            window.matchDurationInMinutes = 0;
            const display = document.getElementById("matchDurationDisplay");
            if (display) display.textContent = "00:00";
            if (typeof window.updateUI === "function") window.updateUI();
          };
        });
        if (typeof window.initResultUI === "function") window.initResultUI(); // Neue UI initialisieren
        if (typeof window.updateAvatarPreviews === "function")
          window.updateAvatarPreviews();
        if (typeof window.updateUI === "function") window.updateUI(); // updateUI ruft updateMatchProbability auf, das computeEloRatings braucht
      };

      window.openTeamModal = () => {
        const mode = document.getElementById("mode").value;
        let currentlySelectedPlayers = [];
        if (mode === "1:1") {
          currentlySelectedPlayers.push(
            document.getElementById("p1").value.trim(),
          );
          currentlySelectedPlayers.push(
            document.getElementById("p2").value.trim(),
          );
        } else {
          // 2:2
          currentlySelectedPlayers.push(
            document.getElementById("t1p1").value.trim(),
          );
          currentlySelectedPlayers.push(
            document.getElementById("t1p2").value.trim(),
          );
          currentlySelectedPlayers.push(
            document.getElementById("t2p1").value.trim(),
          );
          currentlySelectedPlayers.push(
            document.getElementById("t2p2").value.trim(),
          );
        }
        currentlySelectedPlayers = currentlySelectedPlayers.filter(Boolean); // Filtert leere Strings heraus

        const container = document.getElementById("teamPlayerList");
        container.innerHTML = window.spieler
          .map((p) => {
            const isSelected = currentlySelectedPlayers.includes(
              String(p).trim(),
            );
            return `
                    <label style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; padding:16px; background:${isSelected ? "rgba(52,199,89,0.12)" : "rgba(255,255,255,0.03)"}; border-radius:18px; cursor: pointer; border: 1px solid ${isSelected ? "#34c759" : "rgba(255,255,255,0.1)"}; transition: all 0.2s ease;">
                        <input type="checkbox" value="${p}" class="team-p-check" style="display:none;" onchange="this.parentElement.style.background=this.checked?'rgba(52,199,89,0.12)':'rgba(255,255,255,0.03)'; this.parentElement.style.borderColor=this.checked?'#34c759':'rgba(255,255,255,0.1)'; this.parentElement.querySelector('.check-mark').style.opacity=this.checked?'1':'0.1';" ${isSelected ? "checked" : ""}> 
                        <div style="display:flex; align-items:center; gap:12px;">
                            <img loading="lazy" src="${window.getAvatarUrl ? window.getAvatarUrl(p) : `avatars/${p}.png`}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex'" style="width:32px; height:32px; border-radius:50%; object-fit:cover; border: 1px solid rgba(255,255,255,0.1);">
                            <div style="display:none; width:32px; height:32px; border-radius:50%; background:rgba(255,255,255,0.1); align-items:center; justify-content:center; font-size:18px; border:1px solid rgba(255,255,255,0.1);">👤</div>
                            <span style="font-size:16px; font-weight:800; color: #fff;">${p}</span>
                        </div>
                        <span class="check-mark" style="font-size:20px; color:#34c759; opacity:${isSelected ? "1" : "0.1"}; transition: opacity 0.2s;">✓</span>
                    </label>
                `;
          })
          .join("");
        document.getElementById("teamModal").style.display = "flex";
      };

      window.closeTeamModal = () => {
        document.getElementById("teamModal").style.display = "none";
      };

      window.generateRandomMatch = () => {
        const checks = document.querySelectorAll(".team-p-check:checked");
        const selected = Array.from(checks).map((c) => c.value);
        const mode = document.getElementById("mode").value;

        if (mode === "1:1" && selected.length < 2)
          return alert("Bitte mindestens 2 Spieler wählen!");
        if (mode === "2:2" && selected.length < 4)
          return alert("Bitte mindestens 4 Spieler wählen!");

        // Shuffle selected players
        const shuffled = selected.sort(() => 0.5 - Math.random());

        if (mode === "1:1") {
          document.getElementById("p1").value = shuffled[0];
          document.getElementById("p2").value = shuffled[1];
        } else {
          document.getElementById("t1p1").value = shuffled[0];
          document.getElementById("t1p2").value = shuffled[1];
          document.getElementById("t2p1").value = shuffled[2];
          document.getElementById("t2p2").value = shuffled[3];
        }
        if (typeof window.updateUI === "function") window.updateUI();
        window.closeTeamModal();
      };

      window.updateUI = () => {
        const currentMode = document.getElementById("mode").value;

        // Reset state only when mode changes
        if (window.lastMode !== currentMode) {
          window.winnerNum = 0;
          window.breakLocked = false;
          document
            .querySelectorAll(".win-btn")
            .forEach((b) => b.classList.remove("selected"));
          document.getElementById("breakPlayer").value = "";
          document.getElementById("ballType1").value = "";
          document.getElementById("ballType2").value = "";
          document.getElementById("winType").value = "";
          document.getElementById("leftover").value = "";
          window.lastMode = currentMode;
        }
      if (currentMode !== window.lastMode) window.stopMatchTimer();

        const m = document.getElementById("mode").value;
        const saveBtn = document.querySelector(".btn-save");
        const playersReady =
          m === "1:1"
            ? document.getElementById("p1").value &&
              document.getElementById("p2").value
            : document.getElementById("t1p1").value &&
              document.getElementById("t1p2").value &&
              document.getElementById("t2p1").value &&
              document.getElementById("t2p2").value;
        const winnerSelected = window.winnerNum !== 0;

        // --- Phasensteuerung ---
        const phase2 = document.getElementById("phase-2-gamestart");
        const phase3 = document.getElementById("phase-3-result");

        if (phase2) phase2.style.display = playersReady ? "block" : "none";
        if (phase2)
          phase2.style.animation = playersReady
            ? "ach-card-enter 0.5s ease-out forwards"
            : "none";

        // ELO-Box nur anzeigen, wenn Spieler bereit sind
        const probBox = document.getElementById("match-prob");
        if (probBox) {
          probBox.style.display = playersReady ? "block" : "none";
        }

        // --- Steuerung der neuen Phase 3 UI ---
        if (
          winnerSelected &&
          document.getElementById("resultModal").style.display !== "flex"
        ) {
          const winnerName =
            window.winnerNum === 1
              ? document.getElementById("p1").value ||
                getTN(
                  document.getElementById("t1p1").value,
                  document.getElementById("t1p2").value,
                )
              : document.getElementById("p2").value ||
                getTN(
                  document.getElementById("t2p1").value,
                  document.getElementById("t2p2").value,
                );
          const ballLabel = document.getElementById("winnerBallTypeLabel");
          if (ballLabel)
            ballLabel.innerText = `Gewinner-Kugel auswählen für ${winnerName}`;
        }

        // Cinematic Greeting
        const hours = new Date().getHours();
        const greeting =
          hours < 11
            ? "Guten Morgen"
            : hours < 18
              ? "Guten Tag"
              : "Guten Abend";
        const greetEl = document.getElementById("dynamic-greeting");
        if (greetEl) greetEl.innerText = greeting + ", Zeit für ein Match?";

        const diceBtn = document.getElementById("btn-breakcalc");
        // Fehler-Markierung beim Anstoß entfernen, wenn Spieler neu gewählt werden
        window.removeHighlight("breakPlayer");

        // Deaktiviere den Button für Zufallsteams, wenn heute bereits ein Match in der Historie steht
        const now = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const todayStr = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;
        const hasTodayMatch = (window.stats || []).some(
          (g) => g && g.d && g.d.startsWith(todayStr),
        );
        const randomBtn = document.getElementById("btn-random-teams");
        if (randomBtn) {
          randomBtn.disabled = hasTodayMatch;
          randomBtn.style.opacity = hasTodayMatch ? "0.2" : "1";
          randomBtn.style.pointerEvents = hasTodayMatch ? "none" : "auto";
        }

        const ui11 = document.getElementById("ui-1-1");
        const ui22 = document.getElementById("ui-2-2");
        if (ui11) ui11.style.display = m === "1:1" ? "flex" : "none";
        if (ui22) ui22.style.display = m === "2:2" ? "flex" : "none";

        const getTN = (a, b) => (a && b ? a + " & " + b : a || b || "");
        const n1 =
          m === "1:1"
            ? document.getElementById("p1").value
            : getTN(
                document.getElementById("t1p1").value,
                document.getElementById("t1p2").value,
              );
        const n2 =
          m === "1:1"
            ? document.getElementById("p2").value
            : getTN(
                document.getElementById("t2p1").value,
                document.getElementById("t2p2").value,
              );
        document.getElementById("btn-win1").innerText = n1 || "Spieler 1";
        document.getElementById("btn-win2").innerText = n2 || "Spieler 2";

        // Dropdown für Anstoßspieler immer neu befüllen, außer wenn der Anstoß bereits "gelockt" ist.
        const b = document.getElementById("breakPlayer");
        const currentBreakPlayer = b.value; // Wert vor dem Leeren sichern
        b.innerHTML = '<option value="" selected disabled>Wählen</option>';
        const names = m === "1:1" ? [n1, n2] : [n1, n2];
        names.forEach((n) => {
          if (n && !n.includes("undefined")) b.options.add(new Option(n, n));
        });
        if (window.breakLocked && currentBreakPlayer)
          b.value = currentBreakPlayer; // Gesicherten Wert wiederherstellen, falls gelockt

        // Timer starten, wenn Anstoßspieler feststeht
        if (b.value && !window.matchTimerInterval) {
          window.startMatchTimer();
        }

        const ready =
          m === "1:1"
            ? document.getElementById("p1").value &&
              document.getElementById("p2").value
            : document.getElementById("t1p1").value &&
              document.getElementById("t1p2").value &&
              document.getElementById("t2p1").value &&
              document.getElementById("t2p2").value;

        if (diceBtn) {
          diceBtn.disabled = window.breakLocked || !ready;
          diceBtn.style.opacity = window.breakLocked || !ready ? "0.3" : "1";
        }

        // Highlights entfernen, wenn Spieler gewählt wurden
        [
          "p1",
          "p2",
          "t1p1",
          "t1p2",
          "t2p1",
          "t2p2",
          "winType",
          "leftover",
        ].forEach((id) => {
          const el = document.getElementById(id);
          if (el && el.value) window.removeHighlight(id);
        });

        if (typeof window.updateMatchProbability === "function")
          window.updateMatchProbability();
        if (window.updateAvatarPreviews) window.updateAvatarPreviews();

        // Check if form is fully ready for "Speichern" cinematic glow
        const isFormComplete =
          (m === "1:1"
            ? document.getElementById("p1").value &&
              document.getElementById("p2").value
            : document.getElementById("t1p1").value &&
              document.getElementById("t1p2").value &&
              document.getElementById("t2p1").value &&
              document.getElementById("t2p2").value) &&
          document.getElementById("breakPlayer").value &&
          document.getElementById("winType").value &&
          document.getElementById("leftover").value !== "" &&
          document.getElementById("ballType1").value &&
          window.winnerNum !== 0;

        if (saveBtn) {
          if (isFormComplete) saveBtn.classList.add("btn-ready");
          else saveBtn.classList.remove("btn-ready");
        }
      };

      window.syncBallTypes = (n) => {
        const b1 = document.getElementById("ballType1");
        const b2 = document.getElementById("ballType2");
        if (n === 1) {
          if (b1.value === "Voll") b2.value = "Halb";
          else if (b1.value === "Halb") b2.value = "Voll";
        } else {
          if (b2.value === "Voll") b1.value = "Halb";
          else if (b2.value === "Halb") b1.value = "Voll";
        }
        if (b1.value) window.removeHighlight("ballType1");
        if (b2.value) window.removeHighlight("ballType2");
        if (typeof window.updateUI === "function") window.updateUI();
      };

      window.calcBreak = () => {
        const m = document.getElementById("mode").value;
        const c =
          m === "1:1"
            ? [
                document.getElementById("p1").value,
                document.getElementById("p2").value,
              ]
            : [
                document.getElementById("t1p1").value,
                document.getElementById("t1p2").value,
                document.getElementById("t2p1").value,
                document.getElementById("t2p2").value,
              ];
        const picked =
          c.filter(Boolean)[
            Math.floor(Math.random() * c.filter(Boolean).length)
          ];
        if (!picked) return;
        let res = picked;
        if (m === "2:2") {
          if (
            picked === document.getElementById("t1p1").value ||
            picked === document.getElementById("t1p2").value
          )
            res =
              document.getElementById("t1p1").value +
              " & " +
              document.getElementById("t1p2").value;
          else
            res =
              document.getElementById("t2p1").value +
              " & " +
              document.getElementById("t2p2").value;
        }
        document.getElementById("breakPlayer").value = res;
        window.removeHighlight("breakPlayer");
        window.startMatchTimer();
        window.breakLocked = true;

        // Deaktivieren nach dem Würfeln
        const diceBtn = document.getElementById("btn-breakcalc");
        const breakSel = document.getElementById("breakPlayer");
        if (diceBtn) {
          diceBtn.disabled = true;
          diceBtn.style.opacity = "0.3";
        }
        if (breakSel) {
          breakSel.disabled = false; // Kurz aktivieren, um den Wert zu setzen
          breakSel.value = res;
          breakSel.disabled = true; // Sofort wieder deaktivieren
        }

        document.getElementById("diceResultName").innerText = res;
        const names = res.split(" & ").map((n) => n.trim());
        const avatarContainer = document.getElementById("diceResultAvatar");
        if (avatarContainer) {
          const size = names.length > 1 ? 44 : 64; // This was causing an error as 'names' was not defined
          avatarContainer.innerHTML = names
            .map((n) => {
              const silhouette = `<div style="width:${size}px; height:${size}px; border-radius:15px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; font-size:${size * 0.5}px; border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.2);">👤</div>`;
              const src =
                window.getAvatarUrl && typeof window.getAvatarUrl === "function"
                  ? window.getAvatarUrl(n)
                  : `avatars/${n}.png`;
              return `
                        <div style="position:relative; width:${size}px; height:${size}px;">
                            <img loading="lazy" src="${src}" onerror="this.style.display='none'" style="position:absolute; top:0; left:0; width:${size}px; height:${size}px; border-radius:15px; object-fit:cover; border:2px solid var(--accent); z-index:2; background:transparent;">
                            ${silhouette}
                        </div>`;
            })
            .join("");
        }

        if (typeof window.updateAvatarPreviews === "function")
          window.updateAvatarPreviews();

        // Cinematic Animation starten
        const animOverlay = document.getElementById("diceAnimationOverlay");
        const animCup = document.getElementById("animCup");
        const animText = document.getElementById("animText");

        animCup.className = "cup-shake";
        if (animText) animText.innerText = "Mische Würfel...";
        animOverlay.style.display = "flex";

        setTimeout(() => {
          animCup.className = "cup-pour";
          if (animText) animText.innerText = "Auswertung...";

          setTimeout(() => {
            animOverlay.style.display = "none";
            animCup.className = "";
            // Jetzt erst das echte Ergebnis-Fenster anzeigen
            document.getElementById("diceModal").style.display = "flex";
          }, 1000);
        }, 1000);
      };



      window.requestDelete = (i) => {
        window.openDeleteConfirmModal(i);
      };
      window.updateMatchProbability = () => {
        const m = document.getElementById("mode").value;
        const b = document.getElementById("match-prob");
        const isReady =
          m === "1:1"
            ? document.getElementById("p1").value &&
              document.getElementById("p2").value
            : document.getElementById("t1p1").value &&
              document.getElementById("t1p2").value &&
              document.getElementById("t2p1").value &&
              document.getElementById("t2p2").value;

        if (!isReady || !b) {
          b.innerHTML = `<div style="color:#8e8e93; font-size:10px; text-align:center; padding:5px; font-weight:800;">Spieler wählen für Prognose</div>`;
          return;
        }

        const pIds =
          m === "1:1" ? ["p1", "p2"] : ["t1p1", "t1p2", "t2p1", "t2p2"];
        const pVals = pIds
          .map((id) => document.getElementById(id).value)
          .filter(Boolean);
        if (new Set(pVals).size !== pVals.length) {
          b.innerHTML = `<div style="color:var(--error); font-size:10px; text-align:center; padding:10px; font-weight:800;">⚠️ Doppelte Spieler gewählt!</div>`;
          return;
        }

        const elo =
          typeof window.computeEloRatings === "function"
            ? window.computeEloRatings(window.stats)
            : {};
        const getE = (p) => (elo[p] ? elo[p].elo : 1000);

        let r1, r2, n1, n2;
        if (m === "1:1") {
          n1 = document.getElementById("p1").value;
          n2 = document.getElementById("p2").value;
          r1 = getE(n1);
          r2 = getE(n2);
        } else {
          n1 =
            document.getElementById("t1p1").value +
            " & " +
            document.getElementById("t1p2").value;
          n2 =
            document.getElementById("t2p1").value +
            " & " +
            document.getElementById("t2p2").value;
          r1 =
            (getE(document.getElementById("t1p1").value) +
              getE(document.getElementById("t1p2").value)) /
            2;
          r2 =
            (getE(document.getElementById("t2p1").value) +
              getE(document.getElementById("t2p2").value)) /
            2;
        }

        const getBP = (searchStr) => {
          if (!searchStr) return null;
          const searchPlayers = searchStr
            .split(" & ")
            .map((s) => s.trim())
            .filter(Boolean);
          let vW = 0,
            hW = 0;
          window.stats.forEach((g) => {
            if (!g || !g.bt1 || !g.bt2 || !g.w) return;
            const p1A = (g.p1 || "")
              .split(" & ")
              .map((s) => s.trim())
              .filter(Boolean);
            const p2A = (g.p2 || "")
              .split(" & ")
              .map((s) => s.trim())
              .filter(Boolean);

            // Zähle Siege für JEDEN Spieler in der Auswahl einzeln (aggregiert)
            searchPlayers.forEach((p) => {
              if (p1A.includes(p) && g.w == 1) {
                if (g.bt1 === "Voll") vW++;
                else if (g.bt1 === "Halb") hW++;
              } else if (p2A.includes(p) && g.w == 2) {
                if (g.bt2 === "Voll") vW++;
                else if (g.bt2 === "Halb") hW++;
              }
            });
          });
          if (vW === hW || vW + hW < 1) return null;
          return vW > hW
            ? { t: "Voll", c: "#ffcc00" }
            : { t: "Halb", c: "#4FC3F7" };
        };

        const pref1 = getBP(n1),
          pref2 = getBP(n2);
        const prob1 = Math.round(
          (1 / (1 + Math.pow(10, (r2 - r1) / 400))) * 100,
        );
        const prob2 = 100 - prob1;

        const l1 = m === "1:1" ? n1 : "Team 1";
        const l2 = m === "1:1" ? n2 : "Team 2";

        const getBallIcon = (type) => {
          if (type === "Voll")
            return `<svg width="14" height="14" viewBox="0 0 24 24" style="margin-right:4px; display:block;"><circle cx="12" cy="12" r="11" fill="#ffcc00"/><circle cx="12" cy="12" r="11" fill="url(#gradV)"/><defs><radialGradient id="gradV" cx="30%" cy="30%" r="50%"><stop offset="0%" stop-color="white" stop-opacity="0.3"/><stop offset="100%" stop-color="black" stop-opacity="0.2"/></defs></svg>`;
          return `<svg width="14" height="14" viewBox="0 0 24 24" style="margin-right:4px; display:block;"><circle cx="12" cy="12" r="11" fill="white"/><path d="M1.5 8.5 A 11 11 0 0 0 1.5 15.5 L 22.5 15.5 A 11 11 0 0 0 22.5 8.5 Z" fill="#4FC3F7"/><circle cx="12" cy="12" r="11" fill="url(#gradH)"/><defs><radialGradient id="gradH" cx="30%" cy="30%" r="50%"><stop offset="0%" stop-color="white" stop-opacity="0.2"/><stop offset="100%" stop-color="black" stop-opacity="0.2"/></defs></svg>`;
        };

        const c1 = prob1 > 50 ? "#34c759" : prob1 < 50 ? "#ff3b30" : "#ffffff";
        const c2 = prob2 > 50 ? "#34c759" : prob2 < 50 ? "#ff3b30" : "#ffffff";

        // --- ERWEITERTE KI-COACH LOGIK ---
        function generateAiBanter(d1, d2, n1, n2, r1, r2) {
          if (!d1 || !d2) return "";

          const rules = [
            {
              priority: 10,
              condition: () => d1.currentStreak >= 4,
              text: () => `<b>${n1}</b> ist eine Maschine! <span class="fire">🔥</span> Mit <b>${d1.currentStreak} Siegen in Folge</b> ist er der klare Favorit. Kann <b>${n2}</b> die Serie brechen?`
            },
            {
              priority: 10,
              condition: () => d2.currentStreak >= 4,
              text: () => `Vorsicht, <b>${n2}</b> ist im Rausch! Eine <b>Siegesserie von ${d2.currentStreak}</b> spricht für sich. <b>${n1}</b> steht vor einer schweren Aufgabe.`
            },
            {
              priority: 9,
              condition: () => d1.currentLoseStreak >= 3,
              text: () => `<b>${n1}</b> steckt in einer Krise. Eine Niederlagenserie von <b>${d1.currentLoseStreak}</b> nagt am Selbstvertrauen. Die perfekte Chance für <b>${n2}</b>?`
            },
            {
              priority: 9,
              condition: () => d2.currentLoseStreak >= 3,
              text: () => `<b>${n2}</b> ist angeschlagen und kommt mit <b>${d2.currentLoseStreak} Niederlagen in Folge</b>. Kann <b>${n1}</b> den Druck weiter erhöhen?`
            },
            {
              priority: 9,
              condition: () => {
                let nemesis1 = null, maxL1 = 0;
                Object.entries(d1.headToHead || {}).forEach(([o, s]) => { if (s.l > maxL1) { maxL1 = s.l; nemesis1 = o; } });
                return nemesis1 === n2 && maxL1 >= 5 && (d1.headToHead[n2].w / (d1.headToHead[n2].l || 1) < 0.3);
              },
              text: () => `Kopfsache! <b>${n1}</b> trifft auf seinen absoluten Angstgegner. Die Statistik lügt nicht – <b>${n2}</b> hat hier einen klaren psychologischen Vorteil.`
            },
            {
              priority: 8,
              condition: () => d1.winRate > 60 && d2.headToHead[n1]?.w > d2.headToHead[n1]?.l,
              text: () => `Interessante Konstellation: <b>${n1}</b> ist auf dem Papier der stärkere Spieler, aber <b>${n2}</b> hat im direkten Duell die Nase vorn. Ein echter Prüfstein.`
            },
            {
              priority: 8,
              condition: () => d2.winRate > 60 && d1.headToHead[n2]?.w > d1.headToHead[n2]?.l,
              text: () => `Statistik vs. Realität: <b>${n2}</b> hat die bessere Karriere-Quote, aber <b>${n1}</b> scheint sein Kryptonit zu sein. Wer setzt sich heute durch?`
            },
            {
              priority: 8,
              condition: () => d1.breakWins / (d1.games || 1) > 0.15 && d2.clutchWins / (d2.games || 1) > 0.1,
              text: () => `Spezialisten-Duell: <b>${n1}</b> will mit einem starken Break den schnellen Sieg, während <b>${n2}</b> in der Crunchtime aufblüht. Wer kann dem Spiel seinen Stempel aufdrücken?`
            },
            {
              priority: 8,
              condition: () => d1.winRateDelta20 > 10 && d2.winRateDelta20 < -10,
              text: () => `Form-Schere! Während <b>${n1}</b> im Aufwind ist, kämpft <b>${n2}</b> mit der Form. Ein klares Momentum-Duell.`
            },
            {
              priority: 8,
              condition: () => d2.winRateDelta20 > 10 && d1.winRateDelta20 < -10,
              text: () => `Die Vorzeichen sind klar: <b>${n2}</b> reitet eine Erfolgswelle, während <b>${n1}</b> nach seiner Form sucht. Kann der Underdog überraschen?`
            },
            {
              priority: 8,
              condition: () => Math.abs(d1.eloDelta10) > 80 && Math.abs(d2.eloDelta10) < 30,
              text: () => `Hier trifft Volatilität auf Konstanz. <b>${n1}</b> ist eine Wundertüte – an guten Tagen Weltklasse, an schlechten eine Katastrophe. <b>${n2}</b> spielt dagegen sein Spiel solide runter.`
            },
            {
              priority: 8,
              condition: () => Math.abs(d2.eloDelta10) > 80 && Math.abs(d1.eloDelta10) < 30,
              text: () => `<b>${n2}</b> ist unberechenbar und für jede Überraschung gut. <b>${n1}</b> muss versuchen, mit seiner konstanten Art das Spiel zu kontrollieren und Fehler zu erzwingen.`
            },
            {
              priority: 8,
              condition: () => d1.avgRestLossLast20 <= 2.5 && d2.avgKillerLast20 > 6.0 && d1.games > 20 && d2.games > 20,
              text: () => `Offensive gegen Defensive! <b>${n2}</b> ist ein gefürchteter Abräumer, aber <b>${n1}</b> ist bekannt dafür, den Tisch 'dicht' zu machen. Wer setzt sich durch?`
            },
            {
              priority: 8,
              condition: () => d2.avgRestLossLast20 <= 2.5 && d1.avgKillerLast20 > 6.0 && d2.games > 20 && d1.games > 20,
              text: () => `Ein Duell der Stile: <b>${n1}</b> will den schnellen K.O., während <b>${n2}</b> eine defensive Festung ist. Geduld wird hier entscheidend sein.`
            },
            {
              priority: 8,
              condition: () => d1.winRateDelta20 > 15 && d1.games > 40,
              text: () => `<b>${n1}</b> ist der Aufsteiger der Saison! Seine Siegquote ist zuletzt explodiert. <b>${n2}</b> muss aufpassen, nicht von der Welle überrollt zu werden.`
            },
            {
              priority: 8,
              condition: () => d1.maxLoseStreak <= 2 && d1.games > 60 && d2.maxLoseStreak > 4,
              text: () => `Mentales Duell: <b>${n1}</b> ist ein Fels in der Brandung und kippt selten. <b>${n2}</b> hingegen ist anfällig für Negativ-Serien. Wer behält die Oberhand im Kopf?`
            },
            {
              priority: 8,
              condition: () => d1.avgKiller > 6.0 && d2.avgKiller < 4.5,
              text: () => `Stil-Kollision: <b>${n1}</b> ist ein 'Abräumer', der den Tisch leerfegt. <b>${n2}</b> spielt eher auf Sicherheit. Wer kann dem Gegner sein Spiel aufzwingen?`
            },
            {
              priority: 8,
              condition: () => d2.avgKiller > 6.0 && d1.avgKiller < 4.5,
              text: () => `Hier trifft Dominanz auf Taktik. <b>${n2}</b> will den Tisch schnell leeren, während <b>${n1}</b> auf den richtigen Moment wartet. Eine explosive Mischung.`
            },
            {
              priority: 7,
              condition: () => d1.clutchWins > d1.games * 0.1 && d2.lostBy8BallError / (d2.games - d2.wins || 1) > 0.05,
              text: () => `Nervensache: <b>${n1}</b> ist für seine 'Clutch'-Momente bekannt. Das könnte gefährlich für <b>${n2}</b> werden, der tendenziell Fehler auf die 8 macht.`
            },
            {
              priority: 7,
              condition: () => d2.clutchWins > d2.games * 0.1 && d1.lostBy8BallError / (d1.games - d1.wins || 1) > 0.05,
              text: () => `Das könnte im Endgame entschieden werden. <b>${n2}</b> hat Nerven aus Stahl, während <b>${n1}</b> aufpassen muss, die 8 nicht zu früh zu verschenken.`
            },
            {
              priority: 7,
              condition: () => d1.blackWinsCount / (d1.wins || 1) > 0.3 && d1.wins > 10,
              text: () => `<b>${n1}</b> ist als 'Abstauber' bekannt und gewinnt oft durch Fehler des Gegners. <b>${n2}</b> muss heute extrem sauber spielen.`
            },
            {
              priority: 7,
              condition: () => d1.stolenServiceWins / (d1.opponentStartedGames || 1) > 0.25 && d1.games > 20,
              text: () => `Der Anstoßvorteil ist gegen <b>${n1}</b> relativ. Er ist ein Meister darin, das Spiel zu stehlen, selbst wenn der Gegner breakt.`
            },
            {
              priority: 6,
              condition: () => d1.breakWins / (d1.games || 1) > 0.15 && d2.stolenServiceWins / (d2.opponentStartedGames || 1) < 0.1,
              text: () => `Der Anstoß ist die Achillesferse von <b>${n2}</b>. Wenn <b>${n1}</b> seinen starken Break durchzieht, könnte das Match schnell vorbei sein.`
            },
            {
              priority: 5,
              condition: () => Math.abs(r1 - r2) > 150,
              text: () => {
                const stronger = r1 > r2 ? n1 : n2;
                const weaker = r1 > r2 ? n2 : n1;
                return `David gegen Goliath! Laut ELO ist <b>${stronger}</b> der haushohe Favorit. Aber der Druck liegt bei ihm – eine perfekte Chance für <b>${weaker}</b>.`
              }
            },
            {
              priority: 4,
              condition: () => d1.winRate > 65 && d2.winRate < 45,
              text: () => `Die Karriere-Statistik spricht eine klare Sprache für <b>${n1}</b>. Aber am Tisch zählt nur die Tagesform. Kann <b>${n2}</b> heute überraschen?`
            },
            { priority: 1, condition: () => true, text: () => `Die Prognose ist eng. Hier wird die <b>Tagesform</b> und mentale Stärke den Unterschied machen.` },
            { priority: 1, condition: () => true, text: () => `Vergiss die Zahlen. Am Ende gewinnt der, der die <b>entscheidenden Bälle</b> locht und die Nerven behält.`},
            { priority: 1, condition: () => true, text: () => `Ein klassisches Duell. Beide Spieler kennen sich gut. Es wird auf die Details ankommen.`}
          ];

          const applicableRules = rules.filter(rule => rule.condition());
          const maxPriority = Math.max(...applicableRules.map(r => r.priority));
          const topCandidates = applicableRules.filter(r => r.priority === maxPriority);

          if (topCandidates.length > 0) {
            const banterIndex = window.getFixedIndex(n1 + n2, topCandidates.length);
            return topCandidates[banterIndex].text();
          }
          return "";
        }

        function generateAiXFactor(d1, d2, n1, n2) {
            if (!d1 || !d2) return "";
            const factors = [];

            const h2h = d1.headToHead[n2];
            if (h2h && (h2h.w + h2h.l) >= 5) {
                const total = h2h.w + h2h.l;
                const wr1 = Math.round((h2h.w / total) * 100);
                if (wr1 > 65 || wr1 < 35) {
                    factors.push({
                        priority: 10,
                        text: () => `Das <b>Kopf-an-Kopf-Duell</b>. In direkten Begegnungen steht es... <b>${h2h.w} : ${h2h.l} für ${wr1 > 50 ? n1 : n2}</b>.`
                    });
                }
            }

            const uKey = [n1, n2].sort().join("|");
            const meetingCount = window.careerStats?.aggregates?.meetings?.[uKey] || 0;
            if (meetingCount > 20) {
                factors.push({
                    priority: 10,
                    text: () => `Die <b>Rivalität</b>. Mit über <b>${meetingCount} direkten Duellen</b> kennen sich beide in- und auswendig. Hier entscheiden Kleinigkeiten. ⚔️`
                });
            }

            const errRate1 = d1.games > 0 ? (d1.lostBy8BallError / (d1.games - d1.wins || 1)) * 100 : 0;
            if (errRate1 > 15) {
                factors.push({
                    priority: 9,
                    text: () => `Der <b>8-Ball-Fluch</b>. Über <b>15% der Niederlagen</b> von ${n1} entstehen durch einen Fehler auf die 8. Ein mentaler Knackpunkt? 😬`
                });
            }

            const stolenRate1 = d1.opponentStartedGames > 0 ? (d1.stolenServiceWins / d1.opponentStartedGames) * 100 : 0;
            if (stolenRate1 > 25) {
                factors.push({
                    priority: 9,
                    text: () => `Der <b>Service-Klau</b>. ${n1} gewinnt <b>${Math.round(stolenRate1)}% der Spiele</b>, wenn der Gegner anstößt. Der Anstoßvorteil ist hier relativ. 🕵️`
                });
            }

            if (d1.avgKiller > 6.5) {
                factors.push({
                    priority: 8,
                    text: () => `Die <b>Killer-Mentalität</b>. Mit Ø <b>${d1.avgKiller.toFixed(1)} Restkugeln</b> beendet ${n1} Spiele, bevor sie richtig anfangen. 🪓`
                });
            }

            const clutchRate1 = d1.games > 0 ? (d1.clutchWins / d1.games) * 100 : 0;
            if (clutchRate1 > 15) {
                factors.push({
                    priority: 9,
                    text: () => `Die <b>Nervenstärke</b> von ${n1}. Er gewinnt über 15% seiner Spiele in der Crunchtime. Eiskalt! 🥶`
                });
            }

            const breakRate1 = d1.games > 0 ? (d1.breakWins / d1.games) * 100 : 0;
            if (breakRate1 > 20) {
                factors.push({
                    priority: 8,
                    text: () => `Der <b>Anstoß</b> von ${n1}. Er gewinnt über 20% seiner Spiele direkt nach dem eigenen Break. Blitzstart-Gefahr! ⚡`
                });
            }

            if (d1.eloDelta10 > 60) {
                factors.push({
                    priority: 9,
                    text: () => `Die <b>aktuelle Form</b>. ${n1} hat in den letzten 10 Spielen... <b>+${Math.round(d1.eloDelta10)} ELO gewonnen! 🔥</b>`
                });
            }
            if (d2.eloDelta10 < -60) {
                factors.push({
                    priority: 8,
                    text: () => `Die <b>aktuelle Form</b>. ${n2} befindet sich in einem Formtief mit... <b>${Math.round(d2.eloDelta10)} ELO Verlust. 📉</b>`
                });
            }

            if (d1.maxLoseStreak <= 1 && d1.games > 80) {
                factors.push({
                    priority: 9,
                    text: () => `Die <b>mentale Festung</b>. ${n1} hat eine maximale Niederlagenserie von <b>nur ${d1.maxLoseStreak}</b>. Dieser Spieler bricht nicht. 🧘`
                });
            }

            if (d1.winRateLast30 > 75 && d1.games > 40) {
                factors.push({
                    priority: 9,
                    text: () => `Die <b>Form der letzten 30 Spiele</b>. ${n1} hat eine Siegquote von über <b>75%</b> in diesem Zeitraum. Absolut im Flow. 🔥`
                });
            }

            if (d1.dramaWins / (d1.games || 1) > 0.1 && d1.games > 30) {
                factors.push({
                    priority: 8,
                    text: () => `Die <b>Drama-Quote</b>. ${n1} gewinnt über <b>10% seiner Spiele</b>, wenn beide im Endgame sind. Ein echter Krimi-Spezialist. 🎭`
                });
            }

            if (factors.length === 0) {
                const totalGames = d1.games + d2.games;
                factors.push({
                    priority: 1,
                    text: () => `Die <b>Erfahrung</b>. Zusammen haben beide Spieler... <b>${totalGames} Spiele</b> auf dem Buckel.`
                });
            }

            const maxPriority = Math.max(...factors.map(f => f.priority));
            const topCandidates = factors.filter(f => f.priority === maxPriority);

            if (topCandidates.length > 0) {
                const factorIndex = window.getFixedIndex(n1 + n2 + "xfactor", topCandidates.length);
                return topCandidates[factorIndex].text();
            }
            return "";
        }

        function generateAiTip(d1, d2, n1, n2, r1, r2) {
            if (!d1 || !d2) return "";
            const tips = [];

            if (d2.lostBy8BallError / (d2.games - d2.wins || 1) > 0.1) {
                tips.push(`<b>${n1}:</b> Setze <b>${n2}</b> unter Druck, wenn die 8 im Spiel ist. Hier passieren oft Fehler.`);
            }
            if (d1.lostBy8BallError / (d1.games - d1.wins || 1) > 0.1) {
                tips.push(`<b>${n2}:</b> Halte das Spiel kompliziert. <b>${n1}</b> neigt unter Druck auf die 8 zu Fehlern.`);
            }
            if (d2.maxLoseStreak > 4 && d2.games > 30) {
                tips.push(`<b>${n1}:</b> Dein Gegner <b>${n2}</b> ist anfällig für Tilt. Ein früher, dominanter Sieg könnte ihn mental brechen.`);
            }
            if (d1.currentLoseStreak >= 3) {
                tips.push(`<b>${n2}:</b> Dein Gegner ist verunsichert. Ein aggressiver Start und früher Druck könnten ihn komplett aus dem Konzept bringen.`);
            }
            if (d1.winRateDelta20 < -15) {
                tips.push(`<b>${n2}:</b> ${n1} ist in einem Formtief. Spiel geduldig und warte auf die Fehler, die unweigerlich kommen werden.`);
            }
            if (d2.currentStreak >= 4) {
                tips.push(`<b>${n1}:</b> Dein Gegner ist im Rausch. Versuch, seinen Rhythmus mit einem unerwarteten Safety zu brechen und lass ihn nicht ins Spiel kommen.`);
            }
            if (d2.avgKiller < 4.5 && d2.games > 20) {
                tips.push(`<b>${n1}:</b> <b>${n2}</b> lässt oft Chancen liegen. Spiel auf Sicherheit, warte auf deine Chance und bestrafe seine Fehler konsequent.`);
            }
            if (d2.avgRestLossLast20 <= 2.0 && d2.games > 30) {
                tips.push(`<b>${n1}:</b> Du spielst gegen eine defensive Mauer. Du musst aggressive, präzise Stöße wagen, um die Verteidigung zu durchbrechen. Ein reines Sicherheitsspiel wird nicht reichen.`);
            }
            if (d2.clutchWins / (d2.games || 1) < 0.05 && d2.games > 20) {
                tips.push(`<b>${n1}:</b> Halte das Spiel eng! <b>${n2}</b> zeigt in der Crunchtime Nerven und gewinnt selten knappe Spiele.`);
            }
            if (d1.breakWins / (d1.games || 1) > 0.2) {
                tips.push(`<b>${n1}:</b> Ein starker Anstoß ist die halbe Miete. Kontrolliere das Spiel von Anfang an.`);
            }
            if (d2.stolenServiceWins / (d2.opponentStartedGames || 1) > 0.2) {
                tips.push(`<b>${n1}:</b> <b>${n2}</b> ist ein Meister im "Service-Klau". Sei nach deinem Anstoß extrem wachsam.`);
            }
            if (d1.avgKillerLast20 > 6.0) {
                tips.push(`<b>${n1}:</b> Deine offensive Form ist exzellent. Zögere nicht und mach den Tisch leer, wenn du die Chance siehst.`);
            }
            if (d2.avgRestLossLast20 > 4.0) {
                tips.push(`<b>${n1}:</b> Gegen <b>${n2}</b> könnten Sicherheitsstöße der Schlüssel sein. Er neigt dazu, viele Kugeln auf dem Tisch zu lassen.`);
            }
            let nemesis1 = null, maxL1 = 0;
            Object.entries(d1.headToHead || {}).forEach(([o, s]) => { if (s.l > maxL1) { maxL1 = s.l; nemesis1 = o; } });
            if (nemesis1 === n2 && maxL1 >= 5) {
                tips.push(`<b>${n1}:</b> Du spielst gegen deinen Angstgegner. Vergiss die Statistik! Konzentrier dich auf dein Spiel und nutze jede kleine Chance.`);
            }
            if (d2.breakWins / (d2.games || 1) > 0.2) {
                tips.push(`<b>${n1}:</b> Nach dem Anstoß von <b>${n2}</b> ist höchste Vorsicht geboten. Ein schneller Safety könnte seinen Rhythmus brechen.`);
            }
            if (d1.stolenServiceWins / (d1.opponentStartedGames || 1) < 0.05 && d1.games > 20) {
                tips.push(`<b>${n2}:</b> ${n1} ist schwach, wenn er nicht selbst anstößt. Nutze deinen Anstoß konsequent, um das Spiel zu kontrollieren.`);
            }
            if (d1.headToHead[n2]?.w > d1.headToHead[n2]?.l && d1.headToHead[n2]?.w > 3) {
                tips.push(`<b>${n1}:</b> Du bist der Angstgegner. Spiel selbstbewusst, dominiere den Tisch und zeig <b>${n2}</b>, warum die Statistik so ist, wie sie ist.`);
            }
            if (r2 - r1 > 100) {
                tips.push(`<b>${n1}:</b> Als Underdog solltest du versuchen, das Spiel zu verlangsamen und <b>${n2}</b> zu Fehlern zu zwingen.`);
            }
            if (r1 - r2 > 100) {
                tips.push(`<b>${n2}:</b> Du hast nichts zu verlieren. Aggressives, mutiges Spiel könnte den Favoriten <b>${n1}</b> aus dem Konzept bringen.`);
            }

            if (tips.length > 0) {
                const tipIndex = window.getFixedIndex(n1 + n2 + "tip", tips.length);
                return tips[tipIndex];
            }
            return "";
        }

        // --- NEUE KI-COACH BANTER LOGIK ---
        let banterText = "";
        let coachTip = "";
        let xFactor = "";
        if (window.careerStats && window.careerStats.pData) {
          const d1 = window.careerStats.pData[n1];
          const d2 = window.careerStats.pData[n2];

          if (d1 && d2) {
            banterText = generateAiBanter(d1, d2, n1, n2, r1, r2);
            coachTip = generateAiTip(d1, d2, n1, n2, r1, r2);
            xFactor = generateAiXFactor(d1, d2, n1, n2);
          }
        }

        const av1 = window.getAvatarUrl ? window.getAvatarUrl(n1) : `avatars/${n1}.webp`;
        const av2 = window.getAvatarUrl ? window.getAvatarUrl(n2) : `avatars/${n2}.webp`;
        const is1v1 = m === "1:1";

        b.className = "card vs-arena-card";
        b.innerHTML = `
                ${is1v1 ? `
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.08);">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img loading="lazy" src="${av1}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:2px solid #ffcc00; box-shadow:0 0 10px rgba(255,204,0,0.4);" onerror="this.style.display='none'">
                        <div>
                            <div style="font-weight:900; font-size:12px; color:#fff;">${n1}</div>
                            <div style="font-size:9px; font-weight:800; color:#ffcc00;">${Math.round(r1)} ELO</div>
                        </div>
                    </div>
                    <div class="vs-badge-glow">VS</div>
                    <div style="display:flex; align-items:center; gap:10px; flex-direction:row-reverse; text-align:right;">
                        <img loading="lazy" src="${av2}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:2px solid #4fc3f7; box-shadow:0 0 10px rgba(79,195,247,0.4);" onerror="this.style.display='none'">
                        <div>
                            <div style="font-weight:900; font-size:12px; color:#fff;">${n2}</div>
                            <div style="font-size:9px; font-weight:800; color:#4fc3f7;">${Math.round(r2)} ELO</div>
                        </div>
                    </div>
                </div>` : ""}
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="color:var(--accent); font-weight:900; font-size:9px; text-transform:uppercase; letter-spacing:1.5px; display:flex; align-items:center; gap:6px;"><div class="live-dot"></div> LIVE ANALYSE</span>
                    <span style="font-size:10px; color:#fff; font-weight:900; opacity: 0.7;">${prob1}% <span style="color:var(--accent); opacity:1;">:</span> ${prob2}%</span>
                </div>
                <div class="prob-bar" style="margin-bottom:6px;">
                    <div style="width:${prob1}%">
                        <!-- Liquid Glow Tip -->
                        <div style="position:absolute; right:-6px; top:-30%; bottom:-30%; width:12px; background: radial-gradient(circle, #fff 0%, transparent 70%); opacity:0.7; animation: tip-pulse 1s infinite alternate; z-index:3;"></div>
                    </div>
                    <div style="position:absolute; left:50%; top:-4px; bottom:-4px; width:2px; background:rgba(255,255,255,0.4); z-index:4; transform:translateX(-50%);"></div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:12px; font-weight:900; color:${c1}; flex:1; display:flex; align-items:center;">
                        <span style="white-space:nowrap;">${l1}: ${prob1}%</span>
                        ${pref1 ? `<span style="display:inline-flex; align-items:center; font-size:10px; font-weight:900; color:${pref1.c}; opacity:0.8; margin-left:6px;">${window.getBallIcon(pref1.t, 12)}${pref1.t}</span>` : ""}
                    </div>
                    <div style="font-size:12px; font-weight:900; color:${c2}; flex:1; display:flex; align-items:center; justify-content:flex-end; gap:6px;">
                        ${pref2 ? `<span style="display:inline-flex; align-items:center; font-size:10px; font-weight:900; color:${pref2.c}; opacity:0.8; margin-right:6px;">${window.getBallIcon(pref2.t, 12)}${pref2.t}</span>` : ""}
                        <span style="white-space:nowrap;">${l2}: ${prob2}%</span>
                    </div>
                </div>
                ${(banterText || xFactor || coachTip) ? `
                    <div class="coach-container">
                        ${banterText ? `<div class="prob-banter">💡 <b>Analyse:</b> ${banterText}</div>` : ""}
                        ${xFactor ? `<div class="prob-banter x-factor-tip">🔑 <b>Der X-Faktor:</b> ${xFactor}</div>` : ""}
                        ${coachTip ? `<div class="prob-banter coach-tip">🎯 <b>Taktik-Tipp für</b>${coachTip}</div>`:""}
                    </div>
                ` : ""}
                `;
      };



      window.openConfirmationModal = () => {
        const m = document.getElementById("mode").value;
        let n1, n2;

        if (m === "1:1") {
          n1 = document.getElementById("p1").value;
          n2 = document.getElementById("p2").value;
        } else {
          const t1p1 = document.getElementById("t1p1").value;
          const t1p2 = document.getElementById("t1p2").value;
          const t2p1 = document.getElementById("t2p1").value;
          const t2p2 = document.getElementById("t2p2").value;
          n1 = [t1p1, t1p2].filter(Boolean).join(" & ");
          n2 = [t2p1, t2p2].filter(Boolean).join(" & ");
        }

        const winnerName = window.winnerNum === 1 ? n1 : n2;
        const loserName = window.winnerNum === 1 ? n2 : n1;
        const breakPlayer = document.getElementById("breakPlayer").value;
        const winType = document.getElementById("winType").value;
        const leftover = document.getElementById("leftover").value;

        const summaryEl = document.getElementById("confirmation-summary");
        summaryEl.innerHTML = `
                <ul>
                    <li><span>Gewinner</span> <b style="color:#34c759;">${winnerName}</b></li>
                    <li><span>Verlierer</span> <b style="color:#ff3b30;">${loserName}</b></li>
                    <li><span>Anstoß</span> <b style="color:var(--accent);">${breakPlayer}</b></li>
                    <li><span>Sieg-Art</span> <b>${winType}</b></li>
                    <li><span>Restkugeln</span> <b>${leftover}</b></li>
                </ul>
            `;

        document.getElementById("resultModal").style.display = "none";
        document.getElementById("confirmationModal").style.display = "flex";
      };

      window.closeConfirmationModal = () => {
        document.getElementById("confirmationModal").style.display = "none";
      };

      window.saveFromConfirmation = () => {
        window.closeConfirmationModal();
        window.doSave();
      };

      // --- NEUE, ROBUSTE LOGIK FÜR ERGEBNIS-MODAL ---

      // Öffnet das Ergebnis-Modal mit allen Auswahloptionen auf einmal
      window.openResultModal = () => {
        const winnerName =
          window.winnerNum === 1
            ? document.getElementById("p1").value ||
              [
                document.getElementById("t1p1").value,
                document.getElementById("t1p2").value,
              ]
                .filter(Boolean)
                .join(" & ")
            : document.getElementById("p2").value ||
              [
                document.getElementById("t2p1").value,
                document.getElementById("t2p2").value,
              ]
                .filter(Boolean)
                .join(" & ");
 
        const ballLabel = document.getElementById("winnerBallTypeLabel");
        if (ballLabel)
          ballLabel.innerText = `Gewinner-Kugel auswählen für ${winnerName}`;
 
        const resultModal = document.getElementById("resultModal");
        if (resultModal) {
          resultModal.style.display = "flex";
        }
        window.clearResultModalSelections();
        document.querySelectorAll(".result-step").forEach((s) => {
          s.classList.add("active");
        });
      };

      // Schließt das Modal und setzt die Gewinnerauswahl zurück, falls abgebrochen wird
      window.closeResultModal = () => {
        document.getElementById("resultModal").style.display = "none";
        // Nur zurücksetzen, wenn der Prozess wirklich abgebrochen wird
        window.winnerNum = 0;
        document
          .querySelectorAll(".win-btn")
          .forEach((btn) => btn.classList.remove("selected"));
        window.clearResultModalSelections();
      };

      // Navigiert zwischen den Schritten im Modal
      window.resultGoToStep = (stepNum) => {
        document
          .querySelectorAll(".result-step")
          .forEach((s) => s.classList.remove("active"));
        const targetStep =
          document.getElementById(`result-step-${stepNum}-balls`) ||
          document.getElementById(`result-step-${stepNum}-wintype`) ||
          document.getElementById(`result-step-${stepNum}-leftover`);
        if (targetStep) targetStep.classList.add("active");
      };

      const clearResultModalSelections = () => {
        document
          .querySelectorAll("#modal-ball-type-selector .ball-type-btn")
          .forEach((btn) => btn.classList.remove("selected"));
        document
          .querySelectorAll("#modal-winType-chips .win-type-chip")
          .forEach((chip) => chip.classList.remove("selected"));
        document
          .querySelectorAll("#modal-leftover-grid .leftover-btn")
          .forEach((btn) => btn.classList.remove("selected"));
      };
 
      window.clearResultModalCategory = (category) => {
        if (category === "ball") {
          document
            .querySelectorAll("#modal-ball-type-selector .ball-type-btn")
            .forEach((btn) => btn.classList.remove("selected"));
        } else if (category === "win") {
          document
            .querySelectorAll("#modal-winType-chips .win-type-chip")
            .forEach((chip) => chip.classList.remove("selected"));
        } else if (category === "leftover") {
          document
            .querySelectorAll("#modal-leftover-grid .leftover-btn")
            .forEach((btn) => btn.classList.remove("selected"));
        }
      };
 
      window.selectBallTypeInModal = (type) => {
        const winnerSelectId =
          window.winnerNum === 1 ? "ballType1" : "ballType2";
        const loserSelectId =
          window.winnerNum === 1 ? "ballType2" : "ballType1";
        document.getElementById(winnerSelectId).value = type;
        document.getElementById(loserSelectId).value =
          type === "Voll" ? "Halb" : "Voll";
        window.clearResultModalCategory("ball");
        document
          .querySelectorAll("#modal-ball-type-selector .ball-type-btn")
          .forEach((btn) => {
            if (btn.textContent?.trim().includes(type)) btn.classList.add("selected");
          });
      };
      window.selectWinTypeInModal = (winType) => {
        document.getElementById("winType").value = winType;
        window.clearResultModalCategory("win");
        document
          .querySelectorAll("#modal-winType-chips .win-type-chip")
          .forEach((chip) => {
            if (chip.textContent?.trim().includes(winType.replace("Gegner-Fehler: ", "Foul: "))) {
              chip.classList.add("selected");
            }
          });
      };
 
      window.selectLeftoverInModal = (num) => {
        document.getElementById("leftover").value = num;
        window.clearResultModalCategory("leftover");
        document
          .querySelectorAll("#modal-leftover-grid .rack-ball")
          .forEach((btn, idx) => {
            btn.classList.toggle("selected", idx === num);
          });
      };

      window.renderBilliardRack = (container, onSelectFnName) => {
        if (!container) return;
        const ballColors = {
          0: { bg: "rgba(255,255,255,0.08)", text: "#8e8e93" },
          1: { bg: "#ffd700", text: "#000" },
          2: { bg: "#0066cc", text: "#fff" },
          3: { bg: "#e60000", text: "#fff" },
          4: { bg: "#800080", text: "#fff" },
          5: { bg: "#ff6600", text: "#fff" },
          6: { bg: "#008000", text: "#fff" },
          7: { bg: "#8b4513", text: "#fff" },
        };

        container.className = "billiard-rack";
        container.innerHTML = [0, 1, 2, 3, 4, 5, 6, 7]
          .map((n) => {
            const b = ballColors[n];
            if (n === 0) {
              return `<button type="button" class="rack-ball" onclick="${onSelectFnName}(0)">
                <div style="font-size:16px;">🧹</div>
                <div style="font-size:9px; font-weight:800; color:#8e8e93; margin-top:2px;">0 Rest</div>
              </button>`;
            }
            return `<button type="button" class="rack-ball" onclick="${onSelectFnName}(${n})">
              <div class="rack-ball-sphere" style="background: radial-gradient(circle at 35% 30%, #ffffff 0%, ${b.bg} 40%, rgba(0,0,0,0.7) 100%); color: ${b.text};">
                ${n}
              </div>
              <div style="font-size:8px; font-weight:800; color:#8e8e93; margin-top:3px;">${n} Kugel${n > 1 ? "n" : ""}</div>
            </button>`;
          })
          .join("");
      };
 
      window.saveMatchFromModal = async () => {
        const resultModal = document.getElementById("resultModal");
        if (resultModal) resultModal.style.display = "none";
        await window.doSave();
      };

      // --- NEUE LOGIK FÜR INTUITIVE ERGEBNIS-ERFASSUNG ---
      window.initResultUI = () => {
        // Populate the hidden ball type selects
        ["ballType1", "ballType2"].forEach((id) => {
          const select = document.getElementById(id);
          if (select) {
            select.innerHTML =
              '<option value="Voll">Voll</option><option value="Halb">Halb</option>';
            select.value = ""; // Reset selection
          }
        });
        const ballSelector = document.getElementById("ball-type-selector");
        if (ballSelector) {
          ballSelector.innerHTML = `
                    <div class="ball-type-btn" onclick="window.selectBallType('Voll')">🟡 Voll</div>
                    <div class="ball-type-btn" onclick="window.selectBallType('Halb')">🔵 Halb</div>
                `;
        }
        const modalBallSelector = document.getElementById(
          "modal-ball-type-selector",
        );
        if (modalBallSelector) {
          modalBallSelector.innerHTML = `
                    <div class="ball-type-btn" onclick="window.selectBallTypeInModal('Voll')">🟡 Voll</div>
                    <div class="ball-type-btn" onclick="window.selectBallTypeInModal('Halb')">🔵 Halb</div>
                `;
        }
        const winTypeSelect = document.getElementById("winType");
        if (winTypeSelect) {
          const winTypes = [
            "Regulär (8er gelocht)",
            "Gegner-Fehler: 8er zu früh",
            "Gegner-Fehler: 8er falsches Loch",
            "Gegner-Fehler: Foul bei der 8",
          ];
          winTypeSelect.innerHTML = ""; // Clear existing options
          winTypes.forEach((wt) =>
            winTypeSelect.options.add(new Option(wt, wt)),
          );
        }
        const winTypeContainer = document.getElementById("winType-chips");
        if (winTypeContainer) {
          const winTypes = [
            "Regulär (8er gelocht)",
            "Gegner-Fehler: 8er zu früh",
            "Gegner-Fehler: 8er falsches Loch",
            "Gegner-Fehler: Foul bei der 8",
          ];
          winTypeContainer.innerHTML = winTypes
            .map(
              (wt) =>
                `<div class="win-type-chip" onclick="window.selectWinType(this, '${wt}')">${wt.replace("Gegner-Fehler: ", "Foul: ")}</div>`,
            )
            .join("");
        }
        const modalWinTypeContainer = document.getElementById(
          "modal-winType-chips",
        );
        if (modalWinTypeContainer) {
          const winTypes = [
            "Regulär (8er gelocht)",
            "Gegner-Fehler: 8er zu früh",
            "Gegner-Fehler: 8er falsches Loch",
            "Gegner-Fehler: Foul bei der 8",
          ];
          modalWinTypeContainer.innerHTML = winTypes
            .map(
              (wt) =>
                `<div class="win-type-chip" onclick="window.selectWinTypeInModal('${wt}')">${wt.replace("Gegner-Fehler: ", "Foul: ")}</div>`,
            )
            .join("");
        }
        const leftoverGrid = document.getElementById("modal-leftover-grid");
        if (leftoverGrid) {
          window.renderBilliardRack(leftoverGrid, "window.selectLeftoverInModal");
        }
      };

      window.updateLeftover = (change) => {
        const input = document.getElementById("leftover");
        let newVal = Math.max(
          0,
          Math.min(7, (parseInt(input.value) || 0) + change),
        );
        input.value = newVal;
        window.updateUI();
      };

      // --- MATCH BEARBEITEN (EDIT) CONTROLLER LOGIK ---
      window.editingMatchIndex = -1;
      window.editWinnerNum = 0;

      window.openEditCurrentMatch = () => {
        if (typeof window.currentViewingMatchIndex === "number" && window.currentViewingMatchIndex >= 0) {
          window.closeMatchDetailsModal();
          window.openEditMatchModal(window.currentViewingMatchIndex);
        }
      };

      window.closeEditMatchModal = () => {
        const modal = document.getElementById("editMatchModal");
        if (modal) modal.style.display = "none";
        window.editingMatchIndex = -1;
        window.editWinnerNum = 0;
      };

      window.openEditMatchModal = (index) => {
        window.editingMatchIndex = index;
        const g = window.stats && window.stats[index];
        if (!g) return;

        const dateInfoEl = document.getElementById("edit-match-date-info");
        if (dateInfoEl) dateInfoEl.innerText = g.d || "";

        // Dropdowns befüllen
        document.querySelectorAll(".edit-player-sel").forEach((s) => {
          s.innerHTML = '<option disabled value="">Wählen</option>';
          (window.spieler || []).forEach((p) => s.options.add(new Option(p, p)));
        });

        const mode = g.m || "1:1";
        const modeSelect = document.getElementById("edit-mode");
        if (modeSelect) modeSelect.value = mode;

        if (mode === "1:1") {
          const p1El = document.getElementById("edit-p1");
          const p2El = document.getElementById("edit-p2");
          if (p1El) p1El.value = g.p1 || "";
          if (p2El) p2El.value = g.p2 || "";
        } else {
          const t1 = (g.p1 || "").split(" & ").map((s) => s.trim());
          const t2 = (g.p2 || "").split(" & ").map((s) => s.trim());
          const t1p1 = document.getElementById("edit-t1p1");
          const t1p2 = document.getElementById("edit-t1p2");
          const t2p1 = document.getElementById("edit-t2p1");
          const t2p2 = document.getElementById("edit-t2p2");
          if (t1p1) t1p1.value = t1[0] || "";
          if (t1p2) t1p2.value = t1[1] || "";
          if (t2p1) t2p1.value = t2[0] || "";
          if (t2p2) t2p2.value = t2[1] || "";
        }

        // Win-Types initialisieren
        const winTypes = [
          "Regulär (8er gelocht)",
          "Gegner-Fehler: 8er zu früh",
          "Gegner-Fehler: 8er falsches Loch",
          "Gegner-Fehler: Foul bei der 8",
        ];
        const winTypeCont = document.getElementById("edit-winType-chips");
        if (winTypeCont) {
          winTypeCont.innerHTML = winTypes
            .map(
              (wt) =>
                `<div class="win-type-chip" onclick="window.selectEditWinType('${wt}')">${wt.replace("Gegner-Fehler: ", "Foul: ")}</div>`,
            )
            .join("");
        }

        // Leftover Grid initialisieren
        const leftoverGrid = document.getElementById("edit-leftover-grid");
        if (leftoverGrid) {
          window.renderBilliardRack(leftoverGrid, "window.selectEditLeftover");
        }

        // Gewinner setzen
        window.selectEditWinner(parseInt(g.w) || 1);

        // Kugeltyp setzen
        const winnerBall = g.w == 1 ? g.bt1 : g.bt2;
        window.selectEditBallType(winnerBall || "Voll");

        // Sieg-Art setzen
        window.selectEditWinType(g.t || winTypes[0]);

        // Restkugeln setzen
        window.selectEditLeftover(g.l !== undefined ? parseInt(g.l) : 0);

        // Anstoß setzen
        window.updateEditUI();
        const breakSel = document.getElementById("edit-breakPlayer");
        if (breakSel && g.a) breakSel.value = g.a;

        const modal = document.getElementById("editMatchModal");
        if (modal) modal.style.display = "flex";
      };

      window.updateEditUI = () => {
        const mode = document.getElementById("edit-mode")?.value || "1:1";
        const ui11 = document.getElementById("edit-ui-1-1");
        const ui22 = document.getElementById("edit-ui-2-2");
        if (ui11) ui11.style.display = mode === "1:1" ? "flex" : "none";
        if (ui22) ui22.style.display = mode === "2:2" ? "flex" : "none";

        const n1 =
          mode === "1:1"
            ? document.getElementById("edit-p1")?.value || ""
            : [
                document.getElementById("edit-t1p1")?.value,
                document.getElementById("edit-t1p2")?.value,
              ]
                .filter(Boolean)
                .join(" & ");

        const n2 =
          mode === "1:1"
            ? document.getElementById("edit-p2")?.value || ""
            : [
                document.getElementById("edit-t2p1")?.value,
                document.getElementById("edit-t2p2")?.value,
              ]
                .filter(Boolean)
                .join(" & ");

        const btn1 = document.getElementById("edit-btn-win1");
        const btn2 = document.getElementById("edit-btn-win2");
        if (btn1) btn1.innerText = n1 || "Spieler 1";
        if (btn2) btn2.innerText = n2 || "Spieler 2";

        const breakSel = document.getElementById("edit-breakPlayer");
        if (breakSel) {
          const currentBreak = breakSel.value;
          breakSel.innerHTML = '<option value="" disabled selected>Wählen</option>';
          [n1, n2].forEach((n) => {
            if (n && !n.includes("undefined")) breakSel.options.add(new Option(n, n));
          });
          if (
            currentBreak &&
            Array.from(breakSel.options).some((o) => o.value === currentBreak)
          ) {
            breakSel.value = currentBreak;
          }
        }

        const winnerName = window.editWinnerNum === 1 ? n1 : n2;
        const label = document.getElementById("edit-ballType-label");
        if (label) {
          label.innerText = `Kugel-Typ für ${winnerName || "Gewinner"}`;
        }
      };

      window.selectEditWinner = (num) => {
        window.editWinnerNum = num;
        document.getElementById("edit-btn-win1")?.classList.toggle("selected", num === 1);
        document.getElementById("edit-btn-win2")?.classList.toggle("selected", num === 2);
        window.updateEditUI();
      };

      window.selectEditBallType = (type) => {
        const winnerSelectId = window.editWinnerNum === 1 ? "edit-ballType1" : "edit-ballType2";
        const loserSelectId = window.editWinnerNum === 1 ? "edit-ballType2" : "edit-ballType1";

        const winInput = document.getElementById(winnerSelectId);
        const loseInput = document.getElementById(loserSelectId);
        if (winInput) winInput.value = type;
        if (loseInput) loseInput.value = type === "Voll" ? "Halb" : "Voll";

        document.getElementById("edit-ball-voll")?.classList.toggle("selected", type === "Voll");
        document.getElementById("edit-ball-halb")?.classList.toggle("selected", type === "Halb");
      };

      window.selectEditWinType = (winType) => {
        const input = document.getElementById("edit-winType");
        if (input) input.value = winType;
        document
          .querySelectorAll("#edit-winType-chips .win-type-chip")
          .forEach((chip) => {
            chip.classList.toggle(
              "selected",
              chip.textContent.trim() === winType.replace("Gegner-Fehler: ", "Foul: "),
            );
          });
      };

      window.selectEditLeftover = (num) => {
        const input = document.getElementById("edit-leftover");
        if (input) input.value = num;
        document
          .querySelectorAll("#edit-leftover-grid .leftover-btn")
          .forEach((btn) => {
            btn.classList.toggle("selected", btn.textContent.trim() === String(num));
          });
      };

      window.saveEditedMatch = async () => {
        if (window.editingMatchIndex === -1 || window.editingMatchIndex === undefined) return;

        const mode = document.getElementById("edit-mode")?.value || "1:1";
        let p1, p2;

        if (mode === "1:1") {
          p1 = document.getElementById("edit-p1")?.value;
          p2 = document.getElementById("edit-p2")?.value;
        } else {
          const t1p1 = document.getElementById("edit-t1p1")?.value;
          const t1p2 = document.getElementById("edit-t1p2")?.value;
          const t2p1 = document.getElementById("edit-t2p1")?.value;
          const t2p2 = document.getElementById("edit-t2p2")?.value;
          p1 = [t1p1, t1p2].filter(Boolean).join(" & ");
          p2 = [t2p1, t2p2].filter(Boolean).join(" & ");
        }

        const breakPlayer = document.getElementById("edit-breakPlayer")?.value;
        const ballType1 = document.getElementById("edit-ballType1")?.value;
        const ballType2 = document.getElementById("edit-ballType2")?.value;
        const winType = document.getElementById("edit-winType")?.value;
        const leftover = document.getElementById("edit-leftover")?.value;

        if (!p1 || !p2 || !window.editWinnerNum || !breakPlayer || !ballType1 || !ballType2 || !winType || leftover === "") {
          if (window.openErrorModal) {
            window.openErrorModal("Bitte alle Pflichtfelder für das Match ausfüllen.");
          }
          return;
        }

        const oldMatch = window.stats[window.editingMatchIndex] || {};
        const updatedMatch = {
          ...oldMatch,
          m: mode,
          p1: p1,
          p2: p2,
          w: window.editWinnerNum,
          t: winType,
          a: breakPlayer,
          l: parseInt(leftover, 10),
          bt1: ballType1,
          bt2: ballType2,
        };

        window.stats[window.editingMatchIndex] = updatedMatch;

        try {
          if (window.db && window.dbFns && window.dbFns.setDoc && window.dbFns.doc) {
            await window.dbFns.setDoc(
              window.dbFns.doc(window.db, "billard_data", "stats"),
              { matches: window.stats },
            );
          }

          if (typeof window.recalculateAndRender === "function") {
            window.recalculateAndRender();
          }
          if (typeof window.updateAllViews === "function") {
            window.updateAllViews();
          }

          window.closeEditMatchModal();
          if (window.closeMatchDetailsModal) window.closeMatchDetailsModal();
          if (window.openSuccessModal) window.openSuccessModal();
        } catch (err) {
          console.error("Error saving edited match:", err);
          if (window.openErrorModal) {
            window.openErrorModal("Fehler beim Aktualisieren des Matches:\n" + err.message);
          }
        }
      };