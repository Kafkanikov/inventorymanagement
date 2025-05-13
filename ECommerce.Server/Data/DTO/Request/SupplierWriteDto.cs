using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.DTO.Request
{
    public class SupplierWriteDto
    {
        [Required(ErrorMessage = "Supplier name is required.")]
        [StringLength(50, ErrorMessage = "Supplier name cannot be longer than 50 characters.")]
        public string Name { get; set; }

        [StringLength(200, ErrorMessage = "Address cannot be longer than 200 characters.")]
        public string? Address { get; set; }

        [StringLength(50, ErrorMessage = "Telephone number cannot be longer than 50 characters.")]
        public string? Tel { get; set; }

        [EmailAddress(ErrorMessage = "Invalid email address format.")]
        [StringLength(50, ErrorMessage = "Email cannot be longer than 50 characters.")]
        public string? Email { get; set; }
    }
}
