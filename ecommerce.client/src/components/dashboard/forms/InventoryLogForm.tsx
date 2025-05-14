// src/components/dashboard/forms/InventoryLogForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// No Card import here, Dialog will provide the frame
import { Loader2, SaveIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  ItemSelection,
  UnitSelection,
  ItemDetailSelection,
  ApiErrorResponse,
  InventoryLogWriteDto
} from '@/types/inventory';
// useAuth is not strictly needed here if UserID is handled by server, but can be for initial defaults if any
// import { useAuth } from '@/contexts/AuthContext';

const ITEMS_API_URL = '/api/items';
const UNITS_API_URL = '/api/units';
const ITEM_DETAILS_API_URL = '/api/itemdetails';
const INVENTORY_LOG_API_URL = '/api/InventoryLogs'; // Matches your controller

// Must match the constrainst in your database
const TRANSACTION_TYPES = [
  { value: "Stock Adjustment In", label: "Stock Adjustment (In)" },
  { value: "Stock Adjustment Out", label: "Stock Adjustment (Out)" },
  { value: "Initial Stock", label: "Initial Stock Entry" },
  // "Purchase" and "Sale" are now allowed as per your controller,
  // but your controller has logic to prevent these if they are meant to be trigger-based.
  // Consider if these should be in the list for manual entry.
  { value: "Purchase", label: "Purchase (Manual)" },
  { value: "Sale", label: "Sale (Manual)" },
  { value: "Transfer In", label: "Stock Transfer (In)" },
  { value: "Transfer Out", label: "Stock Transfer (Out)" },
  { value: "Customer Return", label: "Return from Customer" },
  { value: "Vendor Return", label: "Return to Supplier" },
  { value: "Damaged", label: "Damaged Goods" },
  { value: "Expired", label: "Expired Goods" },
];

const NO_ITEM_DETAIL_SELECTED_VALUE = "_NO_SPECIFIC_PACKAGING_";

interface InventoryLogFormProps {
  onFormSubmitSuccess: () => void; // Callback to close dialog and refresh logs
  onCancel: () => void; // Callback for the cancel button
  // You could pass an optional logToEdit if you want this form for editing too
}

