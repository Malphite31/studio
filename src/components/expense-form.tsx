'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays } from 'date-fns';
import { Calendar as CalendarIcon, PlusCircle, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CATEGORIES, CASH_ON_HAND_WALLET } from '@/lib/data';
import type { Expense, Iou, Income, EWallet, Category } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const FormCategories = ['Income', ...CATEGORIES, 'Borrow', 'Lent'] as const;

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  amount: z.coerce
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive({ message: 'Amount must be positive.' }),
  category: z.enum(FormCategories),
  date: z.date().optional(),
  dueDate: z.date().optional(),
  walletId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  addExpense?: (expense: Omit<Expense, 'id' | 'date' | 'userId'>) => void;
  addIou?: (iou: Omit<Iou, 'id' | 'paid' | 'userId'>) => void;
  addIncome?: (income: Omit<Income, 'id' | 'date' | 'userId'>) => void;
  triggerType: 'button' | 'fab' | 'edit';
  wallets: EWallet[];
  expenseToEdit?: Expense;
  onUpdate?: (expenseId: string, oldAmount: number, updatedData: Partial<Expense>) => void;
}

export function ExpenseForm({ addExpense, addIou, addIncome, triggerType, wallets, expenseToEdit, onUpdate }: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const isEditMode = !!expenseToEdit;

  const allWallets = [CASH_ON_HAND_WALLET, ...wallets.filter(w => w.id !== CASH_ON_HAND_WALLET.id)];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditMode ? {
      name: expenseToEdit.name,
      amount: expenseToEdit.amount,
      category: expenseToEdit.category,
      walletId: expenseToEdit.walletId,
    } : {
      name: '',
      amount: 0,
      category: 'Other',
      date: new Date(),
      walletId: allWallets.length > 0 ? allWallets[0].id : undefined,
    },
  });
  
  const category = form.watch('category');

  function onSubmit(values: FormValues) {
    const isWalletRequired = values.category !== 'Borrow' && values.category !== 'Lent';

    if (isWalletRequired && !values.walletId) {
      toast({
        variant: "destructive",
        title: "Wallet required",
        description: `Please select a wallet for this ${values.category.toLowerCase()}.`,
      });
      return;
    }
    
    if (isEditMode && onUpdate && expenseToEdit) {
        onUpdate(expenseToEdit.id, expenseToEdit.amount, {
            name: values.name,
            amount: values.amount,
            category: values.category as Category,
            walletId: values.walletId,
        });
    } else if (values.category === 'Borrow' || values.category === 'Lent') {
      addIou?.({
        name: values.name,
        amount: values.amount,
        type: values.category,
        dueDate: values.dueDate || addDays(new Date(), 30),
      });
      toast({
        title: "IOU tracked!",
        description: `Your ${values.category.toLowerCase()} transaction has been recorded.`,
      })
    } else if (values.category === 'Income') {
        addIncome?.({
            name: values.name,
            amount: values.amount,
            walletId: values.walletId,
        });
        toast({
            title: 'Income added!',
            description: `You've recorded an income of ₱${values.amount}.`,
        });
    } else {
      const expenseData: Omit<Expense, 'id'| 'date' | 'userId'> = {
        name: values.name,
        amount: values.amount,
        category: values.category as (typeof CATEGORIES)[number],
        walletId: values.walletId,
      };
      addExpense?.(expenseData);
      toast({
          title: "Expense added!",
          description: `${values.name} has been added to your expenses.`
      });
    }
    
    if (!isEditMode) form.reset();
    setOpen(false);
  }
  
  const TriggerButton = 
    triggerType === 'fab' ? (
      <Button className="fixed bottom-4 right-4 h-16 w-16 rounded-full shadow-lg" size="icon">
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add Transaction</span>
      </Button>
    ) : triggerType === 'edit' ? (
      <Button variant="ghost" size="sm">Edit</Button>
    ) : (
      <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Transaction
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {TriggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Transaction' : 'Add a New Transaction'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details of your transaction.' : 'Enter the details of your expense, income, borrowing, or lending.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {!isEditMode && (
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FormCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name / Description</FormLabel>
                  <FormControl>
                    <Input placeholder={
                        isEditMode ? 'Transaction name' :
                        category === 'Income' ? 'e.g., Monthly Salary' :
                        category === 'Borrow' ? 'e.g., Loan from Mom' : 
                        category === 'Lent' ? 'e.g., Lunch for a friend' : 'e.g., Coffee'
                        } {...field} />
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
                    <Input type="number" step="0.01" placeholder="e.g., 4.50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             {(category === 'Expense' || category === 'Income' || isEditMode) && category !== 'Borrow' && category !== 'Lent' && (
                <FormField
                  control={form.control}
                  name="walletId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wallet</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a wallet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allWallets.map(wallet => (
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
             )}
             {!isEditMode && (category === 'Borrow' || category === 'Lent') && (
                 <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             )}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">{isEditMode ? 'Save Changes' : 'Save Transaction'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
