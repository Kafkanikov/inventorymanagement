import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
    BalanceSheetData,
    BalanceSheetRequestParams,
    TrialBalanceReport,
    TrialBalanceRequestParams
} from '@/types/financial';
import { ApiErrorResponse } from '@/types/inventory';
import { format, parseISO, isValid } from 'date-fns';
import { BalanceSheetViewInternal } from '../reports/BalanceSheetViewInternal'; 
import { TrialBalanceViewInternal } from '../reports/TrialBalanceViewInternal'; 

const BALANCE_SHEET_API_URL = '/api/accounting/balancesheet';
const TRIAL_BALANCE_API_URL = '/api/accounting/trialbalance';

type ReportType = 'balanceSheet' | 'trialBalance';

export const FinancialReportsContainer: React.FC = () => {
    const [activeReportType, setActiveReportType] = useState<ReportType>('balanceSheet');
    const [reportParams, setReportParams] = useState<Partial<BalanceSheetRequestParams & TrialBalanceRequestParams>>({
        asOfDate: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        reportCurrency: 'USD',
        khrtoReportCurrencyExchangeRate: 4150,
    });

    const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData | null>(null);
    const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleParamChange = (field: keyof (BalanceSheetRequestParams & TrialBalanceRequestParams), value: string | number | Date | undefined | null) => {
        setReportParams(prev => ({
            ...prev,
            [field]: field === 'asOfDate' && value instanceof Date && isValid(value)
                ? format(value, "yyyy-MM-dd'T'HH:mm:ss")
                : value
        }));
    };

    useEffect(() => {
        const currentDateParam = reportParams.asOfDate;
        if (currentDateParam && 
            typeof currentDateParam === 'object' && 
            'getTime' in currentDateParam && 
            isValid(currentDateParam as Date)) {
            setReportParams(prev => ({
                ...prev,
                asOfDate: format(currentDateParam as Date, "yyyy-MM-dd'T'HH:mm:ss")
            }));
        }
    }, [reportParams.asOfDate]);

    const fetchReport = useCallback(async () => {
        if (!reportParams.asOfDate || !isValid(parseISO(reportParams.asOfDate))) {
            toast.error("Validation Error", { description: "A valid 'As of Date' is required." });
            return;
        }
        if (!reportParams.reportCurrency) {
            toast.error("Validation Error", { description: "Report Currency is required." });
            return;
        }
        if (reportParams.khrtoReportCurrencyExchangeRate === null || reportParams.khrtoReportCurrencyExchangeRate === undefined || reportParams.khrtoReportCurrencyExchangeRate <= 0) {
            toast.warning("Input Warning", { description: "Exchange rate should be a positive number if mixing currencies." });
        }

        setIsLoading(true);
        setError(null);
        setBalanceSheetData(null);
        setTrialBalanceData(null);

        const query = new URLSearchParams();
        const dateStringToAppend = typeof reportParams.asOfDate === 'string'
            ? reportParams.asOfDate
            : (reportParams.asOfDate && isValid(reportParams.asOfDate) ? format(reportParams.asOfDate, "yyyy-MM-dd'T'HH:mm:ss") : '');

        if (!dateStringToAppend) {
            toast.error("Validation Error", { description: "Invalid 'As of Date' for API query." });
            setIsLoading(false);
            return;
        }
        query.append('asOfDate', dateStringToAppend);
        query.append('reportCurrency', reportParams.reportCurrency);

        if (reportParams.khrtoReportCurrencyExchangeRate !== null && reportParams.khrtoReportCurrencyExchangeRate !== undefined) {
            query.append('khrToReportCurrencyExchangeRate', String(reportParams.khrtoReportCurrencyExchangeRate));
        }

        const apiUrl = activeReportType === 'balanceSheet' ? BALANCE_SHEET_API_URL : TRIAL_BALANCE_API_URL;
        const reportName = activeReportType === 'balanceSheet' ? 'Balance Sheet' : 'Trial Balance';

        try {
            const response = await fetch(`${apiUrl}?${query.toString()}`);
            if (!response.ok) {
                const errorData: ApiErrorResponse = await response.json().catch(() => ({ message: `Server error: ${response.status}. Please check console for more details.` }));
                throw new Error(errorData.message || `Failed to fetch ${reportName.toLowerCase()}: ${response.statusText}`);
            }
            const data = await response.json();

            if (activeReportType === 'balanceSheet') {
                setBalanceSheetData(data as BalanceSheetData);
            } else {
                setTrialBalanceData(data as TrialBalanceReport);
            }
            toast.success("Report Generated", { description: `${reportName} as of ${format(parseISO(dateStringToAppend), 'PP')} fetched.`, className: 'no-print' });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
            setError(errorMessage);
            toast.error(`Error Fetching ${reportName}`, { description: errorMessage });
            console.error(`Fetch ${reportName} Error:`, err);
        } finally {
            setIsLoading(false);
        }
    }, [reportParams, activeReportType]);

    return (
        <div className="space-y-6 pb-10">
            <Card className="no-print">
                <CardHeader>
                    <CardTitle>Financial Reports</CardTitle>
                    <CardDescription>Select a report type and configure parameters to generate.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className='gap-1 flex flex-col'>
                            <Label htmlFor="reportAsOfDate">As of Date*</Label>
                            <DatePicker
                                date={reportParams.asOfDate && isValid(parseISO(reportParams.asOfDate)) ? parseISO(reportParams.asOfDate) : new Date()}
                                setDate={(date) => handleParamChange('asOfDate', date)}
                                className="w-full"
                            />
                        </div>
                        <div className='gap-1 flex flex-col'>
                            <Label htmlFor="reportReportCurrency">Report Currency*</Label>
                            <Select
                                value={reportParams.reportCurrency}
                                onValueChange={(value) => handleParamChange('reportCurrency', value)}
                            >
                                <SelectTrigger id="reportReportCurrency"><SelectValue placeholder="Select Currency" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="KHR">KHR (៛)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='gap-1 flex flex-col'>
                            <Label htmlFor="reportKhrExchangeRate">KHR per Foreign Unit Rate</Label>
                            <Input
                                id="reportKhrExchangeRate"
                                type="number"
                                placeholder="e.g., 4150"
                                value={reportParams.khrtoReportCurrencyExchangeRate ?? ''}
                                onChange={(e) => handleParamChange('khrtoReportCurrencyExchangeRate', e.target.value === '' ? null : parseFloat(e.target.value))}
                                step="any"
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={fetchReport} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                        Generate Report
                    </Button>
                </CardFooter>
            </Card>

            {isLoading && (
                <div className="flex flex-col justify-center items-center py-10 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
                    <p className="text-lg text-muted-foreground">Generating report, please wait...</p>
                </div>
            )}
            {error && !isLoading && (
                <Card className="border-destructive bg-red-50 dark:bg-red-900/20 no-print">
                    <CardHeader className="flex flex-row items-center space-x-2">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                        <CardTitle className="text-destructive">Error Generating Report</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-destructive-foreground">{error}</p>
                        <Button onClick={fetchReport} variant="outline" className="mt-4">Try Again</Button>
                    </CardContent>
                </Card>
            )}

            {!isLoading && !error && (
                <Tabs value={activeReportType} onValueChange={(value) => setActiveReportType(value as ReportType)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 no-print">
                        <TabsTrigger value="balanceSheet">Balance Sheet</TabsTrigger>
                        <TabsTrigger value="trialBalance">Trial Balance</TabsTrigger>
                    </TabsList>
                    <TabsContent value="balanceSheet">
                        {balanceSheetData ? (
                            <BalanceSheetViewInternal
                                reportData={balanceSheetData}
                                reportParams={reportParams as BalanceSheetRequestParams}
                            />
                        ) : (
                            <Card className="mt-4"><CardContent className="py-10 text-center text-muted-foreground">Generate the report to view Balance Sheet data.</CardContent></Card>
                        )}
                    </TabsContent>
                    <TabsContent value="trialBalance">
                        {trialBalanceData ? (
                            <TrialBalanceViewInternal
                                reportData={trialBalanceData}
                                reportParams={reportParams as TrialBalanceRequestParams}
                            />
                        ) : (
                            <Card className="mt-4"><CardContent className="py-10 text-center text-muted-foreground">Generate the report to view Trial Balance data.</CardContent></Card>
                        )}
                    </TabsContent>
                </Tabs>
            )}
            {/* Global print styles - can be moved to a more global CSS file if preferred */}
            <style>{`
        @media print {
          body, html { 
            margin: 0; 
            padding: 0; 
            -webkit-print-color-adjust: exact !important; 
            color-adjust: exact !important; 
          }
            .main-layout-header-no-print, 
            .main-sidebar-no-print,       
            .no-print { 
                display: none !important; 
            }
            .balance-summary-no-print {
                display: none !important;
            }
          .print-container {
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto; 
            width: 100%; 
            max-width: 100%;
          }
          .print-header-block { margin-bottom: 20px; }
          .print-main-title { font-size: 18pt !important; margin-bottom: 4px;}
          .print-report-title { font-size: 14pt !important; margin-bottom: 2px;}
          .print-report-subtitle { font-size: 9pt !important; color: #555 !important;}
          
          .report-content-area table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt; 
            margin-bottom: 15px; 
          }
          .report-content-area th, .report-content-area td {
            border: 1px solid #ddd !important;
            padding: 5px 8px !important;
            text-align: left;
            vertical-align: top;
          }
          .report-content-area th {
            background-color: #f0f0f0 !important; 
            font-weight: bold;
          }
          .report-content-area .bg-muted\\/30 { background-color: #f9fafb !important; } 
          .report-content-area .bg-secondary { background-color: #e5e7eb !important; } 
          .report-content-area .text-right { text-align: right !important; }
          .report-content-area .font-semibold { font-weight: 600 !important; }
          .report-content-area .font-bold { font-weight: 700 !important; }
          .report-content-area .text-xs { font-size: 8pt !important; }
          .report-content-area .text-sm { font-size: 9pt !important; }
          .report-content-area .text-base { font-size: 10pt !important; }
          .report-content-area .pl-4 { padding-left: 0.75rem !important; }
          .report-content-area .pl-8 { padding-left: 1.5rem !important; }
          .report-content-area .pl-12 { padding-left: 2.25rem !important; }
          .report-content-area .py-1 { padding-top: 0.2rem !important; padding-bottom: 0.2rem !important; }
          .report-content-area .py-1\\.5 { padding-top: 0.3rem !important; padding-bottom: 0.3rem !important; }
          .report-content-area .py-2 { padding-top: 0.4rem !important; padding-bottom: 0.4rem !important; }

          .summary-table td, .summary-table th {
             border: 1px solid #ccc !important;
             padding: 6px !important;
          }
          .summary-table .font-bold { font-weight: bold !important; }
          .summary-table .bg-slate-50 { background-color: #f8fafc !important; }

          .print-section { page-break-inside: avoid; }
          thead { display: table-header-group; } 
          tfoot { display: table-footer-group; } 
          
          .bg-gray-100 { background-color: #f3f4f6 !important; }
          .bg-blue-100 { background-color: #dbeafe !important; }
          .bg-orange-100 { background-color: #ffedd5 !important; }
          .text-blue-700 { color: #1d4ed8 !important; }
          .text-orange-700 { color: #c2410c !important; }
          .bg-green-100 { background-color: #dcfce7 !important; }
          .text-green-700 { color: #15803d !important; }
          .bg-red-100 { background-color: #fee2e2 !important; }
          .text-red-700 { color: #b91c1c !important; }
        }
      `}</style>
        </div>
    );
};
