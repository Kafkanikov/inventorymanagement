using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.DTO.Request
{
    public class ItemWriteDto
    {
        [Required(ErrorMessage = "Item name is required.")]
        [StringLength(100, ErrorMessage = "Item name cannot be longer than 100 characters.")]
        public string Name { get; set; }

        public int? CategoryID { get; set; } // Optional

        [Required(ErrorMessage = "Base Unit ID is required.")]
        public int BaseUnitID { get; set; }

        public int? Qty { get; set; } // Allow setting this direct Qty field

        // 'Disabled' is not included here; managed by create (default false) and soft delete.
    }
}