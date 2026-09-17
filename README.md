# Billardkrüppel App

Offizielle Web-App zur Erfassung von Matches, Ranglisten, Statistiken und Erfolgen der Billardkrüppeltruppe.

---

## 🚀 Was ist neu (Changelog)

### 🎲 Überarbeitete Würfel- und Team-Sounds (20260917.04)

- Der Anstoß-Würfel klingt jetzt natürlicher mit Rollen und Aufprall auf dem Billardtuch.
- Bei 2:2-Duellen erhalten Teams einen eigenen Siegerklang und einen passenden Team-Kommentar.

### 🔊 Zuverlässiger Siegesklang nach dem Speichern (20260917.03)

- Der akustische Siegesklang wird nach dem Speichern eines Matches nun auch auf Browsern mit strengen Audio-Freigaben zuverlässiger abgespielt.

### ⚡ Live-Aktualisierung nach Match-Speichern (20260917.02)

- **🏆 Sofortige Aktualisierung der Tagessiegplatzierung & „Duo des Abends“:**
  - Nach dem Speichern eines Spiels werden die Live-Tagessiegplatzierung und das „Duo des Abends“ auf der Matchseite ab sofort unmittelbar neu berechnet und aktualisiert, ohne dass zuvor in den Tab „Session“ gewechselt werden muss.
- **Offline-Cache (20260917.02):** Aktualisierung des Service-Worker-Caches auf Version `20260917.02`.

### 🏷️ Neues Versionsformat (20260917.01)

- **📅 Datumsbasiertes Versionsschema:**
  - Umstellung der Versionsanzeige und des Service-Worker-Caches auf ein transparentes Format bestehend aus Datum und Zähler (`YYYYMMDD.XX`).
- **Offline-Cache (20260917.01):** Aktualisierung des Service-Worker-Caches auf Version `20260917.01`.

### ⚡ 2:2 Anstoß-Erfassung & Break-Statistiken (v26.12)

- **⚡ Vollständige Anstoß-Wertung für 2:2-Matches:**
  - Die Anstöße aus 2:2-Doppelspielen werden nun für die beteiligten Spieler lückenlos erfasst und in allen Auswertungen berücksichtigt.
  - **⚡ Anstoß-König & Rangliste:** Beide Spieler des anstoßenden Teams erhalten nun ihre verdienten Anstöße (`Meiste eigene Anstöße`) gutgeschrieben.
  - **🏆 Break-Master & Break-Quote:** Siege nach eigenem Anstoß im 2:2 zählen ab sofort für die persönliche Break-Win-Statistik, die globale Anstoß-Vorteil-Quote sowie die Break-Master-Erfolge.
  - **🕵️‍♂️ Service-Dieb:** Siege gegen das anstoßende gegnerische Team im 2:2 fließen nun präzise in die Service-Dieb-Erfolge ein.
- **Offline-Cache (v26.12):** Aktualisierung des Service-Worker-Caches auf Version 26.12.

### 🎲 Intelligenter Anwesenheits-Pool & 3-Spieler-Turnus (v26.11)

- **🎲 Fester Anwesenheits-Pool im Dialog „Anwesende Spieler & Startpartie“:**
  - Die im 🎲-Dialog ausgewählten Spieler werden nun dauerhaft als aktiver Pool für den aktuellen Spielabend gesichert.
  - Beim erneuten Öffnen bleiben genau die anwesenden Spieler mit Häkchen vorausgewählt.
  - Geht jemand früher, reicht ein kurzes Abwählen im Dialog – die gegangene Person wird für den restlichen Abend nirgends mehr vorgeschlagen oder hinzugefügt.
- **🔀 Zuverlässiges „Teams mischen“:**
  - „Teams mischen“ greift nun **ausschließlich** auf die tatsächlich anwesenden Spieler des aktiven Pools zu. Nicht anwesende Spieler aus der Datenbank werden niemals mehr versehentlich in die Teams gezogen.
  - Bei weniger als 4 Spielern (z. B. nach dem Weggang eines Spielers) informiert ein klarer Hinweis, statt fremde Spieler herbeizuholen.
- **👑 Smarter 3-Spieler 1:1-Modus („King of the Hill“):**
  - Wenn 3 Spieler anwesend sind und 1:1 gespielt wird, rückt nach jedem Spiel automatisch der pausierende Spieler als neuer Herausforderer an den Tisch, während der Sieger stehen bleibt. Kein manuelles Umstellen nötig!
- **Offline-Cache (v26.11):** Aktualisierung des Service-Worker-Caches auf Version 26.11.

### 🧹 Bereinigte Filter-Leiste in Erfolge & Historie (v26.10)

- **🧹 Entfernung des redundanten „Session“-Filters:**
  - In den Ansichten **Historie** (Übersicht) und **Erfolge** (Hall of Fame & Shame) wurde der deplatzierte Filter-Button `📅 Session` entfernt.
  - Für den aktuellen Spielabend steht weiterhin der dedizierte Haupt-Tab **Session** zur Verfügung.
  - Die Filter-Leiste (Zeitraum) ist nun mit exakt 3 Buttons (`🌐 Gesamt`, `⏳ 30 Tage`, `⚙️ Mehr...`) perfekt symmetrisch und bündig zur Modus-Leiste (`Alle Matches`, `1:1 Einzel`, `2:2 Team`) aufgebaut.
- **Offline-Cache (v26.10):** Aktualisierung des Service-Worker-Caches auf Version 26.10.

### 🛡️ Hotfix: Stabilität bei 2:2-Matches & Filter-Korrekturen (v26.9)

- **🛡️ 2:2 Team-Berechnung & Statistik-Stabilität wiederhergestellt:**
  - Behebt ein schwerwiegendes Problem bei der Berechnung von Team-Spielen, durch das bei vorhandenen 2:2-Matches die Statistik- und Session-Ansichten blockiert werden konnten.
  - Korrektur der Zählweise für Zu-Null-Siege (`teamCleanWins`) und knappe Siege (`teamClutchWins`) im Team-Modus.
- **🎯 Shot-Clock Leertasten-Steuerung optimiert:**
  - Der Leertasten-Hotkey für den nächsten Stoß reagiert nun ausschließlich auf der aktiven Matchseite (`Aufzeichnen`), sodass auf anderen Seiten (wie Regeln oder Historie) das normale Scrollen per Leertaste uneingeschränkt möglich ist.
- **🔍 Spieler-Filterung für 2:2-Matches:**
  - Beim Filtern nach einem bestimmten Spieler werden nun auch dessen absolvierte 2:2-Doppelspiele korrekt erfasst und angezeigt.
- **Offline-Cache (v26.9):** Aktualisierung des Service-Worker-Caches auf Version 26.9.

### ⏱️ Profi Shot-Clock, 2:2 Komplett-Paket & faire Tagessieger-Wertung (v26.8)

- **⏱️ Profi Shot-Clock (Stoppuhr gegen Zeitspiel):**
  - Direkt auf der **🎱 Matchseite** kann nun eine professionelle 45-Sekunden-Shot-Clock zugeschaltet werden (Umschalter `[ AUS | AN ]`).
  - **45-Sekunden-Timer**: Dynamischer Countdown mit farblichen Warnstufen (Grün: 45–16s, Orange: 15–6s, Rot pulsierend: 5–0s).
  - **Foul-Alarm & Buzzer**: Authentische Audio-Signaltöne bei den letzten 5 Sekunden und ein lauter Sport-Buzzer bei 0 Sekunden (_„Foul – Zeit abgelaufen!“_).
  - **Komfort-Bedienung & Blitz-Hotkey**:
    - Großer `🎯 Nächster Stoß`-Button – kann **blitzschnell per Leertaste** ausgelöst werden, ohne das Handy berühren zu müssen!
    - `⏸️ Pause / Weiter` für Diskussionen oder Kugelsuche.
    - **Dauerhafter Sound**: Akustische Beeps und der laute Buzzer sind fest aktiv, ohne versehentliches Stummschalten.
  - Merkt sich den Aktivierungszustand dauerhaft für zukünftige Spiele.
- **🌟 „Duo des Abends“ Hero-Badge (2:2 Champions):**
  - An Spieltagen mit 2:2-Matches kürt die App nun automatisch das stärkste Duo des Abends mit einer goldenen Champion-Hero-Card.
  - Ausgezeichnet wird das Team mit der höchsten Punktzahl basierend auf Siegen, Netto-Frames und Winrate: `Score = (Siege × 3) + Netto-Frames + (Winrate% / 10)`.
  - Sichtbar direkt in der **📅 Session-Ansicht** unterhalb des Tagessieger-Podiums sowie live auf der **🎱 Matchseite**.
  - Präsentiert mit Doppel-Avataren, Gold-Krone 👑, Siegen, Quote, Netto-Frames und Synergie-Status.
  - Antippen öffnet das Punkte-Modal mit genauer Formelerklärung und der aktuellen Team-Rangliste des Spieltags.
