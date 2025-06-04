import React from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ShoppingCart,
  Landmark, 
  Boxes,    
  PlusCircle,
  PackagePlus, 
  Building, 
  Tag,      
  ChevronDown,
  ChevronRight,
  LayoutDashboard, 
  Warehouse,
  User,
  Scale,
  FileSpreadsheetIcon, 
  BookOpen,
  BanknoteArrowUpIcon,
  Banknote, // Added new icon
  NotebookPenIcon, // Added new icon
  Scale3D,
  TrendingUp
  // CurrencyIcon, // Not used in the provided code, can be removed if not needed
  // Ban // Not used in the provided code, can be removed if not needed
} from 'lucide-react';
import { cn } from '@/lib/utils'; 
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isSubItem?: boolean;
  exact?: boolean; 
  isExpanded: boolean; 
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, isSubItem, exact = false, isExpanded }) => {
  const location = useLocation();
  const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);

  const content = (
    <>
      <Icon className={cn(
          "h-5 w-5", 
          isExpanded ? "mr-2" : "mx-auto", 
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary transition-colors"
      )} />
      {isExpanded && <span className="truncate">{label}</span>}
    </>
  );

  return (
    <NavLink to={to} end={exact} title={!isExpanded ? label : undefined}> 
      {({ isActive: navLinkIsActive }) => ( 
        <Button
          variant={navLinkIsActive ? 'secondary' : 'ghost'}
          className={cn(
            'w-full justify-start group text-sm h-auto py-2', 
            isSubItem && isExpanded ? 'pl-10' : isSubItem && !isExpanded ? 'pl-0 justify-center' : isExpanded ? 'pl-3' : 'pl-0 justify-center',
            navLinkIsActive && 'font-semibold',
            !isExpanded && 'px-2.5' 
          )}
        >
          {isExpanded ? content : (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={5}>
                  <p>{label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Button>
      )}
    </NavLink>
  );
};

interface SidebarProps {
  isExpanded: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isExpanded }) => {
  // Combined state for collapsible sections
  const [openCollapsibleSections, setOpenCollapsibleSections] = React.useState<Record<string, boolean>>({
    reports: false,
    manage: false,
    finance: false, // Added finance section state
  });
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.username?.toLowerCase() === 'admin';

  React.useEffect(() => {
    if (isExpanded) {
      setOpenCollapsibleSections(prev => ({
        ...prev,
        manage: location.pathname.startsWith('/dashboard/add'),
        reports: location.pathname.startsWith('/dashboard/reports'),
        finance: location.pathname.startsWith('/dashboard/finance'), // Adjust if finance has more routes
      }));
    } else {
      // When sidebar collapses, close all sections to prevent them from being "open" without visible content
      setOpenCollapsibleSections({ reports: false, manage: false, finance: false });
    }
  }, [location.pathname, isExpanded]);

  const toggleCollapsible = (section: 'reports' | 'manage' | 'finance') => {
    if (isExpanded) { 
        setOpenCollapsibleSections(prev => ({...prev, [section]: !prev[section]}));
    }
  };

  return (
    <aside className={cn(
        "hidden border-r bg-muted/40 md:flex md:flex-col print:hidden transition-all duration-300 ease-in-out dark:bg-zinc-900/50",
        isExpanded ? "md:w-60 lg:w-64" : "md:w-16"
      )}>
      <div className={cn(
          "flex h-14 items-center border-b lg:h-[60px] transition-all duration-300 ease-in-out",
          isExpanded ? "px-4 lg:px-6" : "px-2.5 justify-center" 
        )}>
        <Link to="/dashboard" className={cn(
            "flex items-center gap-2 font-semibold text-primary hover:text-primary/90 transition-colors",
            !isExpanded && "justify-center"
          )}>
          <LayoutDashboard className={cn("h-6 w-6", !isExpanded && "h-7 w-7")} />
          {isExpanded && <span className="text-lg">IMS</span>}
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className={cn(
            "grid items-start py-2 text-sm font-medium gap-0.5",
            isExpanded ? "px-2 lg:px-4" : "px-1.5"
          )}>
          <NavItem to="/dashboard/inventory" icon={Boxes} label="Inventory & Stock" isExpanded={isExpanded}/>
          <NavItem to="/dashboard/purchases" icon={ShoppingCart} label="Purchases" isExpanded={isExpanded}/>
          <NavItem to="/dashboard/sales" icon={BanknoteArrowUpIcon} label="Sales" isExpanded={isExpanded}/>
          
          {/* Financial Reports Collapsible Section */}
          <Collapsible open={isExpanded && openCollapsibleSections.reports} onOpenChange={() => toggleCollapsible('reports')} className="mt-1">
            <CollapsibleTrigger asChild disabled={!isExpanded}>
              <Button variant="ghost" className={cn(
                  "w-full justify-start text-sm hover:bg-accent/50",
                  isExpanded ? "pl-3" : "pl-0 justify-center px-2.5 py-2 h-auto"
                )}
                title={!isExpanded ? "Financial Reports" : undefined}
              >
                <FileSpreadsheetIcon className={cn("h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors", isExpanded ? "mr-2" : "mx-auto")} />
                {isExpanded && "Financial Reports"}
                {isExpanded && (openCollapsibleSections.reports ? <ChevronDown className="ml-auto h-4 w-4 opacity-70" /> : <ChevronRight className="ml-auto h-4 w-4 opacity-70" />)}
              </Button>
            </CollapsibleTrigger>
            {isExpanded && ( // Only render content if sidebar is expanded
              <CollapsibleContent className="space-y-0.5 pt-1 animate-in fade-in-50 zoom-in-95">
                <NavItem to="/dashboard/reports/balance" icon={Scale} label="BL Sheet / Trial BL" isSubItem isExpanded={isExpanded} exact={true} />
                <NavItem to="/dashboard/reports/profit-loss-report" icon={TrendingUp} label="Profit / Loss" isSubItem isExpanded={isExpanded} exact={true} />
              </CollapsibleContent>
            )}
          </Collapsible>

          {/* Finance Collapsible Section (Journal Ledger) */}
          <Collapsible open={isExpanded && openCollapsibleSections.finance} onOpenChange={() => toggleCollapsible('finance')} className="mt-1">
            <CollapsibleTrigger asChild disabled={!isExpanded}>
              <Button variant="ghost" className={cn(
                  "w-full justify-start text-sm hover:bg-accent/50",
                  isExpanded ? "pl-3" : "pl-0 justify-center px-2.5 py-2 h-auto"
                )}
                title={!isExpanded ? "Finance" : undefined}
              >
                <Banknote className={cn("h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors", isExpanded ? "mr-2" : "mx-auto")} />
                {isExpanded && "Finance"}
                {isExpanded && (openCollapsibleSections.finance ? <ChevronDown className="ml-auto h-4 w-4 opacity-70" /> : <ChevronRight className="ml-auto h-4 w-4 opacity-70" />)}
              </Button>
            </CollapsibleTrigger>
            {isExpanded && (
              <CollapsibleContent className="space-y-0.5 pt-1 animate-in fade-in-50 zoom-in-95">
                <NavItem to="/dashboard/finance/journal" icon={NotebookPenIcon} label="Journal Ledger" isSubItem isExpanded={isExpanded} exact={true} />
              </CollapsibleContent>
            )}
          </Collapsible>

          {/* Manage Entities Collapsible Section */}
          <Collapsible open={isExpanded && openCollapsibleSections.manage} onOpenChange={() => toggleCollapsible('manage')} className="mt-1">
            <CollapsibleTrigger asChild disabled={!isExpanded}>
              <Button variant="ghost" className={cn(
                  "w-full justify-start text-sm hover:bg-accent/50",
                  isExpanded ? "pl-3" : "pl-0 justify-center px-2.5 py-2 h-auto"
                )}
                title={!isExpanded ? "Manage Entities" : undefined}
                >
                <PlusCircle className={cn("h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors", isExpanded ? "mr-2" : "mx-auto")} />
                {isExpanded && "Manage Entities"}
                {isExpanded && (openCollapsibleSections.manage ? <ChevronDown className="ml-auto h-4 w-4 opacity-70" /> : <ChevronRight className="ml-auto h-4 w-4 opacity-70" />)}
              </Button>
            </CollapsibleTrigger>
            {isExpanded && ( // Only render content if sidebar is expanded
              <CollapsibleContent className="space-y-0.5 pt-1 animate-in fade-in-50 zoom-in-95">
                <NavItem to="/dashboard/add/item" icon={PackagePlus} label="Items & Packaging" isSubItem isExpanded={isExpanded} exact={true}/>
                <NavItem to="/dashboard/add/category" icon={Tag} label="Categories" isSubItem isExpanded={isExpanded} exact={true}/>
                <NavItem to="/dashboard/add/unit" icon={Scale} label="Units" isSubItem isExpanded={isExpanded} exact={true}/>
                <NavItem to="/dashboard/add/supplier" icon={Building} label="Suppliers" isSubItem isExpanded={isExpanded} exact={true}/>
                <NavItem to="/dashboard/add/stock" icon={Warehouse} label="Stock Locations" isSubItem isExpanded={isExpanded} exact={true}/>
                {isAdmin && <NavItem to="/dashboard/add/user" icon={User} label="Users" isSubItem isExpanded={isExpanded} exact={true}/> }
              </CollapsibleContent>
            )}
          </Collapsible>
        </nav>
      </div>
    </aside>
  );
};
