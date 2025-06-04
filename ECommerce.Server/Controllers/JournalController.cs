using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic; 
using System.Security.Claims;

namespace ECommerce.Server.Controllers
{
    [Route("api/journal")]
    [ApiController]
    [Authorize] 
    public class JournalController : ControllerBase
    {
        private readonly IJournalService _journalService;
        private readonly ILogger<JournalController> _logger;


        public JournalController(IJournalService journalService, ILogger<JournalController> logger)
        {
            _journalService = journalService;
            _logger = logger;

        }

        // POST: api/journal/page
        [HttpPost("page")]
        public async Task<ActionResult<JournalPageReadDto>> CreateJournalPage([FromBody] JournalPageCreateDto journalPageDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int performingUserId))
            {
                _logger.LogWarning("CreateJournalPage: User ID claim is missing or invalid.");
                return Unauthorized(new { message = "User authentication error: User ID claim is missing or invalid." });
            }

            try
            {
                _logger.LogInformation("CreateJournalPage: Attempting to create journal page for UserID {PerformingUserId}.", performingUserId);
                var createdJournalPage = await _journalService.CreateJournalPageAsync(journalPageDto, performingUserId);

                if (createdJournalPage == null)
                {
                    // This case should ideally be handled by exceptions from the service for specific failures
                    _logger.LogWarning("CreateJournalPage: JournalService returned null for UserID {PerformingUserId}.", performingUserId);
                    return BadRequest(new { message = "Failed to create journal page. Please check input data and ensure all accounts are valid and entries are balanced." });
                }

                // Return 201 Created with the location of the new resource and the resource itself
                return CreatedAtAction(nameof(GetJournalPage), new { pageId = createdJournalPage.ID }, createdJournalPage);
            }
            catch (ArgumentException argEx)
            {
                _logger.LogWarning(argEx, "CreateJournalPage: ArgumentException for UserID {PerformingUserId}.", performingUserId);
                return BadRequest(new { message = argEx.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CreateJournalPage: An unexpected error occurred for UserID {PerformingUserId}.", performingUserId);
                return StatusCode(500, new { message = "An unexpected error occurred while creating the journal page." });
            }
        }

        // GET: api/journal/page/{pageId}
        [HttpGet("page/{pageId:int}")]
        public async Task<ActionResult<JournalPageReadDto>> GetJournalPage(int pageId)
        {
            _logger.LogInformation("GetJournalPage: Attempting to fetch journal page ID {PageId}.", pageId);
            var journalPageDto = await _journalService.GetJournalPageByIdAsync(pageId);
            if (journalPageDto == null)
            {
                _logger.LogWarning("GetJournalPage: Journal page ID {PageId} not found.", pageId);
                return NotFound(new { message = $"Journal page with ID {pageId} not found." });
            }
            return Ok(journalPageDto);
        }

        // GET: api/journal
        [HttpGet]
        public async Task<ActionResult<IEnumerable<JournalPageReadDto>>> GetGeneralLedger([FromQuery] JournalLedgerQueryParametersDto queryParams)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            _logger.LogInformation("GetGeneralLedger: Attempting to fetch general ledger with params: {@QueryParams}", queryParams);
            try
            {
                var (pages, totalCount) = await _journalService.GetAllJournalPagesAsync(queryParams);

                Response.Headers.Append("X-Pagination-TotalCount", totalCount.ToString());
                Response.Headers.Append("X-Pagination-PageSize", queryParams.PageSize.ToString());
                Response.Headers.Append("X-Pagination-CurrentPage", queryParams.PageNumber.ToString());
                Response.Headers.Append("X-Pagination-TotalPages", ((int)Math.Ceiling((double)totalCount / queryParams.PageSize)).ToString());

                _logger.LogInformation("GetGeneralLedger: Returning {Count} journal pages. Total available: {TotalCount}", pages.Count(), totalCount);
                return Ok(pages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetGeneralLedger: An unexpected error occurred with params: {@QueryParams}", queryParams);
                return StatusCode(500, new { message = "An unexpected error occurred while fetching the general ledger." });
            }
        }
    }
}
