export interface Category {
    id: number; // Changed from string to number
    name: string;
    description?: string | null; // string? in C# maps to string | null | undefined in TS
    disabled: boolean;
}

// Matches CategoryCreateDto
export interface CategoryWriteDto {
    name: string;
    description?: string | null;
}

// For handling API errors, especially validation errors
export interface ApiErrorDetail {
    [key: string]: string[]; // e.g., { "Name": ["Category name is required."] }
}
export interface ApiErrorResponse {
    message?: string; // General error message
    errors?: ApiErrorDetail; // Validation errors
    status?: number; // HTTP status
    title?: string; // For ASP.NET Core ProblemDetails
}

export interface Supplier {
    id: number; // From ID
    name: string | null; // From public string? Name
    address: string | null;
    tel: string | null;
    email: string | null;
    disabled: boolean;
}

export interface SupplierWriteDto {
    name: string; // Required
    address?: string | null;
    tel?: string | null;
    email?: string | null;
}

export interface UserSelection {
  id: number;
  username: string;
}

export interface StockLocation {
  id: number;
  name: string | null;
  address: string | null;
  userID: number | null;
  managedByUsername?: string | null; // For display
  disabled: boolean;
}

export interface StockLocationWriteDto {
  name: string; // Required
  address?: string | null;
  userID?: number | null; // Nullable if a stock location can be unassigned
}

export interface User { 
  id: number; 
  username: string;
  email?: string | null;
  disabled: boolean;
}

export interface UserCreateDto {
  username: string;
  password?: string; 
  email?: string | null;
}

export interface UserUpdateDto {
  username: string;
  email?: string | null;
}

export interface Unit {
  id: number; // From public int ID
  name: string; // From public string Name
  disabled: boolean; // From public bool Disabled
}

// Corresponds to UnitWriteDto (used for both Create and Update on frontend)
export interface UnitWriteDto {
  name: string; // Required
}
export interface Unit {
  id: number; // From public int ID
  name: string; // From public string Name
  disabled: boolean; // From public bool Disabled
}

// Corresponds to UnitWriteDto (used for both Create and Update on frontend)
export interface UnitWriteDto {
  name: string; // Required
}

export type UnitCreateDto = UnitWriteDto;
export type UnitUpdateDto = UnitWriteDto;


export interface Item {
  id: number;
  name: string;
  categoryID: number | null;
  categoryName?: string | null;
  baseUnitID: number;
  baseUnitName?: string; // Assuming backend might provide this for display
  qty: number | null; // Reflects the Qty from Item table
  disabled: boolean;
}

export interface ItemWriteDto {
  name: string;
  categoryID?: number | null;
  baseUnitID: number;
  qty?: number | null;
}

export type ItemUpdateDto = ItemWriteDto;


// --- Item Detail Types ---

export interface ItemDetailReadDto { 
  id: number;
  code: string;
  itemID: number;
  itemName: string; 
  unitID: number;
  unitName: string; 
  definedPackageQty: number; // Renamed from conversionFactor
  price: number | null;
  disabled: boolean;
  quantityOnHand?: number | null; // Renamed from currentStockInThisUnit and type adjusted
}


export interface ItemDetailWriteDto {
  // code?: string | null; // Commented out in C#, so optional or auto-generated
  itemID: number; // Will be pre-filled based on the parent item
  unitID: number;
  definedPackageQty: number;
  price?: number | null;
}

export interface ItemDetailUpdateDto {
  code: string; // Required for update
  itemID: number; // Usually fixed, but good to include
  unitID: number;
  definedPackageQty: number;
  price?: number | null;
}

// --- Stock Query Types ---
export interface ItemStockUnitDetailDto {
  unitID: number;
  unitName: string;
  itemDetailCode: string; // Code of the ItemDetail (e.g., "CAM-0001")
  quantityOnHandInThisUnit: number | null; // Calculated, can be fractional (decimal? in C#)
  conversionFactorToBase: number; // From ItemDetails.definedPackageQty (which is INT)
  isBaseUnit: boolean;
  sellingPriceForThisUnit?: number | null; // From ItemDetails.Price
}

export interface ItemStockReadDto {
  itemID: number;
  itemName: string;
  itemDisabled: boolean; // Status of the item itself
  baseUnitID: number;
  baseUnitName: string;
  quantityOnHandInBaseUnits: number; // From V_CurrentStock (INT)
  availableUnitsStock: ItemStockUnitDetailDto[];
}

export interface StockQueryParameters {
  nameFilter?: string | null;
  categoryID?: number | null;
  pageNumber?: number;
  pageSize?: number;
}

////////////Inventory Log///////////////////////
export interface InventoryLogReadDto { // Based on your ECommerce.Server/Data/DTO/Response/InventoryLogReadDto.cs
  logID: number;
  itemID: number;
  itemName: string;
  itemDetailID_Transaction?: number | null;
  itemDetailCode?: string | null;
  userID: number;
  username: string;
  timestamp: string; // Assuming DateTime is serialized as string
  transactionType: string;
  quantityTransacted: number;
  unitIDTransacted: number;
  transactedUnitName: string;
  conversionFactorApplied: number;
  quantityInBaseUnits: number;
  costPricePerBaseUnit?: number | null;
  salePricePerTransactedUnit?: number | null;
}

export interface InventoryLogWriteDto {
  itemID: number;
  itemDetailID_Transaction?: number | null;
  transactionType: string;
  quantityTransacted: number;
  unitIDTransacted: number;
  costPricePerBaseUnit?: number | null;
  salePricePerTransactedUnit?: number | null;
}
export interface InventoryLogQueryParametersDto extends QueryParametersBase {
  itemID?: number | null;       
  userID?: number | null;    
  transactionType?: string | null; 
  startDate?: string | null;    
  endDate?: string | null;      
}

