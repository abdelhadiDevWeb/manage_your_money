export type Currency = { code: string; symbol: string };

export const Currencies: Currency[] = [
  { code: 'DZD', symbol: 'DA' },
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' },
];

export function currencyFor(code: string): Currency {
  return Currencies.find((c) => c.code === code) ?? Currencies[0];
}

function groupThousands(digits: string) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Formats integer cents, e.g. 123456 -> "$1,234.56". */
export function formatMoney(
  cents: number,
  currency: Currency,
  { sign = false, compact = false }: { sign?: boolean; compact?: boolean } = {}
) {
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const whole = Math.floor(abs / 100);
  const fraction = String(abs % 100).padStart(2, '0');

  let body: string;
  if (compact && whole >= 10000) {
    body = whole >= 1_000_000 ? `${(whole / 1_000_000).toFixed(1)}M` : `${(whole / 1000).toFixed(1)}k`;
  } else if (compact) {
    body = groupThousands(String(whole));
  } else {
    body = `${groupThousands(String(whole))}.${fraction}`;
  }

  const symbolFirst = currency.symbol.length === 1;
  const withSymbol = symbolFirst ? `${currency.symbol}${body}` : `${body} ${currency.symbol}`;
  const prefix = negative ? '−' : sign ? '+' : '';
  return `${prefix}${withSymbol}`;
}

/** Parses user input like "12.5" or "1,200.75" into integer cents. Returns null if invalid. */
export function parseAmountToCents(input: string): number | null {
  const cleaned = input.replace(/,/g, '.').replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const parts = cleaned.split('.');
  if (parts.length > 2) return null;
  const whole = parts[0] === '' ? 0 : Number(parts[0]);
  const fraction = Number((parts[1] ?? '').slice(0, 2).padEnd(2, '0'));
  if (!Number.isFinite(whole) || !Number.isFinite(fraction)) return null;
  return whole * 100 + fraction;
}

export function centsToInput(cents: number) {
  const whole = Math.floor(cents / 100);
  const fraction = cents % 100;
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, '0')}`;
}
