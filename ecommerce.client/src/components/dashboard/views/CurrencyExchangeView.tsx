import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CurrencyExchangeRead, CurrencyExchangeWrite } from '@/types/financial';
import { CurrencyExchangeForm } from '../forms/CurrencyExchangeForm';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CurrencyExchangeView: React.FC = () => {
    const [exchanges, setExchanges] = useState<CurrencyExchangeRead[]>([]);
    const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().setDate(1)));
    const [endDate, setEndDate] = useState<Date | undefined>(new Date());
    const [includeDisabled, setIncludeDisabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchExchanges = useCallback(async () => {
        if (!startDate || !endDate) return;
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd'),
                includeDisabled: String(includeDisabled)
            });
            const response = await fetch(`/api/currencyexchange?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch exchanges');
            const data = await response.json();
            setExchanges(data);
        } catch (error) {
            toast.error('Error fetching exchanges', { description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate, includeDisabled]);

    useEffect(() => {
        fetchExchanges();
    }, [fetchExchanges]);

    const handleSave = async (data: CurrencyExchangeWrite) => {
        try {
            const response = await fetch('/api/currencyexchange', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || 'Failed to save exchange');
            }
            toast.success('Exchange saved successfully');
            fetchExchanges();
        } catch (error) {
            toast.error('Error saving exchange', { description: (error as Error).message });
        }
    };
    
    const handleDisable = async (id: number) => {
        if (!window.confirm("Are you sure you want to disable this exchange? This will not reverse the accounting entries.")) return;
        try {
            const response = await fetch(`/api/currencyexchange/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to disable exchange');
            toast.success('Exchange disabled successfully');
            fetchExchanges();
        } catch(error) {
            toast.error('Error disabling exchange', { description: (error as Error).message });
        }
    }
    
    const getExchangeTypeLabel = (type: string) => {
        return type === 'USDtoKHR' ? 'USD to KHR' : 'KHR to USD';
    }

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Currency Exchange</h1>
                <CurrencyExchangeForm onSave={handleSave} />
            </div>
            <div className="flex justify-between mb-6 p-4 border rounded-lg bg-muted/20">
                <div className='flex gap-3 items-center'>
                    <div className="flex flex-col space-y-1 min-w-[160px] flex-grow sm:flex-grow-0">
                        <Label htmlFor="filter-start-date-log">Start Date</Label>
                        <DatePicker date={startDate} setDate={setStartDate} className="w-full" />
                    </div>
                    <div className="flex flex-col space-y-1 min-w-[160px] flex-grow sm:flex-grow-0">
                        <Label htmlFor="filter-end-date-log">End Date</Label>
                        <DatePicker date={endDate} setDate={setEndDate} className="w-full" />
                    </div>
                </div>
                <div className='flex items-center space-x-4'>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="includeDisabled" checked={includeDisabled} onCheckedChange={(checked) => setIncludeDisabled(Boolean(checked))} />
                        <Label htmlFor="includeDisabled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Include Disabled
                        </Label>
                    </div>
                    <Button onClick={fetchExchanges} disabled={isLoading}>
                        {isLoading ? 'Searching...' : 'Search'}
                    </Button>
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Exchange</TableHead>
                            <TableHead className="text-right">From Amount</TableHead>
                            <TableHead className="text-right">To Amount</TableHead>
                            <TableHead className="text-right">Rate</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {exchanges.length > 0 ? exchanges.map(ex => (
                            <TableRow key={ex.id} className={cn(ex.disabled && 'text-muted-foreground opacity-50')}>
                                <TableCell>{format(new Date(ex.timestamp), 'dd MMM𒐏, HH:mm')}</TableCell>
                                <TableCell>{ex.username}</TableCell>
                                <TableCell>{getExchangeTypeLabel(ex.exchangeOption)}</TableCell>
                                <TableCell className="text-right">{ex.fromAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right">{ex.toAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right">{ex.rate.toLocaleString()}</TableCell>
                                <TableCell>{ex.description}</TableCell>
                                <TableCell className="text-center">
                                    {!ex.disabled && (
                                        <Button variant="ghost" size="icon" onClick={() => handleDisable(ex.id)} title="Disable Exchange">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center">No exchanges found for the selected period.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};