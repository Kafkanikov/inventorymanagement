// ecommerce.client/src/components/dashboard/forms/SaleOrderForm.tsx
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
import { DatePicker } from '@/components/ui/date-picker'; // Using the new DatePicker
import { Trash2, PlusCircle, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  SaleWriteDto,
  SaleDetailWriteDto,
  StockLocation, // For dropdown
  ItemDetailBasicInfo, // For item selection
  ApiErrorResponse,
} from '@/types/inventory';
import { format } from 'date-fns';

const STOCK_LOCATIONS_API_URL = '/api/stocks?includeDisabled=false';
const ITEM_DETAILS_API_URL = '/api/itemdetails?includeDisabled=false'; // To get item codes, names, units, prices
const SALES_API_URL = '/api/sales';

interface SaleOrderFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const SaleOrderForm: React.FC<SaleOrderFormProps> = ({ onSuccess, onCancel }) => {
  const [saleDate, setSaleDate] = useState<Date | undefined>(new Date());
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  // Add customer selection here if needed in the future
  // const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  const [details, setDetails] = useState<Partial<SaleDetailWriteDto>[]>([
    { itemCode: '', qty: 1, linePrice: 0 },
  ]);

  const [stockLocations, setStockLocations] = useState<StockLocation[]>([]);
  const [availableItems, setAvailableItems] = useState<ItemDetailBasicInfo[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDataForDropdowns = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [stockLocationsRes, itemsRes] = await Promise.all([
        fetch(STOCK_LOCATIONS_API_URL),
        fetch(ITEM_DETAILS_API_URL),
      ]);

      if (!stockLocationsRes.ok) throw new Error('Failed to fetch stock locations');
      if (!itemsRes.ok) throw new Error('Failed to fetch items');

      setStockLocations(await stockLocationsRes.json());
      setAvailableItems(await itemsRes.json());

    } catch (error) {
      toast.error("Error loading form data", { description: (error as Error).message });
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchDataForDropdowns();
  }, [fetchDataForDropdowns]);

  const handleDetailChange = (index: number, field: keyof SaleDetailWriteDto, value: string | number) => {
    const newDetails = [...details];
    const currentDetail = { ...newDetails[index] };

    if (field === 'qty' || field === 'linePrice') {
        // @ts-ignore
      currentDetail[field] = Number(value);
    } else {
        // @ts-ignore
      currentDetail[field] = value;
    }
    
    // If qty or unit price changes, recalculate line price
    if (field === 'qty' && currentDetail.itemCode) {
        const item = availableItems.find(i => i.code === currentDetail.itemCode);
        const unitPrice = item?.price || 0; // Assuming item.price is unit price
         // @ts-ignore
        currentDetail.linePrice = (currentDetail.qty || 0) * unitPrice;
    }
    // If itemCode changes, price might need to be reset or recalculated based on new item's unit price
    // This part is simplified; a real scenario might involve fetching price or having a unit price field.

    newDetails[index] = currentDetail;
    setDetails(newDetails);
  };

  const handleItemSelection = (index: number, itemCode: string) => {
    const newDetails = [...details];
    const selectedItem = availableItems.find(item => item.code === itemCode);
    newDetails[index].itemCode = itemCode;
    
    // Pre-fill price based on item's selling price and current quantity
    const currentQty = newDetails[index].qty || 1;
    const unitPrice = selectedItem?.price || 0; // Assuming ItemDetailBasicInfo.price is the unit selling price
    newDetails[index].linePrice = currentQty * unitPrice;
    
    setDetails(newDetails);
  };


  const addDetailRow = () => {
    setDetails([...details, { itemCode: '', qty: 1, linePrice: 0 }]);
  };

  const removeDetailRow = (index: number) => {
    const newDetails = details.filter((_, i) => i !== index);
    setDetails(newDetails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleDate || !selectedStockId || details.some(d => !d.itemCode || d.qty == null || d.qty <= 0 || d.linePrice == null || d.linePrice < 0)) {
      toast.error("Validation Error", { description: "Please fill all required fields, ensure item quantities are positive and prices are non-negative." });
      return;
    }

    setIsSubmitting(true);
    const saleData: SaleWriteDto = {
      date: format(saleDate, 'yyyy-MM-dd'),
      stockID: parseInt(selectedStockId, 10),
      // customerID: selectedCustomerId ? parseInt(selectedCustomerId, 10) : undefined,
      details: details.filter(d => d.itemCode && d.qty && d.linePrice != null) as SaleDetailWriteDto[],
    };

    try {
      const response = await fetch(SALES_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create sale: ${response.statusText}`);
      }
      toast.success("Sale Order Created Successfully!");
      onSuccess();
    } catch (error) {
      toast.error("Submission Failed", { description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotalPrice = () => {
    return details.reduce((total, detail) => total + (detail.linePrice || 0), 0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 flex-grow overflow-y-auto pr-2">
      {isLoadingData && <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /> Loading data...</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="sale-date">Date*</Label>
          <DatePicker
            date={saleDate}
            setDate={setSaleDate}
            className="w-full"
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stockLocation-sale">Stock Location*</Label>
          <Select value={selectedStockId} onValueChange={setSelectedStockId} disabled={isSubmitting || stockLocations.length === 0}>
            <SelectTrigger id="stockLocation-sale"><SelectValue placeholder="Select stock location" /></SelectTrigger>
            <SelectContent>
              {stockLocations.map(sl => <SelectItem key={sl.id} value={String(sl.id)}>{sl.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {/* Add Customer Dropdown here if needed */}
      </div>

      <div className="space-y-2">
        <Label>Sale Details*</Label>
        {details.map((detail, index) => (
          <div key={index} className="flex items-end gap-2 p-2 border rounded">
            <div className="flex-grow space-y-1.5">
              <Label htmlFor={`sale-itemCode-${index}`} className="text-xs">Item*</Label>
              <Select
                value={detail.itemCode || ''}
                onValueChange={(value) => handleItemSelection(index, value)}
                disabled={isSubmitting || availableItems.length === 0}
              >
                <SelectTrigger id={`sale-itemCode-${index}`}><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>
                  {availableItems.map(item => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.itemName} ({item.code}) - Unit: {item.unitName} {item.price != null ? ` ($${item.price.toFixed(2)})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24 space-y-1.5">
              <Label htmlFor={`sale-qty-${index}`} className="text-xs">Qty*</Label>
              <Input
                id={`sale-qty-${index}`}
                type="number"
                min="1"
                value={detail.qty || ''}
                onChange={(e) => handleDetailChange(index, 'qty', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="w-32 space-y-1.5">
              <Label htmlFor={`sale-price-${index}`} className="text-xs">Total Line Price*</Label>
              <Input
                id={`sale-price-${index}`}
                type="number"
                min="0"
                step="0.01"
                value={detail.linePrice || ''}
                onChange={(e) => handleDetailChange(index, 'linePrice', e.target.value)}
                disabled={isSubmitting}
                // Consider making this read-only if always calculated (qty * unit price)
                // readOnly={!!detail.itemCode} 
              />
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeDetailRow(index)} disabled={isSubmitting || details.length <= 1}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addDetailRow} disabled={isSubmitting}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="text-right font-semibold text-lg mt-4">
        Total Sale Price: ${calculateTotalPrice().toFixed(2)}
      </div>

      <div className="flex justify-end space-x-2 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isLoadingData}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Create Sale
        </Button>
      </div>
    </form>
  );
};
