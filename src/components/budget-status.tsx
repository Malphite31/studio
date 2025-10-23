'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Expense, BudgetGoal } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/data';

interface BudgetStatusProps {
  expenses: Expense[];
  budgetGoals: BudgetGoal[];
}

export default function BudgetStatus({
  expenses,
  budgetGoals,
}: BudgetStatusProps) {
  const budgetStatusData = React.useMemo(() => {
    const spendingByCategory = expenses.reduce(
      (acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    return budgetGoals
      .map((goal) => {
        const spent = spendingByCategory[goal.category] || 0;
        const progress = goal.amount > 0 ? (spent / goal.amount) * 100 : 0;
        return {
          ...goal,
          spent,
          progress: Math.min(progress, 100), // Cap at 100% for visual
          overBudget: spent > goal.amount
        };
      })
      .sort((a, b) => b.progress - a.progress);
  }, [expenses, budgetGoals]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Status</CardTitle>
        <CardDescription>Your spending progress against your goals.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {budgetStatusData.length > 0 ? (
            budgetStatusData.map((status) => (
              <div key={status.category} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{status.category}</span>
                  <span className={`font-medium ${status.overBudget ? 'text-destructive' : 'text-muted-foreground'}`}>
                    ${status.spent.toFixed(2)} / ${status.amount.toFixed(2)}
                  </span>
                </div>
                <Progress
                  value={status.progress}
                  className="h-2"
                  style={{
                    '--color-indicator': CATEGORY_COLORS[status.category],
                  } as React.CSSProperties}
                  indicatorClassName={`bg-[--color-indicator]`}
                />
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No budgets set. Go to &quot;Edit Budgets&quot; to create some!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
