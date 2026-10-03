import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryBadge } from '@/components/category-badge';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SegmentedControl } from '@/components/ui/segmented-control';
import type { IconName } from '@/constants/icons';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useDbQuery, useFinance } from '@/data/finance-provider';
import {
  deleteTransaction,
  getTransaction,
  insertTransaction,
  listCategories,
  updateTransaction,
  type TxType,
} from '@/db/repo';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/confirm';
import { addDays, friendlyDay, shortDate, today } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { centsToInput, parseAmountToCents } from '@/lib/money';

const AMOUNT_CARET_SPACE = 8;
const AMOUNT_MAX_WIDTH = 280;

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function AddTransactionScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { currency, notifyChanged } = useFinance();
  const params = useLocalSearchParams<{ id?: string; type?: string }>();
  const editingId = params.id ? Number(params.id) : null;

  const [type, setType] = useState<TxType>(params.type === 'income' ? 'income' : 'expense');
  const [amountText, setAmountText] = useState('');
  const [amountWidth, setAmountWidth] = useState(0);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(editingId === null);

  const categories = useDbQuery((conn) => listCategories(conn, type), [type]);

  useEffect(() => {
    if (editingId === null) return;
    getTransaction(db, editingId).then((tx) => {
      if (tx) {
        setType(tx.type);
        setAmountText(centsToInput(tx.amount));
        setCategoryId(tx.category_id);
        setNote(tx.note);
        setDate(tx.date);
      }
      setLoaded(true);
    });
  }, [db, editingId]);

  const amount = parseAmountToCents(amountText);
  const canSave = loaded && amount !== null && amount > 0 && categoryId !== null && !saving;
  const accent = type === 'expense' ? theme.expense : theme.income;

  const save = async () => {
    if (!canSave || amount === null || categoryId === null) return;
    setSaving(true);
    const input = { type, amount, categoryId, note, date };
    if (editingId !== null) await updateTransaction(db, editingId, input);
    else await insertTransaction(db, input);
    haptic.success();
    notifyChanged();
    close();
  };

  const remove = async () => {
    if (editingId === null) return;
    const ok = await confirmDestructive('Delete transaction?', 'This entry will be permanently removed.');
    if (!ok) return;
    await deleteTransaction(db, editingId);
    haptic.warning();
    notifyChanged();
    close();
  };

  const isToday = date === today();
  const isYesterday = date === addDays(today(), -1);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.flex, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: (Platform.OS === 'ios' ? 0 : insets.top) + Spacing.three },
        ]}>
        <IconButton label="Close" icon="close" onPress={close} />
        <ThemedText type="heading">{editingId !== null ? 'Edit transaction' : 'New transaction'}</ThemedText>
        {editingId !== null ? (
          <IconButton
            label="Delete"
            icon="delete"
            color={theme.expense}
            onPress={remove}
          />
        ) : (
          <View style={styles.iconButton} />
        )}
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          <SegmentedControl<TxType>
            value={type}
            onChange={(next) => {
              setType(next);
              setCategoryId(null);
            }}
            options={[
              { value: 'expense', label: 'Expense', activeColor: theme.expense },
              { value: 'income', label: 'Income', activeColor: theme.income },
            ]}
          />

          {/* Amount */}
          <View style={styles.amountBlock}>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.upper}>
              {type === 'expense' ? 'How much did you spend?' : 'How much did you receive?'}
            </ThemedText>
            <Text
              aria-hidden
              numberOfLines={1}
              style={[styles.amountText, styles.amountMeasure]}
              onLayout={(e) => setAmountWidth(Math.ceil(e.nativeEvent.layout.width))}>
              {amountText || '0'}
            </Text>
            <View style={styles.amountRow}>
              <Text style={[styles.amountSymbol, { color: accent }]}>{currency.symbol}</Text>
              <TextInput
                value={amountText}
                onChangeText={(t) => setAmountText(t.replace(/[^\d.,]/g, ''))}
                placeholder="0"
                placeholderTextColor={theme.textMuted}
                keyboardType="decimal-pad"
                autoFocus={editingId === null}
                style={[
                  styles.amountText,
                  styles.amountInput,
                  { color: theme.text, width: Math.min(amountWidth + AMOUNT_CARET_SPACE, AMOUNT_MAX_WIDTH) },
                ]}
                accessibilityLabel="Amount"
                maxLength={12}
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.block}>
            <ThemedText type="smallBold">Category</ThemedText>
            <View style={styles.grid}>
              {categories?.map((c) => {
                const active = c.id === categoryId;
                return (
                  <PressableScale
                    key={c.id}
                    onPress={() => {
                      haptic.tap();
                      setCategoryId(c.id);
                    }}
                    accessibilityRole="radio"
                    aria-checked={active}
                    accessibilityLabel={c.name}
                    style={[
                      styles.catTile,
                      {
                        backgroundColor: active ? `${c.color}1F` : theme.backgroundElement,
                        borderColor: active ? c.color : theme.border,
                      },
                    ]}>
                    <CategoryBadge icon={c.icon} color={c.color} size={40} />
                    <ThemedText
                      type="caption"
                      numberOfLines={1}
                      style={[styles.catLabel, { color: active ? theme.text : theme.textSecondary }]}>
                      {c.name}
                    </ThemedText>
                  </PressableScale>
                );
              })}
            </View>
          </View>

          {/* Note */}
          <View style={styles.block}>
            <ThemedText type="smallBold">Note</ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={type === 'expense' ? 'e.g. Lunch with friends' : 'e.g. October salary'}
              placeholderTextColor={theme.textMuted}
              style={[
                styles.noteInput,
                { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
              maxLength={80}
              returnKeyType="done"
            />
          </View>

          {/* Date */}
          <View style={styles.block}>
            <ThemedText type="smallBold">Date</ThemedText>
            <View style={styles.dateRow}>
              <DateChip label="Today" active={isToday} onPress={() => setDate(today())} />
              <DateChip label="Yesterday" active={isYesterday} onPress={() => setDate(addDays(today(), -1))} />
              <View style={[styles.stepper, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <IconButton
                  small
                  label="Previous day"
                  icon="chevronLeft"
                  onPress={() => setDate((d) => addDays(d, -1))}
                />
                <ThemedText type="caption" numberOfLines={1} style={styles.stepperLabel}>
                  {isToday || isYesterday ? shortDate(date) : friendlyDay(date)}
                </ThemedText>
                <IconButton
                  small
                  label="Next day"
                  disabled={isToday}
                  icon="chevronRight"
                  onPress={() => setDate((d) => (d < today() ? addDays(d, 1) : d))}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + Spacing.three, borderTopColor: theme.border },
        ]}>
        <Button
          label={editingId !== null ? 'Save changes' : type === 'expense' ? 'Add expense' : 'Add income'}
          onPress={save}
          disabled={!canSave}
          loading={saving}
          style={styles.saveButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function DateChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      accessibilityRole="button"
      aria-selected={active}
      style={[styles.dateChip, { backgroundColor: active ? theme.primary : theme.chip }]}>
      <ThemedText type="smallBold" style={{ color: active ? '#FFFFFF' : theme.text }}>
        {label}
      </ThemedText>
    </PressableScale>
  );
}

function IconButton({
  icon,
  label,
  onPress,
  color,
  disabled,
  small,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  small?: boolean;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        small ? styles.iconButtonSmall : styles.iconButton,
        !small && { backgroundColor: theme.chip },
        disabled && { opacity: 0.3 },
      ]}>
      <Icon name={icon} size={small ? 15 : 17} weight="semibold" color={color ?? theme.text} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingBottom: Spacing.two,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonSmall: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
  },
  upper: {
    textTransform: 'uppercase',
  },
  amountBlock: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  amountSymbol: {
    fontSize: 34,
    fontWeight: 700,
  },
  amountText: {
    fontSize: 54,
    fontWeight: 800,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  amountMeasure: {
    position: 'absolute',
    opacity: 0,
    pointerEvents: 'none',
  },
  amountInput: {
    textAlign: 'center',
    padding: 0,
  },
  block: {
    gap: Spacing.two + 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  catTile: {
    width: '23.5%',
    flexGrow: 1,
    alignItems: 'center',
    gap: Spacing.one + 2,
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  catLabel: {
    textAlign: 'center',
  },
  noteInput: {
    height: 52,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  dateChip: {
    paddingHorizontal: Spacing.three,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepper: {
    flex: 1,
    minWidth: 170,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.one,
  },
  stepperLabel: {
    flex: 1,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  saveButton: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },
});
