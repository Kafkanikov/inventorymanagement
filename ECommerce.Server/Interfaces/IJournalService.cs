using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using System.Threading.Tasks;

namespace ECommerce.Server.Interfaces
{
    public interface IJournalService
    {
        Task<JournalPageReadDto?> CreateJournalPageAsync(JournalPageCreateDto journalPageDto, int performingUserId);
        Task<JournalPageReadDto?> GetJournalPageByIdAsync(int journalPageId);

        Task<(IEnumerable<JournalPageReadDto> Pages, int TotalCount)> GetAllJournalPagesAsync(JournalLedgerQueryParametersDto queryParams);

    }
}