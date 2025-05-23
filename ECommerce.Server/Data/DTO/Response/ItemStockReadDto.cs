namespace ECommerce.Server.Data.DTO.Response
{
    public class ItemStockReadDto
    {
        public int ItemID { get; set; }
        public string ItemName { get; set; }
        public bool ItemDisabled { get; set; } // Status of the item itself
        public int BaseUnitID { get; set; }
        public string BaseUnitName { get; set; }
        public int QuantityOnHandInBaseUnits { get; set; } // From V_CurrentStock (INT)
        public List<ItemStockUnitDetailDto> AvailableUnitsStock { get; set; } = new List<ItemStockUnitDetailDto>();
    }
}