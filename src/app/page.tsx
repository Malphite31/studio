'use client';

import { useState } from 'react';
import type { Expense, BudgetGoal, Category, WishlistItem, Iou } from '@/lib/types';
import { initialExpenses, initialBudgetGoals, initialWishlistItems, initialIous } from '@/lib/data';
import DashboardHeader from '@/components/dashboard-header';
import RecentExpenses from '@/components/recent-expenses';
import SpendingBreakdown from '@/components/spending-breakdown';
import BudgetStatus from '@/components/budget-status';
import { Toaster } from '@/components/ui/toaster';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Wishlist from '@/components/wishlist';
import DebtTracker from '@/components/debt-tracker';

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [budgetGoals, setBudgetGoals] =
    useState<BudgetGoal[]>(initialBudgetGoals);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(initialWishlistItems);
  const [ious, setIous] = useState<Iou[]>(initialIous);
  const [income, setIncome] = useState(5000);

  const addExpense = (expense: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
      date: new Date(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };
  
  const addIou = (iou: Omit<Iou, 'id' | 'paid'>) => {
    const newIou: Iou = {
      ...iou,
      id: `iou-${Date.now()}`,
      paid: false,
    };
    setIous(prev => [...prev, newIou]);
  };

  const updateBudgets = (updatedGoals: Record<Category, number>) => {
    const newGoals: BudgetGoal[] = Object.entries(updatedGoals).map(
      ([category, amount]) => ({
        category: category as Category,
        amount: amount,
      })
    );
    setBudgetGoals(newGoals);
  };
  
  const addWishlistItem = (item: Omit<WishlistItem, 'id' | 'savedAmount'>) => {
    const newWishlistItem: WishlistItem = {
      ...item,
      id: `wish-${Date.now()}`,
      savedAmount: 0,
    };
    setWishlistItems(prev => [...prev, newWishlistItem]);
  };

  const contributeToWishlist = (id: string, amount: number) => {
    setWishlistItems(prev => prev.map(item => 
      item.id === id ? { ...item, savedAmount: Math.min(item.savedAmount + amount, item.targetAmount) } : item
    ));
  };
  
  const markIouAsPaid = (id: string) => {
    setIous(prev => prev.map(iou => iou.id === id ? { ...iou, paid: true } : iou));
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
                <SpendingBreakdown expenses={expenses} />
                <BudgetStatus expenses={expenses} budgetGoals={budgetGoals} />
                <RecentExpenses expenses={expenses} />
             </div>
          </TabsContent>
          <TabsContent value="wishlist">
            <Wishlist 
              items={wishlistItems}
              addWishlistItem={addWishlistItem}
              contributeToWishlist={contributeToWishlist}
            />
          </TabsContent>
          <TabsContent value="debts">
            <DebtTracker ious={ious} markAsPaid={markIouAsPaid} />
          </TabsContent>
        </Tabs>
      </main>
      <Toaster />
    </div>
  );
}
