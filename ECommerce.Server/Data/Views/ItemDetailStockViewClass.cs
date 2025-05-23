public class ItemDetailStockViewResult
{
    public int ItemDetailID { get; set; }
    public string ItemDetailCode { get; set; }
    public int ItemID { get; set; }
    public string ItemName { get; set; }
    public int ItemDetailUnitID { get; set; }
    public string ItemDetailUnitName { get; set; }
    public int DefinedPackageFactor { get; set; } 
    public decimal? SellingPrice { get; set; }
    public bool ItemDetailDisabled { get; set; }
    public bool ParentItemDisabled { get; set; }
    public decimal QuantityOnHandInItemDetailUnit { get; set; } 
}