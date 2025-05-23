// File: Data/DTO/Request/InventoryLogQueryParameters.cs
using System;

namespace ECommerce.Server.Data.DTO.Request
{
    public class InventoryLogQueryParameters : QueryParametersBase
    {
        public int? ItemID { get; set; }
        public int? UserID { get; set; }
        public string? TransactionType { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        //private const int MaxPageSize = 50;
        //private int _pageSize = 10;
        //public int PageNumber { get; set; } = 1;
        //public int PageSize
        //{
        //    get => _pageSize;
        //    set => _pageSize = (value > MaxPageSize) ? MaxPageSize : value;
        //}
    }
}