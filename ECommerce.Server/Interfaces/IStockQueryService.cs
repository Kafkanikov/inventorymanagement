using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using ECommerce.Server.Data.Views;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ECommerce.Server.Services
{
    public interface IStockQueryService
    {
        Task<ItemStockReadDto?> GetItemStockDetailsAsync(int itemId);
        Task<(IEnumerable<ItemStockReadDto> ItemsStock, int TotalCount)> GetAllItemsStockDetailsAsync(StockQueryParameters queryParams);
        //Task<ItemFinancialSummaryViewResult?> GetItemFinancialSummaryAsync(int itemId);
        //Task<(IEnumerable<ItemFinancialSummaryViewResult> Summaries, int TotalCount)> GetAllItemFinancialSummariesAsync(FinancialSummaryQueryParameters queryParams);
    }
}