// File: Controllers/AccountingReportsController.cs
using Microsoft.AspNetCore.Mvc;
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Services;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace ECommerce.Server.Controllers
{
    [Route("api/accounting/reports")]
    [ApiController]
    [Authorize] 
    public class AccountingReportsController : ControllerBase
    {
        private readonly IAccountingReportService _reportService;

        public AccountingReportsController(IAccountingReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpPost("balance-sheet")] // Using POST to allow for a request body with parameters
        public async Task<ActionResult<BalanceSheetDto>> GetBalanceSheet(BalanceSheetRequestDto request)
        {
            if (request.AsOfDate == DateTime.MinValue)
            {
                request.AsOfDate = DateTime.UtcNow; // Default to today if not provided
            }
            if (string.IsNullOrEmpty(request.ReportCurrency)) request.ReportCurrency = "USD";
            if (request.KHRtoReportCurrencyExchangeRate <= 0) request.KHRtoReportCurrencyExchangeRate = 4150;


            var balanceSheetData = await _reportService.GetBalanceSheetAsync(request);
            if (balanceSheetData == null)
            {
                return NotFound("Could not generate balance sheet data.");
            }
            return Ok(balanceSheetData);
        }

        [HttpPost("simplified-balance-sheet")]
        public async Task<ActionResult<List<SimplifiedBalanceLineDto>>> GetSimplifiedBalanceSheet(BalanceSheetRequestDto request)
        {
            if (request.AsOfDate == DateTime.MinValue) request.AsOfDate = DateTime.UtcNow;

            // Assuming your service interface and implementation has GetSimplifiedBalanceSheetDataAsync
            // For demonstration, I'm calling the method directly from the provided class structure
            var accountingService = HttpContext.RequestServices.GetRequiredService<IAccountingReportService>();
            if (accountingService is AccountingReportService concreteService) // Check actual type for example
            {
                var data = await concreteService.GetSimplifiedBalanceSheetDataAsync(request);
                if (data == null || !data.Any())
                {
                    return NotFound("No data found for the simplified balance sheet.");
                }
                return Ok(data);
            }
            return StatusCode(500, "Service configuration error"); // Should not happen with proper DI
        }
    }
}