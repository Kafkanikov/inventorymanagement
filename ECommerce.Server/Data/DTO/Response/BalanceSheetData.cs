namespace ECommerce.Server.Data.DTO.Response
{
    public class BalanceSheetAccountDto
    {
        public string AccountNumber { get; set; }
        public string AccountName { get; set; }
        public decimal BalanceNative { get; set; }
        public string CurrencySymbolNative { get; set; } // e.g., "$", "៛"
        public decimal BalanceInReportCurrency { get; set; }
    }

    public class BalanceSheetSubGroupDto
    {
        public string SubGroupName { get; set; }
        public List<BalanceSheetAccountDto> Accounts { get; set; } = new List<BalanceSheetAccountDto>();
        public decimal SubGroupTotalInReportCurrency { get; set; }
    }

    public class BalanceSheetGroupDto
    {
        public string GroupName { get; set; } // "Assets", "Liabilities", "Equity"
        public List<BalanceSheetSubGroupDto> SubGroups { get; set; } = new List<BalanceSheetSubGroupDto>();
        public decimal GroupTotalInReportCurrency { get; set; }
    }

    public class BalanceSheetDataDto // Renamed from BalanceSheetData to avoid conflict if also used as entity
    {
        public DateTime AsOfDate { get; set; }
        public string ReportTitle { get; set; } = "Balance Sheet"; // Default title
        public string ReportingCurrencySymbol { get; set; } // e.g., "$", "៛"
        public decimal TotalAssets { get; set; }
        public decimal TotalLiabilities { get; set; }
        public decimal TotalEquity { get; set; }
        public decimal TotalLiabilitiesAndEquity { get; set; }
        public bool IsBalanced { get; set; }
        public List<BalanceSheetGroupDto> AssetGroups { get; set; } = new List<BalanceSheetGroupDto>();
        public List<BalanceSheetGroupDto> LiabilityGroups { get; set; } = new List<BalanceSheetGroupDto>();
        public List<BalanceSheetGroupDto> EquityGroups { get; set; } = new List<BalanceSheetGroupDto>();
        public List<BalanceSheetGroupDto> IncomeGroups { get; set; } = new List<BalanceSheetGroupDto>();
        public List<BalanceSheetGroupDto> ExpenseGroups { get; set; } = new List<BalanceSheetGroupDto>();
        public decimal TotalIncome { get; set; } // Total of all income accounts
        public decimal TotalExpenses { get; set; } // Total of all expense accounts (usually positive numbers)
        public decimal NetProfitOrLoss { get; set; } // Calculated: TotalIncome - TotalExpenses
    }
}
