import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Printer, ChevronDown } from 'lucide-react';
import { BalanceSheetData, BalanceSheetRequestParams, BalanceSheetGroup, BalanceSheetSubGroup, BalanceSheetAccount } from '@/types/financial';
import { formatCurrency } from '@/lib/utils';

interface BalanceSheetViewInternalProps {
  reportData: BalanceSheetData;
  reportParams: Partial<BalanceSheetRequestParams>; // For displaying params in header
}

export const BalanceSheetViewInternal: React.FC<BalanceSheetViewInternalProps> = ({ reportData, reportParams }) => {
  
  const handlePrint = () => {
    window.print();
  };
  
  const renderAccountRow = (account: BalanceSheetAccount, reportingSymbol: string, isSubItem: boolean = false) => (
    <TableRow key={account.accountNumber + account.accountName} className="text-xs hover:bg-muted/20">
      <TableCell className={`py-1 ${isSubItem ? 'pl-12' : 'pl-8'}`}>{account.accountNumber}</TableCell>
      <TableCell className="py-1">{account.accountName}</TableCell>
      <TableCell className="text-right py-1">
        {account.balanceInReportCurrency < 0 ? `(${formatCurrency(Math.abs(account.balanceInReportCurrency), reportingSymbol)})` : formatCurrency(account.balanceInReportCurrency, reportingSymbol)}
      </TableCell>
    </TableRow>
  );

  const renderSubGroup = (subGroup: BalanceSheetSubGroup, reportingSymbol: string) => (
    <React.Fragment key={subGroup.subGroupName}>
      <TableRow className="bg-muted/30 hover:bg-muted/40">
        <TableCell colSpan={2} className="font-semibold pl-4 py-1.5 text-xs">{subGroup.subGroupName}</TableCell>
        <TableCell className="text-right font-semibold py-1.5 text-xs">
          {subGroup.subGroupTotalInReportCurrency < 0 ? `(${formatCurrency(Math.abs(subGroup.subGroupTotalInReportCurrency), reportingSymbol)})` : formatCurrency(subGroup.subGroupTotalInReportCurrency, reportingSymbol)}
        </TableCell>
      </TableRow>
      {subGroup.accounts.map(acc => renderAccountRow(acc, reportingSymbol, true))}
    </React.Fragment>
  );
  
  const renderGroupSection = (groups: BalanceSheetGroup[], title: string, reportingSymbol: string, totalForSection: number) => (
     <Table className="mb-4 print-section">
        <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-gray-800">
                <TableHead colSpan={3} className="text-sm font-bold py-2">{title}</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
          {groups.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-3">No {title.toLowerCase()} data.</TableCell></TableRow>}
          {groups.map(group => group.subGroups.map(sg => renderSubGroup(sg, reportingSymbol)))}
        </TableBody>
        <TableFooter>
            <TableRow className="bg-gray-200 dark:bg-gray-700 font-bold text-sm">
                <TableCell colSpan={2} className="py-2">Total {title}</TableCell>
                <TableCell className="text-right py-2">
                    {totalForSection < 0 ? `(${formatCurrency(Math.abs(totalForSection), reportingSymbol)})` : formatCurrency(totalForSection, reportingSymbol)}
                </TableCell>
            </TableRow>
        </TableFooter>
    </Table>
  );

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
                    <span>Show Income & Expense Details (for P/L Calculation)</span>
                    <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-1 bg-slate-50 dark:bg-slate-800/50 rounded-md mt-2 space-y-4 animate-in fade-in-50 zoom-in-95">
                {renderGroupSection(reportData.incomeGroups, "Income Statement - Income", reportData.reportingCurrencySymbol, reportData.totalIncome)}
                {renderGroupSection(reportData.expenseGroups, "Income Statement - Expenses", reportData.reportingCurrencySymbol, reportData.totalExpenses)}
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
