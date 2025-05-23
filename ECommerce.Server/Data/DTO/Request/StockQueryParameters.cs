using ECommerce.Server.Data.DTO.Request;

public class StockQueryParameters : QueryParametersBase // Assuming QueryParametersBase has PageNumber, PageSize
{
    public string? NameFilter { get; set; }
    public int? CategoryID { get; set; }
}