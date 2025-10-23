'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Expense as ExpenseType, BudgetGoal, Category, WishlistItem as WishlistItemType, Iou as IouType, Income as IncomeType } from '@/lib/types';
import DashboardHeader from '@/components/dashboard-header';
import RecentExpenses from '@/components/recent-expenses';
import SpendingBreakdown from '@/components/spending-breakdown';
import BudgetStatus from '@/components/budget-status';
import Wishlist from '@/components/wishlist';
import DebtTracker from '@/components/debt-tracker';
import IncomeTracker from '@/components/income-tracker';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import Login from '@/components/login';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WelcomeDialog } from '@/components/welcome-dialog';
import { ExpenseForm } from '@/components/expense-form';


export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (user && user.metadata.creationTime === user.metadata.lastSignInTime) {
      // It's the user's first sign-in session
      const timer = setTimeout(() => {
        setShowWelcome(true);
      }, 1000); // Delay slightly to not be too abrupt
      return () => clearTimeout(timer);
    }
  }, [user]);

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

  const incomeQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'income') : null,
    [user, firestore]
  );
  const { data: income, isLoading: incomeLoading } = useCollection<IncomeType>(incomeQuery);

  const totalIncome = useMemo(() => 
    income?.reduce((sum, item) => sum + item.amount, 0) || 0, 
    [income]
  );

  const totalExpenses = useMemo(() => 
    expenses?.reduce((sum, item) => sum + item.amount, 0) || 0,
    [expenses]
  );

  const netIouBalance = useMemo(() => {
    return ious?.reduce((sum, iou) => {
      if (iou.paid) return sum;
      return iou.type === 'Borrow' ? sum + iou.amount : sum - iou.amount;
    }, 0) || 0;
  }, [ious]);

  const balance = useMemo(() => totalIncome - totalExpenses + netIouBalance, [totalIncome, totalExpenses, netIouBalance]);


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

  const addIncome = (income: Omit<IncomeType, 'id' | 'date' | 'userId'>) => {
    if (!user || !incomeQuery) return;
    const newIncome = {
      ...income,
      date: serverTimestamp(),
      userId: user.uid,
    };
    addDocumentNonBlocking(incomeQuery, newIncome);
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
    <>
      <WelcomeDialog open={showWelcome} onOpenChange={setShowWelcome} />
      <div className="flex min-h-screen w-full flex-col bg-background">
        <DashboardHeader
          balance={balance}
          addExpense={addExpense}
          addIou={addIou}
          addIncome={addIncome}
          budgetGoals={budgetGoals}
          updateBudgets={updateBudgets}
        />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
              <div className="lg:col-span-2 grid gap-4 md:gap-8">
                <SpendingBreakdown expenses={expenses || []} />
                <BudgetStatus expenses={expenses || []} budgetGoals={budgetGoals || []} />
                <RecentExpenses expenses={expenses || []} />
              </div>

              <div className="grid gap-4 md:gap-8 lg:col-start-3">
                 <Card>
                    <CardHeader>
                      <CardTitle>Income</CardTitle>
                      <CardDescription>Your recent income sources.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <IncomeTracker income={income || []} />
                    </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Wish List</CardTitle>
                    <CardDescription>Your savings goals.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Wishlist
                      items={wishlistItems || []}
                      addWishlistItem={addWishlistItem}
                      contributeToWishlist={contributeToWishlist}
                      addExpense={addExpense}
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Debts & Loans</CardTitle>
                    <CardDescription>Money you owe and money owed to you.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DebtTracker ious={ious || []} markAsPaid={markIouAsPaid} />
                  </CardContent>
                </Card>
              </div>
          </div>
        </main>
        <div className="sm:hidden">
            <ExpenseForm addExpense={addExpense} addIou={addIou} addIncome={addIncome} triggerType="fab" />
        </div>
      </div>
    </>
  );
}
