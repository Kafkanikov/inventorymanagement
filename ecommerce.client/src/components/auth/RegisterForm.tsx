// src/components/auth/RegisterForm.tsx
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
import { toast } from "sonner";

interface RegisterFormProps {
    onNavigateToLogin: () => void; // Function to call to show Login form
}

export const RegisterForm: React.FC<RegisterFormProps> = ( {onNavigateToLogin}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const { register, isLoading, error } = useAuth(); // Use register function

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await register({ username, password, email: email || null }); // Pass email or null
    if (success) {
        toast.success("Registration Successful",
        {
            description: "Your account has been created. You can now log in.",
        });
        onNavigateToLogin(); 
        setUsername('');
        setPassword('');
        setEmail('');
    } else {
         toast.error( "Registration Failed",
        {
            description: error || "Could not create account.", // Use context error
        });
        setUsername('');
        setPassword('');
        setEmail('');
    }
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>Create a new account.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="reg-username">Username</Label>
              <Input
                id="reg-username"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
             <div className="flex flex-col space-y-1.5">
              <Label htmlFor="reg-email">Email (Optional)</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                type="password"
                placeholder="Choose a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className='flex flex-col space-y-2'>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Registering...' : 'Register'}
          </Button>
          <Button
            variant="link"
            type="button" // Important: prevent form submission
            onClick={onNavigateToLogin} // Call the passed function
            disabled={isLoading}
            className="p-0 h-auto" // Adjust styling for link-like appearance
          >
            Already have an account? Login
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};