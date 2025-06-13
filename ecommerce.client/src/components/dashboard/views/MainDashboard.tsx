import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { SalesPerformance, DailySales } from '@/types/inventory';
import { Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { DashboardCard } from '../shared/DashboardCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesLineChart } from '../shared/SalesLineChart';

const SALES_PERFORMANCE_URL = '/api/sales/sales-performance-by-item';
const SALES_DAILY_URL = '/api/sales/daily-sales';


const fetchSalesPerformance = async (startDate: string, endDate: string): Promise<SalesPerformance> => {
    const response = await fetch(`${SALES_PERFORMANCE_URL}?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) {
        throw new Error('Failed to fetch sales performance data');
    }
    const data = await response.json();
    // Aggregate the data
    const totalRevenue = data.reduce((sum: number, item: any) => sum + item.totalRevenue, 0);
    const totalCOGS = data.reduce((sum: number, item: any) => sum + item.totalCOGS, 0);
    const totalUnitsSold = data.reduce((sum: number, item: any) => sum + item.unitsSold, 0);
    const totalProfit = totalRevenue - totalCOGS;

    return { totalRevenue, totalCOGS, totalProfit, totalUnitsSold };
};
const fetchDailySales = async (startDate: string, endDate: string): Promise<DailySales[]> => {
    const response = await fetch(`${SALES_DAILY_URL}?startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) {
        throw new Error('Failed to fetch daily sales data');
    }
    return response.json();
}

export const MainDashboard: React.FC = () => {
    const [todayPerformance, setTodayPerformance] = useState<SalesPerformance | null>(null);
    const [thisMonthPerformance, setThisMonthPerformance] = useState<SalesPerformance | null>(null);
    const [lastMonthPerformance, setLastMonthPerformance] = useState<SalesPerformance | null>(null);
    const [dailySales, setDailySales] = useState<DailySales[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [todayDateRange, setTodayDateRange] = useState({ start: '', end: '' });
    const [thisMonthDateRange, setThisMonthDateRange] = useState({ start: '', end: '' });
    const [lastMonthDateRange, setLastMonthDateRange] = useState({ start: '', end: '' });


    const loadPerformanceData = useCallback(async () => {
        setIsLoading(true);
        try {
            const today = new Date();
            const startOfTodayStr = format(startOfDay(today), 'yyyy-MM-dd');
            const endOfTodayStr = format(endOfDay(today), 'yyyy-MM-dd');

            const startOfThisMonthStr = format(startOfMonth(today), 'yyyy-MM-dd');
            const latestDayOfThisMonthStr = format(endOfMonth(today), 'yyyy-MM-dd');

            const lastMonth = subMonths(today, 1);
            const startOfLastMonthStr = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
            const endOfLastMonthStr = format(endOfMonth(lastMonth), 'yyyy-MM-dd');

            const startOfLast30Days = subMonths(today, 1);
            const startOfLast30DaysStr = format(startOfDay(startOfLast30Days), 'yyyy-MM-dd');
            const endOfLast30DaysStr = format(endOfDay(today), 'yyyy-MM-dd');

            setTodayDateRange({ start: startOfTodayStr, end: endOfTodayStr });
            setThisMonthDateRange({ start: startOfThisMonthStr, end: latestDayOfThisMonthStr });
            setLastMonthDateRange({ start: startOfLastMonthStr, end: endOfLastMonthStr });
            
            const [todayData, thisMonthData, lastMonthData, dailyData] = await Promise.all([
                fetchSalesPerformance(startOfTodayStr, endOfTodayStr),
                fetchSalesPerformance(startOfThisMonthStr, latestDayOfThisMonthStr),
                fetchSalesPerformance(startOfLastMonthStr, endOfLastMonthStr),
                fetchDailySales(startOfLast30DaysStr, endOfLast30DaysStr)
            ]);

            setTodayPerformance(todayData);
            setThisMonthPerformance(thisMonthData);
            setLastMonthPerformance(lastMonthData);

            const interval = eachDayOfInterval({
                start: subMonths(today, 1),
                end: today
            });

            const salesDataMap = new Map(dailyData.map(d => [format(new Date(d.date), 'yyyy-MM-dd'), d.totalRevenue]));

            const chartData = interval.map(date => {
                const dateString = format(date, 'yyyy-MM-dd');
                return {
                    date: format(date, 'MMM d'),
                    totalRevenue: salesDataMap.get(dateString) || 0,
                };
            });
            
            setDailySales(chartData);


        } catch (error) {
            toast.error("Error fetching performance data", {
                description: (error as Error).message,
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPerformanceData();
    }, [loadPerformanceData]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <DashboardCard title="Today's Sale" data={todayPerformance} startDate={todayDateRange.start} endDate={todayDateRange.end}/>
                <DashboardCard title="This Month's Sale" data={thisMonthPerformance} startDate={thisMonthDateRange.start} endDate={thisMonthDateRange.end}/>
                <DashboardCard title="Last Month's Sale" data={lastMonthPerformance} startDate={lastMonthDateRange.start} endDate={lastMonthDateRange.end}/>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Sales (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                    <SalesLineChart data={dailySales} />
                </CardContent>
            </Card>
        </div>
    );
};