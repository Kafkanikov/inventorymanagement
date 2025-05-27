using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;

namespace ECommerce.Server.Interfaces
{
    public interface IAccountingReportService
    {
        Task<BalanceSheetDataDto?> GetBalanceSheetAsync(BalanceSheetRequestParams requestParams);
        Task<TrialBalanceReportDto?> GetTrialBalanceAsync(TrialBalanceRequestParams requestParams);
    }
}
