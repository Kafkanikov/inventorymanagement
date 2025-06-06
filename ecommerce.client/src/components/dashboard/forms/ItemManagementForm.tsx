// ecommerce.client/src/components/dashboard/forms/ItemManagementForm.tsx
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, Edit, Trash2, PackagePlus, Loader2, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { toast } from 'sonner';
import {
  Item, ItemWriteDto, ItemUpdateDto,
  ItemDetailReadDto, // Using the DTO that now includes quantityOnHand
  ItemDetailWriteDto, ItemDetailUpdateDto,
  Category, Unit, ApiErrorResponse
} from '@/types/inventory';
// import { format } from 'date-fns'; // Not strictly needed here unless formatting dates

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

  // ItemDetail States
  const [expandedItemIds, setExpandedItemIds] = useState<Set<number>>(new Set());
  const [itemDetailsCache, setItemDetailsCache] = useState<Record<number, ItemDetailReadDto[]>>({});
  const [loadingDetailsForItemId, setLoadingDetailsForItemId] = useState<number | null>(null);
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
    setCurrentItemData({ name: '', categoryID: null, baseUnitID: undefined, qty: 0 });
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
      qty: currentItemData.qty === undefined || currentItemData.qty === null || isNaN(Number(currentItemData.qty)) ? 0 : Number(currentItemData.qty),
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
      
      const savedItem: Item = await response.json();
      if (editingItemId) {
          setItems(items.map(i => (i.id === editingItemId ? savedItem : i)));
          // If the updated item was expanded, refresh its details with the new qty
          if (expandedItemIds.has(editingItemId)) {
            fetchAndCacheItemDetails(savedItem); // Pass the updated item
          }
      } else {
          setItems(prevItems => [...prevItems, savedItem]);
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

  // --- ItemDetail Logic ---
  const fetchAndCacheItemDetails = useCallback(async (parentItem: Item) => {
    // If already cached and parentItem.qty hasn't changed, we might not need to re-calculate,
    // but for simplicity and to ensure freshness if other detail props change, we'll re-map.
    // A more optimized approach could check if parentItem.qty is different from a previously stored one.
    
    setLoadingDetailsForItemId(parentItem.id);
    try {
      const response = await fetch(`${ITEM_DETAILS_API_URL}?itemId=${parentItem.id}`);
      if (!response.ok) throw new Error(`Failed to fetch item details for item ID ${parentItem.id}: ${response.statusText}`);
      const data: ItemDetailReadDto[] = await response.json();
      
      const detailsWithStock = data.map(detail => ({
        ...detail
      }));

      setItemDetailsCache(prev => ({ ...prev, [parentItem.id]: detailsWithStock }));
      return detailsWithStock;
    } catch (error) {
      handleApiError(error, `Could not fetch details for item ID ${parentItem.id}.`, "Fetch Item Details");
      setItemDetailsCache(prev => ({ ...prev, [parentItem.id]: [] }));
      return [];
    } finally {
      setLoadingDetailsForItemId(null);
    }
  }, []); // itemDetailsCache removed from deps to avoid loop if it was causing one. fetchAndCacheItemDetails is called explicitly.

  const toggleItemDetails = async (item: Item) => {
    const newExpandedItemIds = new Set(expandedItemIds);
    if (newExpandedItemIds.has(item.id)) {
      newExpandedItemIds.delete(item.id);
    } else {
      newExpandedItemIds.add(item.id);
      await fetchAndCacheItemDetails(item); 
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
      definedPackageQty: 1, // Use definedPackageQty
      price: null,
    });
    setIsItemDetailModalOpen(true);
  };

  const handleEditItemDetail = (detail: ItemDetailReadDto, parentItemId: number) => {
    setParentItemIdForDetailModal(parentItemId);
    setEditingItemDetailId(detail.id);
    setCurrentItemDetailData({
      code: detail.code,
      itemID: detail.itemID,
      unitID: detail.unitID,
      definedPackageQty: detail.definedPackageQty, // Use definedPackageQty
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
    const parentItem = items.find(i => i.id === parentItemIdForDetailModal);
    if (!parentItem || currentItemDetailData.unitID === undefined || currentItemDetailData.unitID === null || !currentItemDetailData.definedPackageQty) { // Use definedPackageQty
      toast.error("Validation Error", { description: "Parent item, Unit, and Defined Package Qty are required." });
      return;
    }
    if (editingItemDetailId && (!currentItemDetailData.code || !currentItemDetailData.code.trim())) {
        toast.error("Validation Error", { description: "Code is required when updating." });
        return;
    }
    setIsSubmitting(true);
    const baseDtoFields = {
        itemID: parentItemIdForDetailModal!, 
        unitID: currentItemDetailData.unitID!,
        definedPackageQty: Number(currentItemDetailData.definedPackageQty), // Use definedPackageQty
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
        successMessage = "Packaging detail updated.";
      } else {
        response = await fetch(ITEM_DETAILS_API_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dtoToSend as ItemDetailWriteDto),
        });
        successMessage = "Packaging detail created.";
      }
      if (!response.ok) { const errorData = await response.json().catch(() => ({})); throw errorData; }
      
      await fetchAndCacheItemDetails(parentItem);
      setExpandedItemIds(prev => new Set(prev).add(parentItemIdForDetailModal!));

      toast.success("Success", { description: successMessage });
      setIsItemDetailModalOpen(false);
    } catch (error) {
      handleApiError(error, "Could not save packaging detail.", editingItemDetailId ? "Update Detail" : "Create Detail");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItemDetailInitiate = (detailId: number, parentItemId: number) => {
    setParentItemIdForDetailModal(parentItemId); 
    setItemDetailToDeleteId(detailId);
    setIsItemDetailDeleteDialogIsOpen(true);
  };

  const handleDeleteItemDetailConfirm = async () => {
    if (itemDetailToDeleteId === null || !parentItemIdForDetailModal) return;
    const parentItem = items.find(i => i.id === parentItemIdForDetailModal);
    if (!parentItem) {
        toast.error("Error", {description: "Parent item not found."});
        setIsItemDetailDeleteDialogIsOpen(false);
        return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${ITEM_DETAILS_API_URL}/${itemDetailToDeleteId}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) { const errorData = await response.json().catch(() => ({})); throw errorData; }
      
      await fetchAndCacheItemDetails(parentItem);
      setExpandedItemIds(prev => new Set(prev).add(parentItemIdForDetailModal!));

      toast.success("Success", { description: "Packaging detail deleted." });
    } catch (error) {
      handleApiError(error, "Could not delete packaging detail.", "Delete Detail");
    } finally {
      setIsSubmitting(false);
      setIsItemDetailDeleteDialogIsOpen(false);
      setItemDetailToDeleteId(null);
    }
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Manage Items</CardTitle>
          <Button size="sm" onClick={handleAddNewItem} disabled={isSubmitting || isLoadingItems}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
          </Button>
        </div>
        <CardDescription>View items and manage their packaging details. Total stock is in base units.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingItems && <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin inline mr-2" />Loading items...</div>}
        {!isLoadingItems && (
          <Table>
            <TableCaption>{items.length === 0 ? "No items found." : "A list of your items."}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead> 
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Base Unit</TableHead>
                {/* <TableHead className="text-right">Stock (Base Units)</TableHead> */}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <React.Fragment key={item.id}>
                  <TableRow className={item.disabled ? "opacity-60 bg-muted/30 hover:bg-muted/40" : "hover:bg-muted/50"}>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => toggleItemDetails(item)} className="h-8 w-8">
                        {expandedItemIds.has(item.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{categories.find(c => c.id === item.categoryID)?.name || 'N/A'}</TableCell>
                    <TableCell>{units.find(u => u.id === item.baseUnitID)?.name || 'N/A'}</TableCell>
                    {/* <TableCell className="text-right">{item.qty !== null ? item.qty.toLocaleString() : '-'}</TableCell> */}
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
                      <TableCell colSpan={7} className="p-0">
                        <div className="p-4 ">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-sm flex items-center">
                              <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                              Packaging Details for: {item.name}
                            </h4>
                            <Button variant="outline" size="sm" onClick={() => handleAddNewItemDetail(item.id)} disabled={isSubmitting}>
                              <PackagePlus className="mr-1 h-3 w-3" /> Add Packaging
                            </Button>
                          </div>
                          {loadingDetailsForItemId === item.id && <div className="text-center py-3"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading details...</div>}
                          {loadingDetailsForItemId !== item.id && itemDetailsCache[item.id] && itemDetailsCache[item.id]!.length > 0 && (
                            <Table className="bg-background rounded-md shadow-sm">
                              <TableHeader>
                                <TableRow className="text-xs">
                                  <TableHead>Code</TableHead>
                                  <TableHead>Unit</TableHead>
                                  <TableHead className="text-right">Unit Conversion</TableHead> 
                                  <TableHead className="text-right">Stock </TableHead> 
                                  <TableHead className="text-right">Price</TableHead> 
                                  <TableHead className="text-right w-20">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {itemDetailsCache[item.id]!.map(detail => (
                                  <TableRow key={detail.id} className={`text-xs ${detail.disabled ? "opacity-50" : ""}`}>
                                    <TableCell>{detail.code}</TableCell>
                                    <TableCell>{detail.unitName || 'N/A'}</TableCell>
                                    <TableCell className="text-right">{detail.definedPackageQty}</TableCell> {/* Use definedPackageQty */}
                                    <TableCell className="text-right font-medium">
                                      {detail.quantityOnHand !== undefined && detail.quantityOnHand !== null ? detail.quantityOnHand.toLocaleString() : '-'}
                                    </TableCell>
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
                            <p className="text-sm text-muted-foreground text-center py-3">No packaging details found for this item.</p>
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

      {/* Item Add/Edit Modal */}
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
                <Label htmlFor="item-qty" className="text-right col-span-1">Stock (Base Units)</Label>
                <Input id="item-qty" name="qty" type="number" min="0" value={currentItemData.qty === null || currentItemData.qty === undefined ? '' : currentItemData.qty} onChange={(e) => handleItemFormChange('qty', e.target.value === '' ? null : parseInt(e.target.value, 10))} className="col-span-3" placeholder="Initial stock in base units" disabled={isSubmitting} />
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

      {/* Item Delete Confirmation Dialog */}
      <AlertDialog open={isItemDeleteDialogIsOpen} onOpenChange={setIsItemDeleteDialogIsOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete Item?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. Deleting an item will also disable its packaging details.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteItemConfirm} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete Item
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Item Detail Add/Edit Modal */}
        <Dialog open={isItemDetailModalOpen} onOpenChange={setIsItemDetailModalOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{editingItemDetailId ? 'Edit Packaging Detail' : 'Add New Packaging Detail'}</DialogTitle>
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
                                {units.filter(u => !u.disabled && u.id !== items.find(i => i.id === parentItemIdForDetailModal)?.baseUnitID) 
                                .map(unit => <SelectItem key={String(unit.id)} value={String(unit.id)}>{unit.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        {/* Use definedPackageQty */}
                        <Label htmlFor="detail-definedPackageQty" className="text-right col-span-1">Base Units / Pack*</Label>
                        <Input id="detail-definedPackageQty" name="definedPackageQty" type="number" min="1" value={currentItemDetailData.definedPackageQty || 1} onChange={(e) => handleItemDetailFormChange('definedPackageQty', parseInt(e.target.value,10) || 1)} className="col-span-3" required disabled={isSubmitting} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="detail-price" className="text-right col-span-1">Selling Price (per Pack)</Label>
                        <Input id="detail-price" name="price" type="number" step="0.01" min="0" value={currentItemDetailData.price === null || currentItemDetailData.price === undefined ? '' : currentItemDetailData.price} onChange={(e) => handleItemDetailFormChange('price', e.target.value === '' ? null : parseFloat(e.target.value))} className="col-span-3" placeholder="0.00" disabled={isSubmitting} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingItemDetailId ? 'Save Changes' : 'Add Packaging'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        {/* Item Detail Delete Confirmation Dialog */}
        <AlertDialog open={isItemDetailDeleteDialogIsOpen} onOpenChange={setIsItemDetailDeleteDialogIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete Packaging Detail?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
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
