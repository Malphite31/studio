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
import type { UserProfile, ReportData, EWallet, Iou } from '@/lib/types';
import { format, isValid } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { Coins } from 'lucide-react';

interface TransactionReportProps {
  reportData: ReportData;
  user: UserProfile | null;
  wallets: EWallet[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(amount).replace('PHP', '₱');

const toDate = (date: Date | Timestamp) => (date instanceof Timestamp ? date.toDate() : date);

export default function TransactionReport({ reportData, user, wallets }: TransactionReportProps) {
  const { expenses, income, ious, wishlist, summary, dateRange, printAll } = reportData;

  const IouTable = ({ title, items }: { title: string; items: Iou[] }) => {
    if (items.length === 0) return null;
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    return (
      <div className="print-table-section">
        <h2 className="text-lg font-semibold mt-4 mb-2">{title}</h2>
        <Table className="print-table">
          <TableHeader className="print-header">
            <TableRow>
              <TableHead className='font-bold text-black'>Date</TableHead>
              <TableHead className='font-bold text-black'>Description</TableHead>
              <TableHead className='font-bold text-black'>Status</TableHead>
              <TableHead className="text-right font-bold text-black">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((iou) => (
              <TableRow key={iou.id}>
                <TableCell>{isValid(toDate(iou.dueDate)) ? format(toDate(iou.dueDate), 'MMM d, yyyy') : 'n/a'}</TableCell>
                <TableCell className="font-medium">{iou.name}</TableCell>
                <TableCell>{iou.paid ? 'Paid' : 'Unpaid'}</TableCell>
                <TableCell className="text-right font-medium">
                  {iou.type === 'Borrow' ? '-' : '+'}
                  {formatCurrency(iou.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
           <TableFooter>
                <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell>
                </TableRow>
            </TableFooter>
        </Table>
      </div>
    );
  }


  return (
    <div className="bg-white text-black font-sans print-container">
      <header className="mb-4">
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-orange-500" />
            <span className="text-xl font-semibold">PennyWise</span>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold">Financial Report</h1>
            <p className="text-xs text-gray-500">
                {printAll ? 'All Records' : `${format(dateRange.startDate, 'MMM d, yyyy')} - ${format(dateRange.endDate, 'MMM d, yyyy')}`}
            </p>
          </div>
        </div>
        <div className="mt-4 text-xs">
          <p><span className="font-semibold">Report For:</span> {user?.name || user?.username}</p>
          <p><span className="font-semibold">Email:</span> {user?.email}</p>
        </div>
      </header>

      <main>
        {/* Summary Section */}
        <section className="mb-4 p-2 rounded-lg border">
            <h2 className="text-lg font-semibold mb-2">Summary</h2>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                    <p className="text-gray-600 text-xs">Total Income</p>
                    <p className="text-base font-bold">{formatCurrency(summary.totalIncome)}</p>
                </div>
                <div>
                    <p className="text-gray-600 text-xs">Total Expenses</p>
                    <p className="text-base font-bold">{formatCurrency(summary.totalExpenses)}</p>
                </div>
                <div>
                    <p className="text-gray-600 text-xs">Net Balance</p>
                    <p className="text-base font-bold">{formatCurrency(summary.netBalance)}</p>
                </div>
            </div>
        </section>

        {/* Income Section */}
        {income.length > 0 &&
            <div className="print-table-section">
            <h2 className="text-lg font-semibold mb-2 mt-4">Income</h2>
            <Table className="print-table">
                <TableHeader className="print-header">
                <TableRow>
                    <TableHead className='font-bold text-black'>Date</TableHead>
                    <TableHead className='font-bold text-black'>Source</TableHead>
                    <TableHead className='font-bold text-black'>Deposited To</TableHead>
                    <TableHead className="text-right font-bold text-black">Amount</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {income.map((item) => (
                    <TableRow key={item.id}>
                    <TableCell>{isValid(toDate(item.date)) ? format(toDate(item.date), 'MMM d, yyyy') : 'n/a'}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{wallets.find(w => w.id === item.walletId)?.name || 'N/A'}</TableCell>
                    <TableCell className="text-right font-medium">+{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
                 <TableFooter>
                    <TableRow>
                        <TableCell colSpan={3} className="text-right font-bold">Total Income</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(summary.totalIncome)}</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
            </div>
        }

        {/* Expenses Section */}
        <div className="print-table-section">
          <h2 className="text-lg font-semibold mb-2">Expenses</h2>
          <Table className="print-table">
            <TableHeader className="print-header">
              <TableRow>
                <TableHead className='font-bold text-black'>Date</TableHead>
                <TableHead className='font-bold text-black'>Description</TableHead>
                <TableHead className='font-bold text-black'>Category</TableHead>
                <TableHead className='font-bold text-black'>Payment Method</TableHead>
                <TableHead className="text-right font-bold text-black">Amount</TableHead>
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
                    <TableCell className="text-right font-medium">-{formatCurrency(expense.amount)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-16">No expenses for this period.</TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={4} className="text-right font-bold">Total Expenses</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(summary.totalExpenses)}</TableCell>
                </TableRow>
            </TableFooter>
          </Table>
        </div>
        
        {/* IOU Section */}
        {ious.length > 0 &&
            <div className='page-break-before'>
                <IouTable title="Debts (Money You Borrowed)" items={ious.filter(i => i.type === 'Borrow')} />
                <IouTable title="Loans (Money You Lent)" items={ious.filter(i => i.type === 'Lent')} />
            </div>
        }

        {/* Wishlist Section */}
        {wishlist.length > 0 &&
            <div className="print-table-section page-break-before">
                <h2 className="text-lg font-semibold mb-2 mt-4">Wishlist Items</h2>
                <Table className="print-table">
                    <TableHeader className="print-header">
                        <TableRow>
                            <TableHead className='font-bold text-black'>Item</TableHead>
                            <TableHead className="text-right font-bold text-black">Saved</TableHead>
                            <TableHead className="text-right font-bold text-black">Target</TableHead>
                            <TableHead className="text-right font-bold text-black">Progress</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {wishlist.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.savedAmount)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.targetAmount)}</TableCell>
                                <TableCell className="text-right">{((item.savedAmount / item.targetAmount) * 100).toFixed(0)}%</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        }

      </main>
    </div>
  );
}
