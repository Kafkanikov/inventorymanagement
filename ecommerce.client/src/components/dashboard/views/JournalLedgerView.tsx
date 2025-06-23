import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Loader2, Search, RotateCcw, ChevronDown, ChevronRight, AlertCircle, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { JournalPageData, JournalLedgerQueryParameters } from '@/types/financial'; // Using updated DTOs
import { ApiErrorResponse, UserSelection } from '@/types/inventory'; // For error and base query params
import { format, parseISO, isValid } from 'date-fns';
import { formatDateForDisplay } from '@/lib/utils'; // Assuming these exist
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JournalPageForm } from '../forms/JournalPageForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const API_URL = '/api/journal';
const USERS_API_URL = '/api/users'; 

export const JournalLedgerView: React.FC = () => {
  const initialEndDate = new Date();
  const initialStartDate = new Date(initialEndDate.getFullYear(), initialEndDate.getMonth(), 1);
  const [isCreatePageModalOpen, setIsCreatePageModalOpen] = useState(false); 

  const [journalPages, setJournalPages] = useState<JournalPageData[]>([]);
  const [queryParams, setQueryParams] = useState<JournalLedgerQueryParameters>({
    pageNumber: 1,
    pageSize: 15,
    startDate: format(initialStartDate, "yyyy-MM-dd"), // Default to start of current month
    endDate: format(initialEndDate, "yyyy-MM-dd"),   // Default to today
    refContains: '',
    sourceContains: '',
    descriptionContains: '',
    userId: undefined, // Or user?.id if you want to default to current user
    includeDisabledPages: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedPageIds, setExpandedPageIds] = useState<Set<number>>(new Set());
  const [availableUsers, setAvailableUsers] = useState<UserSelection[]>([]); 

  const handleOpenCreatePageModal = () => setIsCreatePageModalOpen(true);
  const handleCloseCreatePageModal = () => setIsCreatePageModalOpen(false);
  const handleJournalPageCreated = () => {
      handleCloseCreatePageModal();
      fetchJournalLedger(1); // Refresh the ledger view from page 1
  };
  const handleQueryParamChange = (field: keyof JournalLedgerQueryParameters, value: string | number | boolean | Date | null | undefined) => {
    let processedValue = value;
    if ((field === 'startDate' || field === 'endDate') && value instanceof Date && isValid(value)) {
      processedValue = format(value, "yyyy-MM-dd");
    } else if ((field === 'startDate' || field === 'endDate') && value === null) {
      processedValue = null; 
    }
    setQueryParams(prev => ({ ...prev, [field]: processedValue }));
  };

  const fetchUsersForFilter = useCallback(async () => {
    try {
      // Fetch only non-disabled users by default, or adjust API if needed
      const response = await fetch(`${USERS_API_URL}?includeDisabled=false`); 
      if (!response.ok) {
        throw new Error('Failed to fetch users for filter');
      }
      const usersData: UserSelection[] = await response.json();
      setAvailableUsers(usersData);
    } catch (err) { 
      toast.error("Error fetching users", { description: (err as Error).message });
      console.error("Fetch Users Error:", err);
    }
  }, []);
  useEffect(() => {
    fetchUsersForFilter(); 
  }, [fetchUsersForFilter]);
  
  const fetchJournalLedger = useCallback(async (page = queryParams.pageNumber) => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.append('pageNumber', String(page));
    params.append('pageSize', String(queryParams.pageSize));
    if (queryParams.startDate && isValid(parseISO(queryParams.startDate))) params.append('startDate', queryParams.startDate);
    if (queryParams.endDate && isValid(parseISO(queryParams.endDate))) params.append('endDate', queryParams.endDate);
    if (queryParams.refContains) params.append('refContains', queryParams.refContains);
    if (queryParams.sourceContains) params.append('sourceContains', queryParams.sourceContains);
    if (queryParams.descriptionContains) params.append('descriptionContains', queryParams.descriptionContains);
    if (queryParams.userId !== null && queryParams.userId !== undefined) params.append('userId', String(queryParams.userId));
    if (queryParams.includeDisabledPages) params.append('includeDisabledPages', String(queryParams.includeDisabledPages));

    try {
      const response = await fetch(`${API_URL}?${params.toString()}`);
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({ message: `Server error: ${response.status}` }));
        throw new Error(errorData.message || `Failed to fetch journal ledger: ${response.statusText}`);
      }
      const data: JournalPageData[] = await response.json();
      setJournalPages(data);

      setExpandedPageIds(new Set(data.map(p => p.id))); 

      setTotalCount(parseInt(response.headers.get("X-Pagination-TotalCount") || "0", 10));
      setTotalPages(parseInt(response.headers.get("X-Pagination-TotalPages") || "0", 10));
      setQueryParams(prev => ({ ...prev, pageNumber: page }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      toast.error("Error Fetching Ledger", { description: errorMessage });
      console.error("Fetch Ledger Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchJournalLedger(1); 
  }, []); 

  const handleApplyFilters = () => {
    fetchJournalLedger(1); 
  };

  const handleResetFilters = () => {
    const defaultEndDate = new Date();
    const defaultStartDate = new Date(defaultEndDate.getFullYear(), defaultEndDate.getMonth(), 1);
    setQueryParams({
      pageNumber: 1,
      pageSize: 15,
      startDate: format(defaultStartDate, "yyyy-MM-dd"),
      endDate: format(defaultEndDate, "yyyy-MM-dd"),
      refContains: '',
      sourceContains: '',
      descriptionContains: '',
      userId: undefined,
      includeDisabledPages: false,
    });
     setTimeout(() => fetchJournalLedger(1), 0);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchJournalLedger(newPage);
    }
  };

  const togglePageDetails = (pageId: number) => {
    setExpandedPageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageId)) newSet.delete(pageId);
      else newSet.add(pageId);
      return newSet;
    });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Journal Ledger</CardTitle>
          <CardDescription>View and filter journal entries.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end p-4 border rounded-lg bg-muted/20">
            <div className='gap-1 flex flex-col'>
              <Label htmlFor="jlStartDate">Start Date</Label>
              <DatePicker date={queryParams.startDate ? parseISO(queryParams.startDate) : undefined} setDate={(date) => handleQueryParamChange('startDate', date)} id="jlStartDate" />
            </div>
            <div className='gap-1 flex flex-col'>
              <Label htmlFor="jlEndDate">End Date</Label>
              <DatePicker date={queryParams.endDate ? parseISO(queryParams.endDate) : undefined} setDate={(date) => handleQueryParamChange('endDate', date)} id="jlEndDate" />
            </div>
            <div className='gap-1 flex flex-col'>
              <Label htmlFor="jlRefContains">Ref. Contains</Label>
              <Input id="jlRefContains" value={queryParams.refContains || ''} onChange={(e) => handleQueryParamChange('refContains', e.target.value)} />
            </div>
            <div className='gap-1 flex flex-col'>
              <Label htmlFor="jlSourceContains">Source Contains</Label>
              <Input id="jlSourceContains" value={queryParams.sourceContains || ''} onChange={(e) => handleQueryParamChange('sourceContains', e.target.value)} />
            </div>
            <div className='gap-1 flex flex-col'>
              <Label htmlFor="jlDescContains">Desc. Contains</Label>
              <Input id="jlDescContains" value={queryParams.descriptionContains || ''} onChange={(e) => handleQueryParamChange('descriptionContains', e.target.value)} />
            </div>
            <div className='gap-1 flex flex-col'> 
              <Label htmlFor="jlUserId">User</Label>
              <Select
                value={queryParams.userId?.toString() || "ALL_USERS"}
                onValueChange={(value) => handleQueryParamChange('userId', value === "ALL_USERS" ? undefined : parseInt(value, 10))}
                disabled={availableUsers.length === 0}
              >
                <SelectTrigger id="jlUserId">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL_USERS">All Users</SelectItem>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* <div className="flex items-center space-x-2 pt-5">
              <Checkbox id="jlIncludeDisabled" checked={queryParams.includeDisabledPages} onCheckedChange={(checked) => handleQueryParamChange('includeDisabledPages', !!checked)} />
              <Label htmlFor="jlIncludeDisabled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Include Disab led
              </Label>
            </div> */}
            <div>

            </div>
            <div className="flex flex-wrap md:flex-nowrap gap-2 pt-5 lg:col-span-1 justify-self-end self-end">
            <Button onClick={handleApplyFilters} disabled={isLoading} size="sm">
                <Search className="mr-2 h-4 w-4" /> Apply
            </Button>
            <Button variant="outline" onClick={handleResetFilters} disabled={isLoading} size="sm">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button onClick={handleOpenCreatePageModal} size="sm"> {/* New button */}
              <PlusCircle className="mr-2 h-4 w-4" /> Create Journal Page
            </Button>
        </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex flex-col justify-center items-center py-10 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
          <p className="text-lg text-muted-foreground">Loading journal entries...</p>
        </div>
      )}
      {error && !isLoading && (
        <Card className="border-destructive bg-red-50 dark:bg-red-900/20">
          <CardHeader className="flex flex-row items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Ledger</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive-foreground">{error}</p>
            <Button onClick={handleApplyFilters} variant="outline" className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Journal Pages ({totalCount} found)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>
                {journalPages.length === 0 ? "No journal pages found for the selected criteria." : `Page ${queryParams.pageNumber} of ${totalPages}.`}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead> 
                  <TableHead>Date</TableHead>
                  <TableHead>Page ID</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Total Debits</TableHead>
                  <TableHead className="text-right">Total Credits</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journalPages.map((page) => (
                  <React.Fragment key={page.id}>
                    <TableRow className={`hover:bg-muted/50 ${page.disabled ? 'opacity-60 bg-red-50 dark:bg-red-900/10' : ''}`}>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => togglePageDetails(page.id)} className="h-8 w-8">
                            {expandedPageIds.has(page.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{formatDateForDisplay(page.createdAt)}</TableCell>
                      <TableCell className="text-xs">{page.id}</TableCell>
                      <TableCell className="text-xs">{page.ref || '-'}</TableCell>
                      <TableCell className="text-xs">{page.source}</TableCell>
                      <TableCell className="text-xs max-w-xs truncate" title={page.description ?? undefined}>{page.description || '-'}</TableCell>
                      <TableCell className="text-xs">{page.username || (page.userId ? `ID: ${page.userId}`: '-')}</TableCell>
                      <TableCell className="text-right text-xs">{page.totalDebits}</TableCell>
                      <TableCell className="text-right text-xs">{page.totalCredits}</TableCell>
                      <TableCell className="text-xs">{page.disabled ? "Disabled" : (page.isBalanced ? "Balanced" : "Unbalanced")}</TableCell>
                    </TableRow>
                    {expandedPageIds.has(page.id) && (
                      <TableRow className={`bg-muted/10 dark:bg-muted/5 ${page.disabled ? 'opacity-60' : ''}`}>
                        <TableCell colSpan={10} className="p-0">
                          <div className="p-3 ml-10 border-l-2 border-primary/20">
                            <h5 className="text-xs font-semibold mb-1 text-muted-foreground">Journal Post:</h5>
                            {page.journalEntries.length > 0 ? (
                              <Table className="text-xs">
                                <TableHeader>
                                  <TableRow className="text-xs">
                                    <TableHead>Account #</TableHead>
                                    <TableHead>Account Name</TableHead>
                                    <TableHead>Entry Ref</TableHead>
                                    <TableHead>Entry Desc.</TableHead>
                                    <TableHead className="text-right">Debit</TableHead>
                                    <TableHead className="text-right">Credit</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {page.journalEntries.map(entry => (
                                    <TableRow key={entry.id} className="text-xs">
                                      <TableCell>{entry.accountNumber}</TableCell>
                                      <TableCell>{entry.accountName}</TableCell>
                                      <TableCell>{entry.ref || '-'}</TableCell>
                                      <TableCell className="max-w-[200px] truncate" title={entry.description ?? undefined}>{entry.description || '-'}</TableCell>
                                      <TableCell className="text-right">{entry.debit !== 0 ? entry.debit : '-'}</TableCell>
                                      <TableCell className="text-right">{entry.credit !== 0 ? entry.credit : '-'}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <p className="text-xs text-muted-foreground text-center py-2">No entries for this page.</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <Button variant="outline" size="sm" onClick={() => handlePageChange(queryParams.pageNumber! - 1)} disabled={queryParams.pageNumber! <= 1 || isLoading}>Previous</Button>
                <span>Page {queryParams.pageNumber} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => handlePageChange(queryParams.pageNumber! + 1)} disabled={queryParams.pageNumber! >= totalPages || isLoading}>Next</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <Dialog open={isCreatePageModalOpen} onOpenChange={setIsCreatePageModalOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New Journal Page</DialogTitle>
            <DialogDescription>
              Fill in the details for the new journal page and its entries. Debits must equal credits.
            </DialogDescription>
          </DialogHeader>
          {isCreatePageModalOpen && ( 
            <JournalPageForm
              onSuccess={handleJournalPageCreated}
              onCancel={handleCloseCreatePageModal}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
