using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using ECommerce.Server.Data.Entities.ECommerce.Server.Data.Entities;

namespace ECommerce.Server.Data.Entities
{
    [Table("AccountSubCategory")] // Matches your table name
    public class AccountSubCategory
    {
        [Key]
        public int ID { get; set; } // Matches your SQL

        [StringLength(50)] // Assuming 'Code' column in your SQL like "1000"
        public string? Code { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } // e.g., "Cash", "Inventory", "Cost", "Sale"
        public virtual ICollection<Account> Accounts { get; set; } = new List<Account>();
    }
}
