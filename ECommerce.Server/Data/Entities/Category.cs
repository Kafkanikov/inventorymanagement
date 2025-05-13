using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Server.Data.Entities 
{
    [Table("Category")] // Explicitly map to the "Category" table
    public class Category
    {
        [Key] // Marks ID as the primary key
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)] // Indicates it's an identity column
        public int ID { get; set; }

        [Required(ErrorMessage = "Category name is required.")]
        [StringLength(100, ErrorMessage = "Category name cannot be longer than 100 characters.")]
        // The UNIQUE constraint will be enforced by the database. EF Core can also be configured for this.
        public string Name { get; set; }

        [StringLength(255, ErrorMessage = "Description cannot be longer than 255 characters.")]
        public string? Description { get; set; } // Nullable string

        [Required] // BIT DEFAULT 0 in SQL means it's essentially not nullable from C# perspective
        public bool Disabled { get; set; } = false; // Default value in C#
    }
}

