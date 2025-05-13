using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.DTO.Request
{
    public class UnitWriteDto
    {
        [Required(ErrorMessage = "Unit name is required.")]
        [StringLength(100, ErrorMessage = "Unit name cannot be longer than 100 characters.")]
        public string Name { get; set; }
    }
}
