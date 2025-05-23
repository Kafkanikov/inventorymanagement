// File: Data/DTO/Request/InventoryLogCreateDto.cs
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace ECommerce.Server.Data.DTO.Request
{
    public class InventoryLogCreateDto
    {
        [Required]
        public int ItemID { get; set; }

        public int? ItemDetailID_Transaction { get; set; }

        // UserID will be taken from authenticated context
         //[Required]
        //public int UserID { get; set; }

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

        public override string ToString()
        {
            // Using StringBuilder for efficient string concatenation, especially if you have many properties.
            StringBuilder sb = new StringBuilder();
            sb.AppendFormat("ItemID: {0}", ItemID);
            sb.AppendFormat(", ItemDetailID_Transaction: {0}", ItemDetailID_Transaction.HasValue ? ItemDetailID_Transaction.Value.ToString() : "null");
            sb.AppendFormat(", TransactionType: \"{0}\"", TransactionType ?? "null"); // Handle potential null string
            sb.AppendFormat(", QuantityTransacted: {0}", QuantityTransacted);
            sb.AppendFormat(", UnitIDTransacted: {0}", UnitIDTransacted);
            sb.AppendFormat(", CostPricePerBaseUnit: {0}", CostPricePerBaseUnit.HasValue ? CostPricePerBaseUnit.Value.ToString() : "null");
            sb.AppendFormat(", SalePricePerTransactedUnit: {0}", SalePricePerTransactedUnit.HasValue ? SalePricePerTransactedUnit.Value.ToString() : "null");
            return sb.ToString();
        }

    }
}