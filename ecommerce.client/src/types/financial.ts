import { QueryParametersBase } from "./inventory";

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

export interface JournalLedgerQueryParameters {
  pageNumber?: number;
  pageSize?: number;
  startDate?: string | null; // ISO string date (YYYY-MM-DD)
  endDate?: string | null;   // ISO string date (YYYY-MM-DD)
  refContains?: string | null;
  sourceContains?: string | null;
  descriptionContains?: string | null;
  userId?: number | null;
  includeDisabledPages?: boolean;
}

export interface JournalPostData {
  id: number;
  accountNumber: string;
  accountName: string;
  ref?: string | null; 
  description?: string | null; 
  debit: number;
  credit: number;

  journalPageID: number;
  journalPageDate: string; 
  journalPageRef?: string | null;
  journalPageSource: string;
  journalPageUser?: string | null;
}

export interface JournalPageData {
  id: number; 
  createdAt: string; 
  ref?: string | null;
  source: string;
  description?: string | null; 
  username?: string | null;
  userId?: number | null;
  disabled: boolean;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean; 
  journalEntries: JournalPostData[]; 
}

export interface ProfitLossAccountLine {
  accountNumber: string;
  accountName: string;
  currentMonthAmount: number;
  yearToDateAmount: number;
}

export interface ProfitLossSubGroup {
  subGroupName: string;
  accounts: ProfitLossAccountLine[];
  totalCurrentMonth: number;
  totalYearToDate: number;
}

export interface ProfitLossSection {
  sectionName: string;
  accounts: ProfitLossAccountLine[]; 
  subGroups: ProfitLossSubGroup[];   
  totalCurrentMonth: number;
  totalYearToDate: number;
}

export interface ProfitLossReport {
  asOfDate: string; // ISO string
  reportTitle: string;
  reportingCurrencySymbol: string;
  reportCurrency: string;

  revenueSection: ProfitLossSection;
  costOfGoodsSoldSection: ProfitLossSection;
  
  grossProfitCurrentMonth: number;
  grossProfitYearToDate: number;

  operatingExpenseSection: ProfitLossSection;
  
  netIncomeCurrentMonth: number;
  netIncomeYearToDate: number;
}

export type ProfitLossRequestParams = BalanceSheetRequestParams; 

export interface AccountRead {
  id: number;
  accountNumber: string;
  name: string;
  categoryID: number;
  categoryName: string;
  subCategoryID?: number | null;
  subCategoryName?: string | null;
  normalBalance: 'debit' | 'credit'; 
  disabled: boolean;
}

export interface AccountWrite {
  accountNumber: string;
  name: string;
  categoryID: number;
  subCategoryID?: number | null;
  normalBalance: 'debit' | 'credit';
  disabled?: boolean; // Optional for create, used in update
}

export interface AccountJournalEntryQueryParameters extends QueryParametersBase { // Assuming QueryParametersBase is defined elsewhere
  startDate?: string | null; // ISO string date
  endDate?: string | null;   // ISO string date
  refContains?: string | null;
}

export interface AccountWithJournalEntries extends AccountRead {
  journalEntries: JournalPostData[]; // Re-use JournalPostData from financial types
  journalEntriesTotalCount: number;
  journalEntriesPageNumber: number;
  journalEntriesPageSize: number;
  journalEntriesTotalPages: number;
}

// For dropdowns
export interface AccountCategorySelection {
  id: number;
  name: string;
}

export interface AccountSubCategorySelection {
  id: number;
  code?: string | null;
  name: string;
}

// Add to the end of ecommerce.client/src/types/financial.ts

export interface JournalPostCreate {
  accountNumber: string;
  description?: string | null;
  debit: number;
  credit: number;
  ref?: string | null;
}

export interface JournalPageCreate {
  currencyID?: number | null; 
  ref?: string | null;
  source: string;
  description?: string | null;
  journalEntries: JournalPostCreate[];
}

export interface AccountSelection {
  id: number;
  accountNumber: string; 
  name: string;
}

export interface CurrencyExchangeWrite {
    exchangeOption: 'USDtoKHR' | 'KHRtoUSD';
    bankLocation: string;
    rate: number;
    fromAmount: number;
    description: string;
}

export interface CurrencyExchangeRead {
    id: number;
    timestamp: string;
    username: string;
    exchangeOption: 'USDtoKHR' | 'KHRtoUSD';
    fromAmount: number;
    toAmount: number;
    rate: number;
    description: string;
    disabled: boolean;
}
