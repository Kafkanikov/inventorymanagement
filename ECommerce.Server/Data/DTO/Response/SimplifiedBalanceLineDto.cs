namespace ECommerce.Server.Data.DTO.Response
{
    public class SimplifiedBalanceLineDto
    {
        public string Section { get; set; }
        public string SubGroupName { get; set; }
        public string AccountNumber { get; set; }
        public string Description { get; set; }
        public decimal BalanceNative { get; set; }
        public string CurrencySymbolNative { get; set; }
        public decimal AmountInReportCurrency { get; set; }
    }
}
