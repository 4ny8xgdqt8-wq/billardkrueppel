// Hilfsfunktion für deterministische Index-Auswahl (z.B. für Achievement-Phrasen)
window.getFixedIndex = (name, arrayLength) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % arrayLength;
};

// Animation utility for numbers (moved from index.html)
window.animateNumber = (id, target) => {
    const el = document.getElementById(id);
    if (!el) return;
    const duration = 800; // Dauer der Animation in ms
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * target);
        el.innerText = id.includes('winrate') ? current + "%" : current;
        if (progress < 1) window.requestAnimationFrame(step);
        else el.innerText = id.includes('winrate') ? Math.round(target) + "%" : Math.round(target);
    };
    window.requestAnimationFrame(step);
};
// ---------------------------------------

// --- GLOBALE POOLS ---
window.dailyFamePool = [
  { k: "fame", cond: (d) => d.todayGames > 0 && d.todayWins === d.todayGames, i: "👑", t: "Tageskönig", d: ["Heute ungeschlagen!", "Der Chef im Haus (für heute).", "Niemand kam an ihm vorbei.", "Ein perfekter Tag.", "Heute spielt er in einer eigenen Liga.", "Die weiße Weste."] , h: "Spiel heute mindestens ein Match und bleib ungeschlagen"},
  { k: "fame", cond: (d) => d.todayMaxStreak >= 3, i: "🔥", t: "Tagesserie", d: ["Er ist heute im Tunnel!", "Die Serie lebt."], h: "Gewinne heute 3 Spiele in Folge" },
  { k: "fame", cond: (d) => d.todayMaxStreak >= 5, i: "🔥", t: "Tages-Terror", d: ["Feuerwehr rufen!", "Nicht zu stoppen."], h: "Gewinne heute 5 Spiele in Folge" },
  { k: "fame", cond: (d) => (d.todayWins / (d.todayGames || 1)) >= 0.75 && d.todayGames >= 4, i: "🎯", t: "Scharfschütze", d: ["Präzise wie ein Laser.", "Heute sitzt alles."], h: "Gewinne heute 75% der Matches (mind. 4 Spiele)" },
  { k: "fame", cond: (d) => (d.todayKillerPoints / (d.todayWins || 1)) >= 5.5 && d.todayWins >= 2, i: "🧹", t: "Abräumer", d: ["Hinterlässt verbrannte Erde.", "Keine Gnade heute."], h: "Lass heute im Schnitt 5,5+ Kugeln beim Gegner liegen (mind. 2 Siege)" },
  { k: "fame", cond: (d) => d.todayClutchWins >= 2, i: "🦾", t: "Eiswasser-Venen", d: ["Kalt wie Eis.", "Matchball-König des Tages."], h: "Gewinne heute 2 enge Matches (Gegner Rest 1)" },
  { k: "fame", cond: (d) => d.todayBreakWins >= 1, i: "⚡", t: "Blitz-Sieg", d: ["Anstoß, Kontrolle, Sieg.", "Kurz und schmerzlos."], h: "Gewinne heute ein Match direkt nach Anstoß" },
  { k: "fame", cond: (d) => d.todayWins >= 3 && d.todayBlackWinsCount === 0, i: "💎", t: "Tages-Ehrenmann", d: ["Gewinnt sauber.", "Ein Vorbild an Fairness."], h: "Gewinne heute 3 Spiele ohne Schwarz-Fehler-Sieg" },
  { k: "fame", cond: (d) => d.todayWins >= 3 && d.todayGames === 3, i: "🎩", t: "Hattrick-Hero", d: ["Drei Spiele, drei Siege. Abrakadabra.", "Zaubert heute am Tisch.", "Der Magier des Abends.", "Verschwindibus mit den Kugeln.", "Ein magischer Lauf.", "Meister der Illusion."] , h: "Gewinne heute 3 von 3 Spielen"},
  { k: "fame", cond: (d) => d.todayWins >= 5 && d.todayKillerPoints > d.todayWins * 6, i: "🪓", t: "Tages-Schlächter", d: ["Brutale Effizienz heute.", "Ein blutiger Pfad."], h: "Lass heute im Schnitt 6+ Kugeln beim Gegner (mind. 5 Siege)" },
  { k: "fame", cond: (d) => d.todayGames >= 5 && d.todayWins >= 4, i: "🔋", t: "Dauerbrenner", d: ["Hat heute einen Lauf wie ein Uhrwerk.", "Energie ohne Ende.", "Zieht sein Ding heute gnadenlos durch.", "Ein Arbeitstier am Queue.", "Heute brennt die Matte.", "Nicht aufzuhalten."] , h: "Spiel heute mindestens 5 Matches – und Hol dir mindestens 4 Siege"},
  { k: "fame", cond: (d) => d.todayGames >= 6 && d.todayWins >= 4, i:"🌞", t:"Session-Held I",  d:["Guter Abend.","Solide Session.","Heute warst du da.","Fleiß zahlt sich aus.","Starker Rhythmus."], h:"Heute: 6 Spiele & 4 Siege", g:"Session-Held", tier:1 },
  { k: "fame", cond: (d) => d.todayGames >= 10 && d.todayWins >= 7, i:"🌞", t:"Session-Held II", d:["Das ist Arbeit.","Durchgezogen.","Starker Drive.","Heute war deiner.","Sehr stabil."], h:"Heute: 10 Spiele & 7 Siege", g:"Session-Held", tier:2 },
  { k: "fame", cond: (d) => d.todayGames >= 14 && d.todayWins >= 11,i:"🌞", t:"Session-Held III",d:["Heute war absolut wild.","Marathon-Boss.","Du hast den Tisch gefressen.","Unfassbar aktiv.","Session-Monster."], h:"Heute: 14 Spiele & 11 Siege", g:"Session-Held", tier:3, max:true },
  { k: "fame", cond: (d) => d.todayBreakWins >= 2, i: "🚀", t: "Express-Service", d: ["Anstoß, abräumen, Feierabend.", "Der Gegner saß nur rum.", "Kurzer Prozess heute."], h: "Heute mindestens 2 Siege direkt nach eigenem Anstoß" },
  { k: "fame", cond: (d) => d.todayClutchWins >= 3, i: "💎", t: "Crunchtime-König", d: ["Druck ist sein Hobby.", "Eiskalt bei der letzten Kugel.", "Nerven aus Stahl-Seilen."], h: "Heute 3+ Siege, bei denen der Gegner nur noch 1 Kugel hatte" },
  { k: "fame", cond: (d) => d.todayWins >= 3 && (d.todayKillerPoints / d.todayWins) >= 6.5, i: "🧹", t: "Tisch-Staubsauger", d: ["Hinterlässt klinisch reine Tische.", "Gegner braucht ein Fernrohr für seine Kugeln."], h: "Heute 3+ Siege mit Ø 6,5+ Restkugeln beim Gegner" },
];

window.dailyShamePool = [
  { k: "shame", cond: (d) => d.todayGames >= 4 && d.todayWins === 0, i: "💀", t: "Friedhofswärter", d: ["Heute nur Gräber geschaufelt.", "Totalausfall."], h: "Heute mindestens 4 Spiele & 0 Siege" },
  { k: "shame", cond: (d) => d.todayAvgRest >= 6.5 && d.todayGames >= 3, i: "🧟", t: "Tages-Statist", d: ["War er heute überhaupt am Tisch?", "Ein treuer Zuschauer."], h: "Heute im Schnitt 6,5+ Reste bei Niederlagen (mind. 3 Spiele)" },
  { k: "shame", cond: (d) => d.todayBlackWinsCount >= 2, i: "🐀", t: "Tages-Ratte", d: ["Nährt sich vom Unglück anderer.", "Abstauber-König heute."], h: "Heute mindestens 2 Siege durch Schwarz-Fehler" },
  { k: "shame", cond: (d) => d.todayGames >= 3 && d.todayClutchWins === 0 && d.todayWins === 0, i: "🫣", t: "Kneifer (Heute)", d: ["Wenn's zählt, ist er weg.", "Der Druck gewinnt heute."], h: "Heute kein Sieg bei mindestens 3 Versuchen" },
  { k: "shame", cond: (d) => d.todayRest >= 15, i: "🗑️", t: "Tages-Depot", d: ["Er sammelt heute alles – außer Siege.", "Restkugeln-Lagerverwaltung."], h: "Heute insgesamt 15+ Kugeln liegen gelassen" },
  { k: "shame", cond: (d) => d.todayGames >= 2 && d.todayWins === 0 && d.rest > 8, i: "🌧️", t: "Regentanz", d: ["Trübe Aussichten am Tisch.", "Ein verregneter Nachmittag.", "Nichts glänzt heute.", "Er braucht einen Regenschirm für die Tränen.", "Ein Tiefdruckgebiet am Queue.", "Warten auf die Sonne."], h: "Spiel heute mind. 2 Matches, gewinne keins und lass insgesamt 8+ Kugeln liegen"},
  { k: "shame", cond: (d) => d.todayMaxStreak === 0 && d.todayGames >= 4, i: "🧊", t: "Eiszeit", d: ["Nicht mal ein Mini-Lauf.", "Alles kalt heute."], h: "Heute 4+ Spiele ohne eine einzige kleine Serie" },
  { k: "shame", cond: (d) => d.todayGames >= 5 && d.todayWins <= 1, i: "📉", t: "Abstiegs-Kandidat", d: ["Der Keller ist heute dein Zuhause.", "Formkurve zeigt steil nach unten."], h: "Heute mindestens 5 Spiele und höchstens 1 Sieg" },
  { k: "shame", cond: (d) => d.todayAvgRest >= 8.0 && d.todayGames >= 2, i: "🧱", t: "Mauerblümchen", d: ["Lässt heute den Tisch voll stehen.", "Baut lieber Mauern als Löcher zu füllen."], h: "Heute im Schnitt 8+ Reste bei Niederlagen (mind. 2 Spiele)" },
  { k: "shame", cond: (d) => d.todayRest >= 25, i: "🚜", t: "Tages-Ackerer", d: ["Hat heute ordentlich Furchen gezogen.", "Viel Arbeit, kein Ertrag."], h: "Heute insgesamt 25+ Reste bei Niederlagen gesammelt" },
  { k: "shame", cond: (d) => d.todayBlackWinsCount >= 4, i: "🐀", t: "Ratten-König", d: ["Der König des Schmutzes.", "Gewinnt heute nur durch Patzer."], h: "Heute mindestens 4 Siege durch Schwarz-Fehler" },
  { k: "shame", cond: (d) => d.todayGames >= 3 && d.todayWins === 0 && d.todayClutchWins === 0, i: "🕯️", t: "Tages-Licht", d: ["War heute nur zur Beleuchtung da.", "Kein einziger Sieg in Sicht."], h: "Heute mindestens 3 Spiele ohne jeglichen Erfolg" },
  { k: "shame", cond: (d) => (d.todayGames - d.todayWins) >= 2 && d.todayAvgRest <= 1.2, i: "😭", t: "Tragik-Meister", d: ["So nah und doch so fern.", "Die letzte Kugel ist sein Endgegner heute.", "Pechvogel-Abo abgeschlossen."], h: "Verliere heute mind. 2 Matches extrem knapp (Gegner Rest 1)" },
  { k: "shame", cond: (d) => d.todayAvgRest >= 7.2 && d.todayGames >= 3, i: "🍃", t: "Eco-Modus", d: ["Schont die Taschen.", "Bewegt Kugeln heute nur minimal.", "Energiesparmodell am Tisch."], h: "Heute Ø 7,2+ Reste bei mindestens 3 Niederlagen" },
  { k: "shame", cond: (d) => d.todayGames >= 6 && (d.todayWins / d.todayGames) <= 0.2, i: "🪑", t: "Sitzriese", d: ["Hat heute ein Abo auf der Bank.", "Bester Zuschauer des Abends.", "Sitzfleisch-Champion."], h: "Heute mindestens 6 Spiele und maximal 20% Siegquote" },
];

