import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import {
  Users, Snowflake, BookOpen, Shield, MessagesSquare, VenetianMask,
  Clapperboard, Dumbbell, Zap, ClipboardCheck, Puzzle, Coffee, Flag,
  Armchair, Footprints, Flame, Plus, X, ChevronUp, ChevronDown, ChevronRight,
  Clock, Play, SkipForward, Check, Copy, Pencil, Trash2, Square,
  CheckSquare, Printer, StickyNote, RotateCcw, PauseCircle, Layers,
  Target, Tag, Upload, Download, ArrowLeftRight, Eye, EyeOff, User, QrCode, Star, Compass, Bookmark
} from "lucide-react";

/* ---------- constanten ---------- */

const CATS = {
  intro:        { label: "Introductie",        Icon: Users,          bg: "#E8F1FD", fg: "#0B62C9" },
  ijsbreker:    { label: "IJsbreker",           Icon: Snowflake,      bg: "#E6F7F8", fg: "#0E7C86" },
  theorie:      { label: "Theorie",             Icon: BookOpen,       bg: "#EDEBFD", fg: "#5B4BD6" },
  grenzen:      { label: "Grenzenoefening",     Icon: Shield,         bg: "#FFF1E3", fg: "#C25E00" },
  uitwisseling: { label: "Uitwisseling",        Icon: MessagesSquare, bg: "#F3EAFB", fg: "#8036C9" },
  acteur:       { label: "Acteur-intro",        Icon: VenetianMask,   bg: "#FDE9F1", fg: "#C22E6E" },
  simulatie:    { label: "Praktijksimulatie",   Icon: Clapperboard,   bg: "#FDEAEA", fg: "#C62828" },
  fysiek:       { label: "Fysiek",              Icon: Dumbbell,       bg: "#E8F6EA", fg: "#1E8E3E" },
  energizer:    { label: "Energizer",           Icon: Zap,            bg: "#FFF8DD", fg: "#B08800" },
  evaluatie:    { label: "Evaluatie",           Icon: ClipboardCheck, bg: "#EAF3F0", fg: "#2F7D63" },
  mbti:         { label: "MBTI-oefening",       Icon: Compass,        bg: "#E5F1F4", fg: "#0F6E8C" },
  overig:       { label: "Overig",              Icon: Puzzle,         bg: "#F0F0F2", fg: "#5F5F66" },
};

const ENERGIE = {
  zittend: { label: "Zittend", Icon: Armchair,   fg: "#6E6E73" },
  actief:  { label: "Actief",  Icon: Footprints, fg: "#B08800" },
  fysiek:  { label: "Fysiek",  Icon: Flame,      fg: "#C62828" },
};

const PRESENTIE_OPTIES = ["", "aanwezig", "te laat", "eerder weg", "deels afwezig", "afwezig"];

const KLEURSET = ["#0A84FF", "#34C759", "#FF9F0A", "#FF375F", "#BF5AF2", "#64D2FF", "#FFD60A", "#8E8E93"];

const TRAININGSTYPEN = {
  agressie:     { label: "Agressie & weerbaarheid" },
  communicatie: { label: "Communicatie" },
  team:         { label: "Teamtraining" },
  mbti:         { label: "MBTI" },
};

const MBTI_DEFAULT_KLEUREN = {
  E: "#F58220", I: "#00A0AF",   /* oranje / turquoise */
  S: "#00A14B", N: "#FFC20E",   /* groen / geel */
  T: "#0056A4", F: "#E03C31",   /* blauw / rood */
  J: "#7D3F98", P: "#A6CE39",   /* paars / limoengroen */
};

const MBTI_DIMS = {
  EI: { label: "E / I", letters: ["I", "E"], pos: 0 },
  SN: { label: "S / N", letters: ["S", "N"], pos: 1 },
  TF: { label: "T / F", letters: ["T", "F"], pos: 2 },
  PJ: { label: "P / J", letters: ["P", "J"], pos: 3 },
};

function normalizeMbti(t) {
  const x = String(t || "").toUpperCase().replace(/[^EISNTFJP]/g, "");
  return /^[EI][SN][TF][JP]$/.test(x) ? x : "";
}

const STORAGE_KEY = "tdb-data-v1";

const SCENARIO_VELDEN = [
  ["persoon", "Naam persoon"],
  ["doelGesprek", "Doel van het gesprek"],
  ["vooraf", "Wat is er voorafgegaan?"],
  ["beleving", "Innerlijke beleving"],
  ["gedrag", "Zichtbaar gedrag"],
  ["zinnen", "Voorbeeldzinnen"],
  ["locatie", "Waar speelt het zich af?"],
  ["aanwezig", "Wie zijn aanwezig?"],
  ["voorkennis", "Wat weet de medewerker vooraf?"],
];

/* ---------- helpers ---------- */

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

