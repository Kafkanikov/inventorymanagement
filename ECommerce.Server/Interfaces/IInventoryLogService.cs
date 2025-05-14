using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ECommerce.Server.Services
{
    public interface IInventoryLogService
    {
        // Changed method name slightly to reflect its purpose
        Task<InventoryLogReadDto?> CreateManualLogEntryAsync(InventoryLogCreateDto logDto, int performingUserId);
        Task<(IEnumerable<InventoryLogReadDto> Logs, int TotalCount)> GetAllLogEntriesAsync(InventoryLogQueryParameters queryParams);
        Task<InventoryLogReadDto?> GetLogEntryByIdAsync(int logId);
    }
}