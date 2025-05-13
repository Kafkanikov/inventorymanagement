namespace ECommerce.Server.Data.DTO.Response
{
    public class StockReadDto
    {
        public int ID { get; set; }
        public string? Name { get; set; }
        public string? Address { get; set; }
        public int? UserID { get; set; }
        public string? ManagedByUsername { get; set; } // Optional: to display username
        public bool Disabled { get; set; }
    }
}
