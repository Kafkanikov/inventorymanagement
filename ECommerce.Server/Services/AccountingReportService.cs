// File: Services/AccountingReportService.cs
// Ensure these using statements are present:
using ECommerce.Server.Data;
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Data.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ECommerce.Server.Services
{
    public class AccountingReportService : IAccountingReportService // Or your specific interface
    {
        private readonly EcommerceDbContext _context;

        public AccountingReportService(EcommerceDbContext context)
        {
            _context = context;
        }

        // Helper to parse currency from Account Name (ensure this exists)
        private string GetCurrencyCodeFromAccountName(string accountName, out string cleanedName)
        {
            cleanedName = accountName;
            if (accountName.EndsWith(": USD", StringComparison.OrdinalIgnoreCase)) { cleanedName = accountName.Substring(0, accountName.Length - 5).TrimEnd(); return "USD"; }
            if (accountName.EndsWith(": KHR", StringComparison.OrdinalIgnoreCase)) { cleanedName = accountName.Substring(0, accountName.Length - 5).TrimEnd(); return "KHR"; }
            return "USD";
        }

        // Helper to get currency symbol (ensure this exists)
        private string GetCurrencySymbol(string? currencyCode)
        {
            return currencyCode?.ToUpper() == "KHR" ? "៛" : "$";
        }

        public async Task<List<SimplifiedBalanceLineDto>> GetSimplifiedBalanceSheetDataAsync(BalanceSheetRequestDto request)
        {
            var resultList = new List<SimplifiedBalanceLineDto>();

            // Step 1: Fetch all active accounts with their categories
            var allAccountsWithDetails = await _context.Accounts
                .Include(a => a.AccountCategory)
                //.Include(a => a.AccountSubCategory) // Include if SubGroupName is needed for DTO
                .Where(a => a.AccountCategory != null) // Only active accounts with a category
                .ToListAsync();

            // --- Calculate Balances for Asset Accounts ---
            var assetAccounts = allAccountsWithDetails
                .Where(a => a.AccountCategory.Name == "Asset") // Dynamically identify asset accounts
                .ToList();

            foreach (var account in assetAccounts)
            {
                // Calculate balance for this specific asset account
                // Sum (Debits - Credits) for debit-normal accounts
                // Sum (Credits - Debits) for credit-normal accounts
                var balance = await _context.JournalEntries // Using the C# entity name for JournalPost
                    .Include(je => je.JournalPage)
                    .Where(je => je.Account == account.AccountNumber && // Link JournalEntry.Account (string AccountNumber) to Account.AccountNumber
                                 je.JournalPage.CreatedAt <= request.AsOfDate &&
                                 !je.JournalPage.Disabled) // Consider only !Disabled JournalPages
                    .SumAsync(je =>
                        (account.NormalBalance.Equals("debit", StringComparison.OrdinalIgnoreCase)
                            ? (je.Debit - je.Credit)
                            : (je.Credit - je.Debit))
                    );

                // For SimplifiedBalanceLineDto, we need currency info if we want to populate BalanceNative and Symbol
                string currencyCode = GetCurrencyCodeFromAccountName(account.Name, out _); // We have this helper
                decimal balanceInReportCurrency = balance; // Assume balance is already in report currency or needs conversion

                // Example conversion if 'balance' was native and report currency is USD
                if (currencyCode == "KHR" && request.ReportCurrency.ToUpper() == "USD")
                {
                    balanceInReportCurrency = (request.KHRtoReportCurrencyExchangeRate != 0)
                                              ? (balance / request.KHRtoReportCurrencyExchangeRate)
                                              : 0;
                }


                resultList.Add(new SimplifiedBalanceLineDto
                {
                    Section = "Assets",
                    AccountNumber = account.AccountNumber, // Now populating AccountNumber
                    Description = account.Name,      // Full account name from Account table
                    AmountInReportCurrency = balanceInReportCurrency, // This is the calculated balance
                    BalanceNative = balance, // Store the native balance before conversion
                    CurrencySymbolNative = GetCurrencySymbol(currencyCode), // Get symbol for native currency
                    SubGroupName = account.AccountSubCategory?.Name ?? account.AccountCategory.Name // For potential grouping later
                });
            }

            // --- Calculate Profit from Operations for the Period ---
            DateTime periodStartDate = new DateTime(request.AsOfDate.Year, 1, 1);

            var revenueAccountNumbers = allAccountsWithDetails
                .Where(a => a.AccountCategory.Name == "Revenue")
                .Select(a => a.AccountNumber)
                .ToHashSet();

            var expenseAccountNumbers = allAccountsWithDetails
                .Where(a => a.AccountCategory.Name == "Expense") // This should include your COGS account '6000020000'
                .Select(a => a.AccountNumber)
                .ToHashSet();

            foreach (string str in revenueAccountNumbers)
            {
                Console.WriteLine(str);
            }

            decimal totalRevenueForPeriod = 0;
            if (revenueAccountNumbers.Any())
            {
                totalRevenueForPeriod = await _context.JournalEntries
                    .Include(je => je.JournalPage)
                    .Where(je => revenueAccountNumbers.Contains(je.Account) &&
                                 je.JournalPage.CreatedAt >= periodStartDate &&
                                 je.JournalPage.CreatedAt <= request.AsOfDate &&
                                 !je.JournalPage.Disabled)
                    .SumAsync(je => je.Credit - je.Debit); // Revenue: Credits increase balance
                Console.WriteLine(totalRevenueForPeriod);
            }

            decimal totalExpensesForPeriod = 0;
            if (expenseAccountNumbers.Any())
            {
                totalExpensesForPeriod = await _context.JournalEntries
                    .Include(je => je.JournalPage)
                    .Where(je => expenseAccountNumbers.Contains(je.Account) &&
                                 je.JournalPage.CreatedAt >= periodStartDate &&
                                 je.JournalPage.CreatedAt <= request.AsOfDate &&
                                 !je.JournalPage.Disabled)
                    .SumAsync(je => je.Debit - je.Credit); // Expenses: Debits increase balance
            }

            decimal profitForOperations = totalRevenueForPeriod - totalExpensesForPeriod;

            resultList.Add(new SimplifiedBalanceLineDto
            {
                Section = "Equity",
                AccountNumber = "PROFIT", // Placeholder for the P&L summary line
                Description = "Profit from Operations",
                AmountInReportCurrency = profitForOperations, // This is the calculated profit
                BalanceNative = profitForOperations, // Assuming report currency for P&L summary
                CurrencySymbolNative = GetCurrencySymbol(request.ReportCurrency),
                SubGroupName = "Profit or loss current year"
            });

            // Add Retained Earnings and Owner's Draw lines if they are separate from the simplified P&L.
            // The previous full BalanceSheet service had logic for these.
            // For this simplified output, you are only asking for Assets and "Profit as Equity".

            // Order the results for consistent output
            return resultList
                     .OrderBy(r => r.Section == "Assets" ? 0 : (r.Section == "Equity" ? 2 : 1)) // Assets, (Liabilities if any), Equity
                     .ThenBy(r => r.SubGroupName) // Then by subgroup name
                     .ThenBy(r => r.Description)  // Then by account description
                     .ToList();
        }

        // This is the more detailed method signature you were working towards earlier.
        // If you call this method, ensure SimplifiedBalanceLineDto can be mapped to the more complex DTOs.
        public async Task<BalanceSheetDto?> GetBalanceSheetAsync(BalanceSheetRequestDto request)
        {
            var simplifiedLines = await GetSimplifiedBalanceSheetDataAsync(request);
            if (simplifiedLines == null || !simplifiedLines.Any())
            {
                return new BalanceSheetDto
                {
                    AsOfDate = request.AsOfDate,
                    ReportingCurrencySymbol = GetCurrencySymbol(request.ReportCurrency),
                    ReportTitle = $"Balance Sheet as of {request.AsOfDate:dd/MM/yyyy} - No Data"
                };
            }

            var bsDto = new BalanceSheetDto
            {
                AsOfDate = request.AsOfDate,
                ReportingCurrencySymbol = GetCurrencySymbol(request.ReportCurrency),
                ReportTitle = $"Balance Sheet as of {request.AsOfDate:dd/MM/yyyy}"
            };

            var assetMainGroup = new AccountMainGroupDto { GroupName = "Assets" };
            var liabilityMainGroup = new AccountMainGroupDto { GroupName = "Liabilities" }; // Placeholder
            var equityMainGroup = new AccountMainGroupDto { GroupName = "Equity" };

            var assetSubGroups = new Dictionary<string, AccountSubGroupDto>();
            // var liabilitySubGroups = new Dictionary<string, AccountSubGroupDto>(); // For future
            var equitySubGroups = new Dictionary<string, AccountSubGroupDto>();


            foreach (var line in simplifiedLines)
            {
                var accountBalanceDto = new AccountBalanceDto
                {
                    AccountNumber = line.AccountNumber,
                    AccountName = line.Description,
                    BalanceNative = line.BalanceNative,
                    CurrencySymbolNative = line.CurrencySymbolNative,
                    BalanceInReportCurrency = line.AmountInReportCurrency
                };

                if (line.Section == "Assets")
                {
                    if (!assetSubGroups.ContainsKey(line.SubGroupName)) assetSubGroups[line.SubGroupName] = new AccountSubGroupDto { SubGroupName = line.SubGroupName };
                    assetSubGroups[line.SubGroupName].Accounts.Add(accountBalanceDto);
                }
                // else if (line.Section == "Liabilities") { /* ... */ }
                else if (line.Section == "Equity")
                {
                    // For the simplified output, "Profit from Operations" is the main equity line.
                    // If you have specific RE or Owner's Draw accounts included in simplifiedLines,
                    // you'd need to route them to appropriate subgroups here.
                    // The current simplifiedLines puts Profit under "Equity" section and "Profit or loss current year" subgroup.
                    if (!equitySubGroups.ContainsKey(line.SubGroupName)) equitySubGroups[line.SubGroupName] = new AccountSubGroupDto { SubGroupName = line.SubGroupName };
                    equitySubGroups[line.SubGroupName].Accounts.Add(accountBalanceDto);
                }
            }

            assetMainGroup.SubGroups = assetSubGroups.Values.OrderBy(sg => sg.SubGroupName).ToList();
            assetMainGroup.SubGroups.ForEach(sg => sg.SubGroupTotalInReportCurrency = sg.Accounts.Sum(a => a.BalanceInReportCurrency));
            if (assetMainGroup.SubGroups.Any()) bsDto.AssetGroup.Add(assetMainGroup);
            bsDto.TotalAssets = assetMainGroup.GroupTotalInReportCurrency = assetMainGroup.SubGroups.Sum(sg => sg.SubGroupTotalInReportCurrency);

            // No liabilities in this simplified request from user
            bsDto.TotalLiabilities = 0;

            equityMainGroup.SubGroups = equitySubGroups.Values.OrderBy(sg => sg.SubGroupName).ToList();
            equityMainGroup.SubGroups.ForEach(sg => sg.SubGroupTotalInReportCurrency = sg.Accounts.Sum(a => a.BalanceInReportCurrency));
            if (equityMainGroup.SubGroups.Any()) bsDto.EquityGroup.Add(equityMainGroup);
            bsDto.TotalEquity = equityMainGroup.GroupTotalInReportCurrency = equityMainGroup.SubGroups.Sum(sg => sg.SubGroupTotalInReportCurrency);


            bsDto.TotalLiabilitiesAndEquity = bsDto.TotalLiabilities + bsDto.TotalEquity;
            bsDto.IsBalanced = Math.Abs(bsDto.TotalAssets - bsDto.TotalLiabilitiesAndEquity) < 0.01m;

            return bsDto;
        }
    }
}