# Startinstructie Claude Code: blokkendoos afmaken

Dit gaat over **project #1 (blokkendoos afmaken) uit projecten-voor-fable.md**. Het genoemde contract is **sectie 5 uit plan-content-koppeling-blokkendoos.md**.

Sessie-instellingen: **Sonnet 4.6, effort medium, thinking uit**, in **Claude Code**.

Vooraf zelf doen:
- Het pad naar de code invullen op de plek tussen blokhaken hieronder.
- `plan-content-koppeling-blokkendoos.md` in die werkmap zetten, zodat Sonnet het contract kan lezen.

## Instructie (kopieer dit naar Sonnet in Claude Code)

> Je maakt een bestaande React-app af: het trainingsdraaiboek (de "blokkendoos"), een Vite-app voor een trainer met een eenmanszaak. Werkmap: ~/trainingsdraaiboek/. Lees eerst `README.md` en bekijk `src/trainingsdraaiboek.jsx` globaal. In de werkmap staat ook `plan-content-koppeling-blokkendoos.md`; sectie 5 daarvan is een bindend contract voor al je werk.
>
> Er zijn vier klussen, in deze volgorde, één klus per sessie:
>
> 1. **GitHub + online zetten.** Er staat al een deploy-workflow in `.github/workflows/deploy.yml`. Zet het project in een GitHub-repository en zorg dat de app via GitHub Pages draait. Leg de stappen die ik zelf moet doen (repo aanmaken, secrets, Pages aanzetten) uit in maximaal tien regels.
> 2. **PDF-export.** Het draaiboek en de praktijksimulaties moeten printbaar en als PDF te exporteren zijn, simulaties ook los per stuk (om naar acteurs te sturen). Bouw voort op de bestaande tekst-export (`buildExportText`), geen nieuwe exportlogica ernaast.
> 3. **Offline/PWA.** Service worker die de app-bestanden cachet, zodat na één keer online laden alles zonder verbinding werkt op laptop en iPad: draaiboek doorlopen, live klok, en het deelnemers-/intaketabblad. Alle data blijft in localStorage, bouw geen sync.
> 4. **Bibliotheek-import.** Eén knop in het bibliotheekscherm die een JSON-bestand in het formaat `tdb-import-v1` inleest (zie het contract) en de oefeningen toevoegt. Id's toekennen bij import. Bestaat een oefening met exact dezelfde naam al, dan overslaan en dat melden.
>
> Bindend contract (sectie 5 van `plan-content-koppeling-blokkendoos.md`), samengevat: het v2-datamodel is bevroren, velden van exercises en scenarios nooit hernoemen of verwijderen, nieuwe velden alleen optioneel en via `migrate()` afgedekt. Backup en restore blijven ongewijzigd werken. De PDF-export print een regel `Handout: <bestandsnaam>` in het veld benodigd gewoon mee als tekst. `parseScenarioTekst` en het scenario-sjabloon blijven bestaan.
>
> Harde regels: geen database, geen login, geen instellingenschermen, geen extra features, geen "handig voor later". Nieuwe ideeën noteer je in `later.md`, niet in de code. Als iets onduidelijk is, kies de simpelste variant en noteer je keuze in `beslissingen.md`. Sluit elke sessie af met een korte testinstructie.

## Toelichting

Klus 4 (de importfunctie) komt uit het contract van project #6 (uit projecten-voor-fable.md) en is hier toegevoegd omdat hij toch in deze app gebouwd moet worden. Zo is er later geen aparte sessie nodig.

## Plek in de totale volgorde



