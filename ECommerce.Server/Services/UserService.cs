using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Data.Entities;
using ECommerce.Server.Data;
using ECommerce.Server.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Server.Services
{
    public class UserService : IUserService
    {
        private readonly EcommerceDbContext _context;

        public UserService(EcommerceDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<UserReadDto>> GetAllUsersAsync(bool includeDisabled = false)
        {
            var query = _context.Users.AsQueryable();

            if (!includeDisabled)
            {
                query = query.Where(u => !u.Disabled); // Filter out disabled users by default
            }

            return await query
                .OrderBy(u => u.Username)
                .Select(u => new UserReadDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    Disabled = u.Disabled // Include the disabled status in the DTO
                })
                .ToListAsync();
        }

        public async Task<UserReadDto?> GetUserByIdAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return null;

            return new UserReadDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Disabled = user.Disabled
            };
        }

        public async Task<UserReadDto?> CreateUserAsync(UserCreateDto userDto)
        {
            // Check if username already exists
            if (await _context.Users.AnyAsync(u => u.Username == userDto.Username))
            {
                // Consider throwing a custom DuplicateUsernameException
                return null; // Indicate username conflict
            }

            var user = new User
            {
                Username = userDto.Username,
                Password = userDto.Password, 
                Email = userDto.Email,
                Disabled = false
            };

            _context.Users.Add(user);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException /* ex */)
            {
                return null; // General creation failure
            }

            return new UserReadDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Disabled = user.Disabled
            };
        }

        public async Task<bool> UpdateUserAsync(int id, UserUpdateDto userDto)
        {
            var userToUpdate = await _context.Users.FindAsync(id);
            if (userToUpdate == null) return false;

            // Check if the new username is being taken by another user
            if (userToUpdate.Username != userDto.Username &&
                await _context.Users.AnyAsync(u => u.Username == userDto.Username && u.Id != id))
            {
                return false; // Username conflict
            }

            userToUpdate.Username = userDto.Username;
            userToUpdate.Email = string.IsNullOrWhiteSpace(userDto.Email) ? null : userDto.Email;
            userToUpdate.Disabled = userDto.Disabled;
            
            _context.Entry(userToUpdate).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await UserExistsAsync(id)) return false;
                throw;
            }
            catch (DbUpdateException /* ex */) // For potential unique constraint on Email if added
            {
                return false;
            }
            return true;
        }

        public async Task<bool> DeleteUserAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return false; // Not found
            }

            if (user.Disabled) // Already disabled
            {
                return true; // Idempotent: already in the desired state
            }

            user.Disabled = true; // Set the flag
            _context.Entry(user).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await UserExistsAsync(id)) return false;
                throw;
            }
            return true;
        }

        public async Task<bool> UserExistsAsync(int id)
        {
            return await _context.Users.AnyAsync(e => e.Id == id);
        }
        public async Task<UserReadDto?> AuthenticateAsync(string username, string password)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
            {
                return null; // User not found
            }

            // **CRITICAL: Check if user account is disabled before verifying password**
            if (user.Disabled)
            {
                return null; // Account is disabled
            }

            bool isPasswordValid = password == user.Password; 

            if (!isPasswordValid)
            {
                return null; // Invalid password
            }

            return new UserReadDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Disabled = user.Disabled // Will be false here
            };
        }
    }
}
