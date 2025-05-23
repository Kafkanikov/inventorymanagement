using ECommerce.Server.Data;
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Data.Entities; // For ItemDetail, Item, Unit
using ECommerce.Server.Data.Views;    // For CurrentStockViewResult
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ECommerce.Server.Services
{
    public class StockQueryService : IStockQueryService
    {
        private readonly EcommerceDbContext _context;

        public StockQueryService(EcommerceDbContext context)
        {
            _context = context;
        }

        public async Task<ItemStockReadDto?> GetItemStockDetailsAsync(int itemId)
        {
            // 1. Get the item itself to check its status and base unit info
            var item = await _context.Items
                                     .Include(i => i.BaseUnit)
                                     .FirstOrDefaultAsync(i => i.ID == itemId);

            if (item == null) // Item doesn't exist
            {
                return null;
            }

            // 2. Get current stock in base units from the view
            var currentStockInfo = await _context.CurrentStockLevels // Querying the DbSet mapped to V_CurrentStock
                                             .FirstOrDefaultAsync(cs => cs.ItemID == itemId);

            int qtyOnHandBase = currentStockInfo?.QuantityOnHandInBaseUnits ?? 0;

            // 3. Get all active ItemDetails for this item to show conversions
            var itemDetails = await _context.ItemDetails
                                        .Include(id => id.Unit)
                                        .Where(id => id.ItemID == itemId && !id.Disabled) // Only active ItemDetails
                                        .OrderBy(id => id.UnitID == item.BaseUnitID ? 0 : 1) // Base unit first
                                        .ThenBy(id => id.Unit.Name)
                                        .ToListAsync();

            var resultDto = new ItemStockReadDto
            {
                ItemID = item.ID,
                ItemName = item.Name,
                ItemDisabled = item.Disabled,
                BaseUnitID = item.BaseUnitID,
                BaseUnitName = item.BaseUnit?.Name ?? "N/A", // BaseUnit should be loaded
                QuantityOnHandInBaseUnits = qtyOnHandBase,
                AvailableUnitsStock = new List<ItemStockUnitDetailDto>()
            };

            // Populate stock in different units
            if (item.BaseUnit != null) // Ensure base unit is loaded
            {
                // Add the base unit representation first
                resultDto.AvailableUnitsStock.Add(new ItemStockUnitDetailDto
                {
                    UnitID = item.BaseUnitID,
                    UnitName = item.BaseUnit.Name,
                    ItemDetailCode = itemDetails.FirstOrDefault(id => id.UnitID == item.BaseUnitID)?.Code ?? "N/A_BASE", // Base might not have a specific "Code" in ItemDetails if not explicitly added
                    ConversionFactorToBase = 1,
                    QuantityOnHandInThisUnit = qtyOnHandBase, // Already in base units
                    IsBaseUnit = true,
                    SellingPriceForThisUnit = itemDetails.FirstOrDefault(id => id.UnitID == item.BaseUnitID)?.Price
                });
            }


            foreach (var detail in itemDetails)
            {
                // Avoid duplicating the base unit if it was already added
                if (detail.UnitID == item.BaseUnitID && resultDto.AvailableUnitsStock.Any(aus => aus.IsBaseUnit))
                {
                    // If base unit ItemDetail exists, update its price and code if necessary
                    var baseUnitStockDetail = resultDto.AvailableUnitsStock.First(aus => aus.IsBaseUnit);
                    baseUnitStockDetail.ItemDetailCode = detail.Code; // Ensure the actual ItemDetail code for base unit is used
                    baseUnitStockDetail.SellingPriceForThisUnit = detail.Price;
                    continue;
                }

                if (detail.ConversionFactor == 0) continue; // Avoid division by zero

                resultDto.AvailableUnitsStock.Add(new ItemStockUnitDetailDto
                {
                    UnitID = detail.UnitID,
                    UnitName = detail.Unit?.Name ?? "N/A",
                    ItemDetailCode = detail.Code,
                    ConversionFactorToBase = detail.ConversionFactor, // This is ItemDetails.Qty (INT)
                    QuantityOnHandInThisUnit = (decimal)qtyOnHandBase / detail.ConversionFactor, // Result is decimal
                    IsBaseUnit = false,
                    SellingPriceForThisUnit = detail.Price
                });
            }
            // Ensure unique entries if base unit was handled by both default and ItemDetail entry
            resultDto.AvailableUnitsStock = resultDto.AvailableUnitsStock
               .GroupBy(ud => ud.UnitID)
               .Select(g => g.First()) // Or apply more specific logic if needed
               .OrderBy(ud => ud.IsBaseUnit ? 0 : 1)
               .ThenBy(ud => ud.UnitName)
               .ToList();


            return resultDto;
        }

        public async Task<(IEnumerable<ItemStockReadDto> ItemsStock, int TotalCount)> GetAllItemsStockDetailsAsync(StockQueryParameters queryParams)
        {
            // 1. Query Items based on filters
            var itemsQuery = _context.Items
                                     .Include(i => i.BaseUnit)
                                     .AsQueryable();

            if (!string.IsNullOrWhiteSpace(queryParams.NameFilter))
            {
                itemsQuery = itemsQuery.Where(i => i.Name.Contains(queryParams.NameFilter));
            }
            if (queryParams.CategoryID.HasValue)
            {
                itemsQuery = itemsQuery.Where(i => i.CategoryID == queryParams.CategoryID.Value);
            }
            // Add more filters as needed, e.g., for Item.Disabled based on a DTO property

            var totalItemCount = await itemsQuery.CountAsync();

            var items = await itemsQuery
                              .OrderBy(i => i.Name)
                              .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
                              .Take(queryParams.PageSize)
                              .ToListAsync();

            // 2. Get all current stock levels from the view for the selected items (or all items if not too many)
            var itemIds = items.Select(i => i.ID).ToList();
            var currentStocks = await _context.CurrentStockLevels
                                          .Where(cs => itemIds.Contains(cs.ItemID)) // Filter for relevant items
                                          .ToDictionaryAsync(cs => cs.ItemID, cs => cs.QuantityOnHandInBaseUnits);

            // 3. Get all relevant ItemDetails for these items
            var allItemDetails = await _context.ItemDetails
                                           .Include(id => id.Unit)
                                           .Where(id => itemIds.Contains(id.ItemID) && !id.Disabled)
                                           .ToListAsync();

            var resultList = new List<ItemStockReadDto>();

            foreach (var item in items)
            {
                int qtyOnHandBase = currentStocks.TryGetValue(item.ID, out var stock) ? stock : 0;
                var itemDetailsForItem = allItemDetails.Where(id => id.ItemID == item.ID).ToList();

                var itemStockDto = new ItemStockReadDto
                {
                    ItemID = item.ID,
                    ItemName = item.Name,
                    ItemDisabled = item.Disabled,
                    BaseUnitID = item.BaseUnitID,
                    BaseUnitName = item.BaseUnit?.Name ?? "N/A",
                    QuantityOnHandInBaseUnits = qtyOnHandBase,
                    AvailableUnitsStock = new List<ItemStockUnitDetailDto>()
                };

                if (item.BaseUnit != null)
                {
                    itemStockDto.AvailableUnitsStock.Add(new ItemStockUnitDetailDto
                    {
                        UnitID = item.BaseUnitID,
                        UnitName = item.BaseUnit.Name,
                        ItemDetailCode = itemDetailsForItem.FirstOrDefault(id => id.UnitID == item.BaseUnitID)?.Code ?? "N/A_BASE",
                        ConversionFactorToBase = 1,
                        QuantityOnHandInThisUnit = qtyOnHandBase,
                        IsBaseUnit = true,
                        SellingPriceForThisUnit = itemDetailsForItem.FirstOrDefault(id => id.UnitID == item.BaseUnitID)?.Price
                    });
                }

                foreach (var detail in itemDetailsForItem)
                {
                    if (detail.UnitID == item.BaseUnitID && itemStockDto.AvailableUnitsStock.Any(aus => aus.IsBaseUnit))
                    {
                        var baseUnitStockDetail = itemStockDto.AvailableUnitsStock.First(aus => aus.IsBaseUnit);
                        baseUnitStockDetail.ItemDetailCode = detail.Code;
                        baseUnitStockDetail.SellingPriceForThisUnit = detail.Price;
                        continue;
                    }
                    if (detail.ConversionFactor == 0) continue;

                    itemStockDto.AvailableUnitsStock.Add(new ItemStockUnitDetailDto
                    {
                        UnitID = detail.UnitID,
                        UnitName = detail.Unit?.Name ?? "N/A",
                        ItemDetailCode = detail.Code,
                        ConversionFactorToBase = detail.ConversionFactor,
                        QuantityOnHandInThisUnit = (decimal)qtyOnHandBase / detail.ConversionFactor,
                        IsBaseUnit = false,
                        SellingPriceForThisUnit = detail.Price
                    });
                }
                itemStockDto.AvailableUnitsStock = itemStockDto.AvailableUnitsStock
                   .GroupBy(ud => ud.UnitID)
                   .Select(g => g.First())
                   .OrderBy(ud => ud.IsBaseUnit ? 0 : 1)
                   .ThenBy(ud => ud.UnitName)
                   .ToList();

                resultList.Add(itemStockDto);
            }

            return (resultList, totalItemCount);
        }
        //public async Task<ItemFinancialSummaryViewResult?> GetItemFinancialSummaryAsync(int itemId)
        //{
        //    return await _context.ItemFinancialSummaries
        //        .FirstOrDefaultAsync(s => s.ItemID == itemId);
        //}

        //public async Task<(IEnumerable<ItemFinancialSummaryViewResult> Summaries, int TotalCount)> GetAllItemFinancialSummariesAsync(FinancialSummaryQueryParameters queryParams)
        //{
        //    var query = _context.ItemFinancialSummaries.AsQueryable();

        //    // Add filtering based on queryParams (e.g., ItemName, ItemDisabled)
        //    if (!queryParams.IncludeDisabled) // Assuming FinancialSummaryQueryParameters has IncludeDisabled
        //    {
        //        query = query.Where(s => !s.ItemDisabled);
        //    }
        //    if (!string.IsNullOrWhiteSpace(queryParams.NameFilter))
        //    {
        //        query = query.Where(s => s.ItemName.Contains(queryParams.NameFilter));
        //    }
        //    // Add other filters as needed

        //    var totalCount = await query.CountAsync();
        //    var summaries = await query
        //        .OrderBy(s => s.ItemName)
        //        .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
        //        .Take(queryParams.PageSize)
        //        .ToListAsync();
        //    return (summaries, totalCount);
        //}
    }
}