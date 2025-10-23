'use client';

import * as React from 'react';
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Expense } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/data';

interface SpendingBreakdownProps {
  expenses: Expense[];
}

export default function SpendingBreakdown({ expenses }: SpendingBreakdownProps) {
  const { chartData, chartConfig } = React.useMemo(() => {
    if (!expenses.length) {
      return { chartData: [], chartConfig: {} };
    }
    const dataByCat = expenses.reduce(
      (acc, expense) => {
        if (!acc[expense.category]) {
          acc[expense.category] = 0;
        }
        acc[expense.category] += expense.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    const chartData = Object.entries(dataByCat).map(([category, total]) => ({
      category,
      total,
      fill: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS],
    }));

    const chartConfig: ChartConfig = chartData.reduce((acc, data) => {
      acc[data.category] = {
        label: data.category,
        color: data.fill,
      };
      return acc;
    }, {} as ChartConfig);

    return { chartData, chartConfig };
  }, [expenses]);
  
  const totalSpent = React.useMemo(() => {
      return chartData.reduce((acc, curr) => acc + curr.total, 0)
  }, [chartData]);


  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Spending Breakdown</CardTitle>
        <CardDescription>
          {format(new Date(), 'MMMM yyyy')} Spending
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {totalSpent > 0 ? (
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="category" />}
              />
              <Pie
                data={chartData}
                dataKey="total"
                nameKey="category"
                innerRadius="60%"
                strokeWidth={5}
              >
                 {chartData.map((entry) => (
                    <Cell key={`cell-${entry.category}`} fill={entry.fill} />
                  ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        ) : (
          <div className="flex h-[300px] w-full items-center justify-center">
            <p className="text-muted-foreground">No spending data for this month.</p>
          </div>
        )}
      </CardContent>
       <CardFooter className="flex-col gap-2 text-sm pt-4">
        <div className="flex items-center gap-2 font-medium leading-none">
          Total spent this month: ${totalSpent.toFixed(2)}
        </div>
        <div className="leading-none text-muted-foreground">
          Showing spending summary for all categories.
        </div>
      </CardFooter>
    </Card>
  );
}

function format(date: Date, fmt: string) {
  // A simple date formatter to avoid dependency on a large library for this one-off case
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}
