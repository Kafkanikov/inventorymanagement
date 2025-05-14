// File: Controllers/InventoryLogsController.cs
using Microsoft.AspNetCore.Mvc;
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Services;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Security.Claims;
using ECommerce.Server.Interfaces; // For UserID
using Microsoft.AspNetCore.Authorization; // If you want to authorize controller/actions

namespace ECommerce.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize] // Good to authorize access to logs
    public class InventoryLogsController : ControllerBase
    {
        private readonly IInventoryLogService _inventoryLogService;
        private readonly IUserService _userService; // To check if user exists if UserID not from claims

        public InventoryLogsController(IInventoryLogService inventoryLogService, IUserService userService)
        {
            _inventoryLogService = inventoryLogService;
            _userService = userService;
        }

        // GET: api/InventoryLogs
        [HttpGet]
        public async Task<ActionResult<IEnumerable<InventoryLogReadDto>>> GetInventoryLogs([FromQuery] InventoryLogQueryParameters queryParams)
        {
            var (logs, totalCount) = await _inventoryLogService.GetAllLogEntriesAsync(queryParams);

            // Standard way to return pagination info in headers
            Response.Headers.Append("X-Pagination-TotalCount", totalCount.ToString());
            Response.Headers.Append("X-Pagination-PageSize", queryParams.PageSize.ToString());
            Response.Headers.Append("X-Pagination-CurrentPage", queryParams.PageNumber.ToString());
            Response.Headers.Append("X-Pagination-TotalPages", ((int)Math.Ceiling((double)totalCount / queryParams.PageSize)).ToString());

            return Ok(logs);
        }

        // GET: api/InventoryLogs/5
        [HttpGet("{id}")]
        public async Task<ActionResult<InventoryLogReadDto>> GetInventoryLog(int id)
        {
            var logDto = await _inventoryLogService.GetLogEntryByIdAsync(id);
            if (logDto == null)
            {
                return NotFound(new { message = $"Inventory log entry with ID {id} not found." });
            }
            return Ok(logDto);
        }

        // POST: api/InventoryLogs (For manual entries like adjustments)
        [HttpPost]
        [Authorize] // << IMPORTANT: Secure this endpoint
        public async Task<ActionResult<InventoryLogReadDto>> PostInventoryLog(InventoryLogCreateDto logCreateDto)
        {
            // 1. Get the UserID from the authenticated user's claims
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int performingUserId))
            {
                // This should not happen if [Authorize] is working correctly and claims are properly set up during login.
                // It indicates an issue with the authentication setup or a non-standard token.
                return Unauthorized(new { message = "User authentication error: User ID claim is missing or invalid." });
            }

            // 2. Prevent API from creating log types handled by triggers (if this check is still desired here)
            if (logCreateDto.TransactionType == "Purchase" || logCreateDto.TransactionType == "Sale")
            {
                return BadRequest(new { message = "Purchase and Sale logs are created automatically by database triggers. Use this endpoint for other transaction types like adjustments." });
            }
            
            // 3. Call the service, passing the authenticated UserID
            var createdLogDto = await _inventoryLogService.CreateManualLogEntryAsync(logCreateDto, performingUserId);
            
            if (createdLogDto == null)
            {
                // The service returning null could mean various validation failures (invalid ItemID, UnitID, pricing issues, conversion factor problems, etc.)
                return BadRequest(new { message = "Failed to create inventory log entry. Please check input data and ensure all referenced entities are valid and active." });
            }

            return CreatedAtAction(nameof(GetInventoryLog), new { id = createdLogDto.LogID }, createdLogDto);
        }

        // NO PUT (Update) or DELETE endpoints for InventoryLog to maintain audit trail
    }
}