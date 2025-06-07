namespace ECommerce.Server.Data.DTO.Response
{
    public class AccountReadDto
    {
        public int ID { get; set; }
        public string AccountNumber { get; set; } // From Code
        public string Name { get; set; }
        public int CategoryID { get; set; }
        public string CategoryName { get; set; }
        public int? SubCategoryID { get; set; }
        public string? SubCategoryName { get; set; }
        public string NormalBalance { get; set; } // From Bal
        public bool Disabled { get; set; }
    }
}