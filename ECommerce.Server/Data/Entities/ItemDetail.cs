// File: Data/Entities/ItemDetail.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Server.Data.Entities
{
    [Table("ItemDetails")]
    public class ItemDetail
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ID { get; set; }

        [Required]
        [StringLength(50)]
        public string Code { get; set; } // Specific SKU/barcode for this package

        [Required]
        public int ItemID { get; set; }

        [Required]
        public int UnitID { get; set; }

        [Required]
        [Column("Qty")] // Maps to the 'Qty' column in SQL
        public int ConversionFactor { get; set; } // How many base units are in this UnitID for this ItemID

        [Column(TypeName = "money")]
        public decimal? Price { get; set; } // Selling price for one of this UnitID

        [Required]
        public bool Disabled { get; set; } = false;

        // Navigation properties
        [ForeignKey("ItemID")]
        public virtual Item Item { get; set; }

        [ForeignKey("UnitID")]
        public virtual Unit Unit { get; set; }

        // Optional: Navigation to InventoryLog if linking directly
        // public virtual ICollection<InventoryLog> InventoryLogs { get; set; } = new List<InventoryLog>();
    }
}