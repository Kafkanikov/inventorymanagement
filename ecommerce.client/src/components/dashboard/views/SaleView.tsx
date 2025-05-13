// src/components/dashboard/views/PurchasesView.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const SaleView: React.FC = () => {
  return (
    <Card>
      <CardHeader><CardTitle>Sales</CardTitle></CardHeader>
      <CardContent><p>Sale records and management will be here.</p></CardContent>
    </Card>
  );
};