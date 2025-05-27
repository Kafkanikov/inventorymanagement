namespace ECommerce.Server.Data.DTO.Response
{
    public class JournalPageReadDto
    {
        public int ID { get; set; }
        public int? CurrencyID { get; set; }
        public int? UserID { get; set; }
        public string? Username { get; set; } // Denormalized
        public string? Ref { get; set; }
        public string Source { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Description { get; set; }
        public bool Disabled { get; set; }
        public List<JournalPostReadDto> JournalEntries { get; set; } = new List<JournalPostReadDto>();
        public decimal TotalDebits { get; set; }
        public decimal TotalCredits { get; set; }
        public bool IsBalanced { get; set; }
    }
}
