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
import { SaleReadDto, ApiErrorResponse } from '@/types/inventory';
import { SaleOrderForm } from '../forms/SaleOrderForm'; 
import { format } from 'date-fns';
// No need to import DatePicker here directly unless used for filtering in this view

const SALES_API_URL = '/api/sales'; 

export const SaleView: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sales, setSales] = useState<SaleReadDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewingSale, setViewingSale] = useState<SaleReadDto | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(SALES_API_URL);
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch sales: ${response.statusText}`);
      }
      const data: SaleReadDto[] = await response.json();
      setSales(data);
    } catch (error) {
      console.error(error);
      toast.error("Error Fetching Sales", {
        description: error instanceof Error ? error.message : "Could not fetch sale records.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleOpenCreateModal = () => setIsCreateModalOpen(true);
  const handleCloseCreateModal = () => setIsCreateModalOpen(false);

  const handleSaleCreated = () => {
    fetchSales(); 
    handleCloseCreateModal();
  };

  const handleViewSale = (sale: SaleReadDto) => {
    setViewingSale(sale);
    setIsViewModalOpen(true);
  };


  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Sales</CardTitle>
            <CardDescription>Create new sale orders and view history.</CardDescription>
          </div>
          <Button onClick={handleOpenCreateModal} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Sale
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
               <p className="ml-2">Loading sales...</p>
            </div>
          )}
           {!isLoading && sales.length === 0 && (
            <p className="text-center text-muted-foreground py-10">No sale orders found.</p>
          )}
          {!isLoading && sales.length > 0 && (
            <Table>
              <TableCaption>A list of your recent sale orders.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Date</TableHead>
                  {/* <TableHead>Customer</TableHead> */}
                  <TableHead>Stock Location</TableHead>
                  <TableHead className="text-right">Total Price</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id} className={sale.disabled ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{sale.code}</TableCell>
                    <TableCell>{format(new Date(sale.date), 'PP')}</TableCell>
                    {/* <TableCell>{sale.customerName || `ID: ${sale.customerID}`}</TableCell> */}
                    <TableCell>{sale.stockName || `ID: ${sale.stockID}`}</TableCell>
                    <TableCell className="text-right">${sale.details[0].linePrice.toFixed(2)}</TableCell>
                     <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleViewSale(sale)}>
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
            <DialogTitle>Create New Sale Order</DialogTitle>
            <DialogDescription>
              Fill in the details for the new sale order.
            </DialogDescription>
          </DialogHeader>
           {isCreateModalOpen && (
            <SaleOrderForm
              onSuccess={handleSaleCreated}
              onCancel={handleCloseCreateModal}
            />
          )}
        </DialogContent>
      </Dialog>

      {viewingSale && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-xl md:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sale Order: {viewingSale.code}</DialogTitle>
               <DialogDescription>
                Date: {format(new Date(viewingSale.date), 'PP')} | Stock: {viewingSale.stockName || `ID: ${viewingSale.stockID}`}
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
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingSale.details.map(detail => (
                    <TableRow key={detail.id}>
                      <TableCell>{detail.itemCode}</TableCell>
                      <TableCell>{detail.itemName || 'N/A'}</TableCell>
                      <TableCell>{detail.qty}</TableCell>
                      <TableCell className="text-right">${(detail.linePrice / detail.qty).toFixed(2)}</TableCell>
                      <TableCell className="text-right">${detail.linePrice.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-right font-bold mt-4">
                Total Price: ${viewingSale.price.toFixed(2)}
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
};