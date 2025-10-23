import {
  Utensils,
  Car,
  Clapperboard,
  Home,
  Zap,
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
  Other: Ellipsis,
};
