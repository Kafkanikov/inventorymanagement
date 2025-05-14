// src/components/dashboard/views/InventoryLogView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// import { DatePicker } from '@/components/ui/date-picker'; // Assuming you have or will create a DatePicker component
import { Loader2, Search, RotateCcw, PlusCircle } from 'lucide-react'; // Added PlusCircle
import { toast } from 'sonner';
import { ApiErrorResponse, InventoryLogReadDto, ItemSelection } from '@/types/inventory';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { InventoryLogQueryParametersDto } from '@/types/inventory';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InventoryLogFormDialogContent } from '../forms/InventoryLogForm';

const INVENTORY_LOG_API_URL = '/api/inventorylogs';
const ITEMS_API_URL = '/api/items';

// Basic DatePicker placeholder if you don't have one from shadcn/ui yet
const SimpleDatePicker: React.FC<{ selected?: Date; onSelect: (date?: Date) => void; className?: string }> = ({ selected, onSelect, className }) => {
  return (
    <Input
      type="date"
      className={className}
      value={selected ? format(selected, 'yyyy-MM-dd') : ''}
      onChange={(e) => onSelect(e.target.value ? new Date(e.target.value) : undefined)}
    />
  );
};

const ALL_ITEMS_VALUE = "_ALL_ITEMS_";
const ALL_TYPES_VALUE = "_ALL_TYPES_";

