export const CURRENCY_CODE = "MMK";
export const CURRENCY_SYMBOL = "Ks";

export function formatCurrency(value: number): string {
  return `${CURRENCY_SYMBOL} ${value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
