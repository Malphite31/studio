'use client';

import { CircleUser, Coins } from 'lucide-react';

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
import type { Expense, BudgetGoal, Category } from '@/lib/types';

interface DashboardHeaderProps {
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  budgetGoals: BudgetGoal[];
  updateBudgets: (updatedGoals: Record<Category, number>) => void;
}

export default function DashboardHeader({
  addExpense,
  budgetGoals,
  updateBudgets,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
       <div className="flex items-center gap-2">
          <Coins className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold font-headline tracking-tight">SpendWise</h1>
        </div>
      <div className="ml-auto flex items-center gap-2">
        <BudgetForm budgetGoals={budgetGoals} updateBudgets={updateBudgets} />
        <ExpenseForm addExpense={addExpense} />
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
