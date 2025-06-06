﻿using ECommerce.Server.Data.DTO.Request;
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
        private readonly ILogger<JournalService> _logger;

        public JournalService(EcommerceDbContext context, IUserService userService, ILogger<JournalService> logger)
        {
            _context = context;
            _userService = userService;
            _logger = logger;
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
            return await GetJournalPageByIdAsync(journalPage.ID);
        }

        public async Task<JournalPageReadDto?> GetJournalPageByIdAsync(int journalPageId)
        {
            _logger.LogInformation("JournalService.GetJournalPageByIdAsync: Fetching page ID {JournalPageId}.", journalPageId);
            var journalPage = await _context.JournalPages
                .Include(jp => jp.User)
                .Include(jp => jp.JournalEntries)
                    .ThenInclude(je => je.AccountEntity)
                .AsNoTracking()
                .FirstOrDefaultAsync(jp => jp.ID == journalPageId);

            if (journalPage == null)
            {
                _logger.LogWarning("JournalService.GetJournalPageByIdAsync: Page ID {JournalPageId} not found.", journalPageId);
                return null;
            }

            return new JournalPageReadDto
            {
                ID = journalPage.ID,
                CurrencyID = journalPage.CurrencyID,
                UserID = journalPage.UserID,
                Username = journalPage.User?.Username, // User can be null if UserID is nullable and not set
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
                IsBalanced = Math.Abs(journalPage.JournalEntries.Sum(e => e.Debit) - journalPage.JournalEntries.Sum(e => e.Credit)) < 0.0001m
            };
        }

        public async Task<(IEnumerable<JournalPageReadDto> Pages, int TotalCount)> GetAllJournalPagesAsync(JournalLedgerQueryParametersDto queryParams)
        {
            _logger.LogInformation("JournalService.GetAllJournalPagesLedgerAsync: Fetching journal pages with params: {@QueryParams}", queryParams);

            var query = _context.JournalPages
                .Include(jp => jp.User) // For Username
                .Include(jp => jp.JournalEntries)
                    .ThenInclude(je => je.AccountEntity) // For AccountName
                .AsQueryable();

            if (!queryParams.IncludeDisabledPages)
            {
                query = query.Where(jp => !jp.Disabled);
            }
            if (queryParams.StartDate.HasValue)
            {
                query = query.Where(jp => jp.CreatedAt.Date >= queryParams.StartDate.Value.Date);
            }
            if (queryParams.EndDate.HasValue)
            {
                query = query.Where(jp => jp.CreatedAt.Date <= queryParams.EndDate.Value.Date);
            }
            if (!string.IsNullOrWhiteSpace(queryParams.RefContains))
            {
                query = query.Where(jp => jp.Ref != null && jp.Ref.Contains(queryParams.RefContains));
            }
            if (!string.IsNullOrWhiteSpace(queryParams.SourceContains))
            {
                query = query.Where(jp => jp.Source.Contains(queryParams.SourceContains));
            }
            if (!string.IsNullOrWhiteSpace(queryParams.DescriptionContains))
            {
                query = query.Where(jp => jp.Description.Contains(queryParams.DescriptionContains));
            }
            if (queryParams.UserId.HasValue)
            {
                query = query.Where(jp => jp.UserID == queryParams.UserId.Value);
            }

            var totalCount = await query.CountAsync();

            var journalPages = await query
                .OrderByDescending(jp => jp.CreatedAt) // Or by ID, or user preference
                .ThenByDescending(jp => jp.ID)
                .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
                .Take(queryParams.PageSize)
                .AsNoTracking()
                .ToListAsync();

            _logger.LogInformation("JournalService.GetAllJournalPagesLedgerAsync: Fetched {Count} journal pages out of {TotalCount} total.", journalPages.Count, totalCount);

            var resultDto = journalPages.Select(jp => new JournalPageReadDto
            {
                ID = jp.ID,
                CreatedAt = jp.CreatedAt,
                Ref = jp.Ref,
                Source = jp.Source,
                Description = jp.Description,
                Username = jp.User?.Username,
                UserID = jp.UserID,
                Disabled = jp.Disabled,
                TotalDebits = jp.JournalEntries.Sum(e => e.Debit),
                TotalCredits = jp.JournalEntries.Sum(e => e.Credit),
                JournalEntries = jp.JournalEntries.Select(je => new JournalPostReadDto
                {
                    ID = je.ID,
                    AccountNumber = je.Account,
                    AccountName = je.AccountEntity?.Name ?? "N/A",
                    Ref = je.Ref,
                    Description = je.Description,
                    Debit = je.Debit,
                    Credit = je.Credit
                }).ToList(),
                IsBalanced = Math.Abs(jp.JournalEntries.Sum(e => e.Debit) - jp.JournalEntries.Sum(e => e.Credit)) < 0.0001m
            }).ToList();

            return (resultDto, totalCount);
        }
    }
}
