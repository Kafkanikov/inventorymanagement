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
  PurchaseWriteDto,
  PurchaseDetailWriteDto,
  Supplier, 
  StockLocation, 
  ItemDetailBasicInfo, 
  ApiErrorResponse,
} from '@/types/inventory';
import { format } from 'date-fns';

const SUPPLIERS_API_URL = '/api/suppliers?includeDisabled=false';
const STOCK_LOCATIONS_API_URL = '/api/stocks?includeDisabled=false';
const ITEM_DETAILS_API_URL = '/api/itemdetails?includeDisabled=false'; 
const PURCHASES_API_URL = '/api/purchases';

interface PurchaseOrderFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ onSuccess, onCancel }) => {
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(new Date()); // Changed for DatePicker
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [details, setDetails] = useState<Partial<PurchaseDetailWriteDto>[]>([
    { itemCode: '', qty: 1, cost: 0 },
  ]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stockLocations, setStockLocations] = useState<StockLocation[]>([]);
  const [availableItems, setAvailableItems] = useState<ItemDetailBasicInfo[]>([]); 

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDataForDropdowns = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [suppliersRes, stockLocationsRes, itemsRes] = await Promise.all([
        fetch(SUPPLIERS_API_URL),
        fetch(STOCK_LOCATIONS_API_URL),
        fetch(ITEM_DETAILS_API_URL), 
      ]);

      if (!suppliersRes.ok) throw new Error('Failed to fetch suppliers');
      if (!stockLocationsRes.ok) throw new Error('Failed to fetch stock locations');
      if (!itemsRes.ok) throw new Error('Failed to fetch items');

      setSuppliers(await suppliersRes.json());
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

  const handleDetailChange = (index: number, field: keyof PurchaseDetailWriteDto, value: string | number) => {
    const newDetails = [...details];
    // @ts-ignore
    newDetails[index][field] = field === 'qty' || field === 'cost' ? Number(value) : value;
    setDetails(newDetails);
  };

  const handleItemSelection = (index: number, itemCode: string) => {
    const newDetails = [...details];
    // const selectedItem = availableItems.find(item => item.code === itemCode); // Not used directly for cost
    newDetails[index].itemCode = itemCode;
    setDetails(newDetails);
  };

  const addDetailRow = () => {
    setDetails([...details, { itemCode: '', qty: 1, cost: 0 }]);
  };

  const removeDetailRow = (index: number) => {
    const newDetails = details.filter((_, i) => i !== index);
    setDetails(newDetails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseDate || !selectedSupplierId || !selectedStockId || details.some(d => !d.itemCode || d.qty == null || d.qty <= 0 || d.cost == null || d.cost < 0)) {
      toast.error("Validation Error", { description: "Please fill all required fields, and ensure item quantities are positive and costs are non-negative." });
      return;
    }

    setIsSubmitting(true);
    const purchaseData: PurchaseWriteDto = {
      date: format(purchaseDate, 'yyyy-MM-dd'),
      supplierID: parseInt(selectedSupplierId, 10),
      stockID: parseInt(selectedStockId, 10),
      details: details.filter(d => d.itemCode && d.qty && d.cost != null) as PurchaseDetailWriteDto[], 
    };

    try {
      const response = await fetch(PURCHASES_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseData),
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create purchase: ${response.statusText}`);
      }
      toast.success("Purchase Order Created Successfully!");
      onSuccess();
    } catch (error) {
      toast.error("Submission Failed", { description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotalCost = () => {
    return details.reduce((total, detail) => total + (detail.cost || 0), 0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 flex-grow overflow-y-auto pr-2">
      {isLoadingData && <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /> Loading data...</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="purchase-date">Date*</Label>
          <DatePicker // Using the new DatePicker component
            date={purchaseDate}
            setDate={setPurchaseDate}
            className="w-full"
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="supplier">Supplier*</Label>
          <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId} disabled={isSubmitting || suppliers.length === 0}>
            <SelectTrigger id="supplier"><SelectValue placeholder="Select supplier" /></SelectTrigger>
            <SelectContent>
              {suppliers.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stockLocation">Stock Location*</Label>
          <Select value={selectedStockId} onValueChange={setSelectedStockId} disabled={isSubmitting || stockLocations.length === 0}>
            <SelectTrigger id="stockLocation"><SelectValue placeholder="Select stock location" /></SelectTrigger>
            <SelectContent>
              {stockLocations.map(sl => <SelectItem key={sl.id} value={String(sl.id)}>{sl.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Purchase Details*</Label>
        {details.map((detail, index) => (
          <div key={index} className="flex items-end gap-2 p-2 border rounded">
            <div className="flex-grow space-y-1.5">
              <Label htmlFor={`itemCode-${index}`} className="text-xs">Item*</Label>
              <Select
                value={detail.itemCode || ''}
                onValueChange={(value) => handleItemSelection(index, value)}
                disabled={isSubmitting || availableItems.length === 0}
              >
                <SelectTrigger id={`itemCode-${index}`}><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>
                  {availableItems.map(item => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.itemName} ({item.code}) - Unit: {item.unitName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24 space-y-1.5">
              <Label htmlFor={`qty-${index}`} className="text-xs">Qty*</Label>
              <Input
                id={`qty-${index}`}
                type="number"
                min="1"
                value={detail.qty || ''}
                onChange={(e) => handleDetailChange(index, 'qty', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="w-32 space-y-1.5">
              <Label htmlFor={`cost-${index}`} className="text-xs">Total Line Cost*</Label>
              <Input
                id={`cost-${index}`}
                type="number"
                min="0"
                step="0.01"
                value={detail.cost || ''}
                onChange={(e) => handleDetailChange(index, 'cost', e.target.value)}
                disabled={isSubmitting}
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
        Total Purchase Cost: ${calculateTotalCost().toFixed(2)}
      </div>

      <div className="flex justify-end space-x-2 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isLoadingData}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Create Purchase
        </Button>
      </div>
    </form>
  );
};