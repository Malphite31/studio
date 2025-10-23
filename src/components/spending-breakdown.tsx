'use client';

import * as React from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { format } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Expense, Category } from '@/lib/types';
import { CATEGORIES } from '@/lib/data';

interface SpendingBreakdownProps {
  expenses: Expense[];
}

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(amount).replace('PHP', '₱');


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

    const chartData = CATEGORIES.map((category, index) => ({
      category,
      total: dataByCat[category] || 0,
    }));

    const chartConfig: ChartConfig = {
      total: {
        label: 'Total',
        color: 'hsl(var(--chart-1))',
      },
    };

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
          className="mx-auto aspect-video max-h-[250px] sm:max-h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
               <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis 
                tickFormatter={(value) => `₱${value}`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={false}
                content={<ChartTooltipContent 
                    formatter={(value, name, item) => (
                        <div className="flex flex-col">
                            <span className="font-bold">{item.payload.category}</span>
                            <span>{formatCurrency(value as number)}</span>
                        </div>
                    )}
                    hideLabel
                />}
              />
              <Bar dataKey="total" fill="url(#barGradient)" radius={8} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        ) : (
          <div className="flex h-[250px] sm:h-[300px] w-full items-center justify-center">
            <p className="text-muted-foreground">No spending data for this month.</p>
          </div>
        )}
      </CardContent>
       <CardFooter className="flex-col gap-2 text-sm pt-4">
        <div className="flex items-center gap-2 font-medium leading-none">
          Total spent this month: {formatCurrency(totalSpent)}
        </div>
        <div className="leading-none text-muted-foreground">
          Showing spending summary for all categories.
        </div>
      </CardFooter>
    </Card>
  );
}
