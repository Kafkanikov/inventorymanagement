// src/components/dashboard/forms/AddStockLocationForm.tsx

import React from 'react';
import { GenericCrudTable } from '../shared/GenericCrudTable'; // Adjust path
import {
  StockLocation,
  StockLocationWriteDto,
  UserSelection, // For the dropdown
  // Assuming these are in the same types file or imported into it:
  ColumnDefinition,
  FormFieldDefinition,
  FormFieldOption,
} from '@/types/inventory'; // Adjust path
import { toast } from 'sonner';
// Define columns for the Stock Location table
const stockLocationColumns: ColumnDefinition<StockLocation>[] = [
  {
    header: "Name",
    accessorKey: "name",
    cell: (loc) => loc.name || 'N/A',
    className: "font-medium",
  },
  {
    header: "Address",
    accessorKey: "address",
    cell: (loc) => loc.address || '-',
  },
  {
    header: "Managed By",
    accessorKey: "managedByUsername", // Use the pre-fetched username
    cell: (loc) => loc.managedByUsername || (loc.userID ? `User ID: ${loc.userID}`: 'N/A'),
  },
//   {
//     header: "Status",
//     accessorKey: "disabled",
//     cell: (loc) => (loc.disabled ? "Disabled" : "Active"),
//   },
];

// Define form fields for adding/editing a Stock Location
const stockLocationFormFields: FormFieldDefinition<StockLocationWriteDto>[] = [
  {
    name: "name",
    label: "Location Name",
    type: "text",
    required: true,
    placeholder: "e.g., Main Warehouse, Downtown Store",
  },
  {
    name: "address",
    label: "Address",
    type: "textarea",
    placeholder: "e.g., 456 Industrial Park, Unit 7, Metro City",
    rows: 3,
  },
  {
    name: "userID",
    label: "Managed By User",
    type: "select",
    placeholder: "Select a user (optional)",
    // Options will be loaded dynamically via getSelectOptions
  },
];

// Initial form data for creating a new stock location
const initialStockLocationFormData: Partial<StockLocationWriteDto> = {
  name: '',
  address: '',
  userID: null, // Explicitly null for optional select
};

const getStockLocationSelectOptions = async (fieldName: keyof StockLocationWriteDto | string): Promise<FormFieldOption[]> => {
    if (fieldName === 'userID') {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          console.error(`Failed to load users: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to load users: ${response.statusText}`);
        }
        const users: UserSelection[] = await response.json();
  
        return users.map(user => ({
          value: user.id,
          label: user.username,
        }));
      } catch (error) {
        toast.error("Could not load users for selection.");
        return []; // Return empty array on error to prevent breaking the select input
      }
    }
    return []; // Return empty array for other fields or if no dynamic options needed for them
  };


export const StockManagementForm: React.FC = () => {
  return (
    <GenericCrudTable<StockLocation, StockLocationWriteDto>
      entityName="Stock Location"
      entityNamePlural="Stock Locations"
      apiBaseUrl="/api/stocks"
      columns={stockLocationColumns}
      formFields={stockLocationFormFields}
      initialCreateFormData={initialStockLocationFormData}
      getSelectOptions={getStockLocationSelectOptions} // Pass the function to load select options
    />
  );
};