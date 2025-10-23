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
import { EditDeleteButtons } from './edit-delete-buttons';
import { IncomeForm } from './income-form';
import { Pencil, PlusCircle } from 'lucide-react';
import { Button } from './ui/button';

interface IncomeTrackerProps {
  income: Income[];
  wallets: EWallet[];
  onUpdateIncome: (incomeId: string, oldAmount: number, updatedData: Partial<Income>) => void;
  onDeleteIncome: (income: Income) => void;
  addIncome: (income: Omit<Income, 'id'| 'date' | 'userId'>) => void;
}

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(amount).replace('PHP', '₱');


export default function IncomeTracker({ income, wallets, onUpdateIncome, onDeleteIncome, addIncome }: IncomeTrackerProps) {
  const sortedIncome = [...income].sort((a, b) => {
    const dateA = a.date instanceof Timestamp ? a.date.toDate() : a.date;
    const dateB = b.date instanceof Timestamp ? b.date.toDate() : b.date;
    if (!isValid(dateA) || !isValid(dateB)) return 0;
    return dateB.getTime() - dateA.getTime();
  });

  const totalIncome = sortedIncome.reduce((acc, item) => acc + item.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income</CardTitle>
        <CardDescription>Your recent income sources.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 pr-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='p-2'>Source</TableHead>
                <TableHead className="text-right p-2">Amount</TableHead>
                <TableHead className="text-right p-2">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedIncome.length > 0 ? (
                sortedIncome.map((item) => {
                  const incomeDate = item.date instanceof Timestamp ? item.date.toDate() : item.date;
                  return (
                    <TableRow key={item.id} className="group">
                      <TableCell className='p-2'>
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                              {isValid(incomeDate) ? format(incomeDate, 'MMM d, yyyy') : 'Processing...'}
                          </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600 p-2">
                        +{formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell className='p-2 text-right'>
                        <EditDeleteButtons
                          onEdit={() => {}}
                          onDelete={() => onDeleteIncome(item)}
                          deleteWarning="Are you sure you want to delete this income record?"
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <IncomeForm
                            triggerType="edit"
                            wallets={wallets}
                            incomeToEdit={item}
                            onUpdate={onUpdateIncome}
                           >
                             <Button variant="ghost" size="icon" className="h-7 w-7">
                               <Pencil className="h-4 w-4" />
                             </Button>
                           </IncomeForm>
                        </EditDeleteButtons>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-sm">
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
         <IncomeForm triggerType='button' wallets={wallets} addIncome={addIncome}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Income
        </IncomeForm>
      </CardFooter>
    </Card>
  );
}
