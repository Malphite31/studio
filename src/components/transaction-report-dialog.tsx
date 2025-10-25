'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, subDays } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const reportSchema = z.object({
  dateRange: z.custom<DateRange>().optional(),
  includeIncome: z.boolean().default(true),
  includeWishlist: z.boolean().default(false),
  printAll: z.boolean().default(false),
}).refine(data => data.printAll || (data.dateRange?.from && data.dateRange?.to), {
  message: "Date range is required unless printing all records.",
  path: ["dateRange"],
});


interface TransactionReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (options: { startDate: Date; endDate: Date; includeIncome: boolean; includeWishlist: boolean, printAll: boolean; }) => void;
}

export function TransactionReportDialog({ open, onOpenChange, onGenerate }: TransactionReportDialogProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      dateRange: {
        from: subDays(new Date(), 29),
        to: new Date(),
      },
      includeIncome: true,
      includeWishlist: false,
      printAll: false,
    },
  });

  const printAll = form.watch('printAll');

  function onSubmit(values: z.infer<typeof reportSchema>) {
    const { dateRange, includeIncome, includeWishlist, printAll } = values;

    if (!printAll && (!dateRange?.from || !dateRange?.to)) {
      toast({
        variant: "destructive",
        title: "Invalid Date Range",
        description: "Please select a start and end date, or select 'Print All Records'."
      });
      return;
    }
    
    onOpenChange(false);

    setTimeout(() => {
        onGenerate({
            startDate: dateRange?.from || new Date(),
            endDate: dateRange?.to || new Date(),
            includeIncome,
            includeWishlist,
            printAll,
        });
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Transaction Report</DialogTitle>
          <DialogDescription>
            Select the options for your report.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="printAll"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Print All Records</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date range</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant={"outline"}
                        disabled={printAll}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                          printAll && "opacity-50"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value?.from ? (
                          field.value.to ? (
                            <>
                              {format(field.value.from, "LLL dd, y")} -{" "}
                              {format(field.value.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(field.value.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={field.value?.from}
                        selected={field.value}
                        onSelect={field.onChange}
                        numberOfMonths={1}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
                <h4 className="text-sm font-medium">Include in Report</h4>
                <FormField
                  control={form.control}
                  name="includeIncome"
                  render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                              <FormLabel>Income Records</FormLabel>
                          </div>
                      </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="includeWishlist"
                  render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                              <FormLabel>Wishlist Items</FormLabel>
                          </div>
                      </FormItem>
                  )}
                />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Generate &amp; Print</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