// All-Time Pools (global verfügbar für die Übersicht)
window.famePool = [
  { cond: (d) => d.maxStreak >= 3, i: "🔥", t: "Serientäter I", d: ["Er ist im Tunnel!", "Die Serie lebt.", "Warmgelaufen.", "Jetzt rollt’s.", "Momentum!"], h: "Gewinne mindestens 3 Spiele in Folge", g: "Serientäter", tier: 1 },
  { cond: (d) => d.maxStreak >= 5, i: "🔥", t: "Serientäter II", d: ["Feuerwehr rufen!", "Heißer Lauf.", "Nicht zu stoppen.", "Der Gegner schwitzt.", "Die Matte brennt."], h: "Gewinne mindestens 5 Spiele in Folge", g: "Serientäter", tier: 2 },
  { cond: (d) => d.maxStreak >= 8, i: "🔥", t: "Serientäter III", d: ["Cheat-Code gefunden.", "Absolute Zerstörung.", "Acht am Stück?!", "Das ist legendär.", "Was für ein Lauf!"], h: "Gewinne mindestens 8 Spiele in Folge", g: "Serientäter", tier: 3 },
  { cond: (d) => d.maxStreak >= 10, i: "🔥", t: "Serientäter IV", d: ["Cheat-Code gefunden.", "Absolute Zerstörung.", "Acht am Stück?!", "Das ist legendär.", "Was für ein Lauf!"], h: "Gewinne mindestens 10 Spiele in Folge", g: "Serientäter", tier: 4 },
  { cond: (d) => d.maxStreak >= 12, i: "🔥", t: "Serientäter V", d: ["Cheat-Code gefunden.", "Absolute Zerstörung.", "Acht am Stück?!", "Das ist legendär.", "Was für ein Lauf!"], h: "Gewinne mindestens 12 Spiele in Folge", g: "Serientäter", tier: 5, max: true },
  { cond: (d) => (d.maxWinRate || d.winRate) >= 60 && d.games >= 5, i: "🎯", t: "Scharfschütze I", d: ["Solide Quote!", "Die Taschen sind heute freundlich.", "Trefferbild passt.", "Sauber gespielt.", "Guter Fokus."], h: "Erreiche eine Winrate von 60% (mind. 5 Spiele)", g: "Scharfschütze", tier: 1 },
  { cond: (d) => (d.maxWinRate || d.winRate) >= 75 && d.games >= 8, i: "🎯", t: "Scharfschütze II", d: ["Operiert mit dem Queue.", "Kein Millimeter Abweichung.", "Das ist ernst.", "Präzise wie ein Laser.", "Heute sitzt’s."], h: "Erreiche eine Winrate von 75% (mind. 8 Spiele)", g: "Scharfschütze", tier: 2 },
  { cond: (d) => (d.maxWinRate || d.winRate) >= 85 && d.games >= 12, i: "🎯", t: "Scharfschütze III", d: ["Das ist eine andere Liga.", "Präzision am Limit.", "85%+ ist frech gut.", "Der Tisch ist im Griff.", "Kunst am Filz."], h: "Erreiche eine Winrate von 85% (mind. 12 Spiele)", g: "Scharfschütze", tier: 3, max: true },
  { cond: (d) => d.avgKiller >= 4.5 && d.wins >= 3, i: "🧹", t: "Abräumer I", d: ["Der Tisch wird leerer.", "Gegner hat viel zu tun.", "Saubere Dominanz.", "Du räumst auf.", "Guter Start."], h: "Lass im Schnitt mindestens 4,5 Kugeln beim Gegner übrig (pro Sieg)", g: "Abräumer", tier: 1 },
  { cond: (d) => d.avgKiller >= 5.5 && d.wins >= 5, i: "🧹", t: "Abräumer II", d: ["Hinterlässt verbrannte Erde.", "Das ist brutal effizient.", "Gegner sammelt nur noch.", "Abriss läuft.", "Keine Gnade."], h: "Lass im Schnitt mindestens 5,5 Kugeln beim Gegner übrig (pro Sieg)", g: "Abräumer", tier: 2 },
  { cond: (d) => d.avgKiller >= 6.5 && d.wins >= 8, i: "🧹", t: "Abräumer III", d: ["Das ist eine Rasur.", "Der Gegner sieht nur noch Reste.", "Dominanz pur.", "Metzger deluxe.", "Unfair gut."], h: "Lass im Schnitt mindestens 6,5 Kugeln beim Gegner übrig (pro Sieg)", g: "Abräumer", tier: 3, max: true },
  { cond: (d) => d.clutchWins >= 2, i: "🦾", t: "Eiswasser-Venen I", d: ["Nerven behalten.", "Matchball? Kein Problem.", "Ruhig bleiben.", "Kalt wie Eis.", "Druck prallt ab."], h: "Gewinne 2 enge Matches (Gegner hat nur 1 Kugel übrig)", g: "Eiswasser-Venen", tier: 1 },
  { cond: (d) => d.clutchWins >= 4, i: "🦾", t: "Eiswasser-Venen II", d: ["Er lächelt, während’s brennt.", "Der Mann für die letzte Kugel.", "Nerven aus Titan.", "Unfassbar ruhig.", "Eiskalt geliefert."], h: "Gewinne 4 enge Matches (Gegner hat nur 1 Kugel übrig)", g: "Eiswasser-Venen", tier: 2 },
  { cond: (d) => d.clutchWins >= 7, i: "🦾", t: "Eiswasser-Venen III", d: ["Finale Kugel = Routine.", "Wenn’s zählt, wird er stärker.", "Matchball ist Zuhause.", "Unfair ruhig.", "Crunchtime-Killer."], h: "Gewinne 7 enge Matches (Gegner hat nur 1 Kugel übrig)", g: "Eiswasser-Venen", tier: 3 },
  { cond: (d) => d.clutchWins >= 11, i: "🦾", t: "Eiswasser-Venen IV", d: ["Druck ist sein Lieblingsmodus.", "Er bleibt eiskalt.", "Keine Zitterhand.", "Das endet immer gleich.", "Matchball? Danke."], h: "Gewinne 11 enge Matches (Gegner hat nur 1 Kugel übrig)", g: "Eiswasser-Venen", tier: 4 },
  { cond: (d) => d.clutchWins >= 16, i: "🦾", t: "Eiswasser-Venen V", d: ["Er sammelt krimis wie Trophäen.", "Wenn’s eng wird, wird er besser.", "Kopf bleibt ruhig.", "Das ist Nerven-Deluxe.", "Der Druck verliert."], h: "Gewinne 16 enge Matches (Gegner hat nur 1 Kugel übrig)", g: "Eiswasser-Venen", tier: 5 },
  { cond: (d) => d.clutchWins >= 25, i: "🦾", t: "Eiswasser-Venen VI", d: ["Crunchtime ist sein Zuhause.", "Er lebt für die letzte Kugel.", "Abgezockt bis ins Mark.", "Das ist schon unfair.", "Eiskalt, immer."], h: "Gewinne 25 enge Matches (Gegner hat nur 1 Kugel übrig)", g: "Eiswasser-Venen", tier: 6 },
  { cond: (d) => d.clutchWins >= 40, i: "🦾", t: "Eiswasser-Venen VII", d: ["40 Krimis gewonnen. Wow.", "Das ist kein Zufall mehr.", "Er macht Druck zu Punkten.", "Killer am Ende.", "Er wackelt nie."], h: "Gewinne 40 enge Matches (Gegner hat nur 1 Kugel übrig)", g: "Eiswasser-Venen", tier: 7 },
  { cond: (d) => d.clutchWins >= 65, i: "🦾", t: "Eiswasser-Venen VIII", d: ["Jetzt wird’s legendär.", "Matchball ist Routine.", "Er spielt mit Nerven anderer.", "Der Endspurt ist sein Spiel.", "Eis im Blut."], h: "Gewinne 65 enge Matches (Gegner hat nur 1 Kugel übrig)", g: "Eiswasser-Venen", tier: 8 },
  { cond: (d) => d.clutchWins >= 105, i: "🦾", t: "Eiswasser-Venen IX", d: ["Das ist Endgame.", "Wenn’s zählt, gewinnt er.", "105 Krimis – krank.", "Druck? Er lacht.", "Unfassbar."], h: "Gewinne 105 enge Matches (Gegner hat nur 1 Kugel übrig)", g: "Eiswasser-Venen", tier: 9 },
  { cond: (d) => d.clutchWins >= 250, i: "🦾", t: "Eiswasser-Venen X", d: ["MAX-Tier erreicht.", "Crunchtime-Gottmodus.", "250 Krimis gewonnen – was?!", "Der Endboss der letzten Kugel.", "Legendär."], h: "Gewinne 250 enge Matches (Gegner hat nur 1 Kugel übrig)", g: "Eiswasser-Venen", tier: 10, max: true },
  { cond: (d) => d.breakWins >= 1, i: "⚡", t: "Blitz-Sieg I", d: ["Anstoß, Kontrolle, Sieg.", "Kurz und schmerzlos.", "Kein Warmwerden für den Gegner.", "Zack – vorbei.", "Schneller geht’s kaum."], h: "Gewinne mindestens 1 Match direkt nach deinem Anstoß", g: "Blitz-Sieg", tier: 1 },
  { cond: (d) => d.breakWins >= 2, i: "⚡", t: "Blitz-Sieg II", d: ["Doppelt eingeschlagen.", "Der Anstoß ist eine Waffe.", "Der Gegner blinzelt noch.", "Tempo-Boss.", "Lichtgeschwindigkeit."], h: "Gewinne mindestens 2 Matches direkt nach deinem Anstoß", g: "Blitz-Sieg", tier: 2 },
  { cond: (d) => d.breakWins >= 4, i: "⚡", t: "Blitz-Sieg III", d: ["Anstoß-Dominanz pur.", "Wie ein Sturm.", "Das ist unfair schnell.", "Viermal direkt zugeschlagen.", "Der Tisch bebt."], h: "Gewinne mindestens 4 Matches direkt nach deinem Anstoß", g: "Blitz-Sieg", tier: 3 },
  { cond: (d) => d.breakWins >= 7, i: "⚡", t: "Blitz-Sieg IV", d: ["Jetzt wird’s gefährlich.", "Der Break ist Kontrolle.", "Er bestimmt das Spiel von Anfang an.", "Gegner reagiert nur noch.", "Starker Start."], h: "Gewinne mindestens 7 Matches direkt nach deinem Anstoß", g: "Blitz-Sieg", tier: 4 },
  { cond: (d) => d.breakWins >= 11, i: "⚡", t: "Blitz-Sieg V", d: ["Der Start ist sein Vorteil.", "Er übernimmt sofort.", "Das ist kein Zufall mehr.", "Tempo + Kontrolle.", "Sehr stark."], h: "Gewinne mindestens 11 Matches direkt nach deinem Anstoß", g: "Blitz-Sieg", tier: 5 },
  { cond: (d) => d.breakWins >= 16, i: "⚡", t: "Blitz-Sieg VI", d: ["Explosiver Beginn, sauberes Ende.", "Er nutzt jeden Anstoß.", "Startvorteil = Sieg.", "Gefährlich von Anfang an.", "Sehr konstant."], h: "Gewinne mindestens 16 Matches direkt nach deinem Anstoß", g: "Blitz-Sieg", tier: 6 },
  { cond: (d) => d.breakWins >= 25, i: "⚡", t: "Blitz-Sieg VII", d: ["25× direkt dominiert.", "Sein Break entscheidet Spiele.", "Kaum eine Chance für Gegner.", "Tempo ist sein Spielstil.", "Sehr dominant."], h: "Gewinne mindestens 25 Matches direkt nach deinem Anstoß", g: "Blitz-Sieg", tier: 7 },
  { cond: (d) => d.breakWins >= 40, i: "⚡", t: "Blitz-Sieg VIII", d: ["40 Dominanz-Siege.", "Der Start ist sein Sieg.", "Das ist absolute Kontrolle.", "Gegner verliert beim Break.", "Elite-Level."], h: "Gewinne mindestens 40 Matches direkt nach deinem Anstoß", g: "Blitz-Sieg", tier: 8 },
  { cond: (d) => d.breakWins >= 65, i: "⚡", t: "Blitz-Sieg IX", d: ["Jetzt wird’s legendär.", "Der Break ist tödlich.", "Kaum jemand überlebt den Start.", "65× direkt gewonnen.", "Das ist krank gut."], h: "Gewinne mindestens 65 Matches direkt nach deinem Anstoß", g: "Blitz-Sieg", tier: 9 },
  { cond: (d) => d.breakWins >= 100, i: "⚡", t: "Blitz-Sieg X", d: ["MAX-Tier erreicht.", "Der Anstoß ist eine Waffe.", "100 Sofortsiege.", "Der Gegner hat keine Chance.", "Legendärer Startspieler."], h: "Gewinne mindestens 100 Matches direkt nach deinem Anstoß", g: "Blitz-Sieg", tier: 10, max: true },              
  { cond: (d) => d.games >= 25, i: "🎖️", t: "Legende I", d: ["Schon gut was gemacht.", "Er kennt den Tisch.", "Routine kommt.", "Match-Maschine.", "Weiter so."], h: "Spiele mindestens 25 Matches", g: "Legende", tier: 1 },
  { cond: (d) => d.games >= 50, i: "🎖️", t: "Legende II", d: ["50 Matches – Respekt.", "Konstant am Start.", "Ausdauer zahlt sich aus.", "Er gehört zur Einrichtung.", "Das ist Einsatz."], h: "Spiele mindestens 50 Matches", g: "Legende", tier: 2 },
  { cond: (d) => d.games >= 100, i: "🎖️", t: "Legende III", d: ["100 Matches – stark.", "Der Tisch kennt seinen Namen.", "Wahnsinnige Ausdauer.", "Routine auf einem neuen Level.", "Absolute Konstanz."], h: "Spiele mindestens 100 Matches", g: "Legende", tier: 3 },
  { cond: (d) => d.games >= 150, i: "🎖️", t: "Legende IV", d: ["150 Matches – Maschine.", "Er ist immer da.", "Der Abend gehört ihm.", "Konstanz wie ein Uhrwerk.", "Weiter geht’s."], h: "Spiele mindestens 150 Matches", g: "Legende", tier: 4 },
  { cond: (d) => d.games >= 200, i: "🎖️", t: "Legende V", d: ["200 Matches – Veteran.", "Er hat alles gesehen.", "Die Routine ist brutal.", "Der Tisch ist sein Revier.", "Respekt."], h: "Spiele mindestens 200 Matches", g: "Legende", tier: 5 },
  { cond: (d) => d.games >= 300, i: "🎖️", t: "Legende VI", d: ["300 Matches – unmenschlich.", "Das ist Hingabe.", "Er lebt am Filz.", "Der Tisch kennt jede Macke.", "Pure Leidenschaft."], h: "Spiele mindestens 300 Matches", g: "Legende", tier: 6 },
  { cond: (d) => d.games >= 400, i: "🎖️", t: "Legende VII", d: ["400 Matches – Mythos.", "Er ist Teil des Tisches.", "Das ist Endlos-Modus.", "Konstanz ohne Ende.", "Wahnsinn."], h: "Spiele mindestens 400 Matches", g: "Legende", tier: 7 },
  { cond: (d) => d.games >= 600, i: "🎖️", t: "Legende VIII", d: ["600 Matches – Lebenswerk.", "Das ist schon Geschichte.", "Er war immer da.", "Der Filz ist sein Zuhause.", "Legendär."], h: "Spiele mindestens 600 Matches", g: "Legende", tier: 8 },
  { cond: (d) => d.games >= 800, i: "🎖️", t: "Legende IX", d: ["800 Matches – Unsterblich.", "Das ist nicht mehr normal.", "Der Tisch verneigt sich.", "Die Ausdauer ist absurd.", "Ein Monument."], h: "Spiele mindestens 800 Matches", g: "Legende", tier: 9 },
  { cond: (d) => d.games >= 1000, i: "🎖️", t: "Legende X", d: ["MAX-Tier erreicht.", "1000 Matches – absolut krank.", "Der Filz spricht deinen Namen.", "Das ist endgame.", "Unfassbar."], h: "Spiele mindestens 1000 Matches", g: "Legende", tier: 10, max: true },              
  { cond: (d) => d.winRate > 50 && d.blackWinsCount === 0, i: "💎", t: "Ehrenmann", d: ["Gewinnt sauber ohne Ratten-Taktik.", "Ein Gentleman am grünen Tisch.", "Keine Geschenke, nur Skill.", "Harte Arbeit schlägt Glück.", "Gewinnt mit Anstand und Stil.", "Ein Vorbild an Fairness."] , h: "Gewinne mindestens 50% deiner Matches – und Gewinne ohne Schwarz-Fehler-Sieg"},
  { cond: (d) => d.wins >= 10, i: "🏛️", t: "Hall of Famer I", d: ["Zweistellig!", "Die Hall of Fame ruft.", "Respektable Zahl.", "Da steckt Arbeit drin.", "Weiter so."], h: "Hol dir mindestens 10 Siege", g: "Hall of Famer", tier: 1 },
  { cond: (d) => d.wins >= 20, i: "🏛️", t: "Hall of Famer II", d: ["20 Siege – stark.", "Du wirst zur Konstante.", "Das ist Klasse.", "Die Tafel glänzt.", "Legendenstoff."], h: "Hol dir mindestens 20 Siege", g: "Hall of Famer", tier: 2 },
  { cond: (d) => d.wins >= 30, i: "🏛️", t: "Hall of Famer III", d: ["30 Siege – wow.", "Der Name bleibt hängen.", "Das ist Dominanz.", "Die Halle ist dein Zuhause.", "Großes Kino."], h: "Hol dir mindestens 30 Siege", g: "Hall of Famer", tier: 3 },
  { cond: (d) => d.wins >= 45, i: "🏛️", t: "Hall of Famer IV", d: ["45 Siege – Maschine.", "Die Zahlen werden ernst.", "Das ist kein Zufall mehr.", "Konstanz mit Ansage.", "Weiter drücken."], h: "Hol dir mindestens 45 Siege", g: "Hall of Famer", tier: 4 },
  { cond: (d) => d.wins >= 60, i: "🏛️", t: "Hall of Famer V", d: ["60 Siege – Respekt.", "Da steckt Arbeit drin.", "Du bist ein Fixpunkt.", "Die Halle applaudiert.", "Stark."], h: "Hol dir mindestens 60 Siege", g: "Hall of Famer", tier: 5 },
  { cond: (d) => d.wins >= 80, i: "🏛️", t: "Hall of Famer VI", d: ["80 Siege – Veteran.", "Er kennt jeden Trick.", "Routine + Klasse.", "Die Konkurrenz verzweifelt.", "Ansage."], h: "Hol dir mindestens 80 Siege", g: "Hall of Famer", tier: 6 },
  { cond: (d) => d.wins >= 105, i: "🏛️", t: "Hall of Famer VII", d: ["105 Siege – Legendenkurs.", "Das ist ein Statement.", "Die Halle ist dein Revier.", "Keine Zufälle mehr.", "Groß."], h: "Hol dir mindestens 105 Siege", g: "Hall of Famer", tier: 7 },
  { cond: (d) => d.wins >= 140, i: "🏛️", t: "Hall of Famer VIII", d: ["140 Siege – Mythos.", "Die Zahlen werden wild.", "Du bist der Maßstab.", "Die Halle verneigt sich.", "Unfassbar."], h: "Hol dir mindestens 140 Siege", g: "Hall of Famer", tier: 8 },
  { cond: (d) => d.wins >= 190, i: "🏛️", t: "Hall of Famer IX", d: ["190 Siege – Endgame.", "Das ist nicht mehr normal.", "Du bist die Statistik.", "Die Halle kennt nur noch dich.", "Wahnsinn."], h: "Hol dir mindestens 190 Siege", g: "Hall of Famer", tier: 9 },
  { cond: (d) => d.wins >= 250, i: "🏛️", t: "Hall of Famer X", d: ["MAX-Tier erreicht.", "250 Siege – krank.", "Die Halle ist dein Zuhause.", "Das ist Unsterblichkeit.", "Legendär."], h: "Hol dir mindestens 250 Siege", g: "Hall of Famer", tier: 10, max: true },
  { cond: (d) => d.games >= 5 && d.avgKiller >= 6, i: "🚯", t: "Clean-Up Crew", d: ["Er lässt den Tisch sauberer als er ihn fand.", "Null Toleranz für Restkugeln.", "Ein Mann, ein Wort, ein leeres Loch.", "Effizienz ist seine Superkraft.", "Keine Kugel ist vor ihm sicher.", "Er macht das Licht aus."] , h: "Spiele mindestens 5 Matches – und Lass im Schnitt mindestens 6 Kugeln beim Gegner übrig (pro Sieg)"},
  { cond: (d) => (d.maxWinRate || d.winRate) >= 80 && d.games >= 10, i: "🛸", t: "Alien", d: ["Seine Skills sind nicht von der Erde.", "Er spielt in einer anderen Dimension.", "Wurde von der NASA geschickt.", "Vollkommene Kontrolle über Raum und Zeit.", "Kein menschliches Wesen locht so.", "Wir sind nur seine Spielzeuge."] , h: "Erreiche eine historische Siegquote von über 80% (mind. 10 Spiele)"},
  { cond: (d) => d.clutchWins >= 5, i: "🎰", t: "Jackpot-Killer", d: ["Gewinnt IMMER auf der letzten Kugel.", "Er liebt das Drama.", "Spannung ist seine Droge.", "Verhöhnt den Gegner durch Comebacks.", "Nerven aus Neutronenstern-Materie.", "Das Glück der Tüchtigen."] , h: "Gewinne mindestens 5 1-Kugel-Krimis (Gegner hat nur 1 Kugel übrig)"},
  { cond: (d) => d.killerPoints >= 50, i: "🧨", t: "Abrissunternehmer I", d: ["Er verteilt Reste.", "Der Gegner sammelt nur noch.", "Ziemlich brutal.", "Da bleibt was liegen.", "Abriss gestartet."], h: "Lass insgesamt 50 Kugeln beim Gegner übrig", g: "Abrissunternehmer", tier: 1 },
  { cond: (d) => d.killerPoints >= 100, i: "🧨", t: "Abrissunternehmer II", d: ["100 Restkugeln verteilt.", "Karrieren im Sinkflug.", "Kein Mitleid.", "Terror am Tisch.", "Endgegner-Vibes."], h: "Lass insgesamt 100 Kugeln beim Gegner übrig", g: "Abrissunternehmer", tier: 2 },
  { cond: (d) => d.killerPoints >= 200, i: "🧨", t: "Abrissunternehmer III", d: ["200+?!", "Das ist Abriss in Serie.", "Der Tisch ist Schlachtfeld.", "Niemand ist sicher.", "Monster-Modus."], h: "Lass insgesamt 200 Kugeln beim Gegner übrig", g: "Abrissunternehmer", tier: 3 },
  { cond: (d) => d.killerPoints >= 300, i: "🧨", t: "Abrissunternehmer IV", d: ["300+?!", "Das ist Abriss in Serie.", "Der Tisch ist Schlachtfeld.", "Niemand ist sicher.", "Monster-Modus."], h: "Lass insgesamt 300 Kugeln beim Gegner übrig", g: "Abrissunternehmer", tier: 4 },
  { cond: (d) => d.killerPoints >= 400, i: "🧨", t: "Abrissunternehmer V", d: ["400+?!", "Das ist Abriss in Serie.", "Der Tisch ist Schlachtfeld.", "Niemand ist sicher.", "Monster-Modus."], h: "Lass insgesamt 400 Kugeln beim Gegner übrig", g: "Abrissunternehmer", tier: 5 },
  { cond: (d) => d.killerPoints >= 500, i: "🧨", t: "Abrissunternehmer VI", d: ["500+?!", "Das ist Abriss in Serie.", "Der Tisch ist Schlachtfeld.", "Niemand ist sicher.", "Monster-Modus."], h: "Lass insgesamt 500 Kugeln beim Gegner übrig", g: "Abrissunternehmer", tier: 6 },
  { cond: (d) => d.killerPoints >= 600, i: "🧨", t: "Abrissunternehmer VII", d: ["600+?!", "Das ist Abriss in Serie.", "Der Tisch ist Schlachtfeld.", "Niemand ist sicher.", "Monster-Modus."], h: "Lass insgesamt 600 Kugeln beim Gegner übrig", g: "Abrissunternehmer", tier: 7 },
  { cond: (d) => d.killerPoints >= 700, i: "🧨", t: "Abrissunternehmer VIII", d: ["700+?!", "Das ist Abriss in Serie.", "Der Tisch ist Schlachtfeld.", "Niemand ist sicher.", "Monster-Modus."], h: "Lass insgesamt 700 Kugeln beim Gegner übrig", g: "Abrissunternehmer", tier: 8 },
  { cond: (d) => d.killerPoints >= 800, i: "🧨", t: "Abrissunternehmer IX", d: ["800+?!", "Das ist Abriss in Serie.", "Der Tisch ist Schlachtfeld.", "Niemand ist sicher.", "Monster-Modus."], h: "Lass insgesamt 800 Kugeln beim Gegner übrig", g: "Abrissunternehmer", tier: 9 },
  { cond: (d) => d.killerPoints >= 1000, i: "🧨", t: "Abrissunternehmer X", d: ["1000+?!", "Das ist Abriss in Serie.", "Der Tisch ist Schlachtfeld.", "Niemand ist sicher.", "Monster-Modus."], h: "Lass insgesamt 1000 Kugeln beim Gegner übrig", g: "Abrissunternehmer", tier: 10, max: true },
  { cond: (d) => d.wins > 0 && d.rest === 0, i: "🧼", t: "Saubermann", d: ["Keine einzige Kugel liegen lassen.", "Perfekte Bilanz.", "Ein Ästhet des Billards.", "Kein Dreck, kein Rest, nur Sieg.", "Chirurgische Präzision.", "Makellos."] , h: "Gewinne mindestens 1 Match – und Lass bei Niederlagen nie Kugeln liegen (also: verlier nicht)"},
  { cond: (d) => d.wins > 15, i: "🏆", t: "Pokal-Hamster", d: ["Braucht bald ein größeres Regal.", "Sammelt Siege wie andere Panini-Bilder.", "Ein wahrer Champion.", "Sein Hunger auf Siege ist unstillbar.", "Die Konkurrenz verzweifelt.", "Er ist das Maß aller Dinge."] , h: "Gewinne mindestens 16 Matches"},
  { cond: (d) => d.maxStreak >= 4 && d.winRate > 60, i: "🦅", t: "Raubvogel", d: ["Kreist über dem Tisch und schlägt zu.", "Kein Erbarmen aus der Luft.", "Er sieht die Schwächen sofort.", "Ein tödlicher Jäger.", "Präzision aus der Höhe.", "Schlägt ein wie ein Blitz."] , h: "Gewinne mindestens 4 Spiele in Folge – und Gewinne mindestens 60% deiner Matches"},
  { cond: (d) => d.games >= 100, i: "👴", t: "Opa Billard", d: ["War schon da, als der Tisch gebaut wurde.", "Hat den Sport miterfunden.", "Ein wandelndes Geschichtsbuch.", "Er und das Queue sind eins.", "Ruhestand? Erst nach dem nächsten Loch.", "Respekt vor dem Alter!"] , h: "Spiele mindestens 100 Matches"},
  { cond: (d) => d.breakWins >= 3, i: "🌋", t: "Vulkanausbruch", d: ["Sein Anstoß ist eine Naturgewalt.", "Zerschmettert die Ordnung des Tisches.", "Explosivität in jedem Stoß.", "Hinterlässt nur Chaos und leere Löcher.", "Die Weiße brennt nach seinem Break.", "Gewalt trifft auf Präzision."] , h: "Gewinne mindestens 3 Matches direkt nach deinem Anstoß"},
  { cond: (d) => d.clutchWins > d.wins * 0.5 && d.wins > 5, i: "⛓️", t: "Entfesselungskünstler", d: ["Befreit sich aus jeder brenzligen Lage.", "Harry Houdini am Billardtisch.", "Er liebt die aussichtslosen Fälle.", "Gewinnt nur, wenn es wehtut.", "Nerven aus Drahtseilen.", "Ein Meister der Befreiung."] , h: "Mach aus mehr als 50% deiner Siege einen 1-Kugel-Krimi – und Gewinne mindestens 6 Matches"},
  { cond: (d) => d.wins >= 1 && d.games === 1, i: "🦄", t: "Das Wunder", d: ["Kam, sah, lochte, siegte.", "100% Quote bei einem Spiel.", "Sollte sofort aufhören, besser wird's nicht.", "Ein statistisches Einhorn.", "Das perfekte Debüt.", "Ein Moment für die Ewigkeit."] , h: "Hol dir mindestens 1 Sieg – und spiele genau 1 Match"},
  { cond: (d) => d.wins >= 5 && d.blackWinsCount === 0 && d.clutchWins >= 2, i: "🤺", t: "Musketier", d: ["Kämpft mit Ehre und Geschick.", "Einer für alle, alle für den Sieg.", "Fechtkunst am grünen Tisch.", "Präzision statt roher Gewalt.", "Ein edler Kämpfer.", "Stilvoll zum Erfolg."] , h: "Hol dir mindestens 5 Siege – und Gewinne ohne Schwarz-Fehler-Sieg und Gewinne mindestens 2 1-Kugel-Krimis (Gegner hat nur 1 Kugel übrig)"},
  { cond: (d) => d.maxStreak >= 10, i: "♾️", t: "Gott-Modus", d: ["Er hat die Matrix gehackt.", "Sieg ist seine einzige Sprache.", "Physik gilt für ihn nicht mehr.", "Wird nie wieder verlieren.", "Ein Gott unter Sterblichen.", "Die ultimative Dominanz."] , h: "Gewinne mindestens 10 Spiele in Folge"},
  { cond: (d) => d.games > 20 && d.winRate > 66, i: "🛡️", t: "Die Festung", d: ["An ihm prallt alles ab.", "Kaum zu bezwingen.", "Ein Bollwerk der Beständigkeit.", "Man braucht eine Belagerung, um ihn zu schlagen.", "Sicherheit geht vor - und führt zum Sieg.", "Der Fels in der Brandung."] , h: "Spiele mehr als 20 Matches – und Gewinne mindestens 66% deiner Matches"},
  { cond: (d) => d.wins > 5 && d.killerPoints > d.wins * 5.5, i: "🪓", t: "Der Schlächter", d: ["Hinterlässt keine Gefangenen.", "Zerstört jeden Widerstand.", "Ein Massaker auf dem Filz.", "Seine Queue ist eine Axt.", "Brutale Effizienz.", "Ein blutiger Pfad zum Sieg."] , h: "Gewinne mindestens 6 Matches – und Lass im Schnitt mehr als 5,5 Kugeln beim Gegner übrig (pro Sieg)"},
  { cond: (d) => d.blackWinsCount >= 1 && d.wins >= 1, i: "🕵️", t: "Schwarzmagier I", d: ["Einmal dunkel, einmal Sieg.", "Schwarz war auf deiner Seite.", "Die Acht arbeitet für dich.", "Timing passt.", "Hauptsache Sieg."], h: "Hol dir mindestens 1 Sieg durch Schwarz-Fehler", g: "Schwarzmagier", tier: 1 },
  { cond: (d) => d.blackWinsCount >= 3 && d.wins >= 5, i: "🕵️", t: "Schwarzmagier II", d: ["Schwarz kennt deinen Namen.", "Drei Mal abgegriffen.", "Die Acht ist dein Joker.", "Dunkle Künste aktiv.", "Macht der Acht."], h: "Hol dir mindestens 5 Siege durch Schwarz-Fehler", g: "Schwarzmagier", tier: 2 },
  { cond: (d) => d.blackWinsCount >= 6 && d.wins >= 10, i: "🕵️", t: "Schwarzmagier III", d: ["Die Acht ist praktisch im Team.", "Sechs Mal zugeschlagen.", "Schwarzmagie auf Maximum.", "Das ist ein Trend.", "Dunkel, aber effektiv."], h: "Hol dir mindestens 10 Siege durch Schwarz-Fehler", g: "Schwarzmagier", tier: 3, max: true },
  { cond: (d) => d.breakWins >= 2, i: "💥", t: "Anstoß-Berserker", d: ["Anstoß wie ein Meteorit.", "Wenn er anstößt, bebt der Tisch.", "Das Break ist eine Waffe.", "Explosivstart garantiert.", "Der Gegner darf nur gucken."] , h: "Gewinne mindestens 2 Matches direkt nach deinem Anstoß"},
  { cond: (d) => d.maxStreak >= 2 && d.clutchWins >= 1, i: "🧊", t: "Cool-Down", d: ["Unter Druck wird er eiskalt.", "Die Pulse? Nicht messbar.", "Wenn’s zählt, liefert er.", "Keine Zitterhand – nur Präzision.", "Der Blick bleibt ruhig, der Stoß sitzt."] , h: "Gewinne mindestens 2 Spiele in Folge – und Gewinne mindestens 1 1-Kugel-Krimi (Gegner hat nur 1 Kugel übrig)"},
  { cond: (d) => d.games >= 8 && d.winRate >= 60, i: "📈", t: "Aufsteiger", d: ["Die Kurve zeigt nach oben.", "Er wird von Match zu Match besser.", "Formstark wie nie.", "Heute nur in eine Richtung: Sieg.", "Er hat Momentum."] , h: "Spiele mindestens 8 Matches – und Gewinne mindestens 60% deiner Matches"},
  { cond: (d) => d.killerPoints >= 25, i: "🧨", t: "Abrissbirne", d: ["Er hinterlässt Krater.", "Der Tisch sieht aus wie nach dem Krieg.", "Gegner sammeln nur noch Reste.", "Brutale Effizienz.", "Kein Erbarmen mit Kugeln."] , h: "Lass insgesamt 25+ Kugeln beim Gegner übrig"},
  { cond: (d) => d.rest === 0 && d.games >= 3, i: "🧼", t: "Blankpolierer", d: ["Sauberer als eine OP.", "Da bleibt nix liegen.", "Der Tisch glänzt nach ihm.", "Null Rest – Maximum Dominanz.", "Perfekte Aufräumarbeit."] , h: "Lass bei Niederlagen nie Kugeln liegen (also: verlier nicht) – und Spiele mindestens 3 Matches"},
  { cond: (d) => d.games >= 12 && d.winRate >= 70, i: "🧠", t: "Taktikfuchs", d: ["Er spielt nicht – er plant.", "Gegner laufen in Fallen.", "Jeder Stoß ist Absicht.", "Billard-Schachmeister.", "Er liest das Spiel voraus."] , h: "Spiele mindestens 12 Matches – und Gewinne mindestens 70% deiner Matches"},
  { cond: (d) => d.clutchWins >= 3, i: "🚨", t: "Crunchtime-König", d: ["Finale Kugel? Sein Zuhause.", "Wenn’s knallt, wird er besser.", "Druck ist sein Energydrink.", "Das ist sein Moment.", "Er lebt für Matchball."] , h: "Gewinne mindestens 3 1-Kugel-Krimis (Gegner hat nur 1 Kugel übrig)"},
  { cond: (d) => d.games >= 20 && d.winRate >= 55, i: "🪙", t: "Konstanzmaschine", d: ["Kein Glanz – nur Ergebnisse.", "Stabil wie Beton.", "Immer da, immer gefährlich.", "Punktet konstant.", "Das ist verlässliche Klasse."] , h: "Spiele mindestens 20 Matches – und Gewinne mindestens 55% deiner Matches"},
  { cond: (d) => d.wins >= 25, i: "🏅", t: "Veteran", d: ["Er kennt alle Tricks.", "Routine schlägt Hektik.", "Das ist Erfahrung am Filz.", "Schon alles gesehen, alles gewonnen.", "Der alte Hase am Tisch."] , h: "Hol dir mindestens 25 Siege"},
  { cond: (d) => d.wins >= 5 && d.blackWinsCount === 0, i: "🤝", t: "Fairplay-Profi", d: ["Sauber gewonnen, sauber geblieben.", "Keine Schwarz-Nummern nötig.", "Skill statt Glück.", "Ehre auf dem Filz.", "Gewinnt ohne Schmutz."] , h: "Hol dir mindestens 5 Siege – und Gewinne ohne Schwarz-Fehler-Sieg"},
  { cond: (d) => d.games >= 10 && d.avgRest <= 2.5, i: "🧲", t: "Kontrollfreak", d: ["Er lässt kaum was liegen.", "Der Gegner sammelt nur Krümel.", "Kontrolle pur.", "Saubere Dominanz.", "Tischkontrolle auf Maximum."] , h: "Spiele mindestens 10 Matches – und Lass im Schnitt höchstens 2,5 Kugeln bei Niederlagen übrig"},
  { cond: (d) => d.wins >= 12 && d.maxStreak >= 4, i: "🔥", t: "Heißläufer", d: ["Heute brennt er.", "Der Lauf ist real.", "Er ist im Flow.", "Alles klappt, alles sitzt.", "Ein heißer Tag am Queue."] , h: "Hol dir mindestens 12 Siege – und Gewinne mindestens 4 Spiele in Folge"},
  { cond: (d) => d.games >= 5 && d.winRate === 100, i: "🧿", t: "Unantastbar", d: ["Heute niemanden reingelassen.", "Perfekt durchgezogen.", "Keine Schwäche gezeigt.", "Nicht mal ein Wackler.", "Das war eine weiße Weste."] , h: "Spiele mindestens 5 Matches – und gewinne 100% davon"},
  { cond: (d) => d.wins >= 8 && d.breakWins >= 1, i: "🏁", t: "Start-Ziel-Sieger", d: ["Anstoß → Kontrolle → Sieg.", "Er zieht es von vorne durch.", "Keine Diskussionen.", "Einmal vorne, immer vorne.", "Startet stark, endet stärker."] , h: "Hol dir mindestens 8 Siege – und Gewinne mindestens 1 Match direkt nach deinem Anstoß"},
  { cond: (d) => d.games >= 15 && d.clutchWins >= 2 && d.winRate >= 60, i: "🛡️", t: "Nervenpanzer", d: ["Druck prallt ab.", "Er bleibt stabil.", "Nichts bringt ihn aus der Ruhe.", "Panzer auf Filz.", "Er wackelt nicht."] , h: "Spiele mindestens 15 Matches – und Gewinne mindestens 2 1-Kugel-Krimis (Gegner hat nur 1 Kugel übrig) und Gewinne mindestens 60% deiner Matches"},
  { cond: (d) => d.wins >= 40, i: "🗿", t: "Monument", d: ["Er steht über den Zahlen.", "Ein Denkmal am Tisch.", "Unbeweglich in Richtung Sieg.", "Wenn er spielt, zählt nur Ergebnis.", "Er ist die Statistik."] , h: "Hol dir mindestens 40 Siege"},
  { cond: (d) => d.winRateDelta20 >= 5  && d.games >= 40, i:"📈", t:"Selbstoptimierer I",  d:["Wird messbar besser.","Kurve geht hoch.","Das Training wirkt.","Er lernt schnell.","Starkes Wachstum."], h:"Verbessere deine Winrate (letzte 20 vs erste 20) um ≥ 5%",  g:"Selbstoptimierer", tier:1 },
  { cond: (d) => d.winRateDelta20 >= 10 && d.games >= 40, i:"📈", t:"Selbstoptimierer II", d:["Jetzt wird’s ernst.","Das ist Entwicklung.","Sprung nach vorn.","Wachstum pur.","Formaufbau deluxe."], h:"Verbessere deine Winrate (letzte 20 vs erste 20) um ≥ 10%", g:"Selbstoptimierer", tier:2 },
  { cond: (d) => d.winRateDelta20 >= 15 && d.games >= 40, i:"📈", t:"Selbstoptimierer III",d:["Das ist eine neue Version von dir.","Level-Up im Kopf.","Komplett gedreht.","Ein anderes Tier.","Von unten nach oben."], h:"Verbessere deine Winrate (letzte 20 vs erste 20) um ≥ 15%", g:"Selbstoptimierer", tier:3, max:true },
  { cond: (d) => d.eloDelta10 >= 20,  i:"🧗", t:"ELO-Kletterer I",  d:["Steigt Stück für Stück.","Klettert solide.","Die Leiter steht.","Weniger reden, mehr Punkten.","Sauberer Push."], h:"Mach in den letzten 10 Spielen ≥ +20 ELO",  g:"ELO-Kletterer", tier:1 },
  { cond: (d) => d.eloDelta10 >= 40,  i:"🧗", t:"ELO-Kletterer II", d:["Das ist Momentum.","Aufwärts ist Standard.","ELO-Sprint.","Heute läuft’s.","Ranking-Alarm."],            h:"Mach in den letzten 10 Spielen ≥ +40 ELO",  g:"ELO-Kletterer", tier:2 },
  { cond: (d) => d.eloDelta10 >= 70,  i:"🧗", t:"ELO-Kletterer III",d:["Das ist ein Run.","Perfekter Anstieg.","Der Berg gehört dir.","Unaufhaltsam hoch.","ELO-Rausch."],         h:"Mach in den letzten 10 Spielen ≥ +70 ELO",  g:"ELO-Kletterer", tier:3 },
  { cond: (d) => d.eloDelta10 >= 120, i:"🧗", t:"ELO-Kletterer IV", d:["Das ist krank.","Rangliste wackelt.","Du fliegst nach oben.","Das tut Gegnern weh.","ELO-Explosion."],   h:"Mach in den letzten 10 Spielen ≥ +120 ELO", g:"ELO-Kletterer", tier:4, max:true },
  { cond: (d) => d.vsNemesisWins >= 1, i:"🗡️", t:"Nemesis-Breaker I",  d:["Erster Treffer.","Der Bann ist gebrochen.","Angst wird kleiner.","Ein Riss in der Mauer.","Es geht doch!"], h:"Gewinne 1× gegen deinen Angstgegner", g:"Nemesis-Breaker", tier:1 },
  { cond: (d) => d.vsNemesisWins >= 3, i:"🗡️", t:"Nemesis-Breaker II", d:["Jetzt wird’s persönlich.","Die Angst schmilzt.","Du drehst den Spieß.","Das ist ein Statement.","Du lernst ihn."], h:"Gewinne 3× gegen deinen Angstgegner", g:"Nemesis-Breaker", tier:2 },
  { cond: (d) => d.vsNemesisWins >= 5, i:"🗡️", t:"Nemesis-Breaker III",d:["Jetzt gehörst du nicht mehr unten hin.","Der Endgegner wackelt.","Dominanz im Kopf.","Du hast ihn gelöst.","Angstgegner? War einmal."], h:"Gewinne 5× gegen deinen Angstgegner", g:"Nemesis-Breaker", tier:3, max:true },
  { cond: (d) => d.winsVsTopElo >= 1, i:"👑", t:"Riesen-Jäger I",  d:["David trifft Goliath.","Die Großen können fallen.","Respekt.","Das zählt doppelt.","Stark!"], h:"Schlage den aktuell bestbewerteten Spieler 1×", g:"Riesen-Jäger", tier:1 },
  { cond: (d) => d.winsVsTopElo >= 3, i:"👑", t:"Riesen-Jäger II", d:["Nicht nur Glück.","Du kannst oben mitspielen.","Das ist Klasse.","Top-Killer.","Ansage."], h:"Schlage den aktuell bestbewerteten Spieler 3×", g:"Riesen-Jäger", tier:2 },
  { cond: (d) => d.winsVsTopElo >= 5, i:"👑", t:"Riesen-Jäger III",d:["Du jagst Könige.","Oben ist dein Revier.","Elite-Beweis.","Endboss-Schreck.","Legendär."], h:"Schlage den aktuell bestbewerteten Spieler 5×", g:"Riesen-Jäger", tier:3, max:true },
  { cond: (d) => d.closeWins >= 3,  i:"🍀", t:"Glücksritter I",  d:["Hauptsache gewonnen.","Kante, aber drin.","Der Zufall liebt dich.","Knapp ist auch Sieg.","Einfach durchgezogen."], h:"Gewinne 3 knappe Spiele (Gegner Rest=1)", g:"Glücksritter", tier:1 },
  { cond: (d) => d.closeWins >= 7,  i:"🍀", t:"Glücksritter II", d:["Die Kugeln sind auf deiner Seite.","Das ist schon Tradition.","Du überlebst alles.","Drama-Vibes.","Purer Nervenkitzel."], h:"Gewinne 7 knappe Spiele (Gegner Rest=1)", g:"Glücksritter", tier:2 },
  { cond: (d) => d.closeWins >= 15, i:"🍀", t:"Glücksritter III",d:["Du bist das Plot-Armor.","Unsterblich knapp.","Immer irgendwie raus.","Das grenzt an Magie.","Unfair glücklich."], h:"Gewinne 15 knappe Spiele (Gegner Rest=1)", g:"Glücksritter", tier:3, max:true },
  { cond: (d) => d.dramaWins >= 2,  i:"🎭", t:"Drama-König I",  d:["Kinoabend am Tisch.","Spannung verkauft.","Herzschlag-Billard.","Das war knapp.","Publikum würde klatschen."], h:"Gewinne 2 Spiele, in denen beide Teams im Endgame waren", g:"Drama-König", tier:1 },
  { cond: (d) => d.dramaWins >= 5,  i:"🎭", t:"Drama-König II", d:["Du liebst das Chaos.","Druck? Ja bitte.","Du glänzt im Finale.","Das ist Entertainment.","Crunchtime-Show."], h:"Gewinne 5 Endgame-Dramen", g:"Drama-König", tier:2 },
  { cond: (d) => d.dramaWins >= 10, i:"🎭", t:"Drama-König III",d:["Der Filz ist deine Bühne.","Finale ist Routine.","Du bist das Drehbuch.","Unfassbar nervenstark.","Legendär spannend."], h:"Gewinne 10 Endgame-Dramen", g:"Drama-König", tier:3, max:true },
  { cond: (d) => d.maxLoseStreak <= 2 && d.games >= 25, i:"🧘", t:"Zen-Modus I",  d:["Keine Panik, nur Punkte.","Kopf bleibt ruhig.","Stabilität pur.","Kein Tilt-Festival.","Sauber im Mindset."], h:"Höchstens 2 Niederlagen am Stück (bei ≥25 Spielen)", g:"Zen-Modus", tier:1 },
  { cond: (d) => d.maxLoseStreak <= 2 && d.games >= 60, i:"🧘", t:"Zen-Modus II", d:["Das ist Konstanz.","Du kippst nicht um.","Selbstkontrolle deluxe.","Mentale Rüstung.","Stabil wie Beton."], h:"Höchstens 2 Niederlagen am Stück (bei ≥60 Spielen)", g:"Zen-Modus", tier:2 },
  { cond: (d) => d.maxLoseStreak <= 2 && d.games >= 120,i:"🧘", t:"Zen-Modus III",d:["Tilt existiert nicht.","Du bist Maschine.","Mentale Elite.","Immer gefährlich.","Zen-Legende."], h:"Höchstens 2 Niederlagen am Stück (bei ≥120 Spielen)", g:"Zen-Modus", tier:3, max:true },
  { cond: (d) => d.winRateLast30 >= 50 && d.winRateLast30 <= 65 && d.games >= 40, i:"⚙️", t:"Stabilitäts-Motor I",  d:["Immer im Spiel.","Nie weg.","Konstant gefährlich.","Keine Ausreißer.","Verlässlich."], h:"Letzte 30 Spiele: Winrate zwischen 50–65%", g:"Stabilitäts-Motor", tier:1 },
  { cond: (d) => d.winRateLast30 >= 55 && d.winRateLast30 <= 70 && d.games >= 60, i:"⚙️", t:"Stabilitäts-Motor II", d:["Das ist Qualität.","Konstanz mit Punch.","Routine-Modus.","Stets präsent.","Solide Elite."], h:"Letzte 30 Spiele: Winrate zwischen 55–70%", g:"Stabilitäts-Motor", tier:2 },
  { cond: (d) => d.winRateLast30 >= 60 && d.winRateLast30 <= 75 && d.games >= 80, i:"⚙️", t:"Stabilitäts-Motor III",d:["Keine Schwankungen.","Maschinenlauf.","Pro-Konstanz.","Immer da.","Stabil-Boss."], h:"Letzte 30 Spiele: Winrate zwischen 60–75%", g:"Stabilitäts-Motor", tier:3, max:true },
  { cond: (d) => d.avgRestLossLast20 <= 3.0 && d.games >= 30, i:"🧱", t: "Defensiv-Architekt I",  d:["Gegner bekommt nix.","Tisch unter Kontrolle.","Sicherheits-Billard.","Sauber geschlossen.","Kleine Reste."], h:"Letzte 20 Niederlagen: Ø Rest ≤ 3,0", g:"Defensiv-Architekt", tier:1 },
  { cond: (d) => d.avgRestLossLast20 <= 2.4 && d.games >= 40, i:"🧱", t: "Defensiv-Architekt II", d:["Jetzt ist’s eng.","Du baust Mauern.","Kaum Chancen.","Kontrollkunst.","Sicher wie ein Tresor."], h: "Letzte 20 Niederlagen: Ø Rest ≤ 2,4", g: "Defensiv-Architekt", tier: 2 },
  { cond: (d) => d.avgRestLossLast20 <= 1.8 && d.games >= 50, i: "🧱", t: "Defensiv-Architekt III", d: ["Das ist ein Käfig.", "Gegner erstickt.", "Taktik-Meister.", "Zero-Chancen-Zone.", "Defensiv-Legende."], h: "Letzte 20 Niederlagen: Ø Rest ≤ 1,8", g: "Defensiv-Architekt", tier: 3, max: true },
  { cond: (d) => d.breakWins >= 5  && d.avgKillerLast20 >= 5.0, i:"🏎️", t:"Tempo-Boss I",  d:["Kurz & schmerzlos.","Tempo entscheidet.","Schnell fertig.","Keine Zeit verschenkt.","Zack – Sieg."], h:"Mind. 5 Siege nach Anstoß + Ø Gegner-Reste/Sieg (letzte 20) ≥ 5,0", g:"Tempo-Boss", tier:1 },
  { cond: (d) => d.breakWins >= 12 && d.avgKillerLast20 >= 5.6, i:"🏎️", t:"Tempo-Boss II", d:["Du überrollst Spiele.","Tempo ist dein Stil.","Kontrolle im Turbomodus.","Keine Diskussionen.","Dominanz."], h:"Mind. 12 Siege nach Anstoß + Ø Gegner-Reste/Sieg (letzte 20) ≥ 5,6", g:"Tempo-Boss", tier:2 },
  { cond: (d) => d.breakWins >= 25 && d.avgKillerLast20 >= 6.2, i:"🏎️", t:"Tempo-Boss III",d:["Das ist Speedrun.","Du löschst Gegner.","Unfair schnell.","Kein Warmwerden.","Tempo-Legende."], h:"Mind. 25 Siege nach Anstoß + Ø Gegner-Reste/Sieg (letzte 20) ≥ 6,2", g:"Tempo-Boss", tier:3, max:true },
  { cond: (d) => d.dailyDaysWithAch >=  1,  i:"📅", t:"Daily‑Sammler I",  d:["Erster Stempel im Kalender.","Der Anfang zählt.","Ein Tag – ein Erfolg.","So fängt’s an.","Heute beginnt die Serie."], h:"Sammle an 1 Tag mindestens einen Tageserfolg", g:"Daily‑Sammler", tier:1 },
  { cond: (d) => d.dailyDaysWithAch >=  3,  i:"📅", t:"Daily‑Sammler II", d:["Drei Tage, drei Haken.","Wird zur Gewohnheit.","Du kommst rein.","Solider Rhythmus.","Schöne Routine."], h:"Sammle an 3 Tagen mindestens einen Tageserfolg", g:"Daily‑Sammler", tier:2 },
  { cond: (d) => d.dailyDaysWithAch >=  7,  i:"📅", t:"Daily‑Sammler III",d:["Eine ganze Woche abgeliefert.","Konstanz‑Vibes.","Du bist regelmäßig.","Kein Zufall mehr.","Stark durchgezogen."], h:"Sammle an 7 Tagen mindestens einen Tageserfolg", g:"Daily‑Sammler", tier:3 },
  { cond: (d) => d.dailyDaysWithAch >= 14,  i:"🗓️", t:"Daily‑Sammler IV", d:["Zwei Wochen Erfolgshunger.","Das wird ernst.","Du bleibst dran.","Fleiß zahlt.","Stabil."], h:"Sammle an 14 Tagen mindestens einen Tageserfolg", g:"Daily‑Sammler", tier:4 },
  { cond: (d) => d.dailyDaysWithAch >= 21,  i:"🗓️", t:"Daily‑Sammler V",  d:["3‑Wochen‑Challenge gewonnen.","Du bist im Flow.","Richtig gute Serie.","Dranbleiber.","Respekt."], h:"Sammle an 21 Tagen mindestens einen Tageserfolg", g:"Daily‑Sammler", tier:5 },
  { cond: (d) => d.dailyDaysWithAch >= 30,  i:"🗓️", t:"Daily‑Sammler VI", d:["Ein Monat Erfolge.","Das ist Commitment.","Du lebst am Filz.","Monats‑Boss.","Sehr stark."], h:"Sammle an 30 Tagen mindestens einen Tageserfolg", g:"Daily‑Sammler", tier:6 },
  { cond: (d) => d.dailyDaysWithAch >= 50,  i:"🗓️", t:"Daily‑Sammler VII",d:["50 Tage – Maschine.","Du sammelst wie ein Profi.","Kalender voller Siege.","Gnadenlos konstant.","Starker Grind."], h:"Sammle an 50 Tagen mindestens einen Tageserfolg", g:"Daily‑Sammler", tier:7 },
  { cond: (d) => d.dailyDaysWithAch >= 75,  i:"📆", t:"Daily‑Sammler VIII",d:["Das ist schon ein Lifestyle.","Du bist immer da.","Kalender wird Legendär.","Du sammelst wie ein Hunter.","Top!"], h:"Sammle an 75 Tagen mindestens einen Tageserfolg", g:"Daily‑Sammler", tier:8 },
  { cond: (d) => d.dailyDaysWithAch >= 100, i:"📆", t:"Daily‑Sammler IX", d:["100 Tage Erfolg.","Das ist absurd gut.","Du bist die Routine.","Du hast den Kalender besiegt.","Wahnsinn."], h:"Sammle an 100 Tagen mindestens einen Tageserfolg", g:"Daily‑Sammler", tier:9 },
  { cond: (d) => d.achCountTotal >= 10,  i:"📚", t:"Sammler I",  d:["Er sammelt Titel.","Die Vitrine füllt sich.","Mehr als nur Matches.","Schöne Sammlung.","Weiter!"], h:"Schalte insgesamt 10 Achievements frei", g:"Sammler", tier:1 },
  { cond: (d) => d.achCountTotal >= 25,  i:"📚", t:"Sammler II", d:["Das wird eine Kollektion.","Du jagst Badges.","Wird langsam voll.","Respekt.","Sammler-Vibes."], h:"Schalte insgesamt 25 Achievements frei", g:"Sammler", tier:2 },
  { cond: (d) => d.achCountTotal >= 50,  i:"📚", t:"Sammler III",d:["Das ist ernst.","Du hast Content durchgespielt.","Schon viel gesehen.","Große Sammlung.","Stark."], h:"Schalte insgesamt 50 Achievements frei", g:"Sammler", tier:3 },
  { cond: (d) => d.achCountTotal >= 90,  i:"📚", t:"Sammler IV", d:["Maschine.","Fast alles offen.","Das ist Arbeit.","Du bist ein Hunter.","Weiter so."], h:"Schalte insgesamt 90 Achievements frei", g:"Sammler", tier:4 },
  { cond: (d) => d.achCountTotal >= 130, i:"📚", t:"Sammler V",  d:["MAX-Hunter.","Du bist das Achievement-Menü.","Alles eingesammelt.","Legendär.","Unfassbar."], h:"Schalte insgesamt 130 Achievements frei", g:"Sammler", tier:5, max:true },
  { cond: (d) => d.completedTracks >= 1, i:"🏁", t:"Track-Master I",  d:["Ein track ist durch.","Komplettiert.","Du hast es gefressen.","Sauber.","Weiter zum nächsten."], h:"Schließe 1 Achievement-Track komplett ab", g:"Track-Master", tier:1 },
  { cond: (d) => d.completedTracks >= 3, i:"🏁", t:"Track-Master II", d:["Du räumst auf.","Mehrere Tracks erledigt.","Das ist Fleiß.","Stark.","Sammler-Pro."], h:"Schließe 3 Achievement-Tracks komplett ab", g:"Track-Master", tier:2 },
  { cond: (d) => d.completedTracks >= 5, i:"🏁", t:"Track-Master III",d:["Du hast die Tracks im Griff.","Komplettierungs-Boss.","Alles sauber.","Unfair konsequent.","Legendär."], h:"Schließe 5 Achievement-Tracks komplett ab", g:"Track-Master", tier:3, max:true },
];

