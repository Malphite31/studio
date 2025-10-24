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
  walletId?: string;
  paymentMethod?: string;
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
  purchased?: boolean;
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
    name?: string;
    username: string;
    email: string;
    bio?: string;
}

export interface Income {
  id: string;
  name: string;
  amount: number;
  date: Date | Timestamp;
  userId: string;
  walletId?: string;
}

export interface EWallet {
    id: string;
    name: string;
    balance: number;
    userId: string;
}


// A type representing the structure of the data to be exported/imported.
export interface ExportData {
  expenses: Expense[];
  income: Income[];
  budgets: BudgetGoal[];
  ious: Iou[];
  wishlist: WishlistItem[];
  wallets: EWallet[];
}

    
