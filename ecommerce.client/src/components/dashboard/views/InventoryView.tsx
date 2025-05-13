// src/components/dashboard/views/InventoryView.tsx
import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data for now
const mockInventory = [
  { id: '1', name: 'Laptop Pro', category: 'Electronics', stock: 25, unit: 'pieces' },
  { id: '2', name: 'Organic Apples', category: 'Groceries', stock: 150, unit: 'kg' },
  { id: '3', name: 'Cotton T-Shirt', category: 'Apparel', stock: 300, unit: 'pieces' },
  { id: '4', name: 'Office Chair', category: 'Furniture', stock: 15, unit: 'units' },
  { id: '5', name: 'Mineral Water', category: 'Beverages', stock: 500, unit: 'bottles (1L)' },
];

export const InventoryView: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory / Stock</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>A list of your current inventory.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Unit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockInventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell className="text-right">{item.stock}</TableCell>
                <TableCell>{item.unit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};