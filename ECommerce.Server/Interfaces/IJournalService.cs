using ECommerce.Server.Data.DTO.Request;
using ECommerce.Server.Data.DTO.Response;
using System.Threading.Tasks;

namespace ECommerce.Server.Interfaces
{
    public interface IJournalService
    {
        Task<JournalPageReadDto?> CreateJournalPageAsync(JournalPageCreateDto journalPageDto, int performingUserId);
        // Add other methods like GetJournalPageByIdAsync, GetAllJournalPagesAsync etc. later if needed
    }
}