'use client';

import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getAiBudgetSuggestions } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { Expense } from '@/lib/types';
import type { SuggestBudgetOutput } from '@/ai/flows/ai-budget-suggestions';

interface AiBudgetToolProps {
  expenses: Expense[];
  income: number;
  setIncome: (income: number) => void;
}

const formSchema = z.object({
  income: z.coerce
    .number({ invalid_type_error: 'Income must be a number' })
    .positive({ message: 'Income must be positive.' }),
});

export default function AiBudgetTool({
  expenses,
  income,
  setIncome,
}: AiBudgetToolProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestBudgetOutput | null>(
    null
  );
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      income,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setSuggestions(null);
    setIncome(values.income);

    const expenseSummary = expenses.reduce(
      (acc, expense) => {
        const existing = acc.find((e) => e.category === expense.category);
        if (existing) {
          existing.amount += expense.amount;
        } else {
          acc.push({ category: expense.category, amount: expense.amount });
        }
        return acc;
      },
      [] as { category: string; amount: number }[]
    );

    const result = await getAiBudgetSuggestions({
      income: values.income,
      expenses: expenseSummary,
    });

    if ('error' in result) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else {
      setSuggestions(result);
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-accent" />
          AI Budget Assistant
        </CardTitle>
        <CardDescription>
          Get intelligent budget suggestions based on your income and spending.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="income"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Monthly Income</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 5000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {loading && <SuggestionSkeleton />}
            {suggestions && <SuggestionResults suggestions={suggestions} />}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Analyzing...' : 'Generate Suggestions'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function SuggestionSkeleton() {
  return (
    <div className="space-y-4 pt-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="space-y-2 pt-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

function SuggestionResults({
  suggestions,
}: {
  suggestions: SuggestBudgetOutput;
}) {
  return (
    <div className="space-y-4 pt-2">
      <p className="text-sm text-muted-foreground italic">
        {suggestions.summary}
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Suggested Budget</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suggestions.suggestedBudgets.map((budget) => (
            <TableRow key={budget.category}>
              <TableCell>{budget.category}</TableCell>
              <TableCell className="text-right font-medium">
                ${budget.suggestedAmount.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
