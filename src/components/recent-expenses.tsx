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
import type { Expense, EWallet } from '@/lib/types';
import { format, isValid } from 'date-fns';
import { CategoryIcons } from './icons';
import { Timestamp } from 'firebase/firestore';
import { ExpenseForm } from './expense-form';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface RecentExpensesProps {
  expenses: Expense[];
  onUpdateExpense: (expenseId: string, oldAmount: number, updatedData: Partial<Expense>) => void;
  onDeleteExpense: (expense: Expense) => void;
  wallets: EWallet[];
}

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(amount).replace('PHP', '₱');


export default function RecentExpenses({ expenses, onUpdateExpense, onDeleteExpense, wallets }: RecentExpensesProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const sortedExpenses = [...expenses].sort((a, b) => {
      const dateA = a.date instanceof Timestamp ? a.date.toDate() : a.date;
      const dateB = b.date instanceof Timestamp ? b.date.toDate() : b.date;
      if (!isValid(dateA) || !isValid(dateB)) return 0;
      return dateB.getTime() - dateA.getTime();
  });
  
  const recentExpenses = sortedExpenses.slice(0, 10);
  
  const handleEditClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsEditOpen(true);
  };


  return (
    <>
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
              <TableHead className="text-right">Actions</TableHead>
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
                             {expense.paymentMethod && ` via ${expense.paymentMethod}`}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      -{formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                       <AlertDialog>
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem onSelect={() => handleEditClick(expense)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit
                                  </DropdownMenuItem>
                                  <AlertDialogTrigger asChild>
                                      <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                      </DropdownMenuItem>
                                  </AlertDialogTrigger>
                              </DropdownMenuContent>
                          </DropdownMenu>

                           <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete this expense? This will revert the amount from the associated wallet. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => onDeleteExpense(expense)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Yes, Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                       </AlertDialog>
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
     {selectedExpense && (
        <ExpenseForm
            triggerType='dialog'
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            wallets={wallets}
            expenseToEdit={selectedExpense}
            onUpdate={onUpdateExpense}
        />
     )}
    </>
  );
}
