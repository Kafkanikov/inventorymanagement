using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;

namespace ECommerce.Server.Interfaces;

public interface ICurrencyExchangeService
{
    Task<IEnumerable<CurrencyExchangeReadDto>> GetExchangesAsync(DateTime startDate, DateTime endDate, bool includeDisabled);
    Task<CurrencyExchangeReadDto> CreateExchangeAsync(CurrencyExchangeWriteDto exchangeDto, int userId);
    Task<bool> DisableExchangeAsync(int id);
}