using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;

namespace ECommerce.Server.Services
{
    public interface IItemDetailService
    {
        Task<IEnumerable<ItemDetailReadDto>> GetAllItemDetailsAsync(bool includeDisabled = false);
        Task<IEnumerable<ItemDetailReadDto>> GetItemDetailsByItemIdAsync(int itemId, bool includeDisabled = false);
        Task<ItemDetailReadDto?> GetItemDetailByIdAsync(int id);
        Task<ItemDetailReadDto?> CreateItemDetailAsync(ItemDetailWriteDto itemDetailDto);
        Task<bool> UpdateItemDetailAsync(int id, ItemDetailUpdateDto itemDetailDto);
        Task<bool> SoftDeleteItemDetailAsync(int id);
        Task<bool> ItemDetailExistsAsync(int id);
    }
}