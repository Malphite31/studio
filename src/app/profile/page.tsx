'use client';
import { useState, useMemo, useRef } from 'react';
import { useUser, useAuth, useFirestore, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, serverTimestamp, collection, getDocs, writeBatch } from 'firebase/firestore';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  bio: z.string().max(160, 'Bio cannot be longer than 160 characters').optional(),
});

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ProfilePage() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [isCropModalOpen, setCropModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isImportConfirmOpen, setImportConfirmOpen] = useState(false);
  const [fileToImport, setFileToImport] = useState<File | null>(null);


  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      username: userProfile?.username || '',
      bio: userProfile?.bio || '',
    },
  });

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
        setCrop(undefined);
        const reader = new FileReader();
        reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
        reader.readAsDataURL(file);
        setCropModalOpen(true);
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


  const handleCrop = async () => {
    if (!completedCrop || !imgRef.current || !user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop, "new-image.jpeg");
      
      const storage = getStorage();
      const storageRef = ref(storage, `profile-pictures/${user.uid}`);
      const uploadTask = uploadBytesResumable(storageRef, croppedImageBlob);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
          setIsUploading(false);
        },
        async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            if (userProfileRef) {
                setDocumentNonBlocking(userProfileRef, { profilePicture: downloadURL }, { merge: true });
            }
            toast({ title: 'Success', description: 'Profile picture updated!' });
            setIsUploading(false);
            setCropModalOpen(false);
        }
      );
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    if (!user || !userProfileRef) return;
    
    try {
        const updateData: Partial<UserProfile> = {};
        if (data.username) updateData.username = data.username;
        if (data.bio) updateData.bio = data.bio;

        await setDocumentNonBlocking(userProfileRef, updateData, { merge: true });
        
        if(auth.currentUser && data.username && auth.currentUser.displayName !== data.username) {
            await updateProfile(auth.currentUser, { displayName: data.username });
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
        a.download = 'spendwise_backup.json';
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
            
            // Define collections to manage
            const collectionsToManage = ['expenses', 'income', 'budgets', 'ious', 'wishlist', 'wallets'];

            // Delete all existing data in managed collections
            for (const collectionName of collectionsToManage) {
                const collectionRef = collection(firestore, 'users', user.uid, collectionName);
                const snapshot = await getDocs(collectionRef);
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
            }
            
            // Import new data from the file
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
  
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }

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
                    "hover:border-primary hover:bg-accent",
                    isDragging ? "border-primary bg-accent" : "border-input"
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
                    <div className='flex flex-col items-center gap-1'>
                        <UploadCloud className="w-8 h-8 text-muted-foreground" />
                        <p className='font-semibold'>Drag & drop or click to upload</p>
                        <p className='text-sm text-muted-foreground'>Recommended size: 400x400px</p>
                    </div>
                </div>
                </div>

                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <CardDescription>Export your financial data or import it from a backup file.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                     <Button variant="outline" onClick={handleExport}>Export My Data</Button>
                     <Button variant="destructive" onClick={() => importFileInputRef.current?.click()}>Import Data</Button>
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
                        <strong>Warning:</strong> Importing data will overwrite all current financial data in your account. Your user profile will not be affected.
                    </p>
                </CardFooter>
            </Card>

        </div>
      </div>

      <Dialog open={isCropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crop your new profile picture</DialogTitle>
          </DialogHeader>
          {imgSrc && (
            <div className='flex justify-center'>
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              onComplete={c => setCompletedCrop(c)}
              aspect={1}
              circularCrop
            >
              <img ref={imgRef} src={imgSrc} alt="Crop preview" style={{ maxHeight: '70vh' }} onLoad={onImageLoad} />
            </ReactCrop>
            </div>
          )}
          <DialogFooter>
            {isUploading ? (
              <div className="w-full">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-center text-sm mt-2">{Math.round(uploadProgress)}%</p>
              </div>
            ) : (
            <>
              <Button variant="outline" onClick={() => setCropModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCrop}>
                Save Picture
              </Button>
            </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmationDialog
        open={isImportConfirmOpen}
        onOpenChange={setImportConfirmOpen}
        title="Are you absolutely sure?"
        description="This action cannot be undone. This will permanently delete all your current financial data and overwrite it with the backup file."
        onConfirm={handleImportConfirm}
        confirmText="Yes, overwrite my data"
      />
    </>
  );
}

function getCroppedImg(image: HTMLImageElement, crop: Crop, fileName: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const cropWidth = crop.width * scaleX;
  const cropHeight = crop.height * scaleY;

  canvas.width = cropWidth;
  canvas.height = cropHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      (blob as any).name = fileName;
      resolve(blob);
    }, 'image/jpeg');
  });
}

    