'use client';

import { format, isPast, differenceInDays } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  return (
    <Tabs defaultValue="debts">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="debts">Debts</TabsTrigger>
        <TabsTrigger value="loans">Loans</TabsTrigger>
        <TabsTrigger value="paid">Settled</TabsTrigger>
      </TabsList>
      <TabsContent value="debts">
        <IouTable ious={debts} onPaid={handlePaid} type="debt" />
      </TabsContent>
      <TabsContent value="loans">
        <IouTable ious={loans} onPaid={handlePaid} type="loan" />
      </TabsContent>
      <TabsContent value="paid">
        <IouTable ious={paid} type="paid" />
      </TabsContent>
    </Tabs>
  );
}

interface IouTableProps {
  ious: Iou[];
  onPaid?: (iou: Iou) => void;
  type: 'debt' | 'loan' | 'paid';
}

function IouTable({ ious, onPaid, type }: IouTableProps) {
    if (ious.length === 0) {
        return <p className="text-muted-foreground text-center py-4 text-sm">No transactions here.</p>
    }
    
    return (
         <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='p-2'>Description</TableHead>
                <TableHead className="text-right p-2">Amount</TableHead>
                {type !== 'paid' && <TableHead className='p-2'>Due</TableHead>}
                {type !== 'paid' && <TableHead className="text-right p-2">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ious.map(iou => {
                  const dueDate = iou.dueDate instanceof Timestamp ? iou.dueDate.toDate() : iou.dueDate;

                  return (
                    <TableRow key={iou.id}>
                      <TableCell className="font-medium p-2">{iou.name}</TableCell>
                      <TableCell className={`text-right font-medium p-2 ${iou.type === 'Borrow' ? 'text-destructive' : 'text-green-600'}`}>
                        {iou.type === 'Borrow' ? '- ' : '+ '}
                        ₱{iou.amount.toFixed(2)}
                      </TableCell>
                      {type !== 'paid' && 
                        <TableCell className='p-2'>
                          <span className="text-xs">{format(dueDate, 'MMM d')}</span>
                        </TableCell>
                      }
                      {onPaid && type !== 'paid' && (
                         <TableCell className="text-right p-2">
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-7">Settle</Button>
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
                  );
              })}
            </TableBody>
          </Table>
    )
}