- **⚔️ 2:2 Team-Klassiker (Duo vs. Duo Head-to-Head):**
  - Im Statistik-Reiter **Duelle** gibt es nun den direkten Vergleich aller 2:2-Paarungen gegeneinander (z. B. _Daniel & Thorsten_ vs. _Peter & Sascha_).
  - Inklusive Doppel-Avataren beider Teams, Siegbilanz, Gesamtspielen, direktem Kräfteverhältnis-Balken und Führungs-Status.
- **🏆 Ewige 2:2 Team-Rangliste:**
  - Bei Auswahl des oberen Modus-Filters **`👥 2:2 Team`** schaltet die Rangliste automatisch auf das ewige Team-Klassement um.
  - Rangliste aller Duos sortiert nach kombiniertem Team-Rating (ELO-Mittelwert), Siegen, Winrate und Synergie-Status (_🌟 Traum-Duo_, _🤝 Harmonisch_, _⚡ Krisen-Duo_).
- **⚖️ 100% matchbasierte Tagessieger-Wertung (Session-MVP):**
  - Der Tagessieger wird nun dauerhaft und vollständig aus den reinen Match-Leistungen der aktuellen Session berechnet (Siege, Niederlagen, Breaks, Serien, Dominanz, Clutch, 8er-Fehler).
  - Weder Karriere-Meilensteine, Tages-Errungenschaften noch historische Nemesis-Boni fließen in den Tagessieg ein – dadurch starten ausnahmslos alle Spieler an jedem Spielabend bei exakt 0 Punkten und mit 100% Chancengleichheit.
- **✨ Ruhiges Öffnen der Info-Popups („Punkte-Logik“ & „Duo des Abends“):**
  - Das Zappeln bzw. die Rüttel-Animation beim Öffnen der Punkte-Erklärung und des Duo-Modals wurde entfernt. Reine Info-Fenster öffnen sich nun ruhig und harmonisch.
- **🏛️ Sofortige, stabile Treppchen-Darstellung:**
  - Das zeitversetzte Aufploppen der drei Podiums-Säulen von links nach rechts wurde entfernt. Alle Säulen werden nun sofort und gleichzeitig stabil gerendert.
- **🧹 Bereinigte Filterleiste im Subtab „Kugeln“:**
  - Die untere doppelte Modus-Leiste bei den Kugeln wurde entfernt. Die Kugel-Statistik koppelt nun direkt und reibungslos an den globalen Modus-Umschalter ganz oben.
- **🎙️ Siri-Kommentator: 30 neue Sprüche für Sascha & 30 neue Team-Sprüche:**
  - Der integrierte Sprach-Kommentator wurde massiv ausgebaut:
    - **Sascha**: 30 individuelle, humorvolle Siri-Audio-Kommentare für gewonnene Spiele und Match-Highlights.
    - **2:2 Teams & Duos**: 30 dynamische Team-Kommentare für Doppel-Siege, Teamplay und Synchron-Aktionen.
  - Funktioniert vollständig offline und direkt im Browser ohne Ladezeiten.
- **Offline-Cache (v26.8):** Aktualisierung des Service-Worker-Caches auf Version 26.8.

### 🎖️ Einheitliche Benennung: Sub-Tab „Erfolge“ in der Statistik (v26.3)

- **Umbenennung von „Rekorde“ zu „Erfolge“:**
  - Der dritte Reiter in der Statistik-Unterleiste (sowohl unter **📅 Session** als auch unter **♾️ Gesamt**) wurde in **`🎖️ Erfolge`** (zuvor _Rekorde_) umbenannt, passend zu den darin enthaltenen Rekorden, Fun-Stats und Filter-Erfolgen.
- **Offline-Cache (v26.3):** Aktualisierung des Service-Worker-Caches auf Version 26.3.

### 🛠️ Stabilitäts-Update für die Erfolge-Übersicht (v26.2)

- **Reibungslose Anzeige aller Trophäen & Teams:**
  - Behebt ein Anzeigeproblem, durch das die Erfolge-Seite und die Team-Karten in Einzelfällen nicht korrekt geladen wurden.
  - Sowohl die Einzelspieler als auch die 2:2 Teams & Duos werden nun unter „Alle Matches“ zuverlässig und fehlerfrei gerendert.
- **Offline-Cache (v26.2):** Aktualisierung des Service-Worker-Caches auf Version 26.2.

### 🎱 Kombinierte Gesamtansicht für Einzelspieler & Duos (v26.1)

- **Gemeinsame Anzeige bei „Alle Matches“:**
  - Ist in der oberen Leiste **`🎱 Alle Matches`** ausgewählt, präsentiert der Tab **Erfolge** nun die vollständige Übersicht:
    1. **`👤 Einzelspieler`**: Rangliste aller Einzelspieler mit Trophäen-Level und Siegen.
    2. **`👥 2:2 Teams & Duos`**: Sämtliche festen Duos mit Doppel-Avataren, Synergie-Status und aufklappbaren gemeinsamen Erfolgen.
- **Spezifische Modus-Filterung:**
  - **`👤 1:1 Einzel`**: Filtert gezielt auf die Einzelspieler-Wertungen.
  - **`👥 2:2 Team`**: Filtert gezielt auf die Teams & Duos.
- **Offline-Cache (v26.1):** Aktualisierung des Service-Worker-Caches auf Version 26.1.

### 🧹 Bereinigte Modus-Filterung & Nahtlose 2:2-Koppelung (v26.0)

- **Beseitigung der doppelten Filterleiste:**
  - Der redundante Sub-Toggle `[Einzelspieler / Teams & Duos]` wurde entfernt.
  - Die Anzeige koppelt nun direkt an die globale Modus-Leiste ganz oben:
    - Klick auf **`👥 2:2 Team`**: Öffnet automatisch den vollständigen **Team-Kader** mit allen Duos, Doppel-Avataren, Synergie-Status und gemeinsamen 2:2-Erfolgen.
    - Klick auf **`🎱 Alle Matches`** oder **`👤 1:1 Einzel`**: Zeigt wie gewohnt die **Einzelspieler** (`Alle Spieler`, `Daniel`, `Peter`, `Thorsten`).
- **Verlässliche Duo-Erkennung:**
  - Auch Spiele mit historischem Namensformat werden nun lückenlos in die Team-Wertungen einbezogen.
- **Offline-Cache (v26.0):** Aktualisierung des Service-Worker-Caches auf Version 26.0.

### 🎯 Direkte Profil-Filterung im Erfolge-Tab (v25.9)

- **Schnellwechsel in die VIP-Showcase-Ansicht:**
  - In der Übersicht **„Alle Spieler“** klappt ein Klick auf eine Spielerkarte nicht mehr inline auf, sondern setzt direkt den Filter auf diesen Spieler (`window.setAchPlayerFilter`).
  - Dadurch öffnet sich sofort das detaillierte **VIP-Showcase-Profil** des jeweiligen Spielers inklusive aller KPIs, Meilensteine und Kategorie-Filter.
  - Ein Klick auf **„Alle Spieler“** in der oberen Segment-Leiste führt jederzeit direkt zurück zur Gesamtübersicht.
- **Offline-Cache (v25.9):** Aktualisierung des Service-Worker-Caches auf Version 25.9.

### 👥 Team-Kader & Duo-Erfolge im Erfolge-Tab (v25.8)

- **Neuer Team-Kader-Umschalter im Tab „Erfolge“:**
  - Im Hauptmenü **Erfolge** gibt es nun direkt oberhalb der Spielerliste einen schnellen Umschalter: **`👤 Einzelspieler`** ⟷ **`👥 Teams & Duos`**.
- **Eigene Trophäenkarten für feste Teams (Duos):**
  - Bei Auswahl von **Teams & Duos** wird jedes feste Duo (z. B. _Daniel & Thorsten_, _Thorsten & Peter_, _Daniel & Peter_) mit eigener Karte dargestellt:
    - Doppel-Avatar mit farbigem Synergie-Rahmen.
    - Synergie-Status (_🌟 Traum-Duo_, _🤝 Harmonisch_, _⚡ Krisen-Duo_) und gemeinsame Winrate.
    - Gesamte Team-Siege (`TEAM WINS`) und gemeinsamer Level-Fortschrittsbalken.
- **Gemeinsam errungene 2:2 Team-Erfolge:**
  - Klickt man auf eine Team-Karte, klappt die Trophäenliste auf und zeigt exklusiv alle 2:2 Team-Erfolge (Fame & Shame mit Tier-Stufen, Zitaten und Kriterien), die dieses Duo **gemeinsam am Tisch erspielt hat**.
