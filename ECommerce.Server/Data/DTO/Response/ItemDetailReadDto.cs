namespace ECommerce.Server.Data.DTO.Response
{
    public class ItemDetailReadDto
    {
        public int ID { get; set; }
        public string Code { get; set; }
        public int ItemID { get; set; }
        public string ItemName { get; set; } // From related Item
        public int UnitID { get; set; }
        public string UnitName { get; set; } // From related Unit
        public int ConversionFactor { get; set; } // SQL Qty
        public decimal? Price { get; set; }
        public bool Disabled { get; set; }
    }
}