import { CATEGORIES } from './data';
import { Timestamp } from 'firebase/firestore';

export type Category = (typeof CATEGORIES)[number];

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: Category;
  date: Date | Timestamp;
  userId: string;
}

export type BudgetGoal = {
  id?: string; // category name
  category: Category;
  amount: number;
  userId: string;
};

export interface WishlistItem {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  userId: string;
}

export type IouType = 'Borrow' | 'Lent';

export interface Iou {
  id: string;
  name: string;
  amount: number;
  type: IouType;
  dueDate: Date | Timestamp;
  paid: boolean;
  userId: string;
}

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    profilePicture?: string;
}
