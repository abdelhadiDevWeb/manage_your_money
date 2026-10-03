import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { CategoryBadge } from '@/components/category-badge';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useDbQuery, useFinance } from '@/data/finance-provider';
import { getCategoryTotals, getDailyExpenses, getMonthTotals, type CategoryTotal } from '@/db/repo';
import { useTheme } from '@/hooks/use-theme';
import { daysInMonth, monthKey, monthLabel, shiftMonth } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { formatMoney } from '@/lib/money';

const CHART_HEIGHT = 120;

export default function InsightsScreen() {
  const theme = useTheme();
  const { currency } = useFinance();
  const current = monthKey();
  const [month, setMonth] = useState(current);

  const data = useDbQuery(
    async (conn) => ({
      totals: await getMonthTotals(conn, month),
      previous: await getMonthTotals(conn, shiftMonth(month, -1)),
      expenses: await getCategoryTotals(conn, month, 'expense'),
      income: await getCategoryTotals(conn, month, 'income'),
      daily: await getDailyExpenses(conn, month),
    }),
    [month]
  );

  const changeMonth = (delta: number) => {
    haptic.tap();
    setMonth((m) => shiftMonth(m, delta));
  };

  const totals = data?.totals ?? { income: 0, expense: 0, count: 0 };
  const saved = totals.income - totals.expense;
  const savingsRate = totals.income > 0 ? Math.round((saved / totals.income) * 100) : null;
  const prevExpense = data?.previous.expense ?? 0;
  const change = prevExpense > 0 ? Math.round(((totals.expense - prevExpense) / prevExpense) * 100) : null;

  return (
    <Screen title="Insights" subtitle="See where your money goes">
      {/* Month switcher */}
      <View style={[styles.monthBar, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <MonthArrow direction="back" onPress={() => changeMonth(-1)} />
        <Animated.View key={month} entering={FadeIn.duration(250)} style={styles.monthLabel}>
          <ThemedText type="heading">{monthLabel(month)}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {totals.count} transactions
          </ThemedText>
        </Animated.View>
        <MonthArrow direction="forward" disabled={month >= current} onPress={() => changeMonth(1)} />
      </View>

      {/* Summary */}
      <Animated.View entering={FadeInDown.duration(450)} style={styles.statsRow}>
        <StatTile label="Income" value={formatMoney(totals.income, currency, { compact: true })} color={theme.income} />
        <StatTile label="Spent" value={formatMoney(totals.expense, currency, { compact: true })} color={theme.expense} />
        <StatTile
          label="Saved"
          value={formatMoney(saved, currency, { compact: true })}
          color={saved >= 0 ? theme.primary : theme.expense}
          footnote={savingsRate !== null ? `${savingsRate}% rate` : undefined}
        />
      </Animated.View>

      {change !== null ? (
        <Animated.View entering={FadeInDown.duration(450).delay(60)}>
          <Card style={styles.compare}>
            <View
              style={[
                styles.compareIcon,
                { backgroundColor: change > 0 ? theme.expenseSoft : theme.incomeSoft },
              ]}>
              <Icon
                name={change > 0 ? 'trendUp' : 'trendDown'}
                size={20}
                weight="semibold"
                color={change > 0 ? theme.expense : theme.income}
              />
            </View>
            <ThemedText type="small" style={styles.flex}>
              You spent{' '}
              <ThemedText type="smallBold" style={{ color: change > 0 ? theme.expense : theme.income }}>
                {Math.abs(change)}% {change > 0 ? 'more' : 'less'}
              </ThemedText>{' '}
              than in {monthLabel(shiftMonth(month, -1), false)}.
            </ThemedText>
          </Card>
        </Animated.View>
      ) : null}

      {data && totals.count === 0 ? (
        <Card>
          <EmptyState
            icon="chart"
            title="Nothing to analyze yet"
            message={`No transactions in ${monthLabel(month)}. Add some and your insights will appear here.`}
          />
        </Card>
      ) : (
        <>
          <Animated.View entering={FadeInDown.duration(450).delay(120)}>
            <Breakdown title="Spending by category" items={data?.expenses ?? []} total={totals.expense} />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(450).delay(180)}>
            <DailyChart month={month} daily={data?.daily ?? []} total={totals.expense} />
          </Animated.View>

          {data && data.income.length > 0 ? (
            <Animated.View entering={FadeInDown.duration(450).delay(240)}>
              <Breakdown title="Income sources" items={data.income} total={totals.income} />
            </Animated.View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function MonthArrow({
  direction,
  onPress,
  disabled,
}: {
  direction: 'back' | 'forward';
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={direction === 'back' ? 'Previous month' : 'Next month'}
      style={[styles.arrow, { backgroundColor: theme.chip, opacity: disabled ? 0.35 : 1 }]}>
      <Icon
        name={direction === 'back' ? 'chevronLeft' : 'chevronRight'}
        size={16}
        weight="semibold"
        color={theme.text}
      />
    </PressableScale>
  );
}

function StatTile({
  label,
  value,
  color,
  footnote,
}: {
  label: string;
  value: string;
  color: string;
  footnote?: string;
}) {
  return (
    <Card style={styles.statTile}>
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="heading" numberOfLines={1} adjustsFontSizeToFit style={styles.tabular}>
        {value}
      </ThemedText>
      {footnote ? (
        <ThemedText type="caption" themeColor="textMuted" numberOfLines={1}>
          {footnote}
        </ThemedText>
      ) : null}
    </Card>
  );
}

function Breakdown({ title, items, total }: { title: string; items: CategoryTotal[]; total: number }) {
  const theme = useTheme();
  const { currency } = useFinance();

  return (
    <Card style={styles.section}>
      <ThemedText type="heading">{title}</ThemedText>
      {items.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Nothing here this month.
        </ThemedText>
      ) : (
        <>
          <View style={styles.stackBar}>
            {items.map((c) => (
              <View
                key={c.category_id}
                style={{ flex: Math.max(c.total / total, 0.015), backgroundColor: c.color, borderRadius: 4 }}
              />
            ))}
          </View>
          {items.map((c) => {
            const pct = total > 0 ? Math.round((c.total / total) * 100) : 0;
            return (
              <View key={c.category_id} style={styles.legendRow}>
                <CategoryBadge icon={c.icon} color={c.color} size={40} />
                <View style={styles.flex}>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {c.name}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {c.count} {c.count === 1 ? 'transaction' : 'transactions'}
                  </ThemedText>
                </View>
                <View style={styles.legendAmount}>
                  <ThemedText type="smallBold" style={styles.tabular}>
                    {formatMoney(c.total, currency)}
                  </ThemedText>
                  <View style={[styles.pctPill, { backgroundColor: `${c.color}22` }]}>
                    <ThemedText type="caption" style={{ color: theme.text }}>
                      {pct}%
                    </ThemedText>
                  </View>
                </View>
              </View>
            );
          })}
        </>
      )}
    </Card>
  );
}

function DailyChart({
  month,
  daily,
  total,
}: {
  month: string;
  daily: { date: string; total: number }[];
  total: number;
}) {
  const theme = useTheme();
  const { currency } = useFinance();
  const days = daysInMonth(month);
  const byDay = new Map(daily.map((d) => [Number(d.date.slice(8, 10)), d.total]));
  // Scale to typical days so one huge payment (e.g. rent) doesn't flatten every other bar;
  // outliers are capped at full height.
  const sorted = daily.map((d) => d.total).sort((a, b) => a - b);
  const typical = sorted.length ? sorted[Math.floor((sorted.length - 1) * 0.9)] : 0;
  const max = Math.max(1, sorted.length > 4 ? typical * 1.15 : (sorted[sorted.length - 1] ?? 0));
  const isCurrent = month === monthKey();
  const elapsed = isCurrent ? new Date().getDate() : days;
  const average = Math.round(total / Math.max(elapsed, 1));
  const peak = daily.reduce<{ date: string; total: number } | null>(
    (best, d) => (!best || d.total > best.total ? d : best),
    null
  );

  return (
    <Card style={styles.section}>
      <View style={styles.rowBetween}>
        <ThemedText type="heading">Daily spending</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          avg {formatMoney(average, currency)}/day
        </ThemedText>
      </View>
      <View style={styles.chart}>
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const value = byDay.get(day) ?? 0;
          const isPeak = peak !== null && Number(peak.date.slice(8, 10)) === day;
          return (
            <View key={day} style={styles.barSlot}>
              <View
                style={[
                  styles.bar,
                  {
                    height: value > 0 ? Math.min(CHART_HEIGHT, Math.max(4, (value / max) * CHART_HEIGHT)) : 3,
                    backgroundColor: value > 0 ? (isPeak ? Brand.primaryDeep : theme.primary) : theme.chip,
                    opacity: value > 0 ? (isPeak ? 1 : 0.75) : 1,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.rowBetween}>
        {[1, 8, 15, 22, days].map((d) => (
          <ThemedText key={d} type="caption" themeColor="textMuted">
            {d}
          </ThemedText>
        ))}
      </View>
      {peak ? (
        <ThemedText type="small" themeColor="textSecondary">
          Biggest day: <ThemedText type="smallBold">{monthLabel(month, false).slice(0, 3)} {Number(peak.date.slice(8, 10))}</ThemedText>{' '}
          with {formatMoney(peak.total, currency)}
        </ThemedText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.two,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  monthLabel: {
    alignItems: 'center',
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
  statTile: {
    flex: 1,
    padding: Spacing.three,
    gap: 2,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: Spacing.one,
  },
  compare: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  compareIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: Spacing.three,
  },
  stackBar: {
    flexDirection: 'row',
    height: 14,
    gap: 3,
    borderRadius: 7,
    overflow: 'hidden',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  legendAmount: {
    alignItems: 'flex-end',
    gap: 4,
  },
  pctPill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
    gap: 2,
  },
  barSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    maxWidth: 10,
    borderRadius: 3,
  },
});
