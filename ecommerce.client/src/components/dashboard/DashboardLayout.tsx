// src/components/dashboard/DashboardLayout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AuthStatus } from '../auth/AuthStatus'; // Assuming you want this visible
import { PanelLeftClose, PanelLeft, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';

export const DashboardLayout: React.FC = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <div className={`flex h-screen bg-background text-foreground transition-all duration-300 ease-in-out`}>
      
      <div className="hidden md:block">
        <Sidebar isExpanded={isSidebarExpanded} />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-muted/40 px-4 md:px-6 sticky top-0 z-30 dark:bg-zinc-900/50 main-layout-header-no-print shrink-0">
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden h-8 w-8">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              {/* Reuse the Sidebar component inside the sheet */}
              <Sidebar isExpanded={true} isMobile={true} />
            </SheetContent>
          </Sheet>

          <Button variant="outline" size="icon" onClick={toggleSidebar} className="hidden md:inline-flex h-8 w-8 md:h-9 md:w-9 no-print">
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