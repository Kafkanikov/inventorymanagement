// src/components/dashboard/DashboardLayout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AuthStatus } from '../auth/AuthStatus'; // Assuming you want this visible
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '../ui/ModeToggle';

export const DashboardLayout: React.FC = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <div className={`flex h-screen bg-background text-foreground transition-all duration-300 ease-in-out`}>
      <Sidebar isExpanded={isSidebarExpanded} />
      <div className="flex flex-col flex-1 overflow-hidden"> {/* Added overflow-hidden */}
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-muted/40 px-4 md:px-6 sticky top-0 z-30 dark:bg-zinc-900/50 main-layout-header-no-print shrink-0">
          <Button variant="outline" size="icon" onClick={toggleSidebar} className="h-8 w-8 md:h-9 md:w-9 no-print">
            {isSidebarExpanded ? <PanelLeftClose className="h-4 w-4 md:h-5 md:w-5" /> : <PanelLeft className="h-4 w-4 md:h-5 md:w-5" />}
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          <div className="flex-1">
            {/* Optional: Breadcrumbs or Page Title here */}
          </div>
          <div className="flex items-center gap-2">
            <AuthStatus />
          </div>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-4 md:gap-8 overflow-auto bg-muted/20 dark:bg-zinc-950/30">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};