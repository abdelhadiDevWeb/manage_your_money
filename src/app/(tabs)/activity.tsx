import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { SectionList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { TransactionRow } from '@/components/transaction-row';
import { EmptyState } from '@/components/ui/empty-state';
import { AddTransactionFab } from '@/components/ui/fab';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader, useBottomSpace } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useDbQuery, useFinance } from '@/data/finance-provider';
import { deleteTransaction, listTransactions, type Transaction, type TxType } from '@/db/repo';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/confirm';
import { friendlyDay } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { formatMoney } from '@/lib/money';

type Filter = 'all' | TxType;
type Section = { title: string; net: number; data: Transaction[] };

function groupByDay(transactions: Transaction[]): Section[] {
  const sections: Section[] = [];
  for (const tx of transactions) {
    let section = sections[sections.length - 1];
    if (!section || section.title !== tx.date) {
      section = { title: tx.date, net: 0, data: [] };
      sections.push(section);
    }
    section.data.push(tx);
    section.net += tx.type === 'income' ? tx.amount : -tx.amount;
  }
  return sections;
}

export default function ActivityScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const bottomSpace = useBottomSpace();
  const { currency, notifyChanged } = useFinance();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const transactions = useDbQuery(
    (conn) => listTransactions(conn, { type: filter === 'all' ? undefined : filter, search }),
    [filter, search]
  );
  const sections = groupByDay(transactions ?? []);

  const confirmDelete = async (tx: Transaction) => {
    haptic.warning();
    const ok = await confirmDestructive(
      'Delete transaction?',
      `"${tx.note || tx.category_name}" for ${formatMoney(tx.amount, currency)} will be removed.`
    );
    if (!ok) return;
    await deleteTransaction(db, tx.id);
    notifyChanged();
  };

  const header = (
    <View style={styles.headerBlock}>
      <ScreenHeader
        title="Activity"
        subtitle={transactions ? `${transactions.length} transactions` : ' '}
      />
      <View style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Icon name="search" size={18} color={theme.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search notes or categories"
          placeholderTextColor={theme.textMuted}
          style={[styles.searchInput, { color: theme.text }]}
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>
      <SegmentedControl<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All' },
          { value: 'expense', label: 'Expenses', activeColor: theme.expense },
          { value: 'income', label: 'Income', activeColor: theme.income },
        ]}
      />
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.three, paddingBottom: bottomSpace },
        ]}
        ListHeaderComponent={header}
        ListEmptyComponent={
          transactions ? (
            <EmptyState
              icon={search ? 'searchOff' : 'receipt'}
              title={search ? 'No matches' : 'No transactions yet'}
              message={
                search
                  ? `Nothing found for "${search}". Try another word.`
                  : 'Tap the + button to record your first expense or income.'
              }
            />
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.upper}>
              {friendlyDay(section.title)}
            </ThemedText>
            <ThemedText
              type="caption"
              style={{ color: section.net >= 0 ? theme.income : theme.textSecondary }}>
              {formatMoney(section.net, currency, { sign: true })}
            </ThemedText>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <View
            style={[
              styles.item,
              { backgroundColor: theme.backgroundElement },
              index === 0 && styles.itemFirst,
              index === section.data.length - 1 && styles.itemLast,
            ]}>
            <TransactionRow
              tx={item}
              showDate={false}
              onPress={() => router.push({ pathname: '/add', params: { id: String(item.id) } })}
              onLongPress={() => confirmDelete(item)}
            />
            {index < section.data.length - 1 ? (
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            ) : null}
          </View>
        )}
        ListFooterComponent={
          sections.length > 0 ? (
            <ThemedText type="caption" themeColor="textMuted" style={styles.hint}>
              Tap to edit · Long-press to delete
            </ThemedText>
          ) : null
        }
      />
      <AddTransactionFab />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three + Spacing.one,
    width: '100%',
    maxWidth: MaxContentWidth + 2 * (Spacing.three + Spacing.one),
    alignSelf: 'center',
  },
  headerBlock: {
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  upper: {
    textTransform: 'uppercase',
  },
  item: {
    paddingHorizontal: Spacing.three,
  },
  itemFirst: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingTop: Spacing.one,
  },
  itemLast: {
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    paddingBottom: Spacing.one,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 44 + Spacing.three,
  },
  hint: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
});
