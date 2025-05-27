namespace ECommerce.Server.Data.DTO.Response
{
    public class TrialBalanceLineDto
    {
        public string AccountNumber { get; set; }
        public string AccountName { get; set; }
        public decimal Debit { get; set; }  
        public decimal Credit { get; set; } 
    }

    public class TrialBalanceReportDto
    {
        public DateTime AsOfDate { get; set; }
        public string ReportCurrency { get; set; }
        public string ReportingCurrencySymbol { get; set; }
        public List<TrialBalanceLineDto> Lines { get; set; } = new List<TrialBalanceLineDto>();
        public decimal TotalDebits { get; set; }
        public decimal TotalCredits { get; set; }
        public bool IsBalanced { get; set; } 
        public string ReportTitle { get; set; }
    }
}
