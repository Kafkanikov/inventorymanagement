using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.DTO.Request
{
    public class AccountWriteDto
    {
        [Required]
        [StringLength(20)]
        public string AccountNumber { get; set; } // Maps to Code in entity

        [Required]
        [StringLength(150)]
        public string Name { get; set; }

        [Required]
        public int CategoryID { get; set; }

        public int? SubCategoryID { get; set; }

        [Required]
        [StringLength(10)]
        [RegularExpression("^(debit|credit)$", ErrorMessage = "Normal Balance must be 'Debit' or 'Credit'.")]
        public string NormalBalance { get; set; } 

        public bool Disabled { get; set; } = false; // For updates, create will default to false
    }
}