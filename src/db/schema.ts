import type { SQLiteDatabase } from 'expo-sqlite';

import type { IconName } from '@/constants/icons';

export const DATABASE_NAME = 'spendwise.db';
const DATABASE_VERSION = 3;
const REMOVED_CATEGORIES = ['Education', 'Travel'];

const DEFAULT_CATEGORIES: { name: string; icon: IconName; color: string; type: 'expense' | 'income' }[] = [
  { name: 'Food & Dining', icon: 'food', color: '#EA580C', type: 'expense' },
  { name: 'Groceries', icon: 'groceries', color: '#16A34A', type: 'expense' },
  { name: 'Transport', icon: 'transport', color: '#2563EB', type: 'expense' },
  { name: 'Shopping', icon: 'shopping', color: '#C026D3', type: 'expense' },
  { name: 'Bills & Utilities', icon: 'bills', color: '#D97706', type: 'expense' },
  { name: 'Housing', icon: 'housing', color: '#4F46E5', type: 'expense' },
  { name: 'Entertainment', icon: 'entertainment', color: '#DB2777', type: 'expense' },
  { name: 'Health', icon: 'health', color: '#0D9488', type: 'expense' },
  { name: 'Subscriptions', icon: 'subscriptions', color: '#7C3AED', type: 'expense' },
  { name: 'Other', icon: 'other', color: '#64748B', type: 'expense' },
  { name: 'Salary', icon: 'salary', color: '#059669', type: 'income' },
  { name: 'Freelance', icon: 'freelance', color: '#2563EB', type: 'income' },
  { name: 'Investments', icon: 'investments', color: '#7C3AED', type: 'income' },
  { name: 'Gifts', icon: 'gifts', color: '#DB2777', type: 'income' },
  { name: 'Other income', icon: 'otherIncome', color: '#D97706', type: 'income' },
];

/** Passed to `SQLiteProvider`'s `onInit`; brings the schema up to `DATABASE_VERSION`. */
export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  if (version >= DATABASE_VERSION) return;

  if (version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'other',
        color TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
        sort_order INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
        amount INTEGER NOT NULL CHECK (amount > 0),
        category_id INTEGER NOT NULL REFERENCES categories(id),
        note TEXT NOT NULL DEFAULT '',
        date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);

    await db.withTransactionAsync(async () => {
      for (const [index, c] of DEFAULT_CATEGORIES.entries()) {
        await db.runAsync(
          'INSERT INTO categories (name, icon, color, type, sort_order) VALUES (?, ?, ?, ?, ?)',
          c.name,
          c.icon,
          c.color,
          c.type,
          index
        );
      }
      await db.runAsync("INSERT OR IGNORE INTO settings (key, value) VALUES ('currency', 'USD')");
      await db.runAsync("INSERT OR IGNORE INTO settings (key, value) VALUES ('monthly_budget', '0')");
    });
    version = DATABASE_VERSION;
  }

  if (version === 1) {
    // v1 stored an emoji per category; v2 renders vector icons instead.
    await db.execAsync("ALTER TABLE categories ADD COLUMN icon TEXT NOT NULL DEFAULT 'other'");
    await db.withTransactionAsync(async () => {
      for (const c of DEFAULT_CATEGORIES) {
        await db.runAsync('UPDATE categories SET icon = ?, color = ? WHERE name = ?', c.icon, c.color, c.name);
      }
    });
    version = 2;
  }

  if (version === 2) {
    // Transactions keep their history under "Other"; a category still referenced cannot be deleted.
    const placeholders = REMOVED_CATEGORIES.map(() => '?').join(', ');
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE transactions
           SET category_id = (SELECT id FROM categories WHERE name = 'Other' AND type = 'expense' LIMIT 1)
         WHERE category_id IN (SELECT id FROM categories WHERE name IN (${placeholders}))
           AND EXISTS (SELECT 1 FROM categories WHERE name = 'Other' AND type = 'expense')`,
        ...REMOVED_CATEGORIES
      );
      await db.runAsync(
        `DELETE FROM categories
         WHERE name IN (${placeholders})
           AND id NOT IN (SELECT category_id FROM transactions)`,
        ...REMOVED_CATEGORIES
      );
    });
    version = 3;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
