const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
/** e.g. closed Friday → "Saturday – Thursday" */
export function openDays(closed: number[]) {
  const open = [6, 0, 1, 2, 3, 4, 5].filter((d) => !closed.includes(d));
  if (open.length === 7) return 'Every day';
  if (!open.length) return 'Closed';
  return open.length > 2 ? `${DAY[open[0]]} – ${DAY[open[open.length - 1]]}` : open.map((d) => DAY[d]).join(' & ');
}
