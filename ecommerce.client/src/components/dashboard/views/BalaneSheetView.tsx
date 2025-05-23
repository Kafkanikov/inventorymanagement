// src/components/dashboard/views/BalanceSheetView.tsx
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker, DatePickerProps } from '@/components/ui/date-picker'; // Assuming you have this from previous step
import { Download, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner'; // Or your preferred toast library
import {
  BalanceSheetData,
  BalanceSheetGroup,
  BalanceSheetSubGroup,
  BalanceSheetAccount,
  BalanceSheetRequestParams,
} from '@/types/financial';
import { ApiErrorResponse } from '@/types/inventory'; 
const API_ENDPOINT = '/api/accounting/reports/balance-sheet';

// Helper to format currency (can be moved to a shared utils file)
const formatCurrency = (amount: number | null | undefined, currencySymbol: string = '$'): string => {
  if (amount === null || amount === undefined) {
    return '-';
  }
  const sign = amount < 0 ? '-' : '';
  const absoluteAmount = Math.abs(amount);
  // Use toLocaleString for better number formatting based on locale, if desired
  return `${sign}${currencySymbol}${absoluteAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Helper to format dates for display (can be moved to a shared utils file)
const formatDateForDisplay = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

// Helper function to render account rows
const renderAccountRow = (account: BalanceSheetAccount, reportingCurrencySymbol: string, isSubAccount = false) => (
  <TableRow key={account.accountNumber + account.accountName + Math.random()} className={isSubAccount ? "text-sm" : ""}>
    <TableCell className={`pl-${isSubAccount ? 8 : 4} py-1.5`}>{account.accountNumber !== "N/A" ? account.accountNumber : ""}</TableCell>
    <TableCell className="py-1.5">{account.accountName}</TableCell>
    <TableCell className="text-right py-1.5">
      {account.currencySymbolNative !== reportingCurrencySymbol && account.balanceNative !== account.balanceInReportCurrency
        ? formatCurrency(account.balanceNative, account.currencySymbolNative)
        : ""}
    </TableCell>
    <TableCell className="text-right font-medium py-1.5">
      {formatCurrency(account.balanceInReportCurrency, reportingCurrencySymbol)}
    </TableCell>
  </TableRow>
);

// Helper function to render a subgroup
const renderSubGroup = (subGroup: BalanceSheetSubGroup, reportingCurrencySymbol: string) => (
  <React.Fragment key={subGroup.subGroupName + Math.random()}>
    <TableRow className="bg-muted/20 dark:bg-muted/10 hover:bg-muted/30 dark:hover:bg-muted/20">
      <TableCell colSpan={2} className="pl-4 font-semibold py-2">{subGroup.subGroupName}</TableCell>
      <TableCell></TableCell>
      <TableCell className="text-right font-semibold py-2">
        {formatCurrency(subGroup.subGroupTotalInReportCurrency, reportingCurrencySymbol)}
      </TableCell>
    </TableRow>
    {subGroup.accounts.map(account => renderAccountRow(account, reportingCurrencySymbol, true))}
  </React.Fragment>
);

// Helper function to render a main group
const renderGroup = (groupData: BalanceSheetGroup[] | undefined, groupBaseTitle: string, reportingCurrencySymbol: string) => {
  if (!groupData || groupData.length === 0) {
    // Optionally render a placeholder or nothing if the group is empty
    // For example, if liabilityGroup is an empty array from JSON
    return (
        <TableRow>
            <TableCell colSpan={3} className="font-bold text-lg py-3">{groupBaseTitle}</TableCell>
            <TableCell className="text-right font-bold text-lg py-3">{formatCurrency(0, reportingCurrencySymbol)}</TableCell>
        </TableRow>
    );
  }
  return (
    <>
      {groupData.map(group => (
        <React.Fragment key={group.groupName + Math.random()}>
          <TableRow className="bg-muted/40 dark:bg-muted/30 hover:bg-muted/50 dark:hover:bg-muted/40">
            <TableCell colSpan={3} className="font-bold text-lg py-3">{group.groupName}</TableCell>
            <TableCell className="text-right font-bold text-lg py-3">
              {formatCurrency(group.groupTotalInReportCurrency, reportingCurrencySymbol)}
            </TableCell>
          </TableRow>
          {group.subGroups.map(subGroup => renderSubGroup(subGroup, reportingCurrencySymbol))}
        </React.Fragment>
      ))}
    </>
  );
}


export const BalanceSheetView: React.FC = () => {
  const [requestParams, setRequestParams] = useState<Partial<BalanceSheetRequestParams>>({
    asOfDate: new Date().toISOString().split('T')[0] + "T00:00:00", // Default to today
    reportCurrency: 'USD', // Default currency
    khrtoReportCurrencyExchangeRate: 4100, // Default rate, adjust as needed
  });
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setRequestParams(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || null : value,
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setRequestParams(prev => ({
      ...prev,
      asOfDate: date ? date.toISOString().split('T')[0] + "T00:00:00" : undefined,
    }));
  };

  const handleGenerateReport = useCallback(async () => {
    if (!requestParams.asOfDate || !requestParams.reportCurrency) {
      toast.error("Validation Error", { description: "As of Date and Report Currency are required." });
      return;
    }
    // Ensure khrtoReportCurrencyExchangeRate is a number if reportCurrency is not KHR,
    // or handle this validation based on your backend requirements.
    // For simplicity, we'll send it if provided.

    setIsLoading(true);
    setError(null);
    setBalanceSheetData(null); // Clear previous data

    try {
      const payload: BalanceSheetRequestParams = {
        asOfDate: requestParams.asOfDate,
        reportCurrency: requestParams.reportCurrency,
        khrtoReportCurrencyExchangeRate: requestParams.khrtoReportCurrencyExchangeRate || undefined, // Send undefined if null/0
      };

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.title || `Failed to generate report: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      const data: BalanceSheetData = await response.json();
      setBalanceSheetData(data);
      toast.success("Report Generated", { description: "Balance Sheet loaded successfully." });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast.error("Generation Failed", { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [requestParams]);

  const handleExportJson = () => {
    if (!balanceSheetData) {
      toast.warning("No Data to Export", { description: "Please generate a report first." });
      return;
    }
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(balanceSheetData, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `balance-sheet-${balanceSheetData.asOfDate.split('T')[0]}.json`;
    link.click();
    toast.success("Balance Sheet Exported", { description: "The JSON file has been downloaded." });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Balance Sheet</CardTitle>
          <CardDescription>Select parameters to generate the balance sheet report.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="asOfDate">As of Date*</Label>
              <DatePicker
                date={requestParams.asOfDate ? new Date(requestParams.asOfDate) : undefined}
                setDate={handleDateChange}
                placeholder="Select date"
              />
            </div>
            <div>
              <Label htmlFor="reportCurrency">Report Currency*</Label>
              <Input
                id="reportCurrency"
                name="reportCurrency"
                value={requestParams.reportCurrency || ''}
                onChange={handleInputChange}
                placeholder="e.g., USD, KHR"
              />
            </div>
            <div>
              <Label htmlFor="khrtoReportCurrencyExchangeRate">KHR to Report Currency Rate</Label>
              <Input
                id="khrtoReportCurrencyExchangeRate"
                name="khrtoReportCurrencyExchangeRate"
                type="number"
                value={requestParams.khrtoReportCurrencyExchangeRate || ''}
                onChange={handleInputChange}
                placeholder="e.g., 4100"
                step="any"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Report
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Error Generating Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {balanceSheetData && (
        <Card className="w-full max-w-5xl mx-auto mt-6">
          <CardHeader className="text-center relative">
            <CardTitle className="text-2xl">{balanceSheetData.reportTitle}</CardTitle>
            <CardDescription>
              As of {formatDateForDisplay(balanceSheetData.asOfDate)}
              (All amounts in {balanceSheetData.reportingCurrencySymbol})
            </CardDescription>
            <div className="absolute top-4 right-4">
              <Button onClick={handleExportJson} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Export JSON
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption className="mt-4">
                {balanceSheetData.isBalanced ? "The balance sheet is balanced." : "Warning: The balance sheet is not balanced."}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[15%] min-w-[100px]">Account #</TableHead>
                  <TableHead className="w-[40%] min-w-[200px]">Account Name</TableHead>
                  <TableHead className="w-[20%] min-w-[120px] text-right">Native Balance</TableHead>
                  <TableHead className="w-[25%] min-w-[150px] text-right">Balance ({balanceSheetData.reportingCurrencySymbol})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Assets Section */}
                {renderGroup(balanceSheetData.assetGroup, "Assets", balanceSheetData.reportingCurrencySymbol)}
                <TableRow className="bg-secondary/50 hover:bg-secondary/60 dark:bg-secondary/40 dark:hover:bg-secondary/50">
                    <TableCell colSpan={3} className="text-right font-bold py-2.5">Total Assets</TableCell>
                    <TableCell className="text-right font-bold border-t-2 border-b-4 border-primary py-2.5">
                        {formatCurrency(balanceSheetData.totalAssets, balanceSheetData.reportingCurrencySymbol)}
                    </TableCell>
                </TableRow>
                <TableRow><TableCell colSpan={4} className="py-1.5">&nbsp;</TableCell></TableRow>

                {/* Liabilities Section */}
                {renderGroup(balanceSheetData.liabilityGroup, "Liabilities", balanceSheetData.reportingCurrencySymbol)}
                 <TableRow className="bg-secondary/50 hover:bg-secondary/60 dark:bg-secondary/40 dark:hover:bg-secondary/50">
                    <TableCell colSpan={3} className="text-right font-bold py-2.5">Total Liabilities</TableCell>
                    <TableCell className="text-right font-bold border-t border-b-2 border-primary py-2.5">
                         {formatCurrency(balanceSheetData.totalLiabilities, balanceSheetData.reportingCurrencySymbol)}
                    </TableCell>
                </TableRow>
                <TableRow><TableCell colSpan={4} className="py-1.5">&nbsp;</TableCell></TableRow>

                {/* Equity Section */}
                {renderGroup(balanceSheetData.equityGroup, "Equity", balanceSheetData.reportingCurrencySymbol)}
                 <TableRow className="bg-secondary/50 hover:bg-secondary/60 dark:bg-secondary/40 dark:hover:bg-secondary/50">
                    <TableCell colSpan={3} className="text-right font-bold py-2.5">Total Equity</TableCell>
                    <TableCell className="text-right font-bold border-t border-b-2 border-primary py-2.5">
                        {formatCurrency(balanceSheetData.totalEquity, balanceSheetData.reportingCurrencySymbol)}
                    </TableCell>
                </TableRow>
                <TableRow><TableCell colSpan={4} className="py-1"><Separator className="my-1" /></TableCell></TableRow>

                {/* Total Liabilities and Equity */}
                <TableRow className="bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30">
                  <TableCell colSpan={3} className="text-right font-bold text-lg py-3">Total Liabilities and Equity</TableCell>
                  <TableCell className="text-right font-bold text-lg border-t-2 border-b-4 border-primary py-3">
                    {formatCurrency(balanceSheetData.totalLiabilitiesAndEquity, balanceSheetData.reportingCurrencySymbol)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="text-center block mt-4">
            <p className={`text-sm ${balanceSheetData.isBalanced ? 'text-green-600' : 'text-red-600 font-semibold'}`}>
              {balanceSheetData.isBalanced ? 'Assets = Liabilities + Equity' : 'Assets != Liabilities + Equity. Please review.'}
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};
