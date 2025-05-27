// File: Services/PurchaseService.cs
using ECommerce.Server.Data; // Your DbContext namespace
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Data.Entities; // Your Entities namespace
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Server.Interfaces;

namespace ECommerce.Server.Services
{
    public class PurchaseService : IPurchaseService
    {
        private readonly EcommerceDbContext _context;
        private readonly IInventoryLogService _inventoryLogService;
        private readonly IJournalService _journalService;

        private const string INVENTORY_ACCOUNT_NUMBER = "2100020000"; // Example: Inventory Asset Account
        private const string CASH_ACCOUNT_NUMBER = "1111020100";

        public PurchaseService(EcommerceDbContext context, IInventoryLogService inventoryLogService, IJournalService journalService)
        {
            _context = context;
            _inventoryLogService = inventoryLogService;
            _journalService = journalService;
        }

        private async Task<string> GenerateNextPurchaseCodeAsync(string prefix = "PUR", int numericPartLength = 5)
        {
            string prefixWithSeparator = $"{prefix}-";
            int nextNumber = 1;

            var relevantCodes = await _context.Purchases
                .Where(p => p.Code.StartsWith(prefixWithSeparator))
                .Select(p => p.Code)
                .ToListAsync();

            if (relevantCodes.Any())
            {
                int maxNumberFound = 0;
                foreach (var code in relevantCodes)
                {
                    if (code.Length > prefixWithSeparator.Length)
                    {
                        string numberPart = code.Substring(prefixWithSeparator.Length);
                        if (int.TryParse(numberPart, out int currentNum))
                        {
                            if (currentNum > maxNumberFound)
                            {
                                maxNumberFound = currentNum;
                            }
                        }
                    }
                }
                nextNumber = maxNumberFound + 1;
            }

            string numberFormat = new string('0', numericPartLength);
            return $"{prefixWithSeparator}{nextNumber.ToString(numberFormat)}";
        }

        private IQueryable<Purchase> GetBasePurchaseQuery()
        {
            return _context.Purchases
                .Include(p => p.User)
                .Include(p => p.Supplier)
                .Include(p => p.StockLocation)
                .Include(p => p.PurchaseDetails)
                    .ThenInclude(pd => pd.ItemDetail) // ItemDetail linked by ItemCode
                        .ThenInclude(id => id.Item)   // Item from ItemDetail
                .Include(p => p.PurchaseDetails)
                    .ThenInclude(pd => pd.ItemDetail)
                        .ThenInclude(id => id.Unit);  // Unit from ItemDetail
        }

        private PurchaseReadDto MapPurchaseToReadDto(Purchase purchase)
        {
            if (purchase == null) return null;
            return new PurchaseReadDto
            {
                ID = purchase.ID,
                Code = purchase.Code,
                Date = purchase.Date,
                UserID = purchase.UserID,
                Username = purchase.User?.Username,
                SupplierID = purchase.SupplierID,
                SupplierName = purchase.Supplier?.Name,
                StockID = purchase.StockID,
                StockLocationName = purchase.StockLocation?.Name,
                TotalCost = purchase.Cost,
                Disabled = purchase.Disabled,
                Details = purchase.PurchaseDetails?.Select(pd => new PurchaseDetailReadDto
                {
                    ID = pd.ID,
                    ItemCode = pd.ItemCode,
                    ItemName = pd.ItemDetail?.Item?.Name ?? "N/A", // Safely access Item name
                    UnitName = pd.ItemDetail?.Unit?.Name ?? "N/A", // Safely access Unit name
                    Qty = pd.Qty,
                    Cost = pd.Cost // This is the line item cost
                }).ToList() ?? new List<PurchaseDetailReadDto>()
            };
        }

        public async Task<PurchaseReadDto?> CreatePurchaseAsync(PurchaseCreateDto purchaseDto, int performingUserId)
        {
            // Validate Supplier
            var supplier = await _context.Suppliers.FirstOrDefaultAsync(s => s.ID == purchaseDto.SupplierID && !s.Disabled);
            if (supplier == null)
            {
                // Log or return specific error: "Supplier not found or disabled."
                throw new ArgumentException($"Supplier with ID {purchaseDto.SupplierID} not found or disabled.");
            }

            // Validate Stock Location
            var stockLocation = await _context.Stocks.FirstOrDefaultAsync(s => s.ID == purchaseDto.StockID && !s.Disabled);
            if (stockLocation == null)
            {
                // Log or return specific error: "Stock location not found or disabled."
                throw new ArgumentException($"Stock location with ID {purchaseDto.StockID} not found or disabled.");
            }

            // Validate User (performing user)
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == performingUserId && (u.Disabled == null || !u.Disabled)); // Assuming User entity might have Disabled
            if (user == null)
            {
                // Log or return specific error: "Performing user not found or disabled."
                throw new ArgumentException($"User with ID {performingUserId} not found or disabled.");
            }

