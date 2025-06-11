// File: Controllers/SalesController.cs
using Microsoft.AspNetCore.Mvc;
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Services;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using System;
using System.ComponentModel.DataAnnotations; // For Math.Ceiling

namespace ECommerce.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Secure all sale operations
    public class SalesController : ControllerBase
    {
        private readonly ISaleService _saleService;
        private readonly ILogger<SalesController> _logger;
        public SalesController(ISaleService saleService, ILogger<SalesController> logger)
        {
            _saleService = saleService;
            _logger = logger;
        }

        // GET: api/Sales
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SaleReadDto>>> GetSales([FromQuery] SaleQueryParameters queryParams)
        {
            var (sales, totalCount) = await _saleService.GetAllSalesAsync(queryParams);

            Response.Headers.Append("X-Pagination-TotalCount", totalCount.ToString());
            Response.Headers.Append("X-Pagination-PageSize", queryParams.PageSize.ToString());
            Response.Headers.Append("X-Pagination-CurrentPage", queryParams.PageNumber.ToString());
            Response.Headers.Append("X-Pagination-TotalPages", ((int)Math.Ceiling((double)totalCount / queryParams.PageSize)).ToString());

            return Ok(sales);
        }

        // GET: api/Sales/{id}
        [HttpGet("{id:int}")]
        public async Task<ActionResult<SaleReadDto>> GetSale(int id)
        {
            var saleDto = await _saleService.GetSaleByIdAsync(id);
            if (saleDto == null)
            {
                return NotFound(new { message = $"Sale with ID {id} not found." });
            }
            return Ok(saleDto);
        }

        // GET: api/Sales/code/{saleCode}
        [HttpGet("code/{saleCode}")]
        public async Task<ActionResult<SaleReadDto>> GetSaleByCode(string saleCode)
        {
            var saleDto = await _saleService.GetSaleByCodeAsync(saleCode);
            if (saleDto == null)
            {
                return NotFound(new { message = $"Sale with code '{saleCode}' not found." });
            }
            return Ok(saleDto);
        }

        // POST: api/Sales
        [HttpPost]
        public async Task<ActionResult<SaleReadDto>> PostSale(SaleCreateDto saleDto)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int performingUserId))
            {
                return Unauthorized(new { message = "User authentication error." });
            }

            var createdSaleDto = await _saleService.CreateSaleAsync(saleDto, performingUserId);
            if (createdSaleDto == null)
            {
                // This could be due to various reasons: invalid supplier/stock/item,
                // insufficient stock, or code generation conflict.
                return BadRequest(new { message = "Failed to create sale. Please check data, item availability, or try again." });
            }
            return CreatedAtAction(nameof(GetSale), new { id = createdSaleDto.ID }, createdSaleDto);
        }

        // DELETE: api/Sales/5 (Soft Delete)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSale(int id)
        {
            var success = await _saleService.SoftDeleteSaleAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"Sale with ID {id} not found or could not be disabled." });
            }
            return NoContent();
        }
        [HttpGet("sales-performance-by-item")]
        public async Task<ActionResult<IEnumerable<SalesPerformanceByItemDto>>> GetSalesPerformanceByItemReport(
            [FromQuery, Required] DateTime startDate,
            [FromQuery, Required] DateTime endDate)
        {
            if (startDate > endDate)
            {
                return BadRequest(new { message = "Start date cannot be after end date." });
            }

            _logger.LogInformation("Received request for Sales Performance By Item Report from {StartDate} to {EndDate}", startDate, endDate);
            var reportData = await _saleService.GetSalesPerformanceByItemReportAsync(startDate, endDate);

            return Ok(reportData);
        }
    }
}