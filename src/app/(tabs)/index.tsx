import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CategoryBadge } from '@/components/category-badge';
import { ThemedText } from '@/components/themed-text';
import { TransactionRow } from '@/components/transaction-row';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { AddTransactionFab } from '@/components/ui/fab';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import type { IconName } from '@/constants/icons';
import { Brand, cardShadow, gradient, Radius, Spacing } from '@/constants/theme';
import { useDbQuery, useFinance } from '@/data/finance-provider';
import {
  getBalance,
  getCategoryTotals,
  getMonthTotals,
  insertSampleData,
  listTransactions,
  type TxType,
} from '@/db/repo';
import { useTheme } from '@/hooks/use-theme';
import { daysInMonth, greeting, longDate, monthKey, monthLabel } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { formatMoney } from '@/lib/money';

function openAdd(type?: TxType) {
  haptic.tap();
  router.push(type ? { pathname: '/add', params: { type } } : '/add');
}

export default function HomeScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const { currency, settings, notifyChanged } = useFinance();
  const [seeding, setSeeding] = useState(false);
  const month = monthKey();

  const data = useDbQuery(
    async (conn) => ({
      balance: await getBalance(conn),
      totals: await getMonthTotals(conn, month),
      categories: await getCategoryTotals(conn, month, 'expense'),
      recent: await listTransactions(conn, { limit: 5 }),
    }),
    [month]
  );

  const loadSample = async () => {
    setSeeding(true);
    await insertSampleData(db);
    setSeeding(false);
    haptic.success();
    notifyChanged();
  };

  const isEmpty = data && data.recent.length === 0;
  const topCategories = data?.categories.slice(0, 4) ?? [];
  const monthExpense = data?.totals.expense ?? 0;

  return (
    <View style={styles.flex}>
      <Screen subtitle={longDate()} title={greeting()}>
        {/* Balance */}
        <Animated.View entering={FadeInDown.duration(450)}>
          <View style={[styles.balanceCard, gradient(Brand.splash, '#2B2577', 150)]}>
            <View style={[styles.orb, styles.orbOne]} />
            <View style={[styles.orb, styles.orbTwo]} />
            <View style={styles.balanceHeader}>
              <ThemedText type="caption" style={[styles.onBrandMuted, styles.upper]}>
                Total balance
              </ThemedText>
              <View style={styles.monthTag}>
                <Icon name="calendar" size={12} color="#FFFFFFCC" />
                <ThemedText type="caption" style={styles.onBrandMuted}>
                  {monthLabel(month, false)}
                </ThemedText>
              </View>
            </View>
            <ThemedText type="display" style={styles.onBrand} adjustsFontSizeToFit numberOfLines={1}>
              {formatMoney(data?.balance ?? 0, currency)}
            </ThemedText>
            <View style={styles.balanceRow}>
              <FlowStat label="Income" value={formatMoney(data?.totals.income ?? 0, currency)} icon="income" />
              <View style={styles.flowDivider} />
              <FlowStat label="Expenses" value={formatMoney(monthExpense, currency)} icon="expense" />
            </View>
          </View>
        </Animated.View>

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.duration(450).delay(60)} style={styles.quickRow}>
          <QuickAction label="Expense" icon="expense" color={theme.expense} onPress={() => openAdd('expense')} />
          <QuickAction label="Income" icon="income" color={theme.income} onPress={() => openAdd('income')} />
        </Animated.View>

        {/* Budget */}
        <Animated.View entering={FadeInDown.duration(450).delay(120)}>
          <BudgetCard spent={monthExpense} budget={settings.monthlyBudget} month={month} />
        </Animated.View>

        {isEmpty ? (
          <Animated.View entering={FadeInDown.duration(450).delay(180)}>
            <Card>
              <EmptyState
                icon="wallet"
                title="Start tracking your money"
                message="Record your first expense or income. Every entry builds a clearer picture of where your money goes."
                action={
                  <View style={styles.emptyActions}>
                    <Button label="Add first transaction" onPress={() => openAdd()} />
                    <Button
                      label="Explore with sample data"
                      variant="secondary"
                      loading={seeding}
                      onPress={loadSample}
                    />
                  </View>
                }
              />
            </Card>
          </Animated.View>
        ) : (
          <>
            {/* Where it went */}
            <Animated.View entering={FadeInDown.duration(450).delay(180)}>
              <Card style={styles.section}>
                <SectionTitle
                  title="Top spending"
                  caption={monthLabel(month)}
                  action="Insights"
                  onAction={() => router.push('/insights')}
                />
                {topCategories.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    No spending recorded this month yet.
                  </ThemedText>
                ) : (
                  topCategories.map((c) => {
                    const share = monthExpense > 0 ? c.total / monthExpense : 0;
                    return (
                      <View key={c.category_id} style={styles.catRow}>
                        <CategoryBadge icon={c.icon} color={c.color} size={40} />
                        <View style={styles.catBody}>
                          <View style={styles.catTop}>
                            <ThemedText type="smallBold" numberOfLines={1} style={styles.flex}>
                              {c.name}
                            </ThemedText>
                            <ThemedText type="smallBold" style={styles.tabular}>
                              {formatMoney(c.total, currency)}
                            </ThemedText>
                          </View>
                          <View style={styles.catBottom}>
                            <View style={styles.flex}>
                              <ProgressBar progress={share} color={c.color} trackColor={theme.chip} height={6} />
                            </View>
                            <ThemedText type="caption" themeColor="textSecondary" style={styles.share}>
                              {Math.round(share * 100)}%
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </Card>
            </Animated.View>

            {/* Recent */}
            <Animated.View entering={FadeInDown.duration(450).delay(240)}>
              <Card style={styles.section}>
                <SectionTitle title="Recent transactions" action="See all" onAction={() => router.push('/activity')} />
                <View>
                  {data?.recent.map((tx, index) => (
                    <View key={tx.id}>
                      {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
                      <TransactionRow
                        tx={tx}
                        onPress={() => router.push({ pathname: '/add', params: { id: String(tx.id) } })}
                      />
                    </View>
                  ))}
                </View>
              </Card>
            </Animated.View>
          </>
        )}
      </Screen>
      <AddTransactionFab />
    </View>
  );
}

function FlowStat({ label, value, icon }: { label: string; value: string; icon: IconName }) {
  return (
    <View style={styles.flowStat}>
      <View style={styles.flowIcon}>
        <Icon name={icon} size={13} weight="bold" color="#FFFFFF" />
      </View>
      <View style={styles.flex}>
        <ThemedText type="caption" style={styles.onBrandMuted}>
          {label}
        </ThemedText>
        <ThemedText type="smallBold" style={styles.onBrand} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

function QuickAction({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: IconName;
  color: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Add ${label.toLowerCase()}`}
      style={[
        styles.quickAction,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        cardShadow(theme),
      ]}>
      <View style={[styles.quickIcon, { backgroundColor: `${color}1A` }]}>
        <Icon name={icon} size={16} weight="bold" color={color} />
      </View>
      <ThemedText type="smallBold">Add {label.toLowerCase()}</ThemedText>
    </PressableScale>
  );
}

function SectionTitle({
  title,
  caption,
  action,
  onAction,
}: {
  title: string;
  caption?: string;
  action?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.sectionTitle}>
      <View style={styles.flex}>
        <ThemedText type="heading">{title}</ThemedText>
        {caption ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {caption}
          </ThemedText>
        ) : null}
      </View>
      {action ? (
        <PressableScale onPress={onAction} hitSlop={10} style={styles.sectionAction}>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            {action}
          </ThemedText>
          <Icon name="chevronRight" size={12} weight="semibold" color={theme.primary} />
        </PressableScale>
      ) : null}
    </View>
  );
}

function BudgetCard({ spent, budget, month }: { spent: number; budget: number; month: string }) {
  const theme = useTheme();
  const { currency } = useFinance();

  if (budget <= 0) {
    return (
      <PressableScale onPress={() => router.push('/settings')}>
        <Card style={styles.budgetPrompt}>
          <View style={[styles.budgetIcon, { backgroundColor: theme.backgroundSelected }]}>
            <Icon name="budget" size={20} color={theme.primary} />
          </View>
          <View style={styles.flex}>
            <ThemedText type="smallBold">Set a monthly budget</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Track your limit and get warned before you overspend
            </ThemedText>
          </View>
          <Icon name="chevronRight" size={14} color={theme.textMuted} />
        </Card>
      </PressableScale>
    );
  }

  const ratio = spent / budget;
  const color = ratio >= 1 ? theme.expense : ratio >= 0.8 ? Brand.warning : theme.income;
  const status = ratio >= 1 ? 'Over budget' : ratio >= 0.8 ? 'Close to limit' : 'On track';
  const daysLeft = daysInMonth(month) - new Date().getDate() + 1;
  const remaining = budget - spent;

  return (
    <Card style={styles.section}>
      <View style={styles.sectionTitle}>
        <View style={styles.flex}>
          <ThemedText type="heading">Monthly budget</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left in {monthLabel(month, false)}
          </ThemedText>
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${color}1A` }]}>
          <View style={[styles.statusDot, { backgroundColor: color }]} />
          <ThemedText type="caption" style={{ color }}>
            {status}
          </ThemedText>
        </View>
      </View>
      <ProgressBar progress={ratio} color={color} trackColor={theme.chip} height={8} />
      <View style={styles.sectionTitle}>
        <ThemedText type="small" themeColor="textSecondary">
          <ThemedText type="smallBold">{formatMoney(spent, currency)}</ThemedText> of{' '}
          {formatMoney(budget, currency)}
        </ThemedText>
        <ThemedText type="smallBold" style={{ color: remaining < 0 ? theme.expense : theme.text }}>
          {remaining < 0
            ? `${formatMoney(-remaining, currency)} over`
            : `${formatMoney(remaining, currency)} left`}
        </ThemedText>
      </View>
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
  upper: {
    textTransform: 'uppercase',
  },
  balanceCard: {
    borderRadius: Radius.lg + 4,
    padding: Spacing.four,
    gap: Spacing.two,
    overflow: 'hidden',
    boxShadow: `0px 14px 30px ${Brand.primaryDeep}40`,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  orbOne: {
    width: 240,
    height: 240,
    top: -120,
    right: -70,
    opacity: 0.07,
  },
  orbTwo: {
    width: 160,
    height: 160,
    bottom: -90,
    left: -40,
    opacity: 0.05,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF1A',
  },
  onBrand: {
    color: '#FFFFFF',
  },
  onBrandMuted: {
    color: '#FFFFFFB3',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF14',
  },
  flowDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF33',
    marginHorizontal: Spacing.three,
  },
  flowStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  flowIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#FFFFFF24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    gap: Spacing.two + 4,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md + 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  quickIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: Spacing.three,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  catBody: {
    flex: 1,
    gap: Spacing.two,
  },
  catTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  catBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  share: {
    width: 34,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 44 + Spacing.three,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  budgetPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  budgetIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActions: {
    alignSelf: 'stretch',
    gap: Spacing.two + 2,
    marginTop: Spacing.three,
  },
});
