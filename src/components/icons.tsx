import {
  Utensils,
  Car,
  Clapperboard,
  Home,
  Zap,
  Receipt,
  HandCoins,
  ArrowRightLeft,
  Ellipsis,
  type LucideIcon,
} from 'lucide-react';
import type { Category } from '@/lib/types';

export const CategoryIcons: Record<Category, LucideIcon> = {
  Groceries: Utensils,
  Transport: Car,
  Entertainment: Clapperboard,
  Housing: Home,
  Utilities: Zap,
  Bills: Receipt,
  Other: Ellipsis,
};
