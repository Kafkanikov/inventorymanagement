namespace ECommerce.Server.Data.DTO.Response
{
    public class ProfitLossAccountLineDto
    {
        public string AccountNumber { get; set; }
        public string AccountName { get; set; }
        public decimal CurrentMonthAmount { get; set; } // Net change for the month
        public decimal YearToDateAmount { get; set; }   // Net change for YTD
    }

    public class ProfitLossSubGroupDto // For categorizing expenses, e.g., "Operating Expenses" -> "Salaries"
    {
        public string SubGroupName { get; set; }
        public List<ProfitLossAccountLineDto> Accounts { get; set; } = new List<ProfitLossAccountLineDto>();
        public decimal TotalCurrentMonth { get; set; }
        public decimal TotalYearToDate { get; set; }
    }

    public class ProfitLossSectionDto
    {
        public string SectionName { get; set; } // e.g., "Revenue", "Cost of Goods Sold", "Operating Expenses"
        // If a section (like Revenue or COGS) doesn't have further sub-groupings, its accounts go here.
        // If it does (like Operating Expenses), this list might be empty and SubGroups will be populated.
        public List<ProfitLossAccountLineDto> Accounts { get; set; } = new List<ProfitLossAccountLineDto>();
        public List<ProfitLossSubGroupDto> SubGroups { get; set; } = new List<ProfitLossSubGroupDto>();
        public decimal TotalCurrentMonth { get; set; }
        public decimal TotalYearToDate { get; set; }
    }

    public class ProfitLossReportDto
    {
        public DateTime AsOfDate { get; set; }
        public string ReportTitle { get; set; }
        public string ReportingCurrencySymbol { get; set; }
        public string ReportCurrency { get; set; }


        public ProfitLossSectionDto RevenueSection { get; set; }
        public ProfitLossSectionDto CostOfGoodsSoldSection { get; set; }

        public decimal GrossProfitCurrentMonth { get; set; }
        public decimal GrossProfitYearToDate { get; set; }

        public ProfitLossSectionDto OperatingExpenseSection { get; set; }

        public decimal NetIncomeCurrentMonth { get; set; }
        public decimal NetIncomeYearToDate { get; set; }
    }
}
