// Draait na "vite build" (zie package.json). Leest de dist-map uit en
// schrijft dist/sw.js met de volledige bestandslijst van deze build, zodat
// de cache-lijst nooit met de hand bijgehouden hoeft te worden.
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { createHash } from "crypto";
import { join, relative, sep } from "path";

const distDir = new URL("../dist", import.meta.url).pathname;

function verzamelBestanden(dir) {
  let resultaat = [];
  for (const naam of readdirSync(dir)) {
    const pad = join(dir, naam);
    if (statSync(pad).isDirectory()) resultaat = resultaat.concat(verzamelBestanden(pad));
    else resultaat.push(pad);
  }
  return resultaat;
}

const alleBestanden = verzamelBestanden(distDir).filter((p) => !p.endsWith(sep + "sw.js"));
const relatievePaden = alleBestanden.map((p) => "./" + relative(distDir, p).split(sep).join("/"));

const hash = createHash("sha256");
for (const pad of alleBestanden.sort()) hash.update(readFileSync(pad));
const buildHash = hash.digest("hex").slice(0, 12);

const bestandenLijst = JSON.stringify(["./", ...relatievePaden], null, 2);

const template = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const output = template
  .replace(/const CACHE_NAAM = ".*";/, `const CACHE_NAAM = "trainingsdraaiboek-${buildHash}";`)
  .replace(/const BESTANDEN = \[.*\];/s, `const BESTANDEN = ${bestandenLijst};`);

writeFileSync(join(distDir, "sw.js"), output);
console.log(`sw.js gegenereerd met ${relatievePaden.length} bestanden, cache-versie ${buildHash}`);
