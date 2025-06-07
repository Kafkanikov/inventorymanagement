using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ECommerce.Server.Controllers
{
    [Route("api/accounts")]
    [ApiController]
    [Authorize] // Secure this controller
    public class AccountsController : ControllerBase
    {
        private readonly IAccountService _accountService;
        private readonly ILogger<AccountsController> _logger;

        public AccountsController(IAccountService accountService, ILogger<AccountsController> logger)
        {
            _accountService = accountService;
            _logger = logger;
        }

        // GET: api/accounts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AccountReadDto>>> GetAccounts(
            [FromQuery] bool includeDisabled = false,
            [FromQuery] string? categoryFilter = null,
            [FromQuery] string? subCategoryFilter = null,
            [FromQuery] string? nameFilter = null
            )
        {
            _logger.LogInformation("Fetching all accounts. IncludeDisabled: {IncludeDisabled}, Category: {Category}, SubCategory: {SubCategory}, Name: {Name}",
                                   includeDisabled, categoryFilter, subCategoryFilter, nameFilter);
            var accounts = await _accountService.GetAllAccountsAsync(includeDisabled, categoryFilter, subCategoryFilter, nameFilter);
            return Ok(accounts);
        }

        // GET: api/accounts/categories
        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<AccountCategoryReadDto>>> GetAccountCategories()
        {
            var categories = await _accountService.GetAllAccountCategoriesAsync();
            return Ok(categories);
        }

        // GET: api/accounts/subcategories
        [HttpGet("subcategories")]
        public async Task<ActionResult<IEnumerable<AccountSubCategoryReadDto>>> GetAccountSubCategories()
        {
            var subCategories = await _accountService.GetAllAccountSubCategoriesAsync();
            return Ok(subCategories);
        }

        // GET: api/accounts/{id}
        [HttpGet("{id:int}")]
        public async Task<ActionResult<AccountReadDto>> GetAccount(int id)
        {
            _logger.LogInformation("Attempting to fetch account with ID {ID}", id);
            var account = await _accountService.GetAccountByIdAsync(id);
            if (account == null)
            {
                _logger.LogWarning("Account with ID {ID} not found.", id);
                return NotFound(new { message = $"Account with ID {id} not found." });
            }
            return Ok(account);
        }

        // GET: api/accounts/{id}/journalentries
        [HttpGet("{id:int}/journalentries")]
        public async Task<ActionResult<AccountWithJournalEntriesDto>> GetAccountWithJournalEntries(int id, [FromQuery] AccountJournalEntryQueryParametersDto journalParams)
        {
            _logger.LogInformation("Fetching account with journal entries for AccountID: {AccountID}, Params: {@Params}", id, journalParams);
            if (journalParams.PageSize <= 0) journalParams.PageSize = 10;
            if (journalParams.PageNumber <= 0) journalParams.PageNumber = 1;

            var accountWithEntries = await _accountService.GetAccountWithJournalEntriesAsync(id, journalParams);
            if (accountWithEntries == null)
            {
                _logger.LogWarning("Account with ID {ID} not found when fetching with journal entries.", id);
                return NotFound(new { message = $"Account with ID {id} not found." });
            }
            return Ok(accountWithEntries);
        }


        // POST: api/accounts
        [HttpPost]
        public async Task<ActionResult<AccountReadDto>> PostAccount([FromBody] AccountWriteDto accountDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            _logger.LogInformation("Attempting to create account with AccountNumber: {AccountNumber}", accountDto.AccountNumber);
            var createdAccount = await _accountService.CreateAccountAsync(accountDto);
            if (createdAccount == null)
            {
                _logger.LogWarning("Failed to create account with AccountNumber: {AccountNumber}. It might already exist or data is invalid.", accountDto.AccountNumber);
                return Conflict(new { message = $"Failed to create account. Account number '{accountDto.AccountNumber}' may already exist or referenced category/subcategory is invalid." });
            }
            return CreatedAtAction(nameof(GetAccount), new { id = createdAccount.ID }, createdAccount);
        }

        // PUT: api/accounts/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> PutAccount(int id, [FromBody] AccountWriteDto accountDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            _logger.LogInformation("Attempting to update account ID {ID}", id);
            var success = await _accountService.UpdateAccountAsync(id, accountDto);
            if (!success)
            {
                if (!await _accountService.AccountExistsAsync(id))
                {
                    _logger.LogWarning("Account with ID {ID} not found for update.", id);
                    return NotFound(new { message = $"Account with ID {id} not found for update." });
                }
                _logger.LogWarning("Failed to update account ID {ID}. AccountNumber might conflict or data is invalid.", id);
                return Conflict(new { message = "Failed to update account. Account number may conflict or data is invalid." });
            }
            return NoContent();
        }

        // DELETE: api/accounts/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAccount(int id)
        {
            _logger.LogInformation("Attempting to soft delete account ID {ID}", id);
            var success = await _accountService.SoftDeleteAccountAsync(id);
            if (!success)
            {
                if (!await _accountService.AccountExistsAsync(id))
                {
                    _logger.LogWarning("Account with ID {ID} not found for deletion.", id);
                    return NotFound(new { message = $"Account with ID {id} not found for deletion." });
                }
                _logger.LogWarning("Failed to soft delete account ID {ID}. It might have journal entries or other dependencies.", id);
                return BadRequest(new { message = $"Could not disable account with ID {id}. It may have associated journal entries." });
            }
            return NoContent();
        }
    }
}