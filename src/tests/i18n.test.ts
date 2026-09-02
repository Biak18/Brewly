import en from "@/i18n/locales/en.json";
import my from "@/i18n/locales/my.json";

function flat(o: any, p = ""): Record<string, string> {
  const r: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) Object.assign(r, flat(v, key));
    else r[key] = String(v);
  }
  return r;
}

describe("i18n locales", () => {
  it("en and my have same keys", () => {
    const enFlat = flat(en);
    const myFlat = flat(my);
    const enKeys = Object.keys(enFlat).sort();
    const myKeys = Object.keys(myFlat).sort();
    const missingInMy = enKeys.filter((k) => !(k in myFlat));
    const missingInEn = myKeys.filter((k) => !(k in enFlat));
    expect(missingInMy).toEqual([]);
    expect(missingInEn).toEqual([]);
  });

  it("contains previously missing keys", () => {
    const enFlat = flat(en);
    for (const k of [
      "checkout.freeCoffeeHint",
      "checkout.closed",
      "checkout.transactionIdRequired",
      "loyalty.remaining",
      "addresses.deleteLabel",
      "addresses.editLabel",
      "account.nameRequired",
      "account.nameUpdateFailed",
      "account.passwordChangeFailed",
      "account.passwordMin",
      "account.passwordsMismatch",
    ]) {
      expect(enFlat[k]).toBeDefined();
    }
  });

  it("has no empty translations", () => {
    const enFlat = flat(en);
    for (const [k, v] of Object.entries(enFlat)) {
      expect(v.trim().length).toBeGreaterThan(0);
    }
  });
});
