'use client';
import { useState, useMemo } from 'react';
import { useUser, useAuth, useFirestore, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { UserProfile } from '@/lib/types';


const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
});

export default function ProfilePage() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [isCropModalOpen, setCropModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      username: userProfile?.username || '',
    },
  });

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
      setCropModalOpen(true);
    }
  };

  const handleCrop = async () => {
    if (!completedCrop || !imgSrc || !user) return;

    setIsUploading(true);
    const croppedImage = await getCroppedImg(imgSrc, completedCrop, 'new-file.jpeg');
    const storage = getStorage();
    const storageRef = ref(storage, `profile-pictures/${user.uid}`);
    
    try {
      await uploadString(storageRef, croppedImage, 'data_url');
      const downloadURL = await getDownloadURL(storageRef);
      
      if (userProfileRef) {
          setDocumentNonBlocking(userProfileRef, { profilePicture: downloadURL }, { merge: true });
      }
      
      toast({ title: 'Success', description: 'Profile picture updated!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
      setIsUploading(false);
      setCropModalOpen(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    if (!user || !userProfileRef) return;
    
    try {
        await setDocumentNonBlocking(userProfileRef, { username: data.username }, { merge: true });
        if(auth.currentUser && auth.currentUser.displayName !== data.username) {
            await updateProfile(auth.currentUser, { displayName: data.username });
        }
        toast({ title: 'Success', description: 'Profile updated!' });
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
            <CardDescription>Manage your account settings and profile picture.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userProfile?.profilePicture} />
                <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <Input type="file" accept="image/*" onChange={onFileChange} />
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
                <Button type="submit">Save Changes</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crop your new profile picture</DialogTitle>
          </DialogHeader>
          {imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              onComplete={c => setCompletedCrop(c)}
              aspect={1}
              circularCrop
            >
              <img src={imgSrc} alt="Crop preview" />
            </ReactCrop>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCropModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCrop} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Save Picture'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getCroppedImg(imageSrc: string, crop: Crop, fileName: string): Promise<string> {
    return new Promise((resolve) => {
        const image = new Image();
        image.src = imageSrc;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;
            canvas.width = crop.width;
            canvas.height = crop.height;
            const ctx = canvas.getContext('2d');
            if(!ctx || !crop.x || !crop.y || !crop.width || !crop.height) return;

            ctx.drawImage(
                image,
                crop.x * scaleX,
                crop.y * scaleY,
                crop.width * scaleX,
                crop.height * scaleY,
                0,
                0,
                crop.width,
                crop.height
            );

            resolve(canvas.toDataURL('image/jpeg'));
        };
    });
}
