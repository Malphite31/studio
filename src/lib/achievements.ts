'use client';
import type { LucideIcon } from 'lucide-react';
import { Award, BarChart, BookOpen, Bot, Briefcase, Calendar, CircleDollarSign, Coffee, CreditCard, Droplets, Dumbbell, Feather, File, Flame, Gem, Gift, Globe, Heart, Home, Key, Landmark, Layers, Leaf, Lightbulb, Lock, Medal, Megaphone, Moon, MoreHorizontal, Mouse, Pen, PiggyBank, Pilcrow, Plane, Plug, Puzzle, Quote, School, Scroll, Search, Settings, Shield, ShoppingBag, ShoppingCart, Smile, Sparkles, Speaker, Star, Sun, Sword, ThumbsUp, Timer, ToggleLeft, ToyBrick, Trophy, Umbrella, User, Video, Wallet, Watch, Wind, Zap } from 'lucide-react';
import type { UserDataAggregate, Achievement } from './types';

export interface AchievementData {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  check: (data: UserDataAggregate) => boolean;
}

export const ALL_ACHIEVEMENTS: AchievementData[] = [
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Log your first expense.',
    icon: Award,
    check: (data) => data.expenses.length >= 1,
  },
  {
    id: 'penny-pincher',
    title: 'Penny Pincher',
    description: 'Log 10 expenses.',
    icon: PiggyBank,
    check: (data) => data.expenses.length >= 10,
  },
  {
    id: 'serious-spender',
    title: 'Serious Spender',
    description: 'Log 50 expenses.',
    icon: CreditCard,
    check: (data) => data.expenses.length >= 50,
  },
  {
    id: 'expense-expert',
    title: 'Expense Expert',
    description: 'Log 100 expenses.',
    icon: BarChart,
    check: (data) => data.expenses.length >= 100,
  },
  {
    id: 'income-initiate',
    title: 'Income Initiate',
    description: 'Log your first income.',
    icon: CircleDollarSign,
    check: (data) => data.income.length >= 1,
  },
  {
    id: 'money-maker',
    title: 'Money Maker',
    description: 'Log 5 income entries.',
    icon: Briefcase,
    check: (data) => data.income.length >= 5,
  },
  {
    id: 'budget-beginner',
    title: 'Budget Beginner',
    description: 'Set your first budget.',
    icon: Pen,
    check: (data) => data.budgetGoals.length > 0,
  },
  {
    id: 'wish-starter',
    title: 'Wish Starter',
    description: 'Add an item to your wishlist.',
    icon: Gift,
    check: (data) => data.wishlistItems.length >= 1,
  },
  {
    id: 'dream-big',
    title: 'Dream Big',
    description: 'Add 5 items to your wishlist.',
    icon: Sparkles,
    check: (data) => data.wishlistItems.length >= 5,
  },
  {
    id: 'goal-getter',
    title: 'Goal Getter',
    description: 'Fully fund a wishlist item.',
    icon: Trophy,
    check: (data) => data.wishlistItems.some(item => item.savedAmount >= item.targetAmount),
  },
  {
    id: 'iou-initiate',
    title: 'IOU Initiate',
    description: 'Track your first debt or loan.',
    icon: HandCoins,
    check: (data) => data.ious.length >= 1,
  },
  {
    id: 'debt-destroyer',
    title: 'Debt Destroyer',
    description: 'Pay off a borrowed IOU.',
    icon: Shield,
    check: (data) => data.ious.some(iou => iou.type === 'Borrow' && iou.paid),
  },
  {
    id: 'generous-lender',
    title: 'Generous Lender',
    description: 'Settle a lent IOU.',
    icon: Heart,
    check: (data) => data.ious.some(iou => iou.type === 'Lent' && iou.paid),
  },
  {
    id: 'wallet-wizard',
    title: 'Wallet Wizard',
    description: 'Add your first E-Wallet.',
    icon: Wallet,
    check: (data) => (data.wallets?.length ?? 0) > 0, // Exclude cash-on-hand
  },
];
