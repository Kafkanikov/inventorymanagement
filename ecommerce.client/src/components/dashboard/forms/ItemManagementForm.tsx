// src/components/dashboard/forms/ItemManagementPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Edit, Trash2, PackagePlus, Loader2, ChevronDown, ChevronRight } from 'lucide-react'; // Added Chevron icons
import { toast } from 'sonner';
import {
  Item, ItemWriteDto, ItemUpdateDto,
  ItemDetail, ItemDetailWriteDto, ItemDetailUpdateDto,
  Category, Unit, ApiErrorResponse
} from '@/types/inventory'; // Adjust path as needed

const ITEMS_API_URL = '/api/items';
const ITEM_DETAILS_API_URL = '/api/itemdetails';
const CATEGORIES_API_URL = '/api/categories';
const UNITS_API_URL = '/api/units';
const NONE_SELECT_VALUE = "_NONE_";

// Helper to handle API errors
const handleApiError = (error: unknown, defaultMessage: string, operationName: string) => {
  console.error(`Error during ${operationName}:`, error);
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
  toast.error(`Operation Failed: ${operationName}`, { description });
};


export const ItemManagementForm: React.FC = () => {
  // Item States
  const [items, setItems] = useState<Item[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItemData, setCurrentItemData] = useState<Partial<ItemWriteDto>>({});
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [isItemDeleteDialogIsOpen, setIsItemDeleteDialogIsOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);

  // ItemDetail States (now managed as a cache and per-item expansion)
  const [expandedItemIds, setExpandedItemIds] = useState<Set<number>>(new Set());
  const [itemDetailsCache, setItemDetailsCache] = useState<Record<number, ItemDetail[]>>({});
  const [loadingDetailsForItemId, setLoadingDetailsForItemId] = useState<number | null>(null); // Track loading for specific item's details

  const [isItemDetailModalOpen, setIsItemDetailModalOpen] = useState(false);
  const [currentItemDetailData, setCurrentItemDetailData] = useState<Partial<ItemDetailUpdateDto>>({});
  const [editingItemDetailId, setEditingItemDetailId] = useState<number | null>(null);
  const [isItemDetailDeleteDialogIsOpen, setIsItemDetailDeleteDialogIsOpen] = useState(false);
  const [itemDetailToDeleteId, setItemDetailToDeleteId] = useState<number | null>(null);
  const [parentItemIdForDetailModal, setParentItemIdForDetailModal] = useState<number | null>(null);


  // Shared States
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Fetching Initial Data ---
  const fetchItems = useCallback(async () => {
    setIsLoadingItems(true);
    try {
      const response = await fetch(ITEMS_API_URL);
      if (!response.ok) throw new Error(`Failed to fetch items: ${response.statusText}`);
      const data: Item[] = await response.json();
      setItems(data);
    } catch (error) {
      handleApiError(error, "Could not fetch items.", "Fetch Items");
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(CATEGORIES_API_URL + "?includeDisabled=false");
      if (!response.ok) throw new Error(`Failed to fetch categories: ${response.statusText}`);
      const data: Category[] = await response.json();
      setCategories(data);
    } catch (error) {
      handleApiError(error, "Could not fetch categories for dropdown.", "Fetch Categories");
    }
  }, []);

  const fetchUnits = useCallback(async () => {
    try {
      const response = await fetch(UNITS_API_URL + "?includeDisabled=false");
      if (!response.ok) throw new Error(`Failed to fetch units: ${response.statusText}`);
      const data: Unit[] = await response.json();
      setUnits(data);
    } catch (error) {
      handleApiError(error, "Could not fetch units for dropdown.", "Fetch Units");
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchCategories();
    fetchUnits();
  }, [fetchItems, fetchCategories, fetchUnits]);

  // --- Item CRUD ---
  const handleAddNewItem = () => {
    setEditingItemId(null);
    setCurrentItemData({ name: '', categoryID: null, baseUnitID: undefined, qty: null });
    setIsItemModalOpen(true);
  };

  const handleEditItem = (item: Item) => {
    setEditingItemId(item.id);
    setCurrentItemData({
      name: item.name,
      categoryID: item.categoryID,
      baseUnitID: item.baseUnitID,
      qty: item.qty,
    });
    setIsItemModalOpen(true);
  };

  const handleItemFormChange = (name: keyof ItemWriteDto, value: string | number | null) => {
    setCurrentItemData(prev => ({ ...prev, [name]: value }));
  };
  const handleItemSelectChange = (name: keyof ItemWriteDto, value: string) => {
     if (value === NONE_SELECT_VALUE) {
        setCurrentItemData(prev => ({ ...prev, [name]: null }));
     } else {
        const numValue = parseInt(value, 10);
        setCurrentItemData(prev => ({ ...prev, [name]: isNaN(numValue) ? null : numValue }));
     }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItemData.name?.trim() || currentItemData.baseUnitID === undefined || currentItemData.baseUnitID === null) {
      toast.error("Validation Error", { description: "Item name and Base Unit are required." });
      return;
    }
    setIsSubmitting(true);
    const dto: ItemWriteDto = {
      name: currentItemData.name,
      categoryID: currentItemData.categoryID || null,
      baseUnitID: currentItemData.baseUnitID,
      qty: currentItemData.qty === undefined || currentItemData.qty === null || isNaN(Number(currentItemData.qty)) ? null : Number(currentItemData.qty),
    };
    try {
      let response;
      let successMessage = "";
      if (editingItemId) {
        response = await fetch(`${ITEMS_API_URL}/${editingItemId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto as ItemUpdateDto),
        });
        successMessage = "Item updated successfully.";
      } else {
        response = await fetch(ITEMS_API_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto),
        });
        successMessage = "Item created successfully.";
      }
      if (!response.ok) { const errorData = await response.json().catch(() => ({})); throw errorData; }
      if ((response.status === 200 || response.status === 201) && response.headers.get("content-length") !== "0") {
        const savedItem: Item = await response.json();
         if (editingItemId) {
            setItems(items.map(i => (i.id === editingItemId ? savedItem : i)));
        } else {
            setItems([...items, savedItem]);
        }
      } else {
         await fetchItems();
      }
      toast.success("Success", { description: successMessage });
      setIsItemModalOpen(false);
    } catch (error) {
      handleApiError(error, "Could not save item.", editingItemId ? "Update Item" : "Create Item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItemInitiate = (id: number) => {
    setItemToDeleteId(id);
    setIsItemDeleteDialogIsOpen(true);
  };

  const handleDeleteItemConfirm = async () => {
    if (itemToDeleteId === null) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${ITEMS_API_URL}/${itemToDeleteId}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) { const errorData = await response.json().catch(() => ({})); throw errorData; }
      setItems(items.filter(i => i.id !== itemToDeleteId));
      toast.success("Success", { description: "Item deleted successfully." });
      // If deleted item's details were expanded, remove from expanded set and cache
      setExpandedItemIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemToDeleteId);
        return newSet;
      });
      setItemDetailsCache(prev => {
        const newCache = {...prev};
        delete newCache[itemToDeleteId];
        return newCache;
      });
    } catch (error) {
      handleApiError(error, "Could not delete item.", "Delete Item");
    } finally {
      setIsSubmitting(false);
      setIsItemDeleteDialogIsOpen(false);
      setItemToDeleteId(null);
    }
  };

  // --- ItemDetail Logic (Modified for Sub-rows) ---
  const fetchAndCacheItemDetails = useCallback(async (itemId: number) => {
    if (itemDetailsCache[itemId]) { // Already cached
      return itemDetailsCache[itemId];
    }
    setLoadingDetailsForItemId(itemId);
    try {
      const response = await fetch(`${ITEM_DETAILS_API_URL}?itemId=${itemId}`); // Add ?includeDisabled=true if needed
      if (!response.ok) throw new Error(`Failed to fetch item details for item ID ${itemId}: ${response.statusText}`);
      const data: ItemDetail[] = await response.json();
      setItemDetailsCache(prev => ({ ...prev, [itemId]: data }));
      return data;
    } catch (error) {
      handleApiError(error, `Could not fetch details for item ID ${itemId}.`, "Fetch Item Details");
      setItemDetailsCache(prev => ({ ...prev, [itemId]: [] })); // Cache empty on error
      return [];
    } finally {
      setLoadingDetailsForItemId(null);
    }
  }, [itemDetailsCache]);

  const toggleItemDetails = async (itemId: number) => {
    const newExpandedItemIds = new Set(expandedItemIds);
    if (newExpandedItemIds.has(itemId)) {
      newExpandedItemIds.delete(itemId);
    } else {
      newExpandedItemIds.add(itemId);
      if (!itemDetailsCache[itemId]) { // Fetch only if not in cache
        await fetchAndCacheItemDetails(itemId);
      }
    }
    setExpandedItemIds(newExpandedItemIds);
  };


  const handleAddNewItemDetail = (itemId: number) => {
    setParentItemIdForDetailModal(itemId);
    setEditingItemDetailId(null);
    setCurrentItemDetailData({
      itemID: itemId,
      code: '',
      unitID: undefined,
      conversionFactor: 1,
      price: null,
    });
    setIsItemDetailModalOpen(true);
  };

  const handleEditItemDetail = (detail: ItemDetail, parentItemId: number) => {
    setParentItemIdForDetailModal(parentItemId);
    setEditingItemDetailId(detail.id);
    setCurrentItemDetailData({
      code: detail.code,
      itemID: detail.itemID,
      unitID: detail.unitID,
      conversionFactor: detail.conversionFactor,
      price: detail.price,
    });
    setIsItemDetailModalOpen(true);
  };
  
  const handleItemDetailFormChange = (name: keyof ItemDetailUpdateDto, value: string | number | null) => {
    setCurrentItemDetailData(prev => ({ ...prev, [name]: value }));
  };
  const handleItemDetailSelectChange = (name: keyof ItemDetailUpdateDto, value: string) => {
     if (value === NONE_SELECT_VALUE) {
        setCurrentItemDetailData(prev => ({ ...prev, [name]: null }));
     } else {
        const numValue = parseInt(value, 10);
        setCurrentItemDetailData(prev => ({ ...prev, [name]: isNaN(numValue) ? null : numValue }));
     }
  };

  const handleItemDetailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentItemIdForDetailModal || currentItemDetailData.unitID === undefined || currentItemDetailData.unitID === null || !currentItemDetailData.conversionFactor) {
      toast.error("Validation Error", { description: "Unit and Conversion Factor are required for item detail." });
      return;
    }
    if (editingItemDetailId && (!currentItemDetailData.code || !currentItemDetailData.code.trim())) {
        toast.error("Validation Error", { description: "Code is required when updating an item detail." });
        return;
    }
    setIsSubmitting(true);
    const baseDtoFields = {
        itemID: parentItemIdForDetailModal, // Use parentItemIdForDetailModal
        unitID: currentItemDetailData.unitID!,
        conversionFactor: Number(currentItemDetailData.conversionFactor),
        price: currentItemDetailData.price === undefined || currentItemDetailData.price === null || isNaN(Number(currentItemDetailData.price)) ? null : Number(currentItemDetailData.price),
    };
    let dtoToSend: ItemDetailWriteDto | ItemDetailUpdateDto;
    if (editingItemDetailId) {
        dtoToSend = { ...baseDtoFields, code: currentItemDetailData.code! } as ItemDetailUpdateDto;
    } else {
        dtoToSend = baseDtoFields as ItemDetailWriteDto;
    }
    try {
      let response;
      let successMessage = "";
      if (editingItemDetailId) {
        response = await fetch(`${ITEM_DETAILS_API_URL}/${editingItemDetailId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dtoToSend as ItemDetailUpdateDto),
        });
        successMessage = "Item detail updated successfully.";
      } else {
        response = await fetch(ITEM_DETAILS_API_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dtoToSend as ItemDetailWriteDto),
        });
        successMessage = "Item detail created successfully.";
      }
      if (!response.ok) { const errorData = await response.json().catch(() => ({})); throw errorData; }
      
      // Force re-fetch and update cache for the parent item
      await fetchAndCacheItemDetails(parentItemIdForDetailModal); 
      // Ensure the expanded state remains or is set if needed
      setExpandedItemIds(prev => new Set(prev).add(parentItemIdForDetailModal!));


      toast.success("Success", { description: successMessage });
      setIsItemDetailModalOpen(false);
    } catch (error) {
      handleApiError(error, "Could not save item detail.", editingItemDetailId ? "Update Item Detail" : "Create Item Detail");
    } finally {
      setIsSubmitting(false);
      setParentItemIdForDetailModal(null); // Reset parent item ID context
    }
  };

  const handleDeleteItemDetailInitiate = (detailId: number, parentItemId: number) => {
    setParentItemIdForDetailModal(parentItemId); // Store parent for re-fetch
    setItemDetailToDeleteId(detailId);
    setIsItemDetailDeleteDialogIsOpen(true);
  };

  const handleDeleteItemDetailConfirm = async () => {
    if (itemDetailToDeleteId === null || !parentItemIdForDetailModal) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${ITEM_DETAILS_API_URL}/${itemDetailToDeleteId}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) { const errorData = await response.json().catch(() => ({})); throw errorData; }
      
      await fetchAndCacheItemDetails(parentItemIdForDetailModal);
      setExpandedItemIds(prev => new Set(prev).add(parentItemIdForDetailModal!));

      toast.success("Success", { description: "Item detail deleted successfully." });
    } catch (error) {
      handleApiError(error, "Could not delete item detail.", "Delete Item Detail");
    } finally {
      setIsSubmitting(false);
      setIsItemDetailDeleteDialogIsOpen(false);
      setItemDetailToDeleteId(null);
      setParentItemIdForDetailModal(null);
    }
  };

  // --- Render Logic ---
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Manage Items</CardTitle>
          <Button size="sm" onClick={handleAddNewItem} disabled={isSubmitting || isLoadingItems}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
          </Button>
        </div>
        <CardDescription>View items and manage their packaging details as sub-rows.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingItems && <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin inline mr-2" />Loading items...</div>}
        {!isLoadingItems && (
          <Table>
            <TableCaption>{items.length === 0 ? "No items found." : "A list of your items."}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead> {/* For expand icon */}
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Base Unit</TableHead>
                <TableHead className="text-right">Stock Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <React.Fragment key={item.id}>
                  <TableRow className={item.disabled ? "opacity-60 bg-muted/30 hover:bg-muted/40" : "hover:bg-muted/50"}>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => toggleItemDetails(item.id)} className="h-8 w-8">
                        {expandedItemIds.has(item.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{categories.find(c => c.id === item.categoryID)?.name || 'N/A'}</TableCell>
                    <TableCell>{units.find(u => u.id === item.baseUnitID)?.name || 'N/A'}</TableCell>
                    <TableCell className="text-right">{item.qty !== null ? item.qty : '-'}</TableCell>
                    <TableCell>{item.disabled ? "Disabled" : "Active"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isSubmitting}><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditItem(item)} disabled={item.disabled || isSubmitting}><Edit className="mr-2 h-4 w-4" />Edit Item</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteItemInitiate(item.id)} className="text-red-500 focus:text-red-600" disabled={isSubmitting}><Trash2 className="mr-2 h-4 w-4" />Delete Item</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  {expandedItemIds.has(item.id) && (
                    <TableRow className="bg-muted/20 dark:bg-muted/10 hover:bg-muted/30 dark:hover:bg-muted/20">
                      <TableCell colSpan={7} className="p-0"> {/* ColSpan to span all columns */}
                        <div className="p-4 ">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-sm">Item Details for: {item.name}</h4>
                            <Button variant="outline" size="icon" onClick={() => handleAddNewItemDetail(item.id)} disabled={isSubmitting}>
                              <PackagePlus className="mr-1 h-3 w-3" /> Add Detail
                            </Button>
                          </div>
                          {loadingDetailsForItemId === item.id && <div className="text-center py-3"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading details...</div>}
                          {loadingDetailsForItemId !== item.id && itemDetailsCache[item.id] && itemDetailsCache[item.id]!.length > 0 && (
                            <Table className="bg-background rounded-md shadow-sm">
                              <TableHeader>
                                <TableRow className="text-xs">
                                  <TableHead>Code</TableHead>
                                  <TableHead>Unit</TableHead>
                                  <TableHead className="text-right">Conv. Factor</TableHead>
                                  <TableHead className="text-right">Price</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right w-20">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {itemDetailsCache[item.id]!.map(detail => (
                                  <TableRow key={detail.id} className={`text-xs ${detail.disabled ? "opacity-50" : ""}`}>
                                    <TableCell>{detail.code}</TableCell>
                                    <TableCell>{units.find(u => u.id === detail.unitID)?.name || 'N/A'}</TableCell>
                                    <TableCell className="text-right">{detail.conversionFactor}</TableCell>
                                    <TableCell className="text-right">{detail.price !== null ? `$${detail.price.toFixed(2)}` : '-'}</TableCell>
                                    <TableCell>{detail.disabled ? "Disabled" : "Active"}</TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditItemDetail(detail, item.id)} disabled={detail.disabled || isSubmitting}><Edit className="h-3.5 w-3.5" /></Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => handleDeleteItemDetailInitiate(detail.id, item.id)} disabled={isSubmitting}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                          {loadingDetailsForItemId !== item.id && itemDetailsCache[item.id] && itemDetailsCache[item.id]!.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-3">No details found for this item.</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Item Add/Edit Modal (remains largely the same) */}
      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItemId ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleItemSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-name" className="text-right col-span-1">Name*</Label>
              <Input id="item-name" name="name" value={currentItemData.name || ''} onChange={(e) => handleItemFormChange('name', e.target.value)} className="col-span-3" required disabled={isSubmitting} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-categoryID" className="text-right col-span-1">Category</Label>
              <Select name="categoryID" value={currentItemData.categoryID === null || currentItemData.categoryID === undefined ? "" : String(currentItemData.categoryID)} onValueChange={(val) => handleItemSelectChange('categoryID', val)}>
                <SelectTrigger className="col-span-3" disabled={isSubmitting}><SelectValue placeholder="Select category (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_SELECT_VALUE}><em>None</em></SelectItem>
                  {categories.filter(c => !c.disabled).map(cat => <SelectItem key={String(cat.id)} value={String(cat.id)}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item-baseUnitID" className="text-right col-span-1">Base Unit*</Label>
              <Select name="baseUnitID" value={currentItemData.baseUnitID === null || currentItemData.baseUnitID === undefined ? "" : String(currentItemData.baseUnitID)} onValueChange={(val) => handleItemSelectChange('baseUnitID', val)}>
                <SelectTrigger className="col-span-3" disabled={isSubmitting}><SelectValue placeholder="Select base unit" /></SelectTrigger>
                <SelectContent>
                  {units.filter(u => !u.disabled).map(unit => <SelectItem key={String(unit.id)} value={String(unit.id)}>{unit.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="item-qty" className="text-right col-span-1">Stock Qty</Label>
                <Input id="item-qty" name="qty" type="number" min="0" value={currentItemData.qty === null || currentItemData.qty === undefined ? '' : currentItemData.qty} onChange={(e) => handleItemFormChange('qty', e.target.value === '' ? null : parseInt(e.target.value, 10))} className="col-span-3" placeholder="Optional initial stock" disabled={isSubmitting} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItemId ? 'Save Changes' : 'Create Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Item Delete Confirmation Dialog (remains largely the same) */}
      <AlertDialog open={isItemDeleteDialogIsOpen} onOpenChange={setIsItemDeleteDialogIsOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete Item?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. Deleting an item might also affect its details.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteItemConfirm} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete Item
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Item Detail Add/Edit Modal (remains largely the same, but ensure parentItemIdForDetailModal is used) */}
        <Dialog open={isItemDetailModalOpen} onOpenChange={setIsItemDetailModalOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{editingItemDetailId ? 'Edit Item Detail' : 'Add New Item Detail'}</DialogTitle>
                    <DialogDescription>For item: {items.find(i => i.id === parentItemIdForDetailModal)?.name || 'N/A'}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleItemDetailSubmit} className="space-y-4 py-2">
                    {editingItemDetailId && ( 
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="detail-code" className="text-right col-span-1">Code*</Label>
                            <Input id="detail-code" name="code" value={currentItemDetailData.code || ''} onChange={(e) => handleItemDetailFormChange('code', e.target.value)} className="col-span-3" required={!!editingItemDetailId} disabled={isSubmitting} />
                        </div>
                    )}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="detail-unitID" className="text-right col-span-1">Unit*</Label>
                        <Select name="unitID" value={currentItemDetailData.unitID === null || currentItemDetailData.unitID === undefined ? "" : String(currentItemDetailData.unitID)} onValueChange={(val) => handleItemDetailSelectChange('unitID', val)}>
                            <SelectTrigger className="col-span-3" disabled={isSubmitting}><SelectValue placeholder="Select unit" /></SelectTrigger>
                            <SelectContent>
                                {units.filter(u => !u.disabled).map(unit => <SelectItem key={String(unit.id)} value={String(unit.id)}>{unit.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="detail-conversionFactor" className="text-right col-span-1">Conversion Factor*</Label>
                        <Input id="detail-conversionFactor" name="conversionFactor" type="number" min="1" value={currentItemDetailData.conversionFactor || 1} onChange={(e) => handleItemDetailFormChange('conversionFactor', parseInt(e.target.value,10) || 1)} className="col-span-3" required disabled={isSubmitting} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="detail-price" className="text-right col-span-1">Price</Label>
                        <Input id="detail-price" name="price" type="number" step="0.01" min="0" value={currentItemDetailData.price === null || currentItemDetailData.price === undefined ? '' : currentItemDetailData.price} onChange={(e) => handleItemDetailFormChange('price', e.target.value === '' ? null : parseFloat(e.target.value))} className="col-span-3" placeholder="0.00" disabled={isSubmitting} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingItemDetailId ? 'Save Changes' : 'Add Detail'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        {/* Item Detail Delete Confirmation Dialog (remains largely the same) */}
        <AlertDialog open={isItemDetailDeleteDialogIsOpen} onOpenChange={setIsItemDetailDeleteDialogIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete Item Detail?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteItemDetailConfirm} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                         {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </Card>
  );
};
