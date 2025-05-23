namespace ECommerce.Server.Data.DTO.Response
{
    public class ItemDetailReadDto
    {
        public int ID { get; set; }
        public string Code { get; set; }
        public int ItemID { get; set; }
        public string ItemName { get; set; }
        public int UnitID { get; set; }
        public string UnitName { get; set; }
        public int DefinedPackageQty { get; set; } // Renamed from ConversionFactor for clarity in this context
        // This is from ItemDetails.Qty (e.g., 24 if pack of 24)
        public decimal? Price { get; set; }
        public bool Disabled { get; set; }
        public decimal QuantityOnHand { get; set; }
    }
}