export const InventoryLogFormDialogContent: React.FC<InventoryLogFormProps> = ({ onFormSubmitSuccess, onCancel }) => {
  // const { user } = useAuth(); // User ID will be handled by the server
  const [formData, setFormData] = useState<Partial<InventoryLogWriteDto>>({
    transactionType: TRANSACTION_TYPES[0].value,
    quantityTransacted: 1,
    itemDetailID_Transaction: undefined,
    unitIDTransacted: undefined,
  });
  const [items, setItems] = useState<ItemSelection[]>([]);
  const [selectedItemDetails, setSelectedItemDetails] = useState<ItemDetailSelection[]>([]);
  const [allUnits, setAllUnits] = useState<UnitSelection[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(false); // For fetching items/units
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetFormState = () => {
    setFormData({
        transactionType: TRANSACTION_TYPES[0].value,
        quantityTransacted: 1,
        itemID: undefined,
        itemDetailID_Transaction: undefined,
        unitIDTransacted: undefined,
        costPricePerBaseUnit: undefined,
        salePricePerTransactedUnit: undefined,
        // notes: '', // Uncomment if notes are used
    });
    setSelectedItemDetails([]);
  }

  const fetchItemsForSelection = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch(`${ITEMS_API_URL}?includeDisabled=false`);
      if (!response.ok) throw new Error('Failed to fetch items');
      const data: ItemSelection[] = await response.json();
      setItems(data);
    } catch (error) {
      toast.error("Error fetching items", { description: (error as Error).message });
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const fetchAllUnits = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch(`${UNITS_API_URL}?includeDisabled=false`);
      if (!response.ok) throw new Error('Failed to fetch units');
      const data: UnitSelection[] = await response.json();
      setAllUnits(data);
    } catch (error) {
      toast.error("Error fetching units", { description: (error as Error).message });
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchItemsForSelection();
    fetchAllUnits();
  }, [fetchItemsForSelection, fetchAllUnits]);

  const fetchItemSpecificDetails = async (itemId: number) => {
    // ... (implementation remains largely the same as in previous InventoryLogForm.tsx)
    if (!itemId) {
      setSelectedItemDetails([]);
      return;
    }
    try {
      const response = await fetch(`${ITEM_DETAILS_API_URL}?itemId=${itemId}&includeDisabled=false`);
      if (!response.ok) throw new Error('Failed to fetch item packaging details');
      const itemDetailsData: ItemDetailSelection[] = await response.json();
      setSelectedItemDetails(itemDetailsData);

      const currentItem = items.find(i => i.id === itemId);
      if (itemDetailsData.length > 0) {
        setFormData(prev => ({
          ...prev,
          itemDetailID_Transaction: itemDetailsData[0].id,
          unitIDTransacted: itemDetailsData[0].unitID,
        }));
      } else if (currentItem) {
         setFormData(prev => ({
          ...prev,
          itemDetailID_Transaction: undefined,
          unitIDTransacted: currentItem.baseUnitID,
        }));
      }
    } catch (error) {
      toast.error("Error fetching packaging", { description: (error as Error).message });
      setSelectedItemDetails([]);
      const currentItem = items.find(i => i.id === itemId);
      if (currentItem) {
        setFormData(prev => ({ ...prev, itemDetailID_Transaction: undefined, unitIDTransacted: currentItem.baseUnitID }));
      }
    }
  };

  const handleItemChange = (itemIdString: string) => {
    // ... (implementation remains largely the same)
    if (!itemIdString) {
        setFormData(prev => ({ ...prev, itemID: undefined, itemDetailID_Transaction: undefined, unitIDTransacted: undefined }));
        setSelectedItemDetails([]);
        return;
    }
    const itemId = parseInt(itemIdString, 10);
    const currentItem = items.find(i => i.id === itemId);
    setFormData(prev => ({ ...prev, itemID: itemId, itemDetailID_Transaction: undefined, unitIDTransacted: currentItem?.baseUnitID }));
    fetchItemSpecificDetails(itemId);
  };

  const handleItemDetailChange = (selectedValue: string) => {
    // ... (implementation remains largely the same)
     if (!selectedValue || selectedValue === NO_ITEM_DETAIL_SELECTED_VALUE) {
      const currentItem = items.find(i => i.id === formData.itemID);
      setFormData(prev => ({ ...prev, itemDetailID_Transaction: undefined, unitIDTransacted: currentItem?.baseUnitID }));
    } else {
      const itemDetailID = parseInt(selectedValue, 10);
      const selectedDetail = selectedItemDetails.find(d => d.id === itemDetailID);
      setFormData(prev => ({ ...prev, itemDetailID_Transaction: itemDetailID, unitIDTransacted: selectedDetail?.unitID }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // ... (implementation remains largely the same)
     const { name, value } = e.target;
    const numericFields = ['quantityTransacted', 'costPricePerBaseUnit', 'salePricePerTransactedUnit'];
    setFormData(prev => ({ ...prev, [name]: numericFields.includes(name) ? (value === '' ? undefined : parseFloat(value)) : value }));
  };

  const handleSelectChange = (name: keyof InventoryLogWriteDto, value: string) => {
    // ... (implementation remains largely the same)
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemID || !formData.transactionType || formData.quantityTransacted == null || formData.quantityTransacted <= 0 || !formData.unitIDTransacted) {
      toast.error("Validation Error", { description: "Item, Type, positive Quantity, and Unit are required." });
      return;
    }
    setIsSubmitting(true);

    const payload: InventoryLogWriteDto = {
      itemID: formData.itemID,
      itemDetailID_Transaction: formData.itemDetailID_Transaction || null,
      transactionType: formData.transactionType,
      quantityTransacted: formData.quantityTransacted,
      unitIDTransacted: formData.unitIDTransacted,
      costPricePerBaseUnit: formData.costPricePerBaseUnit,
      salePricePerTransactedUnit: formData.salePricePerTransactedUnit,
    };

    try {
      const response = await fetch(INVENTORY_LOG_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to record log: ${response.statusText}`);
      }
      toast.success("Inventory Log Recorded Successfully!");
      resetFormState();
      onFormSubmitSuccess(); // Call callback to close dialog & refresh parent
    } catch (error) {
      toast.error("Submission Failed", { description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentItem = items.find(i => i.id === formData.itemID);
  const currentItemBaseUnitId = currentItem?.baseUnitID;
  const currentItemBaseUnitName = currentItem?.baseUnitName || allUnits.find(u => u.id === currentItemBaseUnitId)?.name;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2"> {/* Added scroll for long forms */}
        {isLoadingData && <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="logform-itemID">Item*</Label>
          <Select name="itemID" onValueChange={handleItemChange} value={formData.itemID?.toString() || ""} disabled={isLoadingData || isSubmitting}>
            <SelectTrigger id="logform-itemID"><SelectValue placeholder="Select item..." /></SelectTrigger>
            <SelectContent>
              {items.map(item => (<SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="logform-transactionType">Transaction Type*</Label>
          <Select name="transactionType" onValueChange={(value) => handleSelectChange('transactionType' as keyof InventoryLogWriteDto, value)} value={formData.transactionType} disabled={isSubmitting}>
            <SelectTrigger id="logform-transactionType"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPES.map(type => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="logform-itemDetailID_Transaction">Packaging/Unit*</Label>
          <Select
            name="itemDetailID_Transaction"
            onValueChange={handleItemDetailChange}
            value={formData.itemDetailID_Transaction?.toString() || NO_ITEM_DETAIL_SELECTED_VALUE}
            disabled={isSubmitting || !formData.itemID || (selectedItemDetails.length === 0 && !currentItemBaseUnitName)}
          >
            <SelectTrigger id="logform-itemDetailID_Transaction"><SelectValue placeholder="Select packaging (or base unit)" /></SelectTrigger>
            <SelectContent>
              {currentItemBaseUnitName && (
                <SelectItem value={NO_ITEM_DETAIL_SELECTED_VALUE}>{currentItemBaseUnitName} (Base Unit)</SelectItem>
              )}
              {selectedItemDetails.map(detail => (
                <SelectItem key={detail.id} value={String(detail.id)}>{detail.code} ({detail.unitName} - {detail.conversionFactor} base)</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="logform-quantityTransacted">Quantity Transacted*</Label>
          <Input id="logform-quantityTransacted" name="quantityTransacted" type="number" value={formData.quantityTransacted ?? ''} onChange={handleChange} min="0.0001" step="any" required disabled={isSubmitting} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="logform-costPricePerBaseUnit">Cost Price (per Base Unit)</Label>
          <Input id="logform-costPricePerBaseUnit" name="costPricePerBaseUnit" type="number" value={formData.costPricePerBaseUnit ?? ''} onChange={handleChange} min="0" step="any" placeholder="Optional" disabled={isSubmitting} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="logform-salePricePerTransactedUnit">Sale Price (per Transacted Unit)</Label>
          <Input id="logform-salePricePerTransactedUnit" name="salePricePerTransactedUnit" type="number" value={formData.salePricePerTransactedUnit ?? ''} onChange={handleChange} min="0" step="any" placeholder="Optional" disabled={isSubmitting} />
        </div>
      </div>

      {/* <div className="space-y-1.5"> // Uncomment if Notes is used
        <Label htmlFor="logform-notes">Notes</Label>
        <Textarea id="logform-notes" name="notes" value={formData.notes || ''} onChange={handleChange} placeholder="Optional notes..." rows={3} disabled={isSubmitting} />
      </div> */}

      {/* Submit and Cancel buttons will be part of DialogFooter in the parent component */}
      <div className="pt-4 flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isLoadingData}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SaveIcon className="mr-2 h-4 w-4" />}
            Record Transaction
          </Button>
      </div>
    </form>
  );
};