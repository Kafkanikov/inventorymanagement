using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.DTO.Request
{
    public class StockWriteDto // Used for both Create and Update
    {
        [Required(ErrorMessage = "Stock location name is required.")] // Making Name required in DTO
        [StringLength(50, ErrorMessage = "Stock name cannot be longer than 50 characters.")]
        public string Name { get; set; }

        [StringLength(1000, ErrorMessage = "Address cannot be longer than 1000 characters.")]
        public string? Address { get; set; }

        public int? UserID { get; set; } // ID of the user managing this stock location

        // 'Disabled' property is not included here.
        // It's set to false by default on creation and managed by a specific delete endpoint.
    }
}
