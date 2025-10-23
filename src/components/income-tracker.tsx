'use client';

import { format } from 'date-fns';
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

interface IncomeTrackerProps {
  income: Income[];
}

export default function IncomeTracker({ income }: IncomeTrackerProps) {
  const sortedIncome = [...income].sort((a, b) => {
    const dateA = a.date instanceof Timestamp ? a.date.toDate() : a.date;
    const dateB = b.date instanceof Timestamp ? b.date.toDate() : b.date;
    return dateB.getTime() - dateA.getTime();
  });

  const totalIncome = sortedIncome.reduce((acc, item) => acc + item.amount, 0);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Income History</CardTitle>
        <CardDescription>A record of all your income sources.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedIncome.length > 0 ? (
              sortedIncome.map((item) => {
                const incomeDate = item.date instanceof Timestamp ? item.date.toDate() : item.date;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 bg-secondary rounded-full">
                          <Landmark className="h-4 w-4 text-muted-foreground" />
                        </span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{format(incomeDate, 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      +₱{item.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  No income recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-end font-bold text-lg">
        <div className="flex items-center gap-2">
            <TrendingUp />
            <span>Total Income: ₱{totalIncome.toFixed(2)}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
