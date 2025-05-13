namespace ECommerce.Server.Data.DTO.Response
{
    public class CategoryReadDto
    {
        public int ID { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public bool Disabled { get; set; }
    }
}
