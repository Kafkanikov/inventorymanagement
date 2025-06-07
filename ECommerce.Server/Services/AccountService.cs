using ECommerce.Server.Data;
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Data.Entities.ECommerce.Server.Data.Entities;
using ECommerce.Server.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ECommerce.Server.Services
{
    public class AccountService : IAccountService
    {
        private readonly EcommerceDbContext _context;
        private readonly ILogger<AccountService> _logger;

        public AccountService(EcommerceDbContext context, ILogger<AccountService> logger)
        {
            _context = context;
            _logger = logger;
        }

        private static AccountReadDto MapToReadDto(Account account)
        {
            return new AccountReadDto
            {
                ID = account.ID,
                AccountNumber = account.AccountNumber,
                Name = account.Name,
                CategoryID = account.CategoryID,
                CategoryName = account.AccountCategory?.Name ?? "N/A",
                SubCategoryID = account.SubCategoryID,
                SubCategoryName = account.AccountSubCategory?.Name,
                NormalBalance = account.NormalBalance,
                Disabled = account.Disabled
            };
        }
        public async Task<IEnumerable<AccountCategoryReadDto>> GetAllAccountCategoriesAsync()
        {
            return await _context.AccountCategories
                .OrderBy(ac => ac.Name)
                .Select(ac => new AccountCategoryReadDto { ID = ac.ID, Name = ac.Name })
                .ToListAsync();
        }

        public async Task<IEnumerable<AccountSubCategoryReadDto>> GetAllAccountSubCategoriesAsync()
        {
            return await _context.AccountSubCategories
                .OrderBy(sc => sc.Name)
                .Select(sc => new AccountSubCategoryReadDto { ID = sc.ID, Code = sc.Code, Name = sc.Name })
                .ToListAsync();
        }


        public async Task<IEnumerable<AccountReadDto>> GetAllAccountsAsync(bool includeDisabled, string? categoryFilter, string? subCategoryFilter, string? nameFilter)
        {
            var query = _context.Accounts
                .Include(a => a.AccountCategory)
                .Include(a => a.AccountSubCategory)
                .AsQueryable();

            if (!includeDisabled)
            {
                query = query.Where(a => !a.Disabled);
            }
            if (!string.IsNullOrEmpty(categoryFilter) && int.TryParse(categoryFilter, out int catId))
            {
                query = query.Where(a => a.CategoryID == catId);
            }
            if (!string.IsNullOrEmpty(subCategoryFilter) && int.TryParse(subCategoryFilter, out int subCatId))
            {
                query = query.Where(a => a.SubCategoryID == subCatId);
            }
            if (!string.IsNullOrEmpty(nameFilter))
            {
                query = query.Where(a => a.Name.Contains(nameFilter) || a.AccountNumber.Contains(nameFilter));
            }


            return await query
                .OrderBy(a => a.AccountNumber)
                .Select(a => MapToReadDto(a))
                .ToListAsync();
        }

        public async Task<AccountReadDto?> GetAccountByIdAsync(int id)
        {
            var account = await _context.Accounts
                .Include(a => a.AccountCategory)
                .Include(a => a.AccountSubCategory)
                .FirstOrDefaultAsync(a => a.ID == id);

            return account == null ? null : MapToReadDto(account);
        }

        public async Task<AccountWithJournalEntriesDto?> GetAccountWithJournalEntriesAsync(int accountId, AccountJournalEntryQueryParametersDto journalParams)
        {
            var account = await _context.Accounts
                .Include(a => a.AccountCategory)
                .Include(a => a.AccountSubCategory)
                .FirstOrDefaultAsync(a => a.ID == accountId);

            if (account == null) return null;

            var journalEntriesQuery = _context.JournalEntries
                .Include(je => je.JournalPage) // For Date, Ref, Source etc.
                    .ThenInclude(jp => jp.User) // For Username
                .Where(je => je.Account == account.AccountNumber); // Filter by AccountNumber

            // Apply date filters from journalParams
            if (journalParams.StartDate.HasValue)
            {
                journalEntriesQuery = journalEntriesQuery.Where(je => je.JournalPage.CreatedAt.Date >= journalParams.StartDate.Value.Date);
            }
            if (journalParams.EndDate.HasValue)
            {
                journalEntriesQuery = journalEntriesQuery.Where(je => je.JournalPage.CreatedAt.Date <= journalParams.EndDate.Value.Date);
            }
            if (!string.IsNullOrWhiteSpace(journalParams.RefContains))
            {
                journalEntriesQuery = journalEntriesQuery.Where(je => je.Ref != null && je.Ref.Contains(journalParams.RefContains) ||
                                                                    (je.JournalPage.Ref != null && je.JournalPage.Ref.Contains(journalParams.RefContains)));
            }


            var totalJournalEntries = await journalEntriesQuery.CountAsync();
            var journalEntries = await journalEntriesQuery
                .OrderByDescending(je => je.JournalPage.CreatedAt)
                .ThenByDescending(je => je.ID)
                .Skip((journalParams.PageNumber - 1) * journalParams.PageSize)
                .Take(journalParams.PageSize)
                .Select(je => new JournalPostReadDto
                {
                    ID = je.ID,
                    AccountNumber = je.Account, // This is the account number of the *other* side for context, or just the account itself. For account ledger, it is the account itself
                    AccountName = je.AccountEntity.Name, // This is the name of the account this entry belongs to.
                    Ref = je.Ref ?? je.JournalPage.Ref, // Entry specific ref, fallback to page ref
                    Description = je.Description ?? je.JournalPage.Description,
                    Debit = je.Debit,
                    Credit = je.Credit,
                    // Include JournalPage info
                    JournalPageID = je.JournalPageID,
                    JournalPageDate = je.JournalPage.CreatedAt,
                    JournalPageSource = je.JournalPage.Source,
                    JournalPageUser = je.JournalPage.User.Username
                })
                .ToListAsync();

            var totalPages = (int)Math.Ceiling((double)totalJournalEntries / journalParams.PageSize);

            return new AccountWithJournalEntriesDto
            {
                ID = account.ID,
                AccountNumber = account.AccountNumber,
                Name = account.Name,
                CategoryID = account.CategoryID,
                CategoryName = account.AccountCategory?.Name ?? "N/A",
                SubCategoryID = account.SubCategoryID,
                SubCategoryName = account.AccountSubCategory?.Name,
                NormalBalance = account.NormalBalance,
                Disabled = account.Disabled,
                JournalEntries = journalEntries,
                JournalEntriesTotalCount = totalJournalEntries,
                JournalEntriesPageNumber = journalParams.PageNumber,
                JournalEntriesPageSize = journalParams.PageSize,
                JournalEntriesTotalPages = totalPages
            };
        }


        public async Task<AccountReadDto?> CreateAccountAsync(AccountWriteDto accountDto)
        {
            if (await _context.Accounts.AnyAsync(a => a.AccountNumber == accountDto.AccountNumber))
            {
                _logger.LogWarning("Attempted to create account with duplicate AccountNumber: {AccountNumber}", accountDto.AccountNumber);
                return null; // Account number (Code) must be unique
            }
            if (!await _context.AccountCategories.AnyAsync(ac => ac.ID == accountDto.CategoryID))
            {
                _logger.LogWarning("Invalid CategoryID: {CategoryID} during account creation.", accountDto.CategoryID);
                return null;
            }
            if (accountDto.SubCategoryID.HasValue && !await _context.AccountSubCategories.AnyAsync(sc => sc.ID == accountDto.SubCategoryID.Value))
            {
                _logger.LogWarning("Invalid SubCategoryID: {SubCategoryID} during account creation.", accountDto.SubCategoryID);
                return null;
            }

            var account = new Account
            {
                AccountNumber = accountDto.AccountNumber,
                Name = accountDto.Name,
                CategoryID = accountDto.CategoryID,
                SubCategoryID = accountDto.SubCategoryID,
                NormalBalance = accountDto.NormalBalance,
                Disabled = false // New accounts are active by default
            };

            _context.Accounts.Add(account);
            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Created new account ID {ID}, AccountNumber: {AccountNumber}", account.ID, account.AccountNumber);
                return MapToReadDto(account); // Need to load navigation properties for CategoryName etc.
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error creating account with AccountNumber: {AccountNumber}", accountDto.AccountNumber);
                return null;
            }
        }

        public async Task<bool> UpdateAccountAsync(int id, AccountWriteDto accountDto)
        {
            var account = await _context.Accounts.FindAsync(id);
            if (account == null) return false;

            // Check if AccountNumber is being changed and if the new one already exists
            if (account.AccountNumber != accountDto.AccountNumber &&
                await _context.Accounts.AnyAsync(a => a.AccountNumber == accountDto.AccountNumber && a.ID != id))
            {
                _logger.LogWarning("Attempted to update account ID {ID} with duplicate AccountNumber: {AccountNumber}", id, accountDto.AccountNumber);
                return false;
            }
            if (!await _context.AccountCategories.AnyAsync(ac => ac.ID == accountDto.CategoryID))
            {
                _logger.LogWarning("Invalid CategoryID: {CategoryID} during account update for ID {ID}.", accountDto.CategoryID, id);
                return false;
            }
            if (accountDto.SubCategoryID.HasValue && !await _context.AccountSubCategories.AnyAsync(sc => sc.ID == accountDto.SubCategoryID.Value))
            {
                _logger.LogWarning("Invalid SubCategoryID: {SubCategoryID} during account update for ID {ID}.", accountDto.SubCategoryID, id);
                return false;
            }

            account.AccountNumber = accountDto.AccountNumber;
            account.Name = accountDto.Name;
            account.CategoryID = accountDto.CategoryID;
            account.SubCategoryID = accountDto.SubCategoryID;
            account.NormalBalance = accountDto.NormalBalance;
            account.Disabled = accountDto.Disabled;

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Updated account ID {ID}", id);
                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await AccountExistsAsync(id)) return false;
                _logger.LogError("Concurrency error updating account ID {ID}", id);
                throw;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error updating account ID {ID} with AccountNumber: {AccountNumber}", id, accountDto.AccountNumber);
                return false;
            }
        }

        public async Task<bool> SoftDeleteAccountAsync(int id)
        {
            var account = await _context.Accounts.FindAsync(id);
            if (account == null) return false;

            // Check if account has any journal entries. If so, prevent deletion.
            // This is a business rule, not a DB constraint typically.
            bool hasJournalEntries = await _context.JournalEntries.AnyAsync(je => je.Account == account.AccountNumber);
            if (hasJournalEntries)
            {
                _logger.LogWarning("Attempted to delete account ID {ID} ({AccountNumber}) which has journal entries.", id, account.AccountNumber);
                // Optionally, you could throw an exception or return a specific error code/message
                // For now, we just return false to indicate deletion was not performed.
                return false;
            }

            account.Disabled = true;
            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Soft deleted account ID {ID}", id);
                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await AccountExistsAsync(id)) return false;
                _logger.LogError("Concurrency error soft deleting account ID {ID}", id);
                throw;
            }
        }

        public async Task<bool> AccountExistsAsync(int id)
        {
            return await _context.Accounts.AnyAsync(e => e.ID == id);
        }
    }
}