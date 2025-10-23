'use client';

import * as React from 'react';
import { getAiBudgetAlerts } from '@/app/actions';
import type { Expense, BudgetGoal } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';

interface AiInsightsProps {
  expenses: Expense[];
  budgetGoals: BudgetGoal[];
}

export default function AiInsights({ expenses, budgetGoals }: AiInsightsProps) {
  const [alerts, setAlerts] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchAlerts() {
      setLoading(true);
      setError(null);

      const spending = expenses.reduce(
        (acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          return acc;
        },
        {} as Record<string, number>
      );

      const budgetGoalsMap = budgetGoals.reduce(
        (acc, goal) => {
          acc[goal.category] = goal.amount;
          return acc;
        },
        {} as Record<string, number>
      );

      // Only run if there are budget goals
      if (Object.keys(budgetGoalsMap).length === 0) {
        setAlerts([]);
        setLoading(false);
        return;
      }
      
      const result = await getAiBudgetAlerts({
        budgetGoals: budgetGoalsMap,
        spending,
      });

      if (result && 'error' in result) {
        setError(result.error);
        setAlerts([]);
      } else if (result) {
        setAlerts(result.alerts);
      }
      setLoading(false);
    }

    fetchAlerts();
  }, [expenses, budgetGoals]);
  
  const getAlertIcon = (alertText: string) => {
    if (alertText.toLowerCase().includes('exceed')) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    if (alertText.toLowerCase().includes('approaching')) {
      return <Lightbulb className="h-4 w-4" />;
    }
    return <CheckCircle2 className="h-4 w-4" />;
  }

  return (
    <>
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-32" />
            </CardContent>
          </Card>
        ))
      ) : error ? (
        <div className="lg:col-span-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      ) : alerts.length > 0 ? (
        alerts.map((alert, index) => (
          <Card key={index}>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Insight</CardTitle>
                {getAlertIcon(alert)}
            </CardHeader>
            <CardContent>
                <p className="text-sm font-normal">{alert}</p>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="lg:col-span-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>All Good!</AlertTitle>
              <AlertDescription>
                You&apos;re well within your budgets. Keep up the great work!
              </AlertDescription>
            </Alert>
        </div>
      )}
    </>
  );
}
