// File: Controllers/AuthController.cs
using ECommerce.Server.Data; // For EcommerceDbContext - will be removed
using ECommerce.Server.Data.DTO.Response; // For UserReadDto (assuming UserInfo is this)
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
// Remove: using Microsoft.EntityFrameworkCore; // Will be handled by service
using System.Security.Claims;
using ECommerce.Server.Data.DTO.Request;
using Microsoft.AspNetCore.Authorization;
// Remove: using ECommerce.Server.Data.Entities; // User entity interaction will be in service
// Remove: using Microsoft.AspNetCore.Identity.Data; // Not used here for custom auth
// Using aliases for request DTOs as per your original code
using LoginRequest = ECommerce.Server.Data.DTO.Request.LoginRequest;
// Add:
using ECommerce.Server.Services; // For IUserService
using System.Collections.Generic; // For List<Claim>
using System.Threading.Tasks;
using ECommerce.Server.Interfaces; // For Task

namespace ECommerce.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        // Remove: private readonly EcommerceDbContext _context;
        private readonly IUserService _userService; // Inject IUserService

        public AuthController(IUserService userService) // Modified constructor
        {
            _userService = userService;
        }

        // --- Login Endpoint ---
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // 1. Authenticate user via service
            var userDto = await _userService.AuthenticateAsync(request.Username, request.Password);

            if (userDto == null)
            {
                // Authentication failed (user not found or password incorrect)
                return Unauthorized(new { message = "Invalid credentials" });
            }

            // 2. Create Claims (using UserReadDto from service)
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userDto.Id.ToString()), // User ID from DTO
                new Claim(ClaimTypes.Name, userDto.Username),                // Username from DTO
                new Claim(ClaimTypes.Email, userDto.Email ?? string.Empty),   // Optional Email from DTO
                // Add other claims as needed (e.g., roles if you implement them)
            };

            // 3. Create Claims Identity and Principal
            var claimsIdentity = new ClaimsIdentity(
                claims, CookieAuthenticationDefaults.AuthenticationScheme);

            var authProperties = new AuthenticationProperties
            {
                AllowRefresh = true,
                IsPersistent = false, 
            };

            // 4. Sign in the user (creates the session cookie)
            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(claimsIdentity),
                authProperties);

            // 5. Return success response (the UserReadDto is suitable here)
            return Ok(userDto); // userDto is already your UserInfo equivalent
        }

        [HttpPost("logout")]
        [Authorize] // Ensures only authenticated users can logout
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Ok(new { message = "Logged out successfully" });
        }

        // --- GetAuthStatus Endpoint ---
        [HttpGet("status")]
        // [Authorize] // Keep Authorize if you only want logged-in users to check status
        public IActionResult GetAuthStatus() // User is accessible even without [Authorize] if cookie is present
        {
            if (User.Identity != null && User.Identity.IsAuthenticated)
            {
                var userDto = new UserReadDto // Construct UserReadDto from claims
                {
                    Id = int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0,
                    Username = User.FindFirstValue(ClaimTypes.Name) ?? string.Empty,
                    Email = User.FindFirstValue(ClaimTypes.Email)
                };
                return Ok(new { isAuthenticated = true, user = userDto });
            }
            return Ok(new { isAuthenticated = false });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserCreateDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Map RegisterRequest to UserCreateDto (they are very similar)
            var userCreateDto = new UserCreateDto
            {
                Username = request.Username,
                Password = request.Password,
                Email = request.Email
            };

            var createdUserDto = await _userService.CreateUserAsync(userCreateDto);

            if (createdUserDto == null)
            {
                // Username might already exist, or another creation error occurred
                return Conflict(new { message = "Username already exists or registration failed." });
            }

            // Optionally, log in the user immediately after registration
            // (You would repeat the claims creation and SignInAsync steps from the Login method here)
            // For now, just return the created user info.

            // Return UserReadDto (which is UserInfo equivalent)
            return CreatedAtAction(nameof(GetAuthStatus), /* routeValues for GetAuthStatus if needed */ createdUserDto);
            // Note: GetAuthStatus doesn't take an ID.
            // A better CreatedAtAction would point to a "GetUser" endpoint if you had one in AuthController
            // or a GetUser endpoint in UsersController. For simplicity:
            // return Ok(createdUserDto); // Or return a 201 with the object
        }


        // --- Unauthorized/Forbidden Endpoints --- (No changes needed from your original code)
        [HttpGet("unauthorized")]
        public IActionResult UnauthorizedAccess()
        {
            return Unauthorized(new { message = "Authentication required." });
        }

        [HttpGet("forbidden")]
        public IActionResult ForbiddenAccess()
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "You do not have permission to access this resource." });
        }
    }
}