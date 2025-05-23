using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.DTO.Request
{
    public class SaleDetailCreateDto
    {
        [Required(ErrorMessage = "Item code is required.")]
        [StringLength(50)]
        public string ItemCode { get; set; } // References ItemDetails.Code

        [Required(ErrorMessage = "Quantity is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1.")]
        public int Qty { get; set; }

        [Required(ErrorMessage = "Price for this line item is required.")]
        [Range(0.00, (double)decimal.MaxValue, ErrorMessage = "Price must be non-negative.")] // Allow 0 for free items if applicable
        public decimal LinePrice { get; set; } // Selling Price for this Qty of this ItemCode
                                               // This will map to SaleDetails.Cost in your DB
    }
}