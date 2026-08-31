// scripts/add-i18n-keys.js — one-shot helper that appends the new UI strings
// for the driver availability toggle, driver form validation, chat pagination
// and forgot-password error handling to both locales. Run: node scripts/add-i18n-keys.js
const fs = require("fs");
const path = require("path");

const enPath = path.join(__dirname, "..", "src", "i18n", "locales", "en.json");
const myPath = path.join(__dirname, "..", "src", "i18n", "locales", "my.json");

const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
const my = JSON.parse(fs.readFileSync(myPath, "utf8"));

// English strings
en.common = en.common ?? {};
// Pre-existing gap caught by the parity check below: my.json had this key.
en.common.cancel = "Cancel";
en.auth.resetEmailFailed =
  "Couldn't send the reset link. Check your connection and try again.";
Object.assign(en.chat, {
  empty: "No messages yet. Say something about your order.",
  placeholder: "Message…",
  sendMessage: "Send message",
  loadEarlier: "Load earlier messages",
  sendFailed: "Could not send the message. Try again.",
});
Object.assign(en.driver, {
  nameRequired: "Enter your full name",
  phoneInvalid: "Enter a valid phone number",
  vehicleRequired: "Enter your vehicle (e.g. motorbike)",
  registerFailed: "Could not register as a driver. Please try again.",
  ordersError: "Couldn't load your deliveries",
  availableForDeliveries: "Available for deliveries",
  onlineHint: "Shops can assign you deliveries.",
  offlineHint: "Shops can't see you until you turn this on.",
  availabilityUpdateFailed: "Could not update your availability",
  statusUpdateFailed: "Could not update the delivery",
  openInMaps: "Open in Google Maps",
  openMapsFailed: "Could not open maps",
});

// Burmese strings
my.auth.resetEmailFailed =
  "လင့်ခ်ပို့၍ မရပါ။ ချိတ်ဆက်မှုကို စစ်ဆေးပြီး ထပ်ကြိုးစားပါ။";
Object.assign(my.chat, {
  empty: "မက်ဆေ့ج် မရှိသေးပါ။ အော်ဒါအကြောင်း စကားပြောပါ။",
  placeholder: "မက်ဆေ့ج်…",
  sendMessage: "မက်ဆေ့ج် ပို့ရန်",
  loadEarlier: "မက်ဆေ့ج် အရင်များ ရယူရန်",
  sendFailed: "မက်ဆေ့ج် ပို့၍ မရပါ။ ထပ်ကြိုးစားပါ။",
});
Object.assign(my.driver, {
  nameRequired: "အမည်အပြည့်အစုံ ထည့်ပါ",
  phoneInvalid: "ဖုန်းနံပါတ် မှန်ကန်စွာ ထည့်ပါ",
  vehicleRequired: "ယာဉ်အမျိုးအစား ထည့်ပါ (ဥပမာ - ဆိုင်ကယ်)",
  registerFailed: "ယာဉ်မောင်းအဖြစ် မှတ်ပုံတင်၍ မရပါ။ ထပ်ကြိုးစားပါ။",
  ordersError: "ပို့ဆောင်မှုများ ရယူ၍ မရပါ",
  availableForDeliveries: "ပို့ဆောင်မှုများအတွက် ရနိုင်",
  onlineHint: "ဆိုင်များက သင့်အား ပို့ဆောင်မှု သတ်မှတ်နိုင်ပါသည်",
  offlineHint: "ဤခလုတ်ကို ဖွင့်မချင်း ဆိုင်များက သင့်ကို မမြင်ရပါ",
  availabilityUpdateFailed: "ရနိုင်မှု အခြေအနေ ပြောင်းလဲ၍ မရပါ",
  statusUpdateFailed: "ပို့ဆောင်မှုကို အပ်ဒိတ်လုပ်၍ မရပါ",
  openInMaps: "Google Maps တွင် ဖွင့်ရန်",
  openMapsFailed: "မြေပုံကို ဖွင့်၍ မရပါ",
});

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + "\n");
fs.writeFileSync(myPath, JSON.stringify(my, null, 2) + "\n");

// Sanity: the two locales must expose the exact same key set.
function flatKeys(obj, prefix = "") {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object" && v !== null ? flatKeys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}
const enKeys = new Set(flatKeys(en));
const myKeys = new Set(flatKeys(my));
const missingInMy = [...enKeys].filter((k) => !myKeys.has(k));
const missingInEn = [...myKeys].filter((k) => !enKeys.has(k));
if (missingInMy.length || missingInEn.length) {
  console.error("Locale parity broken!", { missingInMy, missingInEn });
  process.exit(1);
}
console.log("i18n keys added; parity OK");
