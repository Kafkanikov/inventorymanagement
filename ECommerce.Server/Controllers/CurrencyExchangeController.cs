using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ECommerce.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CurrencyExchangeController : ControllerBase
    {
        private readonly ICurrencyExchangeService _exchangeService;

        public CurrencyExchangeController(ICurrencyExchangeService exchangeService)
        {
            _exchangeService = exchangeService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CurrencyExchangeReadDto>>> GetExchanges([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] bool includeDisabled = false)
        {
            var exchanges = await _exchangeService.GetExchangesAsync(startDate, endDate, includeDisabled);
            return Ok(exchanges);
        }

        [HttpPost]
        public async Task<ActionResult<CurrencyExchangeReadDto>> CreateExchange(CurrencyExchangeWriteDto exchangeDto)
        {
            if (exchangeDto == null || exchangeDto.FromAmount <= 0 || exchangeDto.Rate <= 0)
            {
                return BadRequest("Invalid exchange data.");
            }
            try
            {
                var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
                var newExchange = await _exchangeService.CreateExchangeAsync(exchangeDto, userId);
                return CreatedAtAction(nameof(GetExchanges), new { id = newExchange.Id }, newExchange);
            }
            catch (KeyNotFoundException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DisableExchange(int id)
        {
            var success = await _exchangeService.DisableExchangeAsync(id);
            if (!success)
            {
                return NotFound();
            }
            return NoContent();
        }
    }
}
