namespace ECommerce.Server.Data.Views 
{
    public class CurrentStockViewResult
    {
        public int ItemID { get; set; }
        public string ItemName { get; set; }
        public int BaseUnitID { get; set; }
        public string BaseUnitName { get; set; }
        public int QuantityOnHandInBaseUnits { get; set; } // Matches INT type from view
    }
}