- **Offline-Cache (v25.8):** Aktualisierung des Service-Worker-Caches auf Version 25.8.

### 👥 Massives 2:2 Fame- & Shame-System & 10er-Tiers (v25.7)

- **10er-Tier-Erweiterung für 2:2 Team-Erfolge:**
  - Sämtliche 2:2 Team-Meilensteine wurden zu vollwertigen **10-Stufen-Tracks (Stufe I bis Stufe X ⭐)** ausgebaut:
    - **`Brüder im Geiste I–X`**: Team-Siege von Stufe I (5 Siege) bis Stufe X (250 Siege).
    - **`Duo-Dominanz I–X`**: Kantersiege im Team (Gegner Rest 5+) von Stufe I (1 Sieg) bis Stufe X (75 Siege).
    - **`Team-Nervenstärke I–X`**: Matchball-Krimis im Team (Sieg bei Rest 1) von Stufe I (2 Siege) bis Stufe X (80 Siege).
    - **`Team-Serientäter I–X`**: Ungeschlagene Serien im Doppelpack von Stufe I (2 Siege in Folge) bis Stufe X (12 Siege in Folge).
    - **`Doppelter Champion I–X`**: Höchste Siegquoten im Doppel von Stufe I (52%) bis Stufe X (85%).
    - **`Team-Veteran I–X`**: Absolute Treue zum Doppelspiel von Stufe I (10 Spiele) bis Stufe X (500 Spiele).
- **Neue 2:2 All-Time Schande (Shame-Katalog):**
  - **`Team-Klotz am Bein I–X`**: Zehnstufiger Schande-Track für gemeinsame Niederlagen (5 bis 250 Pleiten).
  - **`Synchroner Absturz I–X`**: Zehnstufiger Schande-Track für Niederlagenserien am Stück im Team (2 bis 12 Pleiten in Folge).
  - **`Duo-Schwarzseher`**: Schande für verfrüht versenkte schwarze Kugeln im Team.
  - **`Duo-Abstauber`**: Schande für Siege, die ausschließlich durch gegnerische Schwarz-Fehler geerbt wurden.
  - **`Team-Sackgasse`**: Schande bei dauerhaft unter 40% Siegquote im Doppel.
- **Neue 2:2 Session-Erfolge (Daily Fame & Daily Shame):**
  - **Daily Fame**: `Doppel-Hattrick`, `Duo-Express`, `Team-Feuerwalze`, `Kollaborative Abräumer`, `Duo-Nervenstärke`, `Unschlagbares Duo`, `Team-Dauerbrenner`.
  - **Daily Shame**: `Duo-Totalausfall`, `Doppelter Tiefflug`, `Pech im Doppel`, `Team-Schwarzbrenner`.
- **Offline-Cache (v25.7):** Aktualisierung des Service-Worker-Caches auf Version 25.7.

### 🏆 Optimiertes Session-Layout & Verlässliche Filter-Aktivierung (v25.6)

- **Optimierte Bereichs-Reihenfolge auf der Session-Seite:**
  - Die Sub-Tab-Bar (**`Rangliste` | `Duelle` | `Rekorde` | `Kugeln`**) befindet sich nun direkt unter der Filterleiste. Das **Tagessieger-Podium** schließt sich direkt darunter an.
- **Präzise Session-Auswahl & Datumsanzeige:**
  - **„📅 Aktuelle Session“** wählt stets verlässlich den aktuellen heutigen Spieltag aus.
  - **Direkte Datumsanzeige für den vorigen Abend:** Der Filter-Button zeigt nun direkt das konkrete Datum des vorigen Spieleabends an (z. B. `📅 12.09.2024`) und wird beim Anklicken verlässlich aktiv und goldgelb hervorgehoben.
- **Offline-Cache (v25.6):** Aktualisierung des Offline-Speichers auf Version 25.6 für sofortige Verfügbarkeit auf allen Geräten.

### 🎯 Intelligente Session-Filter & Schlankes Kontext-Menü (v25.5.5)

- **Intelligente Session-Erkennung:**
  - „📅 Aktuelle Session“ zeigt nun immer verlässlich den jüngsten dokumentierten Spieleabend an und bleibt nicht mehr leer, falls am heutigen Kalendertag noch nicht gespielt wurde.
  - „📅 Letzter Abend“ springt mit nur einem Klick direkt auf den vorherigen Spieleabend.
- **Einzel- & Team-Filterung auf der Session-Seite:**
  - Die Umschaltung zwischen `👤 1:1 Einzel` und `👥 2:2 Team` wirkt sich nun auch direkt auf die Session-Ranglisten, Spielübersichten und Tages-Kacheln aus.
- **Saubere Entkopplung von Session und Gesamt:**
  - Das Auswählen eines Spieleabends in der Session-Ansicht blockiert nicht mehr die Gesamt-Statistiken; beim Wechsel zu „Gesamt“ wird wieder die vollständige Karriere- und Periodenübersicht angezeigt.
- **Verschlanktes „Mehr...“-Menü (Kontextbezogen):**
  - **Auf der Session-Seite (`⚙️ Mehr Abende...`):** Zeigt ausschließlich die übersichtliche Liste aller historischen Spieleabende inklusive Wochentag und Match-Anzahl. Ein Klick auf ein Datum wählt den Abend sofort aus und schließt das Menü.
  - **Auf der Gesamt-Seite (`⚙️ Mehr...`):** Bietet gezielten Zugriff auf erweiterte Zeiträume (30/60/90 Tage, aktueller & letzter Monat, dieses & letztes Jahr) sowie den Spieler-Fokus.
- **Offline-Cache (v25.5.5):** Aktualisierung des Offline-Speichers auf Version 25.5.5 für sofortige Verfügbarkeit auf allen Geräten.

### ⚡ Seitenabhängige Filter-Buttons & Vertikale Session-Liste (v25.5.4)

- **Seitenabhängige Filter-Buttons (Zeile 2):**
  - **Session-Seite (`🕒 Session`):** Speziell auf Spieleabende abgestimmt: **`[ 📅 Aktuelle Session | 📅 Letzter Abend | ⚙️ Mehr Abende... ]`** – kein unpassendes `🌐 Gesamt` mehr! Ermöglicht den sofortigen 1-Klick-Wechsel zum vorherigen Spielabend.
  - **Gesamt-Statistikseite (`📊 Gesamt`):** Fokus auf Karriere- & Zeiträume: **`[ 🌐 Gesamt | ⏳ 30 Tage | 🗓️ Dieser Monat | ⚙️ Mehr... ]`**.
  - **Historie & Erfolge:** Bewährte universelle Leiste mit Gesamt, Session, 30 Tage und Mehr.
- **Vertikale Spieleabend-Liste im Filter-Modal („⚙️ Mehr...“):**
  - In Sektion 3 werden alle bisherigen Spieleabende wieder als vertikale, wischbare Liste mit Datum links und Match-Anzahl rechts dargestellt.
- **Vollständige 4-Sektionen Filter-Zentrale:**
  - Weiterhin voller Zugriff auf Spielmodus (Alle / 1:1 / 2:2), Zeiträume, Spieleabende und Spieler-Beteiligung (`👑 Alle Spieler`, `Thorsten`, `Daniel`, etc.).
- **Offline-Cache (v25.5.4):** Aktualisierung des Offline-Speichers auf Version 25.5.4 für sofortige Verfügbarkeit auf allen Geräten.

### 👥 2:2-Team-Akte, „Duo des Abends“ & Kugel-Modusfilter (v25.4.1)

- **2:2-Team-Akte im Spieler-Profil (Steckbrief):**
  - Beim Klick auf einen Spieler öffnet sich im Steckbrief nun der neue Bereich **„👥 2:2 Team-Akte & Partner“**:
  - Zeigt auf einen Blick die persönlichen 2:2-Spiele, die Team-Siegquote und die Rekord-Siegesserie.
  - **🌟 Traum-Partner:** Ermittelt automatisch den Partner, mit dem der Spieler die höchste Siegquote und Harmonie erzielt (inklusive Avatar, Siegquote und Match-Bilanz).
  - **⚡ Wackel-Partner:** Deckt transparent auf, mit welchem Mitspieler es am Billardtisch noch hakt und die meisten Niederlagen eingesteckt wurden.
- **👑 „Duo des Abends“ auf der Siegerehrung:**
  - Auf dem täglichen Siegerpodest (sowohl auf der Match- als auch auf der Statistik-Seite) wird an aktiven 2:2-Spieltagen nun zusätzlich das **„Duo des Abends“** gekrönt.
  - Das erfolgreichste Gespann des Abends erhält eine goldene Auszeichnung mit beiden Spieler-Avataren, Siegen, Matches und der Tages-Quote.
