# Beslissingen

Log van keuzes bij onduidelijkheden, één regel context per beslissing.

## Klus 1: GitHub + online zetten (2026-07-08)

- Geen wijziging aan `vite.config.js` nodig: `base: "./"` gebruikt al relatieve
  paden, dat werkt zowel op GitHub Pages (project-URL met submap) als lokaal.
- `.gitignore` toegevoegd (`node_modules/`, `dist/`, `.DS_Store`, `.claude/`)
  omdat die niet in de repository horen: `.claude/` is lokale tool-config,
  geen app-content.
- Git-identity (naam/e-mail) niet handmatig gezet; automatisch gedetecteerde
  waarde gebruikt voor de eerste commit. Kan de gebruiker zelf aanpassen met
  `git config --global user.name/email` als gewenst, is niet functioneel
  voor de app.
- Geen `CNAME` of custom domain toegevoegd: niet gevraagd, standaard
  `github.io`-adres volstaat.

## Klus 2: PDF-export (2026-07-08)

- Geen nieuwe PDF-bibliotheek toegevoegd. `window.print()` (browser "Opslaan
  als PDF") deed het al voor de bestaande export en werkt identiek voor het
  losse scenario-export; extra dependency zou niets toevoegen.
- Los scenario exporteren zit als klein printknopje op de scenariokaart zelf
  in het draaiboek (gebruiker koos deze optie), niet als extra keuzelijst in
  het bestaande Exporteren-overlay. Opent dezelfde soort modal
  (`ScenarioExportOverlay`), hergebruikt `pushScenarioTekst` en de bestaande
  `print-area`/`no-print` CSS-klassen.
- `Handout: <bestandsnaam>` in `benodigd` wordt nergens apart geparust of als
  link getoond; het staat al gewoon als tekst in de export omdat `benodigd`
  al meegeprint werd. Geen extra code nodig om aan eis 5 van het contract te
  voldoen.

### Nacontrole na feedback (zelfde dag)

- Printknopje ontbrak in Bibliotheek: er bestaan twee aparte plekken waar een
  scenariokaart getekend wordt — de bewerkbare kaart in `ExerciseEditor` (open
  via Bibliotheek) en de alleen-lezen kaart in `DraaiboekTab`. Het knopje was
  alleen in de tweede toegevoegd. Nu ook in `ExerciseEditor` toegevoegd, met
  `trainingNaam` als extra prop (alleen die ene waarde van `data` nodig, geen
  hele `data`-prop erbij gesleept).
- Paginabreuk per scenario: `buildExportText` (acteursmodus) plaatst nu een
  form-feed-teken (`\f`) vóór elk scenario. `ExportTekst` splitst de tekst op
  dat teken in aparte `<pre>`-blokken met CSS `break-before: page`, zodat elk
  scenario op een eigen pagina begint. Bij kopiëren naar klembord wordt het
  `\f`-teken eruit gefilterd (onzichtbaar teken, hoort niet in platte tekst).
  Geen aparte databron of nieuwe exportmodus; `buildExportText` blijft de ene
  bron van waarheid.
- Wit blok in de PDF: kwam door `.modal.groot { width: 780px }`, een regel die
  door CSS-specificiteit (twee klassen) voorrang kreeg boven de latere
  `@media print .modal { width: 100% }`-regel (één klasse), ook al stond die
  print-regel verderop in het bestand. Opgelost door in de print-media-query
  ook expliciet `.modal.groot` mee te selecteren.

### Tweede nacontrole: pagina-opmaak acteursbriefing (2026-07-09/10)

- `break-inside: avoid` op een hele scenario-`<pre>` faalde zodra een
  scenario langer was dan één A4: de browser heeft dan geen geldige plek en
  breekt alsnog midden in de tekst. Opgelost door elk veld van een scenario
  apart te markeren (`\v`-teken in `pushScenarioTekst`) en per veld een eigen
  `break-inside: avoid`-element te renderen (`ExportPagina`/`.exportveld`).
  Zo breekt een te lang scenario hooguit tussen twee velden, nooit
  middenin een veld.
- `<pre>` bleek onbetrouwbaar voor `break-inside: avoid` in Chrome-print;
  vervangen door gewone `<div>`s met dezelfde monospace/pre-wrap-styling via
  CSS. Verklaart waarom de eerdere `<pre>`-aanpak in de test alsnog brak.
- Acteursbriefing kreeg eerst geforceerde `break-before: page` per scenario
  (elk scenario altijd een eigen pagina), later op verzoek weer teruggedraaid
  naar alleen `break-inside: avoid`: in de praktijk gaf één scenario per
  pagina te veel bijna-lege pagina's. Scenario's vullen nu gewoon aaneen-
  sluitend de pagina; de veld-niveau-opsplitsing blijft als vangnet staan
  voor het geval een scenario toch een hele pagina overschrijdt.
- Het draaiboek-scherm print altijd mee als het achterliggende `<main>` niet
  expliciet verborgen wordt tijdens `window.print()` — dat gold zowel voor de
  volledige export als voor het losse-scenario-printknopje. `<main>` kreeg
  `.no-print`, maar de exportoverlays (`ExportOverlay`,
  `ScenarioExportOverlay`, `OefeningExportOverlay`) worden daardoor via
  React `createPortal` naar `document.body` gerenderd in plaats van binnen
  `<main>` — anders zouden ze door dezelfde regel worden verborgen. Bewust
  geen `:has()`-CSS-selector gebruikt (minder browserondersteuning, met name
  op iPad Safari); een portal is de standaardaanpak en werkt overal.
- Lege eerste pagina bij het printen: kwam niet door `<main>` zelf (die
  collabt correct naar nul hoogte bij `display: none`), maar door
  `.app { min-height: 100vh }`, dat in print nooit overschreven was.
  Toegevoegd: `.app { min-height: 0 }` in de print-media-query.
- Acteursbriefing bevat geen tijdschema meer: begint met een blok
  "OEFENINGEN MET ACTEUR" (instructiekaarten van oefeningen met categorie
  Acteur-intro of Praktijksimulatie), en direct daaronder, per oefening, de
  bijbehorende scenario's — dezelfde volgorde als de instructiekaartjes-
  export al gebruikte, in plaats van eerst alle kaarten en dan alle
  scenario's los.
- Printknopje voor een hele oefening (kaart + scenario's) toegevoegd naast
  het bestaande per-scenario-knopje, in zowel `ExerciseEditor` (Bibliotheek)
  als `DraaiboekTab`. Hergebruikt dezelfde overlay/print-CSS-aanpak
  (`OefeningExportOverlay`, portal naar `document.body`).

## Klus 3: Offline/PWA (2026-07-12)

- Handgeschreven service worker, geen `vite-plugin-pwa`: geen nieuwe
  dependency nodig voor iets dat met een kleine, uit te leggen `sw.js` ook
  kan. De bestandslijst in de service worker wordt niet met de hand
  bijgehouden (foutgevoelig bij een gewijzigde build-output), maar
  automatisch gegenereerd door `scripts/genereer-sw.js`, dat na `vite build`
  draait (`npm run build` doet dit nu in één stap) en de `dist`-map uitleest.
  De cachenaam bevat een hash van de build-inhoud, zodat elke nieuwe build
  automatisch een nieuwe cache krijgt en de oude bij `activate` wordt
  opgeruimd.
- Geen wijziging aan `.github/workflows/deploy.yml` nodig: die roept al
  `npm run build` aan, en dat commando genereert nu vanzelf ook `sw.js` mee.
- Alle app-data zat al in `localStorage` (zie `src/main.jsx`), dus daarvoor
  was niets te doen voor "werkt offline"; de service worker hoeft alleen de
  app-bestanden zelf (HTML/JS/manifest/iconen) te cachen.
- Twee placeholder-iconen (`public/icons/icon-192.png` en `icon-512.png`)
  gegenereerd als effen kleurvlak in de huisstijlkleur, zonder externe
  library (met een klein Node-scriptje dat rechtstreeks een PNG schrijft).
  Vervangbaar door een eigen logo later, geen functionele wijziging nodig
  in `manifest.webmanifest` of `index.html` om dat te doen (zelfde
  bestandsnamen/afmetingen aanhouden).
- **Belangrijk voor iOS**: als de app als "Zet op beginscherm"-icoon wordt
  geopend, gebruikt Safari daarvoor een aparte, van gewone Safari-tabbladen
  gescheiden `localStorage`. Bestaande data die in de Safari-browser stond
  (bijv. via eerdere `npm run dev`-tests of het bezoeken van de live-URL in
  een gewone tab) is dus niet automatisch zichtbaar in de beginscherm-app,
  en andersom. Voor de iPad-test moet de gebruiker eerst de app op het
  beginscherm zetten en dáár de backup-JSON terugzetten via
  "Backup terugzetten", niet in Safari zelf.
