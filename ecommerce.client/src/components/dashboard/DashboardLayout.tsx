// src/components/dashboard/DashboardLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AuthStatus } from '../auth/AuthStatus'; // Assuming you want this visible

export const DashboardLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-muted/40">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-muted/40 px-6 sticky top-0 z-30 dark:bg-zinc-950">
          {/* You can add a mobile nav toggle here */}
          <div className="flex-1">
            {/* Optional: Breadcrumbs or Page Title here */}
          </div>
          <AuthStatus /> {/* User status/logout */}
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8 overflow-auto">
          <Outlet /> {/* Content for each dashboard route will be rendered here */}
        </main>
      </div>
    </div>
  );
};