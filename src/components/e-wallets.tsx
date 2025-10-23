'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wallet, PlusCircle, Pencil } from 'lucide-react';
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
import { EditDeleteButtons } from './edit-delete-buttons';

interface EWalletsProps {
  wallets: EWallet[];
  addWallet: (name: string, balance: number) => void;
  updateWallet: (id: string, name: string) => void;
  deleteWallet: (id: string) => void;
}

const addFormSchema = z.object({
  name: z.string().min(2, { message: 'Wallet name must be at least 2 characters.' }),
  balance: z.coerce.number().min(0, { message: 'Balance must be non-negative.' }),
});

const editFormSchema = z.object({
    name: z.string().min(2, { message: 'Wallet name must be at least 2 characters.' }),
});


const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(amount).replace('PHP', '₱');

export default function EWallets({ wallets, addWallet, updateWallet, deleteWallet }: EWalletsProps) {
  const [isAddOpen, setAddOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<EWallet | null>(null);

  const addForm = useForm<z.infer<typeof addFormSchema>>({
    resolver: zodResolver(addFormSchema),
    defaultValues: { name: '', balance: 0 },
  });

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
  });

  function onAddSubmit(values: z.infer<typeof addFormSchema>) {
    addWallet(values.name, values.balance);
    addForm.reset();
    setAddOpen(false);
  }

  function onEditSubmit(values: z.infer<typeof editFormSchema>) {
    if (selectedWallet) {
        updateWallet(selectedWallet.id, values.name);
    }
    setEditOpen(false);
    setSelectedWallet(null);
  }

  function handleEditClick(wallet: EWallet) {
    setSelectedWallet(wallet);
    editForm.reset({ name: wallet.name });
    setEditOpen(true);
  }

  function handleDeleteClick(wallet: EWallet) {
    deleteWallet(wallet.id);
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
          <div className="space-y-2">
            {wallets.length > 0 ? (
              wallets.map((wallet) => (
                <div key={wallet.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 group">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-primary" />
                    <div className='flex flex-col'>
                        <span className="font-medium">{wallet.name}</span>
                        {wallet.id !== 'cash' && 
                          <span className='text-xs text-muted-foreground'>E-Wallet</span>
                        }
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className="font-semibold">{formatCurrency(wallet.balance)}</span>
                    {wallet.id !== 'cash' && (
                        <EditDeleteButtons
                            onEdit={() => handleEditClick(wallet)}
                            onDelete={() => handleDeleteClick(wallet)}
                            deleteWarning="Are you sure you want to delete this wallet? This might affect transaction history but won't delete the transactions themselves."
                            className="opacity-0 group-hover:opacity-100"
                        >
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(wallet)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </EditDeleteButtons>
                    )}
                  </div>
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
        <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
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
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4 py-4">
                <FormField
                  control={addForm.control}
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
                  control={addForm.control}
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Wallet</DialogTitle>
            <DialogDescription>Change the name of your wallet.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
              <FormField
                control={editForm.control}
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
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
