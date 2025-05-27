export interface BalanceSheetAccount {
  accountNumber: string;
  accountName: string;
  balanceNative: number; // C# decimal maps to number in TypeScript
  currencySymbolNative: string; // e.g., "$", "៛"
  balanceInReportCurrency: number; // C# decimal maps to number
}

export interface BalanceSheetSubGroup {
  subGroupName: string;
  accounts: BalanceSheetAccount[];
  subGroupTotalInReportCurrency: number; // C# decimal maps to number
}

export interface BalanceSheetGroup {
  groupName: string;
  subGroups: BalanceSheetSubGroup[];
  groupTotalInReportCurrency: number; // C# decimal maps to number
}

export interface BalanceSheetData {
  asOfDate: string; // C# DateTime maps to an ISO string date format (e.g., "YYYY-MM-DDTHH:mm:ss")
  reportTitle: string;
  reportingCurrencySymbol: string; // e.g., "$", "៛"
  
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number; // Includes Retained Earnings + Current Year P/L
  
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean; // True if TotalAssets equals TotalLiabilitiesAndEquity (within a small tolerance)

  assetGroups: BalanceSheetGroup[];
  liabilityGroups: BalanceSheetGroup[];
  equityGroups: BalanceSheetGroup[];
  
  // Sections for Income Statement data used to calculate NetProfitOrLoss for Equity
  incomeGroups: BalanceSheetGroup[];
  expenseGroups: BalanceSheetGroup[];
  totalIncome: number;
  totalExpenses: number;
  netProfitOrLoss: number; // Calculated as TotalIncome - TotalExpenses
}

export interface BalanceSheetRequestParams {
  asOfDate: string; // ISO string date format (e.g., "YYYY-MM-DDTHH:mm:ss")
  reportCurrency: 'USD' | 'KHR'; // Report currency can only be USD or KHR
  khrtoReportCurrencyExchangeRate?: number | null; // KHR per 1 unit of the foreign currency (e.g., USD)
}

export interface TrialBalanceLine {
  accountNumber: string;
  accountName: string;
  debit: number;  // Amount in report currency
  credit: number; // Amount in report currency
}
export interface TrialBalanceReport {
    asOfDate: string; // ISO string date
    reportCurrency: string;
    reportingCurrencySymbol: string;
    lines: TrialBalanceLine[];
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
    reportTitle: string;
}
export interface TrialBalanceRequestParams {
    asOfDate: string; // ISO string date format (e.g., "YYYY-MM-DDTHH:mm:ss")
    reportCurrency: 'USD' | 'KHR';
    khrtoReportCurrencyExchangeRate?: number | null;
}