'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Gift, Sparkles, ShoppingCart } from 'lucide-react';

import type { WishlistItem as WishlistItemType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
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

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Must be positive.' }),
});

interface WishlistItemProps {
  item: WishlistItemType;
  contributeToWishlist: (id: string, amount: number, currentSaved: number, targetAmount: number) => void;
  purchaseWishlistItem: (item: WishlistItemType) => void;
}

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(amount).replace('PHP', '₱');


export default function WishlistItem({ item, contributeToWishlist, purchaseWishlistItem }: WishlistItemProps) {
  const { toast } = useToast();
  
  const isGoalReached = item.savedAmount >= item.targetAmount;
  const progress = (item.savedAmount / item.targetAmount) * 100;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: 10 },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    contributeToWishlist(item.id, values.amount, item.savedAmount, item.targetAmount);
    toast({
        title: "Contribution added!",
        description: `You added ${formatCurrency(values.amount)} to ${item.name}.`,
    });
    form.reset();
  }

  const handleBuy = () => {
    purchaseWishlistItem(item);
    toast({
        title: "Item Purchased!",
        description: `Enjoy your new ${item.name}! An expense has been recorded, and your balance is updated.`,
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
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
                <Button type="submit">Contribute</Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
          <AlertDialogDescription>
            This will record the purchase of your {item.name} for {formatCurrency(item.targetAmount)}. This action will create a new expense and remove the item from your wishlist. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleBuy}>Yes, Buy It</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
