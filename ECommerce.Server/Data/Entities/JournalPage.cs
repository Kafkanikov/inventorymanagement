// File: Data/Entities/JournalPage.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Server.Data.Entities
{
    [Table("JournalPage")]
    public class JournalPage
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ID { get; set; } // Corresponds to your SQL ID

        public int? CurrencyID { get; set; } // Assuming CurrencyID from your trigger example, make it nullable or handle FK
        // [ForeignKey("CurrencyID")]
        // public virtual Currency? Currency { get; set; } // If you have a Currency entity

        public int? UserID { get; set; } // Corresponds to your SQL UserID, assuming it might be null based on some contexts
        [ForeignKey("UserID")]
        public virtual User? User { get; set; }

        [StringLength(50)]
        public string? Ref { get; set; } // Corresponds to your SQL Ref

        [StringLength(50)]
        public string? Source { get; set; } // Corresponds to your SQL Source

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Corresponds to your SQL CreatedAt

        [StringLength(500)]
        public string? Description { get; set; } // Corresponds to your SQL Description

        public bool Disabled { get; set; } = false; // Corresponds to your SQL Disabled

        // Navigation property for all entries in this journal page
        public virtual ICollection<JournalPost> JournalEntries { get; set; } = new List<JournalPost>();
    }
}