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
    public class SaleService : ISaleService
    {
        private readonly EcommerceDbContext _context;
        private readonly IInventoryLogService _inventoryLogService;

        public SaleService(EcommerceDbContext context, IInventoryLogService inventoryLogService)
        {
            _context = context;
            _inventoryLogService = inventoryLogService;
        }
        private async Task<decimal?> GetCurrentWeightedAverageCostPerBaseUnitAsync(int itemId)
        {
            // Considers 'Purchase' and 'Initial Stock' transactions that have a cost
            var costBasisTransactions = await _context.InventoryLogs
                .Where(log => log.ItemID == itemId &&
                              (log.TransactionType == "Purchase" || log.TransactionType == "Initial Stock") &&
                              log.CostPricePerBaseUnit.HasValue && log.QuantityInBaseUnits > 0)
                .Select(log => new
                {
                    TotalValueForTransaction = log.CostPricePerBaseUnit.Value * log.QuantityInBaseUnits,
                    QuantityInBaseUnits = log.QuantityInBaseUnits
                })
                .ToListAsync();

            if (!costBasisTransactions.Any())
            {
                return null; 
            }

            decimal totalCostIncurred = costBasisTransactions.Sum(t => t.TotalValueForTransaction);
            int totalQuantityPurchasedInBaseUnits = costBasisTransactions.Sum(t => t.QuantityInBaseUnits);

            if (totalQuantityPurchasedInBaseUnits == 0)
            {
                return null; 
            }

            return totalCostIncurred / totalQuantityPurchasedInBaseUnits;
        }

        // Helper to generate next code (Option A: Query Max Existing Code)
        private async Task<string> GenerateNextSaleCodeAsync(string prefix = "SAL", int numericPartLength = 5)
        {
            string prefixWithSeparator = $"{prefix}-";
            int nextNumber = 1;

            var relevantCodes = await _context.Sales // Query the Sales table
                .Where(s => s.Code.StartsWith(prefixWithSeparator))
                .Select(s => s.Code)
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

        // Helper to get current GLOBAL stock for an item
        private async Task<int> GetCurrentGlobalStockInBaseUnitsAsync(int itemId)
        {
            // Summing up QuantityInBaseUnits from InventoryLog for the given ItemID
            // Note: InventoryLog.QuantityInBaseUnits is INT in your schema.
            var stock = await _context.InventoryLogs
                .Where(log => log.ItemID == itemId)
                .SumAsync(log =>
                    (log.TransactionType == "Purchase" ||
                     log.TransactionType == "Stock Adjustment In" ||
                     log.TransactionType == "Customer Return" || // Assuming customer return ADDS to stock
                     log.TransactionType == "Initial Stock")
                    ? log.QuantityInBaseUnits
                    : (log.TransactionType == "Sale" ||
                       log.TransactionType == "Stock Adjustment Out" ||
                       log.TransactionType == "Vendor Return") // Assuming vendor return REMOVES from stock
                    ? -log.QuantityInBaseUnits
                    : 0);
            return stock; // This is int because QuantityInBaseUnits is int
        }


        private IQueryable<Sale> GetBaseSaleQuery()
        {
            return _context.Sales
                .Include(s => s.User)
                .Include(s => s.StockLocation) // The location where the sale occurred
                .Include(s => s.SaleDetails)
                    .ThenInclude(sd => sd.ItemDetail)
                        .ThenInclude(id => id.Item)
                .Include(s => s.SaleDetails)
                    .ThenInclude(sd => sd.ItemDetail)
                        .ThenInclude(id => id.Unit);
        }

        private SaleReadDto MapSaleToReadDto(Sale sale)
        {
            if (sale == null) return null;
            return new SaleReadDto
            {
                ID = sale.ID,
                Code = sale.Code,
                Date = sale.Date,
                UserID = sale.UserID,
                Username = sale.User?.Username,
                StockID = sale.StockID,
                StockLocationName = sale.StockLocation?.Name,
                TotalPrice = sale.Price,
                Disabled = sale.Disabled,
                Details = sale.SaleDetails?.Select(sd => new SaleDetailReadDto
                {
                    ID = sd.ID,
                    ItemCode = sd.ItemCode,
                    ItemName = sd.ItemDetail?.Item?.Name ?? "N/A",
                    UnitName = sd.ItemDetail?.Unit?.Name ?? "N/A",
                    Qty = sd.Qty,
                    LinePrice = sd.Cost // Mapping SaleDetails.Cost to LinePrice in DTO
                }).ToList() ?? new List<SaleDetailReadDto>()
            };
        }

        public async Task<SaleReadDto?> CreateSaleAsync(SaleCreateDto saleDto, int performingUserId)
        {
            var stockLocation = await _context.Stocks.FirstOrDefaultAsync(s => s.ID == saleDto.StockID && !s.Disabled);
            if (stockLocation == null)
            {
                return null; }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == performingUserId && !u.Disabled);
            if (user == null) { /* Log: Invalid user */ return null; }

            string newSaleCode = await GenerateNextSaleCodeAsync();

            var sale = new Sale
            {
                Code = newSaleCode,
                Date = saleDto.Date,
                UserID = performingUserId,
                StockID = saleDto.StockID,
                Disabled = false,
                SaleDetails = new List<SaleDetail>() // Initialize collection
            };

            decimal calculatedTotalSalePrice = 0;
            decimal accumulatedTotalCOGS = 0; // To store sum of COGS for the Sale header

            // Temporary list to hold data needed for inventory logging after Sale and SaleDetails are saved
            var detailsForInventoryLog = new List<(ItemDetail itemDetail, SaleDetailCreateDto detailDto, decimal avgCostPerBaseUnit)>();
            var itemsToVerifyStock = new Dictionary<int, (int quantityNeeded, string itemName)>();


            foreach (var detailDto in saleDto.Details)
            {
                var itemDetail = await _context.ItemDetails
                                        .Include(id => id.Item) // For ItemID and Item.Name
                                        .FirstOrDefaultAsync(id => id.Code == detailDto.ItemCode && !id.Disabled && (id.Item != null && !id.Item.Disabled));

                if (itemDetail == null || itemDetail.Item == null)
                {
                    // Log: $"Invalid ItemDetail Code or associated item: {detailDto.ItemCode}"
                    return null; // Or throw an exception to be handled by controller
                }
                if (detailDto.Qty <= 0)
                {
                    // Log: $"Invalid quantity for ItemCode: {detailDto.ItemCode}"
                    return null;
                }

                int quantitySoldInItemDetailUnits = detailDto.Qty;
                int conversionFactor = itemDetail.ConversionFactor; // This is ItemDetails.Qty (e.g., 24)
                int quantitySoldInBaseUnits = quantitySoldInItemDetailUnits * conversionFactor;

                // Aggregate quantities for stock check
                if (itemsToVerifyStock.ContainsKey(itemDetail.ItemID))
                {
                    itemsToVerifyStock[itemDetail.ItemID] = (itemsToVerifyStock[itemDetail.ItemID].quantityNeeded + quantitySoldInBaseUnits, itemDetail.Item.Name);
                }
                else
                {
                    itemsToVerifyStock.Add(itemDetail.ItemID, (quantitySoldInBaseUnits, itemDetail.Item.Name));
                }

                // --- Calculate COGS for this line ---
                decimal? avgCostPerBaseUnitNullable = await GetCurrentWeightedAverageCostPerBaseUnitAsync(itemDetail.ItemID);
                if (!avgCostPerBaseUnitNullable.HasValue)
                {
                    return null;
                }
                decimal avgCostPerBaseUnit = avgCostPerBaseUnitNullable.Value;
                decimal cogsForThisLine = (decimal)quantitySoldInBaseUnits * avgCostPerBaseUnit;
                // --- End COGS Calculation ---
                var saleDetailEntity = new SaleDetail
                {
                    // SaleCode will be set by EF Core if Sale parent is added with details, or set manually
                    SaleCode = sale.Code, // Set explicitly
                    ItemCode = detailDto.ItemCode,
                    Qty = detailDto.Qty,
                    Cost = detailDto.LinePrice,       // This is Total Selling Price for this line
                    CalculatedCOGS = cogsForThisLine  // Populate the new COGS field
                };
                sale.SaleDetails.Add(saleDetailEntity); // Add to the Sale's collection

                calculatedTotalSalePrice += detailDto.LinePrice;
                accumulatedTotalCOGS += cogsForThisLine;

                detailsForInventoryLog.Add((itemDetail, detailDto, avgCostPerBaseUnit));
            }

            // Perform Stock Availability Check (Global) - AFTER aggregating all needs
            foreach (var itemStockEntry in itemsToVerifyStock)
            {
                int currentGlobalStock = await GetCurrentGlobalStockInBaseUnitsAsync(itemStockEntry.Key /* ItemID */);
                if (currentGlobalStock < itemStockEntry.Value.quantityNeeded)
                {
                    // Log: $"Insufficient global stock for item: {itemStockEntry.Value.itemName}..."
                    return null; // Insufficient stock
                }
            }

            sale.Price = calculatedTotalSalePrice;
            sale.TotalCOGS = accumulatedTotalCOGS; // 

            _context.Sales.Add(sale); // EF Core tracks sale and its SaleDetails

            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    await _context.SaveChangesAsync(); // Saves Sale, SaleDetails (with CalculatedCOGS), and CodeSequence update

                    // Create InventoryLog entries
                    foreach (var (idEntity, sdDto, cogsPbUnit) in detailsForInventoryLog)
                    {
                        if (sdDto.Qty <= 0) continue; // Should have been caught

                        decimal salePricePerTransactedUnit = sdDto.LinePrice / sdDto.Qty;

                        var logDto = new InventoryLogCreateDto
                        {
                            ItemID = idEntity.ItemID,
                            ItemDetailID_Transaction = idEntity.ID,
                            TransactionType = "Sale",
                            QuantityTransacted = sdDto.Qty,
                            UnitIDTransacted = idEntity.UnitID,
                            CostPricePerBaseUnit = cogsPbUnit, // This is the COGS per base unit for this sale
                            SalePricePerTransactedUnit = salePricePerTransactedUnit,
                        };
                        var logResult = await _inventoryLogService.CreateManualLogEntryAsync(logDto, performingUserId);
                        if (logResult == null)
                        {
                            await transaction.RollbackAsync();
                            // Log error
                            return null;
                        }
                    }

                    await transaction.CommitAsync();
                }
                catch (DbUpdateException ex)
                {
                    await transaction.RollbackAsync();
                    if (ex.InnerException?.Message.Contains("UNIQUE KEY constraint") == true && ex.InnerException.Message.Contains(sale.Code))
                    {
                        return null; // Code conflict
                    }
                    // Log ex
                    throw;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    // Log ex
                    throw;
                }
            }

            var createdSaleWithDetails = await GetBaseSaleQuery().FirstOrDefaultAsync(s => s.ID == sale.ID);
            return MapSaleToReadDto(createdSaleWithDetails);
        }
        public async Task<SaleReadDto?> GetSaleByIdAsync(int saleId)
        {
            var sale = await GetBaseSaleQuery().FirstOrDefaultAsync(s => s.ID == saleId);
            return MapSaleToReadDto(sale);
        }
        public async Task<SaleReadDto?> GetSaleByCodeAsync(string saleCode)
        {
            var sale = await GetBaseSaleQuery().FirstOrDefaultAsync(s => s.Code == saleCode);
            return MapSaleToReadDto(sale);
        }


        public async Task<(IEnumerable<SaleReadDto> Sales, int TotalCount)> GetAllSalesAsync(SaleQueryParameters queryParams)
        {
            var query = GetBaseSaleQuery();

            if (!queryParams.IncludeDisabled.GetValueOrDefault(false))
            {
                query = query.Where(s => !s.Disabled);
            }
            if (!string.IsNullOrWhiteSpace(queryParams.Code))
            {
                query = query.Where(s => s.Code.Contains(queryParams.Code));
            }
            if (queryParams.StockID.HasValue)
            {
                query = query.Where(s => s.StockID == queryParams.StockID.Value);
            }
            if (queryParams.StartDate.HasValue)
            {
                query = query.Where(s => s.Date >= queryParams.StartDate.Value);
            }
            if (queryParams.EndDate.HasValue)
            {
                query = query.Where(s => s.Date <= queryParams.EndDate.Value);
            }

            var totalCount = await query.CountAsync();
            var sales = await query
                .OrderByDescending(s => s.Date)
                .ThenByDescending(s => s.ID)
                .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
                .Take(queryParams.PageSize)
                .ToListAsync();

            return (sales.Select(MapSaleToReadDto).Where(s => s != null).ToList()!, totalCount);
        }

        public async Task<bool> SoftDeleteSaleAsync(int saleId)
        {
            var sale = await _context.Sales.FindAsync(saleId);
            if (sale == null) return false;
            if (sale.Disabled) return true;

            // Business Rule: Soft deleting a sale typically makes it inactive.
            // It does NOT automatically reverse the inventory movements in InventoryLog.
            // A "Customer Return" transaction would be needed to adjust stock back.
            sale.Disabled = true;
            _context.Entry(sale).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await SaleExistsAsync(saleId)) return false;
                throw;
            }
            return true;
        }

        public async Task<bool> SaleExistsAsync(int saleId)
        {
            return await _context.Sales.AnyAsync(e => e.ID == saleId);
        }
    }
}