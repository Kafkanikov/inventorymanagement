using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.DTO.Request
{
    public class JournalPostCreateDto
    {
        [Required(ErrorMessage = "Account number is required.")]
        [StringLength(20)]
        public string AccountNumber { get; set; } // Corresponds to Account.Code/AccountNumber

        [StringLength(500)]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Debit amount is required.")]
        [Range(0, (double)decimal.MaxValue, ErrorMessage = "Debit must be non-negative.")]
        public decimal Debit { get; set; }

        [Required(ErrorMessage = "Credit amount is required.")]
        [Range(0, (double)decimal.MaxValue, ErrorMessage = "Credit must be non-negative.")]
        public decimal Credit { get; set; }

        [StringLength(50)]
        public string? Ref { get; set; } // Optional reference for the specific post
    }
}