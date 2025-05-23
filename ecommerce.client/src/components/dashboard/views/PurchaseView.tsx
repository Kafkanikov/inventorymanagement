import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { PurchaseReadDto, ApiErrorResponse } from '@/types/inventory';
import { PurchaseOrderForm } from '../forms/PurchaseOrderForm'; 
import { format } from 'date-fns';
// No need to import DatePicker here directly unless used for filtering in this view

const PURCHASES_API_URL = '/api/purchases'; 

export const PurchaseView: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [purchases, setPurchases] = useState<PurchaseReadDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<PurchaseReadDto | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);


  const fetchPurchases = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(PURCHASES_API_URL); 
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch purchases: ${response.statusText}`);
      }
      const data: PurchaseReadDto[] = await response.json();
      setPurchases(data);
    } catch (error) {
      console.error(error);
      toast.error("Error Fetching Purchases", {
        description: error instanceof Error ? error.message : "Could not fetch purchase records.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleOpenCreateModal = () => setIsCreateModalOpen(true);
  const handleCloseCreateModal = () => setIsCreateModalOpen(false);

  const handlePurchaseCreated = () => {
    fetchPurchases(); 
    handleCloseCreateModal();
  };

  const handleViewPurchase = (purchase: PurchaseReadDto) => {
    setViewingPurchase(purchase);
    setIsViewModalOpen(true);
  };
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Purchases</CardTitle>
            <CardDescription>Create new purchase orders and view history.</CardDescription>
          </div>
          <Button onClick={handleOpenCreateModal} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Purchase
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading purchases...</p>
            </div>
          )}
          {!isLoading && purchases.length === 0 && (
            <p className="text-center text-muted-foreground py-10">No purchase orders found.</p>
          )}
          {!isLoading && purchases.length > 0 && (
            <Table>
              <TableCaption>A list of your recent purchase orders.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Stock Location</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id} className={purchase.disabled ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{purchase.code}</TableCell>
                    <TableCell>{format(new Date(purchase.date), 'PP')}</TableCell>
                    <TableCell>{purchase.supplierName || `ID: ${purchase.supplierID}`}</TableCell>
                    <TableCell>{purchase.stockName || `ID: ${purchase.stockID}`}</TableCell>
                    <TableCell className="text-right">${purchase.details[0].cost.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleViewPurchase(purchase)}>
                        <Eye className="mr-1 h-4 w-4" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New Purchase Order</DialogTitle>
            <DialogDescription>
              Fill in the details for the new purchase order.
            </DialogDescription>
          </DialogHeader>
          {isCreateModalOpen && (
            <PurchaseOrderForm
              onSuccess={handlePurchaseCreated}
              onCancel={handleCloseCreateModal}
            />
          )}
        </DialogContent>
      </Dialog>

      {viewingPurchase && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-xl md:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Purchase Order: {viewingPurchase.code}</DialogTitle>
              <DialogDescription>
                Date: {format(new Date(viewingPurchase.date), 'PP')} | Supplier: {viewingPurchase.supplierName || `ID: ${viewingPurchase.supplierID}`}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[60vh] overflow-y-auto">
              <h4 className="font-semibold mb-2">Items:</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingPurchase.details.map(detail => (
                    <TableRow key={detail.id}>
                      <TableCell>{detail.itemCode}</TableCell>
                      <TableCell>{detail.itemName || 'N/A'}</TableCell>
                      <TableCell>{detail.qty}</TableCell>
                      <TableCell className="text-right">${(detail.cost / detail.qty).toFixed(2)}</TableCell>
                      <TableCell className="text-right">${detail.cost.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-right font-bold mt-4">
                Total Cost: ${viewingPurchase.details[0].cost.toFixed(2)}
              </div>
            </div>
             <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}