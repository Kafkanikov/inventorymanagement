namespace ECommerce.Server.Data.DTO.Response
{
    public class UserReadDto
    {
        public int Id { get; set; } // Changed from Id to ID
        public string Username { get; set; }
        public string? Email { get; set; }
        public bool Disabled { get; set; }
    }
}
