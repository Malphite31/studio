'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { TourGuide } from './tour-guide';
import type { UserProfile } from '@/lib/types';

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: UserProfile | null;
}

export function WelcomeDialog({ open, onOpenChange, userProfile }: WelcomeDialogProps) {
  const [hideWelcome, setHideWelcome] = useState(false);

  const handleClose = () => {
    if (hideWelcome) {
      try {
        localStorage.setItem('hideWelcomeTour', 'true');
      } catch (error) {
        console.error("Could not save preference to localStorage", error);
      }
    }
    onOpenChange(false);
  };
  
  const welcomeMessage = userProfile?.name 
    ? `Welcome, ${userProfile.name}!` 
    : userProfile?.username
    ? `Welcome, ${userProfile.username}!`
    : "Welcome to PennyWise!";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">{welcomeMessage}</DialogTitle>
        </DialogHeader>
        
        <TourGuide />
        
        <DialogFooter className="sm:justify-between items-center pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="hide-welcome" checked={hideWelcome} onCheckedChange={(checked) => setHideWelcome(checked as boolean)} />
            <Label htmlFor="hide-welcome" className="text-sm font-normal">Don't show this again</Label>
          </div>
          <Button onClick={handleClose}>Get Started</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
