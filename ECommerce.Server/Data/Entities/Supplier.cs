using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.Entities
{
    [Table("Supplier")]
    public class Supplier
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ID { get; set; }

        [StringLength(50)]
        public string? Name { get; set; } // Nullable as per SQL

        [StringLength(200)]
        public string? Address { get; set; } // Nullable

        [StringLength(50)]
        public string? Tel { get; set; } // Nullable

        [StringLength(50)]
        // Consider adding [EmailAddress] attribute if you want format validation by default
        public string? Email { get; set; } // Nullable

        [Required]
        public bool Disabled { get; set; } = false;
    }
}
