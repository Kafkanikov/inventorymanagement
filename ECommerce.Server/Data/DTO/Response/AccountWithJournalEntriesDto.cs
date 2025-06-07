using ECommerce.Server.Data.DTO.Response;

public class AccountWithJournalEntriesDto : AccountReadDto
{
    public List<JournalPostReadDto> JournalEntries { get; set; } = new List<JournalPostReadDto>();
    public int JournalEntriesTotalCount { get; set; }
    public int JournalEntriesPageNumber { get; set; }
    public int JournalEntriesPageSize { get; set; }
    public int JournalEntriesTotalPages { get; set; }
}