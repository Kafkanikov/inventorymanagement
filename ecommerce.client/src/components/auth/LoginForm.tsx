// src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner"; // Import useToast

interface LoginFormProps {
  onNavigateToRegister: () => void; // Function to call to show Register form
}

export const LoginForm: React.FC<LoginFormProps> = ( {onNavigateToRegister} ) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login({ username, password });
    if (!success) {
        // Error state is handled by the context, but we can show a toast
        toast.error( "Login Failed",
        {
            description: error || "Invalid username or password.", // Use context error
        });
    } else {
        // Optional: Show success toast or navigate away
        toast.success("Login Successful",
        {
             description: `Welcome back, ${username}!`,
        });
        // Maybe redirect user: history.push('/dashboard') or similar
        // Clear form fields after successful login?
        // setUsername('');
        // setPassword('');
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
             {/* Display context error directly if needed
             {error && <p className="text-sm font-medium text-destructive">{error}</p>}
             */}
          </div>
        </CardContent>
        <CardFooter className='flex flex-col space-y-2'>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
          <Button
            variant="link"
            type="button" // Important: prevent form submission
            onClick={onNavigateToRegister} // Call the passed function
            disabled={isLoading}
            className="p-0 h-auto" // Adjust styling for link-like appearance
          >
            Don't have an account? Register
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};