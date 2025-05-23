using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.DTO.Request
{
    public class PurchaseCreateDto
    {
        [Required(ErrorMessage = "Purchase date is required.")]
        public DateTime Date { get; set; }

        // UserID will be taken from authenticated context usually
        // public int? UserID { get; set; }

        [Required(ErrorMessage = "Supplier ID is required.")]
        public int SupplierID { get; set; }

        [Required(ErrorMessage = "Stock Location ID is required.")]
        public int StockID { get; set; }

        [Required(ErrorMessage = "At least one purchase detail item is required.")]
        [MinLength(1, ErrorMessage = "At least one purchase detail item is required.")]
        public List<PurchaseDetailCreateDto> Details { get; set; } = new List<PurchaseDetailCreateDto>();

        // Code and TotalCost will be generated/calculated by the backend.
        // Disabled will be false by default.
    }
}