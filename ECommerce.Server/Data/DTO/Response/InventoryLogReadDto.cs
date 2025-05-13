// File: Data/DTO/Response/InventoryLogReadDto.cs
using System;

namespace ECommerce.Server.Data.DTO.Response
{
    public class InventoryLogReadDto
    {
        public int LogID { get; set; }
        public int ItemID { get; set; }
        public string ItemName { get; set; }
        public int? ItemDetailID_Transaction { get; set; }
        public string? ItemDetailCode { get; set; }
        public int UserID { get; set; }
        public string Username { get; set; }
        public DateTime Timestamp { get; set; }
        public string TransactionType { get; set; }
        public decimal QuantityTransacted { get; set; }
        public int UnitIDTransacted { get; set; }
        public string TransactedUnitName { get; set; }
        public int ConversionFactorApplied { get; set; }
        public int QuantityInBaseUnits { get; set; }
        public decimal? CostPricePerBaseUnit { get; set; }
        public decimal? SalePricePerTransactedUnit { get; set; }
        public string? Notes { get; set; }
    }
}