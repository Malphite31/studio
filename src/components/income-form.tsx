'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Income, EWallet } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  walletId: z.string({ required_error: 'Please select a wallet.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface IncomeFormProps {
  triggerType: 'button' | 'edit' | 'fab';
  wallets: EWallet[];
  incomeToEdit?: Income;
  addIncome?: (income: Omit<Income, 'id' | 'date' | 'userId'>) => void;
  onUpdate?: (incomeId: string, oldAmount: number, updatedData: Partial<Income>) => void;
  children?: React.ReactNode;
}

export function IncomeForm({
  triggerType,
  wallets,
  incomeToEdit,
  addIncome,
  onUpdate,
  children
}: IncomeFormProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const isEditMode = !!incomeToEdit;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode ? {
      name: incomeToEdit.name,
      amount: incomeToEdit.amount,
      walletId: incomeToEdit.walletId,
    } : {
      name: '',
      amount: 0,
      walletId: wallets.length > 0 ? wallets[0].id : undefined,
    },
  });

  function onSubmit(values: FormValues) {
    if (isEditMode && onUpdate && incomeToEdit) {
      onUpdate(incomeToEdit.id, incomeToEdit.amount, values);
       toast({ title: 'Income Updated!', description: `${values.name} has been successfully updated.` });
    } else if (addIncome) {
      addIncome(values);
      toast({ title: 'Income Added!', description: `An income of ${values.amount} has been recorded.` });
    }
    setOpen(false);
    if (!isEditMode) form.reset();
  }

  const TriggerButton = triggerType === 'edit'
    ? <span onClick={() => setOpen(true)}>{children}</span>
    : <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>{children}</Button>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {TriggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Income' : 'Add Income'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details of this income record.' : 'Enter the details of a new income source.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Monthly Salary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="walletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit To</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a wallet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Income'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
