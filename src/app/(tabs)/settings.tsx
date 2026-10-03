import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Screen } from '@/components/ui/screen';
import type { IconName } from '@/constants/icons';
import { Radius, Spacing } from '@/constants/theme';
import { useFinance } from '@/data/finance-provider';
import { deleteAllTransactions, insertSampleData } from '@/db/repo';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/confirm';
import { haptic } from '@/lib/haptics';
import { centsToInput, Currencies, formatMoney, parseAmountToCents } from '@/lib/money';

export default function SettingsScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const { settings, currency, updateSettings, notifyChanged } = useFinance();
  const [budgetInput, setBudgetInput] = useState<string | null>(null);
  const [busy, setBusy] = useState<'sample' | 'reset' | null>(null);

  const budgetText = budgetInput ?? (settings.monthlyBudget > 0 ? centsToInput(settings.monthlyBudget) : '');
  const parsedBudget = parseAmountToCents(budgetText) ?? 0;
  const budgetDirty = budgetInput !== null && parsedBudget !== settings.monthlyBudget;

  const saveBudget = async () => {
    await updateSettings({ monthlyBudget: parsedBudget });
    setBudgetInput(null);
    haptic.success();
  };

  const loadSample = async () => {
    setBusy('sample');
    await insertSampleData(db);
    setBusy(null);
    haptic.success();
    notifyChanged();
  };

  const resetAll = async () => {
    const ok = await confirmDestructive(
      'Delete all transactions?',
      'This permanently removes every expense and income entry from this device. This cannot be undone.',
      'Delete all'
    );
    if (!ok) return;
    setBusy('reset');
    await deleteAllTransactions(db);
    setBusy(null);
    haptic.warning();
    notifyChanged();
  };

  return (
    <Screen title="Settings" subtitle="Make it yours">
      <SettingsGroup
        title="Currency"
        icon="currency"
        description="Used to display all amounts in the app.">
        <View style={styles.chips}>
          {Currencies.map((c) => {
            const active = c.code === settings.currency;
            return (
              <PressableScale
                key={c.code}
                onPress={() => {
                  haptic.tap();
                  updateSettings({ currency: c.code });
                }}
                accessibilityRole="radio"
                aria-checked={active}
                style={[
                  styles.chip,
                  { backgroundColor: active ? theme.primary : theme.chip },
                ]}>
                <ThemedText type="smallBold" style={{ color: active ? '#FFFFFF' : theme.text }}>
                  {c.symbol}
                </ThemedText>
                <ThemedText type="caption" style={{ color: active ? '#FFFFFFCC' : theme.textSecondary }}>
                  {c.code}
                </ThemedText>
              </PressableScale>
            );
          })}
        </View>
      </SettingsGroup>

      <SettingsGroup
        title="Monthly budget"
        icon="budget"
        description="We'll show your progress on the home screen and warn you when you get close.">
        <View style={[styles.inputRow, { backgroundColor: theme.chip }]}>
          <ThemedText type="heading" themeColor="textSecondary">
            {currency.symbol}
          </ThemedText>
          <TextInput
            value={budgetText}
            onChangeText={setBudgetInput}
            placeholder="e.g. 1500"
            placeholderTextColor={theme.textMuted}
            keyboardType="decimal-pad"
            style={[styles.input, { color: theme.text }]}
            returnKeyType="done"
            onSubmitEditing={() => budgetDirty && saveBudget()}
          />
        </View>
        <View style={styles.row}>
          {settings.monthlyBudget > 0 ? (
            <Button
              label="Remove"
              variant="secondary"
              style={styles.flex}
              onPress={async () => {
                await updateSettings({ monthlyBudget: 0 });
                setBudgetInput(null);
              }}
            />
          ) : null}
          <Button label="Save budget" disabled={!budgetDirty} onPress={saveBudget} style={styles.flex} />
        </View>
        {settings.monthlyBudget > 0 ? (
          <ThemedText type="caption" themeColor="textSecondary">
            Current budget: {formatMoney(settings.monthlyBudget, currency)} / month
          </ThemedText>
        ) : null}
      </SettingsGroup>

      <SettingsGroup
        title="Your data"
        icon="data"
        description="Everything is stored in a SQLite database on this device only. No account, no cloud.">
        <Button
          label="Load sample data"
          variant="secondary"
          loading={busy === 'sample'}
          onPress={loadSample}
        />
        <Button
          label="Delete all transactions"
          variant="danger"
          loading={busy === 'reset'}
          onPress={resetAll}
        />
      </SettingsGroup>

      <View style={styles.footer}>
        <Icon name="shield" size={14} color={theme.textMuted} />
        <ThemedText type="caption" themeColor="textMuted">
          Spendwise 1.0.0 · Your data never leaves this device
        </ThemedText>
      </View>
    </Screen>
  );
}

function SettingsGroup({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon: IconName;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Card style={styles.group}>
      <View style={styles.groupHeader}>
        <View style={[styles.groupIcon, { backgroundColor: theme.backgroundSelected }]}>
          <Icon name={icon} size={19} color={theme.primary} />
        </View>
        <View style={styles.flex}>
          <ThemedText type="heading">{title}</ThemedText>
          {description ? (
            <ThemedText type="caption" themeColor="textSecondary">
              {description}
            </ThemedText>
          ) : null}
        </View>
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  group: {
    gap: Spacing.three,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    width: '22%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two + 2,
    borderRadius: Radius.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    height: 54,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: 600,
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.two,
  },
});
