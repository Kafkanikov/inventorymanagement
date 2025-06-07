namespace ECommerce.Server.Data.DTO.Response
{
    public class JournalPostReadDto
    {
        public int ID { get; set; }
        public string AccountNumber { get; set; }
        public string AccountName { get; set; } // Denormalized for convenience
        public string? Description { get; set; }
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
        public string? Ref { get; set; }

        public int JournalPageID { get; set; }
        public DateTime JournalPageDate { get; set; }
        public string? JournalPageRef { get; set; }
        public string JournalPageSource { get; set; }
        public string? JournalPageUser { get; set; }
    }
}
