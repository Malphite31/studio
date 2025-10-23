'use client';

import { format, isValid } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { Landmark, TrendingUp } from 'lucide-react';
import type { Income } from '@/lib/types';
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

interface IncomeTrackerProps {
  income: Income[];
}

export default function IncomeTracker({ income }: IncomeTrackerProps) {
  const sortedIncome = [...income].sort((a, b) => {
    const dateA = a.date instanceof Timestamp ? a.date.toDate() : a.date;
    const dateB = b.date instanceof Timestamp ? b.date.toDate() : b.date;
    if (!isValid(dateA) || !isValid(dateB)) return 0;
    return dateB.getTime() - dateA.getTime();
  });

  const totalIncome = sortedIncome.reduce((acc, item) => acc + item.amount, 0);

  return (
    <>
      <ScrollArea className="h-64">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='p-2'>Source</TableHead>
              <TableHead className="text-right p-2">Amount</TableHead>
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
                      +₱{item.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-sm">
                  No income recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
      <div className="flex justify-end font-bold text-md mt-4 pr-2">
        <div className="flex items-center gap-2">
            <span>Total: ₱{totalIncome.toFixed(2)}</span>
        </div>
      </div>
    </>
  );
}
