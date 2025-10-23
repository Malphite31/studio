'use client';
import { useState, useMemo, useRef } from 'react';
import { useUser, useAuth, useFirestore, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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


const profileSchema = z.object({
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
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [isCropModalOpen, setCropModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);


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
      const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);
      if (!croppedImageBlob) {
        throw new Error('Could not crop image.');
      }
      
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

  if (isProfileLoading) return <div>Loading profile...</div>

  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-background p-4 md:p-8">
        <div className='mb-4'>
            <Button asChild variant="outline">
                <Link href="/"><ArrowLeft className='mr-2' /> Back to Dashboard</Link>
            </Button>
        </div>
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
              <img ref={imgRef} src={imgSrc} alt="Crop preview" style={{ maxHeight: '70vh' }} />
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
    </>
  );
}

function getCroppedImg(image: HTMLImageElement, crop: Crop): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const cropWidth = crop.width ?? 0;
    const cropHeight = crop.height ?? 0;
    const cropX = crop.x ?? 0;
    const cropY = crop.y ?? 0;

    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(null);
      return;
    }

    ctx.drawImage(
      image,
      cropX * scaleX,
      cropY * scaleY,
      cropWidth * scaleX,
      cropHeight * scaleY,
      0,
      0,
      cropWidth,
      cropHeight
    );

    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg');
  });
}

    