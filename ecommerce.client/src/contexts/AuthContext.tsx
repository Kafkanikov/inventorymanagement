import React, {
    createContext,
    useState,
    useContext,
    useEffect,
    ReactNode,
    useCallback,
  } from 'react';
  import { LoginRequest, RegisterRequest, UserInfo, ApiError } from '../types/auth';
  
  // Define the shape of the context data
  interface AuthContextType {
    user: UserInfo | null;
    isAuthenticated: boolean;
    isLoading: boolean; // To show loading indicators
    error: string | null; // To display auth-related errors
    login: (credentials: LoginRequest) => Promise<boolean>;
    register: (details: RegisterRequest) => Promise<boolean>;
    logout: () => Promise<void>;
    checkAuthStatus: () => Promise<void>; // Add this function
  }
  
  // Create the context with a default value (usually null or an empty object)
  const AuthContext = createContext<AuthContextType | undefined>(undefined);
  
  // Define the props for the provider component
  interface AuthProviderProps {
    children: ReactNode;
  }
  
  const API_BASE_URL = '/api/auth'; // Adjust if your API proxy/route is different
  
  export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading initially
    const [error, setError] = useState<string | null>(null);
  
    // Function to check auth status (e.g., on page load)
    const checkAuthStatus = useCallback(async () => {
      // console.log('Checking auth status...');
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/status`, {
          method: 'GET',
          credentials: 'include', 
          headers: {
            'Accept': 'application/json',
          },
        });
  
        if (response.ok) {
          const data = await response.json();
          const userData : UserInfo = data.user;
          setUser(userData);
        } else if (response.status === 401) {
          // console.log('Auth status: Not authenticated');
          // This is expected if not logged in
          setUser(null);
        } else {
           const errorData: ApiError = await response.json();
           console.error('Auth status check failed:', response.status, errorData);
           setError(errorData.message || `Error checking status: ${response.statusText}`);
           setUser(null);
        }
      } catch (err) {
          console.error('Network or other error during auth status check:', err);
          setError('Failed to connect to server to check status.');
          setUser(null); // Assume not logged in if status check fails critically
      } finally {
          // console.log('Finished checking auth status.');
          setIsLoading(false);
      }
    }, []); // Empty dependency array means this function is stable
  
    // Check status when the provider mounts
    useEffect(() => {
      checkAuthStatus();
    }, [checkAuthStatus]); // Depend on the stable checkAuthStatus function
  
    // Login function
    const login = async (credentials: LoginRequest): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          credentials: 'include', // Include cookies for session management
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(credentials),
        });
  
        if (response.ok) {
          const data: UserInfo = await response.json();
          setUser(data);
          setIsLoading(false);
          return true; // Indicate success
        } else {
          const errorData: ApiError = await response.json();
          setError(errorData.message || `Login failed: ${response.statusText}`);
          setUser(null);
          setIsLoading(false);
          return false; // Indicate failure
        }
      } catch (err) {
        console.error("Login error:", err);
        setError('Network error during login.');
        setUser(null);
        setIsLoading(false);
        return false; // Indicate failure
      }
    };
  
    // Register function
    const register = async (details: RegisterRequest): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(details),
        });
  
        if (response.status === 201) { // Created
          // Optionally, you could log the user in automatically after registration
          // For now, just clear error and indicate success. Let them log in separately.
          // const data: UserInfo = await response.json(); // Contains user info
          setIsLoading(false);
          // Consider calling login() here or redirecting to login
          return true;
        } else {
          const errorData: ApiError = await response.json();
          setError(errorData.message || `Registration failed: ${response.statusText}`);
          setIsLoading(false);
          return false;
        }
      } catch (err) {
        console.error("Registration error:", err);
        setError('Network error during registration.');
        setIsLoading(false);
        return false;
      }
    };
  
    // Logout function
    const logout = async () => {
      setIsLoading(true); // Optional: show loading during logout
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          credentials: 'include', 
          // No body needed, relies on the session cookie being sent automatically
        });
  
        if (response.ok) {
          setUser(null); // Clear user state
        } else {
          // Handle logout errors (less common, maybe server issue)
          const errorData: ApiError = await response.json();
          setError(errorData.message || `Logout failed: ${response.statusText}`);
          // Keep user logged in state if logout fails? Or force clear?
          // setUser(null); // Decide on behavior here
        }
      } catch (err) {
         console.error("Logout error:", err);
         setError('Network error during logout.');
      } finally {
          setUser(null); // Ensure user is cleared client-side even if API call had issues
          setIsLoading(false);
      }
    };
  
    // Memoized value to prevent unnecessary re-renders
    const value = {
      user,
      isAuthenticated: !!user && !isLoading, // Only authenticated if not loading and user exists
      isLoading,
      error,
      login,
      register,
      logout,
      checkAuthStatus, // Expose checkAuthStatus if needed elsewhere
    };
  
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  };
  
  // Custom hook to easily consume the context
  export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  };