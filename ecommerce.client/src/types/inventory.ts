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

export interface ItemDetail {
  id: number;
  code: string;
  itemID: number;
  itemName?: string; // From related Item (often not needed if viewing details for a specific item)
  unitID: number;
  unitName?: string; // From related Unit
  conversionFactor: number;
  price: number | null; // decimal? maps to number | null
  disabled: boolean;
}

export interface ItemDetailWriteDto {
  // code?: string | null; // Commented out in C#, so optional or auto-generated
  itemID: number; // Will be pre-filled based on the parent item
  unitID: number;
  conversionFactor: number;
  price?: number | null;
}

export interface ItemDetailUpdateDto {
  code: string; // Required for update
  itemID: number; // Usually fixed, but good to include
  unitID: number;
  conversionFactor: number;
  price?: number | null;
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
export interface InventoryLogQueryParametersDto {
  itemID?: number | null;       
  userID?: number | null;    
  transactionType?: string | null; 
  startDate?: string | null;    
  endDate?: string | null;   

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
  conversionFactor: number;
}

export interface UnitSelection {
  id: number;
  name: string;
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
  TCreateDto extends Record<string, any> = TWriteDto,
  TUpdateDto extends Record<string, any> = TWriteDto                     // Type for updating an item
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
