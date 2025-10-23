import { CATEGORIES } from './data';

export type Category = (typeof CATEGORIES)[number];

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: Category;
  date: Date;
}

export type BudgetGoal = {
  category: Category;
  amount: number;
};

export interface WishlistItem {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
}
