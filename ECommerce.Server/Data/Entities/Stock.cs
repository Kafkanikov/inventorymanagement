using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.Entities
{
    [Table("Stock")]
    public class Stock
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ID { get; set; }

        [StringLength(50)]
        public string? Name { get; set; } // Nullable as per SQL. Consider if it should be required.

        [StringLength(1000)]
        public string? Address { get; set; } // Nullable

        public int? UserID { get; set; } // Nullable Foreign Key

        [Required]
        public bool Disabled { get; set; } = false; // Assuming we added this column

        // Navigation property
        [ForeignKey("UserID")]
        public virtual User? ManagedByUser { get; set; }
    }
}