- **🎱 Modus-Filter für Kugel-Statistiken:**
  - Im Statistik-Subtab _„Kugeln & Break“_ steht nun eine neue Filterleiste bereit: **`🎱 Alle Modi` | `👤 1:1 Einzel` | `👥 2:2 Team`**.
  - Die Kugel-Verteilung (Gelochte Volle vs. Halbe Kugeln) sowie die Spezialisten-Auszeichnungen (_🟡 Voll-Spezialist_ und _🔵 Halb-Spezialist_) lassen sich nun gezielt nach Einzel- oder Doppelspielen filtern.
- **🏆 Erfolge-Tab mit Standardfilter „Alle Spieler“:**
  - Beim Öffnen der VIP-Trophäenkammer ist nun ab sofort standardmäßig `👑 Alle Spieler` vorausgewählt.
- **⚡ Automatischer Scroll-to-Top beim Bereichswechsel:**
  - Beim Umschalten zwischen den Statistik-Bereichen (_Rangliste_, _Duelle_, _Rekorde_, _Kugeln_) sowie zwischen _Session_ und _Gesamt_ springt die Seite nun stets verlässlich an den Anfang.
- **Offline-Cache (v25.4.1):** Aktualisierung des Offline-Speichers auf Version 25.4.1 für sofortige Verfügbarkeit auf allen Geräten.

### 🔀 2:2 Smart-Shuffle Bar: Teams mischen & Fair-Play Balance (v25.3)

- **1-Klick „Teams mischen“ direkt auf der Matchseite:**
  - Im 2:2-Modus gibt es nun zwischen den Team-Karten die neue **Smart-Shuffle Bar**: Ein einziger Klick auf `🔀 Teams mischen` würfelt die 4 gewählten Spieler sofort in eine neue Team-Konstellation durch – ganz ohne lästiges Modal oder Häkchen-Setzen.
- **Zwei intelligente Misch-Modi wählbar:**
  - **🎲 Zufall:** Mischt die 4 Spieler per Zufall durch und garantiert bei jedem Klick einen frischen Teamwechsel.
  - **⚖️ Fair-Play (ELO-Balance):** Berechnet die aktuellen ELO-Spielstärken aller 4 Kontrahenten und wählt automatisch die Teamaufstellung mit der höchsten Chancengleichheit (nächste an 50:50). Ein Infohinweis zeigt die verbleibende ELO-Differenz an.
- **Haptisches Feedback & Live-Aktualisierung:**
  - Sanfte Klick-Animation beim Mischen sowie sofortige Live-Aktualisierung der Spieler-Avatare und der ELO-Gewinnprognose.
- **Offline-Cache (v25.3):** Aktualisierung des Offline-Speichers auf Version 25.3 für sofortige Verfügbarkeit auf allen Geräten.

### 👥 2:2-Team-Historie, Duo-Power-Ranking & Exklusive Team-Trophäen (v25.2)

- **Modus-Schnellfilter im Historie-Tab:**
  - Mit den neuen Umschaltern `Alle Matches`, `1:1 Einzel` und `👥 2:2 Team` lässt sich der Matchverlauf nun blitzschnell auf reine Einzelduelle oder Teamspiele eingrenzen.
- **Interaktives Duo-Power-Ranking:**
  - Bei Auswahl des 2:2-Modus öffnet sich direkt über dem Spielverlauf das neue **Duo-Power-Ranking**:
  - Die besten Duos aller Zeiten im direkten Vergleich – gekrönt mit der 👑 **Spitzenreiter-Krone**, Doppel-Avataren der Partner, Siegquoten, Siegesserien und Match-Bilanzen.
- **Veredelte 2:2-Matchkarten:**
  - 2:2-Matches im Verlauf sind nun mit einem markanten `👥 TEAM`-Badge gekennzeichnet, heben die Gespanne visuell hervor und zeigen beide Partner mit überlappenden Spieler-Avataren.
- **Exklusive 2:2-Team-Trophäen & Filter in der VIP-Trophäenkammer:**
  - Die VIP-Trophäenkammer bietet nun einen eigenen Filter-Pill **`👥 Team`** für alle Doppelspiel-Erfolge.
  - **Neue Karriere-Trophäen:**
    - 👥 _Brüder im Geiste I–III:_ Feiere 5, 15 und 30 Siege im 2:2-Team (bis zur Meisterstufe).
    - 💥 _Duo-Dominanz:_ Gewinne ein Teamspiel mit 5+ Restkugeln beim Gegner.
    - 🦾 _Team-Nervenstärke:_ Gewinne 2 Herzschlag-Teammatches bei nur 1 Restkugel.
    - 🏆 _Doppelter Champion:_ Über 65% Siegquote bei mindestens 10 Teamspielen.
  - **Neue Tages-Erfolge:**
    - 🏰 _Die Festung (Tages-Ruhm):_ Ungeschlagen als Team am heutigen Tag (mind. 3 Teamspiele).
    - 🌪️ _Team-Blackout (Tages-Schande):_ 3 Team-Niederlagen in Serie ohne Sieg am Spieltag.
- **Offline-Cache (v25.2):** Aktualisierung des Offline-Speichers auf Version 25.2 für sofortige Verfügbarkeit auf allen Geräten.

### 👥 2:2-Duo-Chemie & Spieler-Avatar für Sascha (v25.1)

- **Interaktive 2:2-Duo-Chemie & Team-Synergien:** Im Statistik-Tab unter „⚔️ Duelle & H2H“ werden nun alle jemals gespielten 2:2-Teams erfasst und detailliert analysiert:
  - **Synergie-Index & Auszeichnung:** Jedes Duo erhält ein klares Barometer – von 🌟 _Traum-Duo_ über 🤝 _Harmonische Partnerschaft_ bis hin zu ⚡ _Krisen-Duo_ – basierend auf der Team-Performance im Vergleich zu den Einzel-Siegquoten.
  - **Umfassende Kennzahlen:** Anzeige der Siege, Matches, Winrate, Restkugel-Durchschnitte sowie der persönlichen Rekord-Siegesserien als Team.
- **Vollwertige Avatar-Integration für Sascha:** Das Profilbild von Sascha (`Sascha.webp`) ist nun nahtlos im gesamten System integriert (Match-Erfassung, Avatare, Statistiken und Ladebildschirm).
- **Offline-Cache (v25.1):** Aktualisierung des Offline-Speichers auf Version 25.1 für sofortige Verfügbarkeit auf allen Geräten.

### 🎱 Spektakulärer Champions-Break Ladebildschirm (v25.0)

- **Cineastischer Billardtisch-Break:** Der Ladebildschirm wurde von Grund auf neu inszeniert. Ein plastisches 10-Kugeln-Dreieck mit echtem Lichtglanz und die weiße Spielkugel eröffnen jede App-Sitzung.
- **Dynamischer Anstoß mit Kugel-Klack-Sound:** Kurz vor Abschluss des Ladevorgangs nimmt die weiße Kugel Fahrt auf und bricht das Kugeldreieck mit einem satten Kugelaufprall-Sound und einer goldenen Schockwelle auf.
- **Champions Arena & rotierender Himmelsring:** Das Billardkrüppel-Logo schwebt erhaben in einem rotierenden Gold-Ring, begleitet von edel gerahmten Spieler-Avataren (Thorsten, Daniel, Peter) und dem goldenen Champions-Ladebalken.
- **Perfekt für Mobilgeräte & iPhones:** Die Höhen und Abstände passen sich flüssig an jedes Smartphone (inklusive Dynamic Island, Notch und Home-Indikator) an.
- **Offline-Cache (v25.0):** Aktualisierung des Offline-Speichers auf Version 25.0 für sofortige Auslieferung auf allen Geräten.

### 📱 Header-Bereinigung & Mobile-Notch-Korrektur (v23.1)

- **Keine störenden Farbbalken mehr:** Der Header erstrahlt nun auf allen Seiten in einem sauberen, tiefschwarzen Dark-Glass-Look ohne verwaschene Farbschlieren oder sichtbare Übergangskanten im Hintergrund.
- **Perfekter Sitz auf Smartphones (Notch & Dynamic Island):** Die oberen Abstände wurden gezielt an die Notch und Dynamic Island angepasst, sodass der Titel und die Icons auf dem Handy vollkommen frei und übersichtlich darunter liegen.
- **Bündige Seitenränder:** Logo auf der linken Seite und Aktions-Buttons auf der rechten Seite schließen nun auf allen Mobilgeräten mit genau 16px Abstand sauber und bündig mit den Match-Karten ab, ohne an den Bildschirmrand zu stoßen oder darüber hinaus zu ragen.
- **Offline-Cache (v23.1):** Aktualisierung des Offline-Speichers auf Version 23.1 für sofortige Verfügbarkeit auf allen Geräten.

