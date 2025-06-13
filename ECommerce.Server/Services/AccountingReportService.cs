 using ECommerce.Server.Data;
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Data.Entities.ECommerce.Server.Data.Entities; // For Account
using ECommerce.Server.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace ECommerce.Server.Services
{
    public class AccountingReportService : IAccountingReportService
    {
        private readonly EcommerceDbContext _context;
        private readonly ILogger<AccountingReportService> _logger;

        // Define standard category names for easier matching
        private const string ASSET_CATEGORY = "Asset";
        private const string LIABILITY_CATEGORY = "Liability";
        private const string EQUITY_CATEGORY = "Equity";
        private const string INCOME_CATEGORY = "Revenue"; 
        private const string EXPENSE_CATEGORY = "Expense";
        private const string COGS_CATEGORY = "COGS"; // Cost of Goods Sold might be a specific category


        public AccountingReportService(EcommerceDbContext context, ILogger<AccountingReportService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<BalanceSheetDataDto?> GetBalanceSheetAsync(BalanceSheetRequestParams requestParams)
        {
            _logger.LogInformation("GetBalanceSheetAsync called with params: AsOfDate={AsOfDate}, ReportCurrency={ReportCurrency}, ExchangeRate={ExchangeRate}",
                requestParams.AsOfDate, requestParams.ReportCurrency, requestParams.KhrToReportCurrencyExchangeRate);

            var accounts = await _context.Accounts
                .Include(a => a.AccountCategory)
                .Include(a => a.AccountSubCategory)
                .AsNoTracking() // Good for read-heavy operations
                .ToListAsync();

            if (!accounts.Any())
            {
                _logger.LogWarning("No accounts found in the database.");
                return new BalanceSheetDataDto
                {
                    AsOfDate = requestParams.AsOfDate,
                    ReportTitle = "Balance Sheet - No Account Data",
                    ReportingCurrencySymbol = requestParams.ReportCurrency == "USD" ? "$" : "៛"
                };
            }
            _logger.LogInformation("Fetched {AccountCount} accounts.", accounts.Count);

            var journalEntriesGrouped = await _context.JournalEntries
                .Include(je => je.JournalPage)
                .Where(je => je.JournalPage.CreatedAt <= requestParams.AsOfDate && !je.JournalPage.Disabled)
                .GroupBy(je => je.Account) // Group by AccountNumber
                .Select(g => new
                {
                    AccountNumber = g.Key,
                    TotalDebit = g.Sum(x => x.Debit),
                    TotalCredit = g.Sum(x => x.Credit)
                })
                .ToDictionaryAsync(x => x.AccountNumber, x => new { x.TotalDebit, x.TotalCredit });

            _logger.LogInformation("Fetched and grouped {JournalEntryGroupCount} journal entry groups.", journalEntriesGrouped.Count);

            var processedAccounts = new List<ProcessedAccount>();

            foreach (var acc in accounts)
            {
                journalEntriesGrouped.TryGetValue(acc.AccountNumber, out var entryTotals);
                decimal debits = entryTotals?.TotalDebit ?? 0;
                decimal credits = entryTotals?.TotalCredit ?? 0;

                decimal nativeBalance;
                // Important: Expense accounts typically have a DEBIT normal balance.
                // Income accounts typically have a CREDIT normal balance.
                if (acc.NormalBalance?.Equals("debit", StringComparison.OrdinalIgnoreCase) == true)
                {
                    nativeBalance = debits - credits;
                }
                else if (acc.NormalBalance?.Equals("credit", StringComparison.OrdinalIgnoreCase) == true)
                {
                    nativeBalance = credits - debits;
                }
                else
                {
                    _logger.LogWarning("Account {AccountNumber} ({AccountName}) has an unknown or null normal balance '{NormalBalance}'. Assuming Debit normal balance as a fallback.", acc.AccountNumber, acc.Name, acc.NormalBalance);
                    nativeBalance = debits - credits;
                }
                nativeBalance = Math.Round(nativeBalance, 4);


                string nativeCurrencyCode = "USD";
                string nativeCurrencySymbol = "$";
                if (acc.Name.EndsWith(": KHR", StringComparison.OrdinalIgnoreCase) || acc.Name.StartsWith("KHR ") || acc.Name.IndexOf(" KHR ", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    nativeCurrencyCode = "KHR";
                    nativeCurrencySymbol = "៛";
                }
                else if (acc.Name.EndsWith(": USD", StringComparison.OrdinalIgnoreCase) || acc.Name.StartsWith("USD ") || acc.Name.IndexOf(" USD ", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    nativeCurrencyCode = "USD";
                    nativeCurrencySymbol = "$";
                }
                else
                {
                    _logger.LogDebug("Could not determine currency from account name '{AccountName}' for account {AccountNumber}. Defaulting to USD.", acc.Name, acc.AccountNumber);
                }

                decimal balanceInReportCurrency = nativeBalance;
                if (nativeCurrencyCode == "KHR" && requestParams.ReportCurrency == "USD")
                {
                    if (!requestParams.KhrToReportCurrencyExchangeRate.HasValue || requestParams.KhrToReportCurrencyExchangeRate.Value == 0)
                    {
                        _logger.LogError("KHR to USD conversion required but exchange rate is missing or zero.");
                        throw new ArgumentException("KHR to USD exchange rate must be provided and non-zero when KHR accounts exist and report currency is USD.");
                    }
                    balanceInReportCurrency = nativeBalance / requestParams.KhrToReportCurrencyExchangeRate.Value;
                }
                else if (nativeCurrencyCode == "USD" && requestParams.ReportCurrency == "KHR")
                {
                    if (!requestParams.KhrToReportCurrencyExchangeRate.HasValue)
                    {
                        _logger.LogError("USD to KHR conversion required but exchange rate is missing.");
                        throw new ArgumentException("USD to KHR exchange rate (KHR per USD) must be provided when USD accounts exist and report currency is KHR.");
                    }
                    balanceInReportCurrency = nativeBalance * requestParams.KhrToReportCurrencyExchangeRate.Value;
                }
                balanceInReportCurrency = Math.Round(balanceInReportCurrency, 2);

                processedAccounts.Add(new ProcessedAccount
                {
                    AccountEntity = acc,
                    BalanceSheetAccount = new BalanceSheetAccountDto
                    {
                        AccountNumber = acc.AccountNumber,
                        AccountName = acc.Name,
                        BalanceNative = nativeBalance, 
                        CurrencySymbolNative = nativeCurrencySymbol,
                        BalanceInReportCurrency = balanceInReportCurrency
                    }
                });
            }

            var report = new BalanceSheetDataDto
            {
                AsOfDate = requestParams.AsOfDate,
                ReportTitle = $"Balance Sheet as of {requestParams.AsOfDate:dd/MM/yyyy}",
                ReportingCurrencySymbol = requestParams.ReportCurrency == "USD" ? "$" : "៛"
            };

            report.AssetGroups.Add(CreateGroup(processedAccounts, ASSET_CATEGORY, "Assets", _logger));
            report.LiabilityGroups.Add(CreateGroup(processedAccounts, LIABILITY_CATEGORY, "Liabilities", _logger));
            report.EquityGroups.Add(CreateGroup(processedAccounts, EQUITY_CATEGORY, "Equity", _logger)); // Original Equity accounts
            report.IncomeGroups.Add(CreateGroup(processedAccounts, INCOME_CATEGORY, "Income", _logger));
            report.ExpenseGroups.Add(CreateGroup(processedAccounts, EXPENSE_CATEGORY, "Expenses", _logger));
            // If COGS is a separate main category from Expenses:
            report.ExpenseGroups.Add(CreateGroup(processedAccounts, COGS_CATEGORY, "Cost of Goods Sold", _logger));


            report.TotalAssets = report.AssetGroups.Sum(g => g.GroupTotalInReportCurrency);
            report.TotalLiabilities = report.LiabilityGroups.Sum(g => g.GroupTotalInReportCurrency);

            report.TotalIncome = report.IncomeGroups.Sum(g => g.GroupTotalInReportCurrency);
            // Expenses usually increase with debits (normal balance debit).
            // Their balance (debit-credit) will be positive. The sum of these positive balances is total expenses.
            // COGS is also an expense.
            report.TotalExpenses = report.ExpenseGroups.Sum(g => g.GroupTotalInReportCurrency);

            report.NetProfitOrLoss = Math.Round(report.TotalIncome - report.TotalExpenses, 2);

            // Add Calculated Net Profit/Loss to Equity
            var equityGroupPrimary = report.EquityGroups.FirstOrDefault(eg => eg.GroupName == "Equity");
            if (equityGroupPrimary == null)
            { // Should not happen if "Equity" category exists
                equityGroupPrimary = new BalanceSheetGroupDto { GroupName = "Equity" };
                report.EquityGroups.Add(equityGroupPrimary);
            }

            var profitLossSubGroup = new BalanceSheetSubGroupDto
            {
                SubGroupName = "Profit or Loss Current Year",
                Accounts = new List<BalanceSheetAccountDto>
                {
                    new()
                    {
                        AccountNumber = "4081020000",
                        AccountName = $"Profit Current Year: USD",
                        BalanceNative = report.NetProfitOrLoss,
                        CurrencySymbolNative = report.ReportingCurrencySymbol,
                        BalanceInReportCurrency = report.NetProfitOrLoss
                    }
                },
                SubGroupTotalInReportCurrency = report.NetProfitOrLoss
            };
            equityGroupPrimary.SubGroups.Add(profitLossSubGroup);

            // Recalculate total equity: Sum of original equity accounts + current period's P&L
            report.TotalEquity = Math.Round(report.EquityGroups.SelectMany(eg => eg.SubGroups)
                                                      .Sum(sg => sg.SubGroupTotalInReportCurrency), 2);

            report.TotalLiabilitiesAndEquity = Math.Round(report.TotalLiabilities + report.TotalEquity, 2);
            report.IsBalanced = Math.Abs(report.TotalAssets - report.TotalLiabilitiesAndEquity) < 0.015m; // Adjusted tolerance slightly

            _logger.LogInformation("Balance Sheet processing complete. TotalAssets={TotalAssets}, TotalLiabilities={TotalLiabilities}, TotalEquity={TotalEquity}, TotalLiabilitiesAndEquity={TotalLiabilitiesAndEquity}, IsBalanced={IsBalanced}, NetProfitLoss={NetProfitLoss}",
                report.TotalAssets, report.TotalLiabilities, report.TotalEquity, report.TotalLiabilitiesAndEquity, report.IsBalanced, report.NetProfitOrLoss);

            if (!report.IsBalanced)
            {
                _logger.LogWarning("Balance Sheet is NOT balanced. Difference: {Difference}", report.TotalAssets - report.TotalLiabilitiesAndEquity);
            }

            return report;
        }

        private BalanceSheetGroupDto CreateGroup(List<ProcessedAccount> processedAccounts, string categoryFilter, string groupDisplayName, ILogger logger)
        {
            var group = new BalanceSheetGroupDto { GroupName = groupDisplayName };
            var subGroupsTemp = new Dictionary<string, List<BalanceSheetAccountDto>>();

            var categoryAccounts = processedAccounts
                .Where(pa => pa.AccountEntity.AccountCategory?.Name.Equals(categoryFilter, StringComparison.OrdinalIgnoreCase) == true);

            if (!categoryAccounts.Any())
            {
                logger.LogDebug("No accounts found for category: {CategoryFilter}", categoryFilter);
            }

            foreach (var pa in categoryAccounts)
            {
                string subCategoryName = pa.AccountEntity.AccountSubCategory?.Name ?? "General";
                if (!subGroupsTemp.ContainsKey(subCategoryName))
                {
                    subGroupsTemp[subCategoryName] = new List<BalanceSheetAccountDto>();
                }
                subGroupsTemp[subCategoryName].Add(pa.BalanceSheetAccount);
                logger.LogTrace("Account {AccountNumber} added to SubGroup '{SubGroupName}' in Group '{GroupDisplayName}'", pa.BalanceSheetAccount.AccountNumber, subCategoryName, groupDisplayName);
            }

            foreach (var kvp in subGroupsTemp.OrderBy(s => s.Key)) // Order subgroups alphabetically
            {
                var subGroup = new BalanceSheetSubGroupDto { SubGroupName = kvp.Key, Accounts = kvp.Value.OrderBy(a => a.AccountNumber).ToList() }; // Order accounts by number
                subGroup.SubGroupTotalInReportCurrency = Math.Round(kvp.Value.Sum(a => a.BalanceInReportCurrency), 2);
                group.SubGroups.Add(subGroup);
            }
            group.GroupTotalInReportCurrency = Math.Round(group.SubGroups.Sum(sg => sg.SubGroupTotalInReportCurrency), 2);
            return group;
        }

        // Helper class to keep entity and DTO together during processing
        private class ProcessedAccount
        {
            public Account AccountEntity { get; set; }
            public BalanceSheetAccountDto BalanceSheetAccount { get; set; }
        }

        public async Task<TrialBalanceReportDto?> GetTrialBalanceAsync(TrialBalanceRequestParams requestParams)
        {
            _logger.LogInformation("GetTrialBalanceAsync called with params: AsOfDate={AsOfDate}, ReportCurrency={ReportCurrency}, ExchangeRate={ExchangeRate}",
                requestParams.AsOfDate, requestParams.ReportCurrency, requestParams.KhrToReportCurrencyExchangeRate);

            var allAccounts = await _context.Accounts
                .Include(a => a.AccountCategory) // Optional: if needed for filtering or display later
                .AsNoTracking()
                .OrderBy(a => a.AccountNumber) // Typically ordered by account number
                .ToListAsync();

            if (!allAccounts.Any())
            {
                _logger.LogWarning("No accounts found in the database for Trial Balance.");
                return new TrialBalanceReportDto
                {
                    AsOfDate = requestParams.AsOfDate,
                    ReportCurrency = requestParams.ReportCurrency,
                    ReportingCurrencySymbol = requestParams.ReportCurrency == "USD" ? "$" : "៛",
                    ReportTitle = $"Trial Balance as of {requestParams.AsOfDate:dd/MM/yyyy} - No Account Data",
                    IsBalanced = true // Technically balanced if all zeros
                };
            }

            var journalEntriesGrouped = await _context.JournalEntries
                .Include(je => je.JournalPage)
                .Where(je => je.JournalPage.CreatedAt <= requestParams.AsOfDate && !je.JournalPage.Disabled)
                .GroupBy(je => je.Account)
                .Select(g => new
                {
                    AccountNumber = g.Key,
                    TotalDebit = g.Sum(x => x.Debit),
                    TotalCredit = g.Sum(x => x.Credit)
                })
                .ToDictionaryAsync(x => x.AccountNumber, x => new { x.TotalDebit, x.TotalCredit });

            var trialBalanceLines = new List<TrialBalanceLineDto>();
            decimal reportTotalDebits = 0;
            decimal reportTotalCredits = 0;

            foreach (var acc in allAccounts)
            {
                journalEntriesGrouped.TryGetValue(acc.AccountNumber, out var entryTotals);
                decimal sumDebitsNative = entryTotals?.TotalDebit ?? 0;
                decimal sumCreditsNative = entryTotals?.TotalCredit ?? 0;

                // Determine native currency (simplified from Balance Sheet logic)
                string nativeCurrencyCode = "USD"; // Default
                if (acc.Name.EndsWith(": KHR", StringComparison.OrdinalIgnoreCase) || acc.Name.StartsWith("KHR ") || acc.Name.IndexOf(" KHR ", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    nativeCurrencyCode = "KHR";
                }

                // Convert sums to report currency before calculating net balance for TB columns
                decimal sumDebitsInReportCurrency = sumDebitsNative;
                decimal sumCreditsInReportCurrency = sumCreditsNative;

                if (nativeCurrencyCode == "KHR" && requestParams.ReportCurrency == "USD")
                {
                    if (!requestParams.KhrToReportCurrencyExchangeRate.HasValue || requestParams.KhrToReportCurrencyExchangeRate.Value == 0)
                        throw new ArgumentException("KHR to USD exchange rate must be provided and non-zero.");
                    sumDebitsInReportCurrency = sumDebitsNative / requestParams.KhrToReportCurrencyExchangeRate.Value;
                    sumCreditsInReportCurrency = sumCreditsNative / requestParams.KhrToReportCurrencyExchangeRate.Value;
                }
                else if (nativeCurrencyCode == "USD" && requestParams.ReportCurrency == "KHR")
                {
                    if (!requestParams.KhrToReportCurrencyExchangeRate.HasValue)
                        throw new ArgumentException("USD to KHR exchange rate must be provided.");
                    sumDebitsInReportCurrency = sumDebitsNative * requestParams.KhrToReportCurrencyExchangeRate.Value;
                    sumCreditsInReportCurrency = sumCreditsNative * requestParams.KhrToReportCurrencyExchangeRate.Value;
                }

                sumDebitsInReportCurrency = Math.Round(sumDebitsInReportCurrency, 2);
                sumCreditsInReportCurrency = Math.Round(sumCreditsInReportCurrency, 2);

                decimal netBalanceInReportCurrency = sumDebitsInReportCurrency - sumCreditsInReportCurrency;

                decimal tbDebitAmount = 0;
                decimal tbCreditAmount = 0;

                if (acc.NormalBalance?.Equals("debit", StringComparison.OrdinalIgnoreCase) == true)
                {
                    if (netBalanceInReportCurrency >= 0) // Normal debit balance or zero
                    {
                        tbDebitAmount = netBalanceInReportCurrency;
                    }
                    else // Abnormal credit balance
                    {
                        tbCreditAmount = Math.Abs(netBalanceInReportCurrency);
                    }
                }
                else if (acc.NormalBalance?.Equals("credit", StringComparison.OrdinalIgnoreCase) == true)
                {
                    if (netBalanceInReportCurrency <= 0) // Normal credit balance or zero
                    {
                        tbCreditAmount = Math.Abs(netBalanceInReportCurrency);
                    }
                    else // Abnormal debit balance
                    {
                        tbDebitAmount = netBalanceInReportCurrency;
                    }
                }
                else // Unknown or null normal balance, treat net positive as debit, net negative as credit
                {
                    _logger.LogWarning("Account {AccountNumber} ({AccountName}) has an unknown or null normal balance '{NormalBalance}'. Net balance will determine debit/credit column.", acc.AccountNumber, acc.Name, acc.NormalBalance);
                    if (netBalanceInReportCurrency > 0) tbDebitAmount = netBalanceInReportCurrency;
                    else if (netBalanceInReportCurrency < 0) tbCreditAmount = Math.Abs(netBalanceInReportCurrency);
                }

                // Only add lines if there's a non-zero balance or if you want to show all accounts
                if (tbDebitAmount != 0 || tbCreditAmount != 0)
                {
                    trialBalanceLines.Add(new TrialBalanceLineDto
                    {
                        AccountNumber = acc.AccountNumber,
                        AccountName = acc.Name,
                        Debit = tbDebitAmount,
                        Credit = tbCreditAmount
                    });
                    reportTotalDebits += tbDebitAmount;
                    reportTotalCredits += tbCreditAmount;
                }
            }

            reportTotalDebits = Math.Round(reportTotalDebits, 2);
            reportTotalCredits = Math.Round(reportTotalCredits, 2);

            return new TrialBalanceReportDto
            {
                AsOfDate = requestParams.AsOfDate,
                ReportCurrency = requestParams.ReportCurrency,
                ReportingCurrencySymbol = requestParams.ReportCurrency == "USD" ? "$" : "៛",
                Lines = trialBalanceLines,
                TotalDebits = reportTotalDebits,
                TotalCredits = reportTotalCredits,
                IsBalanced = Math.Abs(reportTotalDebits - reportTotalCredits) < 0.015m, // Using a small tolerance
                ReportTitle = $"Trial Balance as of {requestParams.AsOfDate:dd/MM/yyyy}"
            };
        }
        private async Task<Dictionary<string, (decimal CurrentMonth, decimal YearToDate)>> CalculateAccountPeriodBalances(
            DateTime asOfDate,
            string reportCurrency,
            decimal? khrToReportCurrencyExchangeRate,
            IEnumerable<Account> accountsToProcess)
        {
            var result = new Dictionary<string, (decimal CurrentMonth, decimal YearToDate)>();

            DateTime monthStartDate = new DateTime(asOfDate.Year, asOfDate.Month, 1);
            DateTime yearStartDate = new DateTime(asOfDate.Year, 1, 1);

            var accountNumbersToProcess = accountsToProcess.Select(a => a.AccountNumber).ToList();

            var allRelevantJournalEntries = await _context.JournalEntries
                .Include(je => je.JournalPage)
                .Where(je => accountNumbersToProcess.Contains(je.Account) &&
                             je.JournalPage.CreatedAt >= yearStartDate &&
                             je.JournalPage.CreatedAt <= asOfDate &&
                             !je.JournalPage.Disabled)
                .ToListAsync();

            foreach (var acc in accountsToProcess)
            {
                var accountEntries = allRelevantJournalEntries.Where(je => je.Account == acc.AccountNumber).ToList();

                decimal ytdDebitsNative = accountEntries.Sum(e => e.Debit);
                decimal ytdCreditsNative = accountEntries.Sum(e => e.Credit);

                decimal monthDebitsNative = accountEntries
                    .Where(e => e.JournalPage.CreatedAt >= monthStartDate)
                    .Sum(e => e.Debit);
                decimal monthCreditsNative = accountEntries
                    .Where(e => e.JournalPage.CreatedAt >= monthStartDate)
                    .Sum(e => e.Credit);

                string nativeCurrencyCode = "USD";
                if (acc.Name.EndsWith(": KHR", StringComparison.OrdinalIgnoreCase) || acc.Name.StartsWith("KHR ") || acc.Name.IndexOf(" KHR ", StringComparison.OrdinalIgnoreCase) >= 0) nativeCurrencyCode = "KHR";

                Func<decimal, decimal> convertToReport = (nativeAmount) => {
                    decimal convertedAmount = nativeAmount;
                    if (nativeCurrencyCode == "KHR" && reportCurrency == "USD")
                    {
                        if (!khrToReportCurrencyExchangeRate.HasValue || khrToReportCurrencyExchangeRate.Value == 0)
                            throw new ArgumentException("KHR to USD exchange rate missing or zero.");
                        convertedAmount = nativeAmount / khrToReportCurrencyExchangeRate.Value;
                    }
                    else if (nativeCurrencyCode == "USD" && reportCurrency == "KHR")
                    {
                        if (!khrToReportCurrencyExchangeRate.HasValue)
                            throw new ArgumentException("USD to KHR exchange rate missing.");
                        convertedAmount = nativeAmount * khrToReportCurrencyExchangeRate.Value;
                    }
                    return Math.Round(convertedAmount, 2);
                };

                decimal ytdDebitsReport = convertToReport(ytdDebitsNative);
                decimal ytdCreditsReport = convertToReport(ytdCreditsNative);
                decimal monthDebitsReport = convertToReport(monthDebitsNative);
                decimal monthCreditsReport = convertToReport(monthCreditsNative);

                decimal currentMonthNetChange;
                decimal yearToDateNetChange;

                if (acc.AccountCategory?.Name.Equals(INCOME_CATEGORY, StringComparison.OrdinalIgnoreCase) == true)
                {
                    currentMonthNetChange = monthCreditsReport - monthDebitsReport;
                    yearToDateNetChange = ytdCreditsReport - ytdDebitsReport;
                }
                else if (acc.AccountCategory?.Name.Equals(EXPENSE_CATEGORY, StringComparison.OrdinalIgnoreCase) == true ||
                         acc.AccountCategory?.Name.Equals(COGS_CATEGORY, StringComparison.OrdinalIgnoreCase) == true)
                {
                    currentMonthNetChange = monthDebitsReport - monthCreditsReport;
                    yearToDateNetChange = ytdDebitsReport - ytdCreditsReport;
                }
                else
                {
                    currentMonthNetChange = 0;
                    yearToDateNetChange = 0;
                    _logger.LogWarning("Account {AccountNumber} ({AccountName}) is not classified as Income, Expense, or COGS for P&L calculation.", acc.AccountNumber, acc.Name);
                }
                result[acc.AccountNumber] = (currentMonthNetChange, yearToDateNetChange);
            }
            return result;
        }

        public async Task<ProfitLossReportDto?> GetProfitLossReportAsync(BalanceSheetRequestParams requestParams)
        {
            _logger.LogInformation("GetProfitLossReportAsync called with params: {@RequestParams}", requestParams);

            var relevantAccounts = await _context.Accounts
                .Include(a => a.AccountCategory)
                .Include(a => a.AccountSubCategory)
                .Where(a => a.AccountCategory != null &&
                             (a.AccountCategory.Name == INCOME_CATEGORY ||
                              a.AccountCategory.Name == EXPENSE_CATEGORY ||
                              a.AccountCategory.Name == COGS_CATEGORY)
                      )
                .AsNoTracking()
                .ToListAsync();

            if (!relevantAccounts.Any())
            {
                // Handle no relevant accounts found...
                _logger.LogWarning("No Income, Expense, or COGS accounts found.");
                return new ProfitLossReportDto
                {
                    AsOfDate = requestParams.AsOfDate,
                    ReportTitle = $"Profit & Loss Statement - No Relevant Accounts",
                    ReportCurrency = requestParams.ReportCurrency,
                    ReportingCurrencySymbol = requestParams.ReportCurrency == "USD" ? "$" : "៛",
                    RevenueSection = new ProfitLossSectionDto { SectionName = "Revenue" },
                    CostOfGoodsSoldSection = new ProfitLossSectionDto { SectionName = "Cost of Goods Sold" },
                    OperatingExpenseSection = new ProfitLossSectionDto { SectionName = "Operating Expenses" }
                };
            }

            var accountBalances = await CalculateAccountPeriodBalances(
                requestParams.AsOfDate,
                requestParams.ReportCurrency,
                requestParams.KhrToReportCurrencyExchangeRate,
                relevantAccounts
            );

            var report = new ProfitLossReportDto
            {
                AsOfDate = requestParams.AsOfDate,
                ReportTitle = $"Profit & Loss Statement for period ending {requestParams.AsOfDate:MMMM dd, yyyy}",
                ReportCurrency = requestParams.ReportCurrency,
                ReportingCurrencySymbol = requestParams.ReportCurrency == "USD" ? "$" : "៛",
                RevenueSection = new ProfitLossSectionDto { SectionName = "Revenue" },
                CostOfGoodsSoldSection = new ProfitLossSectionDto { SectionName = "Cost of Goods Sold" },
                OperatingExpenseSection = new ProfitLossSectionDto { SectionName = "Operating Expenses" }
            };

            // **MODIFIED LOGIC FOR REVENUE SECTION**
            var revenueAccounts = relevantAccounts.Where(a => a.AccountCategory.Name == INCOME_CATEGORY);
            var revenueSubGroups = revenueAccounts
                .GroupBy(a => a.AccountSubCategory?.Name ?? "General Revenue") // Group by sub-category
                .OrderBy(g => g.Key);

            foreach (var subGroupData in revenueSubGroups)
            {
                var plSubGroup = new ProfitLossSubGroupDto { SubGroupName = subGroupData.Key };
                foreach (var acc in subGroupData.OrderBy(a => a.AccountNumber))
                {
                    if (accountBalances.TryGetValue(acc.AccountNumber, out var balances))
                    {
                        plSubGroup.Accounts.Add(new ProfitLossAccountLineDto
                        {
                            AccountNumber = acc.AccountNumber,
                            AccountName = acc.Name,
                            CurrentMonthAmount = balances.CurrentMonth,
                            YearToDateAmount = balances.YearToDate
                        });
                    }
                }
                plSubGroup.TotalCurrentMonth = plSubGroup.Accounts.Sum(a => a.CurrentMonthAmount);
                plSubGroup.TotalYearToDate = plSubGroup.Accounts.Sum(a => a.YearToDateAmount);
                report.RevenueSection.SubGroups.Add(plSubGroup); // Add to SubGroups list
            }
            report.RevenueSection.TotalCurrentMonth = report.RevenueSection.SubGroups.Sum(sg => sg.TotalCurrentMonth);
            report.RevenueSection.TotalYearToDate = report.RevenueSection.SubGroups.Sum(sg => sg.TotalYearToDate);
            // **END OF MODIFIED LOGIC**

            // Populate COGS (assuming it's a direct list, but can be grouped like revenue if needed)
            var cogsAccounts = relevantAccounts.Where(a => a.AccountCategory.Name == COGS_CATEGORY);
            foreach (var acc in cogsAccounts.OrderBy(a => a.AccountNumber))
            {
                if (accountBalances.TryGetValue(acc.AccountNumber, out var balances))
                {
                    report.CostOfGoodsSoldSection.Accounts.Add(new ProfitLossAccountLineDto
                    {
                        AccountNumber = acc.AccountNumber,
                        AccountName = acc.Name,
                        CurrentMonthAmount = balances.CurrentMonth,
                        YearToDateAmount = balances.YearToDate
                    });
                }
            }
            report.CostOfGoodsSoldSection.TotalCurrentMonth = report.CostOfGoodsSoldSection.Accounts.Sum(a => a.CurrentMonthAmount);
            report.CostOfGoodsSoldSection.TotalYearToDate = report.CostOfGoodsSoldSection.Accounts.Sum(a => a.YearToDateAmount);

            report.GrossProfitCurrentMonth = report.RevenueSection.TotalCurrentMonth - report.CostOfGoodsSoldSection.TotalCurrentMonth;
            report.GrossProfitYearToDate = report.RevenueSection.TotalYearToDate - report.CostOfGoodsSoldSection.TotalYearToDate;

            // Populate Operating Expenses (already grouped by sub-category)
            var operatingExpenseAccounts = relevantAccounts.Where(a => a.AccountCategory.Name == EXPENSE_CATEGORY);
            var expenseSubGroups = operatingExpenseAccounts
                .GroupBy(a => a.AccountSubCategory?.Name ?? "Other Operating Expenses")
                .OrderBy(g => g.Key);

            foreach (var subGroupData in expenseSubGroups)
            {
                var plSubGroup = new ProfitLossSubGroupDto { SubGroupName = subGroupData.Key };
                foreach (var acc in subGroupData.OrderBy(a => a.AccountNumber))
                {
                    if (accountBalances.TryGetValue(acc.AccountNumber, out var balances))
                    {
                        plSubGroup.Accounts.Add(new ProfitLossAccountLineDto
                        {
                            AccountNumber = acc.AccountNumber,
                            AccountName = acc.Name,
                            CurrentMonthAmount = balances.CurrentMonth,
                            YearToDateAmount = balances.YearToDate
                        });
                    }
                }
                plSubGroup.TotalCurrentMonth = plSubGroup.Accounts.Sum(a => a.CurrentMonthAmount);
                plSubGroup.TotalYearToDate = plSubGroup.Accounts.Sum(a => a.YearToDateAmount);
                report.OperatingExpenseSection.SubGroups.Add(plSubGroup);
            }
            report.OperatingExpenseSection.TotalCurrentMonth = report.OperatingExpenseSection.SubGroups.Sum(sg => sg.TotalCurrentMonth);
            report.OperatingExpenseSection.TotalYearToDate = report.OperatingExpenseSection.SubGroups.Sum(sg => sg.TotalYearToDate);

            report.NetIncomeCurrentMonth = report.GrossProfitCurrentMonth - report.OperatingExpenseSection.TotalCurrentMonth;
            report.NetIncomeYearToDate = report.GrossProfitYearToDate - report.OperatingExpenseSection.TotalYearToDate;

            _logger.LogInformation("Profit & Loss Report generated successfully. NetIncomeYTD: {NetIncomeYTD}", report.NetIncomeYearToDate);

            return report;
        }
    }
}