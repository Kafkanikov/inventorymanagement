// ecommerce.client/src/components/dashboard/views/CurrentStockView.tsx
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
import { Loader2, Search, RotateCcw, ChevronDown, ChevronRight, PackageSearch } from 'lucide-react';
import { toast } from 'sonner';
import { ItemStockReadDto, ItemStockUnitDetailDto, StockQueryParameters, Category, ApiErrorResponse } from '@/types/inventory';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

const STOCK_QUERY_API_URL = '/api/stocklevels'; // Endpoint for GetAllItemsStockDetailsAsync
const CATEGORIES_API_URL = '/api/categories';

export const CurrentStockView: React.FC = () => {
  const [itemsStock, setItemsStock] = useState<ItemStockReadDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [categoriesForFilter, setCategoriesForFilter] = useState<Category[]>([]);
  const [filterItemName, setFilterItemName] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>(''); // Use string for "All" option

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15); // Or make it configurable
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [expandedItemIds, setExpandedItemIds] = useState<Set<number>>(new Set());

  const fetchCategoriesForFilter = useCallback(async () => {
    try {
      const response = await fetch(`${CATEGORIES_API_URL}?includeDisabled=false`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      setCategoriesForFilter(await response.json());
    } catch (err) {
      toast.error("Error fetching categories", { description: (err as Error).message });
    }
  }, []);
  
  const fetchItemsStock = useCallback(async (pageToFetch: number) => {
    setIsLoading(true);
    setError(null);
    const queryParams: StockQueryParameters = { 
      pageNumber: pageToFetch, 
      pageSize,
      nameFilter: filterItemName || null,
      categoryID: filterCategoryId && filterCategoryId !== "_ALL_CATEGORIES_" ? parseInt(filterCategoryId, 10) : null,
    };
    
    const queryStringParams = Object.entries(queryParams)
      .filter(([, value]) => value != null && value !== '')
      .map(([key, value]) => [key, String(value)]);
    const queryString = new URLSearchParams(queryStringParams).toString();

    try {
      const response = await fetch(`${STOCK_QUERY_API_URL}?${queryString}`);
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({ message: `Server error: ${response.status}` }));
        throw new Error(errorData.message || `Failed to fetch stock details`);
      }
      const data: ItemStockReadDto[] = await response.json();
      const resTotalCount = parseInt(response.headers.get("X-Pagination-TotalCount") || "0", 10);
      const resTotalPages = parseInt(response.headers.get("X-Pagination-TotalPages") || "0", 10);
      
      setItemsStock(data); // For paginated view, replace data, don't append
      setTotalCount(resTotalCount);
      setTotalPages(resTotalPages);
      setCurrentPage(pageToFetch);
    } catch (err) {
      setError((err as Error).message);
      toast.error("Error Fetching Stock Details", { description: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [filterItemName, filterCategoryId, pageSize]);

  useEffect(() => {
    fetchCategoriesForFilter();
    fetchItemsStock(1);
  }, [fetchCategoriesForFilter, fetchItemsStock]); // fetchItemsStock will be stable due to useCallback

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchItemsStock(1);
  };

  const handleResetFilters = () => {
    setFilterItemName('');
    setFilterCategoryId('');
    setCurrentPage(1);
    // fetchItemsStock(1) will be called by useEffect due to state change if fetchItemsStock is not memoized properly
    // Or call it explicitly if needed after states are set
    setTimeout(() => fetchItemsStock(1), 0); 
  };

  const toggleItemDetails = (itemId: number) => {
    setExpandedItemIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
        // Data for sub-rows (AvailableUnitsStock) is already part of ItemStockReadDto
      }
      return newSet;
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchItemsStock(newPage);
    }
  };
  
  const formatNumber = (num: number | null | undefined) => {
    if (num == null) return '-';
    // Show decimals if it's not a whole number
    return Number.isInteger(num) ? num.toLocaleString() : num.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2});
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="flex items-center"><PackageSearch className="mr-2 h-6 w-6"/>Current Item Stock Levels</CardTitle>
            {/* Add any actions here if needed, like a "Refresh" button */}
        </div>
        <CardDescription>View current stock quantities for items in their base and available packaging units.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filter Section */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/20">
          <div className="flex flex-wrap gap-x-6 gap-y-4 items-end">
            <div className="flex flex-col space-y-1 min-w-[200px] flex-grow sm:flex-grow-0">
              <Label htmlFor="filter-item-name-stock">Item Name</Label>
              <Input
                id="filter-item-name-stock"
                placeholder="Search by item name..."
                value={filterItemName}
                onChange={(e) => setFilterItemName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col space-y-1 min-w-[180px] flex-grow sm:flex-grow-0">
              <Label htmlFor="filter-category-stock">Category</Label>
              <Select value={filterCategoryId} onValueChange={setFilterCategoryId} disabled={isLoading || categoriesForFilter.length === 0}>
                <SelectTrigger id="filter-category-stock" className="w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_ALL_CATEGORIES_">All Categories</SelectItem>
                  {categoriesForFilter.map(cat => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2 pt-5">
              <Button onClick={handleApplyFilters} disabled={isLoading} size="sm">
                <Search className="mr-2 h-4 w-4" /> Apply Filters
              </Button>
              <Button variant="outline" onClick={handleResetFilters} disabled={isLoading} size="sm">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 mb-4 text-center">Error: {error}</p>}
        {isLoading && itemsStock.length === 0 && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading stock details...</p>
          </div>
        )}
        {!isLoading && itemsStock.length === 0 && (
          <p className="text-center text-muted-foreground py-10">No items found matching your criteria.</p>
        )}

        {!isLoading && itemsStock.length > 0 && (
          <>
            <Table>
              <TableCaption>
                Displaying {itemsStock.length} of {totalCount} items. Page {currentPage} of {totalPages}.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead> {/* Expand icon */}
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-right">Stock (Base Units)</TableHead>
                  <TableHead>Base Unit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsStock.map((item) => (
                  <React.Fragment key={item.itemID}>
                    <TableRow className={item.itemDisabled ? "opacity-60 bg-muted/30 hover:bg-muted/40" : "hover:bg-muted/50"}>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => toggleItemDetails(item.itemID)} className="h-8 w-8">
                          {expandedItemIds.has(item.itemID) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell className="text-right font-semibold">{formatNumber(item.quantityOnHandInBaseUnits)}</TableCell>
                      <TableCell>{item.baseUnitName}</TableCell>
                      <TableCell>
                        {item.itemDisabled ? (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">Disabled</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedItemIds.has(item.itemID) && (
                      <TableRow className="bg-muted/10 dark:bg-muted/5">
                        <TableCell colSpan={5} className="p-0">
                          <div className="p-4 ml-10 border-l-2 border-primary/20">
                            <h5 className="text-sm font-semibold mb-2 text-muted-foreground">Available Packaging Units:</h5>
                            {item.availableUnitsStock.length > 0 ? (
                              <Table>
                                <TableHeader>
                                  <TableRow className="text-xs">
                                    <TableHead>Unit Name</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead className="text-right">Stock (This Unit)</TableHead>
                                    <TableHead className="text-right">Base Units / This Unit</TableHead>
                                    <TableHead className="text-right">Selling Price</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {item.availableUnitsStock.map(unitDetail => (
                                    <TableRow key={unitDetail.unitID} className={`text-xs ${unitDetail.isBaseUnit ? 'font-medium bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                                      <TableCell>{unitDetail.unitName} {unitDetail.isBaseUnit && "(Base)"}</TableCell>
                                      <TableCell>{unitDetail.itemDetailCode}</TableCell>
                                      <TableCell className="text-right font-semibold">{formatNumber(unitDetail.quantityOnHandInThisUnit)}</TableCell>
                                      <TableCell className="text-right">{unitDetail.conversionFactorToBase.toLocaleString()}</TableCell>
                                      <TableCell className="text-right">
                                        {unitDetail.sellingPriceForThisUnit != null ? `$${unitDetail.sellingPriceForThisUnit.toFixed(2)}` : '-'}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <p className="text-xs text-muted-foreground text-center py-2">No defined packaging units (other than base unit if applicable).</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                >
                  Previous
                </Button>
                <span>Page {currentPage} of {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isLoading}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};