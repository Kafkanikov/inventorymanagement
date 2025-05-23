using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Server.Data.Entities
{
    [Table("PurchaseDetails")]
    public class PurchaseDetail
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ID { get; set; }

        [Required]
        [StringLength(50)]
        public string PurchaseCode { get; set; } // FK to Purchase.Code

        [Required]
        [StringLength(50)]
        public string ItemCode { get; set; } // FK to ItemDetails.Code

        public int? Qty { get; set; } 

        [Column(TypeName = "money")]
        public decimal? Cost { get; set; } 

        [ForeignKey("PurchaseCode")]
        [InverseProperty("PurchaseDetails")] // Helps EF Core understand the other side of the collection
        public virtual Purchase Purchase { get; set; }

        // This navigation to ItemDetail via ItemCode might be tricky for EF Core
        // without ItemDetails.Code being a defined Principal Key for the relationship.
        // We might need to fetch ItemDetail separately in the service based on ItemCode.
        // For now, let's include it and see how EF Core handles it or if configuration is needed.
        [ForeignKey("ItemCode")]
        public virtual ItemDetail ItemDetail { get; set; }
    }
}