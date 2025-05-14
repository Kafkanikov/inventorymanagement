// File: Data/DTO/Request/InventoryLogCreateDto.cs
using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.DTO.Request
{
    public class InventoryLogCreateDto
    {
        [Required]
        public int ItemID { get; set; }

        public int? ItemDetailID_Transaction { get; set; }

        // UserID will be taken from authenticated context
        // [Required]
        // public int UserID { get; set; }

        [Required(ErrorMessage = "Transaction type is required.")]
        [StringLength(30)]
        public string TransactionType { get; set; }

        [Required(ErrorMessage = "Quantity transacted is required.")]
        public decimal QuantityTransacted { get; set; }

        [Required(ErrorMessage = "Unit ID for transaction is required.")]
        public int UnitIDTransacted { get; set; }

        [Range(0, (double)decimal.MaxValue)]
        public decimal? CostPricePerBaseUnit { get; set; }

        [Range(0, (double)decimal.MaxValue)]
        public decimal? SalePricePerTransactedUnit { get; set; }

    }
}