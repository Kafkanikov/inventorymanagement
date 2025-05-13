// src/components/dashboard/forms/AddUnitForm.tsx

import React from 'react';
import { GenericCrudTable } from '../shared/GenericCrudTable'; // Adjust path as needed
import {
  Unit,
  UnitWriteDto,
  UnitCreateDto,
  UnitUpdateDto,
  // Assuming these are in the same types file or imported into it:
  ColumnDefinition,
  FormFieldDefinition,
} from '@/types/inventory'; // Adjust path as needed

// Define columns for the Unit table
const unitColumns: ColumnDefinition<Unit>[] = [
  {
    header: "ID", // Optional: Displaying ID can be useful for admins
    accessorKey: "id",
    className: "w-20", // Example: give it a fixed width
  },
  {
    header: "Unit Name",
    accessorKey: "name",
    className: "font-medium",
  },
//   {
//     header: "Status",
//     accessorKey: "disabled",
//     cell: (unit) => (unit.disabled ? "Disabled" : "Active"),
//     className: "w-28", // Example: give it a fixed width
//   },
];

// Define form fields for adding/editing a Unit
// The 'name' property in FormFieldDefinition must match a key in UnitWriteDto
const unitFormFields: FormFieldDefinition<UnitWriteDto>[] = [
  {
    name: "name", // Key in UnitWriteDto
    label: "Unit Name",
    type: "text",
    required: true,
    placeholder: "e.g., Pieces, Kilograms, Liters, Pack",
  },
];

// Initial form data for creating a new unit
const initialUnitFormData: Partial<UnitCreateDto> = {
  name: '',
};

export const UnitManagementForm: React.FC = () => {
  return (
    <GenericCrudTable<Unit, UnitWriteDto, UnitCreateDto, UnitUpdateDto>
      entityName="Unit"
      entityNamePlural="Units"
      apiBaseUrl="/api/units" // Assuming this is your API endpoint for units
      columns={unitColumns}
      formFields={unitFormFields}
      initialCreateFormData={initialUnitFormData}
    />
  );
};
