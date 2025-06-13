import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CurrencyExchangeWrite, AccountSelection, AccountRead } from '@/types/financial';

interface CurrencyExchangeFormProps {
    onSave: (data: CurrencyExchangeWrite) => Promise<void>;
}

export const CurrencyExchangeForm: React.FC<CurrencyExchangeFormProps> = ({ onSave }) => {
    const [exchangeOption, setExchangeOption] = useState<'USDtoKHR' | 'KHRtoUSD'>('USDtoKHR');
    const [bankLocation, setBankLocation] = useState('');
    const [rate, setRate] = useState<number>(4100);
    const [fromAmount, setFromAmount] = useState<number>(0);
    const [description, setDescription] = useState('');
    
    const [allAccounts, setAllAccounts] = useState<AccountSelection[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const fetchAccounts = async () => {
            try {
                const response = await fetch('/api/accounts');
                if (!response.ok) throw new Error('Failed to fetch accounts');
                const data = await response.json();
                const cashAccounts = data
                    .filter((acc: AccountRead) => acc.subCategoryName?.toLowerCase().includes('cash'))
                    .map((acc: any) => ({
                        id: acc.id,
                        name: acc.name,
                        currency: acc.name.includes('USD') ? 'USD' : (acc.name.includes('KHR') ? 'KHR' : 'Unknown'),
                    }));
                setAllAccounts(cashAccounts);
            } catch (error) {
                toast.error('Error fetching accounts', { description: (error as Error).message });
            }
        };
        fetchAccounts();
    }, [isOpen]);

    const toAmount = useMemo(() => {
        if (!fromAmount || !rate) return 0;
        return exchangeOption === 'USDtoKHR' ? fromAmount * rate : fromAmount / rate;
    }, [fromAmount, rate, exchangeOption]);

    const bankLocations = useMemo(() => {
        const locations = new Set<string>();
        allAccounts.forEach(acc => {
            const parts = acc.name.split(':');
            if (parts.length > 2) {
                locations.add(parts[1].trim());
            }
            console.log(parts);
        });
        return Array.from(locations);
    }, [allAccounts]);

    const handleSave = async () => {
        if (!bankLocation || fromAmount <= 0 || rate <= 0) {
            toast.error('Please fill all required fields with valid numbers.');
            return;
        }

        const data: CurrencyExchangeWrite = {
            exchangeOption,
            bankLocation,
            rate,
            fromAmount,
            description,
        };

        await onSave(data);
        setIsOpen(false);
        // Reset form
        setExchangeOption('USDtoKHR');
        setBankLocation('');
        setFromAmount(0);
        setRate(4100);
        setDescription('');
    };
    
    const fromCurrencyLabel = exchangeOption === 'USDtoKHR' ? 'USD' : 'KHR';
    const toCurrencyLabel = exchangeOption === 'USDtoKHR' ? 'KHR' : 'USD';


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>New Exchange</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Currency Exchange</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bankLocation" className="text-right">Cash Type</Label>
                        <Select onValueChange={setBankLocation} value={bankLocation}>
                             <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a bank" />
                            </SelectTrigger>
                            <SelectContent>
                                {bankLocations.map(loc => (
                                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="exchangeOption" className="text-right">Exchange</Label>
                        <Select onValueChange={(value: 'USDtoKHR' | 'KHRtoUSD') => setExchangeOption(value)} value={exchangeOption}>
                             <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USDtoKHR">USD to KHR</SelectItem>
                                <SelectItem value="KHRtoUSD">KHR to USD</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="rate" className="text-right">Rate ($1)</Label>
                        <Input id="rate" type="number" value={rate} onChange={e => setRate(parseFloat(e.target.value) || 0)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fromAmount" className="text-right">Amount ({fromCurrencyLabel})</Label>
                        <Input id="fromAmount" type="number" value={fromAmount} onChange={e => setFromAmount(parseFloat(e.target.value) || 0)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="toAmount" className="text-right">Received ({toCurrencyLabel})</Label>
                        <Input id="toAmount" type="number" value={toAmount.toFixed(2)} disabled className="col-span-3 bg-muted" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Description</Label>
                        <Input id="description" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Save Transaction</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
