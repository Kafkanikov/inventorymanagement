using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Server.Data.Entities
{
    [Table("InventoryLog")]
    public class InventoryLog
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int LogID { get; set; }

        [Required]
        public int ItemID { get; set; }

        public int? ItemDetailID_Transaction { get; set; } // Nullable Foreign Key

        [Required]
        public int UserID { get; set; }

        [Required]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow; // Default value in C#

        [Required]
        [StringLength(30)]
        public string TransactionType { get; set; }

        [Required]
        [Column(TypeName = "decimal(18, 4)")]
        public decimal QuantityTransacted { get; set; }

        [Required]
        public int UnitIDTransacted { get; set; }

        [Required]
        public int ConversionFactorApplied { get; set; } // As per your SQL INT type

        [Required]
        public int QuantityInBaseUnits { get; set; } // As per your SQL INT type

        [Column(TypeName = "money")]
        public decimal? CostPricePerBaseUnit { get; set; }

        [Column(TypeName = "money")]
        public decimal? SalePricePerTransactedUnit { get; set; }

        [StringLength(500)] // Assuming you add a Notes column to your SQL
        public string? Notes { get; set; }

        // Navigation properties
        [ForeignKey("ItemID")]
        public virtual Item Item { get; set; }

        [ForeignKey("ItemDetailID_Transaction")]
        public virtual ItemDetail? ItemDetail { get; set; } // Associated ItemDetail for the transaction

        [ForeignKey("UserID")]
        public virtual User User { get; set; } // User who performed the transaction

        [ForeignKey("UnitIDTransacted")]
        public virtual Unit TransactedUnit { get; set; } // Unit used in the transaction
    }
}