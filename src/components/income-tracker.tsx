'use client';

import { format, isValid } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import type { Income, EWallet } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IncomeForm } from './income-form';
import { MoreVertical, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { formatCurrency } from '@/lib/utils';

interface IncomeTrackerProps {
  income: Income[];
  wallets: EWallet[];
  onUpdateIncome: (incomeId: string, oldAmount: number, updatedData: Partial<Income>) => void;
  onDeleteIncome: (income: Income) => void;
  addIncome: (income: Omit<Income, 'id'| 'date' | 'userId'>) => void;
}

export default function IncomeTracker({ income, wallets, onUpdateIncome, onDeleteIncome, addIncome }: IncomeTrackerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const sortedIncome = [...income].sort((a, b) => {
    const dateA = a.date instanceof Timestamp ? a.date.toDate() : a.date;
    const dateB = b.date instanceof Timestamp ? b.date.toDate() : b.date;
    if (!isValid(dateA) || !isValid(dateB)) return 0;
    return dateB.getTime() - dateA.getTime();
  });

  const totalIncome = sortedIncome.reduce((acc, item) => acc + item.amount, 0);

  const handleEditClick = (income: Income) => {
    setSelectedIncome(income);
    setIsFormOpen(true);
  }
  
  const handleAddClick = () => {
    setSelectedIncome(null);
    setIsFormOpen(true);
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Income</CardTitle>
            <CardDescription>Your recent income sources.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditMode(!isEditMode)}>
            {isEditMode ? 'Done' : 'Edit'}
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 pr-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='p-2'>Source</TableHead>
                  <TableHead className="text-right p-2">Amount</TableHead>
                  {isEditMode && <TableHead className="text-right p-2">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedIncome.length > 0 ? (
                  sortedIncome.map((item) => {
                    const incomeDate = item.date instanceof Timestamp ? item.date.toDate() : item.date;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className='p-2'>
                            <div className="font-medium text-sm">{item.name}</div>
                            <div className="text-xs text-muted-foreground">
                                {isValid(incomeDate) ? format(incomeDate, 'MMM d, yyyy') : 'Processing...'}
                            </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600 p-2">
                          +{formatCurrency(item.amount)}
                        </TableCell>
                        {isEditMode && (
                          <TableCell className='p-2 text-right'>
                            <AlertDialog>
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreVertical className="h-4 w-4" />
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                      <DropdownMenuItem onSelect={() => handleEditClick(item)}>
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
                                            Are you sure you want to delete this income record? This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => onDeleteIncome(item)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Yes, Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={isEditMode ? 3 : 2} className="text-center py-8 text-sm">
                      No income recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-4">
          <div className="flex justify-between items-center font-bold text-md border-t pt-4">
              <span>Total Income:</span>
              <span>{formatCurrency(totalIncome)}</span>
          </div>
           <Button variant="outline" className="w-full" onClick={handleAddClick}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Income
          </Button>
        </CardFooter>
      </Card>
      
      <IncomeForm
          triggerType='dialog'
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          wallets={wallets}
          incomeToEdit={selectedIncome || undefined}
          onUpdate={onUpdateIncome}
          addIncome={addIncome}
      />
    </>
  );
}
