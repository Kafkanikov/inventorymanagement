// File: Data/DTO/Request/PurchaseQueryParameters.cs
using System;

namespace ECommerce.Server.Data.DTO.Request
{
    public class PurchaseQueryParameters : QueryParametersBase // Assuming you have a base for PageNumber/PageSize
    {
        public string? Code { get; set; }
        public int? SupplierID { get; set; }
        public int? StockID { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool? IncludeDisabled { get; set; } = false;
    }
}