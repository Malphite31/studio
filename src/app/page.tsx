'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Expense as ExpenseType, BudgetGoal, Category, WishlistItem as WishlistItemType, Iou as IouType, Income as IncomeType, EWallet } from '@/lib/types';
import DashboardHeader from '@/components/dashboard-header';
import RecentExpenses from '@/components/recent-expenses';
import SpendingBreakdown from '@/components/spending-breakdown';
import BudgetStatus from '@/components/budget-status';
import Wishlist from '@/components/wishlist';
import DebtTracker from '@/components/debt-tracker';
import IncomeTracker from '@/components/income-tracker';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, query, where, runTransaction, writeBatch } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import Login from '@/components/login';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WelcomeDialog } from '@/components/welcome-dialog';
import { ExpenseForm } from '@/components/expense-form';
import EWallets from '@/components/e-wallets';
import { useToast } from '@/hooks/use-toast';


export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [showWelcome, setShowWelcome] = useState(false);
  const { toast } = useToast();

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
    user ? query(collection(firestore, 'users', user.uid, 'wishlist'), where('purchased', '!=', true)) : null,
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

  const walletsQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'wallets') : null,
    [user, firestore]
  );
  const { data: wallets, isLoading: walletsLoading } = useCollection<EWallet>(walletsQuery);


  const balance = useMemo(() => {
    const walletTotal = wallets?.reduce((sum, wallet) => sum + wallet.balance, 0) || 0;
    const borrowedTotal = ious?.filter(iou => iou.type === 'Borrow' && !iou.paid).reduce((sum, iou) => sum + iou.amount, 0) || 0;
    return walletTotal + borrowedTotal;
  }, [wallets, ious]);


  const budgetGoals: BudgetGoal[] = useMemo(() => {
    return budgetGoalsData?.map(goal => ({
      id: goal.id,
      category: goal.category,
      amount: goal.amount,
      userId: user!.uid,
    })) || [];
  }, [budgetGoalsData, user]);

  const addExpense = async (expense: Omit<ExpenseType, 'id' | 'date' | 'userId'>) => {
    if (!user || !expensesQuery || !expense.walletId) return;

    try {
        await runTransaction(firestore, async (transaction) => {
            const walletRef = doc(firestore, 'users', user.uid, 'wallets', expense.walletId!);
            const walletDoc = await transaction.get(walletRef);
            if (!walletDoc.exists()) {
                throw new Error("Wallet not found!");
            }

            const newBalance = walletDoc.data().balance - expense.amount;
            transaction.update(walletRef, { balance: newBalance });

            const newExpenseRef = doc(collection(firestore, 'users', user.uid, 'expenses'));
            const newExpenseData = {
                ...expense,
                date: serverTimestamp(),
                userId: user.uid,
            };
            transaction.set(newExpenseRef, newExpenseData);
        });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error adding expense', description: e.message });
    }
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

  const addIncome = async (incomeData: Omit<IncomeType, 'id' | 'date' | 'userId'>) => {
    if (!user || !incomeData.walletId) return;

    try {
        await runTransaction(firestore, async (transaction) => {
            const walletRef = doc(firestore, 'users', user.uid, 'wallets', incomeData.walletId!);
            const walletDoc = await transaction.get(walletRef);

            if (!walletDoc.exists()) {
                throw new Error("Wallet not found!");
            }

            const newBalance = walletDoc.data().balance + incomeData.amount;
            transaction.update(walletRef, { balance: newBalance });
            
            const newIncomeRef = doc(collection(firestore, 'users', user.uid, 'income'));
            const newIncomeData = {
                ...incomeData,
                date: serverTimestamp(),
                userId: user.uid,
            };
            transaction.set(newIncomeRef, newIncomeData);
        });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error adding income', description: e.message });
    }
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
      purchased: false,
    };
    addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'wishlist'), newWishlistItem);
  };

  const contributeToWishlist = (item: WishlistItemType, amount: number, walletId: string) => {
    if (!user) return;
    const { id, savedAmount, targetAmount, name } = item;
    
    const newSavedAmount = Math.min(savedAmount + amount, targetAmount);

    // This is now an atomic operation
    runTransaction(firestore, async (transaction) => {
        // 1. Get wallet and calculate new balance
        const walletRef = doc(firestore, 'users', user.uid, 'wallets', walletId);
        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists()) throw new Error("Wallet not found");
        const newWalletBalance = walletDoc.data().balance - amount;
        
        // 2. Create the corresponding expense
        const newExpenseRef = doc(collection(firestore, 'users', user.uid, 'expenses'));
        const newExpense = {
          name: `Contribution to: ${name}`,
          amount: amount,
          category: 'Other' as Category,
          date: serverTimestamp(),
          userId: user.uid,
          walletId: walletId
        };

        // 3. Update wallet, wishlist item, and add expense
        transaction.update(walletRef, { balance: newWalletBalance });
        const wishlistItemRef = doc(firestore, 'users', user.uid, 'wishlist', id);
        transaction.set(wishlistItemRef, { savedAmount: newSavedAmount }, { merge: true });
        transaction.set(newExpenseRef, newExpense);
    }).catch(error => {
        toast({variant: 'destructive', title: 'Contribution failed', description: error.message});
    });
  };
  
  const markIouAsPaid = (id: string) => {
    if (!user) return;
    const iouDocRef = doc(firestore, 'users', user.uid, 'ious', id);
    setDocumentNonBlocking(iouDocRef, { paid: true }, { merge: true });
  }

  const purchaseWishlistItem = (item: WishlistItemType) => {
    if(!user || !item.id) return;

    // The full amount is already accounted for via contributions.
    // We just need to mark the item as purchased.
    const difference = item.targetAmount - item.savedAmount;
    
    // We only create a final expense if there's a difference.
    // This assumes contributions already created expenses.
    if (difference > 0) {
      addExpense({
        name: `Final payment for ${item.name}`,
        amount: difference,
        category: 'Other',
        // A wallet needs to be selected for this final payment.
        // This is a UX issue to solve. For now, we can leave it blank
        // or prompt the user. Let's assume no wallet for now.
      });
    }

    // Mark the wishlist item as purchased
    const wishlistItemRef = doc(firestore, 'users', user.uid, 'wishlist', item.id);
    setDocumentNonBlocking(wishlistItemRef, { purchased: true, savedAmount: item.targetAmount }, { merge: true });
  }

  const addWallet = async (name: string, balance: number) => {
    if (!user || !walletsQuery) return;
    const newWallet = {
        name,
        balance,
        userId: user.uid,
    };
    await addDocumentNonBlocking(walletsQuery, newWallet);
    toast({ title: 'E-Wallet Added!', description: `${name} has been added with a balance of ₱${balance}.`});
  };

  const updateExpense = async (expenseId: string, oldAmount: number, updatedData: Partial<ExpenseType>) => {
    if (!user) return;

    const expenseRef = doc(firestore, 'users', user.uid, 'expenses', expenseId);
    
    try {
        await runTransaction(firestore, async (transaction) => {
            const expenseDoc = await transaction.get(expenseRef);
            if (!expenseDoc.exists()) {
                throw new Error("Expense not found!");
            }
            
            const currentExpenseData = expenseDoc.data() as ExpenseType;
            const walletId = updatedData.walletId || currentExpenseData.walletId;

            if (!walletId) {
                 throw new Error("Wallet ID is missing for this transaction.");
            }
            
            const walletRef = doc(firestore, 'users', user.uid, 'wallets', walletId);
            const walletDoc = await transaction.get(walletRef);
            if (!walletDoc.exists()) {
                throw new Error("Wallet not found!");
            }

            const amountDifference = (updatedData.amount ?? oldAmount) - oldAmount;
            
            // Revert old amount and apply new amount if wallet is changed
            if (updatedData.walletId && updatedData.walletId !== currentExpenseData.walletId) {
                const oldWalletRef = doc(firestore, 'users', user.uid, 'wallets', currentExpenseData.walletId!);
                const oldWalletDoc = await transaction.get(oldWalletRef);
                if (!oldWalletDoc.exists()) throw new Error("Old wallet not found!");

                transaction.update(oldWalletRef, { balance: oldWalletDoc.data().balance + oldAmount });
                transaction.update(walletRef, { balance: walletDoc.data().balance - (updatedData.amount ?? oldAmount) });
            } else {
                // Just adjust balance for amount change
                const newBalance = walletDoc.data().balance - amountDifference;
                transaction.update(walletRef, { balance: newBalance });
            }

            transaction.update(expenseRef, updatedData);
        });
        toast({ title: 'Expense Updated', description: 'Your transaction has been successfully updated.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update failed', description: error.message });
    }
  };


  if (isUserLoading || walletsLoading) {
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
          budgetGoals={budgetGoals || []}
          updateBudgets={updateBudgets}
          wallets={wallets || []}
        />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
              <div className="lg:col-span-2 grid gap-4 md:gap-8">
                <SpendingBreakdown expenses={expenses || []} />
                <BudgetStatus expenses={expenses || []} budgetGoals={budgetGoals || []} />
                <RecentExpenses expenses={expenses || []} onUpdateExpense={updateExpense} wallets={wallets || []} />
              </div>

              <div className="grid gap-4 md:gap-8 lg:col-start-3">
                 <EWallets wallets={wallets || []} addWallet={addWallet} />
                 
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
                      purchaseWishlistItem={purchaseWishlistItem}
                      wallets={wallets || []}
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
            <ExpenseForm addExpense={addExpense} addIou={addIou} addIncome={addIncome} triggerType="fab" wallets={wallets || []} />
        </div>
      </div>
    </>
  );
}
