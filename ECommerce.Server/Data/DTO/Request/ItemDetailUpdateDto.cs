// File: Data/DTO/Request/ItemDetailWriteDto.cs
using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.DTO.Request
{
    public class ItemDetailUpdateDto
    {
        [Required(ErrorMessage = "Detail code is required.")]
        [StringLength(50)]
        public string Code { get; set; }

        [Required(ErrorMessage = "Item ID is required.")]
        public int ItemID { get; set; }

        [Required(ErrorMessage = "Unit ID is required.")]
        public int UnitID { get; set; }

        [Required(ErrorMessage = "Conversion factor (Qty) is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Conversion factor must be at least 1.")] // Base unit itself should be 1. Other packs are >1.
        // Or >0 if fractional factors were allowed with DECIMAL type
        public int definedPackageQty { get; set; } // SQL Qty

        [Range(0, (double)decimal.MaxValue, ErrorMessage = "Price must be a non-negative value.")]
        public decimal? Price { get; set; }

        // Disabled is managed by create (default false) and soft delete endpoint
    }
}