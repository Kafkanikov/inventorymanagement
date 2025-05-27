using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace ECommerce.Server.Controllers
{
    [Route("api/accountingreports")]
    [ApiController]
    [Authorize] // Secure this endpoint
    public class AccountingReportController : ControllerBase
    {
        private readonly IAccountingReportService _accountingReportService;
        private readonly ILogger<AccountingReportController> _logger;


        public AccountingReportController(IAccountingReportService accountingReportService, ILogger<AccountingReportController> logger)
        {
            _accountingReportService = accountingReportService;
            _logger = logger;
        }

        [HttpGet("balancesheet")]
        public async Task<ActionResult<BalanceSheetDataDto>> GetBalanceSheet([FromQuery] BalanceSheetRequestParams requestParams)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            _logger.LogInformation("Received request for Balance Sheet: AsOfDate={AsOfDate}, ReportCurrency={ReportCurrency}, Rate={Rate}",
               requestParams.AsOfDate, requestParams.ReportCurrency, requestParams.KhrToReportCurrencyExchangeRate);


            try
            {
                var balanceSheetData = await _accountingReportService.GetBalanceSheetAsync(requestParams);
                if (balanceSheetData == null)
                {
                    _logger.LogWarning("Balance sheet data returned null from service for request: {@RequestParams}", requestParams);
                    return NotFound(new { message = "Could not generate balance sheet data, or no data available." });
                }
                return Ok(balanceSheetData);
            }
            catch (ArgumentException argEx)
            {
                _logger.LogError(argEx, "Argument exception while generating balance sheet for request: {@RequestParams}", requestParams);
                return BadRequest(new { message = argEx.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred while generating the balance sheet for request: {@RequestParams}", requestParams);
                // In a production environment, you might not want to return the full ex.Message
                return StatusCode(500, new { message = "An unexpected error occurred. Please try again later." });
            }
        }
        [HttpGet("trialbalance")]
        public async Task<ActionResult<TrialBalanceReportDto>> GetTrialBalance([FromQuery] TrialBalanceRequestParams requestParams)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            _logger.LogInformation("Received request for Trial Balance: AsOfDate={AsOfDate}, ReportCurrency={ReportCurrency}, Rate={Rate}",
                requestParams.AsOfDate, requestParams.ReportCurrency, requestParams.KhrToReportCurrencyExchangeRate);

            try
            {
                var trialBalanceData = await _accountingReportService.GetTrialBalanceAsync(requestParams);
                if (trialBalanceData == null) // Should be handled by service returning a DTO even if no accounts
                {
                    _logger.LogWarning("Trial balance data returned null from service for request: {@RequestParams}", requestParams);
                    return NotFound(new { message = "Could not generate trial balance data." });
                }
                return Ok(trialBalanceData);
            }
            catch (ArgumentException argEx)
            {
                _logger.LogError(argEx, "Argument exception while generating trial balance for request: {@RequestParams}", requestParams);
                return BadRequest(new { message = argEx.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred while generating the trial balance for request: {@RequestParams}", requestParams);
                return StatusCode(500, new { message = "An unexpected error occurred. Please try again later." });
            }
        }
    }
}