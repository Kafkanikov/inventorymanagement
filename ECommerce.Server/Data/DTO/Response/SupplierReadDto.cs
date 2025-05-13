namespace ECommerce.Server.Data.DTO.Response
{
    public class SupplierReadDto
    {
        public int ID { get; set; }
        public string? Name { get; set; }
        public string? Address { get; set; }
        public string? Tel { get; set; }
        public string? Email { get; set; }
        public bool Disabled { get; set; }
    }
}
