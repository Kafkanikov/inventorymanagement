using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Server.Data.Entities
{
    [Table("CurrencyExchange")]
    public class CurrencyExchange
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ID { get; set; }

        [Required]
        public DateTime Timestamp { get; set; }

        [Required]
        public string ExchangeOption { get; set; } // "USDtoKHR" or "KHRtoUSD"

        [Required]
        [Column(TypeName = "decimal(18, 4)")]
        public decimal FromAmount { get; set; }

        [Required]
        [Column(TypeName = "decimal(18, 4)")]
        public decimal ToAmount { get; set; }

        [Required]
        [Column(TypeName = "decimal(18, 4)")]
        public decimal Rate { get; set; }

        public string Description { get; set; }

        [Required]
        public int UserID { get; set; }
        public User User { get; set; }

        public bool Disabled { get; set; } = false;
    }
}
