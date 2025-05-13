using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;

namespace ECommerce.Server.Interfaces
{
    public interface ISupplierService
    {
        Task<IEnumerable<SupplierReadDto>> GetAllSuppliersAsync(bool includeDisabled);
        Task<SupplierReadDto?> GetSupplierByIdAsync(int id);
        Task<SupplierReadDto?> CreateSupplierAsync(SupplierWriteDto supplierWriteDto);
        Task<bool> UpdateSupplierAsync(int id, SupplierWriteDto supplierWriteDto);
        Task<bool> SoftDeleteSupplierAsync(int id);
        Task<bool> SupplierExistsAsync(int id);
    }
}
