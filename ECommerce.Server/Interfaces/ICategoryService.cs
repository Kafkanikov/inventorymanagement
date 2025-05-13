using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;

namespace ECommerce.Server.Interfaces;

public interface ICategoryService
{
    Task<IEnumerable<CategoryReadDto>> GetAllCategoriesAsync(bool includeDisabled);
    Task<CategoryReadDto?> GetCategoryByIdAsync(int id);
    Task<CategoryReadDto?> CreateCategoryAsync(CategoryWriteDto categoryWriteDto);
    Task<bool> UpdateCategoryAsync(int id, CategoryWriteDto categoryWriteDto);
    Task<bool> SoftDeleteCategoryAsync(int id);
    Task<bool> CategoryExistsAsync(int id);
}