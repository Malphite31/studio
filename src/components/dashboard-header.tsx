'use client';

import { CircleUser, Coins, Menu, Settings, LogOut, User as UserIcon, Wallet } from 'lucide-react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ExpenseForm } from './expense-form';
import { BudgetForm } from './budget-form';
import { ThemeSwitcher } from './theme-switcher';
import type { Expense, BudgetGoal, Category, Iou, UserProfile, Income, EWallet } from '@/lib/types';
import { useUser, useAuth, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';


interface DashboardHeaderProps {
  balance: number;
  addExpense: (expense: Omit<Expense, 'id' | 'date' | 'userId'>) => void;
  addIou: (iou: Omit<Iou, 'id' | 'paid' | 'userId'>) => void;
  addIncome: (income: Omit<Income, 'id' | 'date' | 'userId'>) => void;
  budgetGoals: BudgetGoal[];
  updateBudgets: (updatedGoals: Record<Category, number>) => void;
  wallets: EWallet[];
}

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(amount).replace('PHP', '₱');


export default function DashboardHeader({
  balance,
  addExpense,
  addIou,
  addIncome,
  budgetGoals,
  updateBudgets,
  wallets
}: DashboardHeaderProps) {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 z-30">
        <div className="flex items-center gap-4 font-semibold">
          <Coins className="h-6 w-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full p-0.5" />
          <span className='bg-gradient-to-r from-yellow-300 via-orange-400 to-purple-500 text-transparent bg-clip-text font-bold text-lg'>PennyWise</span>
           {(userProfile?.name || userProfile?.username) && (
              <div className='hidden md:block'>
                  <span className='text-muted-foreground font-normal'>|</span>
                  <span className='ml-4 font-normal'>Welcome back, {userProfile.name || userProfile.username}!</span>
              </div>
          )}
        </div>

        <div className="flex items-center gap-4 ml-auto">
            <div className="hidden sm:flex items-center gap-2 border-r border-border/40 pr-4">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-col text-right">
                    <span className="text-xs text-muted-foreground">Total Balance</span>
                    <span className={cn(
                        "font-semibold text-sm",
                        balance > 0 && "text-green-500",
                        balance < 0 && "text-red-500",
                    )}>
                        {formatCurrency(balance)}
                    </span>
                </div>
            </div>
        
            <div className='hidden sm:flex items-center gap-2'>
                <ThemeSwitcher />
                <BudgetForm budgetGoals={budgetGoals} updateBudgets={updateBudgets} />
                <ExpenseForm addExpense={addExpense} addIou={addIou} addIncome={addIncome} triggerType="button" wallets={wallets} />
            </div>
            
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="sm:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left">
                    <SheetHeader>
                         <SheetTitle className="flex items-center gap-2 text-lg font-semibold mb-2">
                            <Coins className="h-6 w-6 text-primary" />
                            <span className='bg-gradient-to-r from-yellow-300 via-orange-400 to-purple-500 text-transparent bg-clip-text font-bold text-lg'>PennyWise</span>
                        </SheetTitle>
                        <SheetDescription>
                            Your personal finance dashboard.
                        </SheetDescription>
                    </SheetHeader>
                    
                    <div className="flex flex-col gap-4 py-8">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className='flex flex-col'>
                            <span className="text-sm text-muted-foreground">Total Balance</span>
                              <span className={cn(
                                "font-semibold text-lg",
                                balance > 0 && "text-green-500",
                                balance < 0 && "text-red-500",
                            )}>
                                {formatCurrency(balance)}
                            </span>
                          </div>
                          <Wallet className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <ExpenseForm addExpense={addExpense} addIou={addIou} addIncome={addIncome} triggerType="button" wallets={wallets} />
                      <BudgetForm budgetGoals={budgetGoals} updateBudgets={updateBudgets} />
                    </div>

                    <SheetFooter className="absolute bottom-6 right-6 left-6">
                        <ThemeSwitcher />
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                        <Avatar>
                            <AvatarImage src={userProfile?.profilePicture || undefined} alt="@shadcn" />
                            <AvatarFallback>
                                {user?.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <span className="sr-only">Toggle user menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile"><UserIcon className="mr-2 h-4 w-4" />Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Support</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </header>
  );
}
