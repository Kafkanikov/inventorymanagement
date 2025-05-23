using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Server.Data.Entities
{
    [Table("Purchase")]
    public class Purchase
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ID { get; set; }

        [Required]
        [StringLength(50)]
        public string Code { get; set; } // Unique, auto-generated

        [Column(TypeName = "date")] // To match SQL 'DATE' type
        public DateTime? Date { get; set; }

        public int? UserID { get; set; } // Nullable FK

        public int? SupplierID { get; set; } // Nullable FK

        public int? StockID { get; set; } // Nullable FK to Stock location

        [Column(TypeName = "money")]
        public decimal? Cost { get; set; } // Total cost of the purchase, calculated from details

        [Required]
        public bool Disabled { get; set; } = false;

        // Navigation properties
        [ForeignKey("UserID")]
        public virtual User? User { get; set; }

        [ForeignKey("SupplierID")]
        public virtual Supplier? Supplier { get; set; }

        [ForeignKey("StockID")]
        public virtual Stock? StockLocation { get; set; } 

        public virtual ICollection<PurchaseDetail> PurchaseDetails { get; set; } = new List<PurchaseDetail>();
    }
}