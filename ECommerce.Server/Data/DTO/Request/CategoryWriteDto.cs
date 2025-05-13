using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.DTO.Request
{
    public class CategoryWriteDto
    {
        [Required(ErrorMessage = "Category name is required.")]
        [StringLength(100, ErrorMessage = "Category name cannot be longer than 100 characters.")]
        public string Name { get; set; }

        [StringLength(255, ErrorMessage = "Description cannot be longer than 255 characters.")]
        public string? Description { get; set; }
    }
}
