import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption, TableFooter } from '@/components/ui/table';
import { Printer } from 'lucide-react';
import { TrialBalanceReport, TrialBalanceRequestParams } from '@/types/financial';
import { formatCurrency, formatDateForDisplay } from '@/lib/utils';

interface TrialBalanceViewInternalProps {
  reportData: TrialBalanceReport;
  reportParams: Partial<TrialBalanceRequestParams>; // For displaying params in header
}

export const TrialBalanceViewInternal: React.FC<TrialBalanceViewInternalProps> = ({ reportData, reportParams }) => {

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="print-container shadow-lg mt-4">
        <CardHeader className="border-b pb-4">
        <div className="flex flex-col items-center text-center mb-2 print-header-block">
            <h1 className="text-2xl font-bold print-main-title">Inventory Management</h1>
            <h2 className="text-xl font-semibold print-report-title">{reportData.reportTitle}</h2>
            <p className="text-sm text-muted-foreground print-report-subtitle">
                Reporting Currency: {reportData.reportingCurrencySymbol}
                {reportParams.khrtoReportCurrencyExchangeRate && ` (Exchange Rate: ${reportParams.khrtoReportCurrencyExchangeRate} KHR per Foreign Unit)`}
            </p>
        </div>
        <div className="text-right no-print">
            <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" /> Print / Export PDF
            </Button>
        </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 report-content-area">
        <Table>
            <TableCaption className="print-footer-caption">
            Trial Balance as of {formatDateForDisplay(reportData.asOfDate)}
            </TableCaption>
            <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-gray-800">
                <TableHead className="w-[150px]">Account Number</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead className="text-right w-[120px]">Debit</TableHead>
                <TableHead className="text-right w-[120px]">Credit</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {reportData.lines.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">No accounts with balances for this period.</TableCell></TableRow>
            )}
            {reportData.lines.map((line) => (
                <TableRow key={line.accountNumber} className="text-xs hover:bg-muted/20">
                <TableCell className="font-medium py-1.5">{line.accountNumber}</TableCell>
                <TableCell className="py-1.5">{line.accountName}</TableCell>
                <TableCell className="text-right py-1.5">
                    {line.debit !== 0 ? formatCurrency(line.debit, reportData.reportingCurrencySymbol) : '-'}
                </TableCell>
                <TableCell className="text-right py-1.5">
                    {line.credit !== 0 ? formatCurrency(line.credit, reportData.reportingCurrencySymbol) : '-'}
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
            <TableFooter>
            <TableRow className="bg-gray-200 dark:bg-gray-700 font-bold text-sm">
                <TableCell colSpan={2} className="py-2">Totals</TableCell>
                <TableCell className="text-right py-2">{formatCurrency(reportData.totalDebits, reportData.reportingCurrencySymbol)}</TableCell>
                <TableCell className="text-right py-2">{formatCurrency(reportData.totalCredits, reportData.reportingCurrencySymbol)}</TableCell>
            </TableRow>
            </TableFooter>
        </Table>
        <div className={`text-center font-bold mt-6 p-3 rounded-md text-sm balance-summary-no-print ${reportData.isBalanced ? 'bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300'}`}>
            {reportData.isBalanced ? "TRIAL BALANCE IS BALANCED" : "TRIAL BALANCE IS NOT BALANCED"}
            {!reportData.isBalanced && 
            <span className="block text-xs"> (Difference: {formatCurrency(Math.abs(reportData.totalDebits - reportData.totalCredits), reportData.reportingCurrencySymbol)})</span>
            }
        </div>
        </CardContent>
    </Card>
  );
};
