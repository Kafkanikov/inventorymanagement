﻿// File: Services/ItemDetailService.cs
using ECommerce.Server.Data;
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Data.Entities;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ECommerce.Server.Services
{
    public class ItemDetailService : IItemDetailService
    {
        private readonly EcommerceDbContext _context;

        public ItemDetailService(EcommerceDbContext context)
        {
            _context = context;
        }
        private ItemDetailReadDto MapToReadDto(ItemDetail itemDetail, ItemDetailStockViewResult? stockInfo)
        {
            return new ItemDetailReadDto
            {
                ID = itemDetail.ID,
                Code = itemDetail.Code,
                ItemID = itemDetail.ItemID,
                ItemName = itemDetail.Item?.Name ?? "N/A", // Assumes Item is included if needed elsewhere
                UnitID = itemDetail.UnitID,
                UnitName = itemDetail.Unit?.Name ?? "N/A", // Assumes Unit is included
                DefinedPackageQty = itemDetail.ConversionFactor, // This is ItemDetails.Qty
                Price = itemDetail.Price,
                Disabled = itemDetail.Disabled,
                QuantityOnHand = stockInfo?.QuantityOnHandInItemDetailUnit ?? 0
            };
        }

        private ItemDetailReadDto MapToReadDto(ItemDetailStockViewResult stockInfo)
        {
            return new ItemDetailReadDto
            {
                ID = stockInfo.ItemDetailID,
                Code = stockInfo.ItemDetailCode,
                ItemID = stockInfo.ItemID,
                ItemName = stockInfo.ItemName,
                UnitID = stockInfo.ItemDetailUnitID,
                UnitName = stockInfo.ItemDetailUnitName,
                DefinedPackageQty = stockInfo.DefinedPackageFactor,
                Price = stockInfo.SellingPrice, // Assuming V_ItemDetailStockOnHand includes ItemDetails.Price
                Disabled = stockInfo.ItemDetailDisabled, // Or a combination if parent item disabled matters
                QuantityOnHand = stockInfo.QuantityOnHandInItemDetailUnit
            };
        }

        private IQueryable<ItemDetail> GetBaseItemDetailQuery()
        {
            return _context.ItemDetails
                .Include(id => id.Item)
                .Include(id => id.Unit);
        }

        public async Task<IEnumerable<ItemDetailReadDto>> GetAllItemDetailsAsync(bool includeDisabled = false)
        {
            var query = _context.ItemDetailStockLevels.AsQueryable(); // Query the view

            if (!includeDisabled)
            {
                // The view itself can have ItemDetailDisabled and ParentItemDisabled
                query = query.Where(id => !id.ItemDetailDisabled && !id.ParentItemDisabled);
            }

            var stockDetails = await query
                .OrderBy(s => s.ItemName)
                .ThenBy(s => s.ItemDetailCode)
                .ToListAsync();

            return stockDetails.Select(MapToReadDto);
        }

        public async Task<IEnumerable<ItemDetailReadDto>> GetItemDetailsByItemIdAsync(int itemId, bool includeDisabled = false)
        {
            var query = _context.ItemDetailStockLevels.Where(s => s.ItemID == itemId);

            if (!includeDisabled)
            {
                query = query.Where(id => !id.ItemDetailDisabled && !id.ParentItemDisabled);
            }

            var stockDetails = await query
                .OrderBy(s => s.ItemDetailUnitName)
                .ToListAsync();

            return stockDetails.Select(MapToReadDto);
        }

        public async Task<ItemDetailReadDto?> GetItemDetailByIdAsync(int id)
        {
            var stockDetailInfo = await _context.ItemDetailStockLevels
                .FirstOrDefaultAsync(sds => sds.ItemDetailID == id);

            if (stockDetailInfo == null) return null;

            return MapToReadDto(stockDetailInfo);
        }
        public async Task<ItemDetailReadDto?> CreateItemDetailAsync(ItemDetailWriteDto itemDetailDto)
        {
            // Validate ItemID, UnitID etc. (as implemented before)
            var item = await _context.Items.FirstOrDefaultAsync(i => i.ID == itemDetailDto.ItemID && !i.Disabled);
            if (item == null) return null; // Item not found or disabled

            var unit = await _context.Units.FirstOrDefaultAsync(u => u.ID == itemDetailDto.UnitID && !u.Disabled);
            if (unit == null) return null; // Unit not found or disabled

            if (item.BaseUnitID == itemDetailDto.UnitID && itemDetailDto.definedPackageQty != 1)
            {
                // Consider logging this attempt or returning a more specific error
                return null; // ConversionFactor must be 1 for the item's base unit.
            }

            // Check for existing ItemID + UnitID combination (unique constraint UK_ItemDetails_Item_Unit)
            if (await _context.ItemDetails.AnyAsync(id => id.ItemID == itemDetailDto.ItemID && id.UnitID == itemDetailDto.UnitID))
            {
                // Log: Attempted to create duplicate Item-Unit combination
                return null; // Item-Unit combination conflict
            }

            string prefix = "CAM"; // Example prefix for ItemDetail codes.

            string newCode = await GenerateNextItemDetailCodeAsync(prefix, 4); // e.g., "ITD-0001"

            var itemDetail = new ItemDetail
            {
                Code = newCode, // Assign the generated code
                ItemID = itemDetailDto.ItemID,
                UnitID = itemDetailDto.UnitID,
                ConversionFactor = itemDetailDto.definedPackageQty,
                Price = itemDetailDto.Price,
                Disabled = false
            };

            _context.ItemDetails.Add(itemDetail);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                if (ex.InnerException?.Message.Contains("UNIQUE KEY constraint") == true)
                {
                    if (ex.InnerException.Message.Contains("UK_ItemDetails_Code")) // Your unique constraint name for Code
                    {
                        return null; // Code conflict due to race condition
                    }
                }
                // Log ex for other DbUpdateException types
                throw; // Or return null for other DB errors
            }

            return await GetItemDetailByIdAsync(itemDetail.ID);
        }

        public async Task<bool> UpdateItemDetailAsync(int id, ItemDetailUpdateDto itemDetailDto)
        {
            var detailToUpdate = await _context.ItemDetails.FindAsync(id);
            if (detailToUpdate == null) return false;

            // Check for unique code (if code is being changed)
            if (detailToUpdate.Code != itemDetailDto.Code &&
                await _context.ItemDetails.AnyAsync(x => x.Code == itemDetailDto.Code && x.ID != id))
                return false; // Code conflict

            // Check for unique ItemID + UnitID combination (if ItemID or UnitID is being changed)
            if ((detailToUpdate.ItemID != itemDetailDto.ItemID || detailToUpdate.UnitID != itemDetailDto.UnitID) &&
                await _context.ItemDetails.AnyAsync(x => x.ItemID == itemDetailDto.ItemID && x.UnitID == itemDetailDto.UnitID && x.ID != id))
                return false; // Item-Unit combination conflict

            // Validate ItemID if changed
            Item item;
            if (detailToUpdate.ItemID != itemDetailDto.ItemID)
            {
                item = await _context.Items.FirstOrDefaultAsync(i => i.ID == itemDetailDto.ItemID && !i.Disabled);
                if (item == null) return false; // New Item not found or disabled
            }
            else
            {
                item = await _context.Items.FindAsync(detailToUpdate.ItemID); // get current item
                if (item == null) return false; // Should not happen if detailToUpdate exists
            }


            // Validate UnitID if changed
            if (detailToUpdate.UnitID != itemDetailDto.UnitID)
            {
                var unit = await _context.Units.FirstOrDefaultAsync(u => u.ID == itemDetailDto.UnitID && !u.Disabled);
                if (unit == null) return false; // New Unit not found or disabled
            }

            // Business Rule: If the selected UnitID is the Item's BaseUnitID, ConversionFactor must be 1
            if (item.BaseUnitID == itemDetailDto.UnitID && itemDetailDto.definedPackageQty != 1)
            {
                return false; // Or throw
            }


            detailToUpdate.Code = itemDetailDto.Code;
            detailToUpdate.ItemID = itemDetailDto.ItemID;
            detailToUpdate.UnitID = itemDetailDto.UnitID;
            detailToUpdate.ConversionFactor = itemDetailDto.definedPackageQty;
            detailToUpdate.Price = itemDetailDto.Price;
            // Disabled status not changed here

            _context.Entry(detailToUpdate).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException) { if (!await ItemDetailExistsAsync(id)) return false; throw; }
            catch (DbUpdateException) { return false; }
            return true;
        }

        public async Task<bool> SoftDeleteItemDetailAsync(int id)
        {
            var itemDetail = await _context.ItemDetails.Include(x => x.Item).FirstOrDefaultAsync(x => x.ID == id);
            if (itemDetail == null) return false;
            if (itemDetail.Disabled) return true; // Already disabled

            // Business Rule: Cannot disable the ItemDetail that represents the Item's base unit.
            if (itemDetail.Item != null && itemDetail.UnitID == itemDetail.Item.BaseUnitID)
            {
                // To find the item, we either load it with Include, or do another query.
                // Assuming item is loaded via Include(id => id.Item) in the initial query.
                return false; // Or throw new InvalidOperationException("Cannot disable the base unit configuration of an item.");
            }


            itemDetail.Disabled = true;
            _context.Entry(itemDetail).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException) { if (!await ItemDetailExistsAsync(id)) return false; throw; }
            return true;
        }

        public async Task<bool> ItemDetailExistsAsync(int id)
        {
            return await _context.ItemDetails.AnyAsync(e => e.ID == id);
        }

        private async Task<string> GenerateNextItemDetailCodeAsync(string prefix, int numericPartLength = 4)
        {
            string prefixWithSeparator = $"{prefix}-";
            int nextNumber = 1;

            // Fetch codes that start with the given prefix.
            // This could be inefficient on very large tables.
            var relevantCodes = await _context.ItemDetails
                .Where(id => id.Code.StartsWith(prefixWithSeparator))
                .Select(id => id.Code)
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

            // Format the number with leading zeros.
            // Example: if numericPartLength is 4, nextNumber 1 becomes "0001", 123 becomes "0123".
            string numberFormat = new string('0', numericPartLength); // Creates "0000" for length 4
            return $"{prefixWithSeparator}{nextNumber.ToString(numberFormat)}";
        }

    }
}