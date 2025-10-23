'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Gift, Sparkles } from 'lucide-react';

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
} from '@/components/ui/alert-dialog';

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Must be positive.' }),
});

interface WishlistItemProps {
  item: WishlistItemType;
  contributeToWishlist: (id: string, amount: number, currentSaved: number, targetAmount: number) => void;
}

export default function WishlistItem({ item, contributeToWishlist }: WishlistItemProps) {
  const { toast } = useToast();
  const [showCongrats, setShowCongrats] = useState(false);

  const isGoalReached = item.savedAmount >= item.targetAmount;
  const progress = (item.savedAmount / item.targetAmount) * 100;

  useEffect(() => {
    if (isGoalReached) {
      setShowCongrats(true);
    }
  }, [isGoalReached]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: 10 },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    contributeToWishlist(item.id, values.amount, item.savedAmount, item.targetAmount);
    toast({
        title: "Contribution added!",
        description: `You added ₱${values.amount.toFixed(2)} to ${item.name}.`,
    });
    form.reset();
  }

  const handleBuy = () => {
    setShowCongrats(false);
    toast({
        title: "Purchase acknowledged!",
        description: `Enjoy your new ${item.name}! (This is a demo). The item will remain for now.`,
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                {item.name}
              </CardTitle>
              <CardDescription>
                Saved ₱{item.savedAmount.toFixed(2)} of ₱{item.targetAmount.toFixed(2)}
              </CardDescription>
            </div>
            {isGoalReached && <Sparkles className="h-6 w-6 text-yellow-400" />}
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3 mb-4" />
          {!isGoalReached && (
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
      <AlertDialog open={showCongrats} onOpenChange={setShowCongrats}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Congratulations! 🎉</AlertDialogTitle>
            <AlertDialogDescription>
              You've reached your savings goal for the {item.name}! Are you ready to make the purchase?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not Yet</AlertDialogCancel>
            <AlertDialogAction onClick={handleBuy}>Yes, Buy It!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
