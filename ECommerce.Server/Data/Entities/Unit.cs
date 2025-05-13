using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.Entities
{
    [Table("Unit")]
    public class Unit
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ID { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        public bool Disabled { get; set; } = false; // Assuming we added this

        // Optional: Navigation properties
        // public virtual ICollection<Item> ItemsAsBaseUnit { get; set; } = new List<Item>();
        // public virtual ICollection<ItemDetail> ItemDetails { get; set; } = new List<ItemDetail>();
        // public virtual ICollection<InventoryLog> InventoryLogs { get; set; } = new List<InventoryLog>();
    }
}
