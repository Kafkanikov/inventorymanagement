// New File: ecommerce.client/src/components/dashboard/forms/JournalPageForm.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Trash2, PlusCircle, Loader2, Save, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  JournalPageCreate, JournalPostCreate, AccountSelection
} from '@/types/financial';
import { ApiErrorResponse } from '@/types/inventory';
import { formatCurrency } from '@/lib/utils';

const ACCOUNTS_API_URL = '/api/accounts?includeDisabled=false'; // Fetch only active accounts
const JOURNAL_PAGE_API_URL = '/api/journal/page';

interface JournalPageFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const JournalPageForm: React.FC<JournalPageFormProps> = ({ onSuccess, onCancel }) => {
  const [pageData, setPageData] = useState<Partial<JournalPageCreate>>({
    source: 'Manual Entry', // Default source
    currencyID: 1, // Assuming 1 for USD by default
    journalEntries: [{ accountNumber: '', debit: 0, credit: 0 }],
  });
  const [accounts, setAccounts] = useState<AccountSelection[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAccountsForSelection = useCallback(async () => {
    setIsLoadingAccounts(true);
    try {
      const response = await fetch(ACCOUNTS_API_URL);
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const data: AccountSelection[] = await response.json(); // Assuming API returns needed fields
      setAccounts(data);
    } catch (error) {
      toast.error("Error fetching accounts", { description: (error as Error).message });
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    fetchAccountsForSelection();
  }, [fetchAccountsForSelection]);

  const handlePageDataChange = (field: keyof Omit<JournalPageCreate, 'journalEntries'>, value: string | null) => {
    setPageData(prev => ({ ...prev, [field]: value }));
  };

  const handleEntryChange = (index: number, field: keyof JournalPostCreate, value: string | number) => {
    const newEntries = [...(pageData.journalEntries || [])];
    const entry = { ...newEntries[index] };
    
    if (field === 'debit' || field === 'credit') {
        // @ts-ignore
      entry[field] = value === '' ? 0 : parseFloat(String(value));
      // Ensure only one of debit or credit has a value > 0 for this entry
      if (field === 'debit' && entry.debit > 0) entry.credit = 0;
      if (field === 'credit' && entry.credit > 0) entry.debit = 0;
    } else {
        // @ts-ignore
      entry[field] = value;
    }
    newEntries[index] = entry;
    setPageData(prev => ({ ...prev, journalEntries: newEntries }));
  };

  const addEntryRow = () => {
    setPageData(prev => ({
      ...prev,
      journalEntries: [...(prev.journalEntries || []), { accountNumber: '', debit: 0, credit: 0 }],
    }));
  };

  const removeEntryRow = (index: number) => {
    const newEntries = (pageData.journalEntries || []).filter((_, i) => i !== index);
    setPageData(prev => ({ ...prev, journalEntries: newEntries }));
  };

  const totalDebits = useMemo(() => {
    return (pageData.journalEntries || []).reduce((sum, entry) => sum + (Number(entry.debit) || 0), 0);
  }, [pageData.journalEntries]);

  const totalCredits = useMemo(() => {
    return (pageData.journalEntries || []).reduce((sum, entry) => sum + (Number(entry.credit) || 0), 0);
  }, [pageData.journalEntries]);

  const isBalanced = useMemo(() => {
    return Math.abs(totalDebits - totalCredits) < 0.001; // Tolerance for floating point
  }, [totalDebits, totalCredits]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageData.source?.trim()) {
      toast.error("Validation Error", { description: "Source is required for the journal page." });
      return;
    }
    if (!pageData.journalEntries || pageData.journalEntries.length === 0) {
      toast.error("Validation Error", { description: "At least one journal entry is required." });
      return;
    }
    if (!isBalanced) {
      toast.error("Validation Error", { description: "Total debits must equal total credits." });
      return;
    }
    if (pageData.journalEntries.some(entry => !entry.accountNumber || (entry.debit === 0 && entry.credit === 0))) {
        toast.error("Validation Error", { description: "Each journal entry must have an account number and either a debit or a credit amount."});
        return;
    }
     if (pageData.journalEntries.some(entry => entry.debit < 0 || entry.credit < 0)) {
        toast.error("Validation Error", { description: "Debit and Credit amounts cannot be negative." });
        return;
    }
     if (pageData.journalEntries.some(entry => entry.debit > 0 && entry.credit > 0)) {
        toast.error("Validation Error", { description: "A single journal entry cannot have both debit and credit amounts." });
        return;
    }


    setIsSubmitting(true);
    const payload: JournalPageCreate = {
      currencyID: pageData.currencyID || 1, // Default to USD or make it selectable
      ref: pageData.ref || null,
      source: pageData.source,
      description: pageData.description || null,
      journalEntries: pageData.journalEntries.map(entry => ({
        accountNumber: entry.accountNumber,
        description: entry.description || null,
        debit: Number(entry.debit) || 0,
        credit: Number(entry.credit) || 0,
        ref: entry.ref || null,
      })) as JournalPostCreate[],
    };

    try {
      const response = await fetch(JOURNAL_PAGE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({ message: `Server error: ${response.status}` }));
        let errorMessage = errorData.message || "Failed to create journal page.";
        if (errorData.errors) {
            errorMessage = Object.values(errorData.errors).flat().join(' ');
        } else if (errorData.title) {
            errorMessage = errorData.title;
        }
        throw new Error(errorMessage);
      }
      toast.success("Journal Page Created Successfully!");
      onSuccess();
    } catch (error) {
      toast.error("Submission Failed", { description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 flex-grow overflow-y-auto pr-2">
      {isLoadingAccounts && <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /> Loading accounts...</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="jp-ref">Reference (Optional)</Label>
          <Input id="jp-ref" value={pageData.ref || ''} onChange={(e) => handlePageDataChange('ref', e.target.value)} placeholder="e.g., INV-123, Adj-May" disabled={isSubmitting} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="jp-source">Source*</Label>
          <Input id="jp-source" value={pageData.source || ''} onChange={(e) => handlePageDataChange('source', e.target.value)} placeholder="e.g., Manual Entry, Sales Import" required disabled={isSubmitting} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="jp-description">Page Description (Optional)</Label>
        <Textarea id="jp-description" value={pageData.description || ''} onChange={(e) => handlePageDataChange('description', e.target.value)} placeholder="Overall description for this journal page" rows={2} disabled={isSubmitting} />
      </div>

      <div className="space-y-3 mt-3">
        <div className='flex justify-between items-center'>
            <Label className="text-md font-semibold">Journal Entries*</Label>
            <Button type="button" variant="outline" size="sm" onClick={addEntryRow} disabled={isSubmitting}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Entry
            </Button>
        </div>
        {(pageData.journalEntries || []).map((entry, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 p-3 border rounded items-end">
            <div className="col-span-12 sm:col-span-3 space-y-1">
              <Label htmlFor={`je-account-${index}`} className="text-xs">Account*</Label>
              <Select
                value={entry.accountNumber || ''}
                onValueChange={(value) => handleEntryChange(index, 'accountNumber', value)}
                disabled={isSubmitting || accounts.length === 0}
              >
                <SelectTrigger id={`je-account-${index}`}>
                <SelectValue placeholder="Select account">
                  {entry.accountNumber}
                </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.accountNumber}>
                      {acc.accountNumber}: {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-12 sm:col-span-3 space-y-1">
              <Label htmlFor={`je-desc-${index}`} className="text-xs">Entry Desc.</Label>
              <Input id={`je-desc-${index}`} value={entry.description || ''} onChange={(e) => handleEntryChange(index, 'description', e.target.value)} placeholder="Entry specific description" disabled={isSubmitting} />
            </div>
             <div className="col-span-6 sm:col-span-2 space-y-1">
              <Label htmlFor={`je-debit-${index}`} className="text-xs">Debit</Label>
              <Input id={`je-debit-${index}`} type="number" value={entry.debit || ''} onChange={(e) => handleEntryChange(index, 'debit', e.target.value)} placeholder="0.00" step="0.01" min="0" disabled={isSubmitting || entry.credit > 0} />
            </div>
            <div className="col-span-6 sm:col-span-2 space-y-1">
              <Label htmlFor={`je-credit-${index}`} className="text-xs">Credit</Label>
              <Input id={`je-credit-${index}`} type="number" value={entry.credit || ''} onChange={(e) => handleEntryChange(index, 'credit', e.target.value)} placeholder="0.00" step="0.01" min="0" disabled={isSubmitting || entry.debit > 0} />
            </div>
             <div className="col-span-10 sm:col-span-1 space-y-1">
               <Label htmlFor={`je-ref-${index}`} className="text-xs">Ref.</Label>
              <Input id={`je-ref-${index}`} value={entry.ref || ''} onChange={(e) => handleEntryChange(index, 'ref', e.target.value)} placeholder="Ref." disabled={isSubmitting} />
            </div>
            <div className="col-span-2 sm:col-span-1 flex items-center justify-end">
              <Button type="button" variant="ghost" size="icon" onClick={() => removeEntryRow(index)} disabled={isSubmitting || (pageData.journalEntries || []).length <= 1}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 border rounded-md bg-muted/40">
        <div className="flex justify-between items-center font-semibold">
          <span>Total Debits:</span>
          <span>{formatCurrency(totalDebits, '$')}</span>
        </div>
        <div className="flex justify-between items-center font-semibold">
          <span>Total Credits:</span>
          <span>{formatCurrency(totalCredits, '$')}</span>
        </div>
        <div className={`mt-2 text-sm font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
          {isBalanced ? 'Journal is BALANCED' : `Journal is OUT OF BALANCE by ${formatCurrency(Math.abs(totalDebits - totalCredits), '$')}`}
        </div>
      </div>


      <div className="flex justify-end space-x-2 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isLoadingAccounts || !isBalanced}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Create Journal Page
        </Button>
      </div>
    </form>
  );
};