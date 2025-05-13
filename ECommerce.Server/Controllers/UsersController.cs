using Microsoft.AspNetCore.Mvc;
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Services;
using System.Collections.Generic;
using System.Threading.Tasks;
using ECommerce.Server.Interfaces;

namespace ECommerce.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserReadDto>>> GetUsers([FromQuery] bool includeDisabled = false) // Pass parameter to service
        {
            var users = await _userService.GetAllUsersAsync(includeDisabled);
            return Ok(users);
        }

        // GET: api/Users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<UserReadDto>> GetUser(int id)
        {
            var userDto = await _userService.GetUserByIdAsync(id);
            if (userDto == null)
            {
                return NotFound(new { message = $"User with ID {id} not found." });
            }
            return Ok(userDto);
        }

        // POST: api/Users
        [HttpPost]
        public async Task<ActionResult<UserReadDto>> PostUser(UserCreateDto userCreateDto)
        {
            var createdUserDto = await _userService.CreateUserAsync(userCreateDto);
            if (createdUserDto == null)
            {
                return Conflict(new { message = $"Failed to create user. Username '{userCreateDto.Username}' may already exist or another error occurred." });
            }
            return CreatedAtAction(nameof(GetUser), new { id = createdUserDto.Id }, createdUserDto);
        }

        // PUT: api/Users/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(int id, UserUpdateDto userUpdateDto)
        {
            var success = await _userService.UpdateUserAsync(id, userUpdateDto);
            if (!success)
            {
                if (!await _userService.UserExistsAsync(id))
                {
                    return NotFound(new { message = $"User with ID {id} not found for update." });
                }
                return Conflict(new { message = "Failed to update user. Username may already be taken by another user, or account is disabled and cannot be updated, or a concurrency issue occurred." });
            }
            return NoContent();
        }

        // DELETE: api/Users/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id) // This now performs a soft delete via the service
        {
            var success = await _userService.DeleteUserAsync(id);
            if (!success)
            {
                if (!await _userService.UserExistsAsync(id)) // Check if it's truly not found
                {
                    return NotFound(new { message = $"User with ID {id} not found for deletion." });
                }
                return NotFound(new { message = $"User with ID {id} not found or could not be disabled." });
            }
            return NoContent();
        }
    }
}