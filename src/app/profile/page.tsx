'use client';
import { useState, useMemo, useRef } from 'react';
import { useUser, useAuth, useFirestore, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, serverTimestamp, collection, getDocs, writeBatch } from 'firebase/firestore';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, type UploadTaskSnapshot } from 'firebase/storage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import Link from 'next/link';
import { ArrowLeft, UploadCloud } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ConfirmationDialog } from '@/components/confirmation-dialog';


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

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
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

  const handleFileSelect = (file: File) => {
    if (!user) return;
    if (file && file.type.startsWith('image/')) {
        handleDirectUpload(file);
    } else {
        toast({ variant: 'destructive', title: 'Invalid file type', description: 'Please select an image file.' });
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };
  
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };


  const handleDirectUpload = (file: File) => {
    if (!user) return;
  
    setIsUploading(true);
    setUploadProgress(0);
  
    const storage = getStorage();
    const storageRef = ref(storage, `profile-pictures/${user.uid}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
        (snapshot: UploadTaskSnapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
        },
        (error) => {
            console.error("Upload failed:", error);
            toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
            setIsUploading(false);
        },
        () => {
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                if (userProfileRef) {
                    setDocumentNonBlocking(userProfileRef, { profilePicture: downloadURL }, { merge: true });
                }
                toast({ title: 'Success', description: 'Profile picture updated!' });
                setIsUploading(false);
            });
        }
    );
  };

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
  

  if (isProfileLoading) return <div>Loading profile...</div>

  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-background p-4 md:p-8">
        <div className='mb-4'>
            <Button asChild variant="outline">
                <Link href="/"><ArrowLeft className='mr-2' /> Back to Dashboard</Link>
            </Button>
        </div>
        <div className='grid gap-8'>
            <Card>
            <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>Manage your account settings, profile picture and bio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div 
                className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    "hover:border-primary hover:bg-accent/10",
                    isDragging ? "border-primary bg-accent/10" : "border-input"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                >
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={userProfile?.profilePicture} />
                        <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {isUploading ? (
                         <div className="w-full max-w-xs text-center relative mt-2">
                            <Progress value={uploadProgress} className="w-full" />
                            <p className="text-sm absolute w-full top-0">{Math.round(uploadProgress)}%</p>
                        </div>
                    ) : (
                        <div className='flex flex-col items-center gap-1'>
                            <UploadCloud className="w-8 h-8 text-muted-foreground" />
                            <p className='font-semibold'>Drag & drop or click to upload</p>
                            <p className='text-sm text-muted-foreground'>A new profile picture will be uploaded directly.</p>
                        </div>
                    )}
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
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                     <Button variant="outline" onClick={handleExport}>Export My Data</Button>
                     <Button variant="outline" onClick={() => importFileInputRef.current?.click()}>Import Data</Button>
                     <Button variant="destructive" onClick={() => setResetConfirmOpen(true)}>Reset Data</Button>
                     <input
                        type="file"
                        ref={importFileInputRef}
                        className="hidden"
                        accept="application/json"
                        onChange={handleImportFileSelect}
                    />
                </CardContent>
                 <CardFooter>
                    <p className='text-xs text-muted-foreground'>
                        <strong>Warning:</strong> Importing or resetting data will permanently overwrite or delete all current financial data in your account. Your user profile will not be affected.
                    </p>
                </CardFooter>
            </Card>

        </div>
      </div>

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
