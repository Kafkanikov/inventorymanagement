using System;

namespace ECommerce.Server.Data.DTO.Request
{
    public class SaleQueryParameters : QueryParametersBase
    {
        public string? Code { get; set; }
        public int? StockID { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool? IncludeDisabled { get; set; } = false;
    }
}