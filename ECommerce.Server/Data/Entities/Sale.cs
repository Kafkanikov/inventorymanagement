using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Server.Data.Entities
{
    [Table("Sale")]
    public class Sale
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ID { get; set; }

        [Required]
        [StringLength(50)]
        public string Code { get; set; } // Unique, auto-generated

        [Column(TypeName = "date")]
        public DateTime? Date { get; set; }

        public int? UserID { get; set; } // Nullable FK (though sales usually have a user)

        public int? StockID { get; set; } // Nullable FK to Stock location items are sold from

        [Column(TypeName = "money")]
        public decimal? Price { get; set; } // Total price of the sale, calculated from details

        [Required]
        public bool Disabled { get; set; } = false;

        // Navigation properties
        [ForeignKey("UserID")]
        public virtual User? User { get; set; }

        [ForeignKey("StockID")]
        public virtual Stock? StockLocation { get; set; }

        [Column(TypeName = "money")]
        public decimal? TotalCOGS { get; set; }

        public virtual ICollection<SaleDetail> SaleDetails { get; set; } = new List<SaleDetail>();
    }
}