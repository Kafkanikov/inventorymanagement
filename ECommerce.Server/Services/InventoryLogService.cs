using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Data.Entities;
using ECommerce.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Server.Services
{
    public class InventoryLogService : IInventoryLogService
    {
        private readonly EcommerceDbContext _context;

        public InventoryLogService(EcommerceDbContext context)
        {
            _context = context;
        }

        private IQueryable<InventoryLog> GetBaseLogQuery() // Unchanged
        {
            return _context.InventoryLogs
                .Include(log => log.Item)
                .ThenInclude(item => item.BaseUnit)
                .Include(log => log.ItemDetail)
                    .ThenInclude(id => id!.Unit) // Added null-forgiving operator for consistency if ItemDetail can be null
                .Include(log => log.User)
                .Include(log => log.TransactedUnit);
        }

        private InventoryLogReadDto MapToReadDto(InventoryLog log) // Modified
        {
            return new InventoryLogReadDto
            {
                LogID = log.LogID,
                ItemID = log.ItemID,
                ItemName = log.Item?.Name ?? "N/A",
                ItemDetailID_Transaction = log.ItemDetailID_Transaction,
                ItemDetailCode = log.ItemDetail?.Code,
                UserID = log.UserID,
                Username = log.User?.Username ?? "N/A",
                Timestamp = log.Timestamp,
                TransactionType = log.TransactionType,
                QuantityTransacted = log.QuantityTransacted,
                UnitIDTransacted = log.UnitIDTransacted,
                TransactedUnitName = log.TransactedUnit?.Name ?? "N/A",
                ConversionFactorApplied = log.ConversionFactorApplied,
                QuantityInBaseUnits = log.QuantityInBaseUnits,
                CostPricePerBaseUnit = log.CostPricePerBaseUnit,
                SalePricePerTransactedUnit = log.SalePricePerTransactedUnit
                // Notes = log.Notes // REMOVED THIS LINE
            };
        }

        public async Task<InventoryLogReadDto?> CreateManualLogEntryAsync(InventoryLogCreateDto logDto, int performingUserId) // Modified
        {
            // ... (validation logic for ItemID, UnitIDTransacted, TransactionType, pricing etc. remains the same) ...
            if (logDto.TransactionType == "Purchase" || logDto.TransactionType == "Sale")
            {
                return null;
            }
            if (logDto.QuantityTransacted == 0)
            {
                return null;
            }

            var item = await _context.Items
                                     .Include(i => i.BaseUnit)
                                     .FirstOrDefaultAsync(i => i.ID == logDto.ItemID && !i.Disabled);
            if (item == null) return null;

            var transactedUnit = await _context.Units.FirstOrDefaultAsync(u => u.ID == logDto.UnitIDTransacted && !u.Disabled);
            if (transactedUnit == null) return null;

            ItemDetail? itemDetailContext = null;
            int conversionFactor;

            if (logDto.ItemDetailID_Transaction.HasValue)
            {
                itemDetailContext = await _context.ItemDetails
                    .FirstOrDefaultAsync(id => id.ID == logDto.ItemDetailID_Transaction.Value &&
                                                id.ItemID == item.ID &&
                                                id.UnitID == transactedUnit.ID &&
                                                !id.Disabled);
                if (itemDetailContext == null) return null;
                conversionFactor = itemDetailContext.ConversionFactor;
            }
            else if (transactedUnit.ID == item.BaseUnitID)
            {
                conversionFactor = 1;
            }
            else
            {
                itemDetailContext = await _context.ItemDetails
                    .FirstOrDefaultAsync(id => id.ItemID == item.ID &&
                                                id.UnitID == transactedUnit.ID &&
                                                !id.Disabled);
                if (itemDetailContext == null) return null;
                conversionFactor = itemDetailContext.ConversionFactor;
            }

            if (conversionFactor <= 0) return null;

            int quantityInBaseUnits = (int)(Math.Abs(logDto.QuantityTransacted) * conversionFactor);

            decimal? costPrice = null;
            decimal? salePrice = null;

            var validInTypes = new[] { "Purchase", "Customer Return", "Stock Adjustment In", "Initial Stock" };
            var validOutTypes = new[] { "Sale", "Vendor Return" };

            if (validInTypes.Contains(logDto.TransactionType))
            {
                if (logDto.CostPricePerBaseUnit.HasValue && logDto.CostPricePerBaseUnit < 0) return null;
                costPrice = logDto.CostPricePerBaseUnit;
                if (logDto.SalePricePerTransactedUnit.HasValue) return null;
            }
            else if (validOutTypes.Contains(logDto.TransactionType))
            {
                if (logDto.SalePricePerTransactedUnit.HasValue && logDto.SalePricePerTransactedUnit < 0) return null;
                salePrice = logDto.SalePricePerTransactedUnit;
                if (logDto.CostPricePerBaseUnit.HasValue) return null;
            }
            else if (logDto.TransactionType == "Stock Adjustment Out")
            {
                if (logDto.SalePricePerTransactedUnit.HasValue) return null;
                if (logDto.CostPricePerBaseUnit.HasValue && logDto.CostPricePerBaseUnit < 0) return null;
                costPrice = logDto.CostPricePerBaseUnit;
            }
            else
            {
                if (logDto.CostPricePerBaseUnit.HasValue || logDto.SalePricePerTransactedUnit.HasValue) return null;
            }


            var inventoryLogEntry = new InventoryLog
            {
                ItemID = item.ID,
                ItemDetailID_Transaction = itemDetailContext?.ID,
                UserID = performingUserId,
                Timestamp = DateTime.UtcNow,
                TransactionType = logDto.TransactionType,
                QuantityTransacted = logDto.QuantityTransacted,
                UnitIDTransacted = transactedUnit.ID,
                ConversionFactorApplied = conversionFactor,
                QuantityInBaseUnits = quantityInBaseUnits,
                CostPricePerBaseUnit = costPrice,
                SalePricePerTransactedUnit = salePrice
                // Notes = logDto.Notes // REMOVED THIS LINE
            };

            _context.InventoryLogs.Add(inventoryLogEntry);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException /* ex */) { /* Log ex */ return null; }

            var createdLog = await GetBaseLogQuery().FirstOrDefaultAsync(log => log.LogID == inventoryLogEntry.LogID);
            return createdLog != null ? MapToReadDto(createdLog) : null;
        }

        // GetAllLogEntriesAsync and GetLogEntryByIdAsync will use the modified MapToReadDto
        public async Task<(IEnumerable<InventoryLogReadDto> Logs, int TotalCount)> GetAllLogEntriesAsync(InventoryLogQueryParameters queryParams) // Unchanged logic, but uses updated MapToReadDto
        {
            var query = GetBaseLogQuery();

            if (queryParams.ItemID.HasValue) query = query.Where(log => log.ItemID == queryParams.ItemID.Value);
            if (queryParams.UserID.HasValue) query = query.Where(log => log.UserID == queryParams.UserID.Value);
            if (!string.IsNullOrWhiteSpace(queryParams.TransactionType)) query = query.Where(log => log.TransactionType == queryParams.TransactionType);
            if (queryParams.StartDate.HasValue) query = query.Where(log => log.Timestamp >= queryParams.StartDate.Value);
            if (queryParams.EndDate.HasValue) query = query.Where(log => log.Timestamp < queryParams.EndDate.Value.AddDays(1));

            var totalCount = await query.CountAsync();

            var logs = await query
                .OrderByDescending(log => log.Timestamp)
                .ThenByDescending(log => log.LogID)
                .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
                .Take(queryParams.PageSize)
                .ToListAsync();

            return (logs.Select(MapToReadDto), totalCount);
        }

        public async Task<InventoryLogReadDto?> GetLogEntryByIdAsync(int logId) // Unchanged logic, but uses updated MapToReadDto
        {
            var logEntry = await GetBaseLogQuery().FirstOrDefaultAsync(log => log.LogID == logId);
            return logEntry != null ? MapToReadDto(logEntry) : null;
        }
    }
}