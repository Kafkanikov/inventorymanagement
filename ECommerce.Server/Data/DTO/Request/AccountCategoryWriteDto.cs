using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.DTO.Request
{
    public class AccountCategoryWriteDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
    }
}
