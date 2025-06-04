namespace ECommerce.Server.Data.DTO.Request
{
    public class JournalLedgerQueryParametersDto : QueryParametersBase
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? RefContains { get; set; }
        public string? SourceContains { get; set; }
        public string? DescriptionContains { get; set; }
        public int? UserId { get; set; }
        public bool IncludeDisabledPages { get; set; } = false;
    }
}
