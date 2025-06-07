import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Printer, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ProfitLossReport, ProfitLossRequestParams, ProfitLossSection, ProfitLossSubGroup, ProfitLossAccountLine } from '@/types/financial';
import { ApiErrorResponse } from '@/types/inventory';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

const API_URL = '/api/accounting/profitloss';

export const ProfitLossView: React.FC = () => {
  const [reportParams, setReportParams] = useState<Omit<ProfitLossRequestParams, 'asOfDate'>>({
    reportCurrency: 'USD',
    khrtoReportCurrencyExchangeRate: 4150,
  });
  const [reportData, setReportData] = useState<ProfitLossReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParamChange = (field: keyof Omit<ProfitLossRequestParams, 'asOfDate'>, value: string | number | undefined | null) => {
    setReportParams(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const fetchReport = useCallback(async () => {
    const currentDate = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"); 

    if (!reportParams.reportCurrency) {
      toast.error("Validation Error", { description: "Report Currency is required." });
      return;
    }
    if (reportParams.khrtoReportCurrencyExchangeRate === null || reportParams.khrtoReportCurrencyExchangeRate === undefined || reportParams.khrtoReportCurrencyExchangeRate <= 0) {
        toast.warning("Input Warning", { description: "Exchange rate should be a positive number if mixing currencies." });
    }

    setIsLoading(true);
    setError(null);
    setReportData(null);

    const query = new URLSearchParams();
    query.append('asOfDate', currentDate); 
    query.append('reportCurrency', reportParams.reportCurrency);

    if (reportParams.khrtoReportCurrencyExchangeRate !== null && reportParams.khrtoReportCurrencyExchangeRate !== undefined) {
      query.append('khrToReportCurrencyExchangeRate', String(reportParams.khrtoReportCurrencyExchangeRate));
    }

    try {
      const response = await fetch(`${API_URL}?${query.toString()}`);
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({ message: `Server error: ${response.status}. Please check console for more details.` }));
        throw new Error(errorData.message || `Failed to fetch Profit & Loss report: ${response.statusText}`);
      }
      const data: ProfitLossReport = await response.json();
      setReportData(data);
      toast.success("Report Loaded", { description: `Profit & Loss for current period (as of ${new Date(data.asOfDate).toLocaleDateString()}) fetched.` });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      toast.error("Error Fetching Report", { description: errorMessage });
      console.error("Fetch Profit & Loss Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [reportParams.reportCurrency, reportParams.khrtoReportCurrencyExchangeRate]); 

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);


  const handlePrint = () => {
    window.print();
  };
  
  const renderAccountLine = (line: ProfitLossAccountLine, symbol: string, isSubItem: boolean = false) => (
    <TableRow key={line.accountNumber + line.accountName} className="text-xs hover:bg-muted/20">
      <TableCell className={`py-1 ${isSubItem ? 'pl-12' : 'pl-8'}`}>{line.accountNumber}</TableCell>
      <TableCell className="py-1">{line.accountName}</TableCell>
      <TableCell className="text-right py-1">
        {line.currentMonthAmount < 0 ? `(${formatCurrency(Math.abs(line.currentMonthAmount), symbol)})` : formatCurrency(line.currentMonthAmount, symbol)}
      </TableCell>
      <TableCell className="text-right py-1">
        {line.yearToDateAmount < 0 ? `(${formatCurrency(Math.abs(line.yearToDateAmount), symbol)})` : formatCurrency(line.yearToDateAmount, symbol)}
      </TableCell>
    </TableRow>
  );

  const renderSubGroup = (subGroup: ProfitLossSubGroup, symbol: string, isTopLevelSubGroup: boolean = false) => (
    <React.Fragment key={subGroup.subGroupName}>
      <TableRow className="bg-muted/30 hover:bg-muted/40">
        {/* If it's a top-level sub-group (like "Cost" under "Expenses"), make it stand out more */}
        <TableCell colSpan={2} className={`font-semibold py-1.5 text-xs ${isTopLevelSubGroup ? 'pl-4 text-sm' : 'pl-8'}`}>
            {subGroup.subGroupName}
        </TableCell>
        <TableCell className="text-right font-semibold py-1.5 text-xs">
          {subGroup.totalCurrentMonth < 0 ? `(${formatCurrency(Math.abs(subGroup.totalCurrentMonth), symbol)})` : formatCurrency(subGroup.totalCurrentMonth, symbol)}
        </TableCell>
        <TableCell className="text-right font-semibold py-1.5 text-xs">
          {subGroup.totalYearToDate < 0 ? `(${formatCurrency(Math.abs(subGroup.totalYearToDate), symbol)})` : formatCurrency(subGroup.totalYearToDate, symbol)}
        </TableCell>
      </TableRow>
      {subGroup.accounts.map(acc => renderAccountLine(acc, symbol, !isTopLevelSubGroup))}
    </React.Fragment>
  );

  // Renders accounts and sub-groups for a given section (Revenue, COGS, Operating Expenses)
  const renderSectionDetails = (section: ProfitLossSection, symbol: string) => (
    <>
      {section.accounts.map(acc => renderAccountLine(acc, symbol))}
      {section.subGroups.map(sg => renderSubGroup(sg, symbol, true))} {/* Pass true if these are primary sub-groups for the section */}
    </>
  );


  return (
    <div className="space-y-6 pb-10">
      <Card className="no-print">
        <CardHeader>
          <CardTitle>Profit & Loss Statement</CardTitle>
          <CardDescription>Report is automatically generated for the current date. You can adjust currency and exchange rate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="plReportCurrency">Report Currency*</Label>
              <Select
                value={reportParams.reportCurrency}
                onValueChange={(value) => handleParamChange('reportCurrency', value)}
              >
                <SelectTrigger id="plReportCurrency"><SelectValue placeholder="Select Currency" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="KHR">KHR (៛)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="plKhrExchangeRate">KHR per Foreign Unit Rate</Label>
              <Input
                id="plKhrExchangeRate"
                type="number"
                placeholder="e.g., 4150"
                value={reportParams.khrtoReportCurrencyExchangeRate ?? ''}
                onChange={(e) => handleParamChange('khrtoReportCurrencyExchangeRate', e.target.value === '' ? null : parseFloat(e.target.value))}
                step="any"
              />
               <p className="text-xs text-muted-foreground mt-1">Required if accounts have mixed currencies.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex flex-col justify-center items-center py-10 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
          <p className="text-lg text-muted-foreground">Loading report data...</p>
        </div>
      )}
      {error && !isLoading && (
        <Card className="border-destructive bg-red-50 dark:bg-red-900/20 no-print">
          <CardHeader className="flex flex-row items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Error Loading Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive-foreground">{error}</p>
            <Button onClick={fetchReport} variant="outline" className="mt-4">Refresh Data</Button>
          </CardContent>
        </Card>
      )}

      {reportData && !isLoading && (
        <Card className="print-container shadow-lg">
            <CardHeader className="border-b pb-4">
            <div className="flex flex-col items-center text-center mb-2 print-header-block">
                <h1 className="text-2xl font-bold print-main-title">Profit / Loss</h1>
                <h2 className="text-xl font-semibold print-report-title">{reportData.reportTitle}</h2>
                <p className="text-sm text-muted-foreground print-report-subtitle">
                    For the period ending {new Date(reportData.asOfDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                    <br/>
                    Reporting Currency: {reportData.reportingCurrencySymbol}
                    {reportParams.khrtoReportCurrencyExchangeRate && ` (Exchange Rate: ${reportParams.khrtoReportCurrencyExchangeRate} KHR per Foreign Unit)`}
                </p>
            </div>
            <div className="text-right no-print">
                <Button onClick={handlePrint} variant="outline" size="sm">
                    <Printer className="mr-2 h-4 w-4" /> Print / Export PDF
                </Button>
            </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 report-content-area">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-100 dark:bg-gray-800">
                            <TableHead className="w-[150px]">Account #</TableHead>
                            <TableHead>Account Name</TableHead>
                            <TableHead className="text-right w-[150px]">Current Month</TableHead>
                            <TableHead className="text-right w-[150px]">Year to Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Revenue Section */}
                        <TableRow className="bg-slate-100 dark:bg-slate-800"><TableCell colSpan={4} className="font-semibold text-sm py-1.5 pl-2">Revenue</TableCell></TableRow>
                        {renderSectionDetails(reportData.revenueSection, reportData.reportingCurrencySymbol)}
                        <TableRow className="bg-gray-200 dark:bg-gray-700 font-bold text-sm">
                            <TableCell colSpan={2} className="py-2 pl-4">Total Revenue</TableCell>
                            <TableCell className="text-right py-2">{formatCurrency(reportData.revenueSection.totalCurrentMonth, reportData.reportingCurrencySymbol)}</TableCell>
                            <TableCell className="text-right py-2">{formatCurrency(reportData.revenueSection.totalYearToDate, reportData.reportingCurrencySymbol)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={4} className="py-3"></TableCell>
                        </TableRow>
                        {/* Cost of Goods Sold Section */}
                        {/* Expenses Section - Combining COGS and Operating Expenses */}
                        <TableRow className="bg-slate-100 dark:bg-slate-800 mt-4"><TableCell colSpan={4} className="font-semibold text-sm py-1.5 pl-2">Expenses</TableCell></TableRow>
                        {/* Render COGS accounts/subgroups first if they exist */}
                        { (reportData.costOfGoodsSoldSection.accounts.length > 0 || reportData.costOfGoodsSoldSection.subGroups.length > 0) &&
                            renderSectionDetails(reportData.costOfGoodsSoldSection, reportData.reportingCurrencySymbol)
                        }
                        {/* Then render Operating Expense accounts/subgroups */}
                        { (reportData.operatingExpenseSection.accounts.length > 0 || reportData.operatingExpenseSection.subGroups.length > 0) &&
                            renderSectionDetails(reportData.operatingExpenseSection, reportData.reportingCurrencySymbol)
                        }
                        <TableRow className="bg-gray-200 dark:bg-gray-700 font-bold text-sm">
                            <TableCell colSpan={2} className="py-2 pl-4">Total Expenses</TableCell>
                            <TableCell className="text-right py-2">
                                {formatCurrency(reportData.costOfGoodsSoldSection.totalCurrentMonth + reportData.operatingExpenseSection.totalCurrentMonth, reportData.reportingCurrencySymbol)}
                            </TableCell>
                            <TableCell className="text-right py-2">
                                {formatCurrency(reportData.costOfGoodsSoldSection.totalYearToDate + reportData.operatingExpenseSection.totalYearToDate, reportData.reportingCurrencySymbol)}
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={4} className="py-3"></TableCell>
                        </TableRow>
                        {/* Net Income */}
                        <TableRow className="bg-gray-300 dark:bg-gray-600 font-bold text-base mt-4">
                            <TableCell colSpan={2} className="py-2.5 pl-2">Net Income / (Loss)</TableCell>
                            <TableCell className="text-right py-2.5">
                                {reportData.netIncomeCurrentMonth < 0 ? `(${formatCurrency(Math.abs(reportData.netIncomeCurrentMonth), reportData.reportingCurrencySymbol)})` : formatCurrency(reportData.netIncomeCurrentMonth, reportData.reportingCurrencySymbol)}
                            </TableCell>
                            <TableCell className="text-right py-2.5">
                                {reportData.netIncomeYearToDate < 0 ? `(${formatCurrency(Math.abs(reportData.netIncomeYearToDate), reportData.reportingCurrencySymbol)})` : formatCurrency(reportData.netIncomeYearToDate, reportData.reportingCurrencySymbol)}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}
      <style>{`
        
        @media print {
          .main-layout-header-no-print, 
          .main-sidebar-no-print,       
          .no-print { 
            display: none !important; 
          }
          body, html { 
            margin: 0; 
            padding: 0; 
            -webkit-print-color-adjust: exact !important; 
            color-adjust: exact !important; 
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
          .bg-gray-200 { background-color: #e5e7eb !important; }
          .bg-gray-300 { background-color: #d1d5db !important; }
          .bg-slate-100 { background-color: #f1f5f9 !important; }
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
