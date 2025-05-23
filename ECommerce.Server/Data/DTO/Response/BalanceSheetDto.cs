namespace ECommerce.Server.Data.DTO.Response
{
    public class AccountBalanceDto
    {
        public string AccountNumber { get; set; }
        public string AccountName { get; set; }
        public decimal BalanceNative { get; set; } // Balance in the account's original currency
        public string CurrencySymbolNative { get; set; } // e.g., "$", "៛"
        public decimal BalanceInReportCurrency { get; set; } // Converted to report currency
    }
}

namespace ECommerce.Server.Data.DTO.Response
{
    public class AccountSubGroupDto
    {
        public string SubGroupName { get; set; } // e.g., "Cash", "Accounts payable" from your PDF
        public List<AccountBalanceDto> Accounts { get; set; } = new List<AccountBalanceDto>();
        public decimal SubGroupTotalInReportCurrency { get; set; }
    }
}

namespace ECommerce.Server.Data.DTO.Response
{
    public class AccountMainGroupDto
    {
        public string GroupName { get; set; } // "Assets", "Liabilities", "Equity"
        public List<AccountSubGroupDto> SubGroups { get; set; } = new List<AccountSubGroupDto>();
        public decimal GroupTotalInReportCurrency { get; set; }
    }
}

namespace ECommerce.Server.Data.DTO.Response
{
    public class BalanceSheetDto
    {
        public DateTime AsOfDate { get; set; }
        public string ReportTitle { get; set; } = "Balance Sheet";
        public string ReportingCurrencySymbol { get; set; } // e.g., "$" if reporting in USD
        public decimal TotalAssets { get; set; }
        public decimal TotalLiabilities { get; set; }
        public decimal TotalEquity { get; set; }
        public decimal TotalLiabilitiesAndEquity { get; set; }
        public bool IsBalanced { get; set; } // TotalAssets == TotalLiabilitiesAndEquity

        public List<AccountMainGroupDto> AssetGroup { get; set; } = new List<AccountMainGroupDto>();
        public List<AccountMainGroupDto> LiabilityGroup { get; set; } = new List<AccountMainGroupDto>();
        public List<AccountMainGroupDto> EquityGroup { get; set; } = new List<AccountMainGroupDto>();
    }
}