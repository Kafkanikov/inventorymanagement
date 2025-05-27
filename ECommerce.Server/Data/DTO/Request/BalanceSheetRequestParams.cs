// File: ECommerce.Server/Data/DTO/Request/BalanceSheetRequestParams.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace ECommerce.Server.Data.DTO.Request
{
    public class BalanceSheetRequestParams
    {
        [Required]
        public DateTime AsOfDate { get; set; }

        [Required]
        [RegularExpression("^(USD|KHR)$", ErrorMessage = "Report currency must be 'USD' or 'KHR'.")]
        public string ReportCurrency { get; set; }

        [Range(0.000001, double.MaxValue, ErrorMessage = "Exchange rate must be a positive value.")]
        public decimal? KhrToReportCurrencyExchangeRate { get; set; }
    }
}