function timeToMin(t) {
  if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minToTime(m) {
  m = ((Math.round(m) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60), mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
function fmtDur(m) {
  if (m >= 60) {
    const h = Math.floor(m / 60), r = m % 60;
    return r ? `${h}u${String(r).padStart(2, "0")}` : `${h} uur`;
  }
  return `${m} min`;
}
function vandaag() {
  return new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

function contrastKleur(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#fff";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? "#1D1D1F" : "#fff";
}

function wrapTekst(t, max = 30) {
  const w = t.split(/\s+/);
  const out = [[]];
  w.forEach((x) => {
    const l = out[out.length - 1];
    if ((l.join(" ").length + x.length + 1) > max && l.length) out.push([x]);
    else l.push(x);
  });
  return out.map((l) => l.join(" ")).filter(Boolean).slice(0, 3);
}

function blokDuur(b, exMap) {
  if (b.type === "punt" || b.reserve) return 0;
  if (b.type === "pauze") return Math.max(0, (b.duur || 15) + (b.extra || 0));
  const ex = exMap[b.exId];
  if (!ex) return 0;
  const base = b.versie === "lang" ? ex.duurLang : ex.duurKort;
  return Math.max(0, (base || 0) + (b.extra || 0));
}

function plannedOffsets(blokken, exMap) {
  let acc = 0;
  return blokken.map((b) => {
    const start = acc;
    acc += blokDuur(b, exMap);
    return start;
  });
}

const leegScenario = () => ({ id: uid(), titel: "", persoon: "", doelGesprek: "", vooraf: "", beleving: "", gedrag: "", zinnen: "", locatie: "", aanwezig: "", voorkennis: "", doelgroepen: [], heftigheid: 0, fysiekeDreiging: false, persoonlijk: false, vanDeelnemer: "", eigen: [], uitvoeringen: [] });
const leegExercise = () => ({
  id: null, naam: "", cat: "overig", duurKort: 10, duurLang: 20, minDeel: 4, maxDeel: 12,
  benodigd: "", ruimte: "", volgorde: "", sheets: "", instructie: "", varianten: "",
  doel: "", tags: "", energie: "zittend", notities: [], scenarios: [], typen: [],
});

const SCENARIO_SJABLOON = `Titel: 
Persoon: 
Doel: 
Vooraf: 
Beleving: 
Gedrag: 
Zinnen:
- 
- 
Locatie: 
Aanwezig: 
Voorkennis: 
Doelgroep: 
Heftigheid: 
Fysieke dreiging: nee
Persoonlijk: nee
---`;

function parseScenarioTekst(tekst) {
  const map = [
    [/^(titel|setting)$/i, "titel"], [/^(persoon|naam persoon|naam)$/i, "persoon"],
    [/^doel( van het gesprek)?$/i, "doelGesprek"],
    [/^(vooraf|voorafgegaan|wat is er voorafgegaan\??|aanleiding)$/i, "vooraf"],
    [/^(beleving|innerlijke beleving)$/i, "beleving"],
    [/^(zichtbaar gedrag|gedrag)$/i, "gedrag"],
    [/^(voorbeeldzinnen|zinnen)$/i, "zinnen"],
    [/^(locatie|waar( speelt het zich af\??)?)$/i, "locatie"],
    [/^(aanwezig|wie( zijn aanwezig\??)?)$/i, "aanwezig"],
    [/^(voorkennis|wat weet de medewerker( vooraf\??)?)$/i, "voorkennis"],
    [/^doelgroep(en)?$/i, "doelgroepen"], [/^heftigheid$/i, "heftigheid"],
    [/^persoonlijk$/i, "persoonlijk"], [/^van deelnemer$/i, "vanDeelnemer"],
    [/^fysiek(e dreiging)?$/i, "fysiekeDreiging"],
  ];
  const res = [];
  let s = null, veld = null;
  const bewaar = () => { if (s && (s.titel || s.persoon || s.gedrag || s.vooraf)) res.push(s); s = null; veld = null; };
  tekst.split("\n").forEach((regel) => {
    const r = regel.replace(/\s+$/, "");
    if (/^\s*-{3,}\s*$/.test(r)) { bewaar(); return; }
    if (!r.trim()) return;
    const m = r.match(/^([^:]{1,45}):\s*(.*)$/);
    if (m && !/^https?$/i.test(m[1].trim())) {
      const kop = m[1].trim(); const rest = m[2].trim();
      const hit = map.find(([re]) => re.test(kop));
      if (hit && hit[1] === "titel" && s && s.titel) bewaar();
      if (!s) s = leegScenario();
      if (hit) {
        veld = hit[1];
        if (veld === "doelgroepen") { s.doelgroepen = rest.split(",").map((x) => x.trim()).filter(Boolean); veld = null; }
        else if (veld === "heftigheid") { s.heftigheid = /heftig|zwaar|3/i.test(rest) ? 3 : /mid|2/i.test(rest) ? 2 : /licht|1/i.test(rest) ? 1 : 0; veld = null; }
        else if (veld === "persoonlijk") { s.persoonlijk = /^(ja|j|x|yes|true|1)/i.test(rest); veld = null; }
        else if (veld === "fysiekeDreiging") { s.fysiekeDreiging = /^(ja|j|x|yes|true|1)/i.test(rest); veld = null; }
        else if (rest) s[veld] = rest;
      } else {
        s.eigen.push({ id: uid(), kop, tekst: rest });
        veld = "eigen";
      }
    } else if (s) {
      const t = r.trim().replace(/^[-•]\s*/, "");
      if (veld === "eigen" && s.eigen.length) { const last = s.eigen[s.eigen.length - 1]; last.tekst = (last.tekst ? last.tekst + "\n" : "") + t; }
      else if (veld) s[veld] = (s[veld] ? s[veld] + "\n" : "") + t;
    }
  });
  bewaar();
  return res;
}

/* ---------- voorbeelddata ---------- */

function sampleExercises() {
  const mk = (o) => ({ ...leegExercise(), id: uid(), ...o });
  const sc = (o) => ({ ...leegScenario(), ...o });
  return [
    mk({ naam: "Kennismaking & leerwensen", cat: "intro", duurKort: 20, duurLang: 35, sheets: "2-4", benodigd: "Flip-over, stiften",
      doel: "Veiligheid in de groep en leerwensen ophalen als rode draad voor de dag", tags: "kennismaking, leerwensen",
      instructie: "Iedereen stelt zich kort voor: naam, functie, en één situatie met agressie of lastig gedrag die is bijgebleven. Noteer leerwensen op de flip-over en koppel ze aan het dagprogramma. Verwijs er gedurende de dag naar terug." }),
    mk({ naam: "IJsbreker: twee waarheden, één leugen", cat: "ijsbreker", duurKort: 10, duurLang: 15,
      doel: "Ontspanning en onderling contact voor de inhoud begint", tags: "kennismaking, plezier",
      instructie: "Iedereen noemt drie uitspraken over zichzelf, waarvan één niet waar is. De groep raadt welke. Licht en snel houden; doel is lachen en ontspanning voor de inhoud begint." }),
    mk({ naam: "Theorie: escalatieladder & gedragsvormen", cat: "theorie", duurKort: 20, duurLang: 40, sheets: "5-12", benodigd: "Beamer",
      doel: "Gedragsvormen herkennen en weten dat elk gedrag een andere reactie vraagt", tags: "herkennen, theorie-basis",
      instructie: "Behandel de escalatieladder: van spanning naar frustratie-agressie naar instrumentele agressie. Laat deelnemers eigen voorbeelden per trede plaatsen. Kernboodschap: ander gedrag vraagt een andere reactie.",
      volgorde: "Bij voorkeur vóór de praktijksimulaties" }),
    mk({ naam: "Grenzenoefening: Stop!", cat: "grenzen", duurKort: 15, duurLang: 25, energie: "actief", ruimte: "Vrije ruimte nodig",
      doel: "Eigen grens voelen en congruent aangeven", tags: "grenzen, non-verbaal",
      instructie: "Tweetallen tegenover elkaar op afstand. A loopt rustig op B af; B zegt 'stop' op het moment dat het te dichtbij voelt, eerst alleen verbaal, daarna met houding en gebaar. Nabespreken: waar ligt jouw grens en hoe congruent was je signaal?" }),
    mk({ naam: "Uitwisseling: lastige praktijksituaties", cat: "uitwisseling", duurKort: 20, duurLang: 35, benodigd: "Flip-over",
      doel: "Herkenning creëren en casusmateriaal ophalen voor de simulaties", tags: "eigen-casuïstiek",
      instructie: "In drietallen: elk deelt één recente lastige situatie. Kies per groepje de situatie die het meest herkenbaar is en presenteer die plenair. Verzamel op de flip-over; dit wordt input voor de simulaties." }),
    mk({ naam: "Theorie: de-escalerend communiceren", cat: "theorie", duurKort: 15, duurLang: 30, sheets: "13-18", benodigd: "Beamer",
      doel: "Gesprekstechnieken kennen om frustratie te dempen", tags: "de-escaleren, gesprekstechniek",
      instructie: "LSD (luisteren, samenvatten, doorvragen), erkennen van emotie zonder mee te gaan in de inhoud, ik-boodschappen en begrenzen. Demonstreer het verschil tussen reageren op de emotie en reageren op de inhoud." }),
    mk({ naam: "Energizer: 1-2-3 klap", cat: "energizer", duurKort: 5, duurLang: 10, energie: "actief",
      doel: "Energie terugbrengen in de groep", tags: "energie",
      instructie: "Tweetallen tellen om de beurt 1-2-3. Vervang stap voor stap: 1 wordt een klap, 2 een stamp, 3 een sprong. Fouten maken hoort erbij, tempo opvoeren. Ideaal na de lunch of bij inzakkende energie." }),
    mk({ naam: "Intro werken met trainingsacteur", cat: "acteur", duurKort: 10, duurLang: 15, sheets: "19-20",
      doel: "Veilig oefenklimaat en spelregels voor het werken met de acteur", tags: "veiligheid, spelregels",
      instructie: "Introduceer de acteur en de spelregels: time-out teken, veilig oefenen, terugspoelen mag, geen goed of fout. Benadruk dat de acteur reageert op gedrag, niet op de persoon. Laat de acteur kort twee gedragsvormen demonstreren.",
      volgorde: "Altijd vóór de eerste praktijksimulatie" }),
    mk({ naam: "Praktijksimulaties: frustratie-agressie", cat: "simulatie", duurKort: 30, duurLang: 50, energie: "actief",
      benodigd: "Tafel, 2 stoelen", ruimte: "Speelvlak vrij, groep in halve cirkel",
      doel: "De-escalerend reageren op frustratiegedrag in de eigen werkcontext", tags: "frustratie, de-escaleren",
      instructie: "Deelnemers oefenen met de acteur op frustratiegedrag. Kies per deelnemer het scenario dat het dichtst bij de eigen praktijk ligt. Time-outs gebruiken om de groep mee te laten denken: wat zie je, wat zou jij doen? Elke deelnemer eindigt met een geslaagde poging.",
      volgorde: "Na acteur-intro en theorie de-escaleren",
      scenarios: [
        sc({ titel: "Balie", persoon: "Meneer De Vries", doelgroepen: ["Gemeente"], heftigheid: 2, doelGesprek: "De aanvraag alsnog correct in behandeling nemen", gedrag: "Gefrustreerd, verheft stem, slaat met vlakke hand op de balie", zinnen: "Ik sta hier nou al voor de derde keer!\nJullie maken er een potje van.", locatie: "Publieksbalie", aanwezig: "Baliemedewerker, wachtende bezoekers", vooraf: "Al drie keer teruggestuurd omdat papieren niet compleet waren", voorkennis: "Dossier bekend, aanvraag loopt al 6 weken" }),
        sc({ titel: "Telefoon", persoon: "Mevrouw Jansen", doelgroepen: ["Gemeente"], heftigheid: 2, gedrag: "Praat er dwars doorheen, dreigt met de wethouder en de krant", locatie: "Telefonisch, klantcontactcentrum", aanwezig: "Alleen de medewerker aan de lijn", vooraf: "Terugbelverzoek is twee keer niet nagekomen", voorkennis: "Eerdere notities in het systeem over lange doorlooptijd" }),
        sc({ titel: "Huisbezoek", persoon: "Meneer Koval", doelgroepen: ["Welzijn", "Zorg"], heftigheid: 1,
          doelGesprek: "Het hulpverleningsplan bespreken",
          vooraf: "Ergert zich al de hele ochtend aan geluiden van de buren",
          beleving: "Hoofdpijn, maakt zich zorgen, zijn hoofd staat er niet naar",
          gedrag: "Kortaf, niet gefocust, stemverheffing, verongelijkt",
          zinnen: "Wat doen jullie nou altijd?\nIk kan ook niet op je rekenen.",
          locatie: "Thuis, aan de keukentafel", aanwezig: "Bewoner en medewerker",
          voorkennis: "Eerste gesprek; hij zit in de langdurige thuiszorg en weet dat je komt" }),
      ] }),
    mk({ naam: "Praktijksimulaties: instrumentele agressie", cat: "simulatie", duurKort: 30, duurLang: 50, energie: "actief",
      benodigd: "Tafel, 2 stoelen", ruimte: "Speelvlak vrij, groep in halve cirkel",
      doel: "Begrenzen en normeren bij doelbewust intimiderend gedrag", tags: "instrumenteel, begrenzen",
      instructie: "Deelnemers oefenen met de acteur op instrumenteel (doelgericht) gedrag. Kern: niet meebuigen, rustig normeren en begrenzen, consequenties benoemen en uitvoeren. Bespreek het verschil met frustratie-agressie in de nabespreking.",
      volgorde: "Na de simulaties frustratie-agressie",
      scenarios: [
        sc({ titel: "Balie: intimidatie", persoon: "Meneer Bakker", doelgroepen: ["Gemeente"], heftigheid: 3, gedrag: "Kalm maar dreigend: 'ik weet waar je werkt' en zoekt oogcontact op", locatie: "Publieksbalie", aanwezig: "Baliemedewerker, collega op afstand", vooraf: "Aanvraag afgewezen, komt verhaal halen", voorkennis: "Eerder incident geregistreerd, afspraak alleen op afspraak" }),
        sc({ titel: "Telefoon: dreigen", persoon: "Anoniem", doelgroepen: ["Gemeente"], heftigheid: 3, gedrag: "Eist direct doorverbinden, dreigt met 'gevolgen' voor de medewerker persoonlijk", locatie: "Telefonisch", aanwezig: "Alleen de medewerker aan de lijn", vooraf: "Derde keer bellen vandaag", voorkennis: "Nummer afgeschermd, eerdere meldingen bekend" }),
      ] }),
    mk({ naam: "Fysiek: loskomen uit polsgreep", cat: "fysiek", duurKort: 15, duurLang: 25, energie: "fysiek", benodigd: "Matten", ruimte: "Matten uitgelegd",
      doel: "Basisvaardigheid om je veilig los te maken en afstand te creëren", tags: "weerbaarheid, techniek",
      instructie: "Techniek: draai richting de duim van de vastpakkende hand, maak je groot en stap uit. Eerst langzaam op techniek, daarna met lichte weerstand. Veiligheid voorop: stopsignaal afspreken, sieraden af.",
      volgorde: "Na de grenzenoefening" }),
    mk({ naam: "Fysiek: veilige afstand & wegstappen", cat: "fysiek", duurKort: 10, duurLang: 20, energie: "fysiek", benodigd: "Matten, pionnen", ruimte: "Matten uitgelegd, looplijnen vrij",
      doel: "Basishouding en veilige positionering aanleren", tags: "weerbaarheid, houding",
      instructie: "Oefen de basishouding: handen zichtbaar, licht op de voorvoeten, één been iets terug. Wegstappen onder een hoek in plaats van recht achteruit. Met pionnen looplijnen uitzetten en in tweetallen oefenen." }),
    mk({ naam: "Evaluatie & afsluiting", cat: "evaluatie", duurKort: 15, duurLang: 25,
      doel: "Opbrengst borgen en vertalen naar de werkvloer", tags: "borging",
      instructie: "Rondje: wat neem je concreet mee naar morgen op de werkvloer? Koppel terug naar de leerwensen van de ochtend. Kort vooruitblikken naar de volgende trainingsdag en eventuele opdracht meegeven." }),
    mk({ naam: "Check-in vervolgdag", cat: "intro", duurKort: 10, duurLang: 15,
      doel: "Ervaringen sinds dag 1 ophalen en verbinden aan het programma", tags: "borging, kennismaking",
      instructie: "Kort rondje: wat is blijven hangen, wat heb je al toegepast of geprobeerd? Ophalen wat er sinds de vorige dag is gebeurd en het programma van vandaag koppelen aan die ervaringen." }),
    mk({ naam: "Theorie: nazorg & melden", cat: "theorie", duurKort: 15, duurLang: 25, sheets: "30-34", benodigd: "Beamer",
      doel: "Weten wat te doen na een incident: opvang, melden, nazorg", tags: "nazorg, organisatie",
      instructie: "Wat doe je ná een incident: eerste opvang door collega's, melden en registreren, wanneer professionele nazorg. Bespreek de meldprocedure van de eigen organisatie en drempels om te melden." }),
  ];
}

const DEFAULT_BASIS = ["Laptop + oplader", "Presenter/clicker", "HDMI/USB-C adapter", "Stiften voor flip-over", "Draaiboek / trainingsmap"];

function leegOrg() {
  return {
    adres: "", contact: "", tel: "", open: "", beamer: false, flipover: false,
    lunch: "georganiseerd", lunchtijd: "12:30", lunchflex: false, notities: "", evalUrl: "", qrLinks: [],
    acteur: { aanwezig: false, naam: "", van: "", tot: "" },
  };
}

function leegTraining(naam, type) {
  return {
    id: uid(), naam, type: TRAININGSTYPEN[type] ? type : "agressie",
    trainingDoelgroepen: [],
    dagen: [{ id: uid(), titel: "Dag 1", start: "09:00", eind: "16:30", doelen: "", blokken: [] }],
    deelnemers: [], plaatsing: [], plaatsRichting: "links",
    opstelling: { vorm: "halvecirkel", links: 4, boven: 4, rechts: 4 },
    evalNotities: "", org: leegOrg(), inpakChecked: {}, inpakHidden: {}, live: null,
  };
}

function defaultData() {
  const ex = sampleExercises();
  const dln = [
    { id: uid(), naam: "Sanne", kleur: KLEURSET[0], functie: "Balie", leerwensen: "", lastig: "", bijz: "", memo: "", evaluatie: "", mbtiGemeten: "", mbtiBest: "", presentie: {} },
    { id: uid(), naam: "Mo", kleur: KLEURSET[0], functie: "Balie", leerwensen: "", lastig: "", bijz: "", memo: "", evaluatie: "", mbtiGemeten: "", mbtiBest: "", presentie: {} },
    { id: uid(), naam: "Petra", kleur: KLEURSET[1], functie: "Wijkteam", leerwensen: "", lastig: "", bijz: "", memo: "", evaluatie: "", mbtiGemeten: "", mbtiBest: "", presentie: {} },
  ];
  const byName = (n) => ex.find((e) => e.naam.startsWith(n))?.id;
  const oef = (n, versie = "kort") => ({ id: uid(), type: "oef", exId: byName(n), versie, extra: 0, done: false });
  const pauze = (duur, tekst) => ({ id: uid(), type: "pauze", duur, extra: 0, tekst, done: false });
  const training = {
    ...leegTraining("Agressietraining (tweedaagse)", "agressie"),
    deelnemers: dln,
    dagen: [
      {
        id: uid(), titel: "Dag 1", start: "09:00", eind: "16:30",
        doelen: "Grenzen herkennen en aangeven • De-escalerend reageren op frustratie-agressie",
        blokken: [
          oef("Kennismaking"), oef("IJsbreker"), oef("Theorie: escalatieladder"),
          pauze(15, "Koffiepauze"),
          oef("Grenzenoefening"), oef("Uitwisseling"),
          pauze(45, "Lunch"),
          oef("Energizer"), oef("Theorie: de-escalerend"), oef("Intro werken"),
          oef("Praktijksimulaties: frustratie", "lang"),
          pauze(15, "Middagpauze"),
          oef("Fysiek: loskomen"),
          { id: uid(), type: "punt", tekst: "Vóór einde dag: leerwensen flip-over erbij pakken", done: false },
          oef("Evaluatie"),
        ],
      },
      {
        id: uid(), titel: "Dag 2", start: "09:00", eind: "16:30",
        doelen: "Toepassen in eigen praktijksituaties • Begrenzen bij instrumenteel gedrag",
        blokken: [
          oef("Check-in"), oef("Praktijksimulaties: instrumentele", "lang"),
          pauze(15, "Koffiepauze"),
          oef("Fysiek: veilige afstand"),
          pauze(45, "Lunch"),
          oef("Theorie: nazorg"), oef("Evaluatie", "lang"),
        ],
      },
    ],
  };
  return {
    versie: 2,
    bibliotheek: {
      exercises: ex,
      doelgroepen: ["Supermarkt", "Welzijn", "Gemeente", "Zorg"],
      mbtiKleuren: { ...MBTI_DEFAULT_KLEUREN },
      inpakBasis: [...DEFAULT_BASIS],
    },
    trainingen: [training],
    actieveTraining: training.id,
  };
}

/* trainingen en bibliotheek normaliseren; ondersteunt zowel v1- als v2-data */
function migreerTraining(t) {
  t = { ...leegTraining("Training", "agressie"), ...t };
  t.deelnemers = (t.deelnemers || []).map((p) => ({ presentie: {}, memo: "", evaluatie: "", mbtiGemeten: "", mbtiBest: "", ...p }));
  if (!Array.isArray(t.plaatsing)) t.plaatsing = t.deelnemers.map((p) => p.id);
  else t.plaatsing = t.plaatsing.filter((id, i) => t.deelnemers.some((p) => p.id === id) && t.plaatsing.indexOf(id) === i);
  if (!t.plaatsRichting) t.plaatsRichting = "links";
  if (!t.opstelling || !t.opstelling.vorm) t.opstelling = { vorm: "halvecirkel", links: 4, boven: 4, rechts: 4 };
  if (typeof t.evalNotities !== "string") t.evalNotities = "";
  t.org = { ...leegOrg(), ...(t.org || {}) };
  if (!t.org.acteur) t.org.acteur = { aanwezig: false, naam: "", van: "", tot: "" };
  if (!Array.isArray(t.org.qrLinks)) t.org.qrLinks = t.org.evalUrl ? [{ id: uid(), label: "Evaluatieformulier", url: t.org.evalUrl }] : [];
  if (!t.inpakHidden) t.inpakHidden = {};
  if (!t.inpakChecked) t.inpakChecked = {};
  if (!Array.isArray(t.trainingDoelgroepen)) t.trainingDoelgroepen = [];
  if (!TRAININGSTYPEN[t.type]) t.type = "agressie";
  (t.dagen || []).forEach((dag) => (dag.blokken || []).forEach((b) => { if (b.done === undefined) b.done = false; }));
  return t;
}

function migreerExercises(list) {
  return (list || []).map((e) => {
    e = { ...leegExercise(), id: uid(), ...e };
    if (!Array.isArray(e.typen)) e.typen = [];
    if (e.cat === "simulatie" && e.varianten && (!e.scenarios || e.scenarios.length === 0)) {
      e.scenarios = e.varianten.split("\n").map((x) => x.trim()).filter(Boolean).map((tt) => ({ ...leegScenario(), titel: tt }));
    }
    if (e.benodigd && /ruimte/i.test(e.benodigd)) {
      const parts = e.benodigd.split(",").map((x) => x.trim()).filter(Boolean);
      const ruimteParts = parts.filter((p) => /ruimte/i.test(p));
      if (ruimteParts.length) {
        e.ruimte = e.ruimte || ruimteParts.join(", ");
        e.benodigd = parts.filter((p) => !/ruimte/i.test(p)).join(", ");
      }
    }
    e.scenarios = (e.scenarios || []).map((sc) => ({ ...leegScenario(), ...sc, id: sc.id || uid(), eigen: sc.eigen || [], uitvoeringen: sc.uitvoeringen || [] }));
    return e;
  });
}

function migrate(d) {
  if (!d || typeof d !== "object") return defaultData();
  if (d.versie === 2 && Array.isArray(d.trainingen)) {
    const def = defaultData();
    const bib = { ...def.bibliotheek, ...(d.bibliotheek || {}) };
    bib.exercises = migreerExercises(bib.exercises);
    if (!Array.isArray(bib.doelgroepen)) bib.doelgroepen = def.bibliotheek.doelgroepen;
    if (!Array.isArray(bib.inpakBasis)) bib.inpakBasis = [...DEFAULT_BASIS];
    bib.mbtiKleuren = { ...MBTI_DEFAULT_KLEUREN, ...Object.fromEntries(Object.entries(bib.mbtiKleuren || {}).filter(([k]) => k in MBTI_DEFAULT_KLEUREN)) };
    const trainingen = d.trainingen.length ? d.trainingen.map(migreerTraining) : def.trainingen;
    const actieveTraining = trainingen.some((t) => t.id === d.actieveTraining) ? d.actieveTraining : trainingen[0].id;
    return { versie: 2, bibliotheek: bib, trainingen, actieveTraining };
  }
  /* v1 → v2: alles wordt de eerste training, oefeningen gaan naar de gedeelde bibliotheek */
  const training = migreerTraining({
    naam: d.trainingNaam || "Agressietraining", type: "agressie",
    trainingDoelgroepen: d.trainingDoelgroepen, dagen: d.dagen, deelnemers: d.deelnemers,
    plaatsing: d.plaatsing, plaatsRichting: d.plaatsRichting, opstelling: d.opstelling,
    evalNotities: d.evalNotities, org: d.org, inpakChecked: d.inpakChecked, inpakHidden: d.inpakHidden, live: d.live || null,
  });
  return {
    versie: 2,
    bibliotheek: {
      exercises: migreerExercises(d.exercises && d.exercises.length ? d.exercises : sampleExercises()),
      doelgroepen: Array.isArray(d.doelgroepen) ? d.doelgroepen : ["Supermarkt", "Welzijn", "Gemeente", "Zorg"],
      mbtiKleuren: { ...MBTI_DEFAULT_KLEUREN },
      inpakBasis: Array.isArray(d.inpakBasis) ? d.inpakBasis : (Array.isArray(d.inpakCustom) && d.inpakCustom.length ? d.inpakCustom : [...DEFAULT_BASIS]),
    },
    trainingen: [training],
    actieveTraining: training.id,
  };
}

/* ---------- kleine UI-onderdelen ---------- */

function CatChip({ cat, small }) {
  const c = CATS[cat] || CATS.overig;
  const I = c.Icon;
  return (
    <span className="chip" style={{ background: c.bg, color: c.fg, fontSize: small ? 11 : 12 }}>
      <I size={small ? 12 : 13} strokeWidth={2.2} /> {c.label}
    </span>
  );
}

function EnergieIcon({ e, size = 14 }) {
  const en = ENERGIE[e] || ENERGIE.zittend;
  const I = en.Icon;
  return <I size={size} strokeWidth={2.2} style={{ color: en.fg }} />;
}

function HeftigheidVlammen({ h, size = 12 }) {
  if (!h) return null;
  const kleur = h === 1 ? "#1E8E3E" : h === 2 ? "#E08700" : "#C62828";
  return (
    <span className="heftig" title={"Heftigheid: " + ["", "licht", "middel", "heftig"][h]}>
      {[...Array(h)].map((_, i) => <Flame key={i} size={size} strokeWidth={2.4} style={{ color: kleur }} />)}
    </span>
  );
}

function DoelgroepChips({ lijst }) {
  if (!lijst || !lijst.length) return null;
  return <span className="taglijst">{lijst.map((d) => <span key={d} className="doelgroepchip">{d}</span>)}</span>;
}

function PersoonlijkBadge({ s }) {
  if (!s.persoonlijk) return null;
  return <span className="persoonlijkbadge"><Star size={11} strokeWidth={2.4} /> Persoonlijk{s.vanDeelnemer ? " · " + s.vanDeelnemer : ""}</span>;
}

function IconBtn({ onClick, title, children, danger, subtle }) {
  return (
    <button className={"iconbtn" + (danger ? " danger" : "") + (subtle ? " subtle" : "")}
      onClick={(e) => { e.stopPropagation(); onClick && onClick(e); }} title={title} aria-label={title}>
      {children}
    </button>
  );
}

function Veld({ label, children, breed }) {
  return (
    <label className={"veld" + (breed ? " breed" : "")}>
      <span className="veldlabel">{label}</span>
      {children}
    </label>
  );
}

function TagLijst({ tags, klein }) {
  const lijst = (tags || "").split(",").map((t) => t.trim()).filter(Boolean);
  if (!lijst.length) return null;
  return (
    <span className="taglijst">
      {lijst.map((t) => <span key={t} className={"tagchip" + (klein ? " klein" : "")}>{t}</span>)}
    </span>
  );
}

/* ---------- oefening bewerken ---------- */

function ExerciseEditor({ ex, onSave, onClose, onDelete, doelgroepen = [], addDoelgroep, openScenId = null, trainingNaam = "" }) {
  const [f, setF] = useState({ ...leegExercise(), ...ex });
  const [openScen, setOpenScen] = useState(openScenId);
  const [nieuweDoelgroep, setNieuweDoelgroep] = useState("");
  const [snelOpen, setSnelOpen] = useState(false);
  const [snelTekst, setSnelTekst] = useState("");
  const [sjabloonKopie, setSjabloonKopie] = useState(false);
  const [scenExport, setScenExport] = useState(null);
  const [oefExport, setOefExport] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "number" ? Number(e.target.value) : e.target.value });
  const patchScen = (id, p) => setF({ ...f, scenarios: f.scenarios.map((s) => (s.id === id ? { ...s, ...p } : s)) });

  const kopieerSjabloon = async () => {
    try { await navigator.clipboard.writeText(SCENARIO_SJABLOON); setSjabloonKopie(true); setTimeout(() => setSjabloonKopie(false), 2000); } catch {}
  };
  const verwerkSnel = () => {
    const nieuw = parseScenarioTekst(snelTekst);
    if (!nieuw.length) { window.alert("Geen scenario's herkend. Gebruik kopjes zoals 'Titel:', 'Persoon:' en 'Gedrag:' aan het begin van een regel."); return; }
    nieuw.forEach((sc) => (sc.doelgroepen || []).forEach((dg) => { if (addDoelgroep) addDoelgroep(dg); }));
    setF((prev) => ({ ...prev, scenarios: [...prev.scenarios, ...nieuw] }));
    setSnelTekst(""); setSnelOpen(false);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modalkop">
          <strong>{ex.id ? "Oefening bewerken" : "Nieuwe oefening"}</strong>
          {ex.id && <IconBtn subtle title="Exporteer deze oefening" onClick={() => setOefExport(true)}><Printer size={15} /></IconBtn>}
          <IconBtn title="Sluiten" onClick={onClose}><X size={18} /></IconBtn>
        </div>
        <div className="modalbody">
          <Veld label="Naam" breed><input value={f.naam} onChange={set("naam")} placeholder="Naam van de oefening" /></Veld>
          <Veld label="Doel van de oefening" breed><input value={f.doel} onChange={set("doel")} placeholder="Wat moet deze oefening opleveren?" /></Veld>
          <div className="rij">
            <Veld label="Categorie">
              <select value={f.cat} onChange={set("cat")}>
                {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Veld>
            <Veld label="Energie">
              <select value={f.energie} onChange={set("energie")}>
                {Object.entries(ENERGIE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Veld>
          </div>
          <Veld label="Tags (komma-gescheiden)" breed><input value={f.tags} onChange={set("tags")} placeholder="de-escaleren, grenzen, borging" /></Veld>
          <div className="veld">
            <span className="veldlabel">Trainingstypen (leeg = overal beschikbaar)</span>
            <div className="regchips">
              {Object.entries(TRAININGSTYPEN).map(([k, v]) => (
                <button key={k} className={"regchip" + ((f.typen || []).includes(k) ? " donker" : "")}
                  onClick={() => setF({ ...f, typen: (f.typen || []).includes(k) ? f.typen.filter((x) => x !== k) : [...(f.typen || []), k] })}>{v.label}</button>
              ))}
            </div>
          </div>
          <div className="rij">
            <Veld label="Snelle versie (min)"><input type="number" min="1" value={f.duurKort} onChange={set("duurKort")} /></Veld>
            <Veld label="Uitgebreide versie (min)"><input type="number" min="1" value={f.duurLang} onChange={set("duurLang")} /></Veld>
          </div>
          <div className="rij">
            <Veld label="Min. deelnemers"><input type="number" min="1" value={f.minDeel} onChange={set("minDeel")} /></Veld>
            <Veld label="Max. deelnemers"><input type="number" min="1" value={f.maxDeel} onChange={set("maxDeel")} /></Veld>
          </div>
          <Veld label="Benodigdheden: spullen om mee te nemen (komma-gescheiden)" breed>
            <input value={f.benodigd} onChange={set("benodigd")} placeholder="Matten, pionnen, beamer" />
          </Veld>
          <Veld label="Ruimte / opstelling (komt niet op de inpaklijst)" breed>
            <input value={f.ruimte} onChange={set("ruimte")} placeholder="Vrije ruimte nodig, stoelen in kring…" />
          </Veld>
          <div className="rij">
            <Veld label="Sheet-nummer(s)"><input value={f.sheets} onChange={set("sheets")} placeholder="bijv. 5-12" /></Veld>
            <Veld label="Volgorde-afhankelijkheid"><input value={f.volgorde} onChange={set("volgorde")} placeholder="bijv. na acteur-intro" /></Veld>
          </div>
          <Veld label="Instructietekst" breed><textarea rows={5} value={f.instructie} onChange={set("instructie")} placeholder="Wat je tijdens de training wilt kunnen opklikken" /></Veld>
          {f.cat !== "simulatie" && (
            <Veld label="Varianten (één per regel)" breed><textarea rows={2} value={f.varianten} onChange={set("varianten")} /></Veld>
          )}

          <div className="scenariosectie">
            <div className="scenariokop">
              <span className="veldlabel" style={{ display: "flex", alignItems: "center", gap: 6 }}><VenetianMask size={14} /> Scenariokaarten</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button className={"knop klein" + (snelOpen ? " ingedrukt" : "")} onClick={() => setSnelOpen(!snelOpen)}><Zap size={13} /> Snelle invoer</button>
                <button className="knop klein" onClick={() => {
                  const s = leegScenario();
                  setF({ ...f, scenarios: [...f.scenarios, s] });
                  setOpenScen(s.id);
                }}><Plus size={13} /> Scenario</button>
              </div>
            </div>
            {snelOpen && (
              <div className="regvak" style={{ marginBottom: 8 }}>
                <p className="hint">Plak hier één of meer scenario's als gewone tekst met kopjes aan het begin van de regel (Titel:, Persoon:, Doel:, Vooraf:, Beleving:, Gedrag:, Zinnen: met streepjes eronder, Doelgroep:, Heftigheid: licht/middel/heftig, Persoonlijk: ja/nee). Meerdere scenario's scheid je met een regel ---. Onbekende kopjes worden automatisch eigen kopjes.</p>
                <textarea rows={9} value={snelTekst} onChange={(e) => setSnelTekst(e.target.value)} placeholder={SCENARIO_SJABLOON}
                  style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13 }} />
                <div className="detailregel">
                  <button className="knop klein" onClick={kopieerSjabloon}>{sjabloonKopie ? <><Check size={13} /> Gekopieerd</> : <><Copy size={13} /> Leeg sjabloon kopiëren</>}</button>
                  <span style={{ flex: 1 }} />
                  <button className="knop klein primair" disabled={!snelTekst.trim()} onClick={verwerkSnel}><Plus size={13} /> Verwerken</button>
                </div>
              </div>
            )}
            {f.scenarios.length === 0 && <p className="hint">Nog geen scenario's. Vooral handig bij praktijksimulaties: per kaart de persoon, het gedrag en de context.</p>}
            {f.scenarios.map((s) => (
              <div key={s.id} className={"scenariokaart" + (s.persoonlijk ? " persoonlijk" : "")}>
                <div className="scenariokaartkop" onClick={() => setOpenScen(openScen === s.id ? null : s.id)}>
                  <ChevronRight size={15} style={{ transform: openScen === s.id ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
                  <strong>{s.titel || "Naamloos scenario"}</strong>
                  {s.persoon && <span className="scenariopersoon"><User size={12} /> {s.persoon}</span>}
                  {s.fysiekeDreiging && <Dumbbell size={13} strokeWidth={2.6} style={{ color: "#C62828", flexShrink: 0 }} />}
                  <PersoonlijkBadge s={s} />
                  {s.uitvoeringen.length > 0 && <span className="uitvoerbadge">{s.uitvoeringen.length}× gedaan</span>}
                  <span style={{ flex: 1 }} />
                  <IconBtn subtle title="Exporteer dit scenario (voor acteur)" onClick={() => setScenExport(s)}><Printer size={14} /></IconBtn>
                  <IconBtn subtle danger title="Scenario verwijderen" onClick={() => setF({ ...f, scenarios: f.scenarios.filter((x) => x.id !== s.id) })}><Trash2 size={14} /></IconBtn>
                </div>
                {openScen === s.id && (
                  <div className="scenariovelden">
                    <Veld label="Titel / setting" breed><input value={s.titel} onChange={(e) => patchScen(s.id, { titel: e.target.value })} placeholder="Balie, telefoon, huisbezoek, spreekkamer…" /></Veld>
                    <div className="veld">
                      <span className="veldlabel">Heftigheid</span>
                      <span className="segment klein" style={{ alignSelf: "flex-start" }}>
                        {[0, 1, 2, 3].map((n) => (
                          <button key={n} className={(s.heftigheid || 0) === n ? "actief" : ""}
                            onClick={() => patchScen(s.id, { heftigheid: n })}>
                            {["Geen", "Licht", "Middel", "Heftig"][n]}
                          </button>
                        ))}
                      </span>
                    </div>
                    <div className="veld">
                      <span className="veldlabel">Doelgroep(en)</span>
                      <div className="regchips">
                        {doelgroepen.map((dg) => (
                          <button key={dg} className={"regchip" + ((s.doelgroepen || []).includes(dg) ? " donker" : "")}
                            onClick={() => patchScen(s.id, { doelgroepen: (s.doelgroepen || []).includes(dg) ? s.doelgroepen.filter((x) => x !== dg) : [...(s.doelgroepen || []), dg] })}>
                            {dg}
                          </button>
                        ))}
                        <input className="minitoevoeg" value={nieuweDoelgroep} placeholder="+ nieuwe doelgroep"
                          onChange={(e) => setNieuweDoelgroep(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && nieuweDoelgroep.trim()) {
                              const n = nieuweDoelgroep.trim();
                              if (addDoelgroep) addDoelgroep(n);
                              if (!(s.doelgroepen || []).includes(n)) patchScen(s.id, { doelgroepen: [...(s.doelgroepen || []), n] });
                              setNieuweDoelgroep("");
                            }
                          }} />
                      </div>
                    </div>
                    <label className="checklabel" style={{ margin: "2px 0 8px" }}>
                      <input type="checkbox" checked={!!s.fysiekeDreiging} onChange={(e) => patchScen(s.id, { fysiekeDreiging: e.target.checked })} />
                      <Dumbbell size={14} style={{ color: "#C62828" }} /> Fysieke dreiging in de simulatie
                    </label>
                    <label className="checklabel" style={{ margin: "0 0 10px" }}>
                      <input type="checkbox" checked={!!s.persoonlijk} onChange={(e) => patchScen(s.id, { persoonlijk: e.target.checked })} />
                      <Star size={14} style={{ color: "#8036C9" }} /> Persoonlijke simulatie (aparte status)
                    </label>
                    {s.persoonlijk && (
                      <Veld label="Van deelnemer" breed><input value={s.vanDeelnemer || ""} onChange={(e) => patchScen(s.id, { vanDeelnemer: e.target.value })} placeholder="Naam van de deelnemer wiens casus dit is" /></Veld>
                    )}
                    {SCENARIO_VELDEN.map(([k, l]) => (
                      <Veld key={k} label={l} breed>
                        <textarea rows={k === "persoon" ? 1 : k === "zinnen" ? 3 : 2} value={s[k] || ""}
                          placeholder={k === "zinnen" ? "Eén voorbeeldzin per regel" : ""}
                          onChange={(e) => patchScen(s.id, { [k]: e.target.value })} />
                      </Veld>
                    ))}
                    <span className="veldlabel">Eigen kopjes</span>
                    {(s.eigen || []).map((eg) => (
                      <div key={eg.id} className="eigenkopje">
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5 }}>
                          <input value={eg.kop} placeholder="Kopje (bijv. Wat helpt / wat escaleert)" style={{ fontWeight: 700 }}
                            onChange={(e) => patchScen(s.id, { eigen: s.eigen.map((x) => (x.id === eg.id ? { ...x, kop: e.target.value } : x)) })} />
                          <IconBtn subtle danger title="Kopje verwijderen"
                            onClick={() => patchScen(s.id, { eigen: s.eigen.filter((x) => x.id !== eg.id) })}><X size={14} /></IconBtn>
                        </div>
                        <textarea rows={2} value={eg.tekst}
                          onChange={(e) => patchScen(s.id, { eigen: s.eigen.map((x) => (x.id === eg.id ? { ...x, tekst: e.target.value } : x)) })} />
                      </div>
                    ))}
                    <button className="knop klein" style={{ alignSelf: "flex-start", marginTop: 4 }}
                      onClick={() => patchScen(s.id, { eigen: [...(s.eigen || []), { id: uid(), kop: "", tekst: "" }] })}>
                      <Plus size={13} /> Eigen kopje
                    </button>
                    {s.uitvoeringen.length > 0 && (
                      <div className="notitieblok">
                        <span className="veldlabel">Uitgevoerd door</span>
                        {s.uitvoeringen.map((u, i) => (
                          <div key={i} className="notitie">
                            <span className="notitiemeta">{u.datum}</span> {u.wie.join(", ")}{u.notitie ? " · " + u.notitie : ""}
                            <span style={{ flex: 1 }} />
                            <IconBtn subtle title="Verwijderen" onClick={() => patchScen(s.id, { uitvoeringen: s.uitvoeringen.filter((_, j) => j !== i) })}><X size={13} /></IconBtn>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {f.notities && f.notities.length > 0 && (
            <div className="notitieblok" style={{ marginTop: 12 }}>
              <span className="veldlabel">Evaluatienotities</span>
              {f.notities.map((n, i) => (
                <div key={i} className="notitie">
                  <span className="notitiemeta">{n.datum}{n.groep ? " · " + n.groep : ""}</span> {n.tekst}
                  <span style={{ flex: 1 }} />
                  <IconBtn subtle title="Notitie verwijderen" onClick={() => setF({ ...f, notities: f.notities.filter((_, j) => j !== i) })}><X size={13} /></IconBtn>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modalvoet">
          {onDelete && <button className="knop danger" onClick={onDelete}><Trash2 size={15} /> Verwijderen</button>}
          <span style={{ flex: 1 }} />
          <button className="knop" onClick={onClose}>Annuleren</button>
          <button className="knop primair" onClick={() => onSave(f)} disabled={!f.naam.trim()}>Opslaan</button>
        </div>
      </div>
      {scenExport && <ScenarioExportOverlay ex={f} s={scenExport} data={{ trainingNaam }} onClose={() => setScenExport(null)} />}
      {oefExport && <OefeningExportOverlay ex={f} data={{ trainingNaam }} onClose={() => setOefExport(false)} />}
    </div>
  );
}

/* ---------- simulatieweergave (alle scenariokaarten) ---------- */

function SimulatiesWeergave({ data, onOpen }) {
  const [fEx, setFEx] = useState(null);
  const [fSet, setFSet] = useState(null);
  const [fDoel, setFDoel] = useState(null);
  const [fHeft, setFHeft] = useState(0);
  const [fPers, setFPers] = useState(false);
  const [fFys, setFFys] = useState(false);
  const paren = data.exercises.filter((e) => (e.scenarios || []).length).flatMap((e) => e.scenarios.map((s) => ({ e, s })));
  const exNamen = [...new Set(paren.map((p) => p.e.naam))];
  const settings = [...new Set(paren.map((p) => p.s.titel).filter(Boolean))];
  const doels = [...new Set(paren.flatMap((p) => p.s.doelgroepen || []))];
  const lijst = paren.filter((p) =>
    (!fEx || p.e.naam === fEx) &&
    (!fSet || p.s.titel === fSet) &&
    (!fDoel || (p.s.doelgroepen || []).includes(fDoel)) &&
    (!fHeft || (p.s.heftigheid || 0) === fHeft) &&
    (!fPers || p.s.persoonlijk) &&
    (!fFys || p.s.fysiekeDreiging)
  );
  const chipRij = (items, val, set, icoon) => items.length ? (
    <div className="filterbalk tags">
      <span className="filterikoon">{icoon}</span>
      {items.map((it) => (
        <button key={it} className={"tagchip klikbaar" + (val === it ? " actief" : "")} onClick={() => set(val === it ? null : it)}>{it}</button>
      ))}
    </div>
  ) : null;
  return (
    <>
      {exNamen.length > 1 && chipRij(exNamen, fEx, setFEx, <Clapperboard size={13} />)}
      {chipRij(settings, fSet, setFSet, <Layers size={13} />)}
      {chipRij(doels, fDoel, setFDoel, <Users size={13} />)}
      <div className="filterbalk tags">
        <span className="filterikoon"><Flame size={13} /></span>
        {[1, 2, 3].map((n) => (
          <button key={n} className={"tagchip klikbaar" + (fHeft === n ? " actief" : "")} onClick={() => setFHeft(fHeft === n ? 0 : n)}>
            {["", "Licht", "Middel", "Heftig"][n]}
          </button>
        ))}
        <span className="filterikoon" style={{ marginLeft: 8 }}><Star size={13} /></span>
        <button className={"tagchip klikbaar" + (fPers ? " actief" : "")} onClick={() => setFPers(!fPers)}>Persoonlijk</button>
        <button className={"tagchip klikbaar" + (fFys ? " actief" : "")} onClick={() => setFFys(!fFys)}>Fysieke dreiging</button>
      </div>
      {lijst.map(({ e, s }) => (
        <div key={s.id} className={"bibkaart" + (s.persoonlijk ? " persoonlijk" : "")} onClick={() => onOpen(e, s.id)}>
          <div className="bibkaartkop">
            <strong>{s.titel || "Scenario"}{s.persoon ? " · " + s.persoon : ""}</strong>
            <span className="bibmeta">
              <PersoonlijkBadge s={s} />
              <HeftigheidVlammen h={s.heftigheid} size={13} />
              {s.fysiekeDreiging && <Dumbbell size={13} strokeWidth={2.6} style={{ color: "#C62828" }} />}
              <DoelgroepChips lijst={s.doelgroepen} />
            </span>
          </div>
          <p className="hint" style={{ marginTop: 3 }}>{e.naam}</p>
          {s.gedrag && <p className="bibinstructie">{s.gedrag}</p>}
        </div>
      ))}
      {lijst.length === 0 && <p className="hint">Geen scenario's gevonden met deze filters.</p>}
    </>
  );
}

/* ---------- bibliotheek ---------- */

function BibliotheekTab({ data, up }) {
  const [filter, setFilter] = useState("alle");
  const [tagFilter, setTagFilter] = useState(null);
  const [editing, setEditing] = useState(null);
  const [weergave, setWeergave] = useState("oefeningen");
  const [openScenId, setOpenScenId] = useState(null);
  const [typeFilter, setTypeFilter] = useState("alle");
  const importRef = useRef(null);

  const alleTags = useMemo(() => {
    const s = new Set();
    data.exercises.forEach((e) => (e.tags || "").split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => s.add(t)));
    return [...s].sort();
  }, [data.exercises]);

  const lijst = data.exercises.filter((e) =>
    (filter === "alle" || e.cat === filter) &&
    (typeFilter === "alle" || !(e.typen || []).length || e.typen.includes(typeFilter)) &&
    (!tagFilter || (e.tags || "").split(",").map((t) => t.trim()).includes(tagFilter))
  );
  const groepen = {};
  lijst.forEach((e) => { (groepen[e.cat] = groepen[e.cat] || []).push(e); });

  const save = (f) => {
    if (f.id && data.exercises.some((e) => e.id === f.id)) {
      up({ exercises: data.exercises.map((e) => (e.id === f.id ? f : e)) });
    } else {
      up({ exercises: [...data.exercises, { ...f, id: uid() }] });
    }
    setEditing(null);
  };
  const del = () => {
    const inGebruik = data.dagen.some((d) => d.blokken.some((b) => b.exId === editing.id));
    if (inGebruik && !window.confirm("Deze oefening staat in een draaiboek. Toch verwijderen? De blokken in het draaiboek verdwijnen dan ook.")) return;
    up({
      exercises: data.exercises.filter((e) => e.id !== editing.id),
      dagen: data.dagen.map((d) => ({ ...d, blokken: d.blokken.filter((b) => b.exId !== editing.id) })),
    });
    setEditing(null);
  };

  const importeer = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      let json;
      try { json = JSON.parse(e.target.result); }
      catch { window.alert("Dit bestand is geen geldige JSON."); return; }
      if (!json || json.formaat !== "tdb-import-v1" || !Array.isArray(json.exercises)) {
        window.alert('Dit bestand is geen importbestand in het formaat "tdb-import-v1".');
        return;
      }
      const bestaandeNamen = new Set(data.exercises.map((ex) => ex.naam.trim().toLowerCase()));
      const nieuw = migreerExercises(json.exercises);
      const toeTeVoegen = [];
      const overgeslagen = [];
      nieuw.forEach((ex) => {
        const sleutel = ex.naam.trim().toLowerCase();
        if (sleutel && bestaandeNamen.has(sleutel)) { overgeslagen.push(ex.naam); return; }
        if (sleutel) bestaandeNamen.add(sleutel);
        toeTeVoegen.push(ex);
      });
      if (toeTeVoegen.length) up({ exercises: [...data.exercises, ...toeTeVoegen] });
      let melding = `${toeTeVoegen.length} oefening(en) geïmporteerd.`;
      if (overgeslagen.length) melding += `\n\nOvergeslagen (naam bestond al):\n${overgeslagen.join("\n")}`;
      window.alert(melding);
    };
    reader.readAsText(file);
  };

  return (
    <div className="tabinhoud">
      <div className="tabkop">
        <h2>Bibliotheek</h2>
        <div className="segment">
          <button className={weergave === "oefeningen" ? "actief" : ""} onClick={() => setWeergave("oefeningen")}>Oefeningen</button>
          <button className={weergave === "simulaties" ? "actief" : ""} onClick={() => setWeergave("simulaties")}>Simulaties</button>
        </div>
        <button className="knop" onClick={() => importRef.current?.click()}><Upload size={14} /> Importeren</button>
        <input ref={importRef} type="file" accept=".json,application/json" style={{ display: "none" }}
          onChange={(e) => { if (e.target.files[0]) importeer(e.target.files[0]); e.target.value = ""; }} />
        <button className="knop primair" onClick={() => { setOpenScenId(null); setEditing(leegExercise()); }}>
          <Plus size={16} /> Nieuwe oefening
        </button>
      </div>
      {weergave === "oefeningen" && (<>
      <div className="filterbalk">
        <span className="filterikoon" style={{ marginRight: 2 }}><Layers size={13} /></span>
        <button className={"tagchip klikbaar" + (typeFilter === "alle" ? " actief" : "")} onClick={() => setTypeFilter("alle")}>Alle typen</button>
        {Object.entries(TRAININGSTYPEN).map(([k, v]) => (
          <button key={k} className={"tagchip klikbaar" + (typeFilter === k ? " actief" : "")}
            onClick={() => setTypeFilter(typeFilter === k ? "alle" : k)}>{v.label}</button>
        ))}
      </div>
      <div className="filterbalk">
        <button className={"filterchip" + (filter === "alle" ? " actief" : "")} onClick={() => setFilter("alle")}>Alle ({data.exercises.length})</button>
        {Object.entries(CATS).map(([k, v]) => {
          const n = data.exercises.filter((e) => e.cat === k).length;
          if (!n) return null;
          return (
            <button key={k} className={"filterchip" + (filter === k ? " actief" : "")}
              style={filter === k ? { background: v.bg, color: v.fg, borderColor: v.fg } : {}}
              onClick={() => setFilter(filter === k ? "alle" : k)}>{v.label} ({n})</button>
          );
        })}
      </div>
      {alleTags.length > 0 && (
        <div className="filterbalk tags">
          <Tag size={13} style={{ color: "#6E6E73", flexShrink: 0, alignSelf: "center" }} />
          {alleTags.map((t) => (
            <button key={t} className={"tagchip klikbaar" + (tagFilter === t ? " actief" : "")}
              onClick={() => setTagFilter(tagFilter === t ? null : t)}>{t}</button>
          ))}
        </div>
      )}
      {Object.entries(groepen).map(([cat, exs]) => (
        <div key={cat} className="bibgroep">
          <div className="bibgroepkop"><CatChip cat={cat} /></div>
          {exs.map((e) => (
            <div key={e.id} className="bibkaart" onClick={() => setEditing(e)}>
              <div className="bibkaartkop">
                <strong>{e.naam}</strong>
                <span className="bibmeta">
                  <EnergieIcon e={e.energie} />
                  <Clock size={13} /> {e.duurKort}–{e.duurLang} min
                  <Users size={13} /> {e.minDeel}–{e.maxDeel}
                  {e.sheets && <span className="sheetbadge">Sheet {e.sheets}</span>}
                </span>
              </div>
              {e.doel && <p className="bibdoel"><Target size={13} /> {e.doel}</p>}
              {e.instructie && <p className="bibinstructie">{e.instructie}</p>}
              <div className="bibvoet">
                {(e.typen || []).length > 0 && <span className="bibtag"><Layers size={12} /> {e.typen.map((t) => TRAININGSTYPEN[t]?.label || t).join(", ")}</span>}
                <TagLijst tags={e.tags} klein />
                {e.benodigd && <span className="bibtag">🎒 {e.benodigd}</span>}
                {e.ruimte && <span className="bibtag">📐 {e.ruimte}</span>}
                {e.volgorde && <span className="bibtag">↕ {e.volgorde}</span>}
                {e.scenarios?.length > 0 && <span className="bibtag"><VenetianMask size={12} /> {e.scenarios.length} scenario{e.scenarios.length > 1 ? "'s" : ""}</span>}
                {e.varianten && <span className="bibtag"><Layers size={12} /> {e.varianten.split("\n").filter(Boolean).length} varianten</span>}
                {e.notities?.length > 0 && <span className="bibtag"><StickyNote size={12} /> {e.notities.length} notitie{e.notities.length > 1 ? "s" : ""}</span>}
              </div>
            </div>
          ))}
        </div>
      ))}
      </>)}
      {weergave === "simulaties" && (
        <SimulatiesWeergave data={data} onOpen={(e, sid) => { setOpenScenId(sid); setEditing(e); }} />
      )}
      {editing && <ExerciseEditor ex={editing} onSave={save} onClose={() => { setEditing(null); setOpenScenId(null); }} onDelete={editing.id ? del : null}
        doelgroepen={data.doelgroepen} addDoelgroep={(n) => up((d) => (d.doelgroepen.includes(n) ? {} : { doelgroepen: [...d.doelgroepen, n] }))}
        openScenId={openScenId} trainingNaam={data.trainingNaam} />}
    </div>
  );
}

/* ---------- deelnemers ---------- */

function parsePlakNamen(tekst) {
  return tekst.split("\n").map((r) => r.trim()).filter(Boolean).map((r) => {
    const delen = r.split(/[\t;,]/).map((x) => x.trim()).filter(Boolean);
    const naam = delen[0] || "";
    let functie = "", mbti = "";
    delen.slice(1).forEach((deel) => {
      if (!mbti && normalizeMbti(deel)) mbti = normalizeMbti(deel);
      else if (!functie) functie = deel;
    });
    return { naam, functie, mbti };
  }).filter((p) => p.naam);
}

function DeelnemersTab({ data, up }) {
  const [selId, setSelId] = useState(null);
  const [wisselMode, setWisselMode] = useState(false);
  const [wisselA, setWisselA] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [plakTekst, setPlakTekst] = useState("");
  const [vervang, setVervang] = useState(false);
  const [overzicht, setOverzicht] = useState(null);
  const [hover, setHover] = useState(null);
  const [groepOpen, setGroepOpen] = useState(false);
  const [schaal1, setSchaal1] = useState("EI");
  const [schaal2, setSchaal2] = useState("PJ");
  const [schaal3, setSchaal3] = useState("");
  const fileRef = useRef(null);

  const dln = data.deelnemers;
  const plaatsing = (data.plaatsing || []).filter((id) => dln.some((d) => d.id === id));
  const richting = data.plaatsRichting || "links";
  const geplaatst = plaatsing.map((id) => dln.find((d) => d.id === id));
  const wachtrij = dln.filter((d) => !plaatsing.includes(d.id));
  const sel = dln.find((d) => d.id === selId);
  const isMbti = data.trainingType === "mbti";
  const mbtiKleuren = { ...MBTI_DEFAULT_KLEUREN, ...(data.mbtiKleuren || {}) };
  /* favoriete (dominante) proces: E+P of I+J → S/N-letter, anders T/F-letter */
  const dominanteLetter = (t) => ((t[0] === "E") === (t[3] === "P") ? t[1] : t[2]);
  const effKleur = (d) => {
    if (!isMbti) return d.kleur;
    const t = normalizeMbti(d.mbtiBest || d.mbtiGemeten);
    return t ? (mbtiKleuren[dominanteLetter(t)] || d.kleur) : d.kleur;
  };
  const typeVan = (d) => normalizeMbti(d.mbtiBest || d.mbtiGemeten);
  const gekozenDims = [...new Set([schaal1, schaal2, schaal3].filter(Boolean))]
    .map((k) => MBTI_DIMS[k]).sort((a, b) => a.pos - b.pos);
  const mbtiGroepen = gekozenDims
    .reduce((acc, dim) => acc.flatMap((c) => dim.letters.map((l) => [...c, { pos: dim.pos, letter: l }])), [[]])
    .map((combo) => ({
      label: combo.map((c) => c.letter).join(""),
      leden: dln.filter((d) => { const t = typeVan(d); return t && combo.every((c) => t[c.pos] === c.letter); }),
    }));
  const mbtiOnbekend = dln.filter((d) => !typeVan(d));
  const zetInOpstelling = () => {
    up({ plaatsing: [...mbtiGroepen.flatMap((g) => g.leden.map((d) => d.id)), ...mbtiOnbekend.map((d) => d.id)] });
    setSelId(null);
  };
  const opst = { vorm: "halvecirkel", links: 4, boven: 4, rechts: 4, ...(data.opstelling || {}) };
  const vorm = opst.vorm;
  const seatCount = vorm === "u"
    ? Math.max(1, (opst.links || 0) + (opst.boven || 0) + (opst.rechts || 0))
    : Math.max(dln.length, 1);

  const patch = (id, p) => up({ deelnemers: dln.map((d) => (d.id === id ? { ...d, ...p } : d)) });
  const patchPresentie = (id, dagId, p) => {
    const d = dln.find((x) => x.id === id);
    const pr = { status: "", toelichting: "", ...(d.presentie?.[dagId] || {}), ...p };
    patch(id, { presentie: { ...(d.presentie || {}), [dagId]: pr } });
  };
  const plaats = (id) => {
    if (geplaatst.length >= seatCount) { window.alert("Alle stoelen zijn bezet. Voeg stoelen toe (U-vorm) of zet iemand terug."); return; }
    up({ plaatsing: [...plaatsing, id] });
  };

  const voegLijstToe = (personen) => {
    const basis = vervang ? [] : dln;
    const basisPlaatsing = vervang ? [] : plaatsing;
    const nieuw = personen.map((p, i) => ({
      id: uid(), naam: p.naam, functie: p.functie || "",
      kleur: KLEURSET[(basis.length + i) % KLEURSET.length],
      leerwensen: "", lastig: "", bijz: "", memo: "", evaluatie: "", mbtiGemeten: p.mbti || "", mbtiBest: "", presentie: {},
    }));
    up({ deelnemers: [...basis, ...nieuw], plaatsing: basisPlaatsing });
    setImportOpen(false); setPlakTekst(""); setSelId(null);
  };

  const leesExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        if (!rows.length) return;
        const kop = rows[0].map((c) => String(c).toLowerCase());
        let naamCol = kop.findIndex((c) => /naam|name/.test(c));
        let funcCol = kop.findIndex((c) => /functie|rol|afdeling|team/.test(c));
        let mbtiCol = kop.findIndex((c) => /mbti|type/.test(c));
        const heeftKop = naamCol >= 0;
        if (naamCol < 0) naamCol = 0;
        const personen = rows.slice(heeftKop ? 1 : 0)
          .map((r) => ({
            naam: String(r[naamCol] || "").trim(),
            functie: funcCol >= 0 ? String(r[funcCol] || "").trim() : "",
            mbti: mbtiCol >= 0 ? normalizeMbti(r[mbtiCol]) : "",
          }))
          .filter((p) => p.naam);
        if (personen.length) voegLijstToe(personen);
        else window.alert("Geen namen gevonden. Zet de namen in de eerste kolom, of gebruik een kolomkop met 'naam'.");
      } catch (err) {
        window.alert("Kon dit bestand niet lezen als Excel.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const exporteerPresentie = () => {
    const metMbti = dln.some((p) => p.mbtiGemeten || p.mbtiBest);
    const rows = dln.map((p) => {
      const r = { Naam: p.naam, Functie: p.functie || "" };
      if (metMbti) { r["MBTI gemeten"] = p.mbtiGemeten || ""; r["MBTI best passend"] = p.mbtiBest || ""; }
      data.dagen.forEach((d, i) => {
        const t = d.titel || `Dag ${i + 1}`;
        const pr = p.presentie?.[d.id] || {};
        r[`${t} presentie`] = pr.status || "";
        r[`${t} toelichting`] = pr.toelichting || "";
      });
      r["Bijzonderheden"] = p.bijz || "";
      r["Eindronde / wensen"] = p.evaluatie || "";
      return r;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0] || { a: 1 }).map((k) => ({ wch: Math.max(14, k.length + 2) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Presentie");
    XLSX.writeFile(wb, "presentielijst.xlsx");
  };

  const klikPoppetje = (id) => {
    if (!wisselMode) { setSelId(id === selId ? null : id); return; }
    if (!wisselA) { setWisselA(id); return; }
    if (wisselA === id) { setWisselA(null); return; }
    const a = plaatsing.indexOf(wisselA), b = plaatsing.indexOf(id);
    if (a >= 0 && b >= 0) {
      const kopie = [...plaatsing];
      [kopie[a], kopie[b]] = [kopie[b], kopie[a]];
      up({ plaatsing: kopie });
    }
    setWisselA(null); setWisselMode(false);
  };

  const W = 720, H = 400, cx = W / 2, cy = H - 60, R = 300;
  const pos = (() => {
    if (vorm !== "u") {
      return [...Array(seatCount)].map((_, i) => {
        const a = seatCount === 1 ? Math.PI / 2 : Math.PI - (i * Math.PI) / (seatCount - 1);
        return { x: cx + R * Math.cos(a), y: cy - R * Math.sin(a) * 0.92 };
      });
    }
    const p = [];
    const L = opst.links || 0, T = opst.boven || 0, Rr = opst.rechts || 0;
    const legTop = 112, legBot = 306, topY = 64, lX = 82, rX = W - 82, tL = 156, tR = W - 156;
    for (let i = 0; i < L; i++) p.push({ x: lX, y: L === 1 ? (legTop + legBot) / 2 : legBot - (i * (legBot - legTop)) / (L - 1) });
    for (let j = 0; j < T; j++) p.push({ x: T === 1 ? W / 2 : tL + (j * (tR - tL)) / (T - 1), y: topY });
    for (let k = 0; k < Rr; k++) p.push({ x: rX, y: Rr === 1 ? (legTop + legBot) / 2 : legTop + (k * (legBot - legTop)) / (Rr - 1) });
    return p.length ? p : [{ x: cx, y: 180 }];
  })();
  const slots = [...Array(seatCount)].map(() => null);
  geplaatst.forEach((d, j) => {
    const idx = richting === "links" ? j : seatCount - 1 - j;
    if (idx >= 0 && idx < seatCount) slots[idx] = d;
  });

  const overzichtVeld = overzicht === "leerwensen" ? "leerwensen" : overzicht === "eindronde" ? "evaluatie" : "lastig";
  const overzichtLijst = [...geplaatst, ...wachtrij].filter((d) => (d[overzichtVeld] || "").trim());

  return (
    <div className="tabinhoud">
      <div className="tabkop">
        <h2>Deelnemersoverzicht</h2>
        <div className="rij" style={{ flex: "0 0 auto", gap: 8 }}>
          <button className={"knop klein" + (overzicht === "leerwensen" ? " ingedrukt" : "")}
            onClick={() => setOverzicht(overzicht === "leerwensen" ? null : "leerwensen")}><Target size={14} /> Leerwensen</button>
          <button className={"knop klein" + (overzicht === "lastig" ? " ingedrukt" : "")}
            onClick={() => setOverzicht(overzicht === "lastig" ? null : "lastig")}><Shield size={14} /> Lastig gedrag</button>
          <button className={"knop klein" + (overzicht === "eindronde" ? " ingedrukt" : "")}
            onClick={() => setOverzicht(overzicht === "eindronde" ? null : "eindronde")}><ClipboardCheck size={14} /> Eindronde</button>
          <button className="knop klein" onClick={() => setImportOpen(!importOpen)}><Upload size={14} /> Importeren</button>
          <button className="knop klein" onClick={exporteerPresentie} disabled={!dln.length}><Download size={14} /> Presentielijst (Excel)</button>
          <button className={"knop klein" + (wisselMode ? " ingedrukt" : "")} onClick={() => { setWisselMode(!wisselMode); setWisselA(null); }}>
            <ArrowLeftRight size={14} /> {wisselMode ? "Kies twee poppetjes…" : "Plekken wisselen"}
          </button>
          {plaatsing.length > 0 && (
            <button className="knop klein" onClick={() => { up({ plaatsing: [] }); setSelId(null); }}><RotateCcw size={14} /> Iedereen terugzetten</button>
          )}
          <button className="knop primair klein" onClick={() => {
            const nieuw = { id: uid(), naam: `Deelnemer ${dln.length + 1}`, kleur: KLEURSET[dln.length % KLEURSET.length], functie: "", leerwensen: "", lastig: "", bijz: "", memo: "", evaluatie: "", presentie: {} };
            up({ deelnemers: [...dln, nieuw] });
            setSelId(nieuw.id);
          }}><Plus size={15} /> Deelnemer</button>
        </div>
      </div>

      {importOpen && (
        <div className="kaart">
          <h3>Deelnemers importeren</h3>
          <p className="hint">Upload de Excel van de opdrachtgever (namen in de eerste kolom of onder een kop met "naam"; kolommen met functie en MBTI-type worden herkend), of plak hieronder een lijstje: één naam per regel, eventueel gevolgd door functie en/of gemeten type (bijv. "Sanne, Balie, ISTJ").</p>
          <div className="rij" style={{ marginTop: 10, alignItems: "center" }}>
            <button className="knop" onClick={() => fileRef.current?.click()}><Upload size={15} /> Excel-bestand kiezen</button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) leesExcel(f); e.target.value = ""; }} />
            <label className="checklabel" style={{ flex: "0 0 auto" }}>
              <input type="checkbox" checked={vervang} onChange={(e) => setVervang(e.target.checked)} /> Huidige lijst vervangen
            </label>
          </div>
          <Veld label="Of plak hier namen" breed>
            <textarea rows={4} value={plakTekst} onChange={(e) => setPlakTekst(e.target.value)} placeholder={"Sanne de Boer, Balie\nMo Yilmaz\tKlantcontact\nPetra van Dijk"} />
          </Veld>
          <button className="knop primair klein" disabled={!parsePlakNamen(plakTekst).length}
            onClick={() => voegLijstToe(parsePlakNamen(plakTekst))}>
            <Plus size={14} /> {parsePlakNamen(plakTekst).length || ""} deelnemer{parsePlakNamen(plakTekst).length === 1 ? "" : "s"} toevoegen
          </button>
        </div>
      )}

      {overzicht && (
        <div className="kaart">
          <h3>{overzicht === "leerwensen" ? "Leerwensen" : overzicht === "eindronde" ? "Eindronde / wensen volgende keer" : "Lastig gedrag om mee te leren werken"}</h3>
          {overzichtLijst.length === 0 && <p className="hint">Nog niets ingevuld. Tik op een poppetje en vul het veld in, dan verschijnt het hier met de naam erbij.</p>}
          {overzichtLijst.map((d) => (
            <div key={d.id} className="overzichtregel">
              <span className="overzichtnaam" style={{ background: effKleur(d), color: contrastKleur(effKleur(d)) }}>{d.naam}</span>
              <span className="overzichttekst">{d[overzichtVeld]}</span>
            </div>
          ))}
        </div>
      )}

      {wachtrij.length > 0 ? (
        <div className="kaart">
          <div className="tabkop" style={{ marginBottom: 4 }}>
            <h3 style={{ margin: 0 }}>Nog te plaatsen ({wachtrij.length})</h3>
            <div className="segment klein">
              <button className={richting === "links" ? "actief" : ""} onClick={() => up({ plaatsRichting: "links" })}>Begin links</button>
              <button className={richting === "rechts" ? "actief" : ""} onClick={() => up({ plaatsRichting: "rechts" })}>Begin rechts</button>
            </div>
          </div>
          <p className="hint">Tik tijdens de voorstelronde op een naam: die komt op de volgende stoel, {richting === "links" ? "van links naar rechts" : "van rechts naar links"}. Een lege stoel aantikken plaatst de eerste naam uit dit rijtje.</p>
          <div className="regchips" style={{ marginTop: 10 }}>
            {wachtrij.map((d) => (
              <button key={d.id} className="regchip" onClick={() => plaats(d.id)}>
                <span className="kleurdot" style={{ background: effKleur(d) }} />{d.naam}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="hint">De halve cirkel volgt de zitopstelling. Tik op een poppetje voor details, geef groepen dezelfde kleur, en gebruik "Plekken wisselen" als twee deelnemers van stoel ruilen. "Kennismaking starten" haalt iedereen van de stoelen zodat je ze tijdens de voorstelronde één voor één kunt plaatsen.</p>
      )}

      {isMbti && (
        <div className="kaart opstellingbalk no-print">
          <span className="stepperlabel">MBTI-kleuren:</span>
          {["E", "I", "S", "N", "T", "F", "J", "P"].map((p) => (
            <span key={p} className="stepper">
              <span className="mbtidot" style={{ background: mbtiKleuren[p] }} />{p}
              <input type="color" className="kleurinput" value={mbtiKleuren[p]}
                onChange={(e) => up({ mbtiKleuren: { ...mbtiKleuren, [p]: e.target.value } })} title={"Kleur voor " + p} />
            </span>
          ))}
          <span style={{ flex: 1 }} />
          <button className={"knop klein" + (groepOpen ? " ingedrukt" : "")} onClick={() => setGroepOpen(!groepOpen)}>
            <Users size={14} /> Groepsindeling
          </button>
        </div>
      )}

      {isMbti && groepOpen && (
        <div className="kaart">
          <div className="tabkop" style={{ marginBottom: 6 }}>
            <h3 style={{ margin: 0 }}>Groepsindeling</h3>
            <div className="rij" style={{ flex: "0 0 auto", gap: 8, alignItems: "center" }}>
              <select value={schaal1} onChange={(e) => setSchaal1(e.target.value)} style={{ width: "auto" }}>
                {Object.entries(MBTI_DIMS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={schaal2} onChange={(e) => setSchaal2(e.target.value)} style={{ width: "auto" }}>
                <option value="">+ geen</option>
                {Object.entries(MBTI_DIMS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={schaal3} onChange={(e) => setSchaal3(e.target.value)} style={{ width: "auto" }}>
                <option value="">+ geen</option>
                {Object.entries(MBTI_DIMS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <button className="knop klein primair" onClick={zetInOpstelling}><ArrowLeftRight size={13} /> Zet in opstelling</button>
            </div>
          </div>
          <p className="hint">Kies één schaal voor twee groepen, of combineer schalen voor vier of acht groepen. Ingedeeld op het best passende type; is dat er nog niet, dan telt het gemeten type. "Zet in opstelling" plaatst de groepen in deze volgorde van links naar rechts in de kring of U.</p>
          {mbtiGroepen.map((g) => (
            <div key={g.label} className="mbtigroep">
              <span className="mbtigroepkop">{g.label.split("").map((L, li) => (
                <span key={li} style={{ color: mbtiKleuren[L] || "#1D1D1F" }}>{L}</span>
              ))} <em>({g.leden.length})</em></span>
              <div className="regchips">
                {g.leden.map((d) => (
                  <span key={d.id} className="regchip" style={{ cursor: "default" }}>
                    <span className="kleurdot" style={{ background: effKleur(d) }} />{d.naam}
                    <span className="mbtiklein">{typeVan(d)}</span>
                  </span>
                ))}
                {g.leden.length === 0 && <span className="hint">niemand</span>}
              </div>
            </div>
          ))}
          {mbtiOnbekend.length > 0 && (
            <div className="mbtigroep">
              <span className="mbtigroepkop">Nog geen type <em>({mbtiOnbekend.length})</em></span>
              <div className="regchips">
                {mbtiOnbekend.map((d) => (
                  <span key={d.id} className="regchip" style={{ cursor: "default" }}>
                    <span className="kleurdot" style={{ background: effKleur(d) }} />{d.naam}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="kaart opstellingbalk no-print">
        <div className="segment klein">
          <button className={vorm !== "u" ? "actief" : ""} onClick={() => up({ opstelling: { ...opst, vorm: "halvecirkel" } })}>Halve cirkel</button>
          <button className={vorm === "u" ? "actief" : ""} onClick={() => up({ opstelling: { ...opst, vorm: "u" } })}>U-vorm</button>
        </div>
        {vorm === "u" && ["links", "boven", "rechts"].map((z) => (
          <span key={z} className="stepper">
            <span className="stepperlabel">{z === "boven" ? "Tegenover" : z === "links" ? "Links" : "Rechts"}</span>
            <IconBtn subtle title="Minder stoelen" onClick={() => up({ opstelling: { ...opst, [z]: Math.max(0, (opst[z] || 0) - 1) } })}>−</IconBtn>
            <strong>{opst[z] || 0}</strong>
            <IconBtn subtle title="Meer stoelen" onClick={() => up({ opstelling: { ...opst, [z]: Math.min(20, (opst[z] || 0) + 1) } })}>+</IconBtn>
          </span>
        ))}
        {vorm === "u" && geplaatst.length > seatCount && <span className="hint">Meer geplaatste deelnemers dan stoelen; voeg stoelen toe.</span>}
      </div>

      <div className="cirkelkaart">
        <div className="aantalbadge"><span className="aantalgetal">{dln.length}</span><span className="aantallabel">deelnemers</span></div>
        <svg viewBox={`0 0 ${W} ${H}`} className="cirkelsvg">
          {vorm !== "u" && <path d={`M ${cx - R} ${cy} A ${R} ${R * 0.92} 0 0 1 ${cx + R} ${cy}`} fill="none" stroke="#E5E5EA" strokeWidth="2" strokeDasharray="4 6" />}
          <rect x={cx - 44} y={cy - 4} width="88" height="34" rx="10" fill="#1D1D1F" />
          <text x={cx} y={cy + 18} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="600">Trainer</text>
          {slots.map((d, i) => {
            if (!d) {
              return (
                <g key={"leeg" + i} onClick={() => { if (wachtrij[0]) plaats(wachtrij[0].id); }}
                  style={{ cursor: wachtrij.length ? "pointer" : "default" }}>
                  <circle cx={pos[i].x} cy={pos[i].y} r="27" fill="#F5F5F7" stroke="#C9C9CE" strokeWidth="2" strokeDasharray="4 4" />
                </g>
              );
            }
            const actief = d.id === selId || d.id === wisselA;
            return (
              <g key={d.id} onClick={() => klikPoppetje(d.id)} style={{ cursor: "pointer" }}
                onMouseEnter={() => setHover({ d, i })} onMouseLeave={() => setHover(null)}>
                <circle cx={pos[i].x} cy={pos[i].y} r="27" fill={effKleur(d)}
                  stroke={actief ? "#1D1D1F" : "#fff"} strokeWidth={actief ? 3 : 2}
                  strokeDasharray={d.id === wisselA ? "5 4" : "none"} />
                <text x={pos[i].x} y={pos[i].y + 4} textAnchor="middle" fill={contrastKleur(effKleur(d))} fontSize="12" fontWeight="700">
                  {d.naam.length > 8 ? d.naam.slice(0, 7) + "…" : d.naam}
                </text>
                {(isMbti && normalizeMbti(d.mbtiBest || d.mbtiGemeten)) ? (
                  <text x={pos[i].x} y={pos[i].y + 46} textAnchor="middle" fill={effKleur(d)} fontSize="11" fontWeight="800">{normalizeMbti(d.mbtiBest || d.mbtiGemeten)}</text>
                ) : d.functie ? (
                  <text x={pos[i].x} y={pos[i].y + 44} textAnchor="middle" fill="#6E6E73" fontSize="10">{d.functie.slice(0, 14)}</text>
                ) : null}
              </g>
            );
          })}
          {hover && (hover.d.memo || "").trim() && (() => {
            const lijnen = wrapTekst(hover.d.memo.trim());
            const bw = Math.min(360, Math.max(...lijnen.map((l) => l.length)) * 6.6 + 24);
            const bh = lijnen.length * 16 + 14;
            const tx = Math.min(Math.max(pos[hover.i].x, bw / 2 + 6), W - bw / 2 - 6);
            let ty = pos[hover.i].y - 40 - bh;
            if (ty < 4) ty = pos[hover.i].y + 42;
            return (
              <g pointerEvents="none">
                <rect x={tx - bw / 2} y={ty} width={bw} height={bh} rx="9" fill="#1D1D1F" opacity="0.94" />
                {lijnen.map((l, li) => (
                  <text key={li} x={tx} y={ty + 20 + li * 16} textAnchor="middle" fill="#fff" fontSize="12">{l}</text>
                ))}
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="kaart">
        <h3>Algemene evaluatienotities</h3>
        <textarea rows={3} value={data.evalNotities || ""} onChange={(e) => up({ evalNotities: e.target.value })}
          placeholder="Mondelinge feedback uit het eindrondje, wensen voor een volgende keer, punten voor jezelf…" />
      </div>

      {sel && (
        <div className="kaart deelnemerdetail">
          <div className="rij" style={{ alignItems: "flex-end" }}>
            <Veld label="Voornaam"><input value={sel.naam} onChange={(e) => patch(sel.id, { naam: e.target.value })} /></Veld>
            <Veld label="Functie"><input value={sel.functie} onChange={(e) => patch(sel.id, { functie: e.target.value })} /></Veld>
            <div className="veld">
              <span className="veldlabel">Kleur</span>
              <div className="kleurrij">
                {KLEURSET.map((k) => (
                  <button key={k} className={"kleurbol" + (sel.kleur === k ? " gekozen" : "")} style={{ background: k }}
                    onClick={() => patch(sel.id, { kleur: k })} aria-label={"kleur " + k} />
                ))}
              </div>
            </div>
          </div>
          {isMbti && (
            <div className="rij">
              <Veld label="Gemeten type"><input value={sel.mbtiGemeten || ""} maxLength={4}
                onChange={(e) => patch(sel.id, { mbtiGemeten: e.target.value.toUpperCase() })} placeholder="bijv. ISTJ" /></Veld>
              <Veld label="Best passend type"><input value={sel.mbtiBest || ""} maxLength={4}
                onChange={(e) => patch(sel.id, { mbtiBest: e.target.value.toUpperCase() })} placeholder="invullen zodra bekend" /></Veld>
            </div>
          )}
          <Veld label="Leerwensen" breed><textarea rows={2} value={sel.leerwensen} onChange={(e) => patch(sel.id, { leerwensen: e.target.value })} /></Veld>
          <Veld label="Welk gedrag vindt deze deelnemer lastig?" breed><textarea rows={2} value={sel.lastig} onChange={(e) => patch(sel.id, { lastig: e.target.value })} /></Veld>
          <Veld label="Bijzonderheden" breed><textarea rows={2} value={sel.bijz} onChange={(e) => patch(sel.id, { bijz: e.target.value })} /></Veld>
          <Veld label="Geheugensteuntje (verschijnt als tekstwolkje bij aanwijzen van het poppetje)" breed>
            <input value={sel.memo || ""} onChange={(e) => patch(sel.id, { memo: e.target.value })} placeholder="Bijv. blond haar met paardenstaart, vroeg naar nazorgprotocol" />
          </Veld>
          <Veld label="Eindronde / wensen volgende keer" breed>
            <textarea rows={2} value={sel.evaluatie || ""} onChange={(e) => patch(sel.id, { evaluatie: e.target.value })} placeholder="Op- en aanmerkingen over vandaag, leerdoelen voor de volgende keer" />
          </Veld>

          <span className="veldlabel">Presentie</span>
          {data.dagen.map((d, i) => {
            const pr = sel.presentie?.[d.id] || {};
            return (
              <div key={d.id} className="presentierij">
                <span className="presentiedag">{d.titel || `Dag ${i + 1}`}</span>
                <select value={pr.status || ""} onChange={(e) => patchPresentie(sel.id, d.id, { status: e.target.value })}>
                  {PRESENTIE_OPTIES.map((o) => <option key={o} value={o}>{o || "—"}</option>)}
                </select>
                <input value={pr.toelichting || ""} onChange={(e) => patchPresentie(sel.id, d.id, { toelichting: e.target.value })}
                  placeholder="bijv. 09:20 binnen, om 15:00 weg" />
              </div>
            );
          })}
          <div className="modalvoet" style={{ paddingTop: 10 }}>
            {plaatsing.includes(sel.id) && (
              <button className="knop" onClick={() => up({ plaatsing: plaatsing.filter((x) => x !== sel.id) })}>
                <RotateCcw size={15} /> Terug naar te plaatsen
              </button>
            )}
            <span style={{ flex: 1 }} />
            <button className="knop danger" onClick={() => {
              up({ deelnemers: dln.filter((d) => d.id !== sel.id), plaatsing: plaatsing.filter((x) => x !== sel.id) });
              setSelId(null);
            }}>
              <Trash2 size={15} /> Verwijder deelnemer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- info & inpaklijst ---------- */

function InfoTab({ data, up, exMap, onRestore }) {
  const restoreRef = useRef(null);
  const org = data.org;
  const so = (k) => (e) => up({ org: { ...org, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value } });
  const sa = (k) => (e) => up({ org: { ...org, acteur: { ...org.acteur, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value } } });
  const [nieuwItem, setNieuwItem] = useState("");
  const [nieuweDG, setNieuweDG] = useState("");
  const [toonVerborgen, setToonVerborgen] = useState(false);

  const items = useMemo(() => {
    const set = new Map();
    data.dagen.forEach((d, di) => d.blokken.forEach((b) => {
      if (b.type !== "oef") return;
      const ex = exMap[b.exId];
      if (!ex || !ex.benodigd) return;
      ex.benodigd.split(",").map((s) => s.trim()).filter(Boolean).forEach((it) => {
        const key = it.toLowerCase();
        if (!set.has(key)) set.set(key, { naam: it, dagen: new Set() });
        set.get(key).dagen.add(d.titel || `Dag ${di + 1}`);
      });
    }));
    return [...set.values()];
  }, [data.dagen, exMap]);

  const zichtbaar = items.filter((it) => !data.inpakHidden[it.naam.toLowerCase()]);
  const verborgen = items.filter((it) => data.inpakHidden[it.naam.toLowerCase()]);
  const toggle = (naam) => up({ inpakChecked: { ...data.inpakChecked, [naam]: !data.inpakChecked[naam] } });
  const verberg = (naam, wel) => up({ inpakHidden: { ...data.inpakHidden, [naam.toLowerCase()]: wel } });

  return (
    <div className="tabinhoud">
      <div className="tabkop"><h2>Organisatie & inpaklijst</h2></div>
      <div className="infokolommen">
        <div className="kaart">
          <h3>Locatie & contact</h3>
          <Veld label="Adres locatie" breed><input value={org.adres} onChange={so("adres")} placeholder="Straat, plaats" /></Veld>
          <div className="rij">
            <Veld label="Contactpersoon"><input value={org.contact} onChange={so("contact")} /></Veld>
            <Veld label="Telefoonnummer"><input value={org.tel} onChange={so("tel")} /></Veld>
          </div>
          <Veld label="Locatie open vanaf"><input value={org.open} onChange={so("open")} placeholder="bijv. 08:15" /></Veld>
          <div className="rij checkrij">
            <label className="checklabel"><input type="checkbox" checked={org.beamer} onChange={so("beamer")} /> Beamer aanwezig</label>
            <label className="checklabel"><input type="checkbox" checked={org.flipover} onChange={so("flipover")} /> Flip-over aanwezig</label>
          </div>
          <div className="rij">
            <Veld label="Lunch">
              <select value={org.lunch} onChange={so("lunch")}>
                <option value="georganiseerd">Georganiseerd door locatie</option>
                <option value="zelf">Zelf regelen</option>
                <option value="geen">Geen lunch</option>
              </select>
            </Veld>
            <Veld label="Lunchtijd"><input value={org.lunchtijd} onChange={so("lunchtijd")} placeholder="12:30" /></Veld>
          </div>
          <label className="checklabel" style={{ marginBottom: 12 }}>
            <input type="checkbox" checked={org.lunchflex} onChange={so("lunchflex")} /> Lunchtijd is flexibel
          </label>

          <div className="acteurvak">
            <label className="checklabel" style={{ fontWeight: 700 }}>
              <input type="checkbox" checked={org.acteur.aanwezig} onChange={sa("aanwezig")} />
              <VenetianMask size={16} /> Trainingsacteur aanwezig
            </label>
            {org.acteur.aanwezig && (
              <div className="rij" style={{ marginTop: 10 }}>
                <Veld label="Naam acteur"><input value={org.acteur.naam} onChange={sa("naam")} /></Veld>
                <Veld label="Aanwezig van"><input value={org.acteur.van} onChange={sa("van")} placeholder="13:00" /></Veld>
                <Veld label="Tot"><input value={org.acteur.tot} onChange={sa("tot")} placeholder="16:30" /></Veld>
              </div>
            )}
          </div>
          <Veld label="Notities" breed><textarea rows={3} value={org.notities} onChange={so("notities")} placeholder="Parkeren, sleutel ophalen, zaalindeling…" /></Veld>
          <span className="veldlabel">QR-links (evaluatie, hand-outs…)</span>
          <p className="hint" style={{ margin: "4px 0 8px" }}>Elke link hieronder krijgt een eigen QR-code via de knop in het draaiboek. Werkt met elk deelbaar webadres, dus ook een Google Docs-deellink of een pCloud-sharelink voor een hand-out.</p>
          {(org.qrLinks || []).map((l) => (
            <div key={l.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <input value={l.label} placeholder="Naam (bijv. Hand-out)" style={{ flex: "0 0 160px" }}
                onChange={(e) => up({ org: { ...org, qrLinks: org.qrLinks.map((x) => (x.id === l.id ? { ...x, label: e.target.value } : x)) } })} />
              <input value={l.url} placeholder="https://…" style={{ flex: 1 }}
                onChange={(e) => up({ org: { ...org, qrLinks: org.qrLinks.map((x) => (x.id === l.id ? { ...x, url: e.target.value } : x)) } })} />
              <IconBtn subtle danger title="Link verwijderen"
                onClick={() => up({ org: { ...org, qrLinks: org.qrLinks.filter((x) => x.id !== l.id) } })}><X size={14} /></IconBtn>
            </div>
          ))}
          <button className="knop klein" style={{ marginBottom: 12, alignSelf: "flex-start" }}
            onClick={() => up({ org: { ...org, qrLinks: [...(org.qrLinks || []), { id: uid(), label: "", url: "" }] } })}>
            <Plus size={13} /> QR-link toevoegen
          </button>
          <br />
          <span className="veldlabel">Reservekopie</span>
          <p className="hint" style={{ margin: "4px 0 8px" }}>De Backup-knop bovenin bewaart álle trainingen en de bibliotheek als bestand. Hier zet je zo'n bestand terug.</p>
          <button className="knop klein" onClick={() => restoreRef.current?.click()}><Upload size={13} /> Backup terugzetten</button>
          <input ref={restoreRef} type="file" accept=".json,application/json" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f && onRestore) onRestore(f); e.target.value = ""; }} />
          <span className="veldlabel">Doelgroepen beheren</span>
          <div className="regchips" style={{ marginTop: 6 }}>
            {data.doelgroepen.map((dg) => (
              <span key={dg} className="regchip" style={{ display: "inline-flex", alignItems: "center", gap: 5, cursor: "default" }}>
                {dg}
                <X size={12} style={{ cursor: "pointer" }} onClick={() => up({
                  doelgroepen: data.doelgroepen.filter((x) => x !== dg),
                  trainingDoelgroepen: (data.trainingDoelgroepen || []).filter((x) => x !== dg),
                })} />
              </span>
            ))}
            <input className="minitoevoeg" value={nieuweDG} placeholder="+ doelgroep" onChange={(e) => setNieuweDG(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && nieuweDG.trim()) {
                  if (!data.doelgroepen.includes(nieuweDG.trim())) up({ doelgroepen: [...data.doelgroepen, nieuweDG.trim()] });
                  setNieuweDG("");
                }
              }} />
          </div>
        </div>

        <div className="kaart">
          <h3>Inpaklijst</h3>
          <span className="veldlabel">Basislijst (altijd mee)</span>
          {data.inpakBasis.map((it, i) => (
            <div key={"b" + i} className={"inpakitem" + (data.inpakChecked[it] ? " klaar" : "")} onClick={() => toggle(it)} role="button" tabIndex={0}>
              {data.inpakChecked[it] ? <CheckSquare size={17} /> : <Square size={17} />}
              <span className="inpaknaam">{it}</span>
              <IconBtn subtle title="Van basislijst verwijderen" onClick={() => up({ inpakBasis: data.inpakBasis.filter((_, j) => j !== i) })}><X size={13} /></IconBtn>
            </div>
          ))}
          <div className="rij" style={{ margin: "8px 0 16px" }}>
            <input value={nieuwItem} onChange={(e) => setNieuwItem(e.target.value)} placeholder="Item toevoegen aan basislijst"
              onKeyDown={(e) => { if (e.key === "Enter" && nieuwItem.trim()) { up({ inpakBasis: [...data.inpakBasis, nieuwItem.trim()] }); setNieuwItem(""); } }} />
            <button className="knop" style={{ flex: "0 0 auto" }} onClick={() => { if (nieuwItem.trim()) { up({ inpakBasis: [...data.inpakBasis, nieuwItem.trim()] }); setNieuwItem(""); } }}><Plus size={15} /></button>
          </div>

          <span className="veldlabel">Uit het draaiboek</span>
          {zichtbaar.length === 0 && <p className="hint">Geen extra spullen gevonden in de geplande oefeningen.</p>}
          {zichtbaar.map((it) => (
            <div key={it.naam} className={"inpakitem" + (data.inpakChecked[it.naam] ? " klaar" : "")} onClick={() => toggle(it.naam)} role="button" tabIndex={0}>
              {data.inpakChecked[it.naam] ? <CheckSquare size={17} /> : <Square size={17} />}
              <span className="inpaknaam">{it.naam}</span>
              <span className="inpakdagen">{[...it.dagen].join(", ")}</span>
              <IconBtn subtle title="Niet meenemen (verbergen)" onClick={() => verberg(it.naam, true)}><EyeOff size={14} /></IconBtn>
            </div>
          ))}
          {verborgen.length > 0 && (
            <button className="knop klein" style={{ marginTop: 10 }} onClick={() => setToonVerborgen(!toonVerborgen)}>
              <Eye size={13} /> {toonVerborgen ? "Verberg" : `Toon ${verborgen.length} verborgen item${verborgen.length > 1 ? "s" : ""}`}
            </button>
          )}
          {toonVerborgen && verborgen.map((it) => (
            <div key={it.naam} className="inpakitem verborgen" role="button" tabIndex={0} onClick={() => verberg(it.naam, false)}>
              <EyeOff size={15} />
              <span className="inpaknaam">{it.naam}</span>
              <span className="inpakdagen">tik om terug te zetten</span>
            </div>
          ))}
          <button className="knop" style={{ marginTop: 14 }} onClick={() => up({ inpakChecked: {} })}><RotateCcw size={14} /> Alles uitvinken</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- export (tekst) ---------- */

function pushScenarioTekst(r, s, pad = "     ") {
  SCENARIO_VELDEN.forEach(([k, l]) => {
    if (k === "persoon" || !s[k]) return;
    r.push("\v");
    if (k === "zinnen") { r.push(`${pad}${l}:`); s[k].split("\n").filter(Boolean).forEach((z) => r.push(`${pad}  „${z.trim()}”`)); return; }
    r.push(`${pad}${l}: ${s[k]}`);
  });
  (s.eigen || []).forEach((eg) => { if (eg.kop || eg.tekst) { r.push("\v", `${pad}${eg.kop || "Kopje"}: ${eg.tekst}`); } });
}

function buildExportText(data, exMap, mode) {
  const r = [];
  if (mode === "acteur") {
    const kop = `Acteursbriefing · ${data.trainingNaam}`;
    r.push(kop, "=".repeat(kop.length), "");
    const sel = data.trainingDoelgroepen || [];
    if (sel.length) r.push(`Doelgroep(en): ${sel.join(", ")}`, "");
    if (data.org.acteur?.aanwezig && (data.org.acteur.van || data.org.acteur.tot)) r.push(`Aanwezig: ${data.org.acteur.van || "?"}–${data.org.acteur.tot || "?"}`, "");
    const match = (s) => !sel.length || !(s.doelgroepen || []).length || (s.doelgroepen || []).some((x) => sel.includes(x));
    const gezien = new Set();
    const oefeningen = [];
    data.dagen.forEach((d) => d.blokken.forEach((b) => {
      if (b.type !== "oef" || gezien.has(b.exId)) return;
      gezien.add(b.exId);
      const ex = exMap[b.exId];
      if (ex) oefeningen.push(ex);
    }));
    const acteurOef = oefeningen.filter((ex) => ex.cat === "acteur" || ex.cat === "simulatie");
    if (acteurOef.length) r.push("OEFENINGEN MET ACTEUR", "=====================", "");
    const voorOefeningen = r.length;
    acteurOef.forEach((ex) => {
      r.push(`▪ ${ex.naam}`, `  ${CATS[ex.cat]?.label || ""} · ${ex.duurKort}–${ex.duurLang} min · ${ex.minDeel}–${ex.maxDeel} deelnemers${ex.sheets ? " · sheet " + ex.sheets : ""}`);
      if (ex.doel) r.push(`  Doel: ${ex.doel}`);
      if (ex.benodigd) r.push(`  Benodigd: ${ex.benodigd}`);
      if (ex.ruimte) r.push(`  Ruimte: ${ex.ruimte}`);
      if (ex.volgorde) r.push(`  Volgorde: ${ex.volgorde}`);
      if (ex.instructie) r.push(`  ${ex.instructie}`);
      if (ex.varianten) r.push(`  Varianten: ${ex.varianten.split("\n").filter(Boolean).join(" / ")}`);
      r.push("");
      (ex.scenarios || []).filter(match).forEach((s) => {
        const h = ["", "licht", "middel", "heftig"][s.heftigheid || 0];
        r.push("\f", `■ ${ex.naam}`);
        if (ex.doel) r.push(`  Doel: ${ex.doel}`);
        r.push("", `  ── ${s.titel || "Scenario"}${s.persoon ? " · " + s.persoon : ""}${h ? " · heftigheid: " + h : ""}${s.fysiekeDreiging ? " · fysieke dreiging" : ""}${s.persoonlijk ? " · PERSOONLIJK" + (s.vanDeelnemer ? " (" + s.vanDeelnemer + ")" : "") : ""}${(s.doelgroepen || []).length ? " · " + s.doelgroepen.join(" / ") : ""}`);
        pushScenarioTekst(r, s);
        r.push("");
      });
    });
    if (!acteurOef.length) r.push("Geen praktijksimulaties met scenario's gevonden in dit draaiboek.");
    return r.join("\n");
  }
  if (mode !== "kaartjes") {
    r.push(`${data.trainingNaam}`, "=".repeat(data.trainingNaam.length), "");
    if (data.org.adres) r.push(`Locatie: ${data.org.adres}`);
    if (data.org.contact) r.push(`Contact: ${data.org.contact}${data.org.tel ? " · " + data.org.tel : ""}`);
    if (data.org.open) r.push(`Open vanaf: ${data.org.open}`);
    if (data.org.acteur?.aanwezig) r.push(`Acteur: ${data.org.acteur.naam || "?"} (${data.org.acteur.van || "?"}–${data.org.acteur.tot || "?"})`);
    r.push("");
    data.dagen.forEach((d, di) => {
      r.push(`${d.titel || "Dag " + (di + 1)}  (${d.start}–${d.eind})`, "-".repeat(30));
      if (d.doelen) r.push(`Doelen: ${d.doelen}`, "");
      const offs = plannedOffsets(d.blokken, exMap);
      const s0 = timeToMin(d.start) ?? 540;
      d.blokken.forEach((b, i) => {
        const t = minToTime(s0 + offs[i]);
        if (b.type === "punt") { r.push(`      ⚑ ${b.tekst}${b.done ? " ✔" : ""}`); return; }
        const dur = blokDuur(b, exMap);
        if (b.type === "pauze") { r.push(`${t}  ${b.tekst || "Pauze"} (${fmtDur(dur)})`); return; }
        const ex = exMap[b.exId];
        if (!ex) return;
        const duurTekst = b.reserve ? fmtDur(b.versie === "lang" ? ex.duurLang : ex.duurKort) : fmtDur(dur);
        r.push(`${b.reserve ? "res.  " : t + "  "}${b.done ? "✔ " : ""}${ex.naam}${b.reserve ? "  «RESERVE»" : ""} (${duurTekst}${b.versie === "lang" ? ", uitgebreid" : ""})${ex.sheets ? "  [sheet " + ex.sheets + "]" : ""}${b.skippedFrom ? "  «doorgeschoven van " + b.skippedFrom + "»" : ""}`);
      });
      const benodigd = new Set();
      d.blokken.forEach((b) => { const ex = b.type === "oef" && exMap[b.exId]; if (ex && ex.benodigd) ex.benodigd.split(",").forEach((s) => s.trim() && benodigd.add(s.trim())); });
      if (benodigd.size) r.push("", `Benodigdheden: ${[...benodigd].join(", ")}`);
      r.push("");
    });
  }
  if (mode !== "draaiboek") {
    r.push("INSTRUCTIEKAARTJES", "==================", "");
    const gezien = new Set();
    data.dagen.forEach((d) => d.blokken.forEach((b) => {
      if (b.type !== "oef" || gezien.has(b.exId)) return;
      gezien.add(b.exId);
      const ex = exMap[b.exId];
      if (!ex) return;
      r.push(`▪ ${ex.naam}`, `  ${CATS[ex.cat]?.label || ""} · ${ex.duurKort}–${ex.duurLang} min · ${ex.minDeel}–${ex.maxDeel} deelnemers${ex.sheets ? " · sheet " + ex.sheets : ""}`);
      if (ex.doel) r.push(`  Doel: ${ex.doel}`);
      if (ex.benodigd) r.push(`  Benodigd: ${ex.benodigd}`);
      if (ex.ruimte) r.push(`  Ruimte: ${ex.ruimte}`);
      if (ex.volgorde) r.push(`  Volgorde: ${ex.volgorde}`);
      if (ex.instructie) r.push(`  ${ex.instructie}`);
      (ex.scenarios || []).forEach((s) => {
        const h = ["", "licht", "middel", "heftig"][s.heftigheid || 0];
        r.push(`  ── Scenario: ${s.titel || "naamloos"}${s.persoon ? " · " + s.persoon : ""}${h ? " · heftigheid: " + h : ""}${s.fysiekeDreiging ? " · fysieke dreiging" : ""}${s.persoonlijk ? " · PERSOONLIJK" + (s.vanDeelnemer ? " (" + s.vanDeelnemer + ")" : "") : ""}`);
        pushScenarioTekst(r, s);
      });
      if (ex.varianten) r.push(`  Varianten: ${ex.varianten.split("\n").filter(Boolean).join(" / ")}`);
      r.push("");
    }));
  }
  return r.join("\n");
}

function buildScenarioExportText(ex, s, data) {
  const r = [];
  const kop = `Acteursbriefing · ${ex.naam}`;
  r.push(kop, "=".repeat(kop.length), "");
  r.push(`Training: ${data.trainingNaam}`);
  if (ex.doel) r.push(`Doel: ${ex.doel}`);
  r.push("");
  const h = ["", "licht", "middel", "heftig"][s.heftigheid || 0];
  r.push(`── ${s.titel || "Scenario"}${s.persoon ? " · " + s.persoon : ""}${h ? " · heftigheid: " + h : ""}${s.fysiekeDreiging ? " · fysieke dreiging" : ""}${s.persoonlijk ? " · PERSOONLIJK" + (s.vanDeelnemer ? " (" + s.vanDeelnemer + ")" : "") : ""}${(s.doelgroepen || []).length ? " · " + s.doelgroepen.join(" / ") : ""}`);
  pushScenarioTekst(r, s, "  ");
  return r.join("\n");
}

function buildOefeningExportText(ex, data) {
  const r = [];
  const kop = `Instructiekaart · ${ex.naam}`;
  r.push(kop, "=".repeat(kop.length), "");
  r.push(`Training: ${data.trainingNaam}`);
  r.push(`${CATS[ex.cat]?.label || ""} · ${ex.duurKort}–${ex.duurLang} min · ${ex.minDeel}–${ex.maxDeel} deelnemers${ex.sheets ? " · sheet " + ex.sheets : ""}`);
  if (ex.doel) r.push(`Doel: ${ex.doel}`);
  if (ex.benodigd) r.push(`Benodigd: ${ex.benodigd}`);
  if (ex.ruimte) r.push(`Ruimte: ${ex.ruimte}`);
  if (ex.volgorde) r.push(`Volgorde: ${ex.volgorde}`);
  if (ex.instructie) r.push(ex.instructie);
  if (ex.varianten) r.push(`Varianten: ${ex.varianten.split("\n").filter(Boolean).join(" / ")}`);
  (ex.scenarios || []).forEach((s) => {
    const h = ["", "licht", "middel", "heftig"][s.heftigheid || 0];
    r.push("\f", `── ${s.titel || "Scenario"}${s.persoon ? " · " + s.persoon : ""}${h ? " · heftigheid: " + h : ""}${s.fysiekeDreiging ? " · fysieke dreiging" : ""}${s.persoonlijk ? " · PERSOONLIJK" + (s.vanDeelnemer ? " (" + s.vanDeelnemer + ")" : "") : ""}${(s.doelgroepen || []).length ? " · " + s.doelgroepen.join(" / ") : ""}`);
    pushScenarioTekst(r, s, "  ");
  });
  return r.join("\n");
}

function ScenarioExportOverlay({ ex, s, data, onClose }) {
  const [gekopieerd, setGekopieerd] = useState(false);
  const tekst = buildScenarioExportText(ex, s, data);
  const kopieer = async () => {
    const platteTekst = tekst.replace(/\v/g, "");
    try { await navigator.clipboard.writeText(platteTekst); setGekopieerd(true); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = platteTekst; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); setGekopieerd(true); } catch {}
      document.body.removeChild(ta);
    }
    setTimeout(() => setGekopieerd(false), 2000);
  };
  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div className="modal groot" onClick={(e) => e.stopPropagation()}>
        <div className="modalkop no-print">
          <strong>Scenario exporteren: {s.titel || "Scenario"}</strong>
          <IconBtn title="Sluiten" onClick={onClose}><X size={18} /></IconBtn>
        </div>
        <ExportPagina pag={tekst} klasse="exporttekst print-area" />
        <div className="modalvoet no-print">
          <button className="knop" onClick={() => window.print()}><Printer size={15} /> Afdrukken / PDF</button>
          <span style={{ flex: 1 }} />
          <button className="knop primair" onClick={kopieer}>{gekopieerd ? <><Check size={15} /> Gekopieerd</> : <><Copy size={15} /> Kopieer tekst</>}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function OefeningExportOverlay({ ex, data, onClose }) {
  const [gekopieerd, setGekopieerd] = useState(false);
  const tekst = buildOefeningExportText(ex, data);
  const kopieer = async () => {
    const platteTekst = tekst.replace(/\f/g, "").replace(/\v/g, "");
    try { await navigator.clipboard.writeText(platteTekst); setGekopieerd(true); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = platteTekst; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); setGekopieerd(true); } catch {}
      document.body.removeChild(ta);
    }
    setTimeout(() => setGekopieerd(false), 2000);
  };
  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div className="modal groot" onClick={(e) => e.stopPropagation()}>
        <div className="modalkop no-print">
          <strong>Oefening exporteren: {ex.naam}</strong>
          <IconBtn title="Sluiten" onClick={onClose}><X size={18} /></IconBtn>
        </div>
        <ExportTekst tekst={tekst} />
        <div className="modalvoet no-print">
          <button className="knop" onClick={() => window.print()}><Printer size={15} /> Afdrukken / PDF</button>
          <span style={{ flex: 1 }} />
          <button className="knop primair" onClick={kopieer}>{gekopieerd ? <><Check size={15} /> Gekopieerd</> : <><Copy size={15} /> Kopieer tekst</>}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ExportPagina({ pag, klasse }) {
  const delen = pag.split("\v").map((d) => d.replace(/^\n/, "")).filter(Boolean);
  if (delen.length < 2) return <pre className={klasse + " scenariogroep"}>{pag}</pre>;
  return (
    <div className={klasse + " scenariogroep"}>
      {delen.map((d, i) => <div key={i} className="exportveld">{d}</div>)}
    </div>
  );
}

function ExportTekst({ tekst }) {
  const groepen = tekst.split("\f");
  if (groepen.length < 2) return <ExportPagina pag={tekst} klasse="exporttekst print-area" />;
  return (
    <div className="exporttekst print-area">
      {groepen.map((groep, i) => <ExportPagina key={i} pag={groep} klasse="scenarioblok" />)}
    </div>
  );
}

function ExportOverlay({ data, exMap, onClose }) {
  const [mode, setMode] = useState("alles");
  const [gekopieerd, setGekopieerd] = useState(false);
  const tekst = buildExportText(data, exMap, mode);
  const kopieer = async () => {
    const platteTekst = tekst.replace(/\f/g, "").replace(/\v/g, "");
    try { await navigator.clipboard.writeText(platteTekst); setGekopieerd(true); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = platteTekst; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); setGekopieerd(true); } catch {}
      document.body.removeChild(ta);
    }
    setTimeout(() => setGekopieerd(false), 2000);
  };
  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div className="modal groot" onClick={(e) => e.stopPropagation()}>
        <div className="modalkop no-print">
          <strong>Exporteren</strong>
          <div className="segment">
            {[["alles", "Alles"], ["draaiboek", "Draaiboek"], ["kaartjes", "Instructiekaartjes"], ["acteur", "Acteursbriefing"]].map(([k, l]) => (
              <button key={k} className={mode === k ? "actief" : ""} onClick={() => setMode(k)}>{l}</button>
            ))}
          </div>
          <IconBtn title="Sluiten" onClick={onClose}><X size={18} /></IconBtn>
        </div>
        <ExportTekst tekst={tekst} />
        <div className="modalvoet no-print">
          <button className="knop" onClick={() => window.print()}><Printer size={15} /> Afdrukken / PDF</button>
          <span style={{ flex: 1 }} />
          <button className="knop primair" onClick={kopieer}>{gekopieerd ? <><Check size={15} /> Gekopieerd</> : <><Copy size={15} /> Kopieer tekst</>}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------- QR-code evaluatieformulier ---------- */

function QrOverlay({ links, onClose }) {
  const ref = useRef(null);
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState("laden");
  const [gekopieerd, setGekopieerd] = useState(false);
  const link = links[Math.min(idx, links.length - 1)];
  useEffect(() => {
    let weg = false;
    setStatus("laden");
    const render = () => {
      if (weg || !ref.current) return;
      try {
        ref.current.innerHTML = "";
        new window.QRCode(ref.current, { text: link.url, width: 300, height: 300, correctLevel: window.QRCode.CorrectLevel.M });
        setStatus("ok");
      } catch { setStatus("fout"); }
    };
    if (window.QRCode) { render(); return; }
    const sc = document.createElement("script");
    sc.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    sc.onload = render;
    sc.onerror = () => { if (!weg) setStatus("fout"); };
    document.body.appendChild(sc);
    const t = setTimeout(() => { if (!window.QRCode && !weg) setStatus("fout"); }, 5000);
    return () => { weg = true; clearTimeout(t); };
  }, [link.url]);
  const kopieer = async () => {
    try { await navigator.clipboard.writeText(link.url); setGekopieerd(true); setTimeout(() => setGekopieerd(false), 2000); } catch {}
  };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal qr" onClick={(e) => e.stopPropagation()}>
        <div className="modalkop">
          <strong>{link.label || "QR-code"}</strong>
          <IconBtn title="Sluiten" onClick={onClose}><X size={18} /></IconBtn>
        </div>
        {links.length > 1 && (
          <div style={{ padding: "12px 18px 0" }}>
            <div className="segment">
              {links.map((l, i) => (
                <button key={l.id || i} className={i === idx ? "actief" : ""} onClick={() => setIdx(i)}>{l.label || "Link " + (i + 1)}</button>
              ))}
            </div>
          </div>
        )}
        <div className="qrvak">
          {status !== "fout" ? <div ref={ref} className="qrcode" /> : (
            <p className="qrfout">De QR-code kon hier niet worden geladen. Deel de link hieronder; in de losse websiteversie werkt de QR wel gewoon.</p>
          )}
          <p className="qrlink">{link.url}</p>
          <button className="knop" onClick={kopieer}>{gekopieerd ? <><Check size={15} /> Gekopieerd</> : <><Copy size={15} /> Kopieer link</>}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- draaiboek (tijdlijn + live) ---------- */

function DraaiboekTab({ data, up, exMap, nu }) {
  const [dagIdx, setDagIdx] = useState(0);
  const [poolFilter, setPoolFilter] = useState("alle");
  const [expanded, setExpanded] = useState(null);
  const [dropIdx, setDropIdx] = useState(null);
  const [instOpen, setInstOpen] = useState(false);
  const [notitieVoor, setNotitieVoor] = useState(null);
  const [notitieTekst, setNotitieTekst] = useState("");
  const [openScen, setOpenScen] = useState(null);
  const [regScen, setRegScen] = useState(null);
  const [regWie, setRegWie] = useState([]);
  const [regNotitie, setRegNotitie] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [scenExport, setScenExport] = useState(null);
  const [oefExport, setOefExport] = useState(null);

  const di = Math.min(dagIdx, data.dagen.length - 1);
  const dag = data.dagen[di];
  const live = data.live && data.live.dagIdx === di ? data.live : null;

  const setDag = (patch) => up({ dagen: data.dagen.map((d, i) => (i === di ? { ...d, ...patch } : d)) });
  const setBlokken = (blokken) => setDag({ blokken });
  const patchBlok = (id, p) => setBlokken(dag.blokken.map((b) => (b.id === id ? { ...b, ...p } : b)));

  const offs = plannedOffsets(dag.blokken, exMap);
  const s0 = timeToMin(dag.start) ?? 540;
  const eMin = timeToMin(dag.eind) ?? s0 + 420;
  const beschikbaar = Math.max(0, eMin - s0);
  const gepland = dag.blokken.reduce((a, b) => a + blokDuur(b, exMap), 0);
  const over = beschikbaar - gepland;
  const signaal = over < 0 ? "rood" : over < 15 ? "oranje" : "groen";
  const signaalTekst = over < 0 ? `${fmtDur(-over)} te veel gepland` : over < 15 ? `krap: ${fmtDur(over)} over` : `${fmtDur(over)} speling`;

  let liveInfo = null;
  if (live) {
    const elapsed = Math.round((nu - live.startMs) / 60000);
    const cur = Math.min(live.curIdx, Math.max(0, dag.blokken.length - 1));
    const delta = elapsed - (offs[cur] ?? 0);
    const restGepland = gepland - (offs[cur] ?? 0);
    const restEcht = beschikbaar - elapsed;
    liveInfo = { elapsed, cur, delta, uitloop: restGepland - restEcht };
  }

  const selDoel = data.trainingDoelgroepen || [];
  const scenMatch = (s) => !selDoel.length || !(s.doelgroepen || []).length || (s.doelgroepen || []).some((x) => selDoel.includes(x));
  const qrLinks = (data.org.qrLinks || []).filter((l) => (l.url || "").trim());

  const voegToe = (blok, index = null) => {
    const b2 = [...dag.blokken];
    b2.splice(index === null ? b2.length : index, 0, blok);
    setBlokken(b2);
  };
  const verplaats = (from, to) => {
    if (to < 0 || to > dag.blokken.length) return;
    const b2 = [...dag.blokken];
    const [it] = b2.splice(from, 1);
    b2.splice(from < to ? to - 1 : to, 0, it);
    setBlokken(b2);
  };
  const skipBlok = (i) => {
    const blok = dag.blokken[i];
    const rest = dag.blokken.filter((_, j) => j !== i);
    const label = dag.titel || `Dag ${di + 1}`;
    if (di + 1 < data.dagen.length) {
      up({
        dagen: data.dagen.map((d, j) => {
          if (j === di) return { ...d, blokken: rest };
          if (j === di + 1) return { ...d, blokken: [...d.blokken, { ...blok, skippedFrom: label, done: false }] };
          return d;
        }),
      });
    } else if (window.confirm("Dit is de laatste dag. Nieuwe dag aanmaken en de oefening daarheen doorschuiven?")) {
      up({
        dagen: [
          ...data.dagen.map((d, j) => (j === di ? { ...d, blokken: rest } : d)),
          { id: uid(), titel: `Dag ${data.dagen.length + 1}`, start: dag.start, eind: dag.eind, doelen: "", blokken: [{ ...blok, skippedFrom: label, done: false }] },
        ],
      });
    }
  };

  const startLive = () => up({ live: { dagIdx: di, startMs: Date.now(), curIdx: 0 } });
  const stopLive = () => up({ live: null });
  const volgendeLive = () => {
    if (!live) return;
    const cur = dag.blokken[Math.min(live.curIdx, dag.blokken.length - 1)];
    if (cur) patchBlok(cur.id, { done: true });
    if (live.curIdx >= dag.blokken.length - 1) { up({ live: null }); return; }
    up({ live: { ...live, curIdx: live.curIdx + 1 } });
  };

  const bewaarNotitie = (exId) => {
    if (!notitieTekst.trim()) { setNotitieVoor(null); return; }
    up({
      exercises: data.exercises.map((e) =>
        e.id === exId ? { ...e, notities: [...(e.notities || []), { datum: vandaag(), groep: data.trainingNaam, tekst: notitieTekst.trim() }] } : e
      ),
    });
    setNotitieVoor(null); setNotitieTekst("");
  };

  const registreerUitvoering = (exId, scenId) => {
    if (!regWie.length && !regNotitie.trim()) { setRegScen(null); return; }
    up({
      exercises: data.exercises.map((e) =>
        e.id !== exId ? e : {
          ...e,
          scenarios: e.scenarios.map((s) =>
            s.id !== scenId ? s : { ...s, uitvoeringen: [...(s.uitvoeringen || []), { datum: vandaag(), wie: [...regWie], notitie: regNotitie.trim() }] }
          ),
        }
      ),
    });
    setRegScen(null); setRegWie([]); setRegNotitie("");
  };

  const poolLijst = data.exercises.filter((e) =>
    (poolFilter === "alle" || e.cat === poolFilter) &&
    (!(e.typen || []).length || e.typen.includes(data.trainingType))
  );

  return (
    <div className="draaiboek">
      <div className="dagbalk no-print">
        <div className="segment">
          {data.dagen.map((d, i) => (
            <button key={d.id} className={i === di ? "actief" : ""} onClick={() => setDagIdx(i)}>{d.titel || `Dag ${i + 1}`}</button>
          ))}
          <button onClick={() => {
            up({ dagen: [...data.dagen, { id: uid(), titel: `Dag ${data.dagen.length + 1}`, start: dag.start, eind: dag.eind, doelen: "", blokken: [] }] });
            setDagIdx(data.dagen.length);
          }} title="Dag toevoegen"><Plus size={15} /></button>
        </div>
        <button className={"knop klein" + (instOpen ? " ingedrukt" : "")} onClick={() => setInstOpen(!instOpen)}><Pencil size={14} /> Dag instellen</button>
        <span style={{ flex: 1 }} />
        {!live ? (
          <button className="knop primair klein" onClick={startLive}><Play size={15} /> Start live</button>
        ) : (
          <button className="knop danger klein" onClick={stopLive}><PauseCircle size={15} /> Stop live</button>
        )}
      </div>

      <div className="doelgroepbalk no-print">
        <span className="doelgroeplabel">Doelgroep(en):</span>
        {data.doelgroepen.map((dg) => (
          <button key={dg} className={"regchip" + (selDoel.includes(dg) ? " donker" : "")}
            onClick={() => up({ trainingDoelgroepen: selDoel.includes(dg) ? selDoel.filter((x) => x !== dg) : [...selDoel, dg] })}>
            {dg}
          </button>
        ))}
        {qrLinks.length > 0 && (
          <button className="knop klein" style={{ marginLeft: "auto" }} onClick={() => setQrOpen(true)}><QrCode size={14} /> QR-codes</button>
        )}
      </div>

      {instOpen && (
        <div className="kaart no-print" style={{ marginBottom: 14 }}>
          <div className="rij">
            <Veld label="Naam dag"><input value={dag.titel} onChange={(e) => setDag({ titel: e.target.value })} /></Veld>
            <Veld label="Starttijd"><input value={dag.start} onChange={(e) => setDag({ start: e.target.value })} placeholder="09:00" /></Veld>
            <Veld label="Eindtijd"><input value={dag.eind} onChange={(e) => setDag({ eind: e.target.value })} placeholder="16:30" /></Veld>
          </div>
          <Veld label="Hoofddoelstellingen / aandachtspunten van deze dag" breed>
            <textarea rows={2} value={dag.doelen} onChange={(e) => setDag({ doelen: e.target.value })} />
          </Veld>
          {data.dagen.length > 1 && (
            <button className="knop danger klein" onClick={() => {
              if (window.confirm("Deze dag en alle blokken erin verwijderen?")) {
                up({ dagen: data.dagen.filter((_, i) => i !== di), live: null });
                setDagIdx(Math.max(0, di - 1));
              }
            }}><Trash2 size={14} /> Dag verwijderen</button>
          )}
        </div>
      )}

      {dag.doelen && (
        <div className="doelenbalk"><Flag size={15} /> <strong>Vandaag:</strong> {dag.doelen}</div>
      )}
      <div className={"tellerbalk " + signaal}>
        <Clock size={16} />
        <strong>{fmtDur(gepland)}</strong>&nbsp;gepland · {fmtDur(beschikbaar)} beschikbaar ({dag.start}–{dag.eind})
        <span className="tellersignaal">{signaalTekst}</span>
      </div>

      {live && liveInfo && (
        <div className={"livebalk " + (liveInfo.delta > 5 ? "rood" : liveInfo.delta < -5 ? "blauw" : "groen")}>
          <span className="livetijd">{new Date(nu).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}</span>
          <span>
            {Math.abs(liveInfo.delta) <= 2 ? "Op schema" : liveInfo.delta > 0 ? `${liveInfo.delta} min achter op schema` : `${-liveInfo.delta} min voor op schema`}
            {liveInfo.uitloop > 2 && ` · verwachte uitloop ${fmtDur(liveInfo.uitloop)}`}
          </span>
          <span style={{ flex: 1 }} />
          <button className="knop klein wit" onClick={volgendeLive}><Check size={14} /> Klaar, volgende</button>
        </div>
      )}

      <div className="werkgebied">
        <div className="tijdlijn"
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => {
            e.preventDefault();
            const d = e.dataTransfer.getData("text/plain");
            const idx = dropIdx === null ? dag.blokken.length : dropIdx;
            setDropIdx(null);
            if (d.startsWith("ex:")) voegToe({ id: uid(), type: "oef", exId: d.slice(3), versie: "kort", extra: 0, done: false }, idx);
            else if (d.startsWith("mv:")) verplaats(Number(d.slice(3)), idx);
          }}>
          {dag.blokken.length === 0 && (
            <div className="leeg">Sleep oefeningen uit de pool hiernaartoe, of gebruik de <Plus size={14} style={{ verticalAlign: "-2px" }} />-knop bij een oefening.</div>
          )}
          {dag.blokken.map((b, i) => {
            const isCur = live && liveInfo && liveInfo.cur === i;
            const t = minToTime(s0 + offs[i]);
            const open = expanded === b.id;
            const gemeensch = {
              draggable: true,
              onDragStart: (e) => {
                if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") { e.preventDefault(); return; }
                e.dataTransfer.setData("text/plain", "mv:" + i);
              },
              onDragOver: (e) => { e.preventDefault(); setDropIdx(i); },
              onDragLeave: () => setDropIdx((x) => (x === i ? null : x)),
            };
            const knoppen = (extraKnoppen) => (
              <span className="blokknoppen no-print">
                {extraKnoppen}
                {b.type !== "punt" && (
                  <IconBtn subtle title={b.done ? "Markeer als niet gedaan" : "Markeer als gedaan"} onClick={() => patchBlok(b.id, { done: !b.done })}>
                    {b.done ? <CheckSquare size={15} style={{ color: "#1E8E3E" }} /> : <Check size={15} />}
                  </IconBtn>
                )}
                {b.type === "oef" && (
                  <IconBtn subtle title={b.reserve ? "Reserve opheffen (telt weer mee in de tijd)" : "Markeer als reserve (telt niet mee, gaat wel mee in de acteursbriefing)"}
                    onClick={() => patchBlok(b.id, { reserve: !b.reserve })}>
                    <Bookmark size={15} style={b.reserve ? { color: "#9A5B00" } : {}} />
                  </IconBtn>
                )}
                <IconBtn subtle title="Omhoog" onClick={() => verplaats(i, i - 1)}><ChevronUp size={15} /></IconBtn>
                <IconBtn subtle title="Omlaag" onClick={() => verplaats(i, i + 2)}><ChevronDown size={15} /></IconBtn>
                {b.type === "oef" && <IconBtn subtle title="Doorschuiven naar volgende dag" onClick={() => skipBlok(i)}><SkipForward size={15} /></IconBtn>}
                <IconBtn subtle danger title="Verwijderen" onClick={() => setBlokken(dag.blokken.filter((_, j) => j !== i))}><X size={15} /></IconBtn>
              </span>
            );

            if (b.type === "punt") {
              return (
                <div key={b.id} className={"blok punt" + (dropIdx === i ? " droplijn" : "")} {...gemeensch}>
                  <Flag size={15} style={{ color: "#9C7A00", flexShrink: 0 }} />
                  <input className="puntinput" value={b.tekst} onChange={(e) => patchBlok(b.id, { tekst: e.target.value })} placeholder="Aandachtspunt of actie…" />
                  <IconBtn subtle title={b.done ? "Markeer als open" : "Markeer als afgehandeld"} onClick={() => patchBlok(b.id, { done: !b.done })}>
                    {b.done ? <CheckSquare size={16} style={{ color: "#1E8E3E" }} /> : <Square size={16} />}
                  </IconBtn>
                  {knoppen(null)}
                </div>
              );
            }
            if (b.type === "pauze") {
              const dur = blokDuur(b, exMap);
              return (
                <div key={b.id} className={"blok pauze" + (isCur ? " actueel" : "") + (b.done ? " gedaan" : "") + (dropIdx === i ? " droplijn" : "")} {...gemeensch}>
                  <span className="bloktijd">{t}</span>
                  <Coffee size={16} style={{ color: "#8E6A3F", flexShrink: 0 }} />
                  <input className="puntinput" value={b.tekst || ""} onChange={(e) => patchBlok(b.id, { tekst: e.target.value })} placeholder="Pauze" />
                  <span className="blokduur">{fmtDur(dur)}{b.extra ? <em className="extra"> ({b.extra > 0 ? "+" : ""}{b.extra})</em> : null}</span>
                  {knoppen(
                    <>
                      <IconBtn subtle title="5 min korter" onClick={() => patchBlok(b.id, { extra: (b.extra || 0) - 5 })}>−5</IconBtn>
                      <IconBtn subtle title="5 min langer (oprekken)" onClick={() => patchBlok(b.id, { extra: (b.extra || 0) + 5 })}>+5</IconBtn>
                    </>
                  )}
                </div>
              );
            }
            const ex = exMap[b.exId];
            if (!ex) return null;
            const c = CATS[ex.cat] || CATS.overig;
            const I = c.Icon;
            const dur = blokDuur(b, exMap);
            return (
              <div key={b.id} className={"blok oef" + (isCur ? " actueel" : "") + (b.done ? " gedaan" : "") + (b.reserve ? " reserveblok" : "") + (dropIdx === i ? " droplijn" : "")} {...gemeensch}>
                <div className="blokhoofd" onClick={() => setExpanded(open ? null : b.id)}>
                  <span className="bloktijd">{b.reserve ? "res." : t}</span>
                  <span className="catbalk" style={{ background: c.fg }} />
                  <span className="blokicoon" style={{ background: c.bg, color: c.fg }}><I size={15} strokeWidth={2.2} /></span>
                  <span className="bloknaam">
                    {b.done && <Check size={14} style={{ color: "#1E8E3E", verticalAlign: "-2px", marginRight: 4 }} />}
                    {ex.naam}
                    {b.skippedFrom && <span className="skiplabel">doorgeschoven van {b.skippedFrom}</span>}
                    {b.reserve && <span className="reservebadge">reserve</span>}
                  </span>
                  <span className="blokmeta">
                    <EnergieIcon e={ex.energie} />
                    {ex.sheets && <span className="sheetbadge">{ex.sheets}</span>}
                    <span className="blokduur">{b.reserve ? "(" + fmtDur(b.versie === "lang" ? ex.duurLang : ex.duurKort) + ")" : fmtDur(dur)}{!b.reserve && b.extra ? <em className="extra"> ({b.extra > 0 ? "+" : ""}{b.extra})</em> : null}</span>
                  </span>
                  {knoppen(<IconBtn subtle title="Exporteer deze oefening" onClick={() => setOefExport(ex)}><Printer size={15} /></IconBtn>)}
                </div>
                {open && (
                  <div className="blokdetail">
                    {ex.doel && <p className="bibdoel"><Target size={13} /> {ex.doel}</p>}
                    <div className="detailregel no-print">
                      {ex.duurKort !== ex.duurLang && (
                        <span className="segment klein">
                          <button className={b.versie !== "lang" ? "actief" : ""} onClick={() => patchBlok(b.id, { versie: "kort" })}>Snel · {ex.duurKort}m</button>
                          <button className={b.versie === "lang" ? "actief" : ""} onClick={() => patchBlok(b.id, { versie: "lang" })}>Uitgebreid · {ex.duurLang}m</button>
                        </span>
                      )}
                      <span className="segment klein">
                        <button onClick={() => patchBlok(b.id, { extra: (b.extra || 0) - 5 })}>−5 min</button>
                        <button onClick={() => patchBlok(b.id, { extra: (b.extra || 0) + 5 })}>+5 min</button>
                      </span>
                      {live && !isCur && <button className="knop klein" onClick={() => up({ live: { ...live, curIdx: i } })}><Play size={13} /> Maak actueel</button>}
                    </div>
                    {ex.instructie && <p className="instructie">{ex.instructie}</p>}

                    {(ex.scenarios || []).length > 0 && (
                      <div className="scenariosectie">
                        {[...ex.scenarios]
                          .sort((a, b) => (scenMatch(b) ? 1 : 0) - (scenMatch(a) ? 1 : 0))
                          .map((s) => (
                          <div key={s.id} className={"scenariokaart" + (scenMatch(s) ? "" : " gedimd") + (s.persoonlijk ? " persoonlijk" : "")}>
                            <div className="scenariokaartkop" onClick={() => setOpenScen(openScen === s.id ? null : s.id)}>
                              <ChevronRight size={15} style={{ transform: openScen === s.id ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
                              <strong>{s.titel || "Scenario"}</strong>
                              {s.persoon && <span className="scenariopersoon"><User size={12} /> {s.persoon}</span>}
                              <HeftigheidVlammen h={s.heftigheid} />
                              {s.fysiekeDreiging && <Dumbbell size={13} strokeWidth={2.6} style={{ color: "#C62828", flexShrink: 0 }} />}
                              <DoelgroepChips lijst={s.doelgroepen} />
                              <PersoonlijkBadge s={s} />
                              {s.uitvoeringen?.length > 0 && <span className="uitvoerbadge">{s.uitvoeringen.length}× gedaan</span>}
                              <span className="no-print"><IconBtn title="Exporteer dit scenario (voor acteur)" onClick={() => setScenExport({ ex, s })}><Printer size={13} /></IconBtn></span>
                            </div>
                            {openScen === s.id && (
                              <div className="scenariovelden">
                                {SCENARIO_VELDEN.map(([k, l]) => {
                                  if (!s[k]) return null;
                                  if (k === "zinnen") return (
                                    <div key={k} className="scenarioregel">
                                      <span className="scenariolabel">{l}</span>
                                      {s[k].split("\n").filter(Boolean).map((z, zi) => (
                                        <span key={zi} className="quoteregel">„{z.trim()}”</span>
                                      ))}
                                    </div>
                                  );
                                  return <p key={k} className="scenarioregel"><span className="scenariolabel">{l}</span>{s[k]}</p>;
                                })}
                                {(s.eigen || []).filter((eg) => eg.kop || eg.tekst).map((eg) => (
                                  <p key={eg.id} className="scenarioregel"><span className="scenariolabel">{eg.kop || "Kopje"}</span>{eg.tekst}</p>
                                ))}
                                {(s.uitvoeringen || []).map((u, j) => (
                                  <div key={j} className="notitie"><span className="notitiemeta">{u.datum}</span> {u.wie.join(", ")}{u.notitie ? " · " + u.notitie : ""}</div>
                                ))}
                                <div className="detailregel no-print" style={{ marginTop: 4 }}>
                                  {regScen === s.id ? (
                                    <div className="regvak">
                                      <span className="veldlabel">Wie deden dit rollenspel?</span>
                                      <div className="regchips">
                                        {data.deelnemers.map((p) => (
                                          <button key={p.id}
                                            className={"regchip" + (regWie.includes(p.naam) ? " actief" : "")}
                                            style={regWie.includes(p.naam) ? { background: p.kleur, borderColor: p.kleur } : {}}
                                            onClick={() => setRegWie(regWie.includes(p.naam) ? regWie.filter((n) => n !== p.naam) : [...regWie, p.naam])}>
                                            {p.naam}
                                          </button>
                                        ))}
                                      </div>
                                      <div className="rij">
                                        <input value={regNotitie} onChange={(e) => setRegNotitie(e.target.value)} placeholder="Korte notitie (optioneel)" />
                                        <button className="knop klein primair" style={{ flex: "0 0 auto" }} onClick={() => registreerUitvoering(ex.id, s.id)}><Check size={13} /> Opslaan</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button className="knop klein" onClick={() => { setRegScen(s.id); setRegWie([]); setRegNotitie(""); }}>
                                      <Users size={13} /> Registreer wie dit deed
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {ex.varianten && <p className="detailtag"><Layers size={13} /> Varianten: {ex.varianten.split("\n").filter(Boolean).join(" · ")}</p>}
                    {ex.volgorde && <p className="detailtag">↕ {ex.volgorde}</p>}
                    {ex.benodigd && <p className="detailtag">🎒 {ex.benodigd}</p>}
                    {ex.ruimte && <p className="detailtag">📐 {ex.ruimte}</p>}
                    <TagLijst tags={ex.tags} klein />
                    {(ex.notities || []).length > 0 && (
                      <div className="notitieblok">
                        {ex.notities.map((n, j) => (
                          <div key={j} className="notitie"><span className="notitiemeta">{n.datum}{n.groep ? " · " + n.groep : ""}</span> {n.tekst}</div>
                        ))}
                      </div>
                    )}
                    <div className="detailregel no-print">
                      {notitieVoor === b.id ? (
                        <>
                          <input autoFocus value={notitieTekst} onChange={(e) => setNotitieTekst(e.target.value)}
                            placeholder="Bijv. werkte goed bij deze groep, volgende keer korter…"
                            onKeyDown={(e) => e.key === "Enter" && bewaarNotitie(ex.id)} style={{ flex: 1 }} />
                          <button className="knop klein primair" onClick={() => bewaarNotitie(ex.id)}><Check size={13} /></button>
                        </>
                      ) : (
                        <button className="knop klein" onClick={() => { setNotitieVoor(b.id); setNotitieTekst(""); }}>
                          <StickyNote size={13} /> Evaluatienotitie
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div className={"dropzone-eind no-print" + (dropIdx === dag.blokken.length ? " droplijn" : "")}
            onDragOver={(e) => { e.preventDefault(); setDropIdx(dag.blokken.length); }}
            onDragLeave={() => setDropIdx((x) => (x === dag.blokken.length ? null : x))}>
            {dag.blokken.length > 0 && <span>Einde: {minToTime(s0 + gepland)}</span>}
          </div>
        </div>

        <div className="pool no-print">
          <div className="poolkop">
            <h3>Bouwblokken</h3>
            <div className="rij" style={{ gap: 6 }}>
              <button className="knop klein" onClick={() => voegToe({ id: uid(), type: "pauze", duur: 15, extra: 0, tekst: "Pauze", done: false })}><Coffee size={13} /> Pauze</button>
              <button className="knop klein" onClick={() => voegToe({ id: uid(), type: "punt", tekst: "", done: false })}><Flag size={13} /> Aandachtspunt</button>
            </div>
          </div>
          <select className="poolfilter" value={poolFilter} onChange={(e) => setPoolFilter(e.target.value)}>
            <option value="alle">Alle categorieën</option>
            {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div className="poollijst">
            {poolLijst.map((e) => {
              const c = CATS[e.cat] || CATS.overig;
              const I = c.Icon;
              return (
                <div key={e.id} className="poolitem" draggable
                  onDragStart={(ev) => ev.dataTransfer.setData("text/plain", "ex:" + e.id)} title={e.doel || ""}>
                  <span className="blokicoon" style={{ background: c.bg, color: c.fg }}><I size={14} strokeWidth={2.2} /></span>
                  <span className="poolnaam">{e.naam}<span className="poolmeta">{e.duurKort}–{e.duurLang} min · <EnergieIcon e={e.energie} size={12} /></span></span>
                  <IconBtn title="Toevoegen aan tijdlijn" onClick={() => voegToe({ id: uid(), type: "oef", exId: e.id, versie: "kort", extra: 0, done: false })}><Plus size={16} /></IconBtn>
                </div>
              );
            })}
            {poolLijst.length === 0 && <p className="hint">Geen oefeningen in deze categorie.</p>}
          </div>
        </div>
      </div>
      {qrOpen && qrLinks.length > 0 && <QrOverlay links={qrLinks} onClose={() => setQrOpen(false)} />}
      {scenExport && <ScenarioExportOverlay ex={scenExport.ex} s={scenExport.s} data={data} onClose={() => setScenExport(null)} />}
      {oefExport && <OefeningExportOverlay ex={oefExport} data={data} onClose={() => setOefExport(null)} />}
    </div>
  );
}

/* ---------- trainingskiezer ---------- */

function TrainingModal({ training, isNieuw, onSave, onClose, onDelete }) {
  const [naam, setNaam] = useState(training?.naam || "");
  const [type, setType] = useState(training?.type || "agressie");
  const [kopieer, setKopieer] = useState(false);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modalkop">
          <strong>{isNieuw ? "Nieuwe training" : "Training bewerken"}</strong>
          <IconBtn title="Sluiten" onClick={onClose}><X size={18} /></IconBtn>
        </div>
        <div className="modalbody">
          <Veld label="Naam van de training" breed>
            <input autoFocus value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Bijv. Omgaan met lastig gedrag, Team X" />
          </Veld>
          <Veld label="Trainingstype" breed>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(TRAININGSTYPEN).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Veld>
          <p className="hint">Fysieke weerbaarheid valt onder Agressie & weerbaarheid. Het type bepaalt welke oefeningen in de bouwblokken-pool verschijnen en of de MBTI-hulpmiddelen zichtbaar zijn.</p>
          {isNieuw && (
            <label className="checklabel" style={{ marginTop: 12 }}>
              <input type="checkbox" checked={kopieer} onChange={(e) => setKopieer(e.target.checked)} />
              Draaiboek, doelgroepen en organisatie-info kopiëren van de huidige training
            </label>
          )}
        </div>
        <div className="modalvoet">
          {!isNieuw && onDelete && <button className="knop danger" onClick={onDelete}><Trash2 size={15} /> Training verwijderen</button>}
          <span style={{ flex: 1 }} />
          <button className="knop" onClick={onClose}>Annuleren</button>
          <button className="knop primair" disabled={!naam.trim()} onClick={() => onSave({ naam: naam.trim(), type, kopieer })}>Opslaan</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- app ---------- */

const GEDEELDE_SLEUTELS = new Set(["exercises", "doelgroepen", "mbtiKleuren", "inpakBasis"]);

function mergedData(db, tr) {
  return {
    ...tr,
    trainingNaam: tr.naam,
    trainingType: tr.type,
    exercises: db.bibliotheek.exercises,
    doelgroepen: db.bibliotheek.doelgroepen,
    mbtiKleuren: db.bibliotheek.mbtiKleuren,
    inpakBasis: db.bibliotheek.inpakBasis,
  };
}

export default function App() {
  const [db, setDb] = useState(defaultData);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("draaiboek");
  const [exportOpen, setExportOpen] = useState(false);
  const [trModal, setTrModal] = useState(null); // "nieuw" | "bewerk"
  const [nu, setNu] = useState(Date.now());
  const saveTimer = useRef(null);
  const restoreRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY);
        if (r && r.value) setDb(migrate(JSON.parse(r.value)));
      } catch {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try { await window.storage.set(STORAGE_KEY, JSON.stringify(db)); } catch (e) { console.error("Opslaan mislukt", e); }
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [db, loaded]);

  useEffect(() => {
    const t = setInterval(() => setNu(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  const tr = db.trainingen.find((t) => t.id === db.actieveTraining) || db.trainingen[0];
  const data = useMemo(() => mergedData(db, tr), [db, tr]);
  const exMap = useMemo(() => Object.fromEntries(db.bibliotheek.exercises.map((e) => [e.id, e])), [db.bibliotheek.exercises]);

  const up = (patch) => setDb((prev) => {
    const actueel = prev.trainingen.find((t) => t.id === prev.actieveTraining) || prev.trainingen[0];
    const p = typeof patch === "function" ? patch(mergedData(prev, actueel)) : patch;
    let bib = prev.bibliotheek;
    const trPatch = {};
    let exercisesGewijzigd = false;
    Object.entries(p).forEach(([k, v]) => {
      if (GEDEELDE_SLEUTELS.has(k)) {
        if (bib === prev.bibliotheek) bib = { ...prev.bibliotheek };
        bib[k] = v;
        if (k === "exercises") exercisesGewijzigd = true;
      } else if (k === "trainingNaam") trPatch.naam = v;
      else if (k === "trainingType") trPatch.type = v;
      else trPatch[k] = v;
    });
    let trainingen = Object.keys(trPatch).length
      ? prev.trainingen.map((t) => (t.id === actueel.id ? { ...t, ...trPatch } : t))
      : prev.trainingen;
    if (exercisesGewijzigd) {
      const exIds = new Set(bib.exercises.map((e) => e.id));
      trainingen = trainingen.map((t) => ({
        ...t,
        dagen: t.dagen.map((d) => ({ ...d, blokken: d.blokken.filter((b) => b.type !== "oef" || exIds.has(b.exId)) })),
      }));
    }
    return { ...prev, bibliotheek: bib, trainingen };
  });

  const nieuweTraining = ({ naam, type, kopieer }) => {
    const t = leegTraining(naam, type);
    if (kopieer && tr) {
      t.trainingDoelgroepen = [...tr.trainingDoelgroepen];
      t.org = JSON.parse(JSON.stringify(tr.org));
      t.org.qrLinks = (t.org.qrLinks || []).map((l) => ({ ...l, id: uid() }));
      t.dagen = tr.dagen.map((d) => ({
        ...d, id: uid(),
        blokken: d.blokken.map((b) => ({ ...b, id: uid(), done: false, skippedFrom: undefined })),
      }));
    }
    setDb((prev) => ({ ...prev, trainingen: [...prev.trainingen, t], actieveTraining: t.id }));
    setTrModal(null); setTab("draaiboek");
  };

  const bewerkTraining = ({ naam, type }) => {
    setDb((prev) => ({ ...prev, trainingen: prev.trainingen.map((t) => (t.id === prev.actieveTraining ? { ...t, naam, type } : t)) }));
    setTrModal(null);
  };

  const verwijderTraining = () => {
    if (db.trainingen.length <= 1) return;
    if (!window.confirm(`"${tr.naam}" verwijderen, inclusief draaiboek en deelnemers? De oefeningenbibliotheek blijft bestaan.`)) return;
    setDb((prev) => {
      const rest = prev.trainingen.filter((t) => t.id !== prev.actieveTraining);
      return { ...prev, trainingen: rest, actieveTraining: rest[0].id };
    });
    setTrModal(null);
  };

  const maakBackup = () => {
    try {
      const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `trainingsdraaiboek-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch { window.alert("Backup maken lukte niet in deze omgeving."); }
  };

  const herstelBackup = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const m = migrate(JSON.parse(e.target.result));
        if (window.confirm(`Backup bevat ${m.trainingen.length} training(en) en ${m.bibliotheek.exercises.length} oefeningen. Huidige gegevens vervangen?`)) {
          setDb(m);
        }
      } catch { window.alert("Dit bestand kon niet als backup worden gelezen."); }
    };
    reader.readAsText(file);
  };

  if (!loaded) return <div className="laden">Laden…</div>;

  return (
    <div className="app">
      <StijlBlad />
      <header className="app-hoofd no-print">
        <select className="trainingkiezer" value={db.actieveTraining}
          onChange={(e) => setDb((prev) => ({ ...prev, actieveTraining: e.target.value }))}>
          {db.trainingen.map((t) => <option key={t.id} value={t.id}>{t.naam}</option>)}
        </select>
        <span className="typebadge">{TRAININGSTYPEN[tr.type]?.label || tr.type}</span>
        <IconBtn title="Training bewerken" onClick={() => setTrModal("bewerk")}><Pencil size={15} /></IconBtn>
        <IconBtn title="Nieuwe training" onClick={() => setTrModal("nieuw")}><Plus size={16} /></IconBtn>
        <span style={{ flex: 1 }} />
        <button className="knop klein" onClick={maakBackup} title="Alle gegevens als bestand bewaren"><Download size={14} /> Backup</button>
        <button className="knop klein" onClick={() => setExportOpen(true)}><Printer size={14} /> Exporteren</button>
      </header>
      <nav className="tabbalk no-print">
        {[["draaiboek", "Draaiboek"], ["bibliotheek", "Bibliotheek"], ["deelnemers", "Deelnemers"], ["info", "Info & inpaklijst"]].map(([k, l]) => (
          <button key={k} className={tab === k ? "actief" : ""} onClick={() => setTab(k)}>{l}</button>
        ))}
      </nav>
      <main className="no-print">
        {tab === "draaiboek" && <DraaiboekTab data={data} up={up} exMap={exMap} nu={nu} />}
        {tab === "bibliotheek" && <BibliotheekTab data={data} up={up} />}
        {tab === "deelnemers" && <DeelnemersTab data={data} up={up} />}
        {tab === "info" && <InfoTab data={data} up={up} exMap={exMap} onRestore={herstelBackup} />}
      </main>
      {exportOpen && <ExportOverlay data={data} exMap={exMap} onClose={() => setExportOpen(false)} />}
      {trModal === "nieuw" && <TrainingModal isNieuw onSave={nieuweTraining} onClose={() => setTrModal(null)} />}
      {trModal === "bewerk" && (
        <TrainingModal training={tr} onSave={bewerkTraining} onClose={() => setTrModal(null)}
          onDelete={db.trainingen.length > 1 ? verwijderTraining : null} />
      )}
    </div>
  );
}

/* ---------- stijl ---------- */

function StijlBlad() {
  return <style>{`
  * { box-sizing: border-box; }
  .app { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
    background: #F5F5F7; min-height: 100vh; color: #1D1D1F; -webkit-font-smoothing: antialiased; }
  .laden { padding: 60px; text-align: center; color: #6E6E73; font-family: -apple-system, sans-serif; }
  main { max-width: 1200px; margin: 0 auto; padding: 0 16px 60px; }
  h2 { font-size: 22px; font-weight: 700; letter-spacing: -0.3px; margin: 0; }
  h3 { font-size: 15px; font-weight: 700; margin: 0 0 10px; }
  p { margin: 0; }
  input, select, textarea { font: inherit; font-size: 16px; color: #1D1D1F; background: #fff;
    border: 1px solid #D2D2D7; border-radius: 9px; padding: 8px 10px; width: 100%; }
  input:focus, select:focus, textarea:focus { outline: 2px solid #0071E3; outline-offset: 0; border-color: transparent; }
  textarea { resize: vertical; }

  .app-hoofd { display: flex; align-items: center; gap: 12px; max-width: 1200px; margin: 0 auto; padding: 18px 16px 6px; }
  .titelinput { border: none; background: transparent; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; padding: 4px 6px; flex: 1; border-radius: 8px; }
  .titelinput:hover { background: #EBEBEE; }
  .tabbalk { display: flex; gap: 4px; max-width: 1200px; margin: 0 auto 18px; padding: 0 16px; }
  .tabbalk button { border: none; background: transparent; font: inherit; font-size: 14px; font-weight: 600;
    color: #6E6E73; padding: 8px 14px; border-radius: 99px; cursor: pointer; }
  .tabbalk button.actief { background: #1D1D1F; color: #fff; }

  .knop { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #D2D2D7; background: #fff;
    font: inherit; font-size: 14px; font-weight: 600; padding: 8px 14px; border-radius: 99px; cursor: pointer; color: #1D1D1F; }
  .knop:hover { background: #F0F0F2; }
  .knop.primair { background: #0071E3; border-color: #0071E3; color: #fff; }
  .knop.primair:hover { background: #0062C4; }
  .knop:disabled { opacity: .4; cursor: default; }
  .knop.danger { color: #C62828; border-color: #F0C4C4; }
  .knop.klein { font-size: 13px; padding: 6px 11px; }
  .knop.wit { background: rgba(255,255,255,.92); border-color: transparent; color: #1D1D1F; }
  .knop.ingedrukt { background: #1D1D1F; color: #fff; border-color: #1D1D1F; }
  .iconbtn { border: none; background: #F0F0F2; border-radius: 8px; width: 28px; height: 28px; display: inline-flex;
    align-items: center; justify-content: center; cursor: pointer; color: #3A3A3C; font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .iconbtn:hover { background: #E3E3E8; }
  .iconbtn.subtle { background: transparent; }
  .iconbtn.subtle:hover { background: #EDEDF0; }
  .iconbtn.danger { color: #C62828; }

  .chip { display: inline-flex; align-items: center; gap: 5px; font-weight: 600; padding: 3px 9px; border-radius: 99px; }
  .segment { display: inline-flex; background: #E8E8ED; border-radius: 99px; padding: 3px; gap: 2px; flex-wrap: wrap; }
  .segment button { border: none; background: transparent; font: inherit; font-size: 13px; font-weight: 600;
    color: #3A3A3C; padding: 5px 12px; border-radius: 99px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
  .segment button.actief { background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.12); }
  .segment.klein button { font-size: 12px; padding: 4px 9px; }

  .kaart { background: #fff; border-radius: 16px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
  .tabinhoud { display: flex; flex-direction: column; gap: 14px; }
  .tabkop { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .hint { font-size: 13px; color: #6E6E73; }
  .rij { display: flex; gap: 12px; flex-wrap: wrap; }
  .rij > * { flex: 1; min-width: 140px; }
  .veld { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
  .veldlabel { font-size: 12px; font-weight: 600; color: #6E6E73; text-transform: uppercase; letter-spacing: .4px; }
  .checkrij { margin: 6px 0 10px; }
  .checklabel { display: flex; align-items: center; gap: 8px; font-size: 14px; }
  .checklabel input { width: auto; }

  .taglijst { display: inline-flex; gap: 5px; flex-wrap: wrap; }
  .tagchip { font-size: 12px; font-weight: 600; background: #E8E8ED; color: #3A3A3C; padding: 3px 10px; border-radius: 99px; }
  .tagchip.klein { font-size: 11px; padding: 2px 8px; }
  .tagchip.klikbaar { border: 1px solid transparent; cursor: pointer; font: inherit; font-size: 12px; font-weight: 600; }
  .tagchip.klikbaar:hover { background: #DFDFE4; }
  .tagchip.klikbaar.actief { background: #1D1D1F; color: #fff; }

  /* draaiboek */
  .dagbalk { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
  .doelenbalk { display: flex; align-items: center; gap: 8px; background: #1D1D1F; color: #fff;
    border-radius: 12px; padding: 10px 14px; font-size: 14px; margin-bottom: 10px; position: sticky; top: 8px; z-index: 5; }
  .tellerbalk { display: flex; align-items: center; gap: 8px; border-radius: 12px; padding: 10px 14px;
    font-size: 14px; margin-bottom: 10px; flex-wrap: wrap; }
  .tellerbalk.groen { background: #E8F6EA; color: #1E6B33; }
  .tellerbalk.oranje { background: #FFF4E0; color: #9A5B00; }
  .tellerbalk.rood { background: #FDEAEA; color: #B22222; font-weight: 600; }
  .tellersignaal { margin-left: auto; font-weight: 700; }
  .livebalk { display: flex; align-items: center; gap: 12px; border-radius: 12px; padding: 10px 14px;
    font-size: 14px; margin-bottom: 14px; color: #fff; position: sticky; top: 8px; z-index: 6; flex-wrap: wrap; }
  .livebalk.groen { background: #1E8E3E; }
  .livebalk.rood { background: #C62828; }
  .livebalk.blauw { background: #0071E3; }
  .livetijd { font-size: 18px; font-weight: 800; font-variant-numeric: tabular-nums; }

  .werkgebied { display: grid; grid-template-columns: 1fr 300px; gap: 16px; align-items: start; }
  .tijdlijn { display: flex; flex-direction: column; gap: 8px; min-height: 200px; }
  .leeg { border: 2px dashed #D2D2D7; border-radius: 14px; padding: 36px 20px; text-align: center; color: #6E6E73; font-size: 14px; }
  .blok { background: #fff; border-radius: 13px; box-shadow: 0 1px 3px rgba(0,0,0,.06); border: 1px solid transparent; }
  .blok.droplijn { border-top: 3px solid #0071E3; }
  .blok.actueel { outline: 3px solid #0071E3; outline-offset: 1px; }
  .blok.gedaan { opacity: .62; }
  .blok.gedaan .bloknaam { color: #6E6E73; }
  .blokhoofd { display: flex; align-items: center; gap: 9px; padding: 10px 12px; cursor: pointer; }
  .bloktijd { font-variant-numeric: tabular-nums; font-weight: 700; font-size: 13px; color: #6E6E73; width: 42px; flex-shrink: 0; }
  .catbalk { width: 4px; align-self: stretch; border-radius: 4px; flex-shrink: 0; }
  .blokicoon { width: 28px; height: 28px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .bloknaam { font-weight: 600; font-size: 14.5px; flex: 1; min-width: 0; }
  .skiplabel { display: inline-block; margin-left: 8px; font-size: 11px; font-weight: 700; color: #9A5B00;
    background: #FFF4E0; padding: 2px 8px; border-radius: 99px; vertical-align: 1px; }
  .blokmeta { display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .blokduur { font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; color: #3A3A3C; }
  .extra { font-style: normal; color: #9A5B00; font-weight: 600; }
  .sheetbadge { font-size: 11px; font-weight: 700; background: #EDEBFD; color: #5B4BD6; padding: 2px 7px; border-radius: 6px; }
  .blokknoppen { display: inline-flex; gap: 1px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
  .blok.pauze, .blok.punt { display: flex; align-items: center; gap: 9px; padding: 8px 12px; flex-wrap: wrap; }
  .blok.pauze { background: #FAF6F0; }
  .blok.punt { background: #FFFBEB; border: 1px dashed #E3CE8B; box-shadow: none; }
  .puntinput { border: none; background: transparent; padding: 4px 6px; font-size: 14px; flex: 1; min-width: 120px; }
  .puntinput:focus { outline: none; background: #fff; border-radius: 6px; }
  .blokdetail { padding: 4px 14px 14px 66px; display: flex; flex-direction: column; gap: 9px; align-items: flex-start; }
  .blokdetail > * { width: 100%; }
  .instructie { font-size: 14px; line-height: 1.55; color: #2C2C2E; background: #F8F8FA; border-radius: 10px; padding: 12px 14px; }
  .detailtag { font-size: 13px; color: #4A4A4E; display: flex; align-items: center; gap: 6px; }
  .detailregel { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .dropzone-eind { min-height: 34px; display: flex; align-items: center; justify-content: center;
    color: #6E6E73; font-size: 13px; font-weight: 600; border-radius: 10px; }
  .dropzone-eind.droplijn { border: 2px dashed #0071E3; color: #0071E3; }

  .bibdoel { font-size: 13.5px; font-weight: 600; color: #1D1D1F; display: flex; align-items: flex-start; gap: 6px;
    background: #F2F7F4; border-radius: 8px; padding: 7px 10px; margin-top: 7px; }
  .bibdoel svg { flex-shrink: 0; margin-top: 2px; color: #2F7D63; }

  /* scenario's */
  .scenariosectie { display: flex; flex-direction: column; gap: 7px; margin-top: 4px; }
  .scenariokop { display: flex; align-items: center; justify-content: space-between; }
  .scenariokaart { border: 1px solid #E8E8ED; border-radius: 11px; background: #FCFCFD; }
  .scenariokaartkop { display: flex; align-items: center; gap: 8px; padding: 9px 11px; cursor: pointer; flex-wrap: wrap; font-size: 13.5px; }
  .scenariopersoon { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; color: #6E6E73; font-weight: 600; }
  .uitvoerbadge { font-size: 11px; font-weight: 700; background: #E8F6EA; color: #1E8E3E; padding: 2px 8px; border-radius: 99px; }
  .scenariovelden { padding: 4px 13px 13px 34px; display: flex; flex-direction: column; gap: 6px; }
  .scenarioregel { font-size: 13.5px; line-height: 1.5; }
  .scenariolabel { display: block; font-size: 10.5px; font-weight: 700; color: #6E6E73; text-transform: uppercase; letter-spacing: .4px; }
  .quoteregel { display: block; width: fit-content; font-size: 13.5px; font-style: italic; color: #2C2C2E;
    background: #F5F5F7; border-radius: 7px; padding: 4px 10px; margin-top: 3px; }
  .eigenkopje { background: #F8F8FA; border-radius: 10px; padding: 9px; }
  .scenariokaart.gedimd { opacity: .45; }
  .heftig { display: inline-flex; gap: 1px; align-items: center; }
  .doelgroepchip { font-size: 10.5px; font-weight: 700; background: #E8F1FD; color: #0B62C9; padding: 2px 8px; border-radius: 99px; }
  .regchip.donker { background: #1D1D1F; color: #fff; border-color: #1D1D1F; }
  .minitoevoeg { width: auto; max-width: 180px; font-size: 13px; padding: 5px 11px; border-radius: 99px; }
  .doelgroepbalk { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
  .doelgroeplabel { font-size: 12px; font-weight: 700; color: #6E6E73; margin-right: 2px; }
  .filterikoon { color: #6E6E73; align-self: center; display: inline-flex; }
  .modal.qr { width: 420px; }
  .qrvak { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 26px 22px; }
  .qrcode { background: #fff; padding: 10px; border-radius: 12px; min-height: 60px; }
  .qrcode img, .qrcode canvas { display: block; }
  .qrlink { font-size: 13px; color: #0071E3; word-break: break-all; text-align: center; }
  .qrfout { font-size: 14px; color: #6E6E73; text-align: center; max-width: 340px; line-height: 1.5; }
  .scenariokaart.persoonlijk { border-color: #C9A6E8; background: #FBF7FE; }
  .bibkaart.persoonlijk { box-shadow: inset 3px 0 0 #8036C9, 0 1px 3px rgba(0,0,0,.06); }
  .persoonlijkbadge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700;
    color: #8036C9; background: #F3EAFB; padding: 2px 8px; border-radius: 99px; white-space: nowrap; }
  .kleurdot { display: inline-block; width: 10px; height: 10px; border-radius: 99px; margin-right: 7px; flex-shrink: 0; }
  .overzichtregel { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid #F0F0F2; }
  .overzichtregel:last-child { border-bottom: none; }
  .overzichtnaam { color: #fff; font-size: 12px; font-weight: 700; padding: 3px 11px; border-radius: 99px; flex-shrink: 0; margin-top: 1px; }
  .overzichttekst { font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
  .opstellingbalk { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding: 12px 16px; }
  .stepper { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-variant-numeric: tabular-nums; }
  .stepperlabel { font-size: 12px; font-weight: 700; color: #6E6E73; }
  .trainingkiezer { max-width: 340px; font-weight: 800; font-size: 17px; border: none; background: #EBEBEE;
    border-radius: 10px; padding: 8px 12px; }
  .typebadge { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px;
    background: #1D1D1F; color: #fff; padding: 4px 10px; border-radius: 99px; white-space: nowrap; }
  .mbtidot { display: inline-block; width: 13px; height: 13px; border-radius: 99px; }
  .kleurinput { width: 30px; height: 26px; padding: 1px; border-radius: 7px; border: 1px solid #D2D2D7; cursor: pointer; }
  .mbtigroep { margin-bottom: 14px; }
  .mbtigroepkop { display: block; font-size: 13px; font-weight: 800; letter-spacing: 1.5px; margin-bottom: 7px; }
  .mbtigroepkop em { font-style: normal; font-weight: 600; color: #6E6E73; letter-spacing: 0; }
  .mbtiklein { font-size: 10.5px; font-weight: 700; color: #6E6E73; margin-left: 7px; letter-spacing: .5px; }
  .blok.reserveblok { border: 1px dashed #D2B26A; background: #FFFDF6; box-shadow: none; }
  .reservebadge { display: inline-block; margin-left: 8px; font-size: 11px; font-weight: 700;
    color: #8A6D1F; background: #F7EFD8; padding: 2px 8px; border-radius: 99px; vertical-align: 1px; }
  .regvak { display: flex; flex-direction: column; gap: 7px; width: 100%; background: #F5F5F7; border-radius: 10px; padding: 10px; }
  .regchips { display: flex; gap: 6px; flex-wrap: wrap; }
  .regchip { border: 1px solid #D2D2D7; background: #fff; font: inherit; font-size: 13px; font-weight: 600;
    padding: 5px 12px; border-radius: 99px; cursor: pointer; display: inline-flex; align-items: center; }
  .regchip.actief { color: #fff; }

  /* pool */
  .pool { background: #fff; border-radius: 16px; padding: 14px; box-shadow: 0 1px 3px rgba(0,0,0,.06);
    position: sticky; top: 8px; max-height: calc(100vh - 30px); display: flex; flex-direction: column; }
  .poolkop { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
  .poolfilter { margin-bottom: 10px; }
  .poollijst { overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
  .poolitem { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 10px; cursor: grab; }
  .poolitem:hover { background: #F5F5F7; }
  .poolnaam { flex: 1; font-size: 13.5px; font-weight: 600; min-width: 0; display: flex; flex-direction: column; }
  .poolmeta { font-size: 11.5px; font-weight: 500; color: #6E6E73; display: inline-flex; align-items: center; gap: 4px; }

  /* bibliotheek */
  .filterbalk { display: flex; gap: 6px; flex-wrap: wrap; }
  .filterbalk.tags { margin-top: -6px; }
  .filterchip { border: 1px solid #D2D2D7; background: #fff; font: inherit; font-size: 13px; font-weight: 600;
    padding: 5px 12px; border-radius: 99px; cursor: pointer; color: #3A3A3C; }
  .filterchip.actief { background: #1D1D1F; color: #fff; border-color: #1D1D1F; }
  .bibgroep { display: flex; flex-direction: column; gap: 8px; }
  .bibgroepkop { margin-top: 6px; }
  .bibkaart { background: #fff; border-radius: 14px; padding: 14px 16px; box-shadow: 0 1px 3px rgba(0,0,0,.06); cursor: pointer; }
  .bibkaart:hover { box-shadow: 0 2px 8px rgba(0,0,0,.1); }
  .bibkaartkop { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .bibmeta { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: #6E6E73; font-weight: 600; }
  .bibinstructie { font-size: 13.5px; color: #4A4A4E; margin-top: 6px; line-height: 1.5;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .bibvoet { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; align-items: center; }
  .bibtag { font-size: 12px; color: #6E6E73; display: inline-flex; align-items: center; gap: 4px; }
  .notitieblok { display: flex; flex-direction: column; gap: 5px; }
  .notitie { font-size: 13px; background: #FFFBEB; border-radius: 8px; padding: 7px 10px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .notitiemeta { font-weight: 700; color: #9C7A00; font-size: 11.5px; }

  /* deelnemers */
  .cirkelkaart { background: #fff; border-radius: 16px; padding: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.06); position: relative; }
  .aantalbadge { position: absolute; top: 14px; right: 18px; text-align: center; background: #1D1D1F; color: #fff;
    border-radius: 14px; padding: 8px 16px; }
  .aantalgetal { display: block; font-size: 34px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
  .aantallabel { display: block; font-size: 11px; font-weight: 600; opacity: .75; margin-top: 2px; }
  .cirkelsvg { width: 100%; height: auto; display: block; }
  .kleurrij { display: flex; gap: 6px; flex-wrap: wrap; }
  .kleurbol { width: 26px; height: 26px; border-radius: 99px; border: 2px solid #fff; cursor: pointer; box-shadow: 0 0 0 1px #D2D2D7; }
  .kleurbol.gekozen { box-shadow: 0 0 0 2.5px #1D1D1F; }
  .presentierij { display: grid; grid-template-columns: 90px 150px 1fr; gap: 8px; align-items: center; margin-bottom: 7px; }
  .presentiedag { font-size: 13px; font-weight: 700; }

  /* info */
  .infokolommen { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
  .acteurvak { background: #FDE9F1; border-radius: 12px; padding: 12px 14px; margin-bottom: 12px; }
  .inpakitem { display: flex; align-items: center; gap: 9px; width: 100%; font-size: 14px; padding: 8px 6px;
    border-radius: 9px; cursor: pointer; color: #1D1D1F; }
  .inpakitem:hover { background: #F5F5F7; }
  .inpakitem.klaar .inpaknaam { text-decoration: line-through; color: #8E8E93; }
  .inpakitem.verborgen { color: #8E8E93; }
  .inpaknaam { flex: 1; font-weight: 600; }
  .inpakdagen { font-size: 12px; color: #8E8E93; }

  /* modals */
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center;
    justify-content: center; padding: 18px; z-index: 50; }
  .modal { background: #fff; border-radius: 18px; width: 640px; max-width: 100%; max-height: 90vh;
    display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,.25); }
  .modal.groot { width: 780px; }
  .modalkop { display: flex; align-items: center; gap: 12px; padding: 16px 18px; border-bottom: 1px solid #EBEBEE; flex-wrap: wrap; }
  .modalkop strong { flex: 1; font-size: 16px; }
  .modalbody { padding: 16px 18px; overflow-y: auto; }
  .modalvoet { display: flex; gap: 8px; padding: 14px 18px; border-top: 1px solid #EBEBEE; align-items: center; flex-wrap: wrap; }
  .exporttekst { margin: 0; padding: 18px; overflow: auto; font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 12.5px; line-height: 1.55; white-space: pre-wrap; }
  .exportveld { margin: 0; padding: 0; font: inherit; white-space: pre-wrap; }
  .scenariogroep { display: block; }
  .scenarioblok.scenariogroep { margin-bottom: 22px; }

  @media (max-width: 860px) {
    .werkgebied { grid-template-columns: 1fr; }
    .pool { position: static; max-height: 340px; }
    .infokolommen { grid-template-columns: 1fr; }
    .bloktijd { width: 38px; font-size: 12px; }
    .blokdetail { padding-left: 14px; }
    .app-hoofd { padding-top: 12px; }
    .titelinput { font-size: 20px; }
    .presentierij { grid-template-columns: 70px 1fr; }
    .presentierij input { grid-column: 1 / -1; }
    .aantalbadge { padding: 6px 12px; }
    .aantalgetal { font-size: 26px; }
  }
  @media print {
    .no-print, .app-hoofd, .tabbalk { display: none !important; }
    .app { background: #fff; min-height: 0; }
    main { max-width: none; padding: 0; margin: 0; }
    .overlay { position: static; background: #fff; padding: 0; display: block; }
    .modal, .modal.groot { box-shadow: none; max-height: none; width: 100%; border-radius: 0; display: block; }
    .exporttekst { font-size: 11px; overflow: visible; }
    .exporttekst:not(.scenariogroep) { break-inside: avoid; }
    .scenariogroep { break-inside: avoid; }
    .scenariogroep .exportveld { margin: 0; padding: 0; break-inside: avoid; }
  }
  `}</style>;
}
