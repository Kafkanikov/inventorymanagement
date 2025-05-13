using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;

namespace ECommerce.Server.Interfaces;

public interface IUnitService
{
    Task<IEnumerable<UnitReadDto>> GetAllUnitsAsync(bool includeDisabled = false);
    Task<UnitReadDto?> GetUnitByIdAsync(int id);
    Task<UnitReadDto?> CreateUnitAsync(UnitWriteDto unitDto);
    Task<bool> UpdateUnitAsync(int id, UnitWriteDto unitDto);
    Task<bool> SoftDeleteUnitAsync(int id);
    Task<bool> UnitExistsAsync(int id);
    
}