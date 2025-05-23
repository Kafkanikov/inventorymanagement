namespace ECommerce.Server.Data.Views
{
    public class ItemFinancialSummaryViewResult
    {
        public int ItemID { get; set; }
        public string ItemName { get; set; }
        public int BaseUnitID { get; set; }
        public string BaseUnitName { get; set; }
        public bool ItemDisabled { get; set; }
        public int QuantityOnHandInBaseUnits { get; set; } // From your InventoryLog (INT)
        public decimal TotalNetRevenue { get; set; }      // From MONEY type in SQL (maps to decimal)
        public decimal TotalNetAcquisitionCost { get; set; } // From MONEY type in SQL
    }
}