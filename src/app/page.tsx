'use client';

import { useState } from 'react';
import type { Expense, BudgetGoal, Category } from '@/lib/types';
import { initialExpenses, initialBudgetGoals } from '@/lib/data';
import DashboardHeader from '@/components/dashboard-header';
import RecentExpenses from '@/components/recent-expenses';
import SpendingBreakdown from '@/components/spending-breakdown';
import BudgetStatus from '@/components/budget-status';
import AiBudgetTool from '@/components/ai-budget-tool';
import AiInsights from '@/components/ai-insights';
import { Toaster } from '@/components/ui/toaster';

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [budgetGoals, setBudgetGoals] =
    useState<BudgetGoal[]>(initialBudgetGoals);
  const [income, setIncome] = useState(5000);

  const addExpense = (expense: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
      date: new Date(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const updateBudgets = (updatedGoals: Record<Category, number>) => {
    const newGoals: BudgetGoal[] = Object.entries(updatedGoals).map(
      ([category, amount]) => ({
        category: category as Category,
        amount: amount,
      })
    );
    setBudgetGoals(newGoals);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <DashboardHeader
        addExpense={addExpense}
        budgetGoals={budgetGoals}
        updateBudgets={updateBudgets}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <AiInsights expenses={expenses} budgetGoals={budgetGoals} />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2 grid gap-4 md:gap-8">
             <SpendingBreakdown expenses={expenses} />
             <BudgetStatus expenses={expenses} budgetGoals={budgetGoals} />
          </div>
          <div className="grid gap-4 md:gap-8">
            <RecentExpenses expenses={expenses} />
            <AiBudgetTool
              expenses={expenses}
              income={income}
              setIncome={setIncome}
            />
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
