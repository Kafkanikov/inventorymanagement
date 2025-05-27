using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.DTO.Request
{
    public class TrialBalanceRequestParams
    {
        [Required]
        public DateTime AsOfDate { get; set; }

        [Required]
        [RegularExpression("^(USD|KHR)$", ErrorMessage = "Report currency must be 'USD' or 'KHR'.")]
        public string ReportCurrency { get; set; }

        // KHR per 1 unit of Foreign Currency (typically USD)
        [Range(0.000001, double.MaxValue, ErrorMessage = "Exchange rate must be a positive value.")]
        public decimal? KhrToReportCurrencyExchangeRate { get; set; }
    }
}
