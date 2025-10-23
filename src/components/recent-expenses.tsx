'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Expense } from '@/lib/types';
import { format, isValid } from 'date-fns';
import { CategoryIcons } from './icons';
import { Timestamp } from 'firebase/firestore';

interface RecentExpensesProps {
  expenses: Expense[];
}

export default function RecentExpenses({ expenses }: RecentExpensesProps) {
  const sortedExpenses = [...expenses].sort((a, b) => {
      const dateA = a.date instanceof Timestamp ? a.date.toDate() : a.date;
      const dateB = b.date instanceof Timestamp ? b.date.toDate() : b.date;
      if (!isValid(dateA) || !isValid(dateB)) return 0;
      return dateB.getTime() - dateA.getTime();
  });
  
  const recentExpenses = sortedExpenses.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          Here are your 5 most recent expenses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expense</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense) => {
                const Icon = CategoryIcons[expense.category];
                const expenseDate = expense.date instanceof Timestamp ? expense.date.toDate() : expense.date;
                return (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 bg-secondary rounded-full">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </span>
                        <div>
                          <div className="font-medium">{expense.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {isValid(expenseDate) ? format(expenseDate, 'MMM d, yyyy') : 'Processing...'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      -₱{expense.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8">
                  No expenses logged yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
