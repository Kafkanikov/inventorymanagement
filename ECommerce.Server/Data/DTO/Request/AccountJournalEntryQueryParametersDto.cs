using ECommerce.Server.Data.DTO.Request;

public class AccountJournalEntryQueryParametersDto : QueryParametersBase
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? RefContains { get; set; }
}