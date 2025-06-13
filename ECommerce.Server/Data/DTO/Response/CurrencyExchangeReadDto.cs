namespace ECommerce.Server.Data.DTO.Response
{
    public class CurrencyExchangeReadDto
    {
        public int Id { get; set; }
        public DateTime Timestamp { get; set; }
        public string Username { get; set; }
        public string ExchangeOption { get; set; }
        public decimal FromAmount { get; set; }
        public decimal ToAmount { get; set; }
        public decimal Rate { get; set; }
        public string Description { get; set; }
        public bool Disabled { get; set; }
    }
}
