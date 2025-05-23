namespace ECommerce.Server.Data.DTO.Response
{
    public class SaleDetailReadDto
    {
        public int ID { get; set; }
        public string ItemCode { get; set; }
        public string ItemName { get; set; }
        public string UnitName { get; set; }
        public int? Qty { get; set; }
        public decimal? LinePrice { get; set; } 
    }
}