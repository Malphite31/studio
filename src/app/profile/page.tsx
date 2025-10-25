'use client';
import { useState, useMemo, useRef } from 'react';
import { useUser, useAuth, useFirestore, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, serverTimestamp, collection, getDocs, writeBatch } from 'firebase/firestore';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import Link from 'next/link';
import { ArrowLeft, User, Download } from 'lucide-react';
import type { UserProfile, ReportData, BudgetGoal } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { addDays, startOfMonth, isWithinInterval } from 'date-fns';
import { CATEGORIES, CASH_ON_HAND_WALLET } from '@/lib/data';
import { useCollection } from '@/firebase/firestore/use-collection';
import { TransactionReportDialog } from '@/components/transaction-report-dialog';
import TransactionReport from '@/components/transaction-report';
import { Timestamp } from 'firebase/firestore';


const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  bio: z.string().max(160, 'Bio cannot be longer than 160 characters').optional(),
});


export default function ProfilePage() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const expensesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'expenses') : null, [user, firestore]);
  const { data: expenses } = useCollection(expensesQuery);
  const incomeQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'income') : null, [user, firestore]);
  const { data: income } = useCollection(incomeQuery);
  const iousQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'ious') : null, [user, firestore]);
  const { data: ious } = useCollection(iousQuery);
  const wishlistQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'wishlist') : null, [user, firestore]);
  const { data: wishlistItems } = useCollection(wishlistQuery);
  const walletsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'wallets') : null, [user, firestore]);
  const { data: wallets } = useCollection(walletsQuery);
  const budgetGoalsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'budgets') : null, [user, firestore]);
  const { data: budgetGoalsData } = useCollection<BudgetGoal>(budgetGoalsQuery);

  const budgetGoals: BudgetGoal[] = useMemo(() => {
    return budgetGoalsData?.map(goal => ({
      id: goal.id,
      category: goal.category,
      amount: goal.amount,
      userId: user!.uid,
    })) || [];
  }, [budgetGoalsData, user]);
  
  const allWallets = useMemo(() => [CASH_ON_HAND_WALLET, ...(wallets || [])], [wallets]);
  
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [isImportConfirmOpen, setImportConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [fileToImport, setFileToImport] = useState<File | null>(null);


  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      name: userProfile?.name || '',
      username: userProfile?.username || '',
      bio: userProfile?.bio || '',
    },
  });

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    if (!user || !userProfileRef) return;
    
    try {
        const updateData: Partial<UserProfile> = {};
        if (data.name) updateData.name = data.name;
        if (data.username) updateData.username = data.username;
        if (data.bio) updateData.bio = data.bio;

        await setDocumentNonBlocking(userProfileRef, updateData, { merge: true });
        
        if(auth.currentUser) {
            const profileUpdates: { displayName?: string } = {};
            if (data.username && auth.currentUser.displayName !== data.username) {
                profileUpdates.displayName = data.username;
            }
            if (Object.keys(profileUpdates).length > 0) {
                 await updateProfile(auth.currentUser, profileUpdates);
            }
        }
        toast({ title: 'Success', description: 'Profile updated!' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };
  
  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'No email address found for this user.' });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({ title: 'Password Reset Email Sent', description: 'Check your inbox for a link to reset your password.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleExport = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to export data.' });
        return;
    }
    toast({ title: 'Exporting...', description: 'Gathering your data. The download will begin shortly.' });

    try {
        const collectionsToExport = ['expenses', 'income', 'budgets', 'ious', 'wishlist', 'wallets'];
        const exportData: Record<string, any[]> = {};

        for (const collectionName of collectionsToExport) {
            const collectionRef = collection(firestore, 'users', user.uid, collectionName);
            const snapshot = await getDocs(collectionRef);
            exportData[collectionName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pennywise_backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({ title: 'Export Complete!', description: 'Your data has been downloaded.' });

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Export Failed', description: error.message });
    }
  };

  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/json') {
      setFileToImport(file);
      setImportConfirmOpen(true);
    } else {
      toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select a valid JSON file.' });
    }
    // Reset file input to allow re-selection of the same file
    if (importFileInputRef.current) {
        importFileInputRef.current.value = '';
    }
  };

  const handleImportConfirm = async () => {
    if (!user || !fileToImport) return;

    setImportConfirmOpen(false);
    toast({ title: 'Importing Data...', description: 'Please do not close this window.' });

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target?.result as string);
            const batch = writeBatch(firestore);
            
            const collectionsToManage = ['expenses', 'income', 'budgets', 'ious', 'wishlist', 'wallets'];

            // First, delete all existing data in a separate batch or before import
            for (const collectionName of collectionsToManage) {
                const collectionRef = collection(firestore, 'users', user.uid, collectionName);
                const snapshot = await getDocs(collectionRef);
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
            }
            
            // Then, add the new data
            for (const collectionName in data) {
                if (collectionsToManage.includes(collectionName)) {
                    const collectionData = data[collectionName];
                    if (Array.isArray(collectionData)) {
                        collectionData.forEach((item: any) => {
                            const { id, ...itemData } = item;
                            const docRef = doc(firestore, 'users', user.uid, collectionName, id);
                            batch.set(docRef, itemData);
                        });
                    }
                }
            }

            await batch.commit();
            toast({ title: 'Import Successful!', description: 'All your financial data has been restored.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Import Failed', description: error.message });
        } finally {
            setFileToImport(null);
        }
    };
    reader.readAsText(fileToImport);
  };
  
  const handleResetDataConfirm = async () => {
    if (!user) return;
    setResetConfirmOpen(false);
    toast({ title: 'Resetting Data...', description: 'Please wait while we clear your financial records.' });

    try {
        const batch = writeBatch(firestore);
        const collectionsToReset = ['expenses', 'income', 'budgets', 'ious', 'wishlist', 'wallets'];

        for (const collectionName of collectionsToReset) {
            const collectionRef = collection(firestore, 'users', user.uid, collectionName);
            const snapshot = await getDocs(collectionRef);
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
        }

        await batch.commit();
        toast({ title: 'Data Reset Successful!', description: 'Your financial data has been cleared.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Reset Failed', description: error.message });
    }
  };

  const handleSeedData = async () => {
    if (!user) return;
    toast({ title: 'Seeding Data...', description: 'Adding sample records for this month.' });

    try {
        const batch = writeBatch(firestore);
        const userId = user.uid;
        const now = new Date();
        const startOfThisMonth = startOfMonth(now);

        // Clear existing data first
        const collectionsToReset = ['expenses', 'income', 'budgets', 'ious', 'wishlist', 'wallets'];
        for (const collectionName of collectionsToReset) {
            const collectionRef = collection(firestore, 'users', userId, collectionName);
            const snapshot = await getDocs(collectionRef);
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
        }
        await batch.commit(); // Commit the deletions before adding new data
        
        const newBatch = writeBatch(firestore); // Start a new batch for additions

        // Sample E-Wallets
        const gcashWalletRef = doc(collection(firestore, 'users', userId, 'wallets'));
        newBatch.set(gcashWalletRef, { name: 'GCash', balance: 1500, userId });
        const paymayaWalletRef = doc(collection(firestore, 'users', userId, 'wallets'));
        newBatch.set(paymayaWalletRef, { name: 'PayMaya', balance: 800, userId });


        // Sample Income
        const incomeData = [
            { name: 'Monthly Salary', amount: 50000, date: addDays(startOfThisMonth, 1), walletId: 'cash' },
            { name: 'Freelance Project', amount: 12000, date: addDays(startOfThisMonth, 10), walletId: gcashWalletRef.id }
        ];
        incomeData.forEach(inc => {
            const incomeRef = doc(collection(firestore, 'users', userId, 'income'));
            newBatch.set(incomeRef, { ...inc, userId });
        });
        
        // Sample Expenses
        const expensesData = [
            { name: 'Weekly Groceries', amount: 3500, category: 'Groceries', date: addDays(startOfThisMonth, 2), walletId: 'cash' },
            { name: 'Train Ticket', amount: 150, category: 'Transport', date: addDays(startOfThisMonth, 3), walletId: 'cash' },
            { name: 'Movie Night', amount: 1200, category: 'Entertainment', date: addDays(startOfThisMonth, 4), walletId: gcashWalletRef.id, paymentMethod: 'GCash' },
            { name: 'Electricity Bill', amount: 2500, category: 'Bills', date: addDays(startOfThisMonth, 5), walletId: 'cash' },
            { name: 'Apartment Rent', amount: 15000, category: 'Housing', date: addDays(startOfThisMonth, 6), walletId: 'cash' },
            { name: 'Internet Bill', amount: 1800, category: 'Utilities', date: addDays(startOfThisMonth, 7), walletId: paymayaWalletRef.id, paymentMethod: 'PayMaya' },
            { name: 'Lunch with friends', amount: 800, category: 'Groceries', date: addDays(startOfThisMonth, 8), walletId: 'cash' },
            { name: 'New T-shirt', amount: 600, category: 'Other', date: addDays(startOfThisMonth, 9), walletId: gcashWalletRef.id, paymentMethod: 'GCash' },
        ];
        expensesData.forEach(exp => {
            const expenseRef = doc(collection(firestore, 'users', userId, 'expenses'));
            newBatch.set(expenseRef, { ...exp, userId, paymentMethod: exp.paymentMethod || CASH_ON_HAND_WALLET.name });
        });

        // Sample IOUs
        const iousData = [
            { name: 'Borrowed for lunch', amount: 500, type: 'Borrow', dueDate: addDays(now, 15), paid: false },
            { name: 'Lent to a colleague', amount: 1000, type: 'Lent', dueDate: addDays(now, 20), paid: true },
            { name: 'Lent to sister', amount: 300, type: 'Lent', dueDate: addDays(now, 25), paid: false },
        ];
        iousData.forEach(iou => {
            const iouRef = doc(collection(firestore, 'users', userId, 'ious'));
            newBatch.set(iouRef, { ...iou, userId });
        });

        // Sample Wishlist Items
        const wishlistData = [
            { name: 'New Headphones', targetAmount: 8000, savedAmount: 1500, purchased: false },
            { name: 'Weekend Trip', targetAmount: 10000, savedAmount: 10000, purchased: false },
        ];
        wishlistData.forEach(wish => {
            const wishRef = doc(collection(firestore, 'users', userId, 'wishlist'));
            newBatch.set(wishRef, { ...wish, userId });
        });
        
        // Sample Budgets for all categories
        const budgetsData = CATEGORIES.map(category => {
            let amount = 2000;
            if (category === 'Groceries') amount = 10000;
            if (category === 'Housing') amount = 15000;
            if (category === 'Utilities') amount = 5000;
            if (category === 'Entertainment') amount = 4000;
            return { category, amount };
        });

        budgetsData.forEach(budget => {
            const budgetRef = doc(firestore, 'users', userId, 'budgets', budget.category);
            newBatch.set(budgetRef, { ...budget, userId });
        });

        await newBatch.commit();
        toast({ title: 'Seeding Complete!', description: 'Your account is now populated with sample data.' });

    } catch (error: any) {
        console.error("Seeding error: ", error);
        toast({ variant: 'destructive', title: 'Seeding Failed', description: error.message });
    }
  };

  const toDate = (date: Date | Timestamp) => (date instanceof Timestamp ? date.toDate() : date);

  const handleGenerateReport = (options: { startDate: Date, endDate: Date, includeIncome: boolean, includeWishlist: boolean, includeBudget: boolean, printAll: boolean }) => {
    const { startDate, endDate, includeIncome, includeWishlist, includeBudget, printAll } = options;

    const dateInterval = { start: startDate, end: endDate };

    const filteredExpenses = printAll ? expenses || [] : expenses?.filter(e => isWithinInterval(toDate(e.date), dateInterval)) || [];
    const filteredIncome = (includeIncome && printAll) ? income || [] : includeIncome ? income?.filter(i => isWithinInterval(toDate(i.date), dateInterval)) : [];
    const filteredWishlist = (includeWishlist && printAll) ? wishlistItems || [] : includeWishlist ? wishlistItems : [];
    const filteredBudgets = includeBudget ? budgetGoals : [];

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = filteredIncome?.reduce((sum, i) => sum + i.amount, 0) || 0;

    setReportData({
        expenses: filteredExpenses,
        income: filteredIncome || [],
        wishlist: filteredWishlist || [],
        budgetGoals: filteredBudgets,
        summary: {
            totalIncome: totalIncome,
            totalExpenses: totalExpenses,
            netBalance: totalIncome - totalExpenses
        },
        dateRange: {
            startDate,
            endDate
        },
        printAll,
    });

    setTimeout(() => window.print(), 500);
  };
  

  if (isProfileLoading) return <div>Loading profile...</div>

  if (window.matchMedia('print').matches && reportData) {
    return (
      <>
        {reportData && userProfile && <TransactionReport reportData={reportData} user={userProfile} wallets={allWallets} />}
      </>
    );
  }

  return (
    <>
      <div className="hidden print:block">
        {reportData && userProfile && <TransactionReport reportData={reportData} user={userProfile} wallets={allWallets} />}
      </div>
      <div className="flex min-h-screen w-full flex-col bg-background p-4 md:p-8 no-print">
        <div className='mb-4'>
            <Button asChild variant="outline">
                <Link href="/"><ArrowLeft className='mr-2' /> Back to Dashboard</Link>
            </Button>
        </div>
        <div className='grid gap-8'>
            <Card>
            <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>Manage your account settings and personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <Avatar className="h-24 w-24">
                        <AvatarFallback>
                            <User className="h-12 w-12 text-muted-foreground" />
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-2xl font-bold">{userProfile?.name || userProfile?.username}</h2>
                        <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                </div>

                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                            <Input placeholder="Your username" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <Input value={user?.email || ''} disabled />
                    </FormItem>
                    <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Tell us a little about yourself" className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit">Save Changes</Button>
                </form>
                </Form>

                <Separator />

                <div>
                    <h3 className="text-lg font-medium">Security</h3>
                    <p className="text-sm text-muted-foreground">Manage your password.</p>
                    <Button variant="outline" className="mt-4" onClick={handlePasswordReset}>
                        Send Password Reset Email
                    </Button>
                </div>

            </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                    <CardDescription>Export, import, or reset your financial data.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                     <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export My Data</Button>
                     <Button variant="outline" onClick={() => importFileInputRef.current?.click()}>Import Data</Button>
                     <Button variant="secondary" onClick={handleSeedData}>Seed Dummy Data</Button>
                     <Button variant="destructive" onClick={() => setResetConfirmOpen(true)}>Reset Data</Button>
                     <input
                        type="file"
                        ref={importFileInputRef}
                        className="hidden"
                        accept="application/json"
                        onChange={handleImportFileSelect}
                    />
                </CardContent>
                <CardFooter className='flex-col gap-y-4 items-start'>
                     <Button variant="outline" onClick={() => setIsReportDialogOpen(true)}>
                        Download Report
                    </Button>
                    <p className='text-xs text-muted-foreground'>
                        <strong>Warning:</strong> Importing or resetting data will permanently overwrite or delete all current financial data in your account. Your user profile will not be affected.
                    </p>
                </CardFooter>
            </Card>

        </div>
      </div>

      <TransactionReportDialog
        open={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        onGenerate={handleGenerateReport}
      />

      <ConfirmationDialog
        open={isImportConfirmOpen}
        onOpenChange={setImportConfirmOpen}
        title="Are you absolutely sure?"
        description="This action cannot be undone. This will permanently delete all your current financial data and overwrite it with the backup file."
        onConfirm={handleImportConfirm}
        confirmText="Yes, overwrite my data"
      />
       <ConfirmationDialog
        open={isResetConfirmOpen}
        onOpenChange={setResetConfirmOpen}
        title="Are you sure you want to reset everything?"
        description="This action is permanent and cannot be undone. All your expenses, income, budgets, and other financial records will be deleted forever."
        onConfirm={handleResetDataConfirm}
        confirmText="Yes, Reset My Data"
      />
    </>
  );
}
