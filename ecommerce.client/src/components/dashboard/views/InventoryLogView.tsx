// ecommerce.client/src/components/dashboard/views/InventoryLogView.tsx (Now acting as Inventory Dashboard)
import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Loader2, Search, RotateCcw, PlusCircle, ScrollText, PackageSearch } from 'lucide-react';
import { toast } from 'sonner';
import { ApiErrorResponse, InventoryLogReadDto, ItemSelection } from '@/types/inventory';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { InventoryLogQueryParametersDto } from '@/types/inventory';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InventoryLogFormDialogContent } from '../forms/InventoryLogForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs
import { CurrentStockView } from './CurrentStockView'; // Import the new view

const INVENTORY_LOG_API_URL = '/api/inventorylogs';
const ITEMS_API_URL = '/api/items';

const ALL_ITEMS_VALUE = "_ALL_ITEMS_";
const ALL_TYPES_VALUE = "_ALL_TYPES_";

export const InventoryLogView: React.FC = () => { // Renaming this component might be good later
  const [logs, setLogs] = useState<InventoryLogReadDto[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);  

  const [itemsForFilter, setItemsForFilter] = useState<ItemSelection[]>([]);
  const [filterItemId, setFilterItemId] = useState<string>(ALL_ITEMS_VALUE);
  const [filterTransactionType, setFilterTransactionType] = useState<string>(ALL_TYPES_VALUE);
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>();

  const [currentLogPage, setCurrentLogPage] = useState(1);
  const [logPageSize] = useState(20);
  const [totalLogPages, setTotalLogPages] = useState(0);
  const [totalLogCount, setTotalLogCount] = useState(0);


  const fetchItemsForFilterDropdown = useCallback(async () => {
    try {
      const response = await fetch(`${ITEMS_API_URL}?includeDisabled=true`);
      if (!response.ok) throw new Error('Failed to fetch items for filter');
      setItemsForFilter(await response.json());
    } catch (err) { toast.error("Error fetching items", { description: (err as Error).message }); }
  }, []);

  const fetchLogs = useCallback(async (pageToFetch: number) => {
    setIsLoadingLogs(true);
    setLogError(null);
    const queryParams: InventoryLogQueryParametersDto = { 
      pageNumber: pageToFetch, 
      pageSize: logPageSize,
      itemID: filterItemId && filterItemId !== ALL_ITEMS_VALUE ? parseInt(filterItemId, 10) : null,
      transactionType: filterTransactionType && filterTransactionType !== ALL_TYPES_VALUE ? filterTransactionType : null,
      startDate: filterStartDate ? format(filterStartDate, 'yyyy-MM-dd') : null,
      endDate: filterEndDate ? format(filterEndDate, 'yyyy-MM-dd') : null,
    };
    
    const queryStringParams = Object.entries(queryParams)
      .filter(([, value]) => value != null && value !== '')
      .map(([key, value]) => [key, String(value)]);
    const queryString = new URLSearchParams(queryStringParams).toString();

    try {
      const response = await fetch(`${INVENTORY_LOG_API_URL}?${queryString}`);
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({ message: `Server error: ${response.status}` }));
        throw new Error(errorData.message || `Failed to fetch logs`);
      }
      const data: InventoryLogReadDto[] = await response.json();
      const resTotalCount = parseInt(response.headers.get("X-Pagination-TotalCount") || "0", 10);
      const resTotalPages = parseInt(response.headers.get("X-Pagination-TotalPages") || "0", 10);
      setLogs(pageToFetch === 1 ? data : [...logs, ...data]); // Assuming append for "Load More"
      setTotalLogCount(resTotalCount);
      setTotalLogPages(resTotalPages);
      setCurrentLogPage(pageToFetch);
    } catch (err) { 
      setLogError((err as Error).message); 
      toast.error("Error fetching logs", { description: (err as Error).message }); 
    } finally { 
      setIsLoadingLogs(false); 
    }
  }, [filterItemId, filterTransactionType, filterStartDate, filterEndDate, logPageSize, logs]); // logs removed from deps to prevent re-fetch on append for "Load More"

  useEffect(() => {
    fetchItemsForFilterDropdown();
    fetchLogs(1); // Initial fetch for logs
  }, [fetchItemsForFilterDropdown]); // fetchLogs removed, called explicitly or via filter changes

  const handleApplyLogFilters = () => { 
    setCurrentLogPage(1); // Reset to first page
    fetchLogs(1); 
  };
  const handleResetLogFilters = () => {
    setFilterItemId(ALL_ITEMS_VALUE);
    setFilterTransactionType(ALL_TYPES_VALUE);
    setFilterStartDate(undefined);
    setFilterEndDate(undefined);
    setCurrentLogPage(1);
    setTimeout(() => fetchLogs(1), 0);
  };
  const handleLoadMoreLogs = () => { if (currentLogPage < totalLogPages) fetchLogs(currentLogPage + 1); };
  
  const formatDateDisplay = (dateString: string | Date | undefined | null) => { 
    return dateString ? format(new Date(dateString), 'MMM dd, yyyy, hh:mm a') : '-';
  };

  const handleOpenLogForm = () => setIsLogFormOpen(true);
  const handleCloseLogForm = () => setIsLogFormOpen(false);

  const handleLogFormSuccess = () => {
    handleCloseLogForm();
    setCurrentLogPage(1); // Refresh logs from page 1
    fetchLogs(1); 
  };


  return (
    <Tabs defaultValue="transactionLogs" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="transactionLogs">
            <ScrollText className="mr-2 h-4 w-4"/> Transaction Logs
        </TabsTrigger>
        <TabsTrigger value="currentStock">
            <PackageSearch className="mr-2 h-4 w-4"/> Current Stock
        </TabsTrigger>
      </TabsList>

      <TabsContent value="transactionLogs">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Inventory Transaction Logs</CardTitle>
              <CardDescription>History of stock movements. Displaying {logs.length} of {totalLogCount} records.</CardDescription>
            </div>
            <Button onClick={handleOpenLogForm} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Manual Log
            </Button>
          </CardHeader>
          <CardContent>
            {/* Filter Section for Logs */}
            <div className="mb-6 p-4 border rounded-lg bg-muted/20">
              <div className="flex flex-wrap gap-x-6 gap-y-4 items-end">
                <div className="flex flex-col space-y-1 min-w-[180px] flex-grow sm:flex-grow-0"> 
                  <Label htmlFor="filter-item-log">Item</Label>
                  <Select value={filterItemId} onValueChange={setFilterItemId} disabled={isLoadingLogs}>
                    <SelectTrigger id="filter-item-log" className="w-full"> 
                      <SelectValue placeholder="All Items" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_ITEMS_VALUE}>All Items</SelectItem>
                      {itemsForFilter.map(item => (<SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-1 min-w-[180px] flex-grow sm:flex-grow-0">
                  <Label htmlFor="filter-type-log">Transaction Type</Label>
                  <Select value={filterTransactionType} onValueChange={setFilterTransactionType} disabled={isLoadingLogs}>
                    <SelectTrigger id="filter-type-log" className="w-full">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_TYPES_VALUE}>All Types</SelectItem>
                      <SelectItem value="Stock Adjustment In">Adjustment In</SelectItem>
                      <SelectItem value="Stock Adjustment Out">Adjustment Out</SelectItem>
                      <SelectItem value="Initial Stock">Initial Stock</SelectItem>
                      <SelectItem value="Purchase">Purchase</SelectItem>
                      <SelectItem value="Sale">Sale</SelectItem>
                      {/* Add other types as needed */}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-1 min-w-[160px] flex-grow sm:flex-grow-0">
                  <Label htmlFor="filter-start-date-log">Start Date</Label>
                  <DatePicker date={filterStartDate} setDate={setFilterStartDate} className="w-full" disabled={isLoadingLogs}/>
                </div>
                <div className="flex flex-col space-y-1 min-w-[160px] flex-grow sm:flex-grow-0">
                  <Label htmlFor="filter-end-date-log">End Date</Label>
                  <DatePicker date={filterEndDate} setDate={setFilterEndDate} className="w-full" disabled={isLoadingLogs}/>
                </div>
                <div className="flex space-x-2 pt-5"> 
                  <Button onClick={handleApplyLogFilters} disabled={isLoadingLogs} size="sm"> 
                    <Search className="mr-2 h-4 w-4" /> Apply
                  </Button>
                  <Button variant="outline" onClick={handleResetLogFilters} disabled={isLoadingLogs} size="sm">
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                  </Button>
                </div>
              </div>
            </div>

            {logError && <p className="text-red-500 mb-4 text-center">Error: {logError}</p>}
            <Table>
              <TableCaption>{isLoadingLogs && logs.length === 0 ? "Loading logs..." : (logs.length === 0 ? "No logs found." : `Page ${currentLogPage} of ${totalLogPages}.`)}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Timestamp</TableHead>
                  <TableHead>Item</TableHead><TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Qty (Base)</TableHead>
                  <TableHead>Pack Code</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Transacted Price</TableHead>
                  <TableHead>Total Transaction</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                  {isLoadingLogs && logs.length === 0 && (<TableRow><TableCell colSpan={8} className="text-center h-24"><Loader2 className="h-6 w-6 animate-spin inline" /></TableCell></TableRow>)}
                  {!isLoadingLogs && logs.length === 0 && (<TableRow><TableCell colSpan={8} className="text-center h-24 text-muted-foreground">No inventory logs found.</TableCell></TableRow>)}
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
                      <TableCell>$ {log.costPricePerBaseUnit ? log.costPricePerBaseUnit.toFixed(2) : log.salePricePerTransactedUnit}</TableCell>
                      <TableCell>$ {log.costPricePerBaseUnit ? (log.costPricePerBaseUnit * log.quantityInBaseUnits).toFixed(2) : ((log.salePricePerTransactedUnit ?? 0) * log.quantityInBaseUnits).toFixed(2)}</TableCell>
                  </TableRow>
                  ))}
              </TableBody>
            </Table>
            {currentLogPage < totalLogPages && !isLoadingLogs && (
              <div className="mt-6 flex justify-center">
                <Button onClick={handleLoadMoreLogs} variant="outline" disabled={isLoadingLogs}>
                  {isLoadingLogs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Load More Logs"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="currentStock">
        <CurrentStockView />
      </TabsContent>

      {/* Dialog for the InventoryLogForm (Manual Entry) */}
      <Dialog open={isLogFormOpen} onOpenChange={setIsLogFormOpen}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl"> 
          <DialogHeader>
            <DialogTitle>Add Manual Inventory Log</DialogTitle>
            <DialogDescription>
              Record a new inventory transaction manually.
            </DialogDescription>
          </DialogHeader>
          {isLogFormOpen && 
            <InventoryLogFormDialogContent
              onFormSubmitSuccess={handleLogFormSuccess}
              onCancel={handleCloseLogForm}
            />
          }
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};