### 🎲 Spektakuläres 3D-Duell-Würfeln um den Anstoß (v23.0)

- **Echtes 3D-Duell wie am Billardtisch:** Beim Auswürfeln des Anstoßes treten beide Kontrahenten (bzw. Teams im 2:2-Modus) nun in einem echten 3D-Würfelduell gegeneinander an.
- **Physikalische 3D-Würfel mit echten Augen:** Statt einfacher Symbole rollen und wirbeln zwei detailreiche, weiße 3D-Würfel mit abgerundeten Kanten und echten Dots physikalisch über den Tisch.
- **Akustisches Holzwürfel-Klackern:** Ein authentischer Würfelsound begleitet das Rollen und sorgt für echte Billardtisch-Atmosphäre.
- **Automatische Sieger-Ehrung & Anstoß-Übernahme:** Der höhere Wurf leuchtet in Gold auf und krönt den Anstoß-Sieger. Mit einem Klick auf _„Anstoß übernehmen ✅“_ wird der Gewinner direkt in das Match eingetragen und der Match-Timer gestartet.
- **Offline-Cache (v23.0):** Aktualisierung des Offline-Speichers auf Version 23.0 für sofortige Verfügbarkeit auf allen Geräten.

### ⚡ Kompakte Match-Ansicht ohne Scrollen (v22.9)

- **Alles im direkten Blickfeld (No-Scroll):** Die Match-Erfassungsseite wurde in ihren Abständen und Kartenhöhen ergonomisch gestrafft, sodass die gesamte Seite auf Smartphones und MacBooks vollständig auf einen Bildschirm passt, ohne scrollen zu müssen.
- **Volles Siegerpodest bleibt erhalten:** Die beliebte 3D-Siegerehrung der Live-Tagessiegplatzierung (1. Platz Gold mit Krone, 2. Platz Silber, 3. Platz Bronze) bleibt in voller Pracht erhalten und kommt durch die eingesparten oberen Abstände nun optimal zur Geltung.
- **Alle Funktionen gewohnt greifbar:** Spielmodus-Auswahl (1:1 und 2:2), Zufallsteams, Spieler-Avatare mit Siegesserien-Effekten, Anstoß-Würfeln, Live-Timer, Gewinner-Auswahl und ELO-Prognose bleiben uneingeschränkt aktiv.
- **Offline-Cache (v22.9):** Aktualisierung des Offline-Speichers auf Version 22.9 für sofortige Verfügbarkeit auf allen Geräten.

### 🏛️ VIP Trophäenkammer & sauberes App-Logo (v22.8)

- **VIP Trophäenkammer im neuen Look:** Das Nachschlagewerk aller Trophäen und Meilensteine erstrahlt im edlen Glassmorphism-Design (`.ach-vip-card`) – vollständig abgestimmt auf die Session- und Spieler-Erfolge:
  - **Edle Trophäen-Karten:** Farbkodierte Karten für Diamant (Meister), Gold, Silber, Bronze, Schande und Tageserfolge mit Freischaltbedingung, Zitat und Status-Tags.
  - **Erweiterte Schnellfilter:** Filterung nach `Alle`, `🏆 Ruhm`, `💀 Schande`, `💎 Meister` und `👑 Daily`.
  - **Live-Suchleiste & Zähler:** Dynamische Anzeige der Treffer (z. B. _„🏛️ 86 Trophäen im Kompendium“_ oder _„🔍 12 Treffer“_) mit schnellem Lösch-Button (`✕`).
  - **Schnell-Schließen:** Komfortabler Schließen-Button (`✕`) direkt im oberen Header des Modals.
- **Bereinigtes App-Logo:** Das Logo in den Ansichts-Headern ist nun ein rein statisches Markenelement mit voller Leuchtkraft. Die redundante Klickfunktion zum Suchen von Updates wurde entfernt; für Updates steht der dedizierte Header-Button (`🔄`) bereit.
- **Offline-Cache (v22.8):** Aktualisierung des Offline-Speichers auf Version 22.8 für sofortige Verfügbarkeit auf allen Geräten.

### 💎 Intelligente Status- & Fortschrittsanzeige für alle Trophäen (v22.7)

- **Aussagekräftige Trophäen-Fußzeilen:** Die unpassende und verwirrende Sammelraten-Anzeige wurde komplett ersetzt. Jede Trophäe zeigt nun ihren echten, konkreten Status:
  - **💎 Meister-Status:** Vollendete Max-Tier-Erfolge werden mit `💎 Meister-Status vollendet` und dem Siegel `PERFEKTION` gewürdigt.
  - **🥇 Stufen-Fortschritt:** Mehrstufige Trophäen weisen die aktuelle Stufe im Verhältnis zum Maximum aus (z. B. `Stufe 8 von 10 erreicht`).
  - **🔥 Serien-Historie:** Dynamische Serien zeigen, wie oft die Serie gelang und wann sie abriss (z. B. `🔥 3× erreicht · ⚡ 2× gerissen`).
  - **⚠️ Schand-Erfolge:** Klare Kennzeichnung des Schandflecks in der Spielerkarriere.
  - **🏆 Dauerhafte Meilensteine:** Kennzeichnung als dauerhaft in der Karriere freigeschaltet.
- **Offline-Cache (v22.7):** Aktualisierung des Offline-Speichers auf Version 22.7 für sofortige Verfügbarkeit auf allen Geräten.

### 🎯 Bereinigte Tageserfolge & präzise Trennung von Langzeit-Trophäen (v22.6)

- **Reine Tagesauszeichnungen:** In der Rubrik „Bisherige Tageserfolge“ und beim Filter „📅 Tageserfolge“ werden ab sofort ausschließlich echte Tagesauszeichnungen (wie _Tageskönig_, _Tagesserie_, _Eiswasser-Venen_, _Abräumer_ etc.) aufgeführt.
- **Saubere Trennung von Tier- & Karriereerfolgen:** Langzeit- und Lebenswerkerfolge mit Stufen (Tier 1–10) verbleiben exklusiv in der Karriere-Trophäenliste und vermischen sich nicht mehr mit den Tages-Historien.
- **Präziser Daily-Zähler:** Die Auszeichnung `👑 Daily` im Spielerprofil zeigt nun exakt die tatsächlich an einzelnen Abenden errungenen Tagestitel.
- **Offline-Cache (v22.6):** Aktualisierung des Offline-Speichers auf Version 22.6 für sofortige Verfügbarkeit auf allen Geräten.

### 📐 Kompakter Session-Header & optimierte Profilbilder (v22.5)

- **Kompaktes Spieler-Profil im Session-Tab:** Das Profilbild des Spielers in den Session-Erfolgen wurde auf eine harmonische, handliche Größe skaliert, sodass der Header nun schlank und platzsparend abschließt.
- **Strafferes Layout:** Die Abstände und Polsterungen rund um die Session-Erfolge wurden optimiert, damit mehr Trophäen und Matches ohne langes Scrollen direkt im Blickfeld liegen.
- **Offline-Cache (v22.5):** Aktualisierung des Offline-Speichers auf Version 22.5 für sofortige Verfügbarkeit auf allen Geräten.

### 🌟 Großes Redesign der Erfolge-Seite & Hall of Fame (v22.4)

- **VIP Showcase & Hall of Fame:** Die Erfolge-Seite präsentiert sich im neuen VIP-Look mit goldenen Akzenten, Glassmorphism und dynamischen Animationen.
- **Hero-Profil & Fortschritt:** Großzügiges Spielerprofil mit Level-Icon (z. B. `👑 RANG 18 • BILLARD-GOTT`), Wins-Chip, animiertem Fortschrittsbalken und nächster Rang-Vorschau.
- **4-Kachel KPI-Dashboard:** Sofortiger Überblick über 🏆 Gesamt-Erfolge, 💎 Meister (Max-Tier), 💀 Schandflecke und 👑 Daily MVP Siege.
- **Farbkodierte Trophäen-Karten:**
  - **💎 Meister (Max-Tier):** Leuchtendes Diamantblau mit `💎 MAX`-Badge für vollendete Lebenswerk-Erfolge.
  - **🥇 / 🥈 / 🥉 Stufen-Trophäen:** Gold-, Silber- und Bronze-Kennzeichnung für die jeweiligen Trophäen-Ränge.
  - **💀 Schande:** Düsterer Obsidian-Look mit blutrotem Leuchten und `💀 SCHANDE`-Kennzeichnung.
  - **👑 Bisherige Tageserfolge:** Zähler-Badges für gesammelte Tageserfolge (z. B. `5×`).
