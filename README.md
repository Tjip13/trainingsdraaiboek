## Trainingsdraaiboek

De app staat live op:

**https://tjip13.github.io/trainingsdraaiboek/**

Open die link in de browser om de app te gebruiken. Geen installatie nodig.

### Op de iPad als "echte app" (werkt dan ook offline)

1. Open de link hierboven in **Safari** op de iPad.
2. Tik op het deel-icoon en kies **"Zet op beginscherm"**.
3. Open de app vanaf nu altijd via dat beginscherm-icoon, niet meer via
   Safari zelf. De app werkt dan zonder browserbalken, en na één keer
   openen met internet blijft hij ook zonder verbinding werken (handig
   tijdens een trainingsdag zonder goed bereik).

### Belangrijk om te weten

- **Gegevens staan per apparaat/browser.** Je MacBook, je iPad-Safari en je
  iPad-beginscherm-app hebben elk hun eigen, gescheiden opslag, ook op
  hetzelfde apparaat. Overzetten doe je met de **Backup**-knop (rechtsboven
  in de app): downloaden op het ene apparaat/opslag, terugzetten via
  **Info & inpaklijst → Backup terugzetten** op de andere.
- Zet je de app voor het eerst op het beginscherm van de iPad, dan begint
  die met lege data totdat je daar zelf een backup terugzet, ook als je op
  diezelfde iPad al met de app in Safari had gewerkt.
- De QR-codes werken op de live site gewoon, zonder foutmelding.

### Als iets niet lukt

Maak een schermfoto van de foutmelding en geef die aan Claude (Sonnet of
Opus) samen met dit README-bestand. Zeg erbij wat je deed toen het misging.

---

## Voor de beheerder

Dit gedeelte is alleen nodig om de app zelf te bouwen of een nieuwe versie
te publiceren, niet om hem te gebruiken.

### Eenmalig: Node.js installeren

1. Ga naar https://nodejs.org
2. Klik op de grote groene knop met "LTS" erin (de aanbevolen versie)
3. Open het gedownloade bestand en klik steeds op "Ga door" / "Installeer"
4. Klaar. Je merkt verder niets van Node.js, het draait op de achtergrond.

### Lokaal bekijken

In Terminal, in de projectmap:

```
npm install
npm run dev
```

Open het adres dat verschijnt (meestal http://localhost:5173) in de
browser. Stop met Ctrl + C.

### Een nieuwe versie publiceren

De site publiceert zichzelf automatisch via GitHub Actions zodra er naar de
`main`-branch gepusht wordt (zie `.github/workflows/deploy.yml`). Vanuit de
Claude Code-werkmap dus gewoon:

```
git add -A
git commit -m "omschrijving van de wijziging"
git push
```

Voortgang is te volgen via het tabblad "Actions" op GitHub, duurt ongeveer
2 minuten.
