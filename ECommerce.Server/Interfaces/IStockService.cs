using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.OpenApi;

namespace ECommerce.Server.Interfaces;

public interface IStockService
{
    Task<IEnumerable<StockReadDto>> GetAllStocksAsync(bool includeDisabled);
    Task<StockReadDto?> GetStockByIdAsync(int id);
    Task<StockReadDto?> CreateStockAsync(StockWriteDto stockDto);
    Task<bool> UpdateStockAsync(int id, StockWriteDto stockDto);
    Task<bool> SoftDeleteStockAsync(int id); // Assumes soft delete
    Task<bool> StockExistsAsync(int id);
}
