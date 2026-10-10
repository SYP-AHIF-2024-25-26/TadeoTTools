const counts = new Intl.NumberFormat('de-AT', { useGrouping: true });

/** "1.234": a dot groups thousands, as people here write it. */
export function formatCount(n: number): string {
  return counts.format(n).replace(/\s/g, '.');
}

/** "59 %" (whole percent; parts may add up to 99 or 101); "< 1 %" rather than "0 %" for a real count. */
export function formatPercent(part: number, total: number): string {
  const percent = total > 0 ? Math.round((part / total) * 100) : 0;
  return percent === 0 && part > 0 ? '< 1 %' : `${percent} %`;
}

/** "14:32", or "21.11. 14:32" when the data is from another day. */
export function formatStand(at: Date, now = new Date()): string {
  const time = at.toLocaleTimeString('de-AT', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return at.toDateString() === now.toDateString()
    ? time
    : `${at.getDate()}.${at.getMonth() + 1}. ${time}`;
}
