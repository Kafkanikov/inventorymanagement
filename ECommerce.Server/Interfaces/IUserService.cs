using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;

namespace ECommerce.Server.Interfaces;

public interface IUserService
{
    Task<IEnumerable<UserReadDto>> GetAllUsersAsync(bool includeDisabled = false);
    Task<UserReadDto?> GetUserByIdAsync(int id);
    Task<UserReadDto?> CreateUserAsync(UserCreateDto userDto); // Handles password hashing
    Task<bool> UpdateUserAsync(int id, UserUpdateDto userDto); // Does not update password
    Task<bool> DeleteUserAsync(int id); // Physical delete (consider soft delete)
    Task<bool> UserExistsAsync(int id);
    Task<UserReadDto?> AuthenticateAsync(string username, string password);
    // Potentially: Task<bool> ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto);
    
}