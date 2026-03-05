import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authAPI } from '../lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage fallback
const LOCAL_AUTH_KEY = 'allegra_auth';
const DEFAULT_PASSWORD = 'allegra2026';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);

  useEffect(() => {
    // Check if user was previously authenticated
    const wasAuthenticated = localStorage.getItem(LOCAL_AUTH_KEY) === 'true';
    if (wasAuthenticated) {
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (password: string): Promise<boolean> => {
    try {
      // Try backend first
      const result = await authAPI.login(password);
      if (result.success) {
        setIsAuthenticated(true);
        localStorage.setItem(LOCAL_AUTH_KEY, 'true');
        setBackendAvailable(true);
        return true;
      }
      return false;
    } catch (error: any) {
      // Check if it's a backend offline error (not a real error)
      if (error.message === 'BACKEND_OFFLINE') {
        setBackendAvailable(false);
        
        // Fallback to local authentication
        if (password === DEFAULT_PASSWORD) {
          setIsAuthenticated(true);
          localStorage.setItem(LOCAL_AUTH_KEY, 'true');
          return true;
        }
        return false;
      }
      
      // For other errors, also try local auth as fallback
      console.log('💾 Usando autenticación local');
      if (password === DEFAULT_PASSWORD) {
        setIsAuthenticated(true);
        localStorage.setItem(LOCAL_AUTH_KEY, 'true');
        return true;
      }
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(LOCAL_AUTH_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}