'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wallet, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { EWallet } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { CASH_ON_HAND_WALLET } from '@/lib/data';

interface EWalletsProps {
  wallets: EWallet[];
  addWallet: (name: string, balance: number) => void;
}

const formSchema = z.object({
  name: z.string().min(2, { message: 'Wallet name must be at least 2 characters.' }),
  balance: z.coerce.number().min(0, { message: 'Balance must be non-negative.' }),
});

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(amount).replace('PHP', '₱');

export default function EWallets({ wallets, addWallet }: EWalletsProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', balance: 0 },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    addWallet(values.name, values.balance);
    form.reset();
    setOpen(false);
  }
  
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash & E-Wallets</CardTitle>
        <CardDescription>Your digital and physical money sources.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48 pr-4">
          <div className="space-y-4">
            {wallets.length > 0 ? (
              wallets.map((wallet) => (
                <div key={wallet.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-primary" />
                    <span className="font-medium">{wallet.name}</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(wallet.balance)}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4 text-sm">No cash or e-wallets added yet.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className='flex-col items-stretch gap-4'>
        <div className='flex justify-between items-center font-bold border-t pt-4'>
            <span>Total:</span>
            <span>{formatCurrency(totalBalance)}</span>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add E-Wallet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add E-Wallet</DialogTitle>
              <DialogDescription>Enter the details for your new e-wallet.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wallet Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., GCash" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Balance</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Add Wallet</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
