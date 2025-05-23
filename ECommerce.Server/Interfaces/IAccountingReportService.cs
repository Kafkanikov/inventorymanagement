// File: Services/IAccountingReportService.cs
using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using System.Threading.Tasks;

namespace ECommerce.Server.Services
{
    public interface IAccountingReportService
    {
        Task<BalanceSheetDto> GetBalanceSheetAsync(BalanceSheetRequestDto request);
        Task<List<SimplifiedBalanceLineDto>> GetSimplifiedBalanceSheetDataAsync(BalanceSheetRequestDto request);
    }
}