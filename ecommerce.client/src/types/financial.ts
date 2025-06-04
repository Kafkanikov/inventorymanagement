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
[
  {
    "id": 1,
    "accountNumber": "1111020100",
    "category": 1,
    "categoryName": "Asset",
    "subCategory": 1,
    "subCategoryName": "Cash",
    "normalBalance": "debit",
    "journalEntries": [
      {
        "id": 1086,
        "journalPageID": 1026,
        "account": "1111020100",
        "ref": "PUR-00001",
        "description": "Payment for purchase - PUR-00001",
        "debit": 0.0000,
        "credit": 50.0000,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1087,
        "journalPageID": 1028,
        "account": "1111020100",
        "ref": "SAL-00001",
        "description": "Cash On Hand:USD for Sale SAL-00001",
        "debit": 120.0000,
        "credit": 0.0000,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1092,
        "journalPageID": 1029,
        "account": "1111020100",
        "ref": "PUR-00002",
        "description": "Payment for purchase - PUR-00002",
        "debit": 0.0000,
        "credit": 8.0000,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1094,
        "journalPageID": 1030,
        "account": "1111020100",
        "ref": "PUR-00003",
        "description": "Payment for purchase - PUR-00003",
        "debit": 0.0000,
        "credit": 80.0000,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1109,
        "journalPageID": 1035,
        "account": "1111020100",
        "ref": "SAL-00004",
        "description": "Cash On Hand:USD for Sale SAL-00004",
        "debit": 12.0000,
        "credit": 0.0000,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1105,
        "journalPageID": 1034,
        "account": "1111020100",
        "ref": "SAL-00003",
        "description": "Cash On Hand:USD for Sale SAL-00003",
        "debit": 120.0000,
        "credit": 0.0000,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1095,
        "journalPageID": 1031,
        "account": "1111020100",
        "ref": "SAL-00002",
        "description": "Cash On Hand:USD for Sale SAL-00002",
        "debit": 38.5000,
        "credit": 0.0000,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1099,
        "journalPageID": 1032,
        "account": "1111020100",
        "ref": "SAL-00002",
        "description": "Cash On Hand:USD for Sale SAL-00002",
        "debit": 38.5000,
        "credit": 0.0000,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1104,
        "journalPageID": 1033,
        "account": "1111020100",
        "ref": "PUR-00004",
        "description": "Payment for purchase - PUR-00004",
        "debit": 0.0000,
        "credit": 26.7000,
        "journalPage": null,
        "accountEntity": null
      }
    ]
  },
  {
    "id": 2,
    "accountNumber": "2100020000",
    "category": 1,
    "categoryName": "Asset",
    "subCategory": 2,
    "subCategoryName": "Inventory",
    "normalBalance": "debit",
    "journalEntries": [
      {
        "id": 1085,
        "journalPageID": 1026,
        "account": "2100020000",
        "ref": "PUR-00001",
        "description": "Inventory purchased - PUR-00001",
        "debit": 50.0000,
        "credit": 0.0000,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1090,
        "journalPageID": 1028,
        "account": "2100020000",
        "ref": "SAL-00001",
        "description": "Inventory reduction for Sale SAL-00001",
        "debit": 0.0000,
        "credit": 49.9920,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1091,
        "journalPageID": 1029,
        "account": "2100020000",
        "ref": "PUR-00002",
        "description": "Inventory purchased - PUR-00002",
        "debit": 8.0000,
        "credit": 0.0000,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1093,
        "journalPageID": 1030,
        "account": "2100020000",
        "ref": "PUR-00003",
        "description": "Inventory purchased - PUR-00003",
        "debit": 80.0000,
        "credit": 0.0000,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1112,
        "journalPageID": 1035,
        "account": "2100020000",
        "ref": "SAL-00004",
        "description": "Inventory reduction for Sale SAL-00004",
        "debit": 0.0000,
        "credit": 6.3238,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1108,
        "journalPageID": 1034,
        "account": "2100020000",
        "ref": "SAL-00003",
        "description": "Inventory reduction for Sale SAL-00003",
        "debit": 0.0000,
        "credit": 63.2379,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1098,
        "journalPageID": 1031,
        "account": "2100020000",
        "ref": "SAL-00002",
        "description": "Inventory reduction for Sale SAL-00002",
        "debit": 0.0000,
        "credit": 21.2495,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1102,
        "journalPageID": 1032,
        "account": "2100020000",
        "ref": "SAL-00002",
        "description": "Inventory reduction for Sale SAL-00002",
        "debit": 0.0000,
        "credit": 21.2495,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1103,
        "journalPageID": 1033,
        "account": "2100020000",
        "ref": "PUR-00004",
        "description": "Inventory purchased - PUR-00004",
        "debit": 26.7000,
        "credit": 0.0000,
        "journalPage": null,
        "accountEntity": null
      }
    ]
  },
  {
    "id": 3,
    "accountNumber": "6000020000",
    "category": 5,
    "categoryName": "Expense",
    "subCategory": 3,
    "subCategoryName": "Cost",
    "normalBalance": "debit",
    "journalEntries": [
      {
        "id": 1089,
        "journalPageID": 1028,
        "account": "6000020000",
        "ref": "SAL-00001",
        "description": "COGS for Sale SAL-00001",
        "debit": 49.9920,
        "credit": 0.0000,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1111,
        "journalPageID": 1035,
        "account": "6000020000",
        "ref": "SAL-00004",
        "description": "COGS for Sale SAL-00004",
        "debit": 6.3238,
        "credit": 0.0000,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1107,
        "journalPageID": 1034,
        "account": "6000020000",
        "ref": "SAL-00003",
        "description": "COGS for Sale SAL-00003",
        "debit": 63.2379,
        "credit": 0.0000,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1097,
        "journalPageID": 1031,
        "account": "6000020000",
        "ref": "SAL-00002",
        "description": "COGS for Sale SAL-00002",
        "debit": 21.2495,
        "credit": 0.0000,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1101,
        "journalPageID": 1032,
        "account": "6000020000",
        "ref": "SAL-00002",
        "description": "COGS for Sale SAL-00002",
        "debit": 21.2495,
        "credit": 0.0000,
        "journalPage": null,
        "accountEntity": null
      }
    ]
  },
  {
    "id": 5,
    "accountNumber": "5000020000",
    "category": 4,
    "categoryName": "Revenue",
    "subCategory": 4,
    "subCategoryName": "Sale",
    "normalBalance": "credit",
    "journalEntries": [
      {
        "id": 1088,
        "journalPageID": 1028,
        "account": "5000020000",
        "ref": "SAL-00001",
        "description": "Sales Revenue for Sale SAL-00001",
        "debit": 0.0000,
        "credit": 120.0000,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1110,
        "journalPageID": 1035,
        "account": "5000020000",
        "ref": "SAL-00004",
        "description": "Sales Revenue for Sale SAL-00004",
        "debit": 0.0000,
        "credit": 12.0000,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1106,
        "journalPageID": 1034,
        "account": "5000020000",
        "ref": "SAL-00003",
        "description": "Sales Revenue for Sale SAL-00003",
        "debit": 0.0000,
        "credit": 120.0000,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1096,
        "journalPageID": 1031,
        "account": "5000020000",
        "ref": "SAL-00002",
        "description": "Sales Revenue for Sale SAL-00002",
        "debit": 0.0000,
        "credit": 38.5000,
        "journalPage": null,
        "accountEntity": null
      },
      {
        "id": 1100,
        "journalPageID": 1032,
        "account": "5000020000",
        "ref": "SAL-00002",
        "description": "Sales Revenue for Sale SAL-00002",
        "debit": 0.0000,
        "credit": 38.5000,
        "journalPage": null,
        "accountEntity": null
      }
    ]
  }
]
export interface Account {
  id: number;
  accountNumber: string;
  category: number; 
  categoryName: string; 
  subCategory: number;
  subCategoryName: string; 
  normalBalance: 'debit' | 'credit'; 
  journalEntries: JournalPostData[]; 
}