            string newPurchaseCode = await GenerateNextPurchaseCodeAsync();

            var purchase = new Purchase
            {
                Code = newPurchaseCode,
                Date = purchaseDto.Date,
                UserID = performingUserId,
                SupplierID = purchaseDto.SupplierID,
                StockID = purchaseDto.StockID,
                Disabled = false
            };

            decimal calculatedTotalCost = 0;
            var purchaseDetailEntities = new List<PurchaseDetail>();
            var detailsForInventoryLog = new List<(ItemDetail itemDetail, PurchaseDetailCreateDto detailDto)>();

            foreach (var detailDto in purchaseDto.Details)
            {
                var itemDetail = await _context.ItemDetails
                                        .Include(id => id.Item) // For ItemID
                                        .Include(id => id.Unit)   // For UnitID
                                        .FirstOrDefaultAsync(id => id.Code == detailDto.ItemCode && !id.Disabled && (id.Item != null && !id.Item.Disabled));
                if (itemDetail == null || itemDetail.Item == null)
                {
                    throw new ArgumentException($"ITem not found or disabled.");
                }
                if (detailDto.Qty <= 0) return null; // Invalid quantity

                var purchaseDetail = new PurchaseDetail
                {
                    // PurchaseCode will be set by EF Core relationship if parent 'purchase' is added first or if we set it manually
                    // Purchase = purchase, // Link to parent
                    PurchaseCode = purchase.Code, // Explicitly set for clarity and if relations not set up to cascade this Code
                    ItemCode = detailDto.ItemCode,
                    Qty = detailDto.Qty,
                    Cost = detailDto.Cost,
                    ItemDetail = itemDetail // Helps EF Core link if FK by code is tricky
                };
                purchaseDetailEntities.Add(purchaseDetail);
                detailsForInventoryLog.Add((itemDetail, detailDto));
                calculatedTotalCost += detailDto.Cost;
            }

            purchase.Cost = calculatedTotalCost;
            purchase.PurchaseDetails = purchaseDetailEntities; // Assign collection

            // Use a transaction to ensure Purchase/Details and InventoryLogs are saved together or not at all
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    _context.Purchases.Add(purchase);
                    
                    await _context.SaveChangesAsync(); // Saves Purchase and its PurchaseDetails

                    //Create InventoryLog entries manually
                    foreach (var (idEntity, pdDto) in detailsForInventoryLog)
                    {
                        // Ensure Qty and Cost from DTO are valid before division
                        if (pdDto.Qty <= 0)
                        {
                            await transaction.RollbackAsync();
                            throw new ArgumentException("Invalid quantity for inventory log processing.");
                        }

                        // ItemDetails.Qty is the ConversionFactor (INT in your SQL)
                        int quantityInBaseUnits = pdDto.Qty * idEntity.ConversionFactor;
                        decimal? costPricePerBaseUnit = null;

                        if (quantityInBaseUnits != 0)
                        {
                            costPricePerBaseUnit = pdDto.Cost / quantityInBaseUnits;
                        }
                        else if (pdDto.Cost > 0) // Cost exists but base units are zero (e.g. Qty=0 or Factor=0)
                        {
                            await transaction.RollbackAsync();
                            throw new ArgumentException("Cannot calculate cost per base unit if base quantity is zero and cost is applied.");
                        }


                        var logDto = new InventoryLogCreateDto
                        {
                            ItemID = idEntity.ItemID,
                            ItemDetailID_Transaction = idEntity.ID,
                            // UserID = performingUserId, // Provided as a parameter to CreateManualLogEntryAsync
                            TransactionType = "Purchase",
                            QuantityTransacted = pdDto.Qty,
                            UnitIDTransacted = idEntity.UnitID,
                            CostPricePerBaseUnit = costPricePerBaseUnit,
                            // ConversionFactorApplied & QuantityInBaseUnits are calculated by InventoryLogService
                        };

                        var logResult = await _inventoryLogService.CreateManualLogEntryAsync(logDto, performingUserId);
                        if (logResult == null)
                        {
                            await transaction.RollbackAsync();
                            throw new Exception("Failed to create inventory log for purchase item {pdDto.ItemCode}");
                        }
                    }

