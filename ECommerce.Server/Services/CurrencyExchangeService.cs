using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Data.Entities;
using ECommerce.Server.Data;
using ECommerce.Server.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Server.Services
{
    public class CurrencyExchangeService : ICurrencyExchangeService
    {
        private readonly EcommerceDbContext _context;
        private readonly IJournalService _journalService;

        public CurrencyExchangeService(EcommerceDbContext context, IJournalService journalService)
        {
            _context = context;
            _journalService = journalService;
        }

        public async Task<CurrencyExchangeReadDto> CreateExchangeAsync(CurrencyExchangeWriteDto exchangeDto, int userId)
        {
            // 1. Determine currencies from the exchange option
            string fromCurrency = exchangeDto.ExchangeOption == "USDtoKHR" ? "USD" : "KHR";
            string toCurrency = exchangeDto.ExchangeOption == "USDtoKHR" ? "KHR" : "USD";

            // 2. Find the respective cash accounts based on bank location and currency
            var fromAccount = await _context.Accounts.FirstOrDefaultAsync(a => a.Name.Contains(exchangeDto.BankLocation) && a.Name.Contains(fromCurrency));
            var toAccount = await _context.Accounts.FirstOrDefaultAsync(a => a.Name.Contains(exchangeDto.BankLocation) && a.Name.Contains(toCurrency));

            if (fromAccount == null || toAccount == null)
            {
                throw new KeyNotFoundException($"Could not find one or both cash accounts for '{exchangeDto.BankLocation}' with currencies {fromCurrency}/{toCurrency}. Please check account setup.");
            }

            // 3. Find the FX position accounts
            var equivalencePositionAccount = await _context.Accounts.FirstOrDefaultAsync(a => a.Name.Contains("Equivalence Foreign Exchange Position Account") && a.Name.Contains(fromCurrency));
            var positionAccount = await _context.Accounts.FirstOrDefaultAsync(a => a.Name.Contains("Foreign Exchange Position Account") && a.Name.Contains(toCurrency));

            if (equivalencePositionAccount == null || positionAccount == null)
            {
                throw new KeyNotFoundException("FX position accounts not found. Please ensure 'Equivalence Foreign Exchange Position Account' and 'Foreign Exchange Position Account' are set up for both currencies.");
            }

            // 4. Calculate ToAmount based on the direction of exchange
            decimal toAmount = exchangeDto.ExchangeOption == "USDtoKHR"
                ? exchangeDto.FromAmount * exchangeDto.Rate
                : exchangeDto.FromAmount / exchangeDto.Rate;

            // 5. Create and save the primary exchange record
            var exchange = new CurrencyExchange
            {
                Timestamp = DateTime.UtcNow,
                UserID = userId,
                ExchangeOption = exchangeDto.ExchangeOption,
                FromAmount = exchangeDto.FromAmount,
                ToAmount = toAmount,
                Rate = exchangeDto.Rate,
                Description = exchangeDto.Description,
                Disabled = false
            };

            _context.CurrencyExchanges.Add(exchange);
            await _context.SaveChangesAsync();

            // 6. Create the 4-legged journal entries
            // First Journal (Debit Position, Credit Cash)
            var journalPage1 = new JournalPageCreateDto
            {
                CurrencyID = fromCurrency == "USD" ? 1 : 2,
                Ref = "Exchange",
                Description = $"FX Sale: {exchange.FromAmount} {fromCurrency} @ {exchange.Rate} ({exchange.Description})",
                JournalEntries = new List<JournalPostCreateDto>
                {
                    new JournalPostCreateDto { AccountNumber = fromAccount.AccountNumber, Debit = 0, Credit = exchange.FromAmount },
                    new JournalPostCreateDto { AccountNumber = equivalencePositionAccount.AccountNumber, Debit = exchange.FromAmount, Credit = 0 }
                }
            };
            await _journalService.CreateJournalPageAsync(journalPage1, userId);

            // Second Journal (Debit Cash, Credit Position)
            var journalPage2 = new JournalPageCreateDto
            {
                CurrencyID = toCurrency == "USD" ? 1 : 2,
                Ref = "Exchange",
                Description = $"FX Purchase: {exchange.ToAmount} {toCurrency} @ {exchange.Rate} ({exchange.Description})",
                JournalEntries = new List<JournalPostCreateDto>
                {
                    new JournalPostCreateDto { AccountNumber = toAccount.AccountNumber, Debit = exchange.ToAmount, Credit = 0 },
                    new JournalPostCreateDto { AccountNumber = positionAccount.AccountNumber, Debit = 0, Credit = exchange.ToAmount }
                }
            };
            await _journalService.CreateJournalPageAsync(journalPage2, userId);

            // 7. Return the created object
            var user = await _context.Users.FindAsync(userId);
            return new CurrencyExchangeReadDto
            {
                Id = exchange.ID,
                Timestamp = exchange.Timestamp,
                Username = user?.Username ?? "N/A",
                ExchangeOption = exchange.ExchangeOption,
                FromAmount = exchange.FromAmount,
                ToAmount = exchange.ToAmount,
                Rate = exchange.Rate,
                Description = exchange.Description,
                Disabled = exchange.Disabled
            };
        }

        public async Task<bool> DisableExchangeAsync(int id)
        {
            var exchange = await _context.CurrencyExchanges.FindAsync(id);
            if (exchange == null) return false;
            exchange.Disabled = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<CurrencyExchangeReadDto>> GetExchangesAsync(DateTime startDate, DateTime endDate, bool includeDisabled)
        {
            var query = _context.CurrencyExchanges.AsQueryable();
            if (!includeDisabled)
            {
                query = query.Where(e => !e.Disabled);
            }

            var end = endDate.AddDays(1);
            return await query
                .Where(e => e.Timestamp >= startDate && e.Timestamp < end)
                .Include(e => e.User)
                .Select(e => new CurrencyExchangeReadDto
                {
                    Id = e.ID,
                    Timestamp = e.Timestamp,
                    Username = e.User.Username,
                    ExchangeOption = e.ExchangeOption,
                    FromAmount = e.FromAmount,
                    ToAmount = e.ToAmount,
                    Rate = e.Rate,
                    Description = e.Description,
                    Disabled = e.Disabled
                })
                .OrderByDescending(e => e.Timestamp)
                .ToListAsync();
        }
    }
}
