import type { SQLiteDatabase } from 'expo-sqlite';

import { addDays, today } from '@/lib/dates';

export type TxType = 'expense' | 'income';

export type Category = {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: TxType;
};

export type Transaction = {
  id: number;
  type: TxType;
  /** Integer cents, always positive; `type` carries the direction. */
  amount: number;
  category_id: number;
  note: string;
  date: string;
  category_name: string;
  category_icon: string;
  category_color: string;
};

export type TransactionInput = {
  type: TxType;
  amount: number;
  categoryId: number;
  note: string;
  date: string;
};

export type Settings = {
  currency: string;
  /** Integer cents; 0 means no budget set. */
  monthlyBudget: number;
};

export type CategoryTotal = {
  category_id: number;
  name: string;
  icon: string;
  color: string;
  total: number;
  count: number;
};

const TX_SELECT = `
  SELECT t.id, t.type, t.amount, t.category_id, t.note, t.date,
         c.name AS category_name, c.icon AS category_icon, c.color AS category_color
  FROM transactions t
  JOIN categories c ON c.id = t.category_id
`;

// ---------- settings ----------

export async function getSettings(db: SQLiteDatabase): Promise<Settings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    currency: map.currency ?? 'USD',
    monthlyBudget: Number(map.monthly_budget ?? 0) || 0,
  };
}

export async function setSetting(db: SQLiteDatabase, key: 'currency' | 'monthly_budget', value: string) {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value
  );
}

// ---------- categories ----------

export function listCategories(db: SQLiteDatabase, type?: TxType) {
  return type
    ? db.getAllAsync<Category>(
        'SELECT id, name, icon, color, type FROM categories WHERE type = ? ORDER BY sort_order',
        type
      )
    : db.getAllAsync<Category>('SELECT id, name, icon, color, type FROM categories ORDER BY sort_order');
}

// ---------- transactions ----------

export function getTransaction(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Transaction>(`${TX_SELECT} WHERE t.id = ?`, id);
}

export function listTransactions(
  db: SQLiteDatabase,
  { type, search, limit }: { type?: TxType; search?: string; limit?: number } = {}
) {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (type) {
    where.push('t.type = ?');
    params.push(type);
  }
  const q = search?.trim();
  if (q) {
    where.push('(t.note LIKE ? OR c.name LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  let sql = TX_SELECT;
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
  sql += ' ORDER BY t.date DESC, t.id DESC';
  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
  }
  return db.getAllAsync<Transaction>(sql, params);
}

export async function insertTransaction(db: SQLiteDatabase, input: TransactionInput) {
  const result = await db.runAsync(
    'INSERT INTO transactions (type, amount, category_id, note, date) VALUES (?, ?, ?, ?, ?)',
    input.type,
    input.amount,
    input.categoryId,
    input.note.trim(),
    input.date
  );
  return result.lastInsertRowId;
}

export async function updateTransaction(db: SQLiteDatabase, id: number, input: TransactionInput) {
  await db.runAsync(
    'UPDATE transactions SET type = ?, amount = ?, category_id = ?, note = ?, date = ? WHERE id = ?',
    input.type,
    input.amount,
    input.categoryId,
    input.note.trim(),
    input.date,
    id
  );
}

export async function deleteTransaction(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
}

// ---------- reports ----------

export async function getBalance(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ balance: number | null }>(
    "SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS balance FROM transactions"
  );
  return row?.balance ?? 0;
}

/** Income and expense totals for a "YYYY-MM" month. */
export async function getMonthTotals(db: SQLiteDatabase, month: string) {
  const row = await db.getFirstAsync<{ income: number | null; expense: number | null; count: number }>(
    `SELECT
       SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
       SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense,
       COUNT(*) AS count
     FROM transactions WHERE substr(date, 1, 7) = ?`,
    month
  );
  return { income: row?.income ?? 0, expense: row?.expense ?? 0, count: row?.count ?? 0 };
}

export function getCategoryTotals(db: SQLiteDatabase, month: string, type: TxType = 'expense') {
  return db.getAllAsync<CategoryTotal>(
    `SELECT c.id AS category_id, c.name, c.icon, c.color,
            SUM(t.amount) AS total, COUNT(*) AS count
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.type = ? AND substr(t.date, 1, 7) = ?
     GROUP BY c.id
     ORDER BY total DESC`,
    type,
    month
  );
}

/** Expense total per day of the month, only for days that have spending. */
export function getDailyExpenses(db: SQLiteDatabase, month: string) {
  return db.getAllAsync<{ date: string; total: number }>(
    `SELECT date, SUM(amount) AS total FROM transactions
     WHERE type = 'expense' AND substr(date, 1, 7) = ?
     GROUP BY date ORDER BY date`,
    month
  );
}

// ---------- maintenance ----------

export async function deleteAllTransactions(db: SQLiteDatabase) {
  await db.runAsync('DELETE FROM transactions');
}

/** Roughly two months of realistic activity so new users can explore the app. */
export async function insertSampleData(db: SQLiteDatabase) {
  const categories = await listCategories(db);
  const byName = new Map(categories.map((c) => [c.name, c]));
  const t = today();

  const plan: [category: string, minCents: number, maxCents: number, everyDays: number, notes: string[]][] = [
    ['Food & Dining', 800, 4200, 2, ['Lunch with team', 'Coffee', 'Pizza night', 'Sushi', 'Brunch']],
    ['Groceries', 2500, 9500, 5, ['Weekly groceries', 'Farmers market', 'Supermarket']],
    ['Transport', 300, 4500, 3, ['Uber', 'Metro card', 'Fuel', 'Parking']],
    ['Shopping', 1500, 12000, 9, ['New sneakers', 'Gift for mom', 'Headphones', 'Clothes']],
    ['Entertainment', 1000, 6000, 8, ['Cinema', 'Concert tickets', 'Bowling']],
    ['Health', 1200, 8000, 20, ['Pharmacy', 'Gym day pass']],
  ];

  await db.withTransactionAsync(async () => {
    const add = async (name: string, type: TxType, amount: number, date: string, note: string) => {
      const category = byName.get(name);
      if (!category) return;
      await db.runAsync(
        'INSERT INTO transactions (type, amount, category_id, note, date) VALUES (?, ?, ?, ?, ?)',
        type,
        amount,
        category.id,
        note,
        date
      );
    };

    let seed = 7;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let day = 0; day < 60; day++) {
      const date = addDays(t, -day);
      for (const [name, min, max, every, notes] of plan) {
        if ((day + name.length) % every === 0) {
          const amount = Math.round((min + rand() * (max - min)) / 50) * 50;
          await add(name, 'expense', amount, date, notes[Math.floor(rand() * notes.length)]);
        }
      }
    }

    for (const offset of [0, -1]) {
      const d = new Date();
      const first = new Date(d.getFullYear(), d.getMonth() + offset, 1);
      const iso = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-01`;
      if (iso > t) continue;
      await add('Salary', 'income', 420000, iso, 'Monthly salary');
      await add('Housing', 'expense', 135000, iso, 'Rent');
      await add('Bills & Utilities', 'expense', 9800, iso, 'Electricity & water');
      await add('Subscriptions', 'expense', 1599, iso, 'Netflix');
      await add('Subscriptions', 'expense', 999, iso, 'Spotify');
    }
    await add('Freelance', 'income', 65000, addDays(t, -12), 'Website project');
    await add('Gifts', 'income', 10000, addDays(t, -25), 'Birthday gift');
  });
}
