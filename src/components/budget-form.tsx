'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CATEGORIES } from '@/lib/data';
import type { BudgetGoal, Category } from '@/lib/types';

const formSchema = z.object(
  Object.fromEntries(
    CATEGORIES.map((category) => [
      category,
      z.coerce
        .number({ invalid_type_error: 'Budget must be a number' })
        .min(0, { message: 'Budget must be non-negative.' })
    ])
  )
) as z.ZodType<Record<Category, number>>;

interface BudgetFormProps {
  budgetGoals: BudgetGoal[];
  updateBudgets: (updatedGoals: Record<Category, number>) => void;
}

export function BudgetForm({ budgetGoals, updateBudgets }: BudgetFormProps) {
  const [open, setOpen] = useState(false);

  const defaultValues = Object.fromEntries(
    CATEGORIES.map(category => {
      const goal = budgetGoals.find(g => g.category === category);
      return [category, goal ? goal.amount : 0];
    })
  ) as Record<Category, number>;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateBudgets(values);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Edit Budgets
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Your Monthly Budgets</DialogTitle>
          <DialogDescription>
            Define your spending limits for each category.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-72 pr-6">
                <div className="space-y-4 py-4">
                {CATEGORIES.map((category) => (
                    <FormField
                    key={category}
                    control={form.control}
                    name={category}
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{category}</FormLabel>
                        <FormControl>
                            <Input
                            type="number"
                            step="10"
                            placeholder="e.g., 500"
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                ))}
                </div>
            </ScrollArea>
            <DialogFooter className='mt-4'>
              <Button type="submit">Save Budgets</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
