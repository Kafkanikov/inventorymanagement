using System;
using System.Collections.Generic;

namespace ECommerce.Server.Data.DTO.Response
{
    public class PurchaseReadDto
    {
        public int ID { get; set; }
        public string Code { get; set; }
        public DateTime? Date { get; set; }
        public int? UserID { get; set; }
        public string? Username { get; set; } // From User entity
        public int? SupplierID { get; set; }
        public string? SupplierName { get; set; } // From Supplier entity
        public int? StockID { get; set; }
        public string? StockLocationName { get; set; } // From Stock entity
        public decimal? TotalCost { get; set; } // Purchase.Cost
        public bool Disabled { get; set; }
        public List<PurchaseDetailReadDto> Details { get; set; } = new List<PurchaseDetailReadDto>();
    }
}