'use client';

import { CircleUser, Coins, Menu, Settings, LogOut, User as UserIcon, Wallet } from 'lucide-react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
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
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { useMemoFirebase } from '@/firebase/provider';
import { cn } from '@/lib/utils';
import { CASH_ON_HAND_WALLET } from '@/lib/data';

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

  const allWallets = [CASH_ON_HAND_WALLET, ...wallets];

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-30">
        <div className="flex items-center gap-2 font-semibold">
          <Coins className="h-6 w-6 text-primary" />
          <span className="">SpendWise</span>
        </div>

        <div className="flex items-center gap-4 ml-auto">
            <div className="hidden sm:flex items-center gap-2 border-r pr-4">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-col text-right">
                    <span className="text-xs text-muted-foreground">Total Balance</span>
                    <span className={cn(
                        "font-semibold text-sm",
                        balance > 0 && "text-green-600",
                        balance < 0 && "text-destructive",
                    )}>
                        {formatCurrency(balance)}
                    </span>
                </div>
            </div>
        
            <div className='hidden sm:flex items-center gap-2'>
                <ThemeSwitcher />
                <BudgetForm budgetGoals={budgetGoals} updateBudgets={updateBudgets} />
                <ExpenseForm addExpense={addExpense} addIou={addIou} addIncome={addIncome} triggerType="button" wallets={allWallets} />
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
                        <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    <div className="flex items-center gap-2 text-lg font-semibold mb-6">
                        <Coins className="h-6 w-6 text-primary" />
                        <span>SpendWise</span>
                    </div>
                    <nav className="grid gap-4 text-lg font-medium">
                        <ThemeSwitcher />
                        <BudgetForm budgetGoals={budgetGoals} updateBudgets={updateBudgets} />
                    </nav>
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
