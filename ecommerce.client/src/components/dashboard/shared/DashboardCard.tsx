import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible } from '@/components/ui/collapsible';
import { SalesPerformance } from '@/types/inventory';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { cn } from '@/lib/utils';
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DropdownMenu } from '@radix-ui/react-dropdown-menu';

const formatCurrency = (amount: number, currency: string) => {
    const currencyCode = currency === '$' ? 'USD' : currency;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
    }).format(amount);
};


interface DashboardCardProps {
    title: string;
    data: SalesPerformance | null;
    startDate: string;
    endDate: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ title, data, startDate, endDate }) => {
    const [isOpen, setIsOpen] = useState(false);

    const displayDate = () => {
        if (title === "Today's Sale") {
            return formatDate(new Date(startDate), 'PPP');
        }
        return `${formatDate(new Date(startDate), 'MMM d, yyyy')} - ${formatDate(new Date(endDate), 'MMM d, yyyy')}`;
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card className={cn(
                "relative shadow-lg hover:shadow-xl transition-shadow duration-300",
                isOpen ? "rounded-t-md rounded-b-none" : "rounded-md"// Only top rounding when open, full rounding when closed
            )}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-muted-foreground">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    {data ? (
                        <>
                            <p className="text-4xl font-bold text-primary">{formatCurrency(data.totalRevenue, '$')}</p>
                            <p className="text-sm text-muted-foreground">{displayDate()}</p>
                        </>
                    ) : (
                        <p className="text-lg text-muted-foreground">No data available.</p>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="z-20 relative">
                                {isOpen ? 'Hide Details' : 'Show Details'}
                                {isOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {data ? (
                            <>
                                <DropdownMenuItem>
                                    <p><strong>Total Revenue:</strong> {formatCurrency(data.totalRevenue, '$')}</p>
                                </DropdownMenuItem><DropdownMenuItem>
                                        <p><strong>Total COGS:</strong> {formatCurrency(data.totalCOGS, '$')}</p>
                                    </DropdownMenuItem><DropdownMenuItem>
                                        <p><strong>Total Profit:</strong> {formatCurrency(data.totalProfit, '$')}</p>
                                    </DropdownMenuItem><DropdownMenuItem>
                                        <p><strong>Total Units Sold:</strong> {data.totalUnitsSold}</p>
                                    </DropdownMenuItem>
                            </>
                            ):( 
                            <>
                                <DropdownMenuItem>
                                    <p>No details to show.</p>
                                </DropdownMenuItem>
                            </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardFooter>
            </Card>
        </Collapsible>
    );
};
