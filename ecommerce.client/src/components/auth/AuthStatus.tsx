// src/components/auth/AuthStatus.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; 
import { toast } from "sonner";
import { ModeToggle } from '../ui/ModeToggle';


export const AuthStatus: React.FC = () => {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const handleLogout = async () => {
    await logout();
    toast("Logged Out", {
      description: "You have been successfully logged out.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-4">
         <Skeleton className="h-8 w-[150px]" />
         <Skeleton className="h-8 w-[80px]" />
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4 p-4">
      {isAuthenticated && user && (
        <>
          <ModeToggle />
          <span>Welcome, {user.username}!</span>
          <Button variant="outline" onClick={handleLogout} disabled={isLoading}>
            Logout
          </Button>
        </>
      )}
    </div>
  );
};