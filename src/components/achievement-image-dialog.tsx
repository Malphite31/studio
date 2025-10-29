'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from './ui/skeleton';
import { Download, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface AchievementImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageData: {
    imageUrl: string;
    achievementTitle: string;
  } | null;
  isGenerating: boolean;
}

export function AchievementImageDialog({ open, onOpenChange, imageData, isGenerating }: AchievementImageDialogProps) {

  const handleDownload = () => {
    if (imageData) {
        const link = document.createElement('a');
        link.href = imageData.imageUrl;
        link.download = `pennywise-achievement-${imageData.achievementTitle.toLowerCase().replace(/\s/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isGenerating ? "Generating Your Image..." : "Achievement Unlocked!"}</DialogTitle>
          <DialogDescription>
            {isGenerating ? "Hold on while we create your unique achievement image." : "Share your accomplishment with the world!"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="aspect-square w-full rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
            {isGenerating ? (
                <div className='flex flex-col items-center gap-4 text-muted-foreground'>
                    <Loader2 className="h-12 w-12 animate-spin" />
                    <p>Creating masterpiece...</p>
                </div>
            ) : imageData ? (
                <Image 
                    src={imageData.imageUrl} 
                    alt={`Generated image for ${imageData.achievementTitle}`} 
                    width={512}
                    height={512}
                    className="object-contain"
                />
            ) : (
                 <Skeleton className="h-full w-full" />
            )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleDownload} disabled={isGenerating || !imageData}>
            <Download className='mr-2 h-4 w-4' />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
