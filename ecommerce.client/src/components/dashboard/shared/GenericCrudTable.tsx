// src/components/dashboard/shared/GenericCrudTable.tsx (New file or rename existing)
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner'; // Assuming sonner is used as per your code
import {
    Identifiable,
    FormFieldDefinition,
    GenericCrudProps,
    ApiErrorResponse,
    FormFieldOption
} from '@/types/inventory'; // Adjust path to where you put the generic types

// Helper to get nested property, useful if accessorKey is like "author.name"
const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};


export const GenericCrudTable = <
  TItem extends Identifiable & { disabled?: boolean }, // Assuming items might have a 'disabled' prop
  TWriteDto extends Record<string, any>,
  TCreateDto extends Record<string, any> = TWriteDto,
  TUpdateDto extends Record<string, any> = TWriteDto
>({
  entityName,
  entityNamePlural,
  apiBaseUrl,
  queryParams,  
  columns,
  formFields,
  initialCreateFormData = {} as Partial<TWriteDto>,
  getSelectOptions,
}: GenericCrudProps<TItem, TWriteDto, TCreateDto, TUpdateDto>) => {
  const [items, setItems] = useState<TItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItemData, setCurrentItemData] = useState<Partial<TWriteDto>>(initialCreateFormData);
  const [editingId, setEditingId] = useState<TItem['id'] | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<TItem['id'] | null>(null);

  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectOptionsCache, setSelectOptionsCache] = useState<Record<string, FormFieldOption[]>>({});


  const fetchItems = useCallback(async () => {
    setIsLoadingTable(true);
    try {
      const queryString = queryParams 
        ? '?' + new URLSearchParams(Object.entries(queryParams).map(([k, v]) => [k, String(v)])).toString()
        : '';
      const response = await fetch(`${apiBaseUrl}${queryString}`);      
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch ${entityNamePlural.toLowerCase()}: ${response.statusText}`);
      }
      const data: TItem[] = await response.json();
      setItems(data);
    } catch (error) {
      console.error(error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : `Could not fetch ${entityNamePlural.toLowerCase()}.`,
      });
    } finally {
      setIsLoadingTable(false);
    }
  }, [apiBaseUrl, queryParams]); // Removed toast from deps as it's stable

  // Fetch dynamic select options
  useEffect(() => {
    if (getSelectOptions) {
      formFields.forEach(field => {
        if (field.type === 'select' && !field.options) { // Only fetch if options aren't predefined
          getSelectOptions(field.name as string)
            .then(options => {
              setSelectOptionsCache(prev => ({ ...prev, [field.name as string]: options }));
            })
            .catch(err => console.error(`Failed to load options for ${String(field.name)}`, err));
        }
      });
    }
  }, [formFields, getSelectOptions]);


  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleFormError = (error: unknown, defaultMessage: string) => {
    console.error(defaultMessage, error);
    let description = defaultMessage;
    const apiError = error as ApiErrorResponse;

    if (apiError.errors) {
      description = Object.values(apiError.errors).flat().join(' ');
    } else if (apiError.title) {
      description = apiError.title;
    } else if (apiError.message) {
      description = apiError.message;
    } else if (error instanceof Error) {
        description = error.message;
    }

    toast.error("Operation Failed", { description });
  };

  const handleAddNew = () => {
    setEditingId(null);
    setCurrentItemData(initialCreateFormData);
    setIsModalOpen(true);
  };

  const handleEdit = (item: TItem) => {
    setEditingId(item.id);
    // Ensure all form fields are present in currentItemData, even if undefined in item
    const formData: Partial<TWriteDto> = {};
    formFields.forEach(field => {
        // @ts-ignore
        formData[field.name as keyof TWriteDto] = item[field.name as keyof TItem] ?? initialCreateFormData[field.name as keyof TCreateDto] ?? '';
    });
    setCurrentItemData(formData);
    setIsModalOpen(true);
  };

  const handleDeleteInitiate = (id: TItem['id']) => {
    setItemToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDeleteId === null) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/${itemToDeleteId}`, {
        method: 'DELETE',
      });
      if (!response.ok && response.status !== 204) { // 204 is a success for DELETE
        const errorData: ApiErrorResponse = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete ${entityName.toLowerCase()}: ${response.statusText}`);
      }
      setItems(items.filter(item => item.id !== itemToDeleteId));
      toast.success("Success", {
        description: `${entityName} deleted successfully.`,
      });
    } catch (error) {
      handleFormError(error, `Could not delete ${entityName.toLowerCase()}.`);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setItemToDeleteId(null);
    }
  };

  const handleFormChange = (name: string, value: string | number | boolean) => {
    setCurrentItemData(prev => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation (can be enhanced with a schema)
    const firstRequiredField = formFields.find(f => f.required);
    if (firstRequiredField && !currentItemData[firstRequiredField.name as keyof typeof currentItemData]?.toString().trim()) {
      toast.error("Validation Error", { description: `${firstRequiredField.label} is required.` });
      return;
    }
    setIsSubmitting(true);

    // Prepare DTO by picking only fields defined in formFields to avoid sending extra data
    const dto = editingId 
            ? {} as Partial<TUpdateDto>
            : {} as Partial<TCreateDto>;

    formFields.forEach(field => {
        const key = field.name as keyof (TWriteDto);
        if (currentItemData[key] !== undefined) {
            // @ts-ignore
            dto[key] = currentItemData[key];
        } else if (field.type === 'checkbox') {
            // @ts-ignore
            dto[key] = false; // Default unchecked checkboxes to false if not in currentItemData
        }
    });


    try {
      let response;
      let successMessage = "";

      if (editingId) {
        response = await fetch(`${apiBaseUrl}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto as TWriteDto),
        });
        successMessage = `${entityName} updated successfully.`;
      } else {
        response = await fetch(apiBaseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto as TWriteDto),
        });
        successMessage = `${entityName} created successfully.`;
      }

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({}));
        throw errorData; // Let handleFormError parse it
      }

      if ((response.status === 201 || response.status === 200)) {
         const contentType = response.headers.get("content-type");
         if (contentType && contentType.indexOf("application/json") !== -1) {
            const savedItem: TItem = await response.json();
            if (editingId) {
                setItems(items.map(item => (item.id === editingId ? savedItem : item)));
            } else {
                setItems([...items, savedItem]);
            }
         } else if (editingId) { // Handle 200 OK with no content for PUT (less common) or 204 No Content
            // If no content, update client-side with submitted DTO data
             setItems(items.map(item => (item.id === editingId ? { ...item, ...(dto as Partial<TItem>)} : item)));
         } else {
            await fetchItems(); // Re-fetch if we don't get the created item back
         }
      } else if (response.status === 204 && editingId) { // Handle 204 No Content specifically for PUT
        setItems(items.map(item => (item.id === editingId ? { ...item, ...(dto as Partial<TItem>)} : item)));
      } else {
        await fetchItems();
      }

      toast.success("Success", { description: successMessage });
      setIsModalOpen(false);
      setCurrentItemData(initialCreateFormData); // Reset to initial for create
      setEditingId(null);

    } catch (error) {
      handleFormError(error, `An unexpected error occurred while saving the ${entityName.toLowerCase()}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormField = (field: FormFieldDefinition<TWriteDto>) => {
    const fieldName = field.name as string;
    const value = currentItemData[fieldName as keyof typeof currentItemData];

    switch (field.type) {
      case 'textarea':
        return <Textarea id={fieldName} name={fieldName} value={(value as string) || ''} onChange={(e) => handleFormChange(fieldName, e.target.value)} className="col-span-3" rows={field.rows || 3} placeholder={field.placeholder} disabled={isSubmitting} />;
      case 'number':
        return <Input id={fieldName} name={fieldName} type="number" value={(value as number) || ''} onChange={(e) => handleFormChange(fieldName, parseFloat(e.target.value) || 0)} className="col-span-3" placeholder={field.placeholder} disabled={isSubmitting} min={field.min} max={field.max} step={field.step} />;
      case 'select':
        return (
          <Select name={fieldName} value={(value as string) || ''} onValueChange={(val) => handleFormChange(fieldName, val)}>
            <SelectTrigger className="col-span-3" disabled={isSubmitting}>
              <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || selectOptionsCache[fieldName] || []).map(option => (
                <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
       case 'checkbox':
        return (
            <div className="col-span-3 flex items-center h-full"> {/* Ensure checkbox is vertically centered */}
                <Checkbox
                    id={fieldName}
                    name={fieldName}
                    checked={!!value} // Convert to boolean
                    onCheckedChange={(checked) => handleFormChange(fieldName, !!checked)}
                    disabled={isSubmitting}
                />
            </div>
        );
      case 'text':
      default:
        return <Input id={fieldName} name={fieldName} value={(value as string) || ''} onChange={(e) => handleFormChange(fieldName, e.target.value)} className="col-span-3" placeholder={field.placeholder} disabled={isSubmitting} />;
    }
  };


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage {entityNamePlural}</CardTitle>
        <Button onClick={handleAddNew} size="sm" disabled={isLoadingTable || isSubmitting}>
          <PlusCircle className="h-4 w-4 mr-2" /> Add New {entityName}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoadingTable && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading {entityNamePlural.toLowerCase()}...</p>
          </div>
        )}
        {!isLoadingTable && (
          <Table>
            <TableCaption>{items.length === 0 ? `No ${entityNamePlural.toLowerCase()} found.` : `A list of your ${entityNamePlural.toLowerCase()}.`}</TableCaption>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={String(col.accessorKey)} className={col.className}>{col.header}</TableHead>
                ))}
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className={item.disabled ? "opacity-50" : ""}>
                  {columns.map((col) => (
                    <TableCell key={`${item.id}-${String(col.accessorKey)}`} className={col.className}>
                      {col.cell ? col.cell(item) : String(getNestedValue(item, col.accessorKey as string) ?? '-')}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting || isSubmitting}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(item)} disabled={isDeleting || isSubmitting}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteInitiate(item.id)}
                          className="text-red-600 focus:text-red-600"
                          disabled={isDeleting || isSubmitting}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col"> {/* Adjust width and enable flex for scrolling */}
          <DialogHeader>
            <DialogTitle>{editingId ? `Edit ${entityName}` : `Add New ${entityName}`}</DialogTitle>
            <DialogDescription>
              {editingId ? `Make changes to the ${entityName.toLowerCase()}.` : `Enter the details for the new ${entityName.toLowerCase()}.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 space-y-4 py-1"> {/* Add space-y and py for consistent spacing */}
            {formFields.map((field) => (
              <div key={String(field.name)} className="grid grid-cols-4 items-center gap-x-4 gap-y-2"> {/* Use gap-x and gap-y */}
                <Label htmlFor={String(field.name)} className="text-right col-span-1">
                  {field.label}{field.required && '*'}
                </Label>
                {/* The renderFormField function will handle the col-span-3 for the input */}
                {renderFormField(field)}
              </div>
            ))}
          
            <DialogFooter className="mt-auto pt-4 border-t"> {/* Ensure footer is at bottom */}
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Save Changes' : `Create ${entityName}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {entityName.toLowerCase()}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};