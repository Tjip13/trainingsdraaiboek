## Trainingsdraaiboek als eigen website, stap voor stap

Dit pakket maakt van de Claude-app een gewone website die iedereen (ook zonder
Claude) in de browser kan gebruiken. Je hoeft niet te kunnen programmeren.
Volg de stappen in volgorde. Stap 1 en 2 doe je maar één keer in je leven.

Belangrijk om vooraf te weten:
- De gegevens staan per apparaat/browser (dus je iPad en MacBook hebben elk
  hun eigen data). Overzetten doe je met de Backup-knop in de app: downloaden
  op het ene apparaat, terugzetten via Info & inpaklijst op het andere.
- De QR-codes werken op de website gewoon, zonder foutmelding.

### Stap 1: Node.js installeren (eenmalig, ± 5 minuten)

Node.js is een gratis hulpprogramma dat de website voor je in elkaar zet.

1. Ga naar https://nodejs.org
2. Klik op de grote groene knop met "LTS" erin (de aanbevolen versie)
3. Open het gedownloade bestand en klik steeds op "Ga door" / "Installeer"
   (net als bij elk ander Mac-programma)
4. Klaar. Je merkt verder niets van Node.js, het draait op de achtergrond.

### Stap 2: Terminal leren openen (eenmalig)

1. Druk op Cmd + spatie (Spotlight), typ "Terminal" en druk op Enter
2. Er opent een venster met wat tekst en een knipperende cursor. Dat is alles.

### Stap 3: het pakket klaarzetten

1. Pak de zip uit (dubbelklik). Je krijgt een map "standalone".
   Zet die map ergens logisch, bijvoorbeeld in Documenten, en hernoem
   hem gerust naar "trainingsdraaiboek".
2. Open Terminal en typ: cd gevolgd door een spatie (nog geen Enter!)
3. Sleep nu de map vanuit Finder het Terminal-venster in. Het pad
   verschijnt vanzelf achter "cd ".
4. Druk op Enter. Terminal "staat" nu in die map.

### Stap 4: de website bouwen

Typ deze twee opdrachten, één voor één, elk gevolgd door Enter.
Wacht steeds tot de cursor weer knippert voor je de volgende typt.

1. `npm install`
   (haalt eenmalig de bouwstenen op, duurt 1 tot 2 minuten; waarschuwingen
   in gele tekst zijn normaal en kun je negeren)
2. `npm run build`
   (bouwt de site; na afloop staat er een nieuwe map "dist" in je map)

Wil je eerst even lokaal kijken? Typ dan `npm run dev`, open het adres
dat verschijnt (meestal http://localhost:5173) in je browser, en stop
daarna met Ctrl + C in Terminal.

### Stap 5, route A: online zetten via Netlify (de makkelijkste weg)

1. Ga naar https://app.netlify.com/drop
2. Maak een gratis account (e-mailadres volstaat) als daarom gevraagd wordt
3. Sleep de map "dist" (uit stap 4) vanuit Finder in het grote vak op die pagina
4. Na een paar seconden krijg je een webadres zoals
   https://willekeurige-naam.netlify.app. Dat is je app!
5. Mooiere naam? In Netlify: Site settings > Change site name.

### Stap 5, route B: online zetten via GitHub Pages (als je liever GitHub wilt)

1. Maak een gratis account op https://github.com
2. Klik rechtsboven op + en kies "New repository". Geef hem een naam
   (bijv. trainingsdraaiboek) en klik "Create repository".
   Let op: kies je "Private", dan is de code privé, maar de gepubliceerde
   website is alsnog bereikbaar voor iedereen die de link kent (echt
   afschermen kan alleen met een betaald GitHub-abonnement).
3. Klik op "uploading an existing file" (linkje op de lege repo-pagina)
4. Open in Finder je map en druk op Cmd + Shift + punt zodat je ook de
   verborgen map ".github" ziet. Sleep ALLES uit de map (dus ook .github,
   maar NIET de mappen "dist" en "node_modules") naar de uploadpagina
   en klik "Commit changes".
5. Ga in de repository naar Settings > Pages en zet bij "Source":
   "GitHub Actions".
6. Klik bovenin op het tabblad "Actions" en wacht tot het groene vinkje
   verschijnt (± 2 minuten). Je site staat dan op:
   https://JOUWGEBRUIKERSNAAM.github.io/trainingsdraaiboek/

### Op de iPad als "echte app"

Open het webadres in Safari op de iPad, tik op het deel-icoon en kies
"Zet op beginscherm". Je krijgt dan een app-icoon en de site opent
zonder browserbalken, ideaal tijdens een trainingsdag.

### Later een nieuwe versie van de app plaatsen

1. Vervang het bestand src/trainingsdraaiboek.jsx door de nieuwste versie
   uit Claude (zelfde naam, zelfde plek)
2. Route A: opnieuw `npm run build` in Terminal en de nieuwe "dist" weer
   in Netlify Drop slepen (via app.netlify.com kun je ook "Deploys" openen
   en daar slepen, dan houd je hetzelfde adres)
3. Route B: upload alleen dat ene bestand opnieuw via GitHub
   (Add file > Upload files, in de map src). GitHub bouwt en publiceert
   dan automatisch.

### Als iets niet lukt

Maak een schermfoto van de foutmelding en geef die aan Claude (Sonnet of
Opus) samen met dit README-bestand. Zeg erbij bij welke stap het misging.