- **Schnellfilter-Leiste:** Schnelles Umschalten zwischen allen Erfolgen, Ruhm, Meister, Schande und Tageserfolgen mit Zähleranzeige.
- **Offline-Cache (v22.4):** Aktualisierung des Offline-Speichers auf Version 22.4 für sofortige Verfügbarkeit auf allen Geräten.

### 🏆 Großes Redesign der Session-Erfolge & Trophäen (v22.3)

- **Cinematic Trophy Cards:** Die Session-Erfolge erstrahlen in einem komplett überarbeiteten Look mit individuellen Spieler-Boxen, dynamischen Zählern und aufklappbaren Akkordeon-Karten.
- **Klare Typen-Differenzierung & Farbkodierung:**
  - **Tages-Ruhm (Fame):** Smaragdgrüner Leuchtrahmen, dezente Tönung und grüne `+1 Pkt`-Pille für die MVP-Wertung.
  - **Tages-Schande (Shame):** Kräftiger roter Akzent, warnender Hintergrund und unmissverständliche `Schande`-Markierung.
  - **Karriere-Meilensteine (Milestone):** Leuchtendes Gold mit glänzendem Rahmen, goldenem `✨ NEU`-Badge und `+2 Pkt`-Wertung für frisch freigeschaltete Lebenswerk-Erfolge.
- **Zusammenfassende Spieler-Karten:** Jeder Spieler hat eine kompakte Kopfzeile mit Avatar, Spieltags-Statistiken (z. B. `4 Spiele • 3 Siege`) und einer Übersicht der gesammelten Auszeichnungen (z. B. `🏆 2 Erfolge · 1 Meilenstein`).
- **Offline-Cache (v22.3):** Aktualisierung des Offline-Speichers auf Version 22.3 für sofortige Verfügbarkeit auf allen Geräten.

### 🟢 Restkugel-Auswahl über volle Breite (v22.2)

- **Horizontale Kugel-Reihe im Bearbeiten-Modal:** Beim Bearbeiten und Erfassen von Matches erstreckt sich das grüne Billardtuch mit den 3D-Kugeln (0 bis 7) nun wieder über die gesamte Fensterbreite, anstatt schmal gestaucht zu sein.
- **Bequeme Kugel-Auswahl:** Alle Restkugeln sind sauber horizontal nebeneinander angeordnet und lassen sich komfortabel und fehlerfrei antippen.
- **Offline-Cache (v22.2):** Aktualisierung des Offline-Speichers auf Version 22.2 für sofortige Verfügbarkeit auf allen Geräten.

### 🎱 Lückenlose Historie & Horizontale Kugel-Karten (v22.1)

- **Vollständige Historie aller Spieleabende:** In der Match-Historie werden nun ausnahmslos alle gespielten Spieleabende und Partien chronologisch angezeigt – die bisherige Begrenzung auf die letzten 50 Spiele wurde vollständig aufgehoben.
- **Kugel-Statistiken nebeneinander:** In der Rubrik „Kugeln & Break“ sind die Kacheln für die Kugelarten (**„🟡 Voll-Spezialist“** & **„🔵 Halb-Spezialist“** sowie die Kugel-Spezis mit Top-Siegrate) nun symmetrisch nebeneinander über die gesamte Bildschirmbreite angeordnet.
- **Offline-Cache (v22.1):** Aktualisierung des Offline-Speichers auf Version 22.1 für sofortige Verfügbarkeit auf allen Geräten.

### 📜 Großes Redesign der Match-Historie (v22.0)

- **Moderne Match-Karten:** Die gesamte Historie-Liste erstrahlt im neuen „Hall-of-Records“-Design mit dynamischen Leuchtkanten, eleganten Glas-Effekten und weicher Einblend-Animation.
- **Sieger & Verlierer auf einen Blick:** Der Gewinner wird mit Krone 👑, leuchtendem Avatar und kräftiger Schrift hervorgehoben, während der Verlierer dezent abgedunkelt wird.
- **Farbcodierte Siegarten:** Reguläre Triumphe strahlen in sattem Grün, während durch gegnerische Fehler oder Fouls entschiedene Matches in markantem Warm-Orange mit präzisem Hinweistext dargestellt werden.
- **Fixierte Datums-Kopfzeilen mit Zähler:** Beim Scrollen durch die Historie bleiben die Datums-Header oben am Bildschirmrand haften und zeigen zusätzlich die Anzahl der gespielten Matches des jeweiligen Tages an (z. B. `📅 14.09.2026 • 4 Matches`).
- **Direkte Aktionen:** Jedes Match bietet im Kartenfuß direkt erreichbare Schaltflächen zum Bearbeiten (✏️) und Löschen (🗑️) des Spiels.
- **Offline-Cache (v22.0):** Aktualisierung des Offline-Speichers auf Version 22.0 für sofortige Verfügbarkeit auf allen Geräten.

### 📏 Zeit-Kacheln über volle Seitenbreite (v21.6)

- **Volle Breiten-Nutzung:** Die beiden Zeit-Kacheln **„⏱️ Ø Siegesdauer“** und **„🐢 Längste Spieldauer“** spannen sich nun über die gesamte Seitenbreite der Rubrik „Rekorde & Fun-Stats“.
- **Ausbalanciertes 50/50-Layout:** Beide Karten teilen sich die Zeile exakt zur Hälfte und schließen bündig mit den Außenrändern ab, sodass kein ungenutzter Freiraum mehr verbleibt.
- **Offline-Cache (v21.6):** Aktualisierung des Offline-Speichers auf Version 21.6 für sofortige Verfügbarkeit auf allen Geräten.

### ⏱️ Spieldauer-Kacheln nebeneinander (v21.5)

- **Symmetrische 2er-Reihe:** In der Rubrik „Rekorde & Fun-Stats“ sind die beiden Zeit-Kacheln **„⏱️ Ø Siegesdauer“** und **„🐢 Längste Spieldauer“** nun bündig und gleich groß nebeneinander platziert.
- **Harmonisches Raster:** Das Statistik-Raster schließt dadurch mit einer perfekten zweispaltigen Zeile ab, ohne unschöne Lücken oder überbreite Einzelkarten.
- **Offline-Cache (v21.5):** Aktualisierung des Offline-Speichers auf Version 21.5 für sofortige Verfügbarkeit auf allen Geräten.

### 📌 Oben fixierte Seitenauswahl beim Scrollen (v21.4)

- **Sticky-Navigation:** Die Leiste der Seitenauswahl (🏆 Rangliste, ⚔️ Duelle, 🔬 Rekorde, 🎱 Kugeln) bleibt beim Herunterscrollen nun dauerhaft oben am Bildschirmrand fixiert.
- **Sofortiger Wechsel:** Auch tief in langen Listen (z. B. bei den Duellen oder der Rangliste) kann jederzeit bequem und ohne Zurückscrollen zwischen den Rubriken gewechselt werden.
- **Edler Frost-Effekt:** Ein hochwertiger Milchglas-Hintergrund mit Weichzeichner und dezentem Schatten sorgt dafür, dass die Tabs jederzeit perfekt lesbar bleiben und durchscrollende Inhalte elegant überlagern.
- **Offline-Cache (v21.4):** Aktualisierung des Offline-Speichers auf Version 21.4 für sofortige Verfügbarkeit auf allen Geräten.

### ⚔️ Session-Matches exklusiv unter Duelle (v21.3)

- **Saubere Rubrik-Trennung:** Die gespielten Session-Matches werden nun ausschließlich in der Rubrik „Duelle“ angezeigt.
- **Aufgeräumte Rangliste:** In der ELO-Rangliste (sowie unter Rekorde und Kugeln) tauchen die einzelnen Session-Matches nicht mehr auf, sodass die Rangliste übersichtlich und fokussiert bleibt.
- **Platzierung in Duelle:** Im Duelle-Bereich schließen die gespielten Session-Matches die Seite ganz unten (unterhalb der Head-to-Head-Übersicht) ab.
- **Offline-Cache (v21.3):** Aktualisierung des Offline-Speichers auf Version 21.3 für sofortige Verfügbarkeit auf allen Geräten.

### 🟠 Markante Farbgebung für nicht-reguläre Siege (v21.2)

