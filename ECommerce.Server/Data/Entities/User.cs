using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Server.Data.Entities
{
    [Table("Users")]
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; } // Matches your SQL PK 'Id'

        [Required]
        [StringLength(100)]
        public string Username { get; set; }

        [Required]
        public string Password { get; set; } // This will store the HASHED password

        [StringLength(255)] // NVARCHAR(MAX) is large, consider a more reasonable limit if appropriate
        [EmailAddress] // Optional: Basic email format validation
        public string? Email { get; set; }

        [Required]
        public bool Disabled { get; set; } = false;

    }
}