window.shamePool = [
  { cond: (d) => d.avgRest >= 6.2, i: "🧟", t: "Statist", d: ["War er überhaupt am Tisch?", "Sammelt Restkugeln wie Briefmarken.", "Hat die Kugel mehr gestreichelt als gestoßen.", "War heute eher Deko-Element.", "Passiv-Billard in Perfektion.", "Ein treuer Zuschauer."] , h: "Lass im Schnitt mindestens 6,2 Kugeln bei Niederlagen übrig"},
  { cond: (d) => d.blackWinsCount >= 2, i: "🐀", t: "Ratten-Imperator I", d: ["Nährt sich vom Unglück der anderen.", "Gewinnt nur, wenn andere versagen.", "Meister des Abstaubens.", "Die schwarze Kugel ist sein bester Freund.", "Glückspilz des Jahres."], h: "Hol dir mindestens 2 Siege durch Schwarz-Fehler", g: "Ratten-Imperator", tier: 1 },
  { cond: (d) => d.blackWinsCount >= 4, i: "🐀", t: "Ratten-Imperator II", d: ["Der Schwarz-Algorithmus arbeitet für ihn.", "Abstauben auf Profi-Niveau.", "Der Gegner serviert – er kassiert.", "Schwarz-Fehler? Er wartet schon.", "Das ist fast schon Routine."], h: "Hol dir mindestens 4 Siege durch Schwarz-Fehler", g: "Ratten-Imperator", tier: 2 },
  { cond: (d) => d.blackWinsCount >= 7, i: "🐀", t: "Ratten-Imperator III", d: ["Imperator der Achtball-Katastrophen.", "Die Dunkelheit folgt ihm.", "Siege aus Fehlern: Endgame.", "Schwarz fällt – er jubelt.", "Unfassbar konsequent unfair."], h: "Hol dir mindestens 7 Siege durch Schwarz-Fehler", g: "Ratten-Imperator", tier: 3 },
  { cond: (d) => d.blackWinsCount >= 12, i: "🐀", t: "Ratten-Imperator IV", d: ["Der Tisch arbeitet für ihn.", "Fehler werden zu Punkten.", "Schwarz ist sein Lieblingsmoment.", "Er riecht die Patzer.", "Maximal schmutzig."], h: "Hol dir mindestens 12 Siege durch Schwarz-Fehler", g: "Ratten-Imperator", tier: 4 },
  { cond: (d) => d.blackWinsCount >= 20, i: "🐀", t: "Ratten-Imperator V", d: ["Die Acht ist sein Haustier.", "Abstauben wie ein Profi.", "Er lebt vom Unglück.", "Schwarz-Fehler = Jackpot.", "Das ist Methode."], h: "Hol dir mindestens 20 Siege durch Schwarz-Fehler", g: "Ratten-Imperator", tier: 5 },
  { cond: (d) => d.blackWinsCount >= 35, i: "🐀", t: "Ratten-Imperator VI", d: ["Endboss der Schwarz-Fehler.", "Imperator der Dunkelheit.", "Die Gegner liefern frei Haus.", "Das ist nicht mehr normal.", "Schmutz-Level: Legendär."], h: "Hol dir mindestens 35 Siege durch Schwarz-Fehler", g: "Ratten-Imperator", tier: 6 },
  { cond: (d) => d.blackWinsCount >= 60, i: "🐀", t: "Ratten-Imperator VII", d: ["60x abgeräumt – unfassbar.", "Schwarz fällt, er grinst.", "Er sammelt Patzer.", "Das ist schon ein System.", "Unfair effizient."], h: "Hol dir mindestens 60 Siege durch Schwarz-Fehler", g: "Ratten-Imperator", tier: 7 },
  { cond: (d) => d.blackWinsCount >= 95, i: "🐀", t: "Ratten-Imperator VIII", d: ["Jetzt wird’s absurd.", "Der König der Fehler.", "Schwarz-Fehler sind sein Treibstoff.", "Das Imperium wächst.", "Unerquicklich gut."], h: "Hol dir mindestens 95 Siege durch Schwarz-Fehler", g: "Ratten-Imperator", tier: 8 },
  { cond: (d) => d.blackWinsCount >= 150, i: "🐀", t: "Ratten-Imperator IX", d: ["150x – Endgame pur.", "Schwarz ist sein Business.", "Die Gegner liefern Drama.", "Er lebt im Schatten.", "Unsterblich schmutzig."], h: "Hol dir mindestens 150 Siege durch Schwarz-Fehler", g: "Ratten-Imperator", tier: 9 },
  { cond: (d) => d.blackWinsCount >= 250, i: "🐀", t: "Ratten-Imperator X", d: ["MAX-Tier erreicht.", "250x Schwarz-Fehler-Siege – krank.", "Der Endboss der Acht.", "Das ist pure Dunkelheit.", "Legende des Schmutzes."], h: "Hol dir mindestens 250 Siege durch Schwarz-Fehler", g: "Ratten-Imperator", tier: 10, max: true },
  { cond: (d) => d.winRate <= 40 && d.games >= 5, i: "🤡", t: "Clown I", d: ["Mehr Show als Score.", "Noch Luft nach oben.", "Heute kreativ.", "Übung macht den Meister.", "Nächstes Mal sitzt’s."], h: "Gewinne höchstens 40% deiner Matches (mind. 5 Spiele)", g: "Clown", tier: 1 },
  { cond: (d) => d.winRate <= 30 && d.games >= 8, i: "🤡", t: "Clown II", d: ["Die Manege ist offen.", "Gegner sagen danke.", "Das tut weh.", "Comedy-Abend.", "Reset empfohlen."], h: "Gewinne höchstens 30% deiner Matches (mind. 8 Spiele)", g: "Clown", tier: 2 },
  { cond: (d) => d.winRate <= 20 && d.games >= 12, i: "🤡", t: "Clown III", d: ["Zirkusdirektor in Ausbildung.", "Heute nur Drama.", "Hartes Pflaster.", "Morgen wird besser.", "Aua."], h: "Gewinne höchstens 20% deiner Matches (mind. 12 Spiele)", g: "Clown", tier: 3, max: true },
  { cond: (d) => !d.lastWin && d.streak === 0 && d.games >= 3, i: "🧊", t: "Schockgefrostet", d: ["Sieg? Lange her. Sehr lange her.", "In der ewigen Verlierer-Schleife.", "Braucht dringend Stützräder.", "Sein Selbstvertrauen ist am Nullpunkt.", "Gewinnen ist ein Fremdwort.", "Völlig von der Rolle."] , h: "Verliere dein letztes Match, habe keine aktive Siegserie und spiele mindestens 3 Matches"},
  { cond: (d) => d.avgRest >= 6.0 && (d.games - d.wins) >= 3, i: "🧱", t: "Kugelsammler I", d: ["Da bleibt viel stehen.", "Zu viele Reste.", "Mehr Risiko!", "Der Tisch ist voll.", "Abschluss fehlt."], h: "Lass im Schnitt 6+ Kugeln bei Niederlagen übrig (mind. 3 Niederlagen)", g: "Kugelsammler", tier: 1 },
  { cond: (d) => d.avgRest >= 7.5 && (d.games - d.wins) >= 4, i: "🧱", t: "Kugelsammler II", d: ["Reste wie Tapete.", "Der Tisch wird nie leer.", "Zu passiv.", "Mehr Mut!", "Das muss sauberer."], h: "Lass im Schnitt 7,5+ Kugeln bei Niederlagen übrig (mind. 4 Niederlagen)", g: "Kugelsammler", tier: 2 },
  { cond: (d) => d.avgRest >= 9.0 && (d.games - d.wins) >= 5, i: "🧱", t: "Kugelsammler III", d: ["Containerdienst rufen.", "Alles bleibt liegen.", "Lagerverwaltung.", "Aua.", "Das ist viel."], h: "Lass im Schnitt 9+ Kugeln bei Niederlagen übrig (mind. 5 Niederlagen)", g: "Kugelsammler", tier: 3, max: true },
  { cond: (d) => d.blackWinsCount > d.wins / 2 && d.wins > 0, i: "☣️", t: "Toxisches Glück", d: ["Ohne Fehler der Gegner arbeitslos.", "Ein laufender Unglücksbringer.", "Sein Spielstil ist ein Verbrechen.", "Gewinnt durch Willenskraft des Versagens.", "Ein wandelnder Fehler-Magnet.", "Unverdient ist gar kein Ausdruck."] , h: "Erringe mehr als die Hälfte deiner Siege durch Schwarz-Fehler des Gegners – und gewinne mindestens 1 Match"},
  { cond: (d) => d.rest >= 7 && d.wins === 0 && d.games >= 2, i: "🐌", t: "Bremsklotz", d: ["Verlangsamt das Spiel durch Nicht-Lochen.", "Ein Hindernis auf dem Weg zum Spaß.", "Er genießt die Zeit am Tisch... lange.", "Tempo ist nicht sein Ding.", "Billard in Zeitlupe.", "Die Ruhe selbst."] , h: "Gewinne kein Match, spiele mindestens 2 und lass insgesamt 7+ Kugeln liegen"},
  { cond: (d) => d.games >= 10 && d.winRate < 30, i: "📉", t: "Abstiegsgefährdet", d: ["Der Keller ist sein Zuhause.", "Sucht noch nach der Form.", "Ein harter Weg nach oben.", "Die Tabelle liest er von unten.", "Es kann nur besser werden.", "Ein treuer Gast am Ende."] , h: "Spiele mindestens 10 Matches – und gewinne weniger als 30% davon"},
  { cond: (d) => d.clutchWins === 0 && d.games >= 6, i: "🚫", t: "Nervenbündel I", d: ["Bei Matchball wird’s wacklig.", "Druck mag er nicht.", "Zitterhand.", "Crunchtime = nein.", "Nächstes Mal."], h: "Gewinne keinen 1-Kugel-Krimi (mind. 6 Spiele)", g: "Nervenbündel", tier: 1 },
  { cond: (d) => d.clutchWins === 0 && d.games >= 12, i: "🚫", t: "Nervenbündel II", d: ["Immer wenn’s zählt…", "Das tut weh.", "Druck gewinnt.", "Finale Kugel = Albtraum.", "Üben, üben."], h: "Gewinne keinen 1-Kugel-Krimi (mind. 12 Spiele)", g: "Nervenbündel", tier: 2 },
  { cond: (d) => d.clutchWins === 0 && d.games >= 20, i: "🚫", t: "Nervenbündel III", d: ["20 Spiele und kein Krimi-Sieg.", "Das ist eine Serie.", "Crunchtime bleibt leer.", "Aua.", "Kopf hoch."], h: "Gewinne keinen 1-Kugel-Krimi (mind. 20 Spiele)", g: "Nervenbündel", tier: 3, max: true },
  { cond: (d) => d.games >= 5 && d.wins === 0, i: "🕯️", t: "Mahnwache", d: ["Er ist nur da, um den Tisch zu beleuchten.", "Ein Denkmal der Niederlage.", "Siegchancen im homöopathischen Bereich.", "Er wartet noch auf das erste Wunder.", "Vielleicht ist Darts eher sein Ding?", "Ein ewiger Optimist."] , h: "Spiele mindestens 5 Matches – und Gewinne kein einziges Match"},
  { cond: (d) => d.avgRest >= 5.5 && d.blackWinsCount > 0, i: "🪤", t: "Fallensteller", d: ["Spielt so schlecht, dass der Gegner Mitleid bekommt.", "Gewinnt nur durch Psychologie.", "Sein Spiel ist eine einzige Falle.", "Ein taktisches Desaster.", "Stolpert zum Sieg.", "Gefährlich für alle."] , h: "Lass im Schnitt mindestens 5,5 Kugeln bei Niederlagen übrig – und Hol dir mindestens 1 Sieg durch Schwarz-Fehler"},
  { cond: (d) => d.games >= 15 && d.winRate < 20, i: "🕳️", t: "Bodenloses Loch", d: ["Zieht den Gesamtschnitt nach unten.", "Ein schwarzes Loch für Punkte.", "Seit Wochen nicht siegreich gesehen.", "Billard falsch verstanden.", "Mahnmal der Vergeblichkeit.", "Selbst die Kugeln haben Mitleid."] , h: "Spiele mindestens 15 Matches – und gewinne weniger als 20% davon"},
  { cond: (d) => d.rest >= 14, i: "🧗", t: "Basislager-Tourist", d: ["Kommt nie über die erste Kugel hinaus.", "Er mag den Ausblick von ganz unten.", "Hat Höhenangst beim Punkten.", "Locht nur aus Versehen.", "Bleibt lieber am Boden.", "Bescheidener Punktvermeider."] , h: "Lass insgesamt 14+ Kugeln bei Niederlagen übrig"},
  { cond: (d) => d.games >= 3 && d.killerPoints === 0, i: "🦴", t: "Der Harmlose", d: ["Hat noch nie jemanden rasiert.", "Ein Pazifist am Queue.", "Tut keiner Fliege was zuleide.", "Seine Gegner fühlen sich sicher.", "Keine Gefahr für die Restkugeln.", "Ein harmloser Zeitgenosse."] , h: "Spiele mindestens 3 Matches – und Lass insgesamt 0+ Kugeln beim Gegner übrig"},
  { cond: (d) => d.rest >= 20 && d.games >= 3, i: "🚮", t: "Sperrmüll", d: ["Lässt den Tisch in katastrophalem Zustand.", "Seine Spielzüge sind Abfall.", "Keine Struktur, kein Plan, kein Sieg.", "Eine Schande für das Tuch.", "Muss dringend entsorgt werden.", "Chaos pur."] , h: "Lass insgesamt 20+ Kugeln bei Niederlagen übrig – und Spiele mindestens 3 Matches"},
  { cond: (d) => d.games > 10 && d.clutchWins === 0 && d.blackWinsCount > 2, i: "🤡", t: "Zirkusdirektor", d: ["Sein Spiel ist eine reine Comedy-Show.", "Lacht über seine eigenen Fehler.", "Unfreiwillig komisch.", "Die Manege frei für das nächste Loch.", "Entertainment statt Erfolg.", "Ein Clown am Queue."] , h: "Spiele mehr als 10 Matches – und Keine 1-Kugel-Krimis gewinnen und Hol dir mindestens 3 Siege durch Schwarz-Fehler"},
  { cond: (d) => d.games >= 5 && d.winRate < 10, i: "👻", t: "Der Unsichtbare", d: ["Niemand bemerkt, dass er mitspielt.", "Hinterlässt keine Spuren.", "Ein Geist am Tisch.", "Man sieht ihn, aber er punktet nicht.", "Völlig ohne Einfluss.", "Ein Phantom."] , h: "Spiele mindestens 5 Matches – und Gewinne höchstens 10% deiner Matches"},
  { cond: (d) => d.blackWinsCount >= 5, i: "💣", t: "Selbstmord-Kommando", d: ["Sucht die schwarze Kugel wie eine Magnetnadel.", "Locht sich immer selbst ins Aus.", "Gefahr für das eigene Team.", "Ein wandelndes Risiko.", "Sprengt jedes Spiel.", "Keine Kontrolle."] , h: "Hol dir mindestens 5 Siege durch Schwarz-Fehler"},
  { cond: (d) => d.games > 3 && d.wins === 0 && d.rest > 10, i: "🪵", t: "Der Holzhacker", d: ["Bearbeitet den Tisch wie einen Baumstamm.", "Grobmechaniker am Werk.", "Zerstört mehr als er locht.", "Technik ist ein Fremdwort.", "Braucht ein Beil statt eines Queues.", "Rohe Gewalt ohne Hirn."] , h: "Spiele mehr als 3 Matches – und Gewinne kein einziges Match und Lass insgesamt 10+ Kugeln bei Niederlagen übrig"},
  { cond: (d) => d.wins === 0 && d.games > 2 && d.blackWinsCount === 0, i: "🕊️", t: "Pazifist", d: ["Weigert sich beharrlich zu gewinnen.", "Friedliche Koexistenz mit den Kugeln.", "Sieg ist nicht sein Ziel.", "Er lässt den anderen den Vortritt.", "Ein wahrer Diplomat.", "Kampflos in die Niederlage."] , h: "Spiele mehr als 2 Matches und gewinne kein einziges (auch nicht durch Schwarz-Fehler)"},
  { cond: (d) => d.games > 20 && d.winRate < 15, i: "⚓", t: "Der Anker", d: ["Zieht das ganze Team nach unten.", "Hält die Tabelle am Boden fest.", "Ein verlässlicher Garant für Niederlagen.", "Stabilität von ganz unten.", "Er sinkt wie ein Stein.", "Tiefseeforscher."] , h: "Spiele mehr als 20 Matches – und Gewinne höchstens 15% deiner Matches"},
  { cond: (d) => d.rest > 30, i: "🚜", t: "Ackergaul", d: ["Pflügt den Tisch um.", "Viel Arbeit, wenig Ertrag.", "Schwerfällig zum Erfolg... nicht.", "Schuftet hart für die Niederlage.", "Ein mühsamer Weg ins Loch.", "Langsam aber sicher... daneben."] , h: "Lass insgesamt 30+ Kugeln bei Niederlagen übrig"},
  { cond: (d) => d.wins === 0 && d.streak === 0 && d.games > 5, i: "🏜️", t: "Wüstenwanderer", d: ["Durststrecke ohne Ende.", "Suche nach der Oase des Sieges.", "Sand im Getriebe.", "Verloren in der Einöde.", "Kein Wasser, kein Sieg, nur Staub.", "Endlose Leere."] , h: "Gewinne kein Match bei mehr als 5 Spielen und habe aktuell keine Siegserie"},
  { cond: (d) => d.blackWinsCount > 10, i: "🧛", t: "Blutsauger", d: ["Lebt vom Pech der anderen.", "Ein parasitärer Spielstil.", "Er saugt den Gegnern die Hoffnung aus.", "Sieg durch fremdes Leiden.", "Ein dunkler Fürst der Fehler.", "Er braucht das Unglück."] , h: "Hol dir mindestens 11 Siege durch Schwarz-Fehler"},
  { cond: (d) => d.wins > 0 && d.wins === d.blackWinsCount, i: "🐀", t: "Nacktmull", d: ["Kein einziger ehrlicher Sieg.", "Nur durch Ratten-Taktik überlebt.", "Ein Wunder der Natur.", "Wasserscheu und siegreich durch Fehler.", "Ein ganz spezieller Typ.", "Unterirdisch erfolgreich."] , h: "Gewinne mindestens 1 Match – und Gewinne ausschließlich durch Schwarz-Fehler des Gegners"},
  { cond: (d) => d.games > 5 && d.clutchWins === 0 && d.blackWinsCount === 0, i: "🧸", t: "Kuscheltier", d: ["Viel zu weich für den Sieg.", "Hat Angst, die Kugel zu verletzen.", "Vermeidet jede Konfrontation.", "Ein Schmusekurs auf dem Filz.", "Lieb aber erfolglos.", "Harmlosigkeit in Person."] , h: "Spiele mehr als 5 Matches – und Keine 1-Kugel-Krimis gewinnen und Gewinne ohne Schwarz-Fehler-Sieg"},
  { cond: (d) => d.games >= 2 && d.wins === 0 && d.rest >= 12, i: "🚮", t: "Restmülltonne", d: ["Sammelt alles auf, was liegen bleibt.", "Hinterlässt ein Schlachtfeld.", "Entsorgung der Siegchancen.", "Ein Container voller Fehlversuche.", "Unsortiert und erfolglos.", "Das Ende der Nahrungskette."] , h: "Spiele mindestens 2 Matches – und Gewinne kein einziges Match und Lass insgesamt 12+ Kugeln bei Niederlagen übrig"},
  { cond: (d) => d.games >= 4 && d.wins === 0, i: "🥀", t: "Nullnummer", d: ["Heute war nix.", "Er sucht noch den Sieg.", "Vielleicht morgen.", "Der Abend war zäh.", "Kein Licht am Ende des Tunnels."] , h: "Spiele mindestens 4 Matches – und Gewinne kein einziges Match"},
  { cond: (d) => d.avgRest >= 8, i: "🧱", t: "Wandmaler", d: ["Er verteilt Restkugeln wie Tapete.", "Da bleibt alles stehen.", "Tisch voll – Erfolg leer.", "Zuviel liegen lassen.", "Er baut Mauern aus Kugeln."] , h: "Lass im Schnitt mindestens 8 Kugeln bei Niederlagen übrig"},
  { cond: (d) => d.blackWinsCount >= 3, i: "🎲", t: "Schwarz-Lotto", d: ["Glücksspiel mit der Acht.", "Schwarz zieht ihn magisch an.", "Das war kein Plan – das war Risiko.", "Zu viel Schwarz im Spiel.", "Achtball-Abenteuer."] , h: "Hol dir mindestens 3 Siege durch Schwarz-Fehler"},
  { cond: (d) => d.games >= 8 && d.winRate < 25, i: "🧯", t: "Notfall", d: ["Bitte jemand den Trainer holen.", "Das brennt – aber falschrum.", "Akuter Formabfall.", "Heute ist Krisenmodus.", "Da muss ein Reset her."] , h: "Spiele mindestens 8 Matches – und Gewinne höchstens 25% deiner Matches"},
  { cond: (d) => d.games >= 6 && d.clutchWins === 0, i: "🫣", t: "Kneifer", d: ["Wenn’s zählt, ist er weg.", "Matchball ist sein Kryptonit.", "In der Crunchtime nicht da.", "Der Druck gewinnt.", "Letzte Kugel? Nein danke."] , h: "Spiele mindestens 6 Matches – und Keine 1-Kugel-Krimis gewinnen"},
  { cond: (d) => d.games >= 5 && d.avgRest >= 6, i: "🐢", t: "Schleichgang", d: ["Er kommt nicht ins Rollen.", "Alles dauert, nix passiert.", "Langsam und ineffektiv.", "Der Tisch schläft ein.", "Tempo fehlt komplett."] , h: "Spiele mindestens 5 Matches – und Lass im Schnitt mindestens 6 Kugeln bei Niederlagen übrig"},
  { cond: (d) => d.games >= 3 && d.killerPoints === 0, i: "🧸", t: "Kuschelmodus", d: ["Er tut keinem weh.", "Gegner fühlen sich sicher.", "Keine Kante im Spiel.", "Zu weich am Tisch.", "Billard im Schonwaschgang."] , h: "Spiele mindestens 3 Matches – und Lass insgesamt 0+ Kugeln beim Gegner übrig"},
  { cond: (d) => d.games >= 10 && d.maxStreak <= 1 && d.winRate < 40, i: "📉", t: "Wackelkandidat", d: ["Nichts hält.", "Keine Serie in Sicht.", "Heute sehr instabil.", "Ein Sieg, dann sofort wieder weg.", "Konstanz? Fehlanzeige."] , h: "Spiele mind. 10 Matches mit einer Siegquote unter 40% und gewinne nie mehr als ein Spiel in Folge"},
  { cond: (d) => d.games >= 4 && d.blackWinsCount > 0 && d.winRate < 40, i: "🧪", t: "Tox-Mix", d: ["Schwarz + Niederlagen – schlechte Mischung.", "Das ist Gift für die Bilanz.", "Zu viel Chaos im Spiel.", "Unsauber und erfolglos.", "Das schreit nach Korrektur."] , h: "Spiele mindestens 4 Matches – und Hol dir mindestens 1 Sieg durch Schwarz-Fehler und Gewinne höchstens 40% deiner Matches"},
  { cond: (d) => d.rest >= 15, i: "🗑️", t: "Rest-Depot", d: ["Er sammelt alles – außer Siege.", "Restkugeln-Lagerverwaltung.", "Der Tisch ist sein Container.", "Zu viele liegen lassen.", "Entsorgung bitte."] , h: "Lass insgesamt 15+ Kugeln bei Niederlagen übrig"},
  { cond: (d) => d.games >= 7 && d.winRate <= 15, i: "🫥", t: "Phantom", d: ["Man sieht ihn, aber er passiert nicht.", "Keine Wirkung im Spiel.", "Heute unsichtbar.", "Er war da… irgendwie.", "Spurlos am Filz."] , h: "Spiele mindestens 7 Matches – und Gewinne höchstens 15% deiner Matches"},
  { cond: (d) => d.games >= 5 && d.avgRest >= 5.5 && d.blackWinsCount >= 1, i: "🪤", t: "Selbstfalle", d: ["Er stellt sich Fallen selbst.", "Chaos im eigenen Kopf.", "Unnötige Fehler.", "Zu viele Geschenke.", "Das war selbst verursacht."] , h: "Spiele mindestens 5 Matches – und Lass im Schnitt mindestens 5,5 Kugeln bei Niederlagen übrig und Hol dir mindestens 1 Sieg durch Schwarz-Fehler"},
  { cond: (d) => d.games >= 12 && d.winRate < 35, i: "🧟", t: "Dauerkrise", d: ["Der Negativlauf lebt.", "Heute wieder schwer.", "Form sucht ihn.", "Das ist hart zu sehen.", "Er kommt nicht raus."] , h: "Spiele mindestens 12 Matches – und Gewinne höchstens 35% deiner Matches"},
  { cond: (d) => d.games >= 8 && d.breakWins === 0, i: "🐌", t: "Startprobleme", d: ["Kein Vorteil aus dem Break.", "Anstoß verpufft.", "Startet nie richtig.", "Der Motor stottert.", "Ohne Start kein Ziel."] , h: "Spiele mindestens 8 Matches – und Keinen Sieg direkt nach dem Anstoß holen"},
  { cond: (d) => d.games >= 10 && d.blackWinsCount >= 1 && d.clutchWins === 0, i: "🤹", t: "Chaos-Artist", d: ["Schwarz hier, Druck da…", "Alles gleichzeitig falsch.", "Kurz vor Ziel stolpert er.", "Zu viel Show, zu wenig Erfolg.", "Unruhiges Spiel."] , h: "Spiele mindestens 10 Matches – und Hol dir mindestens 1 Sieg durch Schwarz-Fehler und Keine 1-Kugel-Krimis gewinnen"},
  { cond: (d) => d.games >= 15 && d.winRate < 20, i: "⚓", t: "Ballast", d: ["Zieht die Bilanz runter.", "Heute schwerer Anker.", "Wenig Erfolg, viel Aufwand.", "Das tut weh.", "Da muss was passieren."] , h: "Spiele mindestens 15 Matches – und Gewinne höchstens 20% deiner Matches"},
  { cond: (d) => d.games >= 6 && d.winRate < 30 && d.avgRest >= 6.5, i: "🚧", t: "Baustelle", d: ["Hier wird noch gebaut.", "Viel offen, wenig fertig.", "Das Fundament fehlt.", "Zu viele Fehler gleichzeitig.", "Wird Zeit für einen Plan."] , h: "Spiele mindestens 6 Matches – und Gewinne höchstens 30% deiner Matches und Lass im Schnitt mindestens 6,5 Kugeln bei Niederlagen übrig"},
  { cond: (d) => d.closeLosses >= 1 && d.wins === 0 && d.games >= 3, i: "🧨", t: "Pech-Explosion", d: ["Schwarz drin, Sieg weg.", "Alles gegen ihn.", "Heute war’s bitter.", "Mehr Pech als Plan.", "Ein tag zum Wegatmen."] , h: "Verliere mindestens 1 Match extrem knapp (Gegner Rest 1), gewinne aber kein einziges Spiel bei mind. 3 Versuchen"},
  { cond: (d) => d.avgRest >= 9 && d.games >= 3, i: "🧺", t: "Kugelsammler XL", d: ["Er hortet Kugeln wie Trophäen.", "Alles bleibt liegen.", "Der Tisch ist voll, die Statistik leer.", "Da passt kein Ball mehr drauf.", "Sammeln statt lochen."] , h: "Lass im Schnitt mindestens 9 Kugeln bei Niederlagen übrig – und Spiele mindestens 3 Matches"},
  { cond: (d) => d.winRateDelta20 <= -8  && d.games >= 40, i:"🌀", t:"Tilt-Spirale I",  d:["Die Kurve kippt.","Irgendwas stimmt nicht.","Form im Keller.","Da geht was verloren.","Atmen. Reset."], h:"Winrate (letzte 20 vs erste 20) fällt um ≥ 8%",  g:"Tilt-Spirale", tier:1 },
  { cond: (d) => d.winRateDelta20 <= -15 && d.games >= 40, i:"🌀", t:"Tilt-Spirale II", d:["Das tut weh.","Das ist ein Trend.","Kopf raus.","Du rutschst weg.","Stopp die Abfahrt."], h:"Winrate (letzte 20 vs erste 20) fällt um ≥ 15%", g:"Tilt-Spirale", tier:2 },
  { cond: (d) => d.winRateDelta20 <= -22 && d.games >= 40, i:"🌀", t:"Tilt-Spirale III",d:["Crash-Modus.","Nichts greift.","Der Filz hasst dich.","Das ist bitter.","Trainer rufen."], h:"Winrate (letzte 20 vs erste 20) fällt um ≥ 22%", g:"Tilt-Spirale", tier:3, max:true },
  { cond: (d) => d.closeLosses >= 3,  i:"🌧️", t:"Tragik-Magnet I",  d: ["Immer fast.", "Knapp daneben ist auch vorbei.", "Drama – aber falschrum.", "Herzschmerz am Tisch.", "Das war’s wieder."], h: "Verliere 3 knappe Spiele (du Rest=1)", g: "Tragik-Magnet", tier: 1 },
  { cond: (d) => d.closeLosses >= 7,  i:"🌧️", t:"Tragik-Magnet II", d: ["Du sammelst bittere Enden.", "Das ist schon Kunst.", "Immer die letzte Kugel.", "Aua deluxe.", "Schicksal."], h: "Verliere 7 knappe Spiele (du Rest=1)", g: "Tragik-Magnet", tier: 2 },
  { cond: (d) => d.closeLosses >= 15, i: "🌧️", t: "Tragik-Magnet III",d: ["Du bist der Plot-Twist.", "Finale Kugel? Nein.", "Das ist verflucht.", "Tränen auf Filz.", "Endgame-Opfer."], h: "Verliere 15 knappe Spiele (du Rest=1)", g: "Tragik-Magnet", tier: 3, max: true },
  { cond: (d) => d.vsWorstOpponentLosses >= 5,  i:"🫥", t:"Haus-Gast I",  d:["Immer wieder eingeladen.","Und immer wieder verloren.","Der Tisch kennt das Ende.","Das ist Gewohnheit.","Du bist Stammkunde."], h:"Verliere 5× gegen deinen schlimmsten Gegner", g:"Haus-Gast", tier:1 },
  { cond: (d) => d.vsWorstOpponentLosses >= 9,  i:"🫥", t:"Haus-Gast II", d:["Das ist eine serie… leider.","Du kennst den weg nach unten.","Er liest dich.","Immer gleich.","Aua."], h:"Verliere 9× gegen deinen schlimmsten Gegner", g:"Haus-Gast", tier:2 },
  { cond: (d) => d.vsWorstOpponentLosses >= 14, i:"🫥", t:"Haus-Gast III",d:["Du wohnst fast da.","Er hat deinen Schlüssel.","Das ist Dominanz (gegen dich).","Bittere Realität.","Zeit für Rache."], h:"Verliere 14× gegen deinen schlimmsten Gegner", g:"Haus-Gast", tier:3, max:true },
];

