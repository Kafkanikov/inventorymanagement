// File: Data/Entities/JournalEntry.cs
using ECommerce.Server.Data.Entities.ECommerce.Server.Data.Entities;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Server.Data.Entities
{
    [Table("JournalPost")] 
    public class JournalEntry
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ID { get; set; } // Corresponds to your SQL ID

        [Required]
        public int JournalPageID { get; set; } // FK to JournalPage.ID

        [Required]
        [StringLength(20)] // Assuming AccountNumber max length
        public string Account { get; set; } // Stores the AccountNumber (e.g., "2100020000")

        [StringLength(50)]
        public string? Ref { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        [Column(TypeName = "money")]
        public decimal Debit { get; set; } 

        [Required]
        [Column(TypeName = "money")]
        public decimal Credit { get; set; } 

        [ForeignKey("JournalPageID")]
        public virtual JournalPage JournalPage { get; set; }

        [ForeignKey("Account")]
        public virtual Account AccountEntity { get; set; }
    }
}