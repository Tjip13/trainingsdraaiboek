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
