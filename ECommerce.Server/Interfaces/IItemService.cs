using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;

public interface IItemService
{
    Task<IEnumerable<ItemReadDto>> GetAllItemsAsync(bool includeDisabled = false);
    Task<ItemReadDto?> GetItemByIdAsync(int id);
    Task<ItemReadDto?> CreateItemAsync(ItemWriteDto itemDto);
    Task<bool> UpdateItemAsync(int id, ItemWriteDto itemDto);
    Task<bool> SoftDeleteItemAsync(int id);
    Task<bool> ItemExistsAsync(int id);
}