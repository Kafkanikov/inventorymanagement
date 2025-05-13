// src/components/dashboard/forms/AddCategoryForm.tsx (Now Category Management)
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose, 
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // For description
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Edit, Trash2, Loader2 } from 'lucide-react';
import { ApiErrorResponse, Category, CategoryWriteDto } from '@/types/inventory'; // Adjust path as needed
import { toast } from 'sonner';

const API_BASE_URL = '/api/categories';

export const CategoryManagementForm: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategoryData, setCurrentCategoryData] = useState<Partial<CategoryWriteDto>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState<number | null>(null);

  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission
  const [isDeleting, setIsDeleting] = useState(false); // For delete operation

  const fetchCategories = useCallback(async () => {
    setIsLoadingTable(true);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }
      const data: Category[] = await response.json();
      setCategories(data);
    } catch (error) {
      console.error(error);
      toast.error("Error",{
        description: error instanceof Error ? error.message : "Could not fetch categories.",
      });
    } finally {
      setIsLoadingTable(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleFormError = (error: unknown, defaultMessage: string) => {
    console.error(defaultMessage, error);
    let description = defaultMessage;
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        description = error.message; // Use specific error message if available
    }
    // Check for ASP.NET Core ProblemDetails or custom error structure
    const apiError = error as ApiErrorResponse;
    if (apiError.errors) {
        description = Object.values(apiError.errors).flat().join(' ');
    } else if (apiError.title) {
        description = apiError.title;
    }

    toast.error("Operation Failed", {
      description: description,
    });
  };

  const handleAddNew = () => {
    setEditingId(null);
    setCurrentCategoryData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setCurrentCategoryData({ name: category.name, description: category.description || '' });
    setIsModalOpen(true);
  };

  const handleDeleteInitiate = (id: number) => {
    setCategoryToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (categoryToDeleteId === null) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${categoryToDeleteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        // Try to parse error if possible
        const errorData: ApiErrorResponse = response.status === 204 ? {} : await response.json();
        throw errorData.message ? new Error(errorData.message) : new Error(`Failed to delete category: ${response.statusText}`);
      }
      setCategories(categories.filter(cat => cat.id !== categoryToDeleteId));
      toast.success("Success", {
        description: "Category deleted successfully.",
      });
    } catch (error) {
      handleFormError(error, "Could not delete category.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setCategoryToDeleteId(null);
    }
  };
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentCategoryData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategoryData.name?.trim()) {
      toast.error("Validation Error",{ description: "Category name is required."});
      return;
    }
    setIsSubmitting(true);

    const dto: CategoryWriteDto = {
      name: currentCategoryData.name,
      description: currentCategoryData.description || null, // Ensure null if empty
    };

    try {
      let response;
      let successMessage = "";

      if (editingId) {
        // Update existing category
        response = await fetch(`${API_BASE_URL}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto as CategoryWriteDto),
        });
        successMessage = "Category updated successfully.";
      } else {
        // Add new category
        response = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dto as CategoryWriteDto),
        });
        successMessage = "Category created successfully.";
      }

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        // Pass the whole errorData object which might contain 'errors' or 'title'
        throw errorData;
      }

      // If POST and response is 201 Created, or PUT and response is 200 OK, expect body
      if ((response.status === 201 || response.status === 200) && response.headers.get("content-length") !== "0") {
        const savedCategory: Category = await response.json();
        if (editingId) {
          setCategories(categories.map(cat => (cat.id === editingId ? savedCategory : cat)));
        } else {
          setCategories([...categories, savedCategory]);
        }
      } else if (response.status === 204 && editingId) { // Handle 204 No Content for PUT
         setCategories(categories.map(cat => (cat.id === editingId ? { ...cat, id: editingId, ...dto, disabled: cat.disabled } : cat)));
      } else { // Fallback if no content or unexpected status but still OK (e.g., 204 for POST which is unusual)
        await fetchCategories(); // Re-fetch all as a fallback
      }


      toast.success("Success", { description: successMessage });
      setIsModalOpen(false);
      setCurrentCategoryData({});
      setEditingId(null);

    } catch (error) {
      handleFormError(error, "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Categories</CardTitle>
        <Button onClick={handleAddNew} size="sm" disabled={isLoadingTable}>
          <PlusCircle className="h-4 w-4 mr-2" /> Add New Category
        </Button>
      </CardHeader>
      <CardContent>
        {isLoadingTable && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading categories...</p>
          </div>
        )}
        {!isLoadingTable && (
          <Table>
            <TableCaption>{categories.length === 0 ? "No categories found." : "A list of your categories."}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id} className={category.disabled ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting || isSubmitting}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(category)} disabled={category.disabled}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteInitiate(category.id)}
                          className="text-red-600 focus:text-red-600"
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Make changes to the category.' : 'Enter the details for the new category.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name*</Label>
                <Input
                  id="name"
                  name="name"
                  value={currentCategoryData.name || ''}
                  onChange={handleFormChange}
                  className="col-span-3"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={currentCategoryData.description || ''}
                  onChange={handleFormChange}
                  className="col-span-3"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Save Changes' : 'Create Category'}
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
              This action cannot be undone. This will permanently delete the category.
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