                    var journalPageDto = new JournalPageCreateDto
                    {
                        CurrencyID = 1,
                        Ref = purchase.Code, // Reference the purchase code
                        Source = "Purchase",
                        Description = $"Purchase from supplier: {supplier.Name}, Code: {purchase.Code}",
                        JournalEntries = new List<JournalPostCreateDto>
                        {
                            new JournalPostCreateDto // Debit Inventory
                            {
                                AccountNumber = INVENTORY_ACCOUNT_NUMBER, 
                                Description = $"Inventory purchased - {purchase.Code}",
                                Debit = purchase.Cost ?? 0, 
                                Credit = 0,
                                Ref = purchase.Code 
                            },
                            new JournalPostCreateDto // Credit Cash/Accounts Payable
                            {
                                AccountNumber = CASH_ACCOUNT_NUMBER, 
                                Description = $"Payment for purchase - {purchase.Code}",
                                Debit = 0,
                                Credit = purchase.Cost ?? 0, 
                                Ref = purchase.Code 
                            }
                        }
                    };

                    var journalResult = await _journalService.CreateJournalPageAsync(journalPageDto, performingUserId);

                    if (journalResult == null)
                    {
                        await transaction.RollbackAsync();
                        throw new Exception("Failed to create journal entries for the purchase.");
                    }

                    await transaction.CommitAsync();
                }
                catch (DbUpdateException ex) // Catches issues from SaveChangesAsync (Purchase/Details or CodeSequence)
                {
                    await transaction.RollbackAsync();
                    // Log ex.InnerException?.Message or ex.ToString()
                    if (ex.InnerException?.Message.Contains("UNIQUE KEY constraint") == true &&
                        (ex.InnerException.Message.Contains(purchase.Code) || ex.InnerException.Message.Contains("UK_Purchase_Code")))
                    {
                        return null;
                    }
                    throw;
                }
                catch (Exception ex) 
                {
                    await transaction.RollbackAsync();
                    throw; 
                }
            }

            // Re-fetch the created purchase with all its details fully loaded for the response DTO
            var createdPurchaseWithDetails = await GetBasePurchaseQuery().FirstOrDefaultAsync(p => p.ID == purchase.ID);
            return MapPurchaseToReadDto(createdPurchaseWithDetails);
        }


        public async Task<PurchaseReadDto?> GetPurchaseByIdAsync(int purchaseId)
        {
            var purchase = await GetBasePurchaseQuery().FirstOrDefaultAsync(p => p.ID == purchaseId);
            return MapPurchaseToReadDto(purchase);
        }

        public async Task<PurchaseReadDto?> GetPurchaseByCodeAsync(string purchaseCode)
        {
            var purchase = await GetBasePurchaseQuery().FirstOrDefaultAsync(p => p.Code == purchaseCode);
            return MapPurchaseToReadDto(purchase);
        }

        public async Task<(IEnumerable<PurchaseReadDto> Purchases, int TotalCount)> GetAllPurchasesAsync(PurchaseQueryParameters queryParams)
        {
            var query = GetBasePurchaseQuery().AsQueryable();

            if (!queryParams.IncludeDisabled.GetValueOrDefault(false))
            {
                query = query.Where(p => !p.Disabled);
            }
            // Add other filters from queryParams
            if (!string.IsNullOrWhiteSpace(queryParams.Code))
                query = query.Where(p => p.Code.Contains(queryParams.Code));
            if (queryParams.SupplierID.HasValue)
                query = query.Where(p => p.SupplierID == queryParams.SupplierID.Value);
            if (queryParams.StockID.HasValue)
                query = query.Where(p => p.StockID == queryParams.StockID.Value);
            if (queryParams.StartDate.HasValue)
                query = query.Where(p => p.Date >= queryParams.StartDate.Value);
            if (queryParams.EndDate.HasValue)
                query = query.Where(p => p.Date <= queryParams.EndDate.Value);


            var totalCount = await query.CountAsync();
            var purchases = await query
                                .OrderByDescending(p => p.Date)
                                .ThenByDescending(p => p.ID)
                                .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
                                .Take(queryParams.PageSize)
                                .ToListAsync();

            return (purchases.Select(MapPurchaseToReadDto).Where(dto => dto != null).ToList()!, totalCount);
        }

        public async Task<bool> SoftDeletePurchaseAsync(int purchaseId)
        {
            var purchase = await _context.Purchases.FindAsync(purchaseId);
            if (purchase == null) return false;
            if (purchase.Disabled) return true; // Already disabled

            // Soft deleting a purchase usually means it's cancelled.
            // The InventoryLog entries already made by its details ARE NOT automatically reversed by this.
            // A "Vendor Return" process would be needed to create counter-entries in InventoryLog.
            purchase.Disabled = true;
            _context.Entry(purchase).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await PurchaseExistsAsync(purchaseId)) return false;
                throw;
            }
            return true;
        }

        public async Task<bool> PurchaseExistsAsync(int purchaseId)
        {
            return await _context.Purchases.AnyAsync(e => e.ID == purchaseId);
        }
    }
}