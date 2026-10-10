const number = new Intl.NumberFormat('de-AT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Cents as "1,70 €", the way prices are written on the buffet signs
 * (de-AT's currency format would put the € first). Negative amounts get a
 * real minus sign: "−2,00 €".
 */
export function euro(cents: number): string {
  const text = number.format(Math.abs(cents) / 100);
  return `${cents < 0 ? '−' : ''}${text} €`;
}
