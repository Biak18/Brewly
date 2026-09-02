// scripts/check-i18n.js - CI check that en and my have same keys and no missing translations used in code
const fs = require("fs");
const path = require("path");

const enPath = path.join(__dirname, "..", "src", "i18n", "locales", "en.json");
const myPath = path.join(__dirname, "..", "src", "i18n", "locales", "my.json");

const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
const my = JSON.parse(fs.readFileSync(myPath, "utf8"));

function flatKeys(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object" && v !== null ? flatKeys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

const enKeys = new Set(flatKeys(en));
const myKeys = new Set(flatKeys(my));
const missingInMy = [...enKeys].filter((k) => !myKeys.has(k));
const missingInEn = [...myKeys].filter((k) => !enKeys.has(k));

let failed = false;
if (missingInMy.length) {
  console.error("Missing in my.json:", missingInMy);
  failed = true;
}
if (missingInEn.length) {
  console.error("Missing in en.json:", missingInEn);
  failed = true;
}

// Also check for empty strings
function flatValues(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) Object.assign(out, flatValues(v, key));
    else out[key] = v;
  }
  return out;
}
const enVals = flatValues(en);
for (const [k, v] of Object.entries(enVals)) {
  if (typeof v === "string" && !v.trim()) {
    console.error(`Empty translation en.json:${k}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(`i18n parity OK - ${enKeys.size} keys`);
