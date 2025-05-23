using System;
using System.Collections.Generic;

namespace ECommerce.Server.Data.DTO.Response
{
    public class SaleReadDto
    {
        public int ID { get; set; }
        public string Code { get; set; }
        public DateTime? Date { get; set; }
        public int? UserID { get; set; }
        public string? Username { get; set; }
        public int? StockID { get; set; }
        public string? StockLocationName { get; set; }
        public decimal? TotalPrice { get; set; } // Sale.Price
        public bool Disabled { get; set; }
        public List<SaleDetailReadDto> Details { get; set; } = new List<SaleDetailReadDto>();
    }
}