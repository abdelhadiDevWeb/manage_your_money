import { StyleSheet, View } from 'react-native';

import { CategoryBadge } from '@/components/category-badge';
import { ThemedText } from '@/components/themed-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Spacing } from '@/constants/theme';
import { useFinance } from '@/data/finance-provider';
import type { Transaction } from '@/db/repo';
import { useTheme } from '@/hooks/use-theme';
import { friendlyDay } from '@/lib/dates';
import { formatMoney } from '@/lib/money';

type Props = {
  tx: Transaction;
  showDate?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
};

export function TransactionRow({ tx, showDate = true, onPress, onLongPress }: Props) {
  const theme = useTheme();
  const { currency } = useFinance();
  const isIncome = tx.type === 'income';
  const title = tx.note || tx.category_name;
  const subtitle = showDate
    ? `${tx.note ? `${tx.category_name} · ` : ''}${friendlyDay(tx.date)}`
    : tx.note
      ? tx.category_name
      : isIncome
        ? 'Income'
        : 'Expense';

  return (
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${formatMoney(tx.amount, currency)} ${isIncome ? 'income' : 'expense'}`}
      style={styles.row}>
      <CategoryBadge icon={tx.category_icon} color={tx.category_color} />
      <View style={styles.text}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {subtitle}
        </ThemedText>
      </View>
      <ThemedText
        type="smallBold"
        style={[styles.amount, { color: isIncome ? theme.income : theme.text }]}>
        {isIncome ? '+' : '−'}
        {formatMoney(tx.amount, currency)}
      </ThemedText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  amount: {
    fontVariant: ['tabular-nums'],
  },
});
