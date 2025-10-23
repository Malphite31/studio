'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Gift, Sparkles, ShoppingCart } from 'lucide-react';

import type { WishlistItem as WishlistItemType, EWallet } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CASH_ON_HAND_WALLET } from '@/lib/data';

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Must be positive.' }),
  walletId: z.string({ required_error: 'Please select a wallet.' }),
});

interface WishlistItemProps {
  item: WishlistItemType;
  contributeToWishlist: (item: WishlistItemType, amount: number, walletId: string) => void;
  purchaseWishlistItem: (item: WishlistItemType) => void;
  wallets: EWallet[];
}

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(amount).replace('PHP', '₱');


export default function WishlistItem({ item, contributeToWishlist, purchaseWishlistItem, wallets }: WishlistItemProps) {
  const { toast } = useToast();
  
  const isGoalReached = item.savedAmount >= item.targetAmount;
  const progress = (item.savedAmount / item.targetAmount) * 100;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
        amount: 10,
        walletId: wallets.length > 0 ? wallets[0].id : undefined
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const amountToContribute = values.amount;
    const selectedWallet = wallets.find(w => w.id === values.walletId);
    const availableBalance = selectedWallet?.balance ?? 0;
    
    if (values.walletId !== CASH_ON_HAND_WALLET.id && amountToContribute > availableBalance) {
        toast({
            variant: 'destructive',
            title: "Insufficient funds!",
            description: `Your balance in ${selectedWallet?.name} is not enough for this contribution.`
        })
        return;
    }
    
    contributeToWishlist(item, amountToContribute, values.walletId);
    toast({
        title: "Contribution added!",
        description: `You added ${formatCurrency(amountToContribute)} to ${item.name}.`,
    });
    form.reset({ amount: 10, walletId: form.getValues('walletId')});
  }

  const handleBuy = () => {
    purchaseWishlistItem(item);
    toast({
        title: "Item Purchased!",
        description: `Enjoy your new ${item.name}! Your final expense has been recorded.`,
    })
  }

  return (
    <AlertDialog>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                {item.name}
              </CardTitle>
              <CardDescription>
                Saved {formatCurrency(item.savedAmount)} of {formatCurrency(item.targetAmount)}
              </CardDescription>
            </div>
            {isGoalReached && <Sparkles className="h-6 w-6 text-yellow-400" />}
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3 mb-4" />
          {isGoalReached ? (
             <AlertDialogTrigger asChild>
                <Button className="w-full">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Buy Now
                </Button>
            </AlertDialogTrigger>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className='flex items-start gap-2'>
                    <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem className="flex-grow">
                        <FormControl>
                            <Input type="number" step="1" placeholder="Amount" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                    />
                     <FormField
                        control={form.control}
                        name="walletId"
                        render={({ field }) => (
                            <FormItem className='flex-grow'>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Wallet" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {wallets.map((wallet) => (
                                        <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                <Button type="submit" className="w-full">Contribute</Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark "{item.name}" as purchased and record a final expense if there's a remaining balance. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Decide Later</AlertDialogCancel>
          <AlertDialogAction onClick={handleBuy}>Yes, Buy It Now</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