// --- HILFSFUNKTIONEN (Außerhalb für Scriptable verfügbar) ---
window.processData = function(dataArray, todayStr) {
    const now = new Date();
    const checkToday = (dateStr) => {
        if (todayStr && dateStr && dateStr.startsWith(todayStr)) return true;
        const m = String(dateStr || "").match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        if (!m) return false;
        return parseInt(m[1], 10) === now.getDate() && parseInt(m[2], 10) === (now.getMonth() + 1) && parseInt(m[3], 10) === now.getFullYear();
    };

    const pData = {};
    let blackWins = 0, breakWinsCount = 0;
    const aggregates = { totalBallMatches: 0, vollWins: 0, halbWins: 0, playerBallWins: {}, teamResults: {}, ballSpez: {}, matchupStats: {}, matchups: {}, meetings: {} };
    const initP = (n) => { 
        if (!pData[n]) pData[n] = { 
            wins: 0, games: 0, rest: 0, maxStreak: 0, streak: 0, 
            lastWin: false, clutchWins: 0, killerPoints: 0, 
            blackWinsCount: 0, breakWins: 0, todayGames: 0, todayWins: 0,
            todayMaxStreak: 0, todayClutchWins: 0, todayBreakWins: 0, 
            todayBlackWinsCount: 0, todayKillerPoints: 0, todayRest: 0, 
            todayAvgRest: 0, currentStreak: 0
        }; 
    };

    dataArray.forEach(g => {
        const isTodayMatch = checkToday(g.d);
        const isTeam = g.m === "2:2";
        const p1Arr = (isTeam ? (g.p1 ? g.p1.split(" & ") : []) : [g.p1]).map(s => String(s || '').trim()).filter(Boolean);
        const p2Arr = (isTeam ? (g.p2 ? g.p2.split(" & ") : []) : [g.p2]).map(s => String(s || '').trim()).filter(Boolean);
        const winners = (g.w == 1) ? p1Arr : p2Arr;
        const losers = (g.w == 1) ? p2Arr : p1Arr;
        const winnerString = (g.w == 1) ? String(g.p1 || '') : String(g.p2 || '');
        const breaker = String(g.a || '').trim();
        const rest = parseInt(g.l || 0);

        [...p1Arr, ...p2Arr].forEach(p => { 
            if(p) {
                initP(p); pData[p].games++; 
                if(isTodayMatch) pData[p].todayGames++; 
            }
        });
        winners.forEach(p => {
            if(!p) return;
            pData[p].wins++;
            if (isTodayMatch) {
                pData[p].todayWins++;
                pData[p].todayKillerPoints += rest;
                if (g.t && g.t.includes("Schwarz")) pData[p].todayBlackWinsCount++;
                if (breaker && winners.map(s => String(s).trim()).includes(breaker)) pData[p].todayBreakWins++;
                if (rest === 1) pData[p].todayClutchWins++;
            }
            pData[p].killerPoints += rest;
            pData[p].streak = pData[p].lastWin ? pData[p].streak + 1 : 1;
            pData[p].currentStreak = pData[p].streak;
            if (pData[p].streak > pData[p].maxStreak) pData[p].maxStreak = pData[p].streak;
            if (isTodayMatch) pData[p].todayMaxStreak = Math.max(pData[p].todayMaxStreak || 0, pData[p].streak);
            
            pData[p].lastWin = true;
            if (g.t && g.t.includes("Schwarz")) pData[p].blackWinsCount++;
            if (breaker && winners.map(s => String(s).trim()).includes(breaker)) pData[p].breakWins++;
        });
        losers.forEach(p => {
            if(!p) return;
            pData[p].streak = 0; pData[p].currentStreak = 0; pData[p].lastWin = false; pData[p].rest += rest;
            if (isTodayMatch) pData[p].todayRest += rest;
        });
        if (rest === 1) winners.forEach(p => { if(p) pData[p].clutchWins++; });
        if (g.t && g.t.includes("Schwarz")) blackWins++;
        if (breaker && winners.map(s => String(s).trim()).includes(breaker)) breakWinsCount++;

        // Aggregates Berechnung für Dashboard (Kugeln, Teams, Duelle)
        if (g.bt1 && g.bt2 && g.w) {
            aggregates.totalBallMatches++;
            const winType = (g.w == 1) ? g.bt1 : g.bt2;
            if (winType === 'Voll') aggregates.vollWins++; else if (winType === 'Halb') aggregates.halbWins++;
            winners.forEach(n => {
                if(!aggregates.playerBallWins[n]) aggregates.playerBallWins[n] = { Voll:0, Halb:0 };
                aggregates.playerBallWins[n][winType]++;
            });
            const procSpez = (arr, type, isWin) => arr.forEach(p => {
                if(!aggregates.ballSpez[p]) aggregates.ballSpez[p] = { Voll:{w:0,g:0}, Halb:{w:0,g:0} };
                aggregates.ballSpez[p][type].g++; if(isWin) aggregates.ballSpez[p][type].w++;
            });
            procSpez(p1Arr, g.bt1, g.w==1); procSpez(p2Arr, g.bt2, g.w==2);
        }

        if (isTeam && p1Arr.length === 2 && p2Arr.length === 2) {
            const t1 = [...p1Arr].sort().join(" & "), t2 = [...p2Arr].sort().join(" & ");
            if(!aggregates.teamResults[t1]) aggregates.teamResults[t1] = {w:0, g:0};
            if(!aggregates.teamResults[t2]) aggregates.teamResults[t2] = {w:0, g:0};
            aggregates.teamResults[t1].g++; aggregates.teamResults[t2].g++;
            if(g.w == 1) aggregates.teamResults[t1].w++; else aggregates.teamResults[t2].w++;
        }

        if (!isTeam && p1Arr.length === 1 && p2Arr.length === 1) {
            const name1 = p1Arr[0], name2 = p2Arr[0];
            const winName = (g.w == 1) ? name1 : name2;
            const loseName = (g.w == 1) ? name2 : name1;
            const mKey = winName + " -> " + loseName;
            const uKey = [name1, name2].sort().join('|');
            aggregates.matchups[mKey] = (aggregates.matchups[mKey] || 0) + 1;
            aggregates.meetings[uKey] = (aggregates.meetings[uKey] || 0) + 1;
            if(!aggregates.matchupStats[uKey]) aggregates.matchupStats[uKey] = {p1: name1, p2: name2, p1_wins:0, p2_wins:0, games:0};
            aggregates.matchupStats[uKey].games++;
            if(winName === aggregates.matchupStats[uKey].p1) aggregates.matchupStats[uKey].p1_wins++; else aggregates.matchupStats[uKey].p2_wins++;
        }
    });

    Object.keys(pData).forEach(p => {
        const d = pData[p];
        d.todayAvgRest = (d.todayGames - d.todayWins) > 0 ? (d.todayRest / (d.todayGames - d.todayWins)) : 0;
    });

    return { pData, blackWins, breakWins: breakWinsCount, aggregates };
};

