// File: Data/DTO/Request/FinancialSummaryQueryParameters.cs
using System;

namespace ECommerce.Server.Data.DTO.Request
{
    public class FinancialSummaryQueryParameters : QueryParametersBase
    {
        public string? NameFilter { get; set; }
        public bool IncludeDisabled { get; set; } = false; // Default to false (only active items)
    }
}