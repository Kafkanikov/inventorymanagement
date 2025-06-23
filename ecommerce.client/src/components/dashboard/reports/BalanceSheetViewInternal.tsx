import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader  } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow, TableFooter } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Printer, ChevronDown } from 'lucide-react';
import { BalanceSheetData, BalanceSheetRequestParams } from '@/types/financial';
import { formatCurrency, handlePrint, renderGroupSection } from '@/lib/utils';

interface BalanceSheetViewInternalProps {
  reportData: BalanceSheetData;
  reportParams: Partial<BalanceSheetRequestParams>; // For displaying params in header
}

export const BalanceSheetViewInternal: React.FC<BalanceSheetViewInternalProps> = ({ reportData, reportParams }) => {
  return (
    <Card className="print-container shadow-lg mt-4">
        <CardHeader className="border-b pb-4">
        <div className="flex flex-col items-center text-center mb-2 print-header-block">
            <h1 className="text-2xl font-bold print-main-title">Inventory Management</h1>
            <h2 className="text-xl font-semibold print-report-title">{reportData.reportTitle}</h2>
            <p className="text-sm text-muted-foreground print-report-subtitle">
                Reporting Currency: {reportData.reportingCurrencySymbol}
                {reportParams.khrtoReportCurrencyExchangeRate && ` (Exchange Rate: 1 USD = ${reportParams.khrtoReportCurrencyExchangeRate} KHR)`}
            </p>
        </div>
        <div className="text-right no-print">
            <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" /> Print / Export PDF
            </Button>
        </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 report-content-area">
        
        {renderGroupSection(reportData.assetGroups, "Assets", reportData.reportingCurrencySymbol, reportData.totalAssets)}
        {renderGroupSection(reportData.liabilityGroups, "Liabilities", reportData.reportingCurrencySymbol, reportData.totalLiabilities)}
        {renderGroupSection(reportData.equityGroups, "Equity", reportData.reportingCurrencySymbol, reportData.totalEquity)}
        
        <Table className="mt-6 summary-table">
            <TableBody>
                <TableRow className="font-bold text-sm bg-slate-50 dark:bg-slate-800">
                    <TableCell colSpan={2}>Total Liabilities and Equity</TableCell>
                    <TableCell className="text-right">
                        {reportData.totalLiabilitiesAndEquity < 0 ? `(${formatCurrency(Math.abs(reportData.totalLiabilitiesAndEquity), reportData.reportingCurrencySymbol)})` : formatCurrency(reportData.totalLiabilitiesAndEquity, reportData.reportingCurrencySymbol)}
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
        
        <div className={`text-center font-bold mt-6 p-3 rounded-md text-sm balance-summary-no-print ${reportData.isBalanced ? 'bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300'}`}>
            {reportData.isBalanced ? "BALANCE SHEET IS BALANCED" : "BALANCE SHEET IS NOT BALANCED"}
            {!reportData.isBalanced && 
            <span className="block text-xs"> (Difference: {formatCurrency(reportData.totalAssets - reportData.totalLiabilitiesAndEquity, reportData.reportingCurrencySymbol)})</span>
            }
        </div>

        <Collapsible className="mt-8 pt-6 border-t no-print">
            <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full flex justify-between items-center text-sm">
                    <span>Show Income & Expense Details</span>
                    <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-1 bg-slate-50 dark:bg-slate-800/50 rounded-md mt-2 space-y-4 animate-in fade-in-50 zoom-in-95">
                {renderGroupSection(reportData.incomeGroups, "Income", reportData.reportingCurrencySymbol, reportData.totalIncome)}
                {renderGroupSection(reportData.expenseGroups, "Expenses", reportData.reportingCurrencySymbol, reportData.totalExpenses)}
                <Table>
                    <TableFooter>
                        <TableRow className="font-bold text-sm bg-blue-50 dark:bg-blue-900/50">
                            <TableCell colSpan={2}>Net Profit / (Loss) for the period</TableCell>
                            <TableCell className="text-right">
                                    {reportData.netProfitOrLoss < 0 ? `(${formatCurrency(Math.abs(reportData.netProfitOrLoss), reportData.reportingCurrencySymbol)})` : formatCurrency(reportData.netProfitOrLoss, reportData.reportingCurrencySymbol)}
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </CollapsibleContent>
        </Collapsible>
        </CardContent>
    </Card>
  );
};
