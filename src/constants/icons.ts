import type { SymbolViewProps } from 'expo-symbols';

type SymbolName = Extract<SymbolViewProps['name'], object>;
type IOSSymbol = NonNullable<SymbolName['ios']>;
type MaterialSymbol = NonNullable<SymbolName['android']>;

/** SF Symbol on iOS, Material Symbol on Android and web. */
function symbol(ios: IOSSymbol, material: MaterialSymbol): SymbolName {
  return { ios, android: material, web: material };
}

export const Icons = {
  // categories
  food: symbol('fork.knife', 'restaurant'),
  groceries: symbol('cart.fill', 'shopping_cart'),
  transport: symbol('car.fill', 'directions_car'),
  shopping: symbol('bag.fill', 'shopping_bag'),
  bills: symbol('bolt.fill', 'bolt'),
  housing: symbol('house.fill', 'home'),
  entertainment: symbol('film.fill', 'movie'),
  health: symbol('cross.case.fill', 'medical_services'),
  subscriptions: symbol('arrow.triangle.2.circlepath', 'autorenew'),
  other: symbol('square.grid.2x2.fill', 'category'),
  salary: symbol('briefcase.fill', 'work'),
  freelance: symbol('laptopcomputer', 'laptop_mac'),
  investments: symbol('chart.line.uptrend.xyaxis', 'trending_up'),
  gifts: symbol('gift.fill', 'redeem'),
  otherIncome: symbol('banknote.fill', 'payments'),

  // interface
  add: symbol('plus', 'add'),
  close: symbol('xmark', 'close'),
  delete: symbol('trash', 'delete'),
  search: symbol('magnifyingglass', 'search'),
  searchOff: symbol('magnifyingglass', 'search_off'),
  chevronLeft: symbol('chevron.left', 'chevron_left'),
  chevronRight: symbol('chevron.right', 'chevron_right'),
  income: symbol('arrow.down.left', 'south_west'),
  expense: symbol('arrow.up.right', 'north_east'),
  budget: symbol('target', 'savings'),
  currency: symbol('dollarsign.circle', 'payments'),
  data: symbol('externaldrive', 'database'),
  shield: symbol('lock.shield', 'shield_lock'),
  trendUp: symbol('chart.line.uptrend.xyaxis', 'trending_up'),
  trendDown: symbol('chart.line.downtrend.xyaxis', 'trending_down'),
  receipt: symbol('doc.text', 'receipt_long'),
  chart: symbol('chart.bar', 'bar_chart'),
  wallet: symbol('wallet.pass', 'account_balance_wallet'),
  calendar: symbol('calendar', 'calendar_today'),
  home: symbol('house', 'home'),
  activity: symbol('list.bullet.rectangle', 'receipt_long'),
  insights: symbol('chart.pie', 'pie_chart'),
  settings: symbol('gearshape', 'settings'),
} as const;

export type IconName = keyof typeof Icons;

export function isIconName(value: string): value is IconName {
  return value in Icons;
}
