using Microsoft.AspNetCore.Mvc;
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Services;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization; // If needed
using System; // For Math.Ceiling

namespace ECommerce.Server.Controllers
{
    [Route("api/stocklevels")] // Changed route for clarity
    [ApiController]
    // [Authorize] // Optional: Secure these endpoints
    public class StockLevelsController : ControllerBase
    {
        private readonly IStockQueryService _stockQueryService;

        public StockLevelsController(IStockQueryService stockQueryService)
        {
            _stockQueryService = stockQueryService;
        }

        // GET: api/stocklevels
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ItemStockReadDto>>> GetAllItemsStock([FromQuery] StockQueryParameters queryParams)
        {
            var (itemsStock, totalCount) = await _stockQueryService.GetAllItemsStockDetailsAsync(queryParams);

            Response.Headers.Append("X-Pagination-TotalCount", totalCount.ToString());
            Response.Headers.Append("X-Pagination-PageSize", queryParams.PageSize.ToString());
            Response.Headers.Append("X-Pagination-CurrentPage", queryParams.PageNumber.ToString());
            Response.Headers.Append("X-Pagination-TotalPages", ((int)Math.Ceiling((double)totalCount / queryParams.PageSize)).ToString());

            return Ok(itemsStock);
        }

        // GET: api/stocklevels/{itemId}
        [HttpGet("{itemId}")]
        public async Task<ActionResult<ItemStockReadDto>> GetItemStock(int itemId)
        {
            var itemStockDto = await _stockQueryService.GetItemStockDetailsAsync(itemId);
            if (itemStockDto == null)
            {
                return NotFound(new { message = $"Stock details for Item ID {itemId} not found." });
            }
            return Ok(itemStockDto);
        }
    }
}