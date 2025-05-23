namespace ECommerce.Server.Data.DTO.Response
{
    public class PurchaseDetailReadDto
    {
        public int ID { get; set; }
        public string ItemCode { get; set; } // From ItemDetails.Code
        public string ItemName { get; set; } // Fetched from related ItemDetail -> Item
        public string UnitName { get; set; } // Fetched from related ItemDetail -> Unit
        public int? Qty { get; set; }
        public decimal? Cost { get; set; } // Cost for this line
    }
}