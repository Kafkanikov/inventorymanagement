using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Server.Data.Entities
{
    [Table("SaleDetails")]
    public class SaleDetail
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ID { get; set; }

        [Required]
        [StringLength(50)]
        public string SaleCode { get; set; } // FK to Sale.Code

        [Required]
        [StringLength(50)]
        public string ItemCode { get; set; } // FK to ItemDetails.Code

        public int? Qty { get; set; }

        [Column(TypeName = "money")]
        public decimal? Cost { get; set; } // Assumed to be Total Selling Price for this line

        // Navigation properties
        [ForeignKey("SaleCode")]
        [InverseProperty("SaleDetails")]
        public virtual Sale Sale { get; set; }

        [ForeignKey("ItemCode")]
        public virtual ItemDetail ItemDetail { get; set; }
        
        [Column(TypeName = "money")]
        public decimal? CalculatedCOGS { get; set; }
    }
}