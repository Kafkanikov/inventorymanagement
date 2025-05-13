// File: Data/Entities/Item.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Server.Data.Entities
{
    [Table("Item")]
    public class Item
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ID { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        public int? CategoryID { get; set; } // Nullable Foreign Key

        [Required]
        public int BaseUnitID { get; set; } // Required Foreign Key

        public int? Qty { get; set; } // As per your schema; consider its exact purpose

        [Required]
        public bool Disabled { get; set; } = false;

        // Navigation properties
        [ForeignKey("CategoryID")]
        public virtual Category? Category { get; set; }

        [ForeignKey("BaseUnitID")]
        public virtual Unit BaseUnit { get; set; } // Should not be nullable if BaseUnitID is required

        public virtual ICollection<ItemDetail> ItemDetails { get; set; } = new List<ItemDetail>();
        public virtual ICollection<InventoryLog> InventoryLogs { get; set; } = new List<InventoryLog>();
    }
}