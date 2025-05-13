using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StocksController : ControllerBase
    {
        private readonly IStockService _stockService;

        public StocksController(IStockService stockService)
        {
            _stockService = stockService;
        }

        // GET: api/Stocks
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StockReadDto>>> GetStocks([FromQuery] bool includeDisabled = false)
        {
            var stocks = await _stockService.GetAllStocksAsync(includeDisabled);
            return Ok(stocks);
        }

        // GET: api/Stocks/5
        [HttpGet("{id}")]
        public async Task<ActionResult<StockReadDto>> GetStock(int id)
        {
            var stockDto = await _stockService.GetStockByIdAsync(id);
            if (stockDto == null)
            {
                return NotFound(new { message = $"Stock location with ID {id} not found." });
            }
            return Ok(stockDto);
        }

        // POST: api/Stocks
        [HttpPost]
        public async Task<ActionResult<StockReadDto>> PostStock(StockWriteDto stockDto)
        {
            var createdStockDto = await _stockService.CreateStockAsync(stockDto);
            if (createdStockDto == null)
            {
                // Could be due to invalid UserID or future unique constraint violation handled by service
                return BadRequest(new { message = "Failed to create stock location. Ensure UserID is valid or name is unique if applicable." });
            }
            return CreatedAtAction(nameof(GetStock), new { id = createdStockDto.ID }, createdStockDto);
        }

        // PUT: api/Stocks/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutStock(int id, StockWriteDto stockDto)
        {
            var success = await _stockService.UpdateStockAsync(id, stockDto);
            if (!success)
            {
                // Could be due to not found, invalid UserID, or future unique constraint violation
                if (!await _stockService.StockExistsAsync(id))
                {
                    return NotFound(new { message = $"Stock location with ID {id} not found for update." });
                }
                return BadRequest(new { message = "Failed to update stock location. Ensure UserID is valid or name is unique if applicable." });
            }
            return NoContent();
        }

        // DELETE: api/Stocks/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStock(int id)
        {
            var success = await _stockService.SoftDeleteStockAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"Stock location with ID {id} not found for deletion." });
            }
            return NoContent();
        }
    }
}
