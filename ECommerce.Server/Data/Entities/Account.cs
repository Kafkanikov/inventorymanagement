namespace ECommerce.Server.Data.Entities
{
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Collections.Generic;

    namespace ECommerce.Server.Data.Entities
    {
        [Table("Account")] // Matches your table name
        public class Account
        {
            [Key]
            public int ID { get; set; } // SQL: ID

            [Required]
            [StringLength(20)]
            [Column("Code")] 
            public string AccountNumber { get; set; }

            [Required]
            [StringLength(150)]
            public string Name { get; set; } 

            [Required]
            public int CategoryID { get; set; } 

            public int? SubCategoryID { get; set; } 

            [Required]
            [StringLength(10)]
            [Column("Bal")] 
            public string NormalBalance { get; set; } 

            // Inferred property for currency (parsed from Name or ideally a separate column)
            [NotMapped] // This won't be in the DB unless you add a column
            public string? CurrencyCode { get; set; } 

            // Navigation properties
            [ForeignKey("CategoryID")]
            public virtual AccountCategory AccountCategory { get; set; }

            [ForeignKey("SubCategoryID")]
            public virtual AccountSubCategory? AccountSubCategory { get; set; }

            public virtual ICollection<JournalEntry> JournalEntries { get; set; } = new List<JournalEntry>();
        }
    }
}
