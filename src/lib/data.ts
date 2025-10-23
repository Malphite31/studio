import type { Expense, BudgetGoal, Category, WishlistItem, Iou } from './types';

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

export const initialExpenses: Expense[] = [
  {
    id: 'exp-1',
    name: 'Weekly Groceries',
    amount: 120.5,
    category: 'Groceries',
    date: new Date(new Date().setDate(new Date().getDate() - 2)),
  },
  {
    id: 'exp-2',
    name: 'Gasoline',
    amount: 55.0,
    category: 'Transport',
    date: new Date(new Date().setDate(new Date().getDate() - 3)),
  },
  {
    id: 'exp-3',
    name: 'Movie Tickets',
    amount: 30.0,
    category: 'Entertainment',
    date: new Date(new Date().setDate(new Date().getDate() - 5)),
  },
  {
    id: 'exp-4',
    name: 'Rent',
    amount: 1500.0,
    category: 'Housing',
    date: new Date(new Date().setDate(1)),
  },
  {
    id: 'exp-5',
    name: 'Electricity Bill',
    amount: 75.8,
    category: 'Utilities',
    date: new Date(new Date().setDate(new Date().getDate() - 1)),
  },
  {
    id: 'exp-6',
    name: 'Lunch with Friends',
    amount: 45.25,
    category: 'Groceries',
    date: new Date(new Date().setDate(new Date().getDate() - 4)),
  },
];

export const initialBudgetGoals: BudgetGoal[] = [
  { category: 'Groceries', amount: 500 },
  { category: 'Transport', amount: 200 },
  { category: 'Entertainment', amount: 150 },
  { category: 'Housing', amount: 1500 },
  { category: 'Utilities', amount: 150 },
  { category: 'Bills', amount: 250 },
  { category: 'Other', amount: 100 },
];

export const initialWishlistItems: WishlistItem[] = [
  { id: 'wish-1', name: 'New Laptop', targetAmount: 1200, savedAmount: 300 },
  { id: 'wish-2', name: 'Vacation to Hawaii', targetAmount: 2500, savedAmount: 1500 },
  { id: 'wish-3', name: 'Noise-Cancelling Headphones', targetAmount: 350, savedAmount: 350 },
];

export const initialIous: Iou[] = [
    { id: 'iou-1', name: 'Loan from Jane', type: 'Borrow', amount: 100, dueDate: new Date(new Date().setDate(new Date().getDate() + 14)), paid: false },
    { id: 'iou-2', name: 'Lunch for John', type: 'Lent', amount: 25, dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), paid: false },
    { id: 'iou-3', name: 'Concert ticket', type: 'Borrow', amount: 75, dueDate: new Date(new Date().setDate(new Date().getDate() - 5)), paid: true },
];
