// File: Services/ISaleService.cs
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ECommerce.Server.Services
{
    public interface ISaleService
    {
        Task<SaleReadDto?> CreateSaleAsync(SaleCreateDto saleDto, int performingUserId);
        Task<SaleReadDto?> GetSaleByIdAsync(int saleId);
        Task<SaleReadDto?> GetSaleByCodeAsync(string saleCode);
        Task<(IEnumerable<SaleReadDto> Sales, int TotalCount)> GetAllSalesAsync(SaleQueryParameters queryParams);
        Task<bool> SoftDeleteSaleAsync(int saleId); 
        Task<bool> SaleExistsAsync(int saleId);
    }
}