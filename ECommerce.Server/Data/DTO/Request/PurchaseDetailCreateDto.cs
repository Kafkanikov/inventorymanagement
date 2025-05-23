using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.DTO.Request
{
    public class PurchaseDetailCreateDto
    {
        [Required(ErrorMessage = "Item code is required.")]
        [StringLength(50)]
        public string ItemCode { get; set; } // References ItemDetails.Code

        [Required(ErrorMessage = "Quantity is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1.")]
        public int Qty { get; set; }

        [Required(ErrorMessage = "Cost for this line item is required.")]
        [Range(0.01, (double)decimal.MaxValue, ErrorMessage = "Cost must be greater than 0.")]
        public decimal Cost { get; set; } // Cost for this specific Qty of this ItemCode
    }
}