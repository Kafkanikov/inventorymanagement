// src/types/financials.ts (or a new types file)

export interface BalanceSheetAccount {
  accountNumber: string;
  accountName: string;
  balanceNative: number;
  currencySymbolNative: string;
  balanceInReportCurrency: number;
}

export interface BalanceSheetSubGroup {
  subGroupName: string;
  accounts: BalanceSheetAccount[];
  subGroupTotalInReportCurrency: number;
}

export interface BalanceSheetGroup {
  groupName: string;
  subGroups: BalanceSheetSubGroup[];
  groupTotalInReportCurrency: number;
}

export interface BalanceSheetData {
  asOfDate: string; // ISO string format "YYYY-MM-DDTHH:mm:ss"
  reportTitle: string;
  reportingCurrencySymbol: string;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  assetGroup: BalanceSheetGroup[]; // Even if it's one main group, it's an array
  liabilityGroup: BalanceSheetGroup[];
  equityGroup: BalanceSheetGroup[];
}

export interface BalanceSheetRequestParams {
  asOfDate: string; // ISO string format "YYYY-MM-DDTHH:mm:ss"
  reportCurrency: string; // e.g., "USD", "KHR"
  khrtoReportCurrencyExchangeRate?: number | null; // Optional, only needed if reportCurrency is not KHR and KHR data exists
}
