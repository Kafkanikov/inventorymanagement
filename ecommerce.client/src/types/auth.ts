// Matches the LoginRequest C# class
export interface LoginRequest {
    username: string;
    password?: string; // Password might not always be needed client-side after login
}
  
// Matches the RegisterRequest C# class
export interface RegisterRequest {
    username: string;
    password?: string;
    email?: string | null; // Match C# nullable string
}

// Matches the UserInfo structure returned by the API
export interface UserInfo {
    id: number;
    username: string;
    email?: string | null;
}

// Structure for API error responses
export interface ApiError {
    message: string;
}