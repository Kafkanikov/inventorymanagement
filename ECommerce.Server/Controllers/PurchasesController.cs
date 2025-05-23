// File: Controllers/PurchasesController.cs
using Microsoft.AspNetCore.Mvc;
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Services;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Security.Claims; // For UserID
using Microsoft.AspNetCore.Authorization;

namespace ECommerce.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Secure all purchase operations
    public class PurchasesController : ControllerBase
    {
        private readonly IPurchaseService _purchaseService;

        public PurchasesController(IPurchaseService purchaseService)
        {
            _purchaseService = purchaseService;
        }

        // GET: api/Purchases
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PurchaseReadDto>>> GetPurchases([FromQuery] PurchaseQueryParameters queryParams)
        {
            var (purchases, totalCount) = await _purchaseService.GetAllPurchasesAsync(queryParams);

            Response.Headers.Append("X-Pagination-TotalCount", totalCount.ToString());
            Response.Headers.Append("X-Pagination-PageSize", queryParams.PageSize.ToString());
            Response.Headers.Append("X-Pagination-CurrentPage", queryParams.PageNumber.ToString());
            Response.Headers.Append("X-Pagination-TotalPages", ((int)Math.Ceiling((double)totalCount / queryParams.PageSize)).ToString());

            return Ok(purchases);
        }

        // GET: api/Purchases/{id}
        [HttpGet("{id:int}")] // Get by integer ID
        public async Task<ActionResult<PurchaseReadDto>> GetPurchase(int id)
        {
            var purchaseDto = await _purchaseService.GetPurchaseByIdAsync(id);
            if (purchaseDto == null)
            {
                return NotFound(new { message = $"Purchase with ID {id} not found." });
            }
            return Ok(purchaseDto);
        }

        // GET: api/Purchases/code/{purchaseCode}
        [HttpGet("code/{purchaseCode}")] // Get by string code
        public async Task<ActionResult<PurchaseReadDto>> GetPurchaseByCode(string purchaseCode)
        {
            var purchaseDto = await _purchaseService.GetPurchaseByCodeAsync(purchaseCode);
            if (purchaseDto == null)
            {
                return NotFound(new { message = $"Purchase with code '{purchaseCode}' not found." });
            }
            return Ok(purchaseDto);
        }


        // POST: api/Purchases
        [HttpPost]
        public async Task<ActionResult<PurchaseReadDto>> PostPurchase(PurchaseCreateDto purchaseDto)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int performingUserId))
            {
                return Unauthorized(new { message = "User authentication error." });
            }
            try
            {
                var createdPurchaseDto = await _purchaseService.CreatePurchaseAsync(purchaseDto, performingUserId);
                if (createdPurchaseDto == null)
                {
                    return BadRequest(new { message = "Failed to create purchase. Unknown error." });
                }
                return CreatedAtAction(nameof(GetPurchase), new { id = createdPurchaseDto.ID }, createdPurchaseDto);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "An unexpected error occurred." });
            }
        }

        // DELETE: api/Purchases/5 (Soft Delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePurchase(int id)
        {
            var success = await _purchaseService.SoftDeletePurchaseAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"Purchase with ID {id} not found or could not be disabled." });
            }
            return NoContent();
        }
    }
}