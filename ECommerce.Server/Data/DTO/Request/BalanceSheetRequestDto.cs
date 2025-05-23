public class BalanceSheetRequestDto
{
    public DateTime AsOfDate { get; set; }
    public string ReportCurrency { get; set; } = "USD"; // Default reporting currency
    public decimal KHRtoReportCurrencyExchangeRate { get; set; } = 4150; // Default from PDF
}