window.computeEloRatings = function(allMatches) {
    const base = 1000;
    const ratings = {};
    const games = {};
    const parseSortTime = (gd) => {
        const s = String(gd || "");
        const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[^\d]+(\d{1,2}):(\d{2}))?/);
        if (!m) return 0;
        return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10), m[4] ? parseInt(m[4], 10) : 0, m[5] ? parseInt(m[5], 10) : 0).getTime();
    };
    const ordered = (allMatches || []).map((g, i) => ({ g, i }))
        .sort((a, b) => (parseSortTime(a.g.d) || 0) - (parseSortTime(b.g.d) || 0) || a.i - b.i)
        .map(x => x.g);

    const getR = (p) => (typeof ratings[p] === 'number') ? ratings[p] : base;
    const getG = (p) => (typeof games[p] === 'number') ? games[p] : 0;
    ordered.forEach(g => {
        if (!g) return;
        const isTeam = g.m === "2:2";
        const team1 = (isTeam ? g.p1.split(" & ") : [g.p1]).filter(Boolean);
        const team2 = (isTeam ? g.p2.split(" & ") : [g.p2]).filter(Boolean);
        const r1 = team1.reduce((sum, p) => sum + getR(p), 0) / team1.length;
        const r2 = team2.reduce((sum, p) => sum + getR(p), 0) / team2.length;
        const e1 = 1 / (1 + Math.pow(10, (r2 - r1) / 400));
        const dScore = ((g.w == 1 ? 1 : 0) - e1);
        team1.forEach(p => { ratings[p] = getR(p) + (getG(p) < 20 ? 40 : 20) * dScore; games[p] = getG(p) + 1; });
        team2.forEach(p => { ratings[p] = getR(p) - (getG(p) < 20 ? 40 : 20) * dScore; games[p] = getG(p) + 1; });
    });
    const out = {};
    Object.keys(ratings).forEach(p => { out[p] = { elo: Math.round(ratings[p]), eloGames: games[p] }; });
    return out;
};

/**
 * Diese Funktion nimmt die Basis-Daten vom Worker und fügt die Achievement-Logik hinzu.
 * Achievements enthalten Funktionen (cond), die nicht über den Worker laufen können.
 */
window.enrichStatsWithAchievements = function(baseStats, allMatches, configuredPlayers, dailyAchivs, isFullHistory = true) {
    // Wir starten mit leeren/initialen Stats für die Simulation
    const simPData = {};
    const matchDeltas = JSON.parse(JSON.stringify(baseStats.matchDeltas || {}));
    const aggregates = JSON.parse(JSON.stringify(baseStats.aggregates || {}));

    const allPools = [...window.famePool, ...window.shamePool];
    
    const nowObj = new Date();
    const dStr = String(nowObj.getDate()).padStart(2, '0');
    const mStr = String(nowObj.getMonth() + 1).padStart(2, '0');
    const yStr = nowObj.getFullYear();
    const todayStr = `${dStr}.${mStr}.${yStr}`; // Für den Vergleich mit g.d
    const isoTodayStr = `${yStr}-${mStr}-${dStr}`; // Für die Speicherung in dailyAchivs

    const initSimP = (n) => {
        if (!simPData[n]) simPData[n] = {
            wins: 0, games: 0, rest: 0, maxStreak: 0, currentStreak: 0, lastWin: false,
            clutchWins: 0, closeWins: 0, closeLosses: 0, dramaWins: 0, killerPoints: 0, blackWinsCount: 0, breakWins: 0, 
            todayWins: 0, todayGames: 0, todayMaxStreak: 0, todayClutchWins: 0, todayBreakWins: 0, todayBlackWinsCount: 0, todayKillerPoints: 0, todayRest: 0, todayAvgRest: 0,
            loseStreak: 0, maxLoseStreak: 0, eloHistory: [], maxElo: 1000, 
            maxWinRate: 0, winsVsTopElo: 0, vsNemesisWins: 0, vsWorstOpponentLosses: 0,
            closeWins: 0, closeLosses: 0, dramaWins: 0,
            winRate: 0, avgKiller: 0, avgRest: 0, winRateLast30: 0,
            avgRestLossLast20: 0, avgKillerLast20: 0, eloDelta10: 0, winRateDelta20: 0,
            eloDelta10: 0, winRateDelta20: 0, winRateLast30: 0, avgRestLossLast20: 0, avgKillerLast20: 0,
            headToHead: {}, achTracker: {}, achCountTotal: 0, completedTracks: 0, dailyDaysWithAch: 0,
            last30Games: [], last20Losses: [], last20WinsKiller: [], gameResultsHistory: [], elo: 1000, eloGames: 0,
            avgKiller: 0, avgRest: 0, winRate: 0 // Added winRate to initSimP
        };
    };

    const getElo = (p) => (simPData[p] ? simPData[p].elo : 1000);

    allMatches.forEach(({ g, i: originalIndex }) => {
        if (!g || !g.d) return; // Skip if match data or date is missing
        const isTeam = g.m === "2:2";
        const p1A = (isTeam ? (g.p1 ? g.p1.split(" & ") : []) : [g.p1]).map(s => String(s || '').trim()).filter(Boolean);
        const p2A = (isTeam ? (g.p2 ? g.p2.split(" & ") : []) : [g.p2]).map(s => String(s || '').trim()).filter(Boolean);
        const players = [...p1A, ...p2A].map(s => String(s || '').trim()).filter(Boolean);

        players.forEach(initSimP);

        // Wer war vor dem Match die Nr. 1? (Wichtig für Riesen-Jäger)
        let currentTopPlayer = null;
        let highestEloFound = -1;
        Object.keys(simPData).forEach(pName => {
            if (simPData[pName].elo > highestEloFound) {
                highestEloFound = simPData[pName].elo;
                currentTopPlayer = pName;
            }
        });

        // Vor dem Match: Zustand sichern für "Neu"-Erkennung
        const pDataBeforeMatch = {};
        players.forEach(p => { pDataBeforeMatch[p] = JSON.parse(JSON.stringify(simPData[p])); });

        const winners = (g.w == 1) ? p1A : p2A;
        const losers = (g.w == 1) ? p2A : p1A;
        const rest = parseInt(g.l || 0);
        const winnerString = String((g.w == 1) ? g.p1 : g.p2 || '').trim(); // Trimmed winner string for break check
        const breakerString = String(g.a || '').trim();
        // ELO Berechnung für die Simulation
        const avg1 = p1A.reduce((s, p) => s + getElo(p), 0) / (p1A.length || 1);
        const avg2 = p2A.reduce((s, p) => s + getElo(p), 0) / (p2A.length || 1);
        const exp1 = 1 / (1 + Math.pow(10, (avg2 - avg1) / 400));
        const eloChangeBase = (g.w == 1 ? 1 : 0) - exp1;
        matchDeltas[originalIndex] = { eloDelta: Math.round(20 * Math.abs(eloChangeBase)) };

        players.forEach(p => {
            const d = simPData[p];
            const isW = winners.includes(p); // winners (p1A/p2A) are already trimmed arrays

            // H2H Simulation
            if (isW) {
                losers.forEach(l => { // losers (p1A/p2A) are already trimmed arrays
                    if (!d.headToHead[l]) d.headToHead[l] = { w: 0, l: 0 };
                    d.headToHead[l].w++;
                });
            } else { // Current player 'p' lost
                winners.forEach(w => { // winners (p1A/p2A) are already trimmed arrays
                    if (!d.headToHead[w]) d.headToHead[w] = { w: 0, l: 0 };
                    d.headToHead[w].l++;
                });
            }

            d.games++;
            d.gameResultsHistory.push(isW ? 1 : 0);
            d.last30Games.push(isW ? 1 : 0);
            if (d.last30Games.length > 30) d.last30Games.shift();

            if (isW) {
                d.wins++; d.currentStreak++; d.loseStreak = 0; d.lastWin = true;
                if (d.currentStreak > d.maxStreak) d.maxStreak = d.currentStreak;
                if (g.t?.includes("Schwarz")) d.blackWinsCount++;
                
                // Break-Win Simulation
                if (breakerString && breakerString === winnerString) { // Ensure g.a is trimmed
                    if (isTeam) {
                        if (winnerString.split(" & ").map(s => s.trim()).includes(p)) d.breakWins++;
                    } else if (p === winnerString) {
                        d.breakWins++;
                    }
                }

                if (rest === 1) { d.clutchWins++; d.closeWins++; d.dramaWins++; }
                d.killerPoints += rest;
                d.last20WinsKiller.push(rest);
                if (d.last20WinsKiller.length > 20) d.last20WinsKiller.shift();

                if (currentTopPlayer && losers.includes(currentTopPlayer)) d.winsVsTopElo++;
                
                let nemesis = null; let maxL = 0;
                Object.entries(d.headToHead).forEach(([opp, st]) => { if (st.l > maxL) { maxL = st.l; nemesis = opp; } });
                if (nemesis && losers.includes(nemesis)) d.vsNemesisWins++; // losers is already trimmed
            } else {
                d.rest += rest; d.currentStreak = 0; d.loseStreak++; d.lastWin = false;
                if (d.loseStreak > d.maxLoseStreak) d.maxLoseStreak = d.loseStreak;
                if (rest === 1) d.closeLosses++;
                d.last20Losses.push(rest);
                if (d.last20Losses.length > 20) d.last20Losses.shift();

                let worstOpp = null; let maxL = 0;
                Object.entries(d.headToHead).forEach(([opp, st]) => { if (st.l > maxL) { maxL = st.l; worstOpp = opp; } });
                if (worstOpp && winners.includes(worstOpp)) d.vsWorstOpponentLosses++; // winners is already trimmed
            }

            // Elo Simulation
            const k = d.eloGames < 20 ? 40 : 20;
            const change = p1A.includes(p) ? (k * eloChangeBase) : -(k * eloChangeBase);
            d.elo += change;
            d.eloGames++;
            d.eloHistory.push(Math.round(d.elo));
            if (d.elo > d.maxElo) d.maxElo = Math.round(d.elo);

            // Abgeleitete Metriken für Erfolge
            d.winRate = Math.round((d.wins / d.games) * 100);
            d.avgKiller = d.wins > 0 ? (d.killerPoints / d.wins) : 0;
            d.avgRest = (d.games - d.wins) > 0 ? (d.rest / (d.games - d.wins)) : 0;
            d.winRateLast30 = d.last30Games.length > 0 ? Math.round((d.last30Games.reduce((a,b)=>a+b,0)/d.last30Games.length)*100) : 0;
            d.avgRestLossLast20 = d.last20Losses.length > 0 ? (d.last20Losses.reduce((a,b)=>a+b,0)/d.last20Losses.length) : 0;
            d.avgKillerLast20 = d.last20WinsKiller.length > 0 ? (d.last20WinsKiller.reduce((a,b)=>a+b,0)/d.last20WinsKiller.length) : 0;

            if (d.eloHistory.length >= 10) {
                const prevElo = d.eloHistory.length === 10 ? 1000 : d.eloHistory[d.eloHistory.length - 11];
                d.eloDelta10 = d.eloHistory[d.eloHistory.length - 1] - prevElo;
            }

            if (d.games >= 40) {
                const first20 = d.gameResultsHistory.slice(0, 20);
                const last20 = d.gameResultsHistory.slice(-20);
                d.winRateDelta20 = ((last20.reduce((a,b)=>a+b,0)/20)*100) - ((first20.reduce((a,b)=>a+b,0)/20)*100);
            }
        });

        if (g.d && g.d.startsWith(todayStr)) {
            players.forEach(p => {
                if (!simPData[p]) return;
                simPData[p].todayGames++;
                if (winners.includes(p)) { // winners is already trimmed
                    simPData[p].todayWins++;
                    simPData[p].todayKillerPoints += rest;
                    simPData[p].todayMaxStreak = Math.max(simPData[p].todayMaxStreak, simPData[p].currentStreak);
                    if (g.t?.includes("Schwarz")) simPData[p].todayBlackWinsCount++;
                    if (breakerString === winnerString) simPData[p].todayBreakWins++;
                    if (rest === 1) simPData[p].todayClutchWins++;
                } else { simPData[p].todayRest += rest; }
                simPData[p].todayAvgRest = (simPData[p].todayGames - simPData[p].todayWins) > 0 ? (simPData[p].todayRest / (simPData[p].todayGames - simPData[p].todayWins)) : 0;
            });
        }

        players.forEach(p => {
            if (!simPData[p]) return;
            const d = simPData[p], dBefore = pDataBeforeMatch[p] || { achTracker: {} };

            const isMatchFromToday = g.d && g.d.startsWith(todayStr);
            
            // Zentrale Funktion zum Speichern neuer Erfolge (Daily + Langzeit)
            const recordNewAch = (ach) => {
                if (!matchDeltas[originalIndex]) matchDeltas[originalIndex] = { eloDelta: Math.round(20 * Math.abs(eloChangeBase)) };
                matchDeltas[originalIndex].newAchievements = matchDeltas[originalIndex].newAchievements || {};
                matchDeltas[originalIndex].newAchievements[p] = matchDeltas[originalIndex].newAchievements[p] || [];
                matchDeltas[originalIndex].newAchievements[p].push({
                    i: ach.i, t: ach.t, d: ach.d, h: ach.h, k: ach.k || (window.famePool.includes(ach) ? 'fame' : 'shame'), max: ach.max
                });

                // In die persistente Tages-Statistik schreiben (für Daily-Sammler & Historie)
                if (isMatchFromToday && isFullHistory && dailyAchivs) {
                    if (!dailyAchivs.days) dailyAchivs.days = {};
                    if (!dailyAchivs.days[isoTodayStr]) dailyAchivs.days[isoTodayStr] = {};
                    if (!dailyAchivs.days[isoTodayStr][p]) dailyAchivs.days[isoTodayStr][p] = [];
                    if (!dailyAchivs.days[isoTodayStr][p].includes(ach.t)) dailyAchivs.days[isoTodayStr][p].push(ach.t);
                }
            };

            // 1. Tägliche Erfolge prüfen
            if (isMatchFromToday) {
                const dailyPool = [...window.dailyFamePool, ...window.dailyShamePool];
                dailyPool.forEach(ach => {
                    const hasNow = ach.cond(d);
                    const hadBefore = ach.cond(dBefore);
                    if (hasNow && !hadBefore) recordNewAch(ach);
                    else if (!hasNow && hadBefore && isFullHistory && dailyAchivs?.days?.[isoTodayStr]?.[p]) {
                        // Entfernen, falls Bedingung nicht mehr erfüllt (z.B. Tageskönig durch Niederlage weg)
                        const idx = dailyAchivs.days[isoTodayStr][p].indexOf(ach.t);
                        if (idx > -1) dailyAchivs.days[isoTodayStr][p].splice(idx, 1);
                    }
                });
            }

            // 2. Langzeit-Erfolge prüfen
            allPools.forEach(ach => {
                const hasNow = ach.cond(d);
                if (!d.achTracker[ach.t]) d.achTracker[ach.t] = { earned: 0, lost: 0, active: false };
                if (hasNow && !d.achTracker[ach.t].active) { d.achTracker[ach.t].earned++; d.achTracker[ach.t].active = true; }
                else if (!hasNow && d.achTracker[ach.t].active) { d.achTracker[ach.t].lost++; d.achTracker[ach.t].active = false; }
                
                if (hasNow && (!dBefore.achTracker[ach.t] || !dBefore.achTracker[ach.t].active)) {
                    recordNewAch(ach);
                }
            });
        });
    });

    const pData = JSON.parse(JSON.stringify(baseStats.pData || {}));
    Object.keys(pData).forEach(p => {
        const d = pData[p];
        if (simPData[p]) {
            d.achTracker = simPData[p].achTracker;
            // Heutige Statistiken aus der Simulation in das Ergebnis-Objekt übertragen
            d.todayGames = simPData[p].todayGames || 0;
            d.todayWins = simPData[p].todayWins || 0;
            d.todayMaxStreak = simPData[p].todayMaxStreak || 0;
            d.todayClutchWins = simPData[p].todayClutchWins || 0;
            d.todayBreakWins = simPData[p].todayBreakWins || 0;
            d.todayBlackWinsCount = simPData[p].todayBlackWinsCount || 0;
            d.todayKillerPoints = simPData[p].todayKillerPoints || 0;
            d.todayRest = simPData[p].todayRest || 0;
            d.todayAvgRest = simPData[p].todayAvgRest || 0;
        }
        let currentAchs = [];
        allPools.forEach(ach => { if (ach.cond(d)) currentAchs.push(ach); });
        const tierBest = {};
        currentAchs.forEach(it => {
            if (!it.g || !it.tier) return;
            const key = it.k + '|' + it.g;
            if (!tierBest[key] || it.tier > tierBest[key].tier) tierBest[key] = it;
        });
        const finalAchs = currentAchs.filter(it => !(it.g && it.tier));
        Object.values(tierBest).forEach(a => finalAchs.push(a));
        d.achCountTotal = finalAchs.length;

        if (dailyAchivs && dailyAchivs.days) {
            for (const dayKey in dailyAchivs.days) {
                const dayRec = dailyAchivs.days[dayKey] || {};
                if (Array.isArray(dayRec[p]) && dayRec[p].length > 0) d.dailyDaysWithAch++;
            }
        }

        const tracks = {};
        finalAchs.forEach(ach => { if (ach.g && ach.tier) tracks[ach.g] = Math.max(tracks[ach.g] || 0, ach.tier); });
        const allTrackNames = new Set();
        allPools.forEach(ach => { if (ach.g && ach.tier) allTrackNames.add(ach.g); });
        allTrackNames.forEach(tn => {
            const maxInPool = allPools.filter(a => a.g === tn).reduce((m, a) => Math.max(m, a.tier || 0), 0);
            if (maxInPool > 0 && tracks[tn] === maxInPool) d.completedTracks++;
        });
    });

    return { 
        pData, 
        matchDeltas, 
        aggregates, 
        blackWins: baseStats.blackWins, 
        breakWins: baseStats.breakWins 
    };
};

// --- CONSOLIDATED FILTER FUNCTION ---
window.getFilteredStats = () => {
    if (window.timeFilter === 'custom') {
        let start = null;
        if (window.customStartDate) {
            const [sy, sm, sd] = window.customStartDate.split('-').map(Number);
            // Erstelle Startdatum in UTC (00:00:00 des ausgewählten Tages)
            start = new Date(0);
            start.setUTCFullYear(sy, sm - 1, sd);
            start.setUTCHours(0, 0, 0, 0);
        }
        let end = null;
        if (window.customEndDate) {
            const [ey, em, ed] = window.customEndDate.split('-').map(Number);
            // Erstelle Enddatum in UTC (23:59:59 des ausgewählten Tages)
            end = new Date(0);
            end.setUTCFullYear(ey, em - 1, ed);
            end.setUTCHours(23, 59, 59, 999);
        }

        return window.stats.filter(g => {
            if (!g || !g.d) return false;
            // Format: DD.MM.YYYY, HH:MM
            const parts = g.d.split(', ')[0].split('.');
            if (parts.length < 3) return false;
            // Erstelle Matchdatum in UTC (00:00:00 des Match-Tages)
            const mDate = new Date(0);
            mDate.setUTCFullYear(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            mDate.setUTCHours(0, 0, 0, 0);

            if (start && mDate < start) return false;
            if (end && mDate > end) return false;
            return true;
        });
    }

    if (window.timeFilter === 'all') return window.stats;
    
    const now = new Date();
    // Referenzdatum für heutige Berechnungen in UTC
    const todayStartUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    
    return window.stats.filter(g => {
        if (!g || !g.d) return false;
        // Format: DD.MM.YYYY, HH:MM
        const parts = g.d.split(', ')[0].split('.');
        if (parts.length < 3) return false;
        // Erstelle Matchdatum in UTC (00:00:00 des Match-Tages)
        const mDate = new Date(0);
        mDate.setUTCFullYear(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        mDate.setUTCHours(0, 0, 0, 0);

        if (window.timeFilter === '30days') {
            const limit = new Date(todayStartUTC);
            limit.setUTCDate(limit.getUTCDate() - 30); // setUTCDate statt setDate für UTC-Konsistenz
            return mDate >= limit;
        }
        if (window.timeFilter === '60days') {
            const limit = new Date(todayStartUTC);
            limit.setUTCDate(limit.getUTCDate() - 60);
            return mDate >= limit;
        }
        if (window.timeFilter === '90days') {
            const limit = new Date(todayStartUTC);
            limit.setUTCDate(limit.getUTCDate() - 90);
            return mDate >= limit;
        }
        if (window.timeFilter === 'month') { // "Aktueller Monat"
            return mDate.getUTCMonth() === now.getUTCMonth() && mDate.getUTCFullYear() === now.getUTCFullYear();
        }
        if (window.timeFilter === 'lastMonth') { // "Letzter Monat"
            const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
            const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
            return mDate >= lastMonthStart && mDate < currentMonthStart;
        }
        if (window.timeFilter === 'quarter') { // "Aktuelles Quartal"
            const qStartMonth = Math.floor(now.getUTCMonth() / 3) * 3;
            const qStart = new Date(Date.UTC(now.getUTCFullYear(), qStartMonth, 1, 0, 0, 0, 0));
            return mDate >= qStart;
        }
        if (window.timeFilter === 'lastQuarter') { // "Letztes Quartal"
            const currentQuarterStartMonth = Math.floor(now.getUTCMonth() / 3) * 3;
            const lastQuarterStartMonth = currentQuarterStartMonth - 3;
            let lastQuarterYear = now.getUTCFullYear();
            if (lastQuarterStartMonth < 0) { lastQuarterYear--; lastQuarterStartMonth += 12; }
            const lastQuarterStart = new Date(Date.UTC(lastQuarterYear, lastQuarterStartMonth, 1, 0, 0, 0, 0));
            const currentQuarterStart = new Date(Date.UTC(now.getUTCFullYear(), currentQuarterStartMonth, 1, 0, 0, 0, 0));
            return mDate >= lastQuarterStart && mDate < currentQuarterStart;
        }
        if (window.timeFilter === 'year') { // "Aktuelles Jahr"
            return mDate.getUTCFullYear() === now.getUTCFullYear();
        }
        if (window.timeFilter === 'lastYear') { // "Letztes Jahr"
            const lastYearStart = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1, 0, 0, 0, 0));
            const currentYearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
            return mDate >= lastYearStart && mDate < currentYearStart;
        }
        return true;
    });
};

