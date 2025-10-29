'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import TransactionReport from './transaction-report';
import type { ReportData, UserProfile, EWallet } from '@/lib/types';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';

interface ReportViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportData: ReportData;
  user: UserProfile;
  wallets: EWallet[];
}

export function ReportViewerDialog({
  open,
  onOpenChange,
  reportData,
  user,
  wallets,
}: ReportViewerDialogProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `PennyWise-Report-${new Date().toISOString().split('T')[0]}`,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Report Preview</DialogTitle>
          <DialogDescription>
            Review your financial report below. Click the print button when you're ready.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow border rounded-md">
            <div ref={reportRef} className="p-4 md:p-6">
                 <TransactionReport
                    reportData={reportData}
                    user={user}
                    wallets={wallets}
                 />
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    