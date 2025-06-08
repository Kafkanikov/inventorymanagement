using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;

namespace ECommerce.Server.Interfaces;

public interface IAccountService
{
    Task<IEnumerable<AccountReadDto>> GetAllAccountsAsync(bool includeDisabled, string? categoryFilter, string? subCategoryFilter, string? nameFilter);
    Task<AccountReadDto?> GetAccountByIdAsync(int id);
    Task<AccountWithJournalEntriesDto?> GetAccountWithJournalEntriesAsync(int accountId, AccountJournalEntryQueryParametersDto journalParams);
    Task<AccountReadDto?> CreateAccountAsync(AccountWriteDto accountDto);
    Task<bool> UpdateAccountAsync(int id, AccountWriteDto accountDto);
    Task<bool> SoftDeleteAccountAsync(int id);
    Task<bool> AccountExistsAsync(int id);
    Task<IEnumerable<AccountCategoryReadDto>> GetAllAccountCategoriesAsync(); 
    Task<IEnumerable<AccountSubCategoryReadDto>> GetAllAccountSubCategoriesAsync();
    Task<AccountCategoryReadDto?> CreateAccountCategoryAsync(AccountCategoryWriteDto categoryDto);
    Task<AccountSubCategoryReadDto?> CreateAccountSubCategoryAsync(AccountSubCategoryWriteDto subCategoryDto);
}