const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as "YYYY-MM-DD". */
export function toISODate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromISODate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today() {
  return toISODate(new Date());
}

export function addDays(iso: string, days: number) {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Month key as "YYYY-MM". */
export function monthKey(date: Date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

export function daysInMonth(key: string) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function monthLabel(key: string, withYear = true) {
  const [y, m] = key.split('-').map(Number);
  return withYear ? `${MONTHS[m - 1]} ${y}` : MONTHS[m - 1];
}

export function shortDate(iso: string) {
  const d = fromISODate(iso);
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "Today", "Yesterday", or e.g. "Monday, Sep 28". */
export function friendlyDay(iso: string) {
  const t = today();
  if (iso === t) return 'Today';
  if (iso === addDays(t, -1)) return 'Yesterday';
  const d = fromISODate(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}${sameYear ? '' : `, ${d.getFullYear()}`}`;
}

/** e.g. "Saturday, October 3". */
export function longDate(date: Date = new Date()) {
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