- **Farbliche Differenzierung:** Alle Session-Matches, die durch gegnerische Fehler entschieden wurden (z. B. 8er zu früh versenkt, 8er ins falsche Loch oder Foul bei der 8), heben sich nun unmissverständlich in leuchtendem Warm-Orange / Bernstein von den regulären Siegen (Grün) ab.
- **Fehler-Hinweis & warmer Kachel-Look:** Betroffene Karten erhalten einen warm getönten Hintergrund, einen orangen Leuchtrahmen sowie eine klare Kennzeichnung des konkreten Fehlergrunds (`⚠️ 8er zu früh`, `⚠️ 8er falsches Loch` etc.).
- **Präzise Sieger-Würdigung:** In der Fußzeile wird transparent ausgewiesen, durch welchen gegnerischen Fehler das Match gewonnen wurde, inklusive passender oranger ELO-Pille.
- **Offline-Cache (v21.2):** Aktualisierung des Offline-Speichers auf Version 21.2 für sofortige Verfügbarkeit auf allen Geräten.

### 📍 Session-Matches am Seitenende (v21.1)

- **Optimierte Seitenstruktur:** Die Liste der gespielten Session-Matches wurde an das Ende der Seite verschoben.
- **Aufgeräumter Duell-Bereich:** Der interaktive Duell-Rechner geht nun nahtlos und ohne Unterbrechung direkt in die direkten Duelle und den Angstgegner über.
- **Perfekter Session-Rahmen:** Oben bildet das 3D-Tagessieger-Podium den Auftakt, in der Mitte stehen Ranglisten und Details, und am Fuß der Seite schließen die gespielten Session-Matches den Spieltag übersichtlich ab.
- **Offline-Cache (v21.1):** Aktualisierung des Offline-Speichers auf Version 21.1 für sofortige Verfügbarkeit auf allen Geräten.

### ⚡ Modernes Session-Match Kachel-Design (v21.0)

- **Hall-of-Records Match-Kacheln:** Die Liste der gespielten Matches einer Session erstrahlt im edlen Design der Hall of Records – mit dynamischem Leuchtrahmen, oberem Glanzstreifen und sanfter Farbaura (Grün bei regulärem Sieg, Orange bei Siegen durch gegnerisches Foul).
- **Klarer Sieger-Fokus:** Der Gewinner eines Matches wird sofort ins Auge gefasst durch leuchtenden Avatar, Sieger-Krone (👑) und fette Typografie. Der unterlegene Spieler tritt dezent in den Hintergrund.
- **Kompakte Spieldetails:** Jede Karte zeigt nun übersichtlich Match-Nummer, Uhrzeit, Spieldauer (⏱️), Kugeltyp (🟡 Volle / 🔵 Halbe), Anstoß-Indikator (⚡) sowie die verbleibenden Restkugeln.
- **Sieg-Callout & ELO-Pille:** In der Fußzeile wird der Sieger inklusive Siegtyp (z. B. Foul-Sieg) mit einem feierlichen Callout gewürdigt, flankiert von den gewonnenen ELO-Punkten in einer hervorgehobenen ELO-Pille.
- **Offline-Cache (v21.0):** Aktualisierung des Offline-Speichers auf Version 21.0 für sofortige Verfügbarkeit auf allen Geräten.

### 🏆 Kompaktes 3D-Tagessieger-Podium (v20.9)

- **Platzsparendes Treppchen-Design:** Das Tagessieger-Podium auf der Session- und Match-Erfassungsseite wurde um mehr als 50% in der Höhe gestrafft. Es wirkt deutlich aufgeräumter und lässt darunterliegenden Inhalten mehr Raum.
- **Match-Bilanz & ELO-Plus:** Unter jedem Treppchen-Spieler werden nun direkt die heutige Session-Bilanz (z. B. `5S · 0N`) sowie die erspielten ELO-Punkte (`+28 ELO`) angezeigt.
- **Integrierte MVP-Punkte:** Die Leistungspunkte sitzen nun bündig und direkt auf den 3D-Glassockeln.
- **Offline-Cache (v20.9):** Aktualisierung des Offline-Speichers auf Version 20.9 für sofortige Verfügbarkeit auf allen Geräten.

### 🥇 Olympia-Hero Tagessieger-Kacheln (v20.8)

- **Gold-Hero Pille & Medaillenspiegel:** Die Tagessieg-Statistik zeigt die Anzahl der 🥇 Tagessiege nun als auffällige, leuchtende Hero-Pille (`5× 🥇`). Darunter sind die 🥈 Silber- und 🥉 Bronze-Plätze kompakt und übersichtlich dargestellt.
- **Podest-Leuchtrahmen:** Die Kacheln heben die Platzierungen farblich hervor – Platz 1 strahlt mit goldenem Leuchtrahmen (`👑 #1 · Tagessieger-König`), Platz 2 in edlem Silber und Platz 3 in Bronze.
- **Podiumsbilanz im Untertitel:** Zeigt sofort die Gesamtzahl aller Treppchen-Erfolge (`10× auf dem Podium`).
- **Offline-Cache (v20.8):** Aktualisierung des Offline-Speichers auf Version 20.8 für sofortige Verfügbarkeit auf allen Geräten.

### 💎 Perfekt symmetrisches Kacheldesign (v20.7)

- **Symmetrische Kacheln:** Der zusätzliche linke Randstreifen wurde an allen Statistikkarten entfernt. Die Kacheln wirken nun vollkommen harmonisch und symmetrisch – der umlaufende Leuchtrahmen und der obere Glanzstreifen der Hall of Records kommen dadurch noch besser zur Geltung.
- **Offline-Cache (v20.7):** Aktualisierung des Offline-Speichers auf Version 20.7 für sofortige Verfügbarkeit auf allen Geräten.

### 🌟 Hall-of-Records Kachel-Design mit farbigem Leuchtrahmen (v20.6)

- **Farbiger Leuchtrahmen für alle Kacheln:** Alle Statistikkarten in der gesamten App (Ranglisten, Formkurve, Duell-Karten, Kugel-Spezis, Fun-Kacheln) besitzen jetzt den edlen Look der Hall of Records – mit farblich perfekt abgestimmtem Leuchtrahmen, feinem Glanzstreifen an der Oberkante und sanfter Farbaura.
- **Edler Tiefeneffekt:** Sanfter Farbverlauf und plastischer Lichtschimmer lassen die Kacheln auf allen Bildschirmen lebendig und hochwertig wirken.
- **Offline-Cache (v20.6):** Aktualisierung des Offline-Speichers auf Version 20.6 für sofortige Verfügbarkeit auf allen Geräten.

### ✨ Kachel-Optimierungen & Bereinigung (v20.5)

- **Aufgeräumte ELO-Rangliste:** Kompaktere ELO-Pillen, klare Rang-Abzeichen (`👑 #1 · ELO-Rangliste`) und platzsparend integrierte Siegserien-Badges.
- **Optimierte Formanzeige:** Formrang und aktuelle Streak (z. B. `🔥3 Serie`) sind nun direkt in der Kopfzeile kombiniert. Die Match-Bilanz zeigt Siege und Niederlagen eindeutig (`2S · 1N`).
- **Informativ Partner-Power:** Die Team-Rangliste zeigt nun präzise die Gesamtzahl an Siegen und Team-Spielen ohne unnötige Fülltexte.
- **Kompakte Kugel-Spezis:** Klare, auf den Punkt gebrachte Titel und Beschreibungen für Voll- und Halbe-Kugelspezialisten.
- **Schlankere Duell-Karten (H2H):** Die Spielanzahl sitzt nun platzsparend direkt im zentralen VS-Badge. Redundante Fußzeilen wurden entfernt, sodass die Duelle kompakter wirken.
- **Ehrenabzeichen für Anstoß & Tagessiege:** Neue dynamische Badges (wie `⚡ Anstoß-König` und `👑 #1 · Tagessieger`) sowie konkrete Tagessieger-Zähler statt generischer Bezeichnungen.
- **Offline-Cache (v20.5):** Aktualisierung des Offline-Speichers auf Version 20.5 für sofortige Verfügbarkeit auf allen Geräten.

### 🎨 Einheitliches Kachel-Design in der gesamten App (v20.0)

- **ELO-Rangliste modernisiert:** Jeder Spieler-Eintrag in der ELO-Rangliste hat jetzt das neue Split-Card-Layout: Rang-Abzeichen, Avatar und Name links – ELO-Wert als farbige Hero-Pille rechts. Aktive Streak-Badges (🔥) bleiben sichtbar.
- **Direkte Duelle Matrix neu gestaltet:** Alle 1:1-Matchup-Karten zeigen die beiden Kontrahenten klar links und rechts, mit Avatar-Chips, Siegquoten und einem kompakten Fortschrittsbalken.
- **Partner-Power (Duo-Ranking) überarbeitet:** Die Duo-Rangliste nutzt jetzt Avatar-Stacks für überlagernde Spieler-Bilder und eine klare Siegquoten-Pille rechts.
- **Kugel-Spezis aufgeteilt:** Die „Beste Siegrate pro Kugeltyp"-Kachel ist jetzt in zwei separate Kacheln aufgeteilt – eine für den 🟡 Voll-Profi und eine für das 🔵 Halbe-As.
- **Anstoß-Statistik & Tagessieg-Statistik:** Beide Ranglisten nutzen jetzt ebenfalls das konsistente Split-Card-Design mit Avatar und Hero-Pille.
- **Offline-Cache (v20.0):** Aktualisierung des Offline-Speichers auf Version 20.0 für sofortige Verfügbarkeit auf allen Geräten.

