// src/components/dashboard/forms/AddUserForm.tsx

import React from 'react';
import { GenericCrudTable } from '../shared/GenericCrudTable'; // Adjust path as needed
import {
  User,
  UserCreateDto,
  UserUpdateDto,
  // Assuming these are in the same types file or imported into it:
  ColumnDefinition,
  FormFieldDefinition,
} from '@/types/inventory'; // Adjust path as needed

// Define columns for the User table
const userColumns: ColumnDefinition<User>[] = [
  {
    header: "Username",
    accessorKey: "username",
    className: "font-medium",
  },
  {
    header: "Email",
    accessorKey: "email",
    cell: (user) => user.email || '-',
  },
  {
    header: "Status",
    accessorKey: "disabled",
    cell: (user) => (user.disabled ? "Disabled" : "Active"),
  },
];

// Define form fields for adding/editing a User
// The 'name' property must match a key in UserCreateDto or UserUpdateDto
const userFormFields: FormFieldDefinition<UserCreateDto & UserUpdateDto>[] = [
  {
    name: "username",
    label: "Username",
    type: "text",
    required: true,
    placeholder: "e.g., johndoe",
  },
  {
    name: "email",
    label: "Email",
    type: "text", // HTML5 type="email" would provide basic browser validation
    placeholder: "e.g., user@example.com",
  },
  {
    name: "password",
    label: "Password",
    type: "text", // Use "password" type for actual password input
    required: true, // Required for creation. For edit, it implies password change.
    placeholder: "Enter new password (required for new user)",
  },
  {
    name: "disabled",
    label: "Disabled",
    type: "checkbox",
  },
];

// Initial form data for creating a new user
const initialUserFormData: Partial<UserCreateDto> = {
  username: '',
  email: '',
  password: '',
};

export const UserManagementForm: React.FC = () => {
  return (
    <GenericCrudTable<User, UserCreateDto, UserUpdateDto>
      entityName="User"
      entityNamePlural="Users"
      apiBaseUrl="/api/users" // Update with your actual API endpoint for users
      columns={userColumns}
      formFields={userFormFields}
      initialCreateFormData={initialUserFormData}
      queryParams={{ includeDisabled: true }}
    />
  );
};