export interface QueryParametersBase {
  pageNumber?: number;
  pageSize?: number;
}

// You might also need these for dropdowns in the form
export interface ItemSelection {
  id: number;
  name: string;
  baseUnitID: number;
  baseUnitName?: string; // Helpful for display
  itemDetails?: ItemDetailSelection[]; // Array of available packaging/units for this item
}

export interface ItemDetailSelection {
  id: number; // ItemDetail ID
  code: string;
  unitID: number;
  unitName: string;
  itemName: string;
  conversionFactor: number;
  price: number | null; 
}

export interface UnitSelection {
  id: number;
  name: string;
}

// --- Purchase Types ---
export interface PurchaseDetailWriteDto {
  itemCode: string; // Code from ItemDetails
  // or alternatively:
  // itemDetailId: number;
  qty: number;
  cost: number; // Cost for this line item (Qty * Unit Cost)
}

export interface PurchaseWriteDto {
  // code?: string; // Usually auto-generated by backend based on DB sequence or pattern
  date: string; // ISO string date e.g., "2024-05-17"
  supplierID: number;
  stockID: number;
  // cost?: number; // Total cost, usually calculated by backend from details
  details: PurchaseDetailWriteDto[];
}

export interface PurchaseDetailReadDto {
  id: number;
  purchaseCode: string;
  itemCode: string;
  itemName?: string; // Denormalized for display
  unitName?: string; // Denormalized for display
  qty: number;
  cost: number; 
}

export interface PurchaseReadDto {
  id: number;
  code: string;
  date: string;
  userID: number;
  username?: string; // Denormalized for display
  supplierID: number;
  supplierName?: string; // Denormalized for display
  stockID: number;
  stockName?: string; // Denormalized for display
  cost: number; // Total cost of the purchase
  disabled: boolean;
  details: PurchaseDetailReadDto[];
}

// --- Sale Types ---
export interface SaleDetailWriteDto {
  itemCode: string; // Code from ItemDetails
  // or alternatively:
  // itemDetailId: number;
  qty: number;
  linePrice: number; // Selling price for this line item (Qty * Unit Price)
  // cost?: number; // Backend might fill this based on current item cost for COGS
}

export interface SaleWriteDto {
  // code?: string; // Usually auto-generated by backend
  date: string; // ISO string date
  stockID: number;
  // customerID?: number; // If you add customers later
  // price?: number; // Total price, usually calculated by backend from details
  details: SaleDetailWriteDto[];
}

export interface SaleDetailReadDto {
  id: number;
  saleCode: string;
  itemCode: string;
  itemName?: string; // Denormalized for display
  unitName?: string; // Denormalized for display
  qty: number;
  linePrice: number; // Price for this line item
  // unitPrice?: number; // Calculated: price / qty
  // cost?: number; // Cost of Goods Sold for this line, if tracked
}

export interface SaleReadDto {
  id: number;
  code: string;
  date: string;
  userID: number;
  username?: string; // Denormalized for display
  stockID: number;
  stockName?: string; // Denormalized for display
  // customerID?: number;
  // customerName?: string;
  price: number; // Total price of the sale
  disabled: boolean;
  details: SaleDetailReadDto[];
}

// For selection in forms
export interface ItemDetailBasicInfo { // To fetch for populating item selectors in forms
  code: string; // ItemDetail.Code
  itemName: string; // Item.Name
  unitName: string; // Unit.Name (of the ItemDetail's unit)
  price?: number | null; // Selling price from ItemDetail
  // Potentially conversionFactor if needed client-side for some logic
}

//////////////////////////////////////////////////////////////////////////
// Generic type for any item that has an ID
export type Identifiable = { id: number | string };

// Definition for how to display a column in the table
export interface ColumnDefinition<TItem extends Identifiable> {
  accessorKey: keyof TItem | string; // Key to access data in the item, or a custom string for custom cells
  header: string; // Header text for the column
  cell?: (item: TItem) => React.ReactNode; // Optional custom render function for the cell
  className?: string; // Optional class for the cell/header
}

// Definition for a form field
export type FormFieldType = "text" | "textarea" | "number" | "select" | "checkbox"; // Add more as needed

export interface FormFieldOption {
  value: string | number;
  label: string;
}

export interface FormFieldDefinition<TData> {
  name: keyof TData | string; // Corresponds to a property in TCreateDto/TUpdateDto
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  options?: FormFieldOption[]; // For 'select' type
  // For 'number' type
  min?: number;
  max?: number;
  step?: number;
  // For textarea
  rows?: number;
}

// Props for the generic CRUD component
export interface GenericCrudProps<
  TItem extends Identifiable,      // Type for displaying items (e.g., CategoryReadDto)
  TWriteDto extends Record<string, any>,
  _TCreateDto extends Record<string, any> = TWriteDto,
  _TUpdateDto extends Record<string, any> = TWriteDto                     // Type for updating an item
> {
  entityName: string; // Singular name, e.g., "Category"
  entityNamePlural: string; // Plural name, e.g., "Categories"
  apiBaseUrl: string;
  queryParams?: Record<string, string | number | boolean>;
  columns: ColumnDefinition<TItem>[];
  formFields: FormFieldDefinition<TWriteDto>[]; // Combine for simplicity, or have separate create/update fields
  initialCreateFormData?: Partial<TWriteDto>; // Default values when adding a new item
  // Optional: Function to provide dynamic select options
  getSelectOptions?: (fieldName: keyof TWriteDto | string) => Promise<FormFieldOption[]>;
}

//////////////////////////////////////////////////////////////////////////////////////////////


