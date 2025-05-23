using ECommerce.Server.Data.Entities.ECommerce.Server.Data.Entities;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Server.Data.Entities
{
    [Table("AccCategory")]
    public class AccountCategory
    {
        [Key]
        public int ID { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; }
        public virtual ICollection<Account> Accounts { get; set; } = new List<Account>();
    }
}
