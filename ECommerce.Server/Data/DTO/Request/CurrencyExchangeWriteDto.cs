namespace ECommerce.Server.Data.DTO.Request
{
    public class CurrencyExchangeWriteDto
    {
        public string ExchangeOption { get; set; }
        public string BankLocation { get; set; }
        public decimal Rate { get; set; }
        public decimal FromAmount { get; set; }
        public string Description { get; set; }
    }
}
