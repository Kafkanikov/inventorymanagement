namespace ECommerce.Server.Data.DTO.Response
{
    public class SalesPerformanceByItemDto
    {
        public int ItemId { get; set; }
        public string ItemName { get; set; }
        public string ItemCode { get; set; }
        public string UnitName { get; set; }
        public int UnitsSold { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalCOGS { get; set; }
    }
}