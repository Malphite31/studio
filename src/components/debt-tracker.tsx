'use client';

import { format, isPast, differenceInDays } from 'date-fns';
import { HandCoins, ArrowRightLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Iou } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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

interface DebtTrackerProps {
  ious: Iou[];
  markAsPaid: (id: string) => void;
}

export default function DebtTracker({ ious, markAsPaid }: DebtTrackerProps) {
  const { toast } = useToast();
  
  const debts = ious.filter(iou => iou.type === 'Borrow' && !iou.paid);
  const loans = ious.filter(iou => iou.type === 'Lent' && !iou.paid);
  const paid = ious.filter(iou => iou.paid);

  const handlePaid = (iou: Iou) => {
      markAsPaid(iou.id);
      toast({
          title: 'Transaction settled!',
          description: `${iou.name} has been marked as paid.`
      })
  }
  
  const DueDateBadge = ({ dueDate }: { dueDate: Date }) => {
    const isOverdue = isPast(dueDate);
    const days = Math.abs(differenceInDays(new Date(), dueDate));
    let text, variant: "default" | "destructive" | "secondary" | "outline" | null | undefined, icon;

    if (isOverdue) {
      text = `${days} ${days === 1 ? 'day' : 'days'} overdue`;
      variant = "destructive";
      icon = <AlertCircle className="h-3 w-3 mr-1" />;
    } else {
      text = `in ${days} ${days === 1 ? 'day' : 'days'}`;
      variant = "secondary";
    }

    return <Badge variant={variant} className="flex items-center w-fit">{icon}{text}</Badge>;
  };

  return (
    <div className="grid gap-6 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Money You Owe</CardTitle>
          <CardDescription>These are your current debts to others.</CardDescription>
        </CardHeader>
        <CardContent>
          <IouTable ious={debts} onPaid={handlePaid} type="debt" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Money Owed to You</CardTitle>
          <CardDescription>This is money that others have borrowed from you.</CardDescription>
        </CardHeader>
        <CardContent>
          <IouTable ious={loans} onPaid={handlePaid} type="loan" />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Settled Transactions</CardTitle>
          <CardDescription>These are all your paid-off debts and loans.</CardDescription>
        </CardHeader>
        <CardContent>
            <IouTable ious={paid} type="paid" />
        </CardContent>
      </Card>
    </div>
  );
}

interface IouTableProps {
  ious: Iou[];
  onPaid?: (iou: Iou) => void;
  type: 'debt' | 'loan' | 'paid';
}

function IouTable({ ious, onPaid, type }: IouTableProps) {
    if (ious.length === 0) {
        return <p className="text-muted-foreground text-center py-4">No transactions in this category.</p>
    }
    
    return (
         <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {type !== 'paid' && <TableHead>Due Date</TableHead>}
                {type !== 'paid' && <TableHead className="text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ious.map(iou => (
                <TableRow key={iou.id}>
                  <TableCell className="font-medium">{iou.name}</TableCell>
                  <TableCell className={`text-right font-medium ${iou.type === 'Borrow' ? 'text-destructive' : 'text-green-600'}`}>
                    {iou.type === 'Borrow' ? '- ' : '+ '}
                    ₱{iou.amount.toFixed(2)}
                  </TableCell>
                  {type !== 'paid' && 
                    <TableCell>
                      <span className="text-sm">{format(iou.dueDate, 'MMM d, yyyy')}</span>
                    </TableCell>
                  }
                  {onPaid && type !== 'paid' && (
                     <TableCell className="text-right">
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">Mark as Paid</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Settle Transaction?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  This will mark "{iou.name}" as paid and move it to your settled transactions. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onPaid(iou)}>Confirm</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
    )
}
