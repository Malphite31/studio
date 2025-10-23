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
import type { Expense, EWallet } from '@/lib/types';
import { format, isValid } from 'date-fns';
import { CategoryIcons } from './icons';
import { Timestamp } from 'firebase/firestore';
import { ExpenseForm } from './expense-form';
import { CASH_ON_HAND_WALLET } from '@/lib/data';

interface RecentExpensesProps {
  expenses: Expense[];
  onUpdateExpense: (expenseId: string, oldAmount: number, updatedData: Partial<Expense>) => void;
  wallets: EWallet[];
}

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(amount).replace('PHP', '₱');


export default function RecentExpenses({ expenses, onUpdateExpense, wallets }: RecentExpensesProps) {
  const sortedExpenses = [...expenses].sort((a, b) => {
      const dateA = a.date instanceof Timestamp ? a.date.toDate() : a.date;
      const dateB = b.date instanceof Timestamp ? b.date.toDate() : b.date;
      if (!isValid(dateA) || !isValid(dateB)) return 0;
      return dateB.getTime() - dateA.getTime();
  });
  
  const recentExpenses = sortedExpenses.slice(0, 10);
  const allWallets = [CASH_ON_HAND_WALLET, ...wallets.filter(w => w.id !== CASH_ON_HAND_WALLET.id)];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          Here are your 10 most recent expenses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Expense</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense) => {
                const Icon = CategoryIcons[expense.category];
                const expenseDate = expense.date instanceof Timestamp ? expense.date.toDate() : new Date();
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
                      -{formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                       <ExpenseForm
                          triggerType="edit"
                          wallets={allWallets}
                          expenseToEdit={expense}
                          onUpdate={onUpdateExpense}
                        />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
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
