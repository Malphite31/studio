'use client';

import { useState, useMemo } from 'react';
import type { Expense as ExpenseType, BudgetGoal, Category, WishlistItem as WishlistItemType, Iou as IouType } from '@/lib/types';
import DashboardHeader from '@/components/dashboard-header';
import RecentExpenses from '@/components/recent-expenses';
import SpendingBreakdown from '@/components/spending-breakdown';
import BudgetStatus from '@/components/budget-status';
import { Toaster } from '@/components/ui/toaster';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Wishlist from '@/components/wishlist';
import DebtTracker from '@/components/debt-tracker';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import Login from '@/components/login';


export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const expensesQuery = useMemoFirebase(() => 
    user ? collection(firestore, 'users', user.uid, 'expenses') : null, 
    [user, firestore]
  );
  const { data: expenses, isLoading: expensesLoading } = useCollection<ExpenseType>(expensesQuery);

  const budgetGoalsQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'budgets') : null,
    [user, firestore]
  );
  const { data: budgetGoalsData, isLoading: budgetsLoading } = useCollection<BudgetGoal>(budgetGoalsQuery);

  const wishlistQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'wishlist') : null,
    [user, firestore]
  );
  const { data: wishlistItems, isLoading: wishlistLoading } = useCollection<WishlistItemType>(wishlistQuery);
  
  const iousQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'ious') : null,
    [user, firestore]
  );
  const { data: ious, isLoading: iousLoading } = useCollection<IouType>(iousQuery);


  const budgetGoals: BudgetGoal[] = useMemo(() => {
    return budgetGoalsData?.map(goal => ({
      id: goal.id,
      category: goal.category,
      amount: goal.amount,
      userId: user!.uid,
    })) || [];
  }, [budgetGoalsData, user]);

  const addExpense = (expense: Omit<ExpenseType, 'id' | 'date' | 'userId'>) => {
    if (!user || !expensesQuery) return;
    const newExpense = {
      ...expense,
      date: serverTimestamp(),
      userId: user.uid,
    };
    addDocumentNonBlocking(expensesQuery, newExpense);
  };
  
  const addIou = (iou: Omit<IouType, 'id' | 'paid' | 'userId'>) => {
    if (!user || !iousQuery) return;
    const newIou: Omit<IouType, 'id'> = {
      ...iou,
      paid: false,
      userId: user.uid,
    };
    addDocumentNonBlocking(iousQuery, newIou);
  };

  const updateBudgets = (updatedGoals: Record<Category, number>) => {
    if (!user) return;
    Object.entries(updatedGoals).forEach(([category, amount]) => {
      const budgetDocRef = doc(firestore, 'users', user.uid, 'budgets', category);
      setDocumentNonBlocking(budgetDocRef, { category, amount, userId: user.uid }, { merge: true });
    });
  };
  
  const addWishlistItem = (item: Omit<WishlistItemType, 'id' | 'savedAmount' | 'userId'>) => {
    if (!user || !wishlistQuery) return;
    const newWishlistItem: Omit<WishlistItemType, 'id'> = {
      ...item,
      savedAmount: 0,
      userId: user.uid,
    };
    addDocumentNonBlocking(wishlistQuery, newWishlistItem);
  };

  const contributeToWishlist = (id: string, amount: number, currentSaved: number, targetAmount: number) => {
    if (!user) return;
    const wishlistItemRef = doc(firestore, 'users', user.uid, 'wishlist', id);
    const newSavedAmount = Math.min(currentSaved + amount, targetAmount);
    setDocumentNonBlocking(wishlistItemRef, { savedAmount: newSavedAmount }, { merge: true });
  };
  
  const markIouAsPaid = (id: string) => {
    if (!user) return;
    const iouDocRef = doc(firestore, 'users', user.uid, 'ious', id);
    setDocumentNonBlocking(iouDocRef, { paid: true }, { merge: true });
  }

  if (isUserLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <DashboardHeader
        addExpense={addExpense}
        addIou={addIou}
        budgetGoals={budgetGoals}
        updateBudgets={updateBudgets}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Tabs defaultValue="dashboard">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="wishlist">Wish List</TabsTrigger>
            <TabsTrigger value="debts">Debts</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
             <div className="grid gap-4 md:gap-8 mt-4">
                <SpendingBreakdown expenses={expenses || []} />
                <BudgetStatus expenses={expenses || []} budgetGoals={budgetGoals || []} />
                <RecentExpenses expenses={expenses || []} />
             </div>
          </TabsContent>
          <TabsContent value="wishlist">
            <Wishlist 
              items={wishlistItems || []}
              addWishlistItem={addWishlistItem}
              contributeToWishlist={contributeToWishlist}
            />
          </TabsContent>
          <TabsContent value="debts">
            <DebtTracker ious={ious || []} markAsPaid={markIouAsPaid} />
          </TabsContent>
        </Tabs>
      </main>
      <Toaster />
    </div>
  );
}
