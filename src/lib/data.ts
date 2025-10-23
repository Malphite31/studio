import type { Expense, BudgetGoal, Category, WishlistItem, Iou } from './types';
import { Timestamp } from 'firebase/firestore';

export const CATEGORIES = [
  'Groceries',
  'Transport',
  'Entertainment',
  'Housing',
  'Utilities',
  'Bills',
  'Other',
] as const;

export const CATEGORY_COLORS: Record<Category, string> = {
    Groceries: 'hsl(var(--chart-1))',
    Transport: 'hsl(var(--chart-2))',
    Entertainment: 'hsl(var(--chart-3))',
    Housing: 'hsl(var(--chart-4))',
    Utilities: 'hsl(var(--chart-5))',
    Bills: 'hsl(var(--chart-1))',
    Other: 'hsl(var(--muted))',
};

// This file now contains only static data types.
// The initial data for expenses, budgets, etc., will be created
// for each user upon sign-up or first login.
