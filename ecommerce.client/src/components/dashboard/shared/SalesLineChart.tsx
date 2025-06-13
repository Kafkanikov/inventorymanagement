import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SalesLineChartProps {
    data: { date: string, totalRevenue: number }[];
}

export const SalesLineChart: React.FC<SalesLineChartProps> = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value, name) => {
                    if (name === "totalRevenue") {
                        return [value, "Total Revenue"];
                    }
                    return [value, name];
                }}/>
                <Legend />
                <Line type="monotone" dataKey="totalRevenue" name="Total Revenue"  stroke="#7f7e94" activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    );
};