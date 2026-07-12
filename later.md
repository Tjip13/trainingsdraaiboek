# Later (niet nu bouwen)

Ideeën die tijdens het werk opkwamen maar buiten de scope van de huidige
klus vallen. Niet in de code verwerken zonder expliciete opdracht.

- Alle praktijksimulaties in één keer los exporteren (bijv. één PDF per
  scenario, verzameld in een zip) i.p.v. één voor één via het printknopje.
  Kwam op tijdens klus 2 (PDF-export), niet gevraagd.

- Trainersraster-export: nieuw exportformat als tabel met kolommen tijd /
  onderwerp / slide / details / benodigdheden, met de oefening-instructies
  in de rij zelf (niet apart achterin), plus vast kopblok met opdrachtgever,
  contactpersoon, acteur, tijden en paklijst. Gebruiker heeft voorbeelden
  van zijn huidige Excel-trainersdraaiboek. Doel: tijdens de training nooit
  hoeven bladeren tussen tijdschema en instructies.
  Aanvullende exportwensen, zelfde soort klus, later samen oppakken:
  - Leerwensen, lastig gedrag, eindronde en eigen aantekeningen als platte
    tekst/markdown exporteren (bewerkbaar in Word/Pages), voor
    trainingsverslag en aantekeningen bij het evaluatiegesprek.
  - Acteursbriefing aanvullen met bijv. doelgroep-info.
  - Draaiboek-export in een eigen leesformat met ruimte voor opmerkingen
    per blok.
  De verslag-workflow zelf (samenvoegen tot een trainingsverslag) hoort bij
  de aantekeningenmachine van het administratiesysteem, niet in deze app.

- Instructiekaartjes-export breekt nog af midden in een oefening bij het
  printen. Dezelfde veld-splitsing die dit voor scenario's oploste
  (break-inside: avoid per veld i.p.v. één grote <pre> per oefening) zou dit
  ook hier moeten oplossen. Lage prioriteit.

- Zichtbare "nieuwe versie beschikbaar, tik om te verversen"-melding zodra
  de service worker een update detecteert, i.p.v. stil op de achtergrond
  verversen. Kwam op tijdens klus 3 (offline/PWA), niet gevraagd.

- Info & inpaklijst-indeling: "Backup terugzetten" en doelgroepen-beheer
  zitten onlogisch onderaan het scherm, terwijl "Backup" (downloaden)
  rechtsboven in de app zit. Idee: beheer-functies (backup maken/terugzetten,
  doelgroepen) bij elkaar zetten. Kwam op na de iPad-test van klus 3.

- Privacy: deelnemersgegevens stapelen zich op in de app (en dus in elke
  backup) omdat er geen opschoonstap is na afloop van een training. Wens:
  werkwijze of kleine functie om deelnemersdata van afgeronde trainingen te
  wissen nadat die naar het archief van project #6 geëxporteerd is.
  Privacy-relevant: te zijner tijd eerst langs de privacy-agent (#3) voordat
  dit gebouwd wordt.
