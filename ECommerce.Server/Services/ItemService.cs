using ECommerce.Server.Data;
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Server.Services
{
    public class ItemService : IItemService
    {
        private readonly EcommerceDbContext _context;

        public ItemService(EcommerceDbContext context)
        {
            _context = context;
        }

        private IQueryable<Item> GetBaseItemQuery()
        {
            return _context.Items
                .Include(i => i.Category)
                .Include(i => i.BaseUnit);
        }

        public async Task<IEnumerable<ItemReadDto>> GetAllItemsAsync(bool includeDisabled = false)
        {
            var query = GetBaseItemQuery();

            if (!includeDisabled)
            {
                query = query.Where(i => !i.Disabled);
            }

            return await query
                .OrderBy(i => i.Name)
                .Select(i => new ItemReadDto
                {
                    ID = i.ID,
                    Name = i.Name,
                    CategoryID = i.CategoryID,
                    CategoryName = i.Category != null ? i.Category.Name : null,
                    BaseUnitID = i.BaseUnitID,
                    BaseUnitName = i.BaseUnit.Name, // BaseUnit is required, so BaseUnit.Name should exist
                    Qty = i.Qty,
                    Disabled = i.Disabled
                })
                .ToListAsync();
        }

        public async Task<ItemReadDto?> GetItemByIdAsync(int id)
        {
            var item = await GetBaseItemQuery()
                             .FirstOrDefaultAsync(i => i.ID == id);

            if (item == null) return null;

            return new ItemReadDto
            {
                ID = item.ID,
                Name = item.Name,
                CategoryID = item.CategoryID,
                CategoryName = item.Category?.Name,
                BaseUnitID = item.BaseUnitID,
                BaseUnitName = item.BaseUnit.Name,
                Qty = item.Qty,
                Disabled = item.Disabled
            };
        }

        public async Task<ItemReadDto?> CreateItemAsync(ItemWriteDto itemDto)
        {
            // Check for unique name
            if (await _context.Items.AnyAsync(i => i.Name == itemDto.Name))
            {
                return null; // Name conflict
            }

            // Validate CategoryID if provided
            if (itemDto.CategoryID.HasValue)
            {
                var categoryExists = await _context.Categories.AnyAsync(c => c.ID == itemDto.CategoryID.Value && !c.Disabled);
                if (!categoryExists) return null; // Category not found or disabled
            }

            // Validate BaseUnitID
            var baseUnitExists = await _context.Units.AnyAsync(u => u.ID == itemDto.BaseUnitID && !u.Disabled);
            if (!baseUnitExists) return null; // BaseUnit not found or disabled

            var item = new Item
            {
                Name = itemDto.Name,
                CategoryID = itemDto.CategoryID,
                BaseUnitID = itemDto.BaseUnitID,
                Qty = itemDto.Qty,
                Disabled = false // Default to active
            };

            _context.Items.Add(item);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException /* ex */) // Catch other DB issues, unique name is pre-checked
            {
                // Log ex
                return null;
            }

            // After saving, EF populates the ID. We need to fetch again to get navigated properties for DTO.
            // Or pass the IDs and names for DTO creation if available.
            var createdItemWithNav = await GetBaseItemQuery().FirstOrDefaultAsync(i => i.ID == item.ID);
            if (createdItemWithNav == null) return null; // Should not happen

            return new ItemReadDto
            {
                ID = createdItemWithNav.ID,
                Name = createdItemWithNav.Name,
                CategoryID = createdItemWithNav.CategoryID,
                CategoryName = createdItemWithNav.Category?.Name,
                BaseUnitID = createdItemWithNav.BaseUnitID,
                BaseUnitName = createdItemWithNav.BaseUnit.Name,
                Qty = createdItemWithNav.Qty,
                Disabled = createdItemWithNav.Disabled
            };
        }

        public async Task<bool> UpdateItemAsync(int id, ItemWriteDto itemDto)
        {
            var itemToUpdate = await _context.Items.FindAsync(id);
            if (itemToUpdate == null) return false; // Not found

            // Check for unique name constraint (if name is being changed)
            if (itemToUpdate.Name != itemDto.Name &&
                await _context.Items.AnyAsync(i => i.Name == itemDto.Name && i.ID != id))
            {
                return false; // Name conflict
            }

            // Validate CategoryID if provided and changed
            if (itemDto.CategoryID.HasValue && itemToUpdate.CategoryID != itemDto.CategoryID)
            {
                var categoryExists = await _context.Categories.AnyAsync(c => c.ID == itemDto.CategoryID.Value && !c.Disabled);
                if (!categoryExists) return false; // Category not found or disabled
            }
            else if (!itemDto.CategoryID.HasValue) // If CategoryID is being cleared
            {
                itemToUpdate.CategoryID = null;
            }


            // Validate BaseUnitID if changed
            if (itemToUpdate.BaseUnitID != itemDto.BaseUnitID)
            {
                var baseUnitExists = await _context.Units.AnyAsync(u => u.ID == itemDto.BaseUnitID && !u.Disabled);
                if (!baseUnitExists) return false; // BaseUnit not found or disabled
            }

            itemToUpdate.Name = itemDto.Name;
            itemToUpdate.CategoryID = itemDto.CategoryID;
            itemToUpdate.BaseUnitID = itemDto.BaseUnitID;
            itemToUpdate.Qty = itemDto.Qty;
            // Disabled status is not changed here

            _context.Entry(itemToUpdate).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException) { if (!await ItemExistsAsync(id)) return false; throw; }
            catch (DbUpdateException) { return false; } // Other DB issues
            return true;
        }

        public async Task<bool> SoftDeleteItemAsync(int id)
        {
            var item = await _context.Items.FindAsync(id);
            if (item == null) return false;

            if (item.Disabled) return true; // Already disabled

            // Business Rule: Before soft-deleting an item, consider its ItemDetails.
            // If an Item is soft-deleted, should its ItemDetails also be soft-deleted?
            // Current SQL for ItemDetails has FK to Item(ID) with default NO ACTION.
            // Soft deleting the Item won't violate this.
            // We could iterate through item.ItemDetails and set them to Disabled = true as well.
            // For now, just disabling the item.
            var itemDetailsToDisable = await _context.ItemDetails.Where(id => id.ItemID == item.ID && !id.Disabled).ToListAsync();
            foreach (var detail in itemDetailsToDisable)
            {
                detail.Disabled = true;
                _context.Entry(detail).State = EntityState.Modified;
            }

            item.Disabled = true;
            _context.Entry(item).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException) { if (!await ItemExistsAsync(id)) return false; throw; }
            return true;
        }

        public async Task<bool> ItemExistsAsync(int id)
        {
            return await _context.Items.AnyAsync(e => e.ID == id);
        }
    }
}
