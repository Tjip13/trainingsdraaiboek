# Plan content-koppeling blokkendoos (project #6)

Eenmalig plan, gemaakt met Fable 5. Bouwen doet Sonnet 4.6 (één stap Opus 4.8) in Cowork. Leidend principe: simpel boven volledig. Dit plan bouwt twee dingen: een structuurmaakmachine en een output-archief. De blokkendoos-app zelf wordt niet verbouwd, die krijgt alleen een contract (sectie 5).

## 1. Het datacontract: wat de blokkendoos verwacht

Vastgesteld uit de standalone-code (v2-datamodel, key `tdb-data-v1`):

Een oefening (exercise) heeft deze velden:

```json
{
  "naam": "",
  "cat": "intro | ijsbreker | theorie | grenzen | uitwisseling | acteur | simulatie | fysiek | energizer | evaluatie | mbti | overig",
  "duurKort": 10, "duurLang": 20,
  "minDeel": 4, "maxDeel": 12,
  "benodigd": "", "ruimte": "", "volgorde": "", "sheets": "",
  "instructie": "", "varianten": "", "doel": "",
  "tags": "komma,gescheiden,string",
  "energie": "zittend | actief | fysiek",
  "notities": [], "scenarios": [], "typen": []
}
```

Een scenario (praktijksimulatie, zit in `scenarios[]` van een oefening) heeft: titel, persoon, doelGesprek, vooraf, beleving, gedrag, zinnen, locatie, aanwezig, voorkennis, doelgroepen[], heftigheid (0-3), fysiekeDreiging (bool), persoonlijk (bool), vanDeelnemer, eigen[] (vrije kop/tekst-paren voor velden die nergens passen).

De structuurmaakmachine levert een importbestand in dit formaat:

```json
{ "formaat": "tdb-import-v1", "exercises": [ ...oefeningen zonder id... ] }
```

Id's kent de app zelf toe bij import, dat voorkomt botsingen. Dit importformaat is de enige koppeling tussen machine en app. Handouts: geen nieuwe entiteit in de app (bewuste keuze). Handout-bestanden staan als bestand in de bibliotheekmap, de oefening verwijst ernaar via een conventie-regel in het veld `benodigd`: `Handout: <bestandsnaam>`. Geen app-wijziging nodig.

## 2. Structuurmaakmachine

Een module in de bestaande Flask-app van het administratiesysteem (hergebruikt shell, huisstijl en `ollama_client.py`). Eén invoer, één uitvoer: bestand(en) erin, importbestand plus eventueel losse handout-bestanden eruit. Geen bibliotheekbeheer, geen preview-editor, de blokkendoos zelf is al de editor.

Pipeline in drie lagen:

1. **Tekst binnenhalen**
   - Digitaal (docx, md, txt, pdf met tekstlaag): directe tekstextractie, volledig lokaal, geen AI.
   - Gescand/gefotografeerd (jpg, png, gescande pdf, stencils): OCR via Apple Vision op de Mac mini (lokaal, gratis, goed in zowel druk als handschrift). Zelfde route als de bonnetjesmachine uit het masterplan, dus deze kennis wordt hergebruikt.
2. **Structureren naar het contract**: een taalmodel leest de ruwe tekst en vult de oefening/scenario-velden. Hier zit de enige echte AI-afweging, zie hieronder.
3. **Wegschrijven**: importbestand in een uitvoermap, klaar om in de blokkendoos te importeren.

De AI-afweging, eerlijk. Dit is trainingscontent, geen persoonsgegevens, dus beide routes zijn verdedigbaar:

| Route | Voordeel | Nadeel |
|---|---|---|
| Lokaal, Ollama (qwen2.5:14b) | Niets verlaat de Mac, gratis, consistent met het administratiesysteem | Kwaliteit merkbaar lager bij rommelige stencils en impliciete structuur, meer nakijkwerk |
| Claude (via Cowork of API) | Beste kwaliteit, begrijpt trainingsjargon en vult categorieën en duur beter in | Content gaat naar de cloud, kost tokens |

Advies: bouw de machine met Ollama als standaard en een schakelaar per verwerking ("deze batch via Claude"). Oude stencils met veel context zijn de gevallen waar Claude het verschil maakt. Eén uitzondering: staat er in een casus toch een herleidbare situatie of naam (van-deelnemer-scenario's), dan eerst anonimiseren of lokaal houden. De machine controleert dat niet, dat is jouw blik bij het klaarzetten.

v1-afbakening: één bestand of één map als invoer, één importbestand als uitvoer, plus eventuele losse handout-bestanden als bijproduct in dezelfde uitvoermap. Geen duplicaatdetectie (doet de app bij import), geen batchgeschiedenis, geen correctie-interface.

## 3. Output-archief

Mappensjabloon plus een klein hulpscript, precies zoals masterplan sectie 6 en 7 al voorzien. Het archief ís de opdrachtmap:

```
data/klanten/<klant>/<opdracht-ID>/        bijv. 2026-014-gemeenteX
├── draaiboek/          (export uit de blokkendoos: tekst of PDF)
├── keynote/            (.key of .pptx)
├── handouts/           (kopieën van de gebruikte handouts)
├── deelnemers/         (namenlijst, leervragen, intake-export)
├── evaluatie/          (formulieren, uitwerking)
└── status.json         (conform PM-koppeling masterplan sectie 6)
```

Het hulpscript (`nieuw-archief`, ook een kleine module in de Flask-app): vraagt klant, opdracht-ID en trainingstype, maakt de map met submappen aan, zet een lege `status.json` neer, en verplaatst bestanden die je in een dropmap klaarlegt naar de juiste submap op bestandstype (.key/.pptx naar keynote, .pdf-handouts naar handouts, enzovoort). Meer niet. Geen watchers, geen sync, geen automatische export uit de app.

Privacy: alles onder `data/`, buiten de Cowork-projectmap, nooit door Claude gezien. Dat is voldoende. Anonimiseren van leervragen is géén vaste stap in het archief zelf. Het wordt pas een stap op het moment dat content uit het archief richting Claude gaat (bijvoorbeeld een leervraag die je wilt verwerken in een handout of casus). Maak daarvoor één afspraak: wat uit `deelnemers/` komt, gaat nooit letterlijk een Cowork-sessie in, alleen in geanonimiseerde samenvatting. Dat is een werkregel, geen software.

## 4. Offline-strategie bibliotheek

De offline-eis vertaalt zich verrassend simpel dankzij het bestaande datamodel: bibliotheek én trainingen zitten in één JSON-blob in localStorage van het apparaat zelf. Als de app eenmaal als PWA offline draait (werk uit app #1), werkt dus automatisch álles offline: draaiboek doorlopen, klok, én het deelnemers-/intaketabblad. Er hoeft geen aparte offline-bibliotheek te komen.

De consequentie zit in het klaarzetten vóór een training, dat is een bewuste handmatige stap:

1. Thuis (online, op de Mac): nieuwe content via de structuurmaakmachine omzetten en in de blokkendoos importeren, training plannen.
2. Backup-JSON downloaden uit de app (bestaande functie).
3. Bestand naar laptop/iPad brengen (AirDrop of Bestanden-app) en daar in de app terugzetten via "Backup terugzetten".
4. Vanaf dat moment is het apparaat zelfvoorzienend, wifi op locatie is niet nodig.

Kanttekening voor de terugweg: wijzigingen tijdens de training (presentie, evaluatienotities) staan dan alleen op dat apparaat. Wil je ze thuis terug, dan dezelfde route omgekeerd. Accepteer dat als werkwijze, apparaat-sync bouwen is precies de valkuil die we vermijden.

## 5. Eisen aan de blokkendoos-app (het contract, meegeven aan Sonnet bij app #1)

Bij het afmaken van app #1 (GitHub, PDF-export, offline/PWA) gelden deze eisen, letterlijk over te nemen:

1. **Datamodel v2 is bevroren.** De velden van exercises en scenarios zoals nu in de code (`leegExercise`, `leegScenario`) blijven ongewijzigd. Nieuwe velden mogen alleen optioneel erbij, nooit hernoemen of verwijderen, en altijd via `migrate()` afgedekt.
2. **Nieuwe functie, de enige uitbreiding: bibliotheek-import.** Een knop in het bibliotheekscherm die een `tdb-import-v1`-JSON inleest en de oefeningen toevoegt aan `bibliotheek.exercises`. Id's toekennen bij import. Bestaat een oefening met exact dezelfde naam al, dan overslaan en dat melden. Niets vervangen, niets mergen.
3. **Backup en restore blijven ongewijzigd.** Dit is het transportmiddel naar laptop/iPad (sectie 4), dus het volledige JSON-formaat blijft in- en uitleesbaar.
4. **Offline/PWA moet de complete blob dekken.** Service worker cachet de app-bestanden, alle data blijft in localStorage. Na één keer online laden werkt alles, inclusief deelnemers-/intaketabblad, zonder verbinding.
5. **PDF-export leest uit dezelfde datastructuur** en gaat ervan uit dat `benodigd` een regel `Handout: <bestandsnaam>` kan bevatten, die gewoon als tekst meegeprint wordt.
6. **`parseScenarioTekst` en het scenario-sjabloon blijven bestaan**, als handmatige invoerroute naast de import.

## 6. Raakvlakken met administratiesysteem en PM-systeem (niets herontwerpen)

- Het output-archief ís de opdrachtmap uit masterplan sectie 6/7, inclusief opdracht-ID-formaat en `status.json`. Eén structuur, geen tweede.
- De structuurmaakmachine en het archiefscript worden modules in dezelfde Flask-app (`app/modules/`), en hergebruiken `ollama_client.py` en de OCR-aanpak van de bonnetjesmachine.
- De handout-creatiemachine (groep F van het masterplan) produceert de bestanden waar de blokkendoos via de `Handout:`-conventie naar verwijst, en waarvan kopieën in `handouts/` van het archief landen.
- Het PM-systeem krijgt alleen het pad naar de opdrachtmap, zoals het masterplan al afspreekt. Verder niets.

## 7. Cowork-locatie

Alles binnen de bestaande structuur uit masterplan sectie 7:

```
~/administratiesysteem/bouw/
├── plan-content-koppeling-blokkendoos.md   ← dit bestand
└── app/modules/
    ├── structuurmaker/
    └── archief/
```

Invoer voor de structuurmaakmachine (scans, stencils) zet je in een werkmap `bouw/structuurmaker-invoer/`, dat is immers content, geen persoonsgegevens. De uitvoer (importbestanden) landt daar ook, jij sleept ze zelf de blokkendoos in.

## 8. Bouwvolgorde, model en instellingen

| Stap | Wat | Model | Effort | Thinking | Waarom |
|---|---|---|---|---|---|
| 0 | Contract (sectie 5) meegeven bij het afmaken van app #1 | Sonnet 4.6 | medium | uit | Hoort bij app #1, geen apart werk, alleen de eisen erbij plakken |
| 1 | Output-archief: sjabloon + hulpscript | Sonnet 4.6 | low | uit | Mappen en kopieerregels, routinewerk |
| 2 | Structuurmaker v1, alleen digitale invoer, Ollama-route | Sonnet 4.6 | medium | aan | Eenmalig ontwerpwerk aan de structureer-prompt en veldmapping, daarna routine |
| 3 | OCR-route voor scans/foto's/stencils (Apple Vision) | Opus 4.8 | high | aan | Rommelige OCR-invoer, zelfde reden als de bonnetjesmachine in het masterplan |
| 4 | Claude-schakelaar als alternatieve structureer-route | Sonnet 4.6 | low | uit | Klein, de pipeline staat er dan al |

Volgorde-logica: Stap 1 heeft als enige afhankelijkheid het fundament (masterplan stap 1), daarna direct te bouwen. Stap 2 pas na stap 6 van het masterplan (interview-uitwerker), want die bouwt de Ollama-koppeling die stap 2 hergebruikt. Stap 3 pas na de bonnetjesmachine, zelfde argument voor de Vision-OCR. Zo wordt niets dubbel gebouwd. Tokens: thinking alleen aan waar ontworpen of ontrafeld wordt.

## 9. Startinstructie eerste bouwsessie (kopieer dit naar Sonnet)

> Je bouwt het output-archief van een lokaal administratiesysteem voor een eenmanszaak in trainingen. Werkmap: `~/administratiesysteem/bouw/`. Lees eerst `masterplan-administratiesysteem.md` (sectie 6 en 7) en `plan-content-koppeling-blokkendoos.md` (sectie 3) in die map, die zijn leidend.
>
> Bouw in deze sessie precies twee dingen, niets meer:
> 1. Een module `app/modules/archief/` in de bestaande Flask-app met één formulier: klant, opdracht-ID (formaat `2026-014-gemeenteX`), trainingstype. Bij verzenden maakt hij `data/klanten/<klant>/<opdracht-ID>/` aan met de submappen draaiboek, keynote, handouts, deelnemers, evaluatie, plus een lege `status.json`.
> 2. Een dropmap-functie: bestanden die in `data/_dropmap/` staan worden bij een tweede knop naar de juiste submap van de gekozen opdracht verplaatst op bestandstype (.key en .pptx naar keynote, pdf met "draaiboek" in de bestandsnaam naar draaiboek/, overige .pdf naar handouts, .xlsx naar deelnemers, rest blijft staan met een melding).
>
> Harde regels: geen database, geen instellingen, geen extra features, geen bestanden buiten `bouw/` en `data/` aanraken, en de inhoud van bestanden in `data/` nooit openen of inlezen, alleen verplaatsen. Als iets onduidelijk is, kies de simpelste variant en noteer je keuze in `bouw/beslissingen.md`. Sluit af met een testinstructie van maximaal vijf regels.

## 10. Wat bewust NIET in dit plan zit

- Aanpassingen aan de blokkendoos zelf, behalve de importfunctie uit het contract. PWA, GitHub en PDF-export zijn en blijven werk van app #1.
- Handouts als entiteit in de app, een correctie-interface in de structuurmaker, duplicaatdetectie buiten de naam-check, en elke vorm van apparaat-synchronisatie.
- De handout-creatiemachine zelf (groep F van het masterplan) en de logica-agent (#5).

## Aanvulling voor masterplan-administratiesysteem.md

Eén zin toevoegen aan sectie 3, groep F, zodat de plannen naar elkaar verwijzen:

> De structuurmaakmachine en het archiefscript uit project #6 worden gebouwd als modules `app/modules/structuurmaker/` en `app/modules/archief/` in deze app, volgens `plan-content-koppeling-blokkendoos.md`, en hergebruiken de Ollama-koppeling (stap 6) en de Vision-OCR van de bonnetjesmachine (stap 4).
