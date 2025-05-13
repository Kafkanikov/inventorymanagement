import React from 'react';
import { GenericCrudTable } from '../shared/GenericCrudTable'; // Adjust path as needed
import {
  Supplier,
  SupplierWriteDto,
  ColumnDefinition,
  FormFieldDefinition,
} from '@/types/inventory'; // Adjust path as needed

// Define columns for the Supplier table
const supplierColumns: ColumnDefinition<Supplier>[] = [
  {
    header: "Name",
    accessorKey: "name",
    cell: (supplier) => supplier.name || 'N/A', // Handle possible null name from ReadDto
    className: "font-medium",
  },
  {
    header: "Address",
    accessorKey: "address",
    cell: (supplier) => supplier.address || '-',
  },
  {
    header: "Telephone",
    accessorKey: "tel",
    cell: (supplier) => supplier.tel || '-',
  },
  {
    header: "Email",
    accessorKey: "email",
    cell: (supplier) => supplier.email || '-',
  },
];

// Define form fields for adding/editing a Supplier
// Note: The `name` property in FormFieldDefinition must match a key in SupplierWriteDto
const supplierFormFields: FormFieldDefinition<SupplierWriteDto>[] = [
  {
    name: "name", // Key in SupplierWriteDto
    label: "Supplier Name",
    type: "text",
    required: true,
    placeholder: "e.g., Global Tech Supplies",
  },
  {
    name: "address", // Key in SupplierWriteDto
    label: "Address",
    type: "textarea",
    placeholder: "e.g., 123 Innovation Drive, Tech City",
    rows: 3,
  },
  {
    name: "tel", // Key in SupplierWriteDto
    label: "Telephone",
    type: "text", // HTML5 type "tel" could also be used if specific input handling is desired
    placeholder: "e.g., +1-555-123-4567",
  },
  {
    name: "email", // Key in SupplierWriteDto
    label: "Email",
    type: "text", // HTML5 type "email" for basic browser validation
    placeholder: "e.g., contact@globaltech.com",
  },
];

// Initial form data for creating a new supplier
const initialSupplierFormData: Partial<SupplierWriteDto> = {
  name: '',
  address: '',
  tel: '',
  email: '',
};

export const SupplierManagementForm: React.FC = () => {
  return (
    <GenericCrudTable<Supplier, SupplierWriteDto>
      entityName="Supplier"
      entityNamePlural="Suppliers"
      apiBaseUrl="/api/suppliers" // Assuming this is your API endpoint for suppliers
      columns={supplierColumns}
      formFields={supplierFormFields}
      initialCreateFormData={initialSupplierFormData}
    />
  );
};