window.renderBillardStats = function(stats, filterToday = false, onlyAchievements = false, rootEl = document, precalculatedCareerStats = null, precalculatedCareerStatsBeforeToday = null) { 
    // --- Scope: suche IDs nur innerhalb der aktiven View (wichtig bei doppelten IDs im DOM)
    let root = rootEl || document;
    const byId = (id) => (root && root.querySelector) ? root.querySelector('#' + id) : document.getElementById(id);    
    if (!root || typeof root.querySelector !== 'function') root = document;

    // --- DAILY ACHIVS LADEN (falls nicht bereits vorhanden) ---
    if (!window.dailyAchivs) {
      window.dailyAchivs = { days: {} };
    }
    
    // --- Spieler aus spieler.json (kommt aus BillardPro.js: const spieler = [...]) ---
    const configuredPlayers = (() => {
      let names = [];
      try {
        if (Array.isArray(window.spieler) && window.spieler.length > 0) names = window.spieler;
        else if (typeof spieler !== 'undefined' && Array.isArray(spieler)) names = spieler;
      } catch (e) {}
      const filtered = names.map(s => String(s || '').trim()).filter(Boolean);
      // Nur ein Set zurückgeben, wenn wir wirklich Namen haben, sonst null (kein Filter)
      return filtered.length > 0 ? new Set(filtered) : null;
    })();

    // --- DATUM & SICHERE DATEN ---
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    const todayStr = d + "." + m + "." + y; // DD.MM.YYYY
    const isoDay = `${y}-${m}-${d}`; // YYYY-MM-DD

    const safeStats = (stats || []).filter(m => m && m.d);

    // --- Daily Achievements Storage (wird von BillardPro.js in daily_achivs.json geschrieben)
    if (!window.dailyAchivs || !window.dailyAchivs.days) {
      window.dailyAchivs = { days: {} };
    }
    
    function saveDailyAchivs() {
      if (window.saveDailyAchivsToFirebase) window.saveDailyAchivsToFirebase(window.dailyAchivs);
    }



    // --- ELO Berechnung (Team-Average, Start=1000, K=40/20) ---
    function computeEloRatings(allMatches) {
      const base = 1000;
      const ratings = {};
      const games = {};

      const parseSortTime = (gd) => {
        const s = String(gd || "");
        const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[^\d]+(\d{1,2}):(\d{2}))?/);
        if (!m) return 0;
        const dd = parseInt(m[1], 10);
        const mm = parseInt(m[2], 10) - 1;
        const yy = parseInt(m[3], 10);
        const hh = m[4] ? parseInt(m[4], 10) : 0;
        const mi = m[5] ? parseInt(m[5], 10) : 0;
        return new Date(yy, mm, dd, hh, mi, 0, 0).getTime();
      };

      const ordered = (allMatches || []).map((g, i) => ({ g, i }))
        .sort((a, b) => {
          const ta = parseSortTime(a.g && a.g.d);
          const tb = parseSortTime(b.g && b.g.d);
          if (ta !== tb) return ta - tb;
          return a.i - b.i;
        })
        .map(x => x.g);

      const getR = (p) => (typeof ratings[p] === 'number') ? ratings[p] : base;
      const getG = (p) => (typeof games[p] === 'number') ? games[p] : 0;
      const setR = (p, v) => { ratings[p] = v; };
      const incG = (p) => { games[p] = getG(p) + 1; };
      const getK = (p) => (getG(p) < 20 ? 40 : 20);

      ordered.forEach(g => {
        if (!g) return;
        const isTeam = g.m === "2:2";
        const t1 = isTeam ? (g.p1 ? String(g.p1).split(" & ") : []) : [g.p1];
        const t2 = isTeam ? (g.p2 ? String(g.p2).split(" & ") : []) : [g.p2];
        const team1 = t1.map(s => String(s || '').trim()).filter(Boolean);
        const team2 = t2.map(s => String(s || '').trim()).filter(Boolean);
        if (!team1.length || !team2.length) return;

        const avg = (arr) => arr.reduce((sum, p) => sum + getR(p), 0) / arr.length;
        const r1 = avg(team1);
        const r2 = avg(team2);
        const e1 = 1 / (1 + Math.pow(10, (r2 - r1) / 400));
        const s1 = (g.w == 1) ? 1 : 0;
        const dScore = (s1 - e1);

        team1.forEach(p => { setR(p, getR(p) + getK(p) * dScore); incG(p); });
        team2.forEach(p => { setR(p, getR(p) - getK(p) * dScore); incG(p); });
      });

      const out = {};
      Object.keys(ratings).forEach(p => { out[p] = { elo: Math.round(ratings[p]), eloGames: getG(p) }; });
      return out;
    }

    function getDailyCountsForPlayer(playerName) {
      const counts = {}; // title -> anzahl tage
      const days = (window.dailyAchivs && window.dailyAchivs.days) ? window.dailyAchivs.days : {};
      for (const dayKey in days) {
        const dayRec = days[dayKey] || {};
        const arr = dayRec[playerName] || [];
        if (Array.isArray(arr)) {
          arr.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
        }
      }
      return counts;
    }

    function getDailyMetaForPlayer(playerName) {
      const days = (window.dailyAchivs && window.dailyAchivs.days) ? window.dailyAchivs.days : {};
      let daysWithAch = 0;

      for (const dayKey in days) {
        const dayRec = days[dayKey] || {}; // Correctly access day record
        const arr = dayRec[playerName] || [];
        if (Array.isArray(arr) && arr.length > 0) daysWithAch++;
      }
    
      return { daysWithAch };
    }

    // --- DATEN FILTERN ---
    const statsToday = safeStats.filter(g => g && g.d && g.d.startsWith(todayStr));
    const statsBeforeToday = safeStats.filter(g => g && g.d && !g.d.startsWith(todayStr));
    
    const dataAll = precalculatedCareerStats || { pData: {}, matchDeltas: {}, aggregates: {} }; // Worker output
    const dataBeforeToday = precalculatedCareerStatsBeforeToday || { pData: {}, matchDeltas: {}, aggregates: {} }; // Worker output
    const dataToday = filterToday ? window.processData(statsToday, todayStr) : null;

    const getAchHtml = (proc, isTodayTab, procBefore) => {
      let achHtml = "";

      // Header nur fürs TODAY-Layout (hier KEIN daily-save!)
      if (isTodayTab && Object.keys(proc.pData).some(p => proc.pData[p].todayGames > 0)) { // Only show header if there are today's achievements
        achHtml += `
          <div style="margin: 45px 0 20px 5px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
            <div style="color: #ffcc00; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px;">Die heutigen Erfolge</div>
            <div style="height: 3px; width: 30px; background: #ffcc00; margin-top: 5px; border-radius: 2px;"></div>
          </div>`;
      }

      const labels = Object.keys(proc.pData).sort();

      labels.forEach((p, idx) => {
        const d = proc.pData[p];
        // Vergleichsdaten für "NEU" Badge (Fallback auf leere Stats, falls Spieler heute neu ist)
        const dBefore = (procBefore && procBefore.pData[p]) ? procBefore.pData[p] : { 
            wins: 0, games: 0, rest: 0, maxStreak: 0, currentStreak: 0, lastWin: false, 
            clutchWins: 0, killerPoints: 0, blackWinsCount: 0, breakWins: 0 
        };
        
        const meta = getDailyMetaForPlayer(p);
        d.dailyDaysWithAch = meta.daysWithAch;

        if (isTodayTab && (!d.todayGames || d.todayGames === 0)) return;

        // --- ERWEITERTES LEVEL LOGIK (based on total wins) ---
        const levelSystem = [
          { min: 0,   title: "Billard-Embryo", icon: "🥚" },
          { min: 2,   title: "Kreide-Kenner", icon: "🖍️" },
          { min: 5,   title: "Kneipen-Tourist", icon: "🍺" },
          { min: 9,   title: "Queue-Anfänger", icon: "🦯" },
          { min: 14,  title: "Winkel-Lehrling", icon: "📐" },
          { min: 20,  title: "Kugel-Flüsterer", icon: "🎱" },
          { min: 28,  title: "Taschen-Dieb", icon: "🧤" },
          { min: 38,  title: "Bandenchef", icon: "🏦" },
          { min: 50,  title: "Filz-Kontrolleur", icon: "🟩" },
          { min: 65,  title: "Tisch-Dominator", icon: "🦾" },
          { min: 82,  title: "Effet-Lehrmeister", icon: "🌀" },
          { min: 102, title: "Stoß-Techniker", icon: "🎯" },
          { min: 125, title: "Präzisionsspieler", icon: "🔬" },
          { min: 150, title: "Match-Maschine", icon: "⚙️" },
          { min: 180, title: "Break-Kommandant", icon: "⚡" },
          { min: 215, title: "Crunchtime-Killer", icon: "🧊" },
          { min: 255, title: "Queue-Meister", icon: "🪵" },
          { min: 300, title: "Billard-Gott", icon: "👑" },
          { min: 360, title: "Filz-Orakel", icon: "🔮" },
          { min: 430, title: "Tisch-Architekt", icon: "🏗️" },
          { min: 510, title: "Unaufhaltsam", icon: "🔥" },
          { min: 600, title: "Legende der Filzmatte", icon: "🌌" },
          { min: 700, title: "Mythos am Tisch", icon: "🐉" },
          { min: 820, title: "Zeitloser Champion", icon: "⏳" },
          { min: 960, title: "Unsterblicher", icon: "💀" },
          { min: 1120, title: "Gott-Modus", icon: "♾️" }
        ];

        let currentLvl = levelSystem[0];
        let currentLvlIndex = 1;
        let nextLvl = null;
        for (let i = 0; i < levelSystem.length; i++) {
          if (d.wins >= levelSystem[i].min) {
            currentLvl = levelSystem[i];
            currentLvlIndex = i + 1;
            nextLvl = levelSystem[i + 1] || null;
          }
        }

        // --- DYNAMISCHE LEVEL-INFOS ---
        let progressPercent = 100;
        let infoText = "Du hast das Ende des Universums erreicht. Respekt! 🏆";

        if (nextLvl) {
          const range = nextLvl.min - currentLvl.min;
          const earned = d.wins - currentLvl.min;
          progressPercent = Math.min(100, Math.round((earned / range) * 100));

          const missing = nextLvl.min - d.wins;
          if (progressPercent < 20) {
            infoText = `Frisch befördert! Nächstes Ziel: <b style="color:#fff;">${nextLvl.title}</b> (+${missing})`;
          } else if (progressPercent < 50) {
            infoText = `Auf dem Weg zum <b style="color:#fff;">${nextLvl.title}</b>. Noch ${missing} Siege nötig!`;
          } else if (progressPercent < 80) {
            infoText = `Läuft bei dir! Nur noch ${missing}x gewinnen bis zum <b style="color:#fff;">${nextLvl.title}</b>.`;
          } else if (progressPercent < 95) {
            infoText = `Fast da! Ein Endspurt von ${missing} Siegen zum <b style="color:#fff;">${nextLvl.title}</b>! ⚡`;
          } else {
            infoText = `<span style="color:#ffcc00; font-weight:bold;">Matchball!</span> Nur noch ${missing} Sieg bis zum <b style="color:#fff;">${nextLvl.title}</b>! 🔥`;
          }
        }

        // --- Player-Box (Today ohne LvL, Gesamt mit LvL) ---
        let playerBoxHtml = "";

        if (isTodayTab) {
          playerBoxHtml = `
            <div class="card-modern" style="margin-bottom:15px; border-radius:22px; overflow:hidden; animation: ach-card-enter 0.5s ease-out forwards; animation-delay: ${idx * 0.1}s; opacity: 0;">
              <div onclick="const content = this.nextElementSibling; const chevron = this.querySelector('.ach-chevron'); const isHidden = content.style.display === 'none'; content.style.display = isHidden ? 'block' : 'none'; chevron.classList.toggle('expanded', isHidden); chevron.classList.toggle('collapsed', !isHidden);"
                   style="padding:15px; border-bottom: 1px solid rgba(255,255,255,0.06); cursor:pointer; -webkit-tap-highlight-color: transparent; display:flex; align-items:center; gap:12px;">
                <div class="ach-chevron expanded"></div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <img src="${window.getAvatarUrl(p)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex'" style="width:32px; height:32px; border-radius:12px; object-fit:cover; border: 1px solid rgba(255,255,255,0.1);">
                  <div style="display:none; width:32px; height:32px; border-radius:12px; background:rgba(255,255,255,0.1); align-items:center; justify-content:center; font-size:18px; border:1px solid rgba(255,255,255,0.1);">👤</div>
                  <div style="color:#ffffff; font-weight:900; font-size:16px; line-height:1; letter-spacing: 0.5px;">${p}</div>
                </div>
              </div>
              <div style="padding:12px 12px 6px 12px; display:block;">`;
        } else {
          playerBoxHtml = `
            <div class="achievement-card-hero" style="border-radius:24px; margin-bottom:15px; overflow:hidden; animation: ach-card-enter 0.5s ease-out forwards; animation-delay: ${idx * 0.1}s; opacity: 0;">
              <div onclick="const content = this.nextElementSibling; const chevron = this.querySelector('.ach-chevron'); const isHidden = content.style.display === 'none'; content.style.display = isHidden ? 'block' : 'none'; chevron.classList.toggle('expanded', isHidden); chevron.classList.toggle('collapsed', !isHidden);"
                   style="padding:18px; cursor:pointer; -webkit-tap-highlight-color: transparent;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                  <div style="display:flex; align-items:center; gap:12px;">
                    <div class="ach-chevron collapsed"></div>
                    <div style="display:flex; align-items:center; gap:14px;">
                    <img src="${window.getAvatarUrl(p)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex'" style="width:44px; height:44px; border-radius:14px; object-fit:cover; border:2px solid var(--accent); box-shadow: 0 0 15px rgba(255,204,0,0.2);">
                    <div style="display:none; width:36px; height:36px; border-radius:12px; background:rgba(255,255,255,0.1); align-items:center; justify-content:center; font-size:20px; border:1px solid rgba(255,255,255,0.1);">👤</div>
                    <div>
                      <div style="color:#ffffff; font-weight:900; font-size:20px; line-height:1; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${p}</div>
                      <div style="color:var(--accent); font-weight:900; font-size:9px; text-transform:uppercase; margin-top:6px; letter-spacing:1px; display:flex; align-items:center; gap:8px;"><span style="font-size:22px; filter: drop-shadow(0 0 10px rgba(255,204,0,0.5)); line-height: 1;">${currentLvl.icon}</span> <span>RANG ${currentLvlIndex} • ${currentLvl.title}</span></div>
                    </div>
                  </div>
                  </div>
                  <div style="text-align:right;">
                    <div class="stat-value-badge" style="font-size:14px; padding:4px 10px;">${d.wins} <span style="font-size:8px; opacity:0.6; margin-left:2px;">WINS</span></div>
                  </div>
                </div>

                <div class="progress-bar-container" style="margin-bottom:8px;">
                  <div class="progress-bar-fill" style="width:${progressPercent}%;">
                  </div>
                </div>

                <div style="color:#8e8e93; font-size:10px; display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-weight: 500; letter-spacing: 0.1px;">${infoText}</span>
                  <span style="font-weight:900; color:#ffcc00; background:rgba(255,204,0,0.15); padding:2px 6px; border-radius:6px; border: 1px solid rgba(255,204,0,0.2);">${progressPercent}%</span>
                </div>
              </div>

              <div style="padding:12px 12px 6px 12px; display:none;">`;
        }

        // Today-Unbeaten muss todayWins berücksichtigen (for achievement logic)
        const isUnbeatenToday = d.todayGames > 0 && d.todayWins === d.todayGames;

        const getFixedIndex = (name, arrayLength) => {
          let hash = 0;
          for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
          }
          return Math.abs(hash) % (arrayLength || 1); // Avoid division by zero
        };
        // --- ACHIEVEMENT SAMMLUNG ---
        let currentAchs = [];

        if (isTodayTab) {
            // "Heute" Tab: Alle heutigen Erfolge (Tages-Pool + neu erreichte Karriere-Pool)
            window.dailyFamePool.forEach(it => { if (it.cond(d)) currentAchs.push({ ...it, k: "fame", isNew: false }); });
            window.dailyShamePool.forEach(it => { if (it.cond(d)) currentAchs.push({ ...it, k: "shame", isNew: false }); });

            // Langzeit-Erfolge, die HEUTE neu dazugekommen sind (Vergleich mit dBefore)
            if (dBefore) {
                window.famePool.forEach(it => { if (it.cond(d) && !it.cond(dBefore)) currentAchs.push({ ...it, k: "fame", isNew: true }); });
                window.shamePool.forEach(it => { if (it.cond(d) && !it.cond(dBefore)) currentAchs.push({ ...it, k: "shame", isNew: true }); });
            }
        } else {
            // "Alle" Tab: Aktive Langzeit-Erfolge
            window.famePool.forEach(it => {
                if (it.cond(d)) {
                    const isNew = dBefore ? !it.cond(dBefore) : false;
                    currentAchs.push({ ...it, k: "fame", isNew });
                }
            });
            window.shamePool.forEach(it => {
                if (it.cond(d)) {
                    const isNew = dBefore ? !it.cond(dBefore) : false;
                    currentAchs.push({ ...it, k: "shame", isNew });
                }
            });
        }

        // Tier-System
        const tierBest = {};
        currentAchs.forEach(it => {
          if (!it.g || !it.tier) return;
          const key = it.k + '|' + it.g;
          if (!tierBest[key] || it.tier > tierBest[key].tier) tierBest[key] = it;
        });
        if (Object.keys(tierBest).length) {
          currentAchs = currentAchs.filter(it => !(it.g && it.tier));
          currentAchs.push(...Object.values(tierBest));
        }

        // Calculate achCountTotal and completedTracks
        d.achCountTotal = currentAchs.length;
        const tracks = {}; // group -> maxTierAchieved
        currentAchs.forEach(ach => {
            if (ach.g && ach.tier) {
                if (!tracks[ach.g] || ach.tier > tracks[ach.g]) {
                    tracks[ach.g] = ach.tier;
                }
            }
        });

        let completedTracksCount = 0;
        const allTracks = new Set();
        [...window.famePool, ...window.shamePool].forEach(ach => {
            if (ach.g && ach.tier) {
                allTracks.add(ach.g);
            }
        });

        allTracks.forEach(trackName => {
            const maxTierInTrack = [...window.famePool, ...window.shamePool]
                .filter(ach => ach.g === trackName)
                .reduce((max, ach) => Math.max(max, ach.tier || 0), 0);
            
            if (maxTierInTrack > 0 && tracks[trackName] === maxTierInTrack) {
                completedTracksCount++;
            }
        });
        d.completedTracks = completedTracksCount;



        // Achievement-HTML bauen
        const createAchRow2 = (item, name, aIdx) => {
          const phraseIndex = getFixedIndex(name + item.t, item.d.length);
          const phrase = item.d[phraseIndex] || "";
          const isShame = (item.k === "shame");
          const howIcon  = isShame ? "💀" : "🏆";
          const isMaxTier = item.max === true; // Max tier achievements get special styling
          const newBadge = item.isNew ? `<span style="background:var(--accent); color:#000; font-size:8px; font-weight:900; padding:2px 5px; border-radius:4px; margin-left:8px; vertical-align:middle; animation: badge-pulse 1.5s infinite ease-in-out;">NEU</span>` : "";
          const tracker = d.achTracker ? d.achTracker[item.t] : null;
          const trackerHtml = tracker ? `<div style="font-size:9px; color:#8e8e93; margin-top:4px; font-weight:600;">Sammelrate: <span style="color:#34c759;">📈 ${tracker.earned}</span> | <span style="color:#ff3b30;">📉 ${tracker.lost}</span></div>` : "";

  const borderCol = isShame ? 'var(--error)' : '#34c759';
  const textCol = isShame ? 'rgba(255, 59, 48, 0.85)' : 'rgba(52, 199, 89, 0.85)';

  const borderStyle = isShame ? `border-left: 4px solid ${borderCol};` : 'border-left: none;';
          return `
    <div class="stat-row-item ${isMaxTier && !isShame ? 'achievement-glow-fame' : ''} ${isShame ? 'achievement-glow-shame shame-bg' : ''}" style="${borderStyle}">
      <div class="achievement-icon">${item.i}</div>
              <div style="flex:1;">
        <div class="achievement-title">
                  <span style="${isMaxTier ? 'color:#4FC3F7; text-shadow: 0 0 8px rgba(79,195,247,0.4);' : ''}">${item.t}${isMaxTier ? ' ⭐' : ''} ${newBadge}</span>
                </div>
        <div class="achievement-phrase">"${phrase}"</div>
        <div class="achievement-how" style="color:${textCol};">${howIcon} ${item.h || ""}</div>
                ${trackerHtml}
              </div>
            </div>`;
        };

        let achHtmlContent = currentAchs.length > 0 ? currentAchs.map((it, aIdx) => createAchRow2(it, p, aIdx)).join("") : `<div style="color:#555; font-size:11px; text-align:center; padding:20px; font-style:italic;">Noch ein unbeschriebenes Blatt.</div>`;

        // Daily-Historie im Gesamt-Tab
        if (!isTodayTab) {
          const counts = getDailyCountsForPlayer(p);
          const entries = Object.entries(counts).sort((a,b) => b[1] - a[1]);
          if (entries.length > 0) {
            achHtmlContent += `
              <div style="margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.06);">
                <div style="color:#ffcc00; font-size:11px; font-weight:900; text-transform:uppercase;">Bisherige Tageserfolge</div>
              </div><div style="margin-top:10px;">` + entries.map(([title, cnt], eIdx) => {
                const ach = [...window.dailyFamePool, ...window.dailyShamePool].find(x => x.t === title);
                if (!ach) return "";
                const ic = ach.i || "🏷️";
                const isShame = (ach.k === "shame" || window.dailyShamePool.some(s => s.t === title)); // Check if it's a shame achievement
                const categoryColor = isShame ? 'var(--error)' : '#34c759';
                const howColor = isShame ? "rgba(255, 69, 58, 0.70)" : "rgba(52, 199, 89, 0.70)";
                const howIcon  = isShame ? "💀" : "🏆";
                const phraseIndex = getFixedIndex(p + ach.t, ach.d.length);
                const phrase = ach.d[phraseIndex];

                const borderStyle = isShame ? `border-left: 4px solid ${categoryColor};` : 'border-left: none;';
                return `<div class="stat-row-item ${isShame ? 'achievement-glow-shame shame-bg' : ''}" style="${borderStyle}">
                  <div style="font-size:22px; min-width:35px; text-align:center;">${ic}</div>
                  <div style="flex:1;">
                    <div style="font-size:12px; font-weight:900; color:#fff; display:flex; justify-content:space-between; align-items:center;">
                      <span>${title}</span><span class="stat-value-badge" style="color:#ffcc00; background:rgba(255,204,0,0.15); border-color:rgba(255,204,0,0.2);">${cnt}×</span>
                    </div>
                    <div style="font-size:10px; color:#acacb0; font-style:italic; margin-top:2px;">"${phrase}"</div>
                    <div style="font-size:10px; margin-top:3px; color:${howColor};">${howIcon} ${ach.h || ""}</div>
                  </div>
                </div>`;
              }).join("") + `</div>`;
          }
        }

        playerBoxHtml += achHtmlContent + `</div></div>`;
        achHtml += playerBoxHtml; // Add player's achievement box to the overall HTML
      });

      return achHtml || '<div style="color:#8e8e93; text-align:center; padding:30px;">Noch keine Erfolge.</div>';
    };

    // --- TODAY MATCHES RENDERN ---
    const mCard = byId('today-matches-card');
    const mList = byId('today-match-list');
    if (mCard) mCard.style.display = 'none';

    if (filterToday && mCard && mList && statsToday.length > 0) {
        mCard.style.display = 'block';
        mList.innerHTML = [...statsToday].reverse().map(g => {
            const time = (g.d || "").includes(", ") ? g.d.split(", ")[1] : "";
            return `<div style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 12px; margin-bottom: 8px; border: 0.5px solid rgba(255,255,255,0.05);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:13px; font-weight:800;"><span style="color: ${g.w == 1 ? '#34c759' : '#fff'}">${g.p1}</span> vs <span style="color: ${g.w == 2 ? '#34c759' : '#fff'}">${g.p2}</span></div>
                    <div style="font-size:10px; color:#8e8e93;">${time}</div>
                </div>
                <div style="font-size:10px; color:#8e8e93; margin-top:4px;">${g.t} | Rest: ${g.l} | Anstoß: ${g.a}</div>
            </div>`;
        }).join("");
    }
      
    // --- UI UPDATE ---
    const tEl = byId('achievements-today');
    const aEl = byId('achievements-alltime');
    
    if (tEl) tEl.innerHTML = '';
    if (aEl) aEl.innerHTML = '';

    if (filterToday) {
        if (tEl) { tEl.innerHTML = getAchHtml(dataAll, true, dataBeforeToday); tEl.style.display = "block"; }
        if (aEl) aEl.style.display = "none";
    } else { // Overall or Achievements tab
        if (tEl) tEl.style.display = "none";
        if (aEl) { 
            // Hier nutzen wir += statt =, damit die Level stehen bleiben!
            aEl.innerHTML = getAchHtml(dataAll, false, dataBeforeToday); 
            aEl.style.display = "block"; 
        }
    }

    if (onlyAchievements) return;

    // --- DASHBOARD KACHELN BEFÜLLEN ---
    const res = filterToday ? dataToday : dataAll;
    const currentStats = filterToday ? statsToday : stats;
    const labels = Object.keys(res.pData);

        // --- ZENTRALE FARB-LOGIK FÜR GRAPH & LISTEN ---
        const graphColors = ['#ffcc00', '#4FC3F7', '#34c759', '#ff3b30', '#5856d6'];
        const topEloPlayers = labels
            .filter(p => res.pData[p].games > 0)
            .sort((a, b) => res.pData[b].elo - res.pData[a].elo)
            .slice(0, 5); // Top 5 players for ELO chart
        const getPlayerColor = (name) => {
            const idx = topEloPlayers.indexOf(name);
            return idx > -1 ? graphColors[idx] : '#ffffff';
        };

    if (labels.length > 0) {
        byId('stat-total').innerText = currentStats.length;

        // --- KUGEL-STATISTIK BERECHNEN ---
        const agg = res.aggregates || { totalBallMatches: 0, vollWins: 0, halbWins: 0, playerBallWins: {} };
        const vRate = agg.totalBallMatches > 0 ? Math.round((agg.vollWins / (agg.totalBallMatches || 1)) * 100) : 0;
        const hRate = agg.totalBallMatches > 0 ? Math.round((agg.halbWins / (agg.totalBallMatches || 1)) * 100) : 0;
        const vEl = byId('stat-balls-voll'), hEl = byId('stat-balls-halb');
        if (vEl) vEl.innerText = vRate + "%";
        if (hEl) hEl.innerText = hRate + "%";
        
        // --- TOP KUGEL-SPIELER BERECHNEN ---
        // Use pre-calculated aggregates from worker
        const playerBallWins = agg.playerBallWins || {};

        let topVollPlayers = [], maxVollWins = 0;
        let topHalbPlayers = [], maxHalbWins = 0;

        for (const player in playerBallWins) {
            const vollWins = playerBallWins[player]["Voll"];
            const halbWins = playerBallWins[player]["Halb"];

            if (vollWins > maxVollWins) {
                maxVollWins = vollWins;
                topVollPlayers = [player];
            } else if (vollWins === maxVollWins && vollWins > 0) { topVollPlayers.push(player); }

            if (halbWins > maxHalbWins) {
                maxHalbWins = halbWins;
                topHalbPlayers = [player];
            } else if (halbWins === maxHalbWins && halbWins > 0) { topHalbPlayers.push(player); }
        }

        if (byId('stat-top-voll')) byId('stat-top-voll').innerText = maxVollWins > 0 ? `${topVollPlayers.join(' / ')} (${maxVollWins}x)` : "-";
        if (byId('stat-top-halb')) byId('stat-top-halb').innerText = maxHalbWins > 0 ? `${topHalbPlayers.join(' / ')} (${maxHalbWins}x)` : "-";
        
        // Global-Stats berechnen (unabhängig vom Filter für Vergleichswerte sinnvoll)
        const breakRate = Math.round(((res.breakWins || 0) / (currentStats.length || 1)) * 100);
        const bAdvEl = byId('stat-break-adv');
        if (bAdvEl) bAdvEl.innerText = breakRate + "%";
        
        const blackRate = Math.round(((res.blackWins || 0) / (currentStats.length || 1)) * 100);
        if (byId('stat-black')) byId('stat-black').innerText = blackRate + "%";

        // Pechvogel (Ø Restkugeln bei Niederlage) – bei Gleichstand mehrere anzeigen
        const pechVals = labels.map(p => {
          const losses = (res.pData[p].games - res.pData[p].wins) || 0;
          const avg = res.pData[p].rest / (losses || 1);
          return { p, avg, ga: res.pData[p].games || 0 };
        });

        const maxPech = Math.max(...pechVals.map(x => x.avg));
        if (maxPech > 0) {
          const topPech = pechVals
            .filter(x => x.avg === maxPech)
            .sort((a, b) => (b.ga - a.ga) || a.p.localeCompare(b.p, 'de'));
        
          if (byId('stat-pechvogel')) byId('stat-pechvogel').innerText = topPech.map(x => x.p).join(' / ') + " (" + maxPech.toFixed(1) + ")";
        } else {
          if (byId('stat-pechvogel')) byId('stat-pechvogel').innerText = "-";
        }

        // Killer (Ø Restkugeln beim Gegner pro Sieg) – bei Gleichstand mehrere anzeigen
        const killerVals = labels.map(p => {
          const avg = res.pData[p].killerPoints / ((res.pData[p].wins) || 1);
          return { p, avg, ga: res.pData[p].games || 0 };
        });

        const maxKiller = Math.max(...killerVals.map(x => x.avg));
        if (maxKiller > 0) {
          const topKiller = killerVals
            .filter(x => x.avg === maxKiller)
            .sort((a, b) => (b.ga - a.ga) || a.p.localeCompare(b.p, 'de'));
        
          if (byId('stat-killer')) byId('stat-killer').innerText = topKiller.map(x => x.p).join(' / ') + " (" + maxKiller.toFixed(1) + ")";
        } else {
          if (byId('stat-killer')) byId('stat-killer').innerText = "-";
        }

        // Die Mauer (Zäher Verlierer: Min Ø Restkugeln bei Niederlage)
        // Nur Spieler mit mindestens einer Niederlage berücksichtigen
        const wallCandidates = pechVals.filter(x => (res.pData[x.p].games - res.pData[x.p].wins) > 0);
        if (wallCandidates.length > 0) {
          const minWall = Math.min(...wallCandidates.map(x => x.avg));
          const topWall = wallCandidates
            .filter(x => x.avg === minWall)
            .sort((a, b) => (b.ga - a.ga) || a.p.localeCompare(b.p, 'de'));
        
          if (byId('stat-mauer')) byId('stat-mauer').innerText = topWall.map(x => x.p).join(' / ') + " (" + minWall.toFixed(1) + ")";
        } else {
          if (byId('stat-mauer')) byId('stat-mauer').innerText = "-";
        }

        // Nervenstärke (Meiste Clutch Wins) – bei Gleichstand mehrere anzeigen
        const maxClutch = Math.max(...labels.map(p => res.pData[p].clutchWins || 0));

        if (maxClutch > 0) {
          const topClutch = labels
            .filter(p => (res.pData[p].clutchWins || 0) === maxClutch)
            // Sortierung: zuerst mehr Spiele, dann alphabetisch (stabil/deterministisch)
            .sort((a, b) => (res.pData[b].games || 0) - (res.pData[a].games || 0) || a.localeCompare(b, 'de'));
        
          if (byId('stat-clutch')) byId('stat-clutch').innerText = topClutch.join(' / ') + ` (${maxClutch}x)`;
        } else {
          if (byId('stat-clutch')) byId('stat-clutch').innerText = "-";
        }


        // --- BESTES TEAM (nur 2:2) ---
        const teamWins = {};

        const normTeamKey = (teamStr) => {
          const parts = String(teamStr || "")
            .split(" & ")
            .map(s => s.trim())
            .filter(Boolean)
            .sort(); // A & B == B & A
          return parts.length ? parts.join(" & ") : "";
        };

        // Render Partner-Power
        const teamResults = agg.teamResults || {};
        const duoRanking = Object.entries(teamResults)
            .map(([name, s]) => ({ name, wr: Math.round((s.w / s.g) * 100), games: s.g, wins: s.w }))
            .filter(t => t.games >= 3)
            .sort((a, b) => b.wr - a.wr || b.games - a.games)
            .slice(0, 3);

        const duoEl = byId('stat-duo-ranking');
        if (duoEl) {
              duoEl.innerHTML = duoRanking.length > 0 ? duoRanking.map((t, idx) => { // Added idx for animation-delay
                const pNames = t.name.split(' & ');
                return `
                <div class="card-modern" style="display:flex; justify-content:space-between; align-items:center; font-size:11px; margin-bottom:10px; padding: 12px; border-radius:18px; animation: ach-card-enter 0.4s ease-out forwards; opacity: 0; animation-delay: ${1.2 + idx * 0.05}s;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div style="display:flex; flex-direction:column; align-items:center; min-width:18px; margin-right:4px;">
                            <span style="color:var(--accent); font-weight:900; font-size:14px;">${idx+1}</span>
                        </div>
                        <div style="display:flex; align-items:center; position:relative; width:45px; height:30px;">
                            ${pNames.map((p, pIdx) => `<img src="${window.getAvatarUrl(p)}" style="position:absolute; left:${pIdx * 15}px; width:28px; height:30px; border-radius:8px; object-fit:cover; border:1px solid rgba(255,255,255,0.2); z-index:${2-pIdx}; transform: rotate(${pIdx === 0 ? '-5deg' : '5deg'}); box-shadow: 4px 0 10px rgba(0,0,0,0.3);">`).join('')}
                        </div>
                        <div style="margin-left:12px;">
                            <div style="color:#fff; font-weight:900; font-size:13px; letter-spacing:0.3px;">${t.name}</div>
                            <div style="font-size:8px; color:#8e8e93; font-weight:700; text-transform:uppercase; margin-top:2px;">Elite Duo Synergy</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div class="stat-value-badge green">${t.wr}%</div>
                        <div style="font-size:8px; color:#8e8e93; font-weight:800; margin-top:4px;">${t.wins}W / ${t.games}G</div>
                    </div>
                </div>`;
            }).join('') : '<div style="font-size:10px; color:#8e8e93; text-align:center; padding:5px;">Mindestens 3 Spiele als Team nötig</div>';
        }

        // Render Kugel-Spezis
        let topVollarbeiter = { n: "-", wr: 0 };
        let topHalbeExperte = { n: "-", wr: 0 };

        const ballSpez = agg.ballSpez || {};
        Object.entries(ballSpez).forEach(([name, data]) => {
            if (data.Voll.g >= 3) { // Schwelle auf 3 Spiele gesetzt
                const wr = (data.Voll.w / data.Voll.g) * 100;
                if (wr > topVollarbeiter.wr) topVollarbeiter = { n: name, wr };
            }
            if (data.Halb.g >= 3) { // Schwelle auf 3 Spiele gesetzt
                const wr = (data.Halb.w / data.Halb.g) * 100;
                if (wr > topHalbeExperte.wr) topHalbeExperte = { n: name, wr };
            }
        });

        const spezEl = byId('stat-ball-spez');
        if (spezEl) {
              spezEl.innerHTML = `<div style="animation: ach-card-enter 0.4s ease-out forwards; opacity: 0; animation-delay: 1.25s;">
                <div style="display:flex; justify-content:space-around; align-items:center; padding: 10px 0; ">
                    <div style="text-align:center; display:flex; flex-direction:column; align-items:center; gap:4px;">
                        <div style="font-size:8px; color:#8e8e93; font-weight:900; letter-spacing:1px; text-transform:uppercase;">Voll-Profi</div>
                        <img src="${window.getAvatarUrl(topVollarbeiter.n)}" style="width:36px; height:36px; border-radius:12px; border:3px solid #ffcc00; box-shadow: 0 0 15px rgba(255,204,0,0.3);">
                        <div style="font-size:14px; font-weight:900; color:#fff; text-shadow: 0 0 8px rgba(255,255,255,0.2);">${topVollarbeiter.n}</div>
                        <div style="font-size:11px; color:#34c759; font-weight:900; text-shadow: 0 0 8px rgba(52,199,89,0.3);">${topVollarbeiter.wr > 0 ? Math.round(topVollarbeiter.wr) + '%' : '-'}</div>
                    </div>
                    <div style="height:40px; width:1px; background:rgba(255,255,255,0.1);"></div>
                    <div style="text-align:center; display:flex; flex-direction:column; align-items:center; gap:4px;">
                        <div style="font-size:8px; color:#8e8e93; font-weight:900; letter-spacing:1px; text-transform:uppercase;">Halbe-As</div>
                        <img src="${window.getAvatarUrl(topHalbeExperte.n)}" style="width:36px; height:36px; border-radius:12px; border:3px solid #4FC3F7; box-shadow: 0 0 15px rgba(79,195,247,0.3);">
                        <div style="font-size:14px; font-weight:900; color:#fff; text-shadow: 0 0 8px rgba(255,255,255,0.2);">${topHalbeExperte.n}</div>
                        <div style="font-size:11px; color:#34c759; font-weight:900; text-shadow: 0 0 8px rgba(52,199,89,0.3);">${topHalbeExperte.wr > 0 ? Math.round(topHalbeExperte.wr) + '%' : '-'}</div>
                    </div>
                </div>
              </div>`;
        }

        // --- ANGSTGEGNER LOGIK (Wer dominiert wen am meisten?) ---
        // Use pre-calculated aggregates from worker
        const matchups = agg.matchups || {};
        const meetings = agg.meetings || {};
        let maxWins = 0; for (const pair in matchups) { if (matchups[pair] > maxWins) maxWins = matchups[pair]; }
        let topMatchups = Object.keys(matchups).filter(p => matchups[p] === maxWins).sort((a, b) => {
            const pa = a.split(' -> '); const pb = b.split(' -> ');
            const ka = (pa.length === 2) ? [pa[0], pa[1]].sort().join('|') : '';
            const kb = (pb.length === 2) ? [pb[0], pb[1]].sort().join('|') : '';
            const ma = ka ? (meetings[ka] || 0) : 0; const mb = kb ? (meetings[kb] || 0) : 0;
            return (mb - ma) || a.localeCompare(b, 'de');
        });
        if (maxWins > 0) {
          if (byId('stat-angst')) byId('stat-angst').innerText = topMatchups.join(' / ') + ` (${maxWins} Siege)`;
        } else {
          if (byId('stat-angst')) byId('stat-angst').innerText = "-";
        }

        // --- DIREKTE DUELLE (Dominanz) ---
        // Use pre-calculated aggregates from worker
        const matchupStats = agg.matchupStats || {};
        const dominantMatchups = Object.values(matchupStats)
            .map(m => {
                const wr1 = Math.round((m.p1_wins / m.games) * 100);
                const wr2 = Math.round((m.p2_wins / m.games) * 100);
                const dominance = Math.abs(wr1 - wr2); // Absolute Differenz als Dominanz-Score
                return { ...m, wr1, wr2, dominance };
            })
            .sort((a, b) => b.dominance - a.dominance || b.games - a.games); // Nach Dominanz, dann Spielen sortieren

        const h2hEl = byId('stat-head-to-head');
        if (h2hEl) {
            h2hEl.innerHTML = dominantMatchups.length > 0 ? dominantMatchups.map((m, idx) => {
                const c1 = m.wr1 >= m.wr2 ? 'green' : 'blue';
                const c2 = m.wr2 > m.wr1 ? 'green' : 'blue';
                return `
                <div class="card-modern" style="display:flex; flex-direction:column; gap:10px; margin-bottom:12px; padding: 12px; border-radius:20px; animation: ach-card-enter 0.4s ease-out forwards; opacity: 0; animation-delay: ${1.35 + idx * 0.05}s;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <!-- Linker Spieler -->
                        <div style="display:flex; align-items:center; gap:10px; flex:1; overflow:hidden;">
                            <img src="${window.getAvatarUrl(m.p1)}" style="width:36px; height:36px; border-radius:10px; border:1px solid rgba(255,255,255,0.1); object-fit:cover; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                            <div style="overflow:hidden;">
                                <div style="font-size:11px; font-weight:900; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.p1}</div>
                                <div class="stat-value-badge ${c1}" style="margin-top:3px; display:inline-block;">${m.wr1}%</div>
                            </div>
                        </div>
                        
                        <!-- Trenner -->
                        <div style="text-align:center; min-width:45px; padding: 0 5px;">
                            <div style="font-size:10px; font-weight:900; color:var(--accent); opacity:0.7; letter-spacing:1px;">VS</div>
                            <div style="font-size:8px; color:#8e8e93; font-weight:800; margin-top:2px;">${m.games}G</div>
                        </div>

                        <!-- Rechter Spieler -->
                        <div style="display:flex; align-items:center; gap:10px; flex:1; justify-content:flex-end; text-align:right; overflow:hidden;">
                            <div style="overflow:hidden;">
                                <div style="font-size:11px; font-weight:900; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.p2}</div>
                                <div class="stat-value-badge ${c2}" style="margin-top:3px; display:inline-block;">${m.wr2}%</div>
                            </div>
                            <img src="${window.getAvatarUrl(m.p2)}" style="width:36px; height:36px; border-radius:10px; border:1px solid rgba(255,255,255,0.1); object-fit:cover; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                        </div>
                    </div>
                    <!-- Visueller Kräftevergleich -->
                    <div style="height:3px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden; display:flex; box-shadow: inset 0 1px 2px rgba(0,0,0,0.5);">
                        <div style="width:${m.wr1}%; background:${m.wr1>=m.wr2?'#34c759':'#4FC3F7'};"></div>
                        <div style="width:${m.wr2}%; background:${m.wr2>m.wr1?'#34c759':'#4FC3F7'};"></div>
                    </div>
                </div>`;

            }).join('') : '<div style="font-size:10px; color:#8e8e93; text-align:center; padding:5px;">Noch keine 1:1-Duelle vorhanden</div>';
        }

        // Längste Serie – bei Gleichstand mehrere anzeigen
        const maxStreak = Math.max(...labels.map(p => res.pData[p].maxStreak || 0)); // Max streak is calculated in worker

        if (maxStreak > 0) {
          const topStreak = labels
            .filter(p => (res.pData[p].maxStreak || 0) === maxStreak)
            .sort((a, b) => (res.pData[b].games || 0) - (res.pData[a].games || 0) || a.localeCompare(b, 'de'));
        
          if (byId('stat-streak')) byId('stat-streak').innerText = topStreak.join(' / ') + ` (${maxStreak})`;
        } else {
          if (byId('stat-streak')) byId('stat-streak').innerText = "-";
        }

        // Chart.js Diagramm
        const canvas = byId('winChart');
        if (canvas) {
        const canvasEl = document.getElementById('winChart');
        if (canvasEl) canvasEl.style.display = "block";
        const ctx = canvas.getContext('2d');

        // Chart-Instanz am Canvas speichern (statt global), damit keine falsche Instanz zerstört wird
        if (canvas.__myWinChart) canvas.__myWinChart.destroy();
        canvas.__myWinChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels.map(p => p + " (" + res.pData[p].games + ")"),
            datasets: [{
              data: labels.map(p => Math.round((res.pData[p].wins / res.pData[p].games) * 100)),
              backgroundColor: '#34c759',
              borderRadius: 8
            }]
          },
          plugins: [{
            id: 'barAvatars',
            afterDatasetsDraw: (chart) => {
              const { ctx } = chart;
              chart.getDatasetMeta(0).data.forEach((bar, index) => {
                const playerName = labels[index];
                if (!playerName) return;
                
                const url = window.getAvatarUrl(playerName);
                if (!window._avatarCache) window._avatarCache = {};
                
                if (!window._avatarCache[url]) {
                  const img = new Image();
                  img.src = url;
                  img.onload = () => chart.draw();
                  img.onerror = () => { img.isError = true; chart.draw(); };
                  window._avatarCache[url] = img;
                }
                
                const img = window._avatarCache[url];
                const size = 30;
                const posY = bar.y - size - 6;

                ctx.save();
                ctx.beginPath();
                ctx.roundRect(bar.x - size/2, posY, size, size, 8);
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                ctx.fill();
                ctx.clip();

                if (img.complete && !img.isError && img.naturalWidth !== 0) {
                  ctx.drawImage(img, bar.x - size/2, posY, size, size);
                } else {
                  ctx.fillStyle = 'rgba(255,255,255,0.3)';
                  ctx.font = (size * 0.6) + 'px Arial';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText('👤', bar.x, posY + size/2 + 1);
                }
                ctx.restore();
                ctx.beginPath();
                ctx.roundRect(bar.x - size/2, posY, size, size, 8);
                ctx.strokeStyle = 'rgba(255, 204, 0, 0.4)';
                ctx.lineWidth = 1;
                ctx.stroke();
              });
            }
          }],
          options: {
            layout: { padding: { top: 40 } },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(context) { return context.raw + "% Siegquote"; }
                }
              }
            },
            scales: {
              y: { min: 0, max: 100, ticks: { color: '#8e8e93' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              x: { ticks: { color: '#fff', font: { size: 10 } } }
            }
          }
        });
        }

        // --- ELO HISTORY CHART (LINE) ---
        const eloHistoryContainer = document.getElementById('eloHistoryContainer');
        const eloCanvas = document.getElementById('eloHistoryChart');
        const eloTrendCard = document.getElementById('eloTrendCard');

        // Karten im Heute-Tab IMMER ausblenden
        if (filterToday) {
            if (eloTrendCard) eloTrendCard.style.display = 'none';
        } else {
            if (eloTrendCard) eloTrendCard.style.display = 'block';

            // Diagramm nur zeichnen, wenn wir nicht im Heute-Tab sind
            if (eloCanvas && eloHistoryContainer) {
                const eloCtx = eloCanvas.getContext('2d');
                if (eloCanvas.__myEloChart) eloCanvas.__myEloChart.destroy();

                if (topEloPlayers.length > 0) {
                    eloHistoryContainer.style.display = 'block';
                    const WINDOW_SIZE = 10; // Fokus auf die Form (letzte 10 Spiele)
                    const maxH = Math.max(...topEloPlayers.map(p => res.pData[p].eloHistory.length));
                    const displayCount = Math.min(WINDOW_SIZE, maxH);
                    
                    const chartLabels = Array.from({length: displayCount}, (_, i) => i + 1);

                    const datasets = topEloPlayers.map((p, i) => {
                        const h = res.pData[p].eloHistory || [];
                        const realDataCount = Math.min(h.length, displayCount);
                        const d = h.slice(-displayCount); 
                        
                        // Falls ein Spieler weniger Spiele hat, wird die Linie bis zum rechten Rand
                        // mit seinem aktuellsten Wert verlängert.
                        const lastVal = d.length > 0 ? d[d.length - 1] : 1000;
                        while (d.length < displayCount) d.push(lastVal);

                        return {
                            label: p,
                            data: d,
                            borderColor: graphColors[i % graphColors.length],
                            backgroundColor: graphColors[i % graphColors.length] + '22',
                            tension: 0.3, 
                            pointRadius: d.map((_, idx) => idx < realDataCount ? 2 : 0),
                            pointHoverRadius: d.map((_, idx) => idx < realDataCount ? 4 : 0),
                            borderWidth: 2,
                            fill: false
                        };
                    });

                    eloCanvas.__myEloChart = new Chart(eloCtx, {
                        type: 'line',
                        data: { labels: chartLabels, datasets },
                        options: {
                            responsive: true, maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                                y: { ticks: { color: '#8e8e93', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                                x: { ticks: { color: '#444', font: { size: 8 } }, grid: { display: false } }
                            }
                        }
                    });
                } else {
                    eloHistoryContainer.style.display = 'none';
                }
            }
        }

// Alias für Kompatibilität mit index.html
window.processAllStatsChronologically = function(matches, players) {
    // Nutzt die vorhandene computeEloRatings Logik für ELO und processData für Stats
    const elo = window.computeEloRatings(matches);
    const base = window.processData(matches);
    return { pData: base.pData, matchDeltas: {}, aggregates: base.aggregates, blackWins: base.blackWins, breakWins: base.breakWins };
};

        // --- ELO Rangliste + Erklärung (nur Gesamt) ---
        function renderEloRanking(pData, show) {
          const el = byId('eloRanking') || document.getElementById('eloRanking');
          if (!el) return;
          if (!show) { el.innerHTML = ''; return; }

          const rows = Object.keys(pData || {}).map(name => {
            const d = pData[name] || {};
            return { 
                name, 
                elo: (typeof d.elo === 'number') ? d.elo : 1000, 
                games: (typeof d.eloGames === 'number') ? d.eloGames : 0,
                streak: d.currentStreak || 0,
                loseStreak: d.loseStreak || 0
            };
          }).filter(r => r.games > 0);

          // nur Spieler aus spieler.json anzeigen (und nur wenn Spiele vorhanden sind)
          if (configuredPlayers && configuredPlayers.size > 0) {
            for (let i = rows.length - 1; i >= 0; i--) {
              if (!configuredPlayers.has(String(rows[i].name || '').trim())) rows.splice(i, 1);
            }
          }

          if (rows.length === 0) { el.innerHTML = ''; return; }
          rows.sort((a, b) => (b.elo - a.elo) || a.name.localeCompare(b.name, 'de'));

          const medal = (i) => (i === 0 ? '👑' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : '')));

          let html = `
            <div style="margin-top:2px; animation: ach-card-enter 0.4s ease-out forwards; opacity: 0; animation-delay: 0.4s;">
              <div style="color:#ffcc00; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:1px;">ELO-Rangliste</div>
              <div style="margin-top:6px; font-size:10px; line-height:1.4; color:#8e8e93;">Start bei <b style=\"color:#fff;\">1000</b>. Sieg gegen starke Gegner bringt <b style=\"color:#34c759;\">mehr</b> Punkte, Niederlagen kosten Punkte. Neue Spieler bewegen sich anfangs <b style=\"color:#4FC3F7;\">schneller</b>.</div>
              <div style="height:2px; width:24px; background:#ffcc00; margin-top:6px; border-radius:2px;"></div>
            </div>
            <div style="margin-top:10px;">
          `;

          rows.forEach((r, i) => {
            const badge = medal(i);
            const isFirst = i === 0;
            const streakClass = r.streak >= 3 ? 'streak-fire' : (r.loseStreak >= 3 ? 'streak-frost' : '');
            const streakEmoji = (r.streak >= 3) ? ' <span style="display:inline-block; color:var(--accent); text-shadow: 0 0 8px rgba(255,204,0,0.4); animation: streak-pulse 1.5s infinite ease-in-out;">🔥</span>' : ''; // Pulsierendes Flammen-Emoji
            html += `
              <div onclick="window.openPlayerProfile('${r.name}')" class="${isFirst ? 'rank-1-card' : ''}" style="display:flex; align-items:center; gap:12px; margin-bottom:10px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 20px; border: 1px solid ${isFirst ? '#ffcc00' : 'rgba(255,255,255,0.08)'}; cursor:pointer; box-shadow: ${isFirst ? '0 0 20px rgba(255,204,0,0.2)' : '0 4px 12px rgba(0,0,0,0.2)'}; ${isFirst ? '' : 'animation: ach-card-enter 0.4s ease-out forwards; opacity: 0;'} animation-delay: ${0.5 + i * 0.05}s;">
                <div style="min-width:28px; text-align:center; font-size:16px;">${badge || (i+1 + '.')}</div>
                <div class="avatar-frame ${streakClass}">
                  <img src="${window.getAvatarUrl(r.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex'" style="width:32px; height:32px; border-radius:10px; object-fit:cover; border:2px solid rgba(255,255,255,0.15);">
                </div>
                <div style="display:none; width:30px; height:30px; border-radius:10px; background:rgba(255,255,255,0.1); align-items:center; justify-content:center; font-size:16px; border:1px solid rgba(255,255,255,0.1);">👤</div>
                <div style="flex:1;">
                  <div style="font-size:14px; font-weight:900; color:${getPlayerColor(r.name)}; text-shadow: 0 0 8px rgba(255,204,0,0.2);">${r.name} ${streakEmoji}</div>
                  <div style="font-size:10px; color:#acacb0; margin-top:2px;">bewertete Spiele: ${r.games}</div>
                </div>
                <div style="text-align:right;">
                  <div id="rank-elo-${i}" style="font-size:16px; font-weight:900; color:#34c759; text-shadow: 0 0 10px rgba(52,199,89,0.3);">0</div>
                  <div style="font-size:9px; color:#8e8e93; text-transform:uppercase; font-weight:800; margin-top:2px;">ELO</div>
                </div>
              </div>
            `;
          });

          html += `</div>`;
          el.innerHTML = html;
          // Synchronisiere die Zahlen-Animation mit dem Einblenden der Karten (matching animation-delay)
          rows.forEach((r, i) => {
              setTimeout(() => window.animateNumber(`rank-elo-${i}`, r.elo), 500 + (i * 50));
          });
        }

        // --- 🔥 Formanzeige / Trending Player (letzte 10 Spiele) ---
        function renderTrendingPlayers(allStats, show) {
          const el = byId('trendPlayers') || document.getElementById('trendPlayers');
          const headEl = byId('trendHeader') || document.getElementById('trendHeader');
          if (!el) return;
          if (!show) { el.innerHTML = ''; if (headEl) headEl.innerHTML = ''; return; }

          const N = 10;

          // sortiere Matches stabil nach Datum/Zeit
          const parseSortTime = (gd) => {
            const s = String(gd || "");
            const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[^\d]+(\d{1,2}):(\d{2}))?/);
            if (!m) return 0;
            const dd = parseInt(m[1], 10);
            const mm = parseInt(m[2], 10) - 1;
            const yy = parseInt(m[3], 10);
            const hh = m[4] ? parseInt(m[4], 10) : 0;
            const mi = m[5] ? parseInt(m[5], 10) : 0;
            return new Date(yy, mm, dd, hh, mi, 0, 0).getTime();
          };

          const ordered = (allStats || []).map((g, i) => ({ g, i }))
            .sort((a, b) => {
              const ta = parseSortTime(a.g && a.g.d);
              const tb = parseSortTime(b.g && b.g.d);
              if (ta !== tb) return ta - tb;
              return a.i - b.i;
            })
            .map(x => x.g);

          if (!ordered || ordered.length === 0) { el.innerHTML = ''; return; }

          const windowStartIndex = Math.max(0, ordered.length - N);

          const rec = {};
          const init = (p) => {
            if (!rec[p]) rec[p] = { g:0, w:0, l:0, streak:0, loseStreak:0, lastWasWin:null, eloBefore:1000, eloAfter:1000, eloDelta:0 };
          };

          // ELO Simulation (gleiches Modell wie oben)
          const base = 1000;
          const ratings = {};
          const games = {};
          const getR = (p) => (typeof ratings[p] === 'number') ? ratings[p] : base;
          const getG = (p) => (typeof games[p] === 'number') ? games[p] : 0;
          const setR = (p, v) => { ratings[p] = v; };
          const incG = (p) => { games[p] = getG(p) + 1; };
          const getK = (p) => (getG(p) < 20 ? 40 : 20);

          ordered.forEach((g, idx) => {
            if (!g) return;
            const isTeam = g.m === "2:2";
            const t1 = isTeam ? (g.p1 ? String(g.p1).split(" & ") : []) : [g.p1];
            const t2 = isTeam ? (g.p2 ? String(g.p2).split(" & ") : []) : [g.p2];
            const team1 = t1.map(s => String(s || '').trim()).filter(Boolean);
            const team2 = t2.map(s => String(s || '').trim()).filter(Boolean);
            if (!team1.length || !team2.length) return;

            if (idx === windowStartIndex) {
              [...team1, ...team2].forEach(p => { init(p); rec[p].eloBefore = Math.round(getR(p)); });
            }

            const avg = (arr) => arr.reduce((sum, p) => sum + getR(p), 0) / arr.length;
            const r1 = avg(team1);
            const r2 = avg(team2);
            const e1 = 1 / (1 + Math.pow(10, (r2 - r1) / 400));
            const s1 = (g.w == 1) ? 1 : 0;
            const dScore = (s1 - e1);

            team1.forEach(p => { setR(p, getR(p) + getK(p) * dScore); incG(p); });
            team2.forEach(p => { setR(p, getR(p) - getK(p) * dScore); incG(p); });

            if (idx >= windowStartIndex) {
              const winners = (g.w == 1) ? team1 : team2;
              const losers  = (g.w == 1) ? team2 : team1;

              winners.forEach(p => {
                init(p);
                rec[p].g++; rec[p].w++;
                rec[p].streak = (rec[p].lastWasWin === true) ? (rec[p].streak + 1) : 1;
                rec[p].loseStreak = 0;
                rec[p].lastWasWin = true;
              });
              losers.forEach(p => {
                init(p);
                rec[p].g++; rec[p].l++;
                rec[p].loseStreak = (rec[p].lastWasWin === false) ? (rec[p].loseStreak + 1) : 1;
                rec[p].streak = 0;
                rec[p].lastWasWin = false;
              });

              [...team1, ...team2].forEach(p => { init(p); rec[p].eloAfter = Math.round(getR(p)); });
            }
          });

          Object.keys(rec).forEach(p => { rec[p].eloDelta = (rec[p].eloAfter || 1000) - (rec[p].eloBefore || 1000); });

          const rows = Object.keys(rec)
            .map(name => {
              const r = rec[name];
              const wr = r.g ? Math.round((r.w / r.g) * 100) : 0;
              return { name, g: r.g, w: r.w, l: r.l, wr, streak: r.streak, loseStreak: r.loseStreak, eloDelta: r.eloDelta };
            })
            .filter(r => r.g >= 1)
            .sort((a, b) => (b.eloDelta - a.eloDelta) || (b.wr - a.wr) || (b.g - a.g) || a.name.localeCompare(b.name, 'de'));

            // Top = Anzahl Spieler mit mindestens 1 Spiel in den letzten 10 (und nur aus spieler.json)
            if (configuredPlayers) {
              for (let i = rows.length - 1; i >= 0; i--) {
                if (!configuredPlayers.has(String(rows[i].name || '').trim())) rows.splice(i, 1);
              }
            }

          if (!rows.length) { el.innerHTML = ''; return; }

          const deltaStyle = (d) => d > 0 ? 'color:#34c759;' : (d < 0 ? 'color:rgba(255,69,58,0.85);' : 'color:#8e8e93;');
          const deltaSign = (d) => d > 0 ? `+${d}` : `${d}`;

          if (headEl) {
            headEl.innerHTML = `
            <div style="margin-top:14px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.06);">
              <div style="color:#ffcc00; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:1px;">🔥 Formanzeige</div>
              <div style="margin-top:6px; font-size:10px; line-height:1.4; color:#8e8e93;">Trending aus den letzten ${N} Spielen: ELO-Änderung + aktuelle Siegserie.</div>
              <div style="height:2px; width:24px; background:#ffcc00; margin-top:6px; border-radius:2px;"></div>
            </div>`;
          }

          let listHtml = `<div style="margin-top:10px;">`;

          rows.forEach((r, i) => {
            const isTopForm = i === 0;
            const streakClass = r.streak >= 3 ? 'streak-fire' : (r.loseStreak >= 3 ? 'streak-frost' : '');
            listHtml += `
              <div onclick="window.openPlayerProfile('${r.name}')" style="display:flex; align-items:center; gap:12px; margin-bottom:10px; background: ${isTopForm ? 'linear-gradient(135deg, rgba(52, 199, 89, 0.15) 0%, rgba(255, 255, 255, 0.02) 100%)' : 'rgba(255,255,255,0.03)'}; padding: 12px; border-radius: 16px; border: 1px solid ${isTopForm ? '#34c759' : 'rgba(255,255,255,0.08)'}; box-shadow: ${isTopForm ? '0 0 20px rgba(52,199,89,0.2)' : '0 4px 12px rgba(0,0,0,0.2)'}; cursor:pointer; animation: ach-card-enter 0.4s ease-out forwards; opacity: 0; animation-delay: ${0.5 + i * 0.05}s;">
                <div style="min-width:28px; text-align:center; font-size:16px;">${i === 0 ? '🔥' : (i === 1 ? '✨' : (i === 2 ? '📈' : (i+1 + '.')))}</div>
                <div class="avatar-frame ${streakClass}">
                  <img src="${window.getAvatarUrl(r.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex'" style="width:32px; height:32px; border-radius:10px; object-fit:cover; border:2px solid rgba(255,255,255,0.15);">
                </div>
                <div style="display:none; width:30px; height:30px; border-radius:10px; background:rgba(255,255,255,0.1); align-items:center; justify-content:center; font-size:16px; border:1px solid rgba(255,255,255,0.1);">👤</div>
                <div style="flex:1;">
                  <div style="font-size:14px; font-weight:900; color:${getPlayerColor(r.name)}; text-shadow: 0 0 8px rgba(255,204,0,0.2);">${r.name}</div>
                  <div style="font-size:10px; color:#acacb0; margin-top:2px;">letzte ${r.g}: ${r.w}-${r.l} (${r.wr}%)${r.streak > 1 ? ` • Serie: ${r.streak}` : ''}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:16px; font-weight:900; ${deltaStyle(r.eloDelta)} text-shadow: 0 0 10px ${r.eloDelta > 0 ? 'rgba(52,199,89,0.3)' : (r.eloDelta < 0 ? 'rgba(255,59,48,0.3)' : 'rgba(255,255,255,0.1)')};">${deltaSign(r.eloDelta)}</div>
                  <div style="font-size:9px; color:#8e8e93; text-transform:uppercase; font-weight:800; margin-top:2px;">ELO Δ</div>
                </div>
              </div>
            `;
          });

          listHtml += `</div>`;
          el.innerHTML = listHtml;
        }

        const eloCard = byId('eloTrendCard') || document.getElementById('eloTrendCard');
        if (eloCard) eloCard.style.display = (!filterToday) ? 'block' : 'none';

        renderEloRanking(res.pData, !filterToday);
        renderTrendingPlayers(stats, !filterToday);
    } else {
        // --- Keine Daten: UI sauber zurücksetzen ---
        const setText = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.innerText = txt;
        };

        // Kacheln
        setText('stat-total', '0');
        setText('stat-balls-voll', '0%');
        setText('stat-balls-halb', '0%');
        setText('stat-top-voll', '-');
        setText('stat-top-halb', '-');
        setText('stat-break-adv', '0%');
        setText('stat-black', '0%');
        setText('stat-pechvogel', '-');
        setText('stat-killer', '-');
        setText('stat-clutch', '-');
        setText('stat-angst', '-');
        setText('stat-streak', '-');
        setText('stat-mauer', '-');
        setText('stat-head-to-head', '-');
        setText('stat-duo-ranking', '-');
        setText('stat-ball-spez', '-');

        const eloEl = document.getElementById('eloRanking');
        if (eloEl) eloEl.innerHTML = '';
        const trendEl = document.getElementById('trendPlayers');
        if (trendEl) trendEl.innerHTML = '';
        
        const eloTrendCard = document.getElementById('eloTrendCard');
        if (eloTrendCard) eloTrendCard.style.display = 'none';
        const eloHistoryContainer = document.getElementById('eloHistoryContainer');
        if (eloHistoryContainer) eloHistoryContainer.style.display = 'none';

        // Chart-Reset Fix
        const oldWinChart = document.getElementById('winChart');
        if (oldWinChart && oldWinChart.__myWinChart) {
            oldWinChart.__myWinChart.destroy();
        }

        const eloCanvas = document.getElementById('eloHistoryChart');
        if (eloCanvas && eloCanvas.__myEloChart) {
            eloCanvas.__myEloChart.destroy();
        }

        const canvas = document.getElementById('winChart');
        if (canvas) {
          // Canvas ausblenden, damit garantiert nichts "Altes" sichtbar bleibt
          canvas.style.display = "none";
        
          // Hard reset des Canvas-Backbuffers (zuverlässiger als clearRect allein)
          const w = canvas.width, h = canvas.height;
          canvas.width = 1; canvas.height = 1;
          canvas.width = w; canvas.height = h;
        }
    }
};

// Alias für Kompatibilität mit index.html - Global definiert, damit Speichern immer möglich ist
window.processAllStatsChronologically = function(matches, players, todayStr) {
    // Nutzt die vorhandene computeEloRatings Logik für ELO und processData für Stats
    const elo = window.computeEloRatings(matches);
    const base = window.processData(matches, todayStr);
    return { pData: base.pData, matchDeltas: {}, aggregates: base.aggregates, blackWins: base.blackWins, breakWins: base.breakWins };
};

// Hilfsfunktion für lokale Berechnungen (Fallback, wenn Worker blockiert ist)
window.calculateStatsLocally = function(allMatches, players) {
    const pData = {};
    const eloRatings = {};
    const eloGamesCount = {};
    let blackWins = 0;
    let breakWinsCount = 0;
    const aggregates = { totalBallMatches: 0, vollWins: 0, halbWins: 0, playerBallWins: {}, teamResults: {}, ballSpez: {}, matchupStats: {}, matchups: {}, meetings: {} };
    const matchDeltas = {};

    const initP = (n) => {
        if (!pData[n]) pData[n] = { 
            wins: 0, games: 0, rest: 0, maxStreak: 0, currentStreak: 0, lastWin: false, 
            clutchWins: 0, killerPoints: 0, blackWinsCount: 0, breakWins: 0, loseStreak: 0, 
            maxLoseStreak: 0, eloHistory: [], maxElo: 1000, maxWinRate: 0, last30Games: [], 
            last20Losses: [], last20WinsKiller: [], gameResultsHistory: [],
            headToHead: {}, winsVsTopElo: 0, vsNemesisWins: 0, vsWorstOpponentLosses: 0,
            closeWins: 0, closeLosses: 0, dramaWins: 0
        };
    };

    const sorted = [...allMatches].sort((a,b) => {
        const parse = (s) => {
            const m = String(s || "").match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
            return m ? new Date(parseInt(m[3]), parseInt(m[2])-1, parseInt(m[1])).getTime() : 0;
        };
        return parse(a.d) - parse(b.d);
    });

    sorted.forEach((g, originalIndex) => {
        const isTeam = g.m === "2:2";
        const p1A = (isTeam ? (g.p1 ? g.p1.split(" & ") : []) : [g.p1]).map(s => String(s || '').trim()).filter(Boolean);
        const p2A = (isTeam ? (g.p2 ? g.p2.split(" & ") : []) : [g.p2]).map(s => String(s || '').trim()).filter(Boolean);
        const winnerString = String((g.w == 1) ? g.p1 : g.p2 || '').trim();
        const breakerString = String(g.a || '').trim();
        const playersInMatch = [...p1A, ...p2A];
        playersInMatch.forEach(initP);

        const winners = (g.w == 1) ? p1A : p2A;
        const losers = (g.w == 1) ? p2A : p1A;
        const rest = parseInt(g.l || 0);

        if (g.t?.includes("Schwarz")) blackWins++;
        if(breakerString === winnerString) {
            breakWinsCount++;
        }

        // H2H Update for fallback
        winners.forEach(w => {
            losers.forEach(l => {
                if (!pData[w].headToHead[l]) pData[w].headToHead[l] = { w: 0, l: 0 };
                if (!pData[l].headToHead[w]) pData[l].headToHead[w] = { w: 0, l: 0 };
                pData[w].headToHead[l].w++;
                pData[l].headToHead[w].l++;
            });
        });

        // Wer war vor dem Match die Nr. 1?
        let currentTopPlayer = null;
        let highestEloFound = -1;
        Object.keys(eloRatings).forEach(p => {
            if (eloRatings[p] > highestEloFound) {
                highestEloFound = eloRatings[p];
                currentTopPlayer = p;
            }
        });

        const avg1 = p1A.reduce((s, p) => s + (eloRatings[p] || 1000), 0) / (p1A.length || 1);
        const avg2 = p2A.reduce((s, p) => s + (eloRatings[p] || 1000), 0) / (p2A.length || 1);
        const exp1 = 1 / (1 + Math.pow(10, (avg2 - avg1) / 400));
        const eloChange = (g.w == 1 ? 1 : 0) - exp1;

        matchDeltas[originalIndex] = { eloDelta: Math.round(20 * Math.abs(eloChange)) };

        // Achievements-Metriken berechnen (for fallback)
        winners.forEach(p => {
            if (currentTopPlayer && losers.includes(currentTopPlayer)) pData[p].winsVsTopElo++;
            let nemesis = null; let maxL = 0;
            Object.entries(pData[p].headToHead).forEach(([opp, stats]) => {
                if (stats.l > maxL) { maxL = stats.l; nemesis = opp; }
            });
            if (nemesis && losers.includes(nemesis)) pData[p].vsNemesisWins++;
            if (rest === 1) { pData[p].closeWins++; pData[p].dramaWins++; }
        });
        losers.forEach(p => {
            if (rest === 1) pData[p].closeLosses++;
            let worstOpp = null; let maxL = 0;
            Object.entries(pData[p].headToHead).forEach(([opp, stats]) => {
                if (stats.l > maxL) { maxL = stats.l; worstOpp = opp; }
            });
            if (worstOpp && winners.includes(worstOpp)) pData[p].vsWorstOpponentLosses++;
        });

        playersInMatch.forEach(p => {
            const isW = winners.includes(p);
            const d = pData[p];
            d.games++;
            d.gameResultsHistory.push(isW ? 1 : 0);
            if (isW) {
                d.wins++; d.killerPoints += rest; d.currentStreak++; d.loseStreak = 0; d.lastWin = true;
                if(d.currentStreak > d.maxStreak) d.maxStreak = d.currentStreak;
                if(g.t?.includes("Schwarz")) d.blackWinsCount++;
                // Corrected breakWins logic for individual players in fallback
                if(breakerString === winnerString) {
                    if (isTeam) {
                        const teamNames = winnerString.split(" & ");
                        if (teamNames.includes(p)) d.breakWins++;
                    } else if (p === winnerString) {
                        d.breakWins++;
                    }
                }
                if(rest === 1) d.clutchWins++;
                d.last20WinsKiller.push(rest);
                if (d.last20WinsKiller.length > 20) d.last20WinsKiller.shift();
            } else {
                d.rest += rest; d.currentStreak = 0; d.loseStreak++; d.lastWin = false;
                if(d.loseStreak > d.maxLoseStreak) d.maxLoseStreak = d.loseStreak;
                d.last20Losses.push(rest);
                if (d.last20Losses.length > 20) d.last20Losses.shift();
            }
            d.last30Games.push(isW ? 1 : 0);
            if (d.last30Games.length > 30) d.last30Games.shift();

            const k = (eloGamesCount[p] || 0) < 20 ? 40 : 20;
            const change = p1A.includes(p) ? (k * eloChange) : -(k * eloChange);
            eloRatings[p] = (eloRatings[p] || 1000) + change;
            eloGamesCount[p] = (eloGamesCount[p] || 0) + 1;
            d.eloHistory.push(Math.round(eloRatings[p]));
            if(eloRatings[p] > d.maxElo) d.maxElo = Math.round(eloRatings[p]);
        });

        // Duo & Duell Logic für Aggregates (Hier außerhalb des Spieler-Loops, damit nicht mehrfach gezählt wird!)
        if (isTeam && p1A.length === 2 && p2A.length === 2) {
            const t1 = [...p1A].sort().join(" & "), t2 = [...p2A].sort().join(" & ");
            if(!aggregates.teamResults[t1]) aggregates.teamResults[t1] = {w:0, g:0};
            if(!aggregates.teamResults[t2]) aggregates.teamResults[t2] = {w:0, g:0};
            aggregates.teamResults[t1].g++; aggregates.teamResults[t2].g++;
            if(g.w == 1) aggregates.teamResults[t1].w++; else aggregates.teamResults[t2].w++;
        }

        if (!isTeam && p1A.length === 1 && p2A.length === 1) {
            const name1 = p1A[0], name2 = p2A[0];
            const winName = (g.w == 1) ? name1 : name2;
            const loseName = (g.w == 1) ? name2 : name1;
            const mKey = winName + " -> " + loseName;
            const uKey = [name1, name2].sort().join('|');
            
            aggregates.matchups[mKey] = (aggregates.matchups[mKey] || 0) + 1;
            aggregates.meetings[uKey] = (aggregates.meetings[uKey] || 0) + 1;
            
            if(!aggregates.matchupStats[uKey]) aggregates.matchupStats[uKey] = {p1: name1, p2: name2, p1_wins:0, p2_wins:0, games:0};
            aggregates.matchupStats[uKey].games++;
            if(winName === aggregates.matchupStats[uKey].p1) aggregates.matchupStats[uKey].p1_wins++; else aggregates.matchupStats[uKey].p2_wins++;
        }

        // Aggregates (Spezis etc.)
        if (g.bt1 && g.bt2) {
            aggregates.totalBallMatches++;
            const winType = (g.w == 1) ? g.bt1 : g.bt2;
            if (winType === 'Voll') aggregates.vollWins++; else if (winType === 'Halb') aggregates.halbWins++;
            winners.forEach(n => {
                if(!aggregates.playerBallWins[n]) aggregates.playerBallWins[n] = { Voll:0, Halb:0 };
                aggregates.playerBallWins[n][winType]++;
            });
            const procSpez = (arr, type, isWin) => arr.forEach(p => {
                if(!aggregates.ballSpez[p]) aggregates.ballSpez[p] = { Voll:{w:0,g:0}, Halb:{w:0,g:0} };
                aggregates.ballSpez[p][type].g++; if(isWin) aggregates.ballSpez[p][type].w++;
            });
            procSpez(p1A, g.bt1, g.w==1); procSpez(p2A, g.bt2, g.w==2);
        }
    });

    Object.keys(pData).forEach(p => {
        const d = pData[p];
        d.elo = Math.round(eloRatings[p]);
        d.eloGames = eloGamesCount[p];
        d.winRate = Math.round((d.wins / d.games) * 100);
        d.avgKiller = d.wins > 0 ? (d.killerPoints / d.wins) : 0;
        d.avgRest = (d.games - d.wins) > 0 ? (d.rest / (d.games - d.wins)) : 0;
        if (d.eloHistory.length >= 10) {
            const prevElo = d.eloHistory.length === 10 ? 1000 : d.eloHistory[d.eloHistory.length - 11];
            d.eloDelta10 = d.eloHistory[d.eloHistory.length - 1] - prevElo;
        } else d.eloDelta10 = 0;

        d.winRateLast30 = d.last30Games.length > 0 ? Math.round((d.last30Games.reduce((a,b)=>a+b,0)/d.last30Games.length)*100) : 0;
        d.avgRestLossLast20 = d.last20Losses.length > 0 ? (d.last20Losses.reduce((a,b)=>a+b,0)/d.last20Losses.length) : 0;
        d.avgKillerLast20 = d.last20WinsKiller.length > 0 ? (d.last20WinsKiller.reduce((a,b)=>a+b,0)/d.last20WinsKiller.length) : 0;
        
        if (d.games >= 40) {
            const first20 = d.gameResultsHistory.slice(0, 20);
            const last20 = d.gameResultsHistory.slice(-20);
            const wrFirst = (first20.reduce((a,b)=>a+b,0)/20)*100;
            const wrLast = (last20.reduce((a,b)=>a+b,0)/20)*100;
            d.winRateDelta20 = wrLast - wrFirst;
        } else { d.winRateDelta20 = 0; }
    });

    return { pData, matchDeltas, aggregates, blackWins: blackWins, breakWins: breakWinsCount };
};

// UI-Update erzwingen, falls Chart.js nach den Firebase-Snapshots geladen wurde
if (typeof window.recalculateAndRender === 'function') window.recalculateAndRender();
else if (typeof window.updateAllViews === 'function') window.updateAllViews();