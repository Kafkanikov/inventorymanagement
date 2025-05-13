namespace ECommerce.Server.Data.DTO.Response
{
    public class ItemReadDto
    {
        public int ID { get; set; }
        public string Name { get; set; }
        public int? CategoryID { get; set; }
        public string? CategoryName { get; set; }
        public int BaseUnitID { get; set; }
        public string BaseUnitName { get; set; }
        public int? Qty { get; set; } // Reflects the Qty from Item table
        public bool Disabled { get; set; }
    }
}