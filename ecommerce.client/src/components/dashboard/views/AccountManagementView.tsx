// src/components/dashboard/views/AccountManagementView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, PlusCircle, Edit, Trash2, Eye, RotateCcw, Search } from 'lucide-react';
import {
  AccountRead, AccountWrite, AccountWithJournalEntries,
  AccountCategorySelection, AccountSubCategorySelection, 
  AccountJournalEntryQueryParameters
} from '@/types/financial'; 
import { ApiErrorResponse } from '@/types/inventory';
import { formatCurrency } from '@/lib/utils';
import { DatePicker } from '@/components/ui/date-picker';
import { format, parseISO, isValid } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';

const ACCOUNTS_API_URL = '/api/accounts';

const NONE_SELECT_VALUE = "_NONE_";
const ALL_FILTER_VALUE = "_ALL_";
const ADD_NEW_CATEGORY_VALUE = "_ADD_NEW_CATEGORY_";
const ADD_NEW_SUBCATEGORY_VALUE = "_ADD_NEW_SUBCATEGORY_";


export const AccountManagementView: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountRead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountRead | null>(null);
  const [formData, setFormData] = useState<Partial<AccountWrite>>({});

  const [categories, setCategories] = useState<AccountCategorySelection[]>([]);
  const [subCategories, setSubCategories] = useState<AccountSubCategorySelection[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<AccountRead | null>(null);

  // For viewing journal entries
  const [viewingAccountDetails, setViewingAccountDetails] = useState<AccountWithJournalEntries | null>(null);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [journalQuery, setJournalQuery] = useState<AccountJournalEntryQueryParameters>({ pageNumber: 1, pageSize: 10 });
  const [isLoadingJournals, setIsLoadingJournals] = useState(false);

  // Filters
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState(ALL_FILTER_VALUE);
  const [filterSubCategory, setFilterSubCategory] = useState(ALL_FILTER_VALUE);
  const [filterIncludeDisabled, setFilterIncludeDisabled] = useState(false);

  //Category modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({ name: '' });
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  //SubCategory modal
  const [isSubCategoryModalOpen, setIsSubCategoryModalOpen] = useState(false);
  const [newSubCategoryData, setNewSubCategoryData] = useState({ name: '', code: '' });
  const [isSubmittingSubCategory, setIsSubmittingSubCategory] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    let url = `${ACCOUNTS_API_URL}?includeDisabled=${filterIncludeDisabled}`;
    if (filterName) url += `&nameFilter=${encodeURIComponent(filterName)}`;
    if (filterCategory !== ALL_FILTER_VALUE) url += `&categoryFilter=${filterCategory}`;
    if (filterSubCategory !== ALL_FILTER_VALUE) url += `&subCategoryFilter=${filterSubCategory}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const data: AccountRead[] = await response.json();
      setAccounts(data);
    } catch (err) {
      toast.error("Error fetching accounts", { description: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [filterIncludeDisabled, filterName, filterCategory, filterSubCategory]);


  const fetchDropdownData = useCallback(async () => {
    try {
      const [catRes, subCatRes] = await Promise.all([
        fetch(`${ACCOUNTS_API_URL}/categories`),
        fetch(`${ACCOUNTS_API_URL}/subcategories`),
      ]);
      if (!catRes.ok) throw new Error('Failed to fetch account categories');
      if (!subCatRes.ok) throw new Error('Failed to fetch account subcategories');
      setCategories(await catRes.json());
      setSubCategories(await subCatRes.json());
    } catch (err) {
      toast.error("Error fetching dropdown data", { description: (err as Error).message });
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchDropdownData();
  }, [fetchAccounts, fetchDropdownData]);
  
  const handleApplyFilters = () => fetchAccounts();
  const handleResetFilters = () => {
      setFilterName('');
      setFilterCategory(ALL_FILTER_VALUE);
      setFilterSubCategory(ALL_FILTER_VALUE);
      setFilterIncludeDisabled(false);
      // fetchAccounts will be called by useEffect due to state changes if fetchAccounts is in its deps
      // Or call it explicitly after a timeout to ensure state updates are processed
      setTimeout(() => fetchAccounts(), 0);
  };


  const handleOpenModal = (account?: AccountRead) => {
    setEditingAccount(account || null);
    setFormData(account
      ? {
          accountNumber: account.accountNumber,
          name: account.name,
          categoryID: account.categoryID,
          subCategoryID: account.subCategoryID,
          normalBalance: account.normalBalance,
          disabled: account.disabled,
        }
      : { normalBalance: 'debit', disabled: false } // Default for new
    );
    setIsModalOpen(true);
  };

  const handleFormChange = (field: keyof AccountWrite, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountNumber || !formData.name || !formData.categoryID || !formData.normalBalance) {
      toast.error("Validation Error", { description: "Account Number, Name, Category, and Normal Balance are required." });
      return;
    }
    setIsSubmitting(true);
    const url = editingAccount ? `${ACCOUNTS_API_URL}/${editingAccount.id}` : ACCOUNTS_API_URL;
    const method = editingAccount ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to save account.`);
      }
      toast.success(`Account ${editingAccount ? 'updated' : 'created'} successfully!`);
      setIsModalOpen(false);
      fetchAccounts(); // Refresh list
    } catch (err) {
      toast.error("Save Failed", { description: (err as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInitiate = (account: AccountRead) => {
    setAccountToDelete(account);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${ACCOUNTS_API_URL}/${accountToDelete.id}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete account.`);
      }
      toast.success(`Account "${accountToDelete.name}" deleted.`);
      setIsDeleteDialogOpen(false);
      setAccountToDelete(null);
      fetchAccounts(); // Refresh list
    } catch (err) {
      toast.error("Delete Failed", { description: (err as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchJournalEntriesForAccount = async (accountId: number, page: number) => {
    if (!accountId) return;
    setIsLoadingJournals(true);
    const params = new URLSearchParams({
        pageNumber: String(page),
        pageSize: String(journalQuery.pageSize),
        ...(journalQuery.startDate && { startDate: format(new Date(journalQuery.startDate), "yyyy-MM-dd'T'HH:mm:ss") }),
        ...(journalQuery.endDate && { endDate: format(new Date(journalQuery.endDate), "yyyy-MM-dd'T'HH:mm:ss") }),
        ...(journalQuery.refContains && { refContains: journalQuery.refContains }),
    });
    try {
        const response = await fetch(`${ACCOUNTS_API_URL}/${accountId}/journalentries?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch journal entries');
        const data: AccountWithJournalEntries = await response.json();
        setViewingAccountDetails(data);
    } catch (err) {
        toast.error("Error fetching journal entries", { description: (err as Error).message });
    } finally {
        setIsLoadingJournals(false);
    }
  };

  const handleOpenJournalModal = (account: AccountRead) => {
    setJournalQuery({ pageNumber: 1, pageSize: 10 }); // Reset query for new account
    fetchJournalEntriesForAccount(account.id, 1);
    setIsJournalModalOpen(true);
  };
  
  const handleJournalQueryChange = (field: keyof AccountJournalEntryQueryParameters, value: string | number | Date | null | undefined) => {
    let processedValue = value;
    if ((field === 'startDate' || field === 'endDate') && value instanceof Date && isValid(value)) {
      processedValue = format(value, "yyyy-MM-dd");
    } else if ((field === 'startDate' || field === 'endDate') && value === null) {
      processedValue = null;
    }
     setJournalQuery(prev => ({ ...prev, pageNumber: 1, [field]: processedValue })); // Reset to page 1 on filter change
  };

  const handleJournalPageChange = (newPage: number) => {
    if (viewingAccountDetails && newPage >= 1 && newPage <= viewingAccountDetails.journalEntriesTotalPages) {
        setJournalQuery(prev => ({ ...prev, pageNumber: newPage }));
        fetchJournalEntriesForAccount(viewingAccountDetails.id, newPage);
    }
  };

  useEffect(() => {
    if (isJournalModalOpen && viewingAccountDetails?.id) {
        // This effect will run if a filter inside the journal modal changes the journalQuery state
        // And we are not on page 1, or if the modal just opened and has an account id
        // (fetchJournalEntriesForAccount is already called when modal opens and on page change)
    }
  }, [journalQuery.startDate, journalQuery.endDate, journalQuery.refContains, isJournalModalOpen, viewingAccountDetails?.id]);

  const handleOpenCategoryModal = () => {
    setNewCategoryData({ name: '' });
    setIsCategoryModalOpen(true);
  };

  const handleOpenSubCategoryModal = () => {
    setNewSubCategoryData({ name: '', code: '' });
    setIsSubCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryData.name.trim()) {
      toast.error("Validation Error", { description: "Category name is required." });
      return;
    }
    setIsSubmittingCategory(true);
    try {
      const response = await fetch(`${ACCOUNTS_API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategoryData),
      });
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create account category.');
      }
      toast.success("Category created successfully!");
      setIsCategoryModalOpen(false);
      fetchDropdownData(); // Refresh dropdown data
    } catch (err) {
      toast.error("Save Failed", { description: (err as Error).message });
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleSubCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCategoryData.name.trim()) {
      toast.error("Validation Error", { description: "Subcategory name is required." });
      return;
    }
    setIsSubmittingSubCategory(true);
    try {
      const response = await fetch(`${ACCOUNTS_API_URL}/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubCategoryData),
      });
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create account subcategory.');
      }
      toast.success("Subcategory created successfully!");
      setIsSubCategoryModalOpen(false);
      fetchDropdownData(); // Refresh dropdown data
    } catch (err) {
      toast.error("Save Failed", { description: (err as Error).message });
    } finally {
      setIsSubmittingSubCategory(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle>Manage Accounts</CardTitle>
            <Button onClick={() => handleOpenModal()} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Account
            </Button>
        </div>
        <CardDescription>Create, edit, and view financial accounts.</CardDescription>
      </CardHeader>
      <CardContent>
         {/* Filter Section */}
         <div className="mb-6 p-4 border rounded-lg bg-muted/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                <div className="space-y-1">
                    <Label htmlFor="filter-account-name">Name/Number</Label>
                    <Input id="filter-account-name" value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="Search name or number..." />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="filter-account-category">Category</Label>
                    <Select 
                      value={filterCategory} 
                      onValueChange={(val) => {
                        if (val === ADD_NEW_CATEGORY_VALUE) {
                          handleOpenCategoryModal();
                        } else {
                          setFilterCategory(val)
                        }
                      }}>
                        <SelectTrigger id="filter-account-category"><SelectValue placeholder="All Categories" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_FILTER_VALUE}>All Categories</SelectItem>
                            {categories.map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
                            <Separator />
                            <SelectItem value={ADD_NEW_CATEGORY_VALUE} className="text-primary focus:text-primary/90">
                                <div className="flex items-center">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    <span>Add new category...</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="filter-account-subcategory">Subcategory</Label>
                    <Select 
                      value={filterSubCategory} 
                      onValueChange={(val) => {
                        if (val === ADD_NEW_SUBCATEGORY_VALUE) {
                            handleOpenSubCategoryModal();
                        } else {
                          setFilterSubCategory(val);
                        }
                      }}>
                        <SelectTrigger id="filter-account-subcategory"><SelectValue placeholder="All Subcategories" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_FILTER_VALUE}>All Subcategories</SelectItem>
                            {subCategories.map(sub => <SelectItem key={sub.id} value={String(sub.id)}>{sub.name}</SelectItem>)}
                            <Separator />
                            <SelectItem value={ADD_NEW_SUBCATEGORY_VALUE} className="text-primary focus:text-primary/90">
                                <div className="flex items-center">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    <span>Add new subcategory...</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center space-x-2 pt-5">
                    <Checkbox id="filter-account-disabled" checked={filterIncludeDisabled} onCheckedChange={(checked) => setFilterIncludeDisabled(!!checked)} />
                    <Label htmlFor="filter-account-disabled" className="text-sm">Include Disabled</Label>
                </div>
                <div className="flex space-x-2 pt-5">
                    <Button onClick={handleApplyFilters} size="sm"><Search className="mr-1 h-4 w-4"/>Filter</Button>
                    <Button onClick={handleResetFilters} variant="outline" size="sm"><RotateCcw className="mr-1 h-4 w-4"/>Reset</Button>
                </div>
            </div>
        </div>

        {isLoading && <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin inline mr-2" />Loading accounts...</div>}
        {!isLoading && accounts.length === 0 && <p className="text-center text-muted-foreground py-4">No accounts found.</p>}
        {!isLoading && accounts.length > 0 && (
          <Table>
            <TableCaption>List of configured accounts.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Acc. Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Subcategory</TableHead>
                <TableHead>Normal Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map(acc => (
                <TableRow key={acc.id} className={acc.disabled ? "opacity-60" : ""}>
                  <TableCell className="font-mono text-xs">{acc.accountNumber}</TableCell>
                  <TableCell>{acc.name}</TableCell>
                  <TableCell>{acc.categoryName}</TableCell>
                  <TableCell>{acc.subCategoryName || '-'}</TableCell>
                  <TableCell>{acc.normalBalance}</TableCell>
                  <TableCell>{acc.disabled ? 'Disabled' : 'Active'}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenJournalModal(acc)} title="View Journal Entries">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenModal(acc)} title="Edit Account">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => handleDeleteInitiate(acc)} title="Delete Account">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Add/Edit Account Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="acc-number" className="text-right">Number*</Label>
              <Input id="acc-number" value={formData.accountNumber || ''} onChange={(e) => handleFormChange('accountNumber', e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="acc-name" className="text-right">Name*</Label>
              <Input id="acc-name" value={formData.name || ''} onChange={(e) => handleFormChange('name', e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="acc-category" className="text-right">Category*</Label>
              <Select
                  value={String(formData.categoryID || '')}
                  onValueChange={(val) => {
                      if (val === ADD_NEW_CATEGORY_VALUE) {
                          handleOpenCategoryModal();
                      } else {
                          handleFormChange('categoryID', parseInt(val, 10));
                      }
                  }}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                      <Separator />
                      <SelectItem value={ADD_NEW_CATEGORY_VALUE} className="text-primary focus:text-primary/90">
                          <div className="flex items-center">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              <span>Add new category...</span>
                          </div>
                      </SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="acc-subcategory" className="text-right">Subcategory</Label>
              <Select
                  value={String(formData.subCategoryID || NONE_SELECT_VALUE)}
                  onValueChange={(val) => {
                      if (val === ADD_NEW_SUBCATEGORY_VALUE) {
                          handleOpenSubCategoryModal();
                      } else {
                          handleFormChange('subCategoryID', val === NONE_SELECT_VALUE ? null : parseInt(val, 10));
                      }
                  }}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select subcategory (optional)" /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value={NONE_SELECT_VALUE}>None</SelectItem>
                      {subCategories.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                      <Separator />
                      <SelectItem value={ADD_NEW_SUBCATEGORY_VALUE} className="text-primary focus:text-primary/90">
                          <div className="flex items-center">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              <span>Add new subcategory...</span>
                          </div>
                      </SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="acc-normalBalance" className="text-right">Normal Balance*</Label>
              <Select value={formData.normalBalance || 'debit'} onValueChange={(val) => handleFormChange('normalBalance', val as 'debit' | 'credit')}>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">debit</SelectItem>
                  <SelectItem value="credit">credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
             {editingAccount && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="acc-disabled" className="text-right">Disabled</Label>
                    <Checkbox id="acc-disabled" checked={!!formData.disabled} onCheckedChange={(checked) => handleFormChange('disabled', !!checked)} className="col-span-3 justify-self-start" />
                </div>
             )}
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingAccount ? 'Save Changes' : 'Create Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account: {accountToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark the account as disabled. Are you sure? It cannot be undone easily and may be prevented if the account has journal entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       {/* View Journal Entries Modal */}
       <Dialog open={isJournalModalOpen} onOpenChange={setIsJournalModalOpen}>
            <DialogContent className="sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Journal Entries for: {viewingAccountDetails?.name} ({viewingAccountDetails?.accountNumber})</DialogTitle>
                    <DialogDescription>Displaying {viewingAccountDetails?.journalEntries.length} of {viewingAccountDetails?.journalEntriesTotalCount} entries.</DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto pr-2 space-y-3 py-2">
                    {/* Filters for Journal Entries */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end p-3 border rounded-md bg-muted/30">
                        <div className="space-y-1">
                            <Label htmlFor="journal-startDate" className="text-xs">Start Date</Label>
                            <DatePicker date={journalQuery.startDate ? parseISO(journalQuery.startDate) : undefined} setDate={(date) => handleJournalQueryChange('startDate', date)} id="journal-startDate" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="journal-endDate" className="text-xs">End Date</Label>
                            <DatePicker date={journalQuery.endDate ? parseISO(journalQuery.endDate) : undefined} setDate={(date) => handleJournalQueryChange('endDate', date)} id="journal-endDate" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="journal-refContains" className="text-xs">Ref. Contains</Label>
                            <Input id="journal-refContains" value={journalQuery.refContains || ''} onChange={(e) => handleJournalQueryChange('refContains', e.target.value)} />
                        </div>
                         <Button onClick={() => viewingAccountDetails && fetchJournalEntriesForAccount(viewingAccountDetails.id, 1)} disabled={isLoadingJournals} size="sm" className="sm:col-span-3 justify-self-end">
                            <Search className="mr-1 h-4 w-4"/>Apply Journal Filters
                        </Button>
                    </div>

                    {isLoadingJournals && <div className="text-center py-5"><Loader2 className="h-6 w-6 animate-spin inline mr-2" />Loading entries...</div>}
                    {!isLoadingJournals && viewingAccountDetails && viewingAccountDetails.journalEntries.length === 0 && <p className="text-center text-sm text-muted-foreground py-5">No journal entries found for this account and filter.</p>}
                    {!isLoadingJournals && viewingAccountDetails && viewingAccountDetails.journalEntries.length > 0 && (
                        <Table className="text-xs">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Entry ID</TableHead>
                                    <TableHead>Ref</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Debit</TableHead>
                                    <TableHead className="text-right">Credit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {viewingAccountDetails.journalEntries.map(entry => (
                                    <TableRow key={entry.id}>
                                        <TableCell>{entry.id}</TableCell>
                                        <TableCell>{entry.ref || '-'}</TableCell>
                                        <TableCell className="max-w-xs truncate" title={entry.description ?? undefined}>{entry.description || '-'}</TableCell>
                                        <TableCell className="text-right">{entry.debit !== 0 ? formatCurrency(entry.debit, '$') : '-'}</TableCell>
                                        <TableCell className="text-right">{entry.credit !== 0 ? formatCurrency(entry.credit, '$') : '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
                {viewingAccountDetails && viewingAccountDetails.journalEntriesTotalPages > 1 && (
                    <div className="flex justify-center items-center space-x-2 pt-3 border-t mt-2">
                        <Button variant="outline" size="sm" onClick={() => handleJournalPageChange(journalQuery.pageNumber! - 1)} disabled={journalQuery.pageNumber! <= 1 || isLoadingJournals}>Previous</Button>
                        <span>Page {journalQuery.pageNumber} of {viewingAccountDetails.journalEntriesTotalPages}</span>
                        <Button variant="outline" size="sm" onClick={() => handleJournalPageChange(journalQuery.pageNumber! + 1)} disabled={journalQuery.pageNumber! >= viewingAccountDetails.journalEntriesTotalPages || isLoadingJournals}>Next</Button>
                    </div>
                )}
                <DialogFooter className="mt-auto pt-4 border-t">
                    <Button variant="outline" onClick={() => setIsJournalModalOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Add Category Modal */}
        <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Account Category</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCategorySubmit} className="space-y-4 py-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cat-name" className="text-right">Name*</Label>
                    <Input id="cat-name" value={newCategoryData.name} onChange={(e) => setNewCategoryData({ name: e.target.value })} className="col-span-3" required disabled={isSubmittingCategory} />
                    </div>
                    <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmittingCategory}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmittingCategory}>
                        {isSubmittingCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Category
                    </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      
        {/* Add SubCategory Modal */}
        <Dialog open={isSubCategoryModalOpen} onOpenChange={setIsSubCategoryModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Account Subcategory</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubCategorySubmit} className="space-y-4 py-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subcat-code" className="text-right">Code</Label>
                        <Input id="subcat-code" value={newSubCategoryData.code} onChange={(e) => setNewSubCategoryData(prev => ({ ...prev, code: e.target.value }))} className="col-span-3" placeholder="Optional code" disabled={isSubmittingSubCategory} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subcat-name" className="text-right">Name*</Label>
                        <Input id="subcat-name" value={newSubCategoryData.name} onChange={(e) => setNewSubCategoryData(prev => ({ ...prev, name: e.target.value }))} className="col-span-3" required disabled={isSubmittingSubCategory} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmittingSubCategory}>Cancel</Button></DialogClose>
                        <Button type="submit" disabled={isSubmittingSubCategory}>
                            {isSubmittingSubCategory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Subcategory
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </Card>
  );
};