export const InventoryLogView: React.FC = () => {
  const [logs, setLogs] = useState<InventoryLogReadDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);  

  const [itemsForFilter, setItemsForFilter] = useState<ItemSelection[]>([]);
  const [filterItemId, setFilterItemId] = useState<string>(ALL_ITEMS_VALUE);
  const [filterTransactionType, setFilterTransactionType] = useState<string>(ALL_TYPES_VALUE);
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);


  const fetchItemsForFilterDropdown = useCallback(async () => {
    try {
      const response = await fetch(`${ITEMS_API_URL}?includeDisabled=true`);
      if (!response.ok) throw new Error('Failed to fetch items');
      setItemsForFilter(await response.json());
    } catch (err) { toast.error("Error fetching items", { description: (err as Error).message }); }
  }, []);

  const fetchLogs = useCallback(async (pageToFetch: number) => {
    setIsLoading(true);
    setError(null);
    const queryParams: InventoryLogQueryParametersDto = { pageNumber: pageToFetch, pageSize };
    if (filterItemId && filterItemId !== ALL_ITEMS_VALUE) queryParams.itemID = parseInt(filterItemId, 10);
    if (filterTransactionType && filterTransactionType !== ALL_TYPES_VALUE) queryParams.transactionType = filterTransactionType;
    if (filterStartDate) queryParams.startDate = format(filterStartDate, 'yyyy-MM-dd');
    if (filterEndDate) queryParams.endDate = format(filterEndDate, 'yyyy-MM-dd');
    const queryString = new URLSearchParams(Object.entries(queryParams).filter(([, value]) => value != null).map(([key, value]) => [key, String(value)])).toString();

    try {
      const response = await fetch(`${INVENTORY_LOG_API_URL}?${queryString}`);
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({ message: `Server error: ${response.status}` }));
        throw new Error(errorData.message || `Failed to fetch logs`);
      }
      const data: InventoryLogReadDto[] = await response.json();
      const resTotalCount = parseInt(response.headers.get("X-Pagination-TotalCount") || "0", 10);
      const resTotalPages = parseInt(response.headers.get("X-Pagination-TotalPages") || "0", 10);
      setLogs(pageToFetch === 1 ? data : [...logs, ...data]);
      setTotalCount(resTotalCount);
      setTotalPages(resTotalPages);
      setCurrentPage(pageToFetch);
    } catch (err) { setError((err as Error).message); toast.error("Error fetching logs", { description: (err as Error).message }); }
    finally { setIsLoading(false); }
  }, [filterItemId, filterTransactionType, filterStartDate, filterEndDate, pageSize, logs]);

 useEffect(() => {
    fetchItemsForFilterDropdown();
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleApplyFilters = () => { fetchLogs(1); };
  const handleResetFilters = () => {
    setFilterItemId(ALL_ITEMS_VALUE);
    setFilterTransactionType(ALL_TYPES_VALUE);
    setFilterStartDate(undefined);
    setFilterEndDate(undefined);
    setTimeout(() => fetchLogs(1), 0);
  };
  const handleLoadMore = () => { if (currentPage < totalPages) fetchLogs(currentPage + 1); };
  const formatDateDisplay = (dateString: string | Date | undefined | null) => { /* ... */ return dateString ? format(new Date(dateString), 'MMM dd, yyyy, hh:mm a') : '-';};

  const handleOpenLogForm = () => setIsLogFormOpen(true);
  const handleCloseLogForm = () => setIsLogFormOpen(false);

  const handleLogFormSuccess = () => {
    handleCloseLogForm();
    fetchLogs(1); // Refresh logs from page 1 after successful submission
  };


  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Inventory Transaction Logs</CardTitle>
            <CardDescription>History of stock movements. Displaying {logs.length} of {totalCount} records.</CardDescription>
          </div>
          <Button onClick={handleOpenLogForm} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Manual Log
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filter Section (remains the same) */}
          <div className="mb-6 p-4 border rounded-lg bg-muted/20">
            <div className="flex flex-wrap gap-x-6 gap-y-4 items-end">
              <div className="flex flex-col space-y-1 min-w-[180px] flex-grow sm:flex-grow-0"> {/* min-w for consistent sizing, flex-grow for responsiveness */}
                <Label htmlFor="filter-item">Item</Label>
                <Select value={filterItemId} onValueChange={setFilterItemId}>
                  <SelectTrigger id="filter-item" className="w-full"> {/* Ensure trigger takes available width */}
                    <SelectValue placeholder="All Items" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_ITEMS_VALUE}>All Items</SelectItem>
                    {itemsForFilter.map(item => (<SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col space-y-1 min-w-[180px] flex-grow sm:flex-grow-0">
                <Label htmlFor="filter-type">Transaction Type</Label>
                <Select value={filterTransactionType} onValueChange={setFilterTransactionType}>
                  <SelectTrigger id="filter-type" className="w-full">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_TYPES_VALUE}>All Types</SelectItem>
                    <SelectItem value="Stock Adjustment In">Adjustment In</SelectItem>
                    <SelectItem value="Stock Adjustment Out">Adjustment Out</SelectItem>
                    <SelectItem value="Initial Stock">Initial Stock</SelectItem>
                    <SelectItem value="Purchase">Purchase</SelectItem>
                    <SelectItem value="Sale">Sale</SelectItem>
                    <SelectItem value="Transfer In">Transfer In</SelectItem>
                    <SelectItem value="Transfer Out">Transfer Out</SelectItem>
                    <SelectItem value="Customer Return">Return From Customer</SelectItem>
                    <SelectItem value="Vendor Return">Return To Supplier</SelectItem>
                    <SelectItem value="Damaged">Damaged</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col space-y-1 min-w-[160px] flex-grow sm:flex-grow-0">
                <Label htmlFor="filter-start-date">Start Date</Label>
                <SimpleDatePicker selected={filterStartDate} onSelect={setFilterStartDate} className="w-full" />
              </div>

              <div className="flex flex-col space-y-1 min-w-[160px] flex-grow sm:flex-grow-0">
                <Label htmlFor="filter-end-date">End Date</Label>
                <SimpleDatePicker selected={filterEndDate} onSelect={setFilterEndDate} className="w-full" />
              </div>

              {/* Buttons group, aligned to the end of the flex container or wraps */}
              <div className="flex space-x-2 pt-5"> {/* pt-5 to align baseline with inputs roughly */}
                <Button onClick={handleApplyFilters} disabled={isLoading} size="sm"> {/* Using sm size for buttons in filter bar */}
                  <Search className="mr-2 h-4 w-4" /> Apply
                </Button>
                <Button variant="outline" onClick={handleResetFilters} disabled={isLoading} size="sm">
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Table Section */}

          {error && <p className="text-red-500 mb-4">Error: {error}</p>}
          <Table>
            {/* Table structure remains the same */}
            <TableCaption>{isLoading && logs.length === 0 ? "Loading..." : (logs.length === 0 ? "No logs found." : `Page ${currentPage} of ${totalPages}.`)}</TableCaption>
            <TableHeader><TableRow><TableHead className="w-[200px]">Timestamp</TableHead><TableHead>Item</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Qty</TableHead><TableHead>Unit</TableHead><TableHead className="text-right">Qty (Base)</TableHead><TableHead>Pack Code</TableHead><TableHead>User</TableHead></TableRow></TableHeader>
            <TableBody>
                {isLoading && logs.length === 0 && (<TableRow><TableCell colSpan={8} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin inline" /></TableCell></TableRow>)}
                {!isLoading && logs.length === 0 && (<TableRow><TableCell colSpan={8} className="text-center h-24 text-muted-foreground">No inventory logs found.</TableCell></TableRow>)}
                {logs.map((log) => (
                <TableRow key={log.logID}>
                    <TableCell className="font-medium whitespace-nowrap">{formatDateDisplay(log.timestamp)}</TableCell>
                    <TableCell>{log.itemName} (ID: {log.itemID})</TableCell>
                    <TableCell>{log.transactionType}</TableCell>
                    <TableCell className="text-right">{log.quantityTransacted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}</TableCell>
                    <TableCell>{log.transactedUnitName}</TableCell>
                    <TableCell className="text-right">{log.quantityInBaseUnits}</TableCell>
                    <TableCell>{log.itemDetailCode || '-'}</TableCell>
                    <TableCell>{log.username}</TableCell>
                </TableRow>
                ))}
            </TableBody>
          </Table>
          {currentPage < totalPages && !isLoading && (
            <div className="mt-6 flex justify-center">
              <Button onClick={handleLoadMore} variant="outline" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Load More"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for the InventoryLogForm */}
      <Dialog open={isLogFormOpen} onOpenChange={setIsLogFormOpen}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl"> {/* Adjust width as needed */}
          <DialogHeader>
            <DialogTitle>Add Manual Inventory Log</DialogTitle>
            <DialogDescription>
              Record a new inventory transaction manually.
            </DialogDescription>
          </DialogHeader>
          {/* Render the form content component here */}
          {isLogFormOpen && /* Conditionally render to reset form state on open if needed, or manage reset within form */
            <InventoryLogFormDialogContent
              onFormSubmitSuccess={handleLogFormSuccess}
              onCancel={handleCloseLogForm}
            />
          }
          {/* DialogFooter is not strictly needed if the form has its own submit/cancel buttons */}
        </DialogContent>
      </Dialog>
    </>
  );
};