### 💎 App-weites Modern Stat-Card Design (v19.9)

- **Modernes Kachel-Layout für alle Spezialstatistiken:** Das aufgeräumte Split-Grid-Design der Fun-Kacheln wurde nun konsequent auf alle Kacheln ausgeweitet. Voll- & Halb-Kugelspezialisten, Anstoß-Vorteil, Service-Dieb und Foul-Siege erstrahlen jetzt mit prominenten Hero-Pillen und klaren Spieler-Chips.
- **Kugel-Verteilung mit Live-Balken:** Die Kugel-Verteilung (Voll vs. Halb) bietet nun zwei separate Kennzahl-Pillen sowie einen dynamischen, zweifarbigen Fortschrittsbalken für das prozentuale Verhältnis.
- **Angstgegner-Versus-Chip:** Der absolute Angstgegner wird jetzt als übersichtlicher Duell-Chip mit beiden Spieler-Avataren (`[Sieger] ⚔️ [Verlierer]`) und roter Sieg-Pille dargestellt – ohne unschönen Klammer- oder Schrägstrich-Salat.
- **Offline-Cache (v19.9):** Aktualisierung des Offline-Speichers auf Version 19.9 für sofortige Verfügbarkeit auf allen Geräten.

### 💎 Modern Stat-Cards, Rivalen-Radar & Sieges-Pulse (v19.8)

- **Modern Stat-Cards & sauberes Kachel-Layout:** Die Fun- und Spezial-Statistikkacheln wurden komplett neu gestaltet. Zahlen und Quoten stehen ab sofort aufgeräumt als farbige Hero-Pillen auf der rechten Seite, Spielernamen und Profilbilder links. Bei Gleichstand zweier oder dreier Spieler werden echte Bildstapel angezeigt – unübersichtliche Klammertexte und Schrägstriche gehören der Vergangenheit an.
- **Head-to-Head Rivalen-Radar:** Der direkte 1:1-Vergleich im Statistik-Tab erstrahlt als modernes Kontrahenten-Radar mit zwei Spielerkarten, animiertem zweifarbigem Siegesbalken, ELO-Saldo, Anstoß-Vorteil und Durchmarsch-Zähler.
- **Live Match-Pulse & Sieges-Feier:** Nach dem Speichern eines Spiels feiert die App den Sieger mit einem neuen Sieges-Banner: dynamischer Spruch, ELO-Gewinn, Spielzeit, Restkugeln und ein feierlicher akustischer Sieges-Klang.
- **Offline-Cache (v19.8):** Aktualisierung des Offline-Speichers auf Version 19.8 für sofortige Verfügbarkeit aller neuen Features auf Smartphones und PCs.

### 🔥 Formkurve & Streak-Tracker (v19.7)

- **Profisport-Formkurve der letzten 5 Spiele:** Im Statistik-Tab unter „Rangliste & Trends“ zeigt eine neue Formkurven-Kachel die letzten 5 Match-Ergebnisse jedes Spielers übersichtlich mit grünen Sieges- (`S`) und roten Niederlagen-Badges (`N`).
- **Interaktive Match-Details per Klick:** Ein Tippen oder Klick auf ein Form-Badge öffnet direkt eine kompakte Schnellansicht mit Datum und Gegner des jeweiligen Spiels.
- **Dynamische Streak-Badges & Erfolgsquote:** Automatische Erkennung und Auszeichnung von Siegesserien (`🔥 Win-Streak`, `⚡ Siege in Folge`) oder Formtiefs inklusive prozentualer Erfolgsquote der jüngsten Partien.
- **Offline-Cache (v19.7):** Aktualisierung des Offline-Speichers auf Version 19.7 für sofortige Verfügbarkeit aller neuen Features auf Smartphones und PCs.

### ✨ Design-Upgrade: Floating Glass Island & 3D-Billardkugeln (v19.6)

- **Freischwebende Glas-Navigationsleiste (iOS 18 Style):** Die untere Navigationsleiste schwebt jetzt modern und elegant als zentrierte Glas-Insel mit edlem Umgebungsglanz über dem Inhalt. Der aktive Menüpunkt wird durch einen sanft mitgleitenden Leucht-Indikator hervorgehoben.
- **3D-Billardtuch & Kugeln bei der Match-Erfassung:** Bei der Ergebniserfassung und Spielbearbeitung werden Restkugeln nun auf einem echten grünen Billardtuch mit fotorealistischen 3D-Kugeln (Turnierfarben 1–7 und Kugel 0 für volles Abräumen) ausgewählt.
- **Live-Auswahlanzeige:** Direkt unter dem Billardtuch wird die aktuell gewählte Restkugelanzahl sofort im Klartext angezeigt.
- **Offline-Cache (v19.6):** Automatische Aktualisierung des Speichers auf Version 19.6 für sofortige Verfügbarkeit aller neuen Designs auf Smartphones und PCs.

### 📲 Schnellzugriff & App-Info (v19.5)

- **Header-Schnellzugriff:** Rechts oben im App-Kopf stehen ab sofort zwei Schnellzugriffs-Buttons bereit: Ein Info-Button (`ℹ️`) und ein Aktualisierungs-Button (`🔄`).
- **Interaktives App-Info- & Changelog-Fenster:** Über den Info-Button (`ℹ️`) können die aktuelle App-Version, Beschreibungen und alle Neuerungen direkt in einem übersichtlichen Dialogfenster nachgelesen werden.
- **Komfortable Ein-Klick-Aktualisierung:** Mit dem Update-Button (`🔄`) lässt sich die App jederzeit mit einem einzigen Klick auf den neuesten Stand bringen.
- **Offline-Cache (v19.5):** Aktualisierung des Offline-Speichers auf Version 19.5 für sofortige Verfügbarkeit aller neuen Funktionen auf Smartphones und PCs.

### 🛠️ Fehlerbehebungen & Stabilitäts-Update (v19.4)

- **Erfolgs-Synchronisierung:** Der Bestätigungsdialog zur nachträglichen Prüfung und Synchronisierung historischer Tages-Erfolge lässt sich nun wieder reibungslos öffnen, starten und abbrechen.
- **Optimierte Bild- & Avatarladezeiten:** Alle Spieler-Avatare werden jetzt durchgängig im modernen, datensparenden WebP-Format geladen, was unschöne Bildfehler und Verzögerungen verhindert.
- **Stabile Ranglisten- & ELO-Berechnung:** Die Berechnungslogik wurde gegen Ausreißer und unvollständige Spieldaten gehärtet, sodass Ranglisten stets fehlerfrei und ohne Verzögerungen berechnet werden.
- **Offline-Cache (v19.4):** Aktualisierung des Service-Worker-Caches auf Version 19.4 für zuverlässigere Offline-Verfügbarkeit.

### ⚡️ Leistungs- & Stabilitäts-Update (v19.3)

- **Optimierte Synchronisation:** Verbesserte Echtzeit-Datenverbindung und beschleunigte Ladezeiten beim Starten der App.
- **Match-Erfassung:** Noch schnellere Spielerauswahl und flüssigere Bedienung im Erfassungs-Tab.
- **Service Worker & Offline-Cache:** Automatische Aktualisierung auf Version 19.3 für sofortige Verfügbarkeit aller neuen Optimierungen.

### 🏆 Tagessieger & Session-MVP: Dauerhaft stabile Punkte (v19.2)

- **Fix für Tagessieger-Punkte:** Die erreichten Leistungspunkte und die Platzierung des Tagessiegers (Session-MVP) bleiben nun auch an Folgetagen dauerhaft stabil und unverändert erhalten.
- **Historische Meilensteine:** An einem Spieleabend neu geknackte Karriere-Erfolge und Nemesis-Siege fließen dauerhaft korrekt in die Tagessieger-Wertung dieses Abends ein und gehen am nächsten Tag nicht mehr verloren.
- **Konsistente Tagessieg-Statistik:** Die Allzeit-Rangliste der Tagessiege (🥇 / 2. / 3.) wertet vergangene Spieleabende nun mit exakt denselben Leistungspunkten aus, die auch im Session-Podium erzielt wurden.
