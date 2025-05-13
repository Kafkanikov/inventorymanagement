using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.DTO.Request
{
    public class UserCreateDto
    {
        [Required]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 100 characters.")]
        public string Username { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters long.")]
        // In a real app, you'd have more complex password policies (uppercase, number, symbol)
        public string Password { get; set; } // Plain text password from client

        private string? _email;

        [EmailAddress]
        [StringLength(255)]
        public string? Email
        {
            get => _email;
            set => _email = string.IsNullOrWhiteSpace(value) ? null : value;
        }
    }
}
