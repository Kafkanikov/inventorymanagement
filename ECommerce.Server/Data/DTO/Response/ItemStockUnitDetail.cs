namespace ECommerce.Server.Data.DTO.Response
{
    public class ItemStockUnitDetailDto
    {
        public int UnitID { get; set; }
        public string UnitName { get; set; }
        public string ItemDetailCode { get; set; } // Code of the ItemDetail (e.g., "CAM-0001")
        public decimal QuantityOnHandInThisUnit { get; set; } // Calculated, can be fractional
        public int ConversionFactorToBase { get; set; } // From ItemDetails.Qty (which is INT)
        public bool IsBaseUnit { get; set; }
        public decimal? SellingPriceForThisUnit { get; set; } // From ItemDetails.Price
    }
}