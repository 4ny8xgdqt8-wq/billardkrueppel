# Billardkrüppel App

Offizielle Web-App zur Erfassung von Matches, Ranglisten, Statistiken und Erfolgen der Billardkrüppeltruppe.

---

## 🚀 Was ist neu (Changelog)

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
