// File: Services/IPurchaseService.cs
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ECommerce.Server.Services
{
    public interface IPurchaseService
    {
        Task<PurchaseReadDto?> CreatePurchaseAsync(PurchaseCreateDto purchaseDto, int performingUserId);
        Task<PurchaseReadDto?> GetPurchaseByIdAsync(int purchaseId); // Using int ID for fetching
        Task<PurchaseReadDto?> GetPurchaseByCodeAsync(string purchaseCode); // Fetching by Code
        Task<(IEnumerable<PurchaseReadDto> Purchases, int TotalCount)> GetAllPurchasesAsync(PurchaseQueryParameters queryParams);
        Task<bool> SoftDeletePurchaseAsync(int purchaseId);
        Task<bool> PurchaseExistsAsync(int purchaseId);
    }
}