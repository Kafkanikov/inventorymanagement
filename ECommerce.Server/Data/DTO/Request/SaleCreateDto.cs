using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.DTO.Request
{
    public class SaleCreateDto
    {
        [Required(ErrorMessage = "Sale date is required.")]
        public DateTime Date { get; set; }

        // UserID will be taken from authenticated context
        // public int? UserID { get; set; }

        [Required(ErrorMessage = "Stock Location ID for the sale is required.")]
        public int StockID { get; set; }

        // Could add CustomerID here if you have a Customers table

        [Required(ErrorMessage = "At least one sale detail item is required.")]
        [MinLength(1, ErrorMessage = "At least one sale detail item is required.")]
        public List<SaleDetailCreateDto> Details { get; set; } = new List<SaleDetailCreateDto>();

        // Code and TotalPrice will be generated/calculated by the backend.
    }
}