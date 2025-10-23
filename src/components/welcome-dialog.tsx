'use client';

import { Coins } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WelcomeDialog({ open, onOpenChange }: WelcomeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <Coins className="h-16 w-16 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">Welcome to SpendWise!</DialogTitle>
          <DialogDescription className="text-center pt-2">
            We're excited to help you take control of your finances.
            Start by adding your first transaction, setting a budget, or creating a savings goal.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='sm:justify-center'>
          <Button onClick={() => onOpenChange(false)}>Let's Get Started!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
