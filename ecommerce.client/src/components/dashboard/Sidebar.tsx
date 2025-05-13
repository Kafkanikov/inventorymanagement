// src/components/dashboard/Sidebar.tsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ShoppingCart,
  Landmark, // Or LineChart for Sales
  Boxes,    // Or Archive for Inventory
  PlusCircle,
  PackagePlus, // Add Item
  Building, // Or Truck for Supplier
  Tag,      // Add Category
  ChevronDown,
  ChevronRight,
  LayoutDashboard, // For a general dashboard link
  Warehouse,
  User,
  Scale
} from 'lucide-react';
import { cn } from '@/lib/utils'; // from shadcn
import { useAuth } from '@/contexts/AuthContext';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isSubItem?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, isSubItem }) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <NavLink to={to}>
      {({ isActive: isNavLinkActive }) => ( // Use isNavLinkActive from NavLink for precise matching
        <Button
          variant={isNavLinkActive ? 'secondary' : 'ghost'}
          className={cn(
            'w-full justify-start',
            isSubItem ? 'pl-10' : 'pl-3' // Indent sub-items
          )}
        >
          <Icon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      )}
    </NavLink>
  );
};


export const Sidebar: React.FC = () => {
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.username === 'admin'; 

  // Automatically open "Add" section if a sub-route is active
  React.useEffect(() => {
    if (location.pathname.startsWith('/dashboard/add')) {
      setIsAddOpen(true);
    }
  }, [location.pathname]);

  return (
    <aside className="hidden border-r bg-muted/40 md:block md:w-64 lg:w-52 dark:bg-zinc-950">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <NavLink to="/dashboard" className="flex items-center gap-2 font-semibold">
            <LayoutDashboard className="h-6 w-6" />
            <span>Dashboard</span>
          </NavLink>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
            <NavItem to="/dashboard/purchases" icon={ShoppingCart} label="Purchases" />
            <NavItem to="/dashboard/sales" icon={Landmark} label="Sales" />
            <NavItem to="/dashboard/inventory" icon={Boxes} label="Inventory/Stock" />

            <Collapsible open={isAddOpen} onOpenChange={setIsAddOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start pl-3">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New
                  {isAddOpen ? <ChevronDown className="ml-auto h-4 w-4" /> : <ChevronRight className="ml-auto h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pt-1">
                <NavItem to="/dashboard/add/supplier" icon={Building} label="Supplier" isSubItem />
                <NavItem to="/dashboard/add/stock" icon={Warehouse} label="Stock Location" isSubItem />
                <NavItem to="/dashboard/add/category" icon={Tag} label="Category" isSubItem />
                <NavItem to="/dashboard/add/unit" icon={Scale} label="Unit" isSubItem />
                <NavItem to="/dashboard/add/item" icon={PackagePlus} label="Item" isSubItem />
                {isAdmin && <NavItem to="/dashboard/add/user" icon={User} label="User" isSubItem /> }
              </CollapsibleContent>
            </Collapsible>
          </nav>
        </div>
        {/* Optional: Footer in sidebar */}
      </div>
    </aside>
  );
};