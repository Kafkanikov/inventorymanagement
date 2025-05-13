using ECommerce.Server.Data;
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Data.Entities;
using ECommerce.Server.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Server.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly EcommerceDbContext _context;
        public CategoryService(EcommerceDbContext context)
        {
            _context = context;
        }
        public async Task<IEnumerable<CategoryReadDto>> GetAllCategoriesAsync(bool includeDisabled)
        {
            var query = _context.Categories.AsQueryable();
            if (!includeDisabled)
            {
                query = query.Where(s => s.Disabled == false);
            }
            return await query
                .OrderBy(s => s.Name) // Optional: Order by name
                .Select(s => new CategoryReadDto()
                {
                    ID = s.ID,
                    Name = s.Name,
                    Description = s.Description,
                    Disabled = s.Disabled
                })
                .ToListAsync();
        }

        public async Task<CategoryReadDto?> GetCategoryByIdAsync(int id)
        {
            var category = await _context.Categories.FindAsync(id);

            if (category == null)
            {
                return null;
            }

            return new CategoryReadDto()
            {
                ID = category.ID,
                Name = category.Name,
                Description = category.Description,
                Disabled = category.Disabled
            };
        }

        public async Task<CategoryReadDto?> CreateCategoryAsync(CategoryWriteDto categoryWriteDto)
        {
            var category = new Category()
            {
                Name = categoryWriteDto.Name,
                Description = categoryWriteDto.Description,
                Disabled = false // Default to not disabled
            };
            _context.Categories.Add(category);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex)
            {
                if (ex.InnerException?.Message.Contains("UNIQUE KEY constraint") == true &&
                    (ex.InnerException.Message.Contains("Category.Name") ||
                     ex.InnerException.Message.Contains("UK_Category_Name"))) // Example constraint names
                {
                    return null; // Indicate failure due to duplicate, controller can return Conflict
                }
            }
            return new CategoryReadDto()
            {
                ID = category.ID,
                Name = category.Name,
                Description = category.Description,
                Disabled = category.Disabled
            };
        }

        public async Task<bool> UpdateCategoryAsync(int id, CategoryWriteDto categoryWriteDto)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return false; // Not found
            }
            category.Name = categoryWriteDto.Name;
            category.Description = categoryWriteDto.Description;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await CategoryExistsAsync(id))
                {
                    return false; // Not found
                }
                throw;
            }
            return true; // Update successful
        }

        public async Task<bool> SoftDeleteCategoryAsync(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return false; // Not found
            }
            category.Disabled = true; // Soft delete
            await _context.SaveChangesAsync();
            return true; // Soft delete successful
        }

        public async Task<bool> CategoryExistsAsync(int id)
        {
            return await _context.Categories.AnyAsync(e => e.ID == id);
        }
    }
}
