import { TableFooter, TableCell, Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BalanceSheetGroup, BalanceSheetAccount, BalanceSheetSubGroup } from "@/types/financial";
import { clsx, type ClassValue } from "clsx"
import React from "react";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to format currency (can be moved to a shared utils file)
export const formatCurrency = (amount: number | null | undefined, currencySymbol: string = '$'): string => {
  if (amount === null || amount === undefined) {
    return '-';
  }
  // Handle negative numbers by placing the sign before the currency symbol
  const sign = amount < 0 ? '-' : '';
  const absoluteAmount = Math.abs(amount);
  return `${sign}${currencySymbol}${absoluteAmount.toFixed(2)}`; // Assuming 2 decimal places
};

// Helper to format dates (can be moved to a shared utils file)
export const formatDateForDisplay = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    // Assuming dateString is like "2025-05-23T00:00:00"
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

export const renderGroupSection = (groups: BalanceSheetGroup[], title: string, reportingSymbol: string, totalForSection: number) => (
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
export const handlePrint = () => {
  window.print();
};
  
export const renderAccountRow = (account: BalanceSheetAccount, reportingSymbol: string, isSubItem: boolean = false) => (
  <TableRow key={account.accountNumber + account.accountName} className="text-xs hover:bg-muted/20">
    <TableCell className={`py-1 ${isSubItem ? 'pl-12' : 'pl-8'}`}>{account.accountNumber}</TableCell>
    <TableCell className="py-1">{account.accountName}</TableCell>
    <TableCell className="text-right py-1">
      {account.balanceInReportCurrency < 0 ? `(${formatCurrency(Math.abs(account.balanceInReportCurrency), reportingSymbol)})` : formatCurrency(account.balanceInReportCurrency, reportingSymbol)}
    </TableCell>
  </TableRow>
);

export const renderSubGroup = (subGroup: BalanceSheetSubGroup, reportingSymbol: string) => (
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
