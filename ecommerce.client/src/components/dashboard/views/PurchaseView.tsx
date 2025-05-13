// src/components/dashboard/views/PurchasesView.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const PurchaseView: React.FC = () => {
  return (
    <Card>
      <CardHeader><CardTitle>Purchases</CardTitle></CardHeader>
      <CardContent><p>Purchase records and management will be here.</p></CardContent>
    </Card>
  );
};