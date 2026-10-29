// Euro amounts as the cashier kiosk shows them ("1,50 €"); the backend stores cents.
const euroFormat = new Intl.NumberFormat('de-AT', {
  style: 'currency',
  currency: 'EUR',
});

export function euro(cents: number): string {
  return euroFormat.format(cents / 100);
}

// "1,50", "1.5", "-2" or "2 €" -> 150, 150, -200, 200; null when it is no amount.
export function parseEuro(text: string): number | null {
  const match = /^\s*(-?)\s*(\d{1,5})(?:[.,](\d{1,2}))?\s*€?\s*$/.exec(text);
  if (!match) return null;
  const cents =
    Number(match[2]) * 100 + Number((match[3] ?? '0').padEnd(2, '0'));
  return match[1] === '-' ? -cents : cents;
}

// The value for an input field: "1,50", "-2,00".
export function euroInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}
