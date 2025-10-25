'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import type { UserProfile, ReportData, EWallet } from '@/lib/types';
import { format, isValid } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { Coins } from 'lucide-react';
import { Separator } from './ui/separator';

interface TransactionReportProps {
  reportData: ReportData;
  user: UserProfile | null;
  wallets: EWallet[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(amount).replace('PHP', '₱');

const toDate = (date: Date | Timestamp) => (date instanceof Timestamp ? date.toDate() : date);

export default function TransactionReport({ reportData, user, wallets }: TransactionReportProps) {
  const { expenses, income, ious, summary, dateRange } = reportData;

  const IouTable = ({ title, items }: { title: string; items: ReportData['ious'] }) => (
    <>
      <h2 className="text-xl font-semibold mt-6 mb-2">{title}</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length > 0 ? (
            items.map((iou) => (
              <TableRow key={iou.id}>
                <TableCell>{isValid(toDate(iou.dueDate)) ? format(toDate(iou.dueDate), 'MMM d, yyyy') : 'n/a'}</TableCell>
                <TableCell className="font-medium">{iou.name}</TableCell>
                <TableCell>{iou.paid ? 'Paid' : 'Unpaid'}</TableCell>
                <TableCell className={`text-right font-medium ${iou.type === 'Borrow' ? 'text-red-600' : 'text-green-600'}`}>
                  {iou.type === 'Borrow' ? '-' : '+'}
                  {formatCurrency(iou.amount)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center h-24">No data for this period.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );

  return (
    <div className="bg-white text-black p-8 font-sans">
      <header className="mb-8">
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-2">
            <Coins className="h-8 w-8 text-orange-500" />
            <span className="text-2xl font-semibold">PennyWise</span>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold">Financial Report</h1>
            <p className="text-gray-500">{`${format(dateRange.startDate, 'MMM d, yyyy')} - ${format(dateRange.endDate, 'MMM d, yyyy')}`}</p>
          </div>
        </div>
        <div className="mt-6">
          <p><span className="font-semibold">Report For:</span> {user?.name || user?.username}</p>
          <p><span className="font-semibold">Email:</span> {user?.email}</p>
        </div>
      </header>

      <main>
        {/* Summary Section */}
        <section className="mb-8 p-4 bg-gray-100 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                    <p className="text-gray-600 text-sm">Total Income</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</p>
                </div>
                <div className="text-center">
                    <p className="text-gray-600 text-sm">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</p>
                </div>
                <div className="text-center">
                    <p className="text-gray-600 text-sm">Net Balance</p>
                    <p className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(summary.netBalance)}</p>
                </div>
            </div>
        </section>


        {/* Expenses Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Expenses</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length > 0 ? (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{isValid(toDate(expense.date)) ? format(toDate(expense.date), 'MMM d, yyyy') : 'n/a'}</TableCell>
                    <TableCell className="font-medium">{expense.name}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{expense.paymentMethod || 'N/A'}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">-{formatCurrency(expense.amount)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">No expenses for this period.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </section>
        
        <Separator className="my-6"/>

        {/* Income Section */}
        {income.length > 0 &&
            <section className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Income</h2>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Deposited To</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {income.map((item) => (
                    <TableRow key={item.id}>
                    <TableCell>{isValid(toDate(item.date)) ? format(toDate(item.date), 'MMM d, yyyy') : 'n/a'}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{wallets.find(w => w.id === item.walletId)?.name || 'N/A'}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">+{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </section>
        }

        {/* IOU Section */}
        {ious.length > 0 &&
            <section>
                <IouTable title="Debts (Money You Borrowed)" items={ious.filter(i => i.type === 'Borrow')} />
                <IouTable title="Loans (Money You Lent)" items={ious.filter(i => i.type === 'Lent')} />
            </section>
        }
      </main>
      
      <footer className="mt-12 text-center text-xs text-gray-500">
        <p>Generated by PennyWise on {format(new Date(), 'MMMM d, yyyy')}</p>
      </footer>
    </div>
  );
}
