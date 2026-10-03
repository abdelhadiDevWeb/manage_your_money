import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import { getSettings, setSetting, type Settings } from '@/db/repo';
import { currencyFor, type Currency } from '@/lib/money';

type FinanceContextValue = {
  /** Bumped after every write so screens know to re-query. */
  version: number;
  notifyChanged: () => void;
  settings: Settings;
  currency: Currency;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [version, setVersion] = useState(0);
  const [settings, setSettings] = useState<Settings>({ currency: 'USD', monthlyBudget: 0 });

  useEffect(() => {
    getSettings(db).then(setSettings);
  }, [db]);

  const notifyChanged = useCallback(() => setVersion((v) => v + 1), []);

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      if (patch.currency !== undefined) await setSetting(db, 'currency', patch.currency);
      if (patch.monthlyBudget !== undefined) {
        await setSetting(db, 'monthly_budget', String(patch.monthlyBudget));
      }
      setSettings((s) => ({ ...s, ...patch }));
      setVersion((v) => v + 1);
    },
    [db]
  );

  return (
    <FinanceContext.Provider
      value={{ version, notifyChanged, settings, currency: currencyFor(settings.currency), updateSettings }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used inside <FinanceProvider>');
  return ctx;
}

/**
 * Runs `query` against the database and re-runs it whenever data changes
 * (see `notifyChanged`) or one of `deps` changes.
 */
export function useDbQuery<T>(query: (db: SQLiteDatabase) => Promise<T>, deps: unknown[]) {
  const db = useSQLiteContext();
  const { version } = useFinance();
  const [data, setData] = useState<T | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    query(db).then((result) => {
      if (!cancelled) setData(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version, ...deps]);

  return data;
}
