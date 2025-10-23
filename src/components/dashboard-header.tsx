'use client';

import { CircleUser, Coins, Menu, Settings } from 'lucide-react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExpenseForm } from './expense-form';
import { BudgetForm } from './budget-form';
import { ThemeSwitcher } from './theme-switcher';
import type { Expense, BudgetGoal, Category, Iou } from '@/lib/types';

interface DashboardHeaderProps {
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  addIou: (iou: Omit<Iou, 'id' | 'paid'>) => void;
  budgetGoals: BudgetGoal[];
  updateBudgets: (updatedGoals: Record<Category, number>) => void;
}

export default function DashboardHeader({
  addExpense,
  addIou,
  budgetGoals,
  updateBudgets,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-30">
        <div className="flex items-center gap-2 font-semibold">
          <Coins className="h-6 w-6 text-primary" />
          <span className="">SpendWise</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <div className='hidden sm:flex items-center gap-2'>
                <ThemeSwitcher />
                <BudgetForm budgetGoals={budgetGoals} updateBudgets={updateBudgets} />
                <ExpenseForm addExpense={addExpense} addIou={addIou} />
            </div>
            
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="sm:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left">
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <nav className="grid gap-6 text-lg font-medium">
                        <Link
                        href="#"
                        className="flex items-center gap-2 text-lg font-semibold"
                        >
                            <Coins className="h-6 w-6 text-primary" />
                            <span className="sr-only">SpendWise</span>
                        </Link>
                        <div className="flex flex-col gap-4">
                            <ThemeSwitcher />
                            <BudgetForm budgetGoals={budgetGoals} updateBudgets={updateBudgets} />
                            <ExpenseForm addExpense={addExpense} addIou={addIou} />
                        </div>

                    </nav>
                </SheetContent>
            </Sheet>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                        <CircleUser className="h-5 w-5" />
                        <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                    <DropdownMenuItem>Support</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Logout</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </header>
  );
}
