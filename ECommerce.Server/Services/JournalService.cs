using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Data.Entities;
using ECommerce.Server.Data;
using ECommerce.Server.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace ECommerce.Server.Services
{
    public class JournalService : IJournalService
    {
        private readonly EcommerceDbContext _context;
        private readonly IUserService _userService; 

        public JournalService(EcommerceDbContext context, IUserService userService)
        {
            _context = context;
            _userService = userService;
        }

        public async Task<JournalPageReadDto?> CreateJournalPageAsync(JournalPageCreateDto journalPageDto, int performingUserId)
        {
            // Validate performing user
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == performingUserId && !u.Disabled);
            if (user == null)
            {
                throw new ArgumentException("Performing user not found or is disabled.", nameof(performingUserId));
            }

            // Basic validation for balanced entries (debits must equal credits)
            decimal totalDebits = journalPageDto.JournalEntries.Sum(e => e.Debit);
            decimal totalCredits = journalPageDto.JournalEntries.Sum(e => e.Credit);

            if (totalDebits != totalCredits)
            {
                throw new ArgumentException("Journal entries are not balanced. Total debits must equal total credits.");
            }
            if (totalDebits == 0 && totalCredits == 0 && journalPageDto.JournalEntries.Any())
            {
                throw new ArgumentException("Journal entries cannot all be zero if entries exist.");
            }


            var journalPage = new JournalPage
            {
                UserID = performingUserId,
                CurrencyID = journalPageDto.CurrencyID, // Assuming you handle currency validation if it's not nullable
                Ref = journalPageDto.Ref,
                Source = journalPageDto.Source,
                CreatedAt = DateTime.UtcNow,
                Description = journalPageDto.Description,
                Disabled = false
            };

            var journalPostEntities = new List<JournalPost>();

            foreach (var entryDto in journalPageDto.JournalEntries)
            {
                // Validate Account
                var account = await _context.Accounts
                                        .FirstOrDefaultAsync(a => a.AccountNumber == entryDto.AccountNumber);
                if (account == null)
                {
                    throw new ArgumentException($"Account with number '{entryDto.AccountNumber}' not found or is a control account.");
                }
                if (entryDto.Debit < 0 || entryDto.Credit < 0)
                {
                    throw new ArgumentException("Debit and Credit amounts cannot be negative.");
                }
                if (entryDto.Debit > 0 && entryDto.Credit > 0)
                {
                    throw new ArgumentException("A single journal entry cannot have both debit and credit amounts.");
                }


                journalPostEntities.Add(new JournalPost
                {
                    JournalPage = journalPage, // EF Core will link this
                    Account = entryDto.AccountNumber, // Storing AccountNumber (Code)
                    Description = entryDto.Description,
                    Debit = entryDto.Debit,
                    Credit = entryDto.Credit,
                    Ref = entryDto.Ref
                });
            }


            journalPage.JournalEntries = journalPostEntities;

            try
            {
                _context.JournalPages.Add(journalPage);
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException dbEx)
            {
                Console.WriteLine($"JournalService.CreateJournalPageAsync: DbUpdateException: {dbEx.ToString()}");
                Console.WriteLine($"JournalService.CreateJournalPageAsync: Inner Exception: {dbEx.InnerException?.ToString()}");
                throw;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"JournalService.CreateJournalPageAsync: Generic Exception: {ex.ToString()}");
                throw;
            }
            return await GetJournalPageReadDtoByIdAsync(journalPage.ID);
        }

        // Helper method to construct the ReadDTO (can be expanded)
        private async Task<JournalPageReadDto?> GetJournalPageReadDtoByIdAsync(int journalPageId)
        {
            var journalPage = await _context.JournalPages
                .Include(jp => jp.User)
                .Include(jp => jp.JournalEntries)
                    .ThenInclude(je => je.AccountEntity) // To get Account Name
                        .ThenInclude(acc => acc.AccountCategory) // To get Account Category if needed for AccountName construction
                .FirstOrDefaultAsync(jp => jp.ID == journalPageId);

            if (journalPage == null) return null;

            var userDto = await _userService.GetUserByIdAsync(journalPage.UserID ?? 0);


            return new JournalPageReadDto
            {
                ID = journalPage.ID,
                CurrencyID = journalPage.CurrencyID,
                UserID = journalPage.UserID,
                Username = userDto?.Username,
                Ref = journalPage.Ref,
                Source = journalPage.Source,
                CreatedAt = journalPage.CreatedAt,
                Description = journalPage.Description,
                Disabled = journalPage.Disabled,
                JournalEntries = journalPage.JournalEntries.Select(je => new JournalPostReadDto
                {
                    ID = je.ID,
                    AccountNumber = je.Account,
                    AccountName = je.AccountEntity?.Name ?? "N/A",
                    Description = je.Description,
                    Debit = je.Debit,
                    Credit = je.Credit,
                    Ref = je.Ref
                }).ToList(),
                TotalDebits = journalPage.JournalEntries.Sum(e => e.Debit),
                TotalCredits = journalPage.JournalEntries.Sum(e => e.Credit),
                IsBalanced = journalPage.JournalEntries.Sum(e => e.Debit) == journalPage.JournalEntries.Sum(e => e.Credit)
            };
        }
    }
}
