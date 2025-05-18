"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { loginFormSchema } from "@/schemas/auth";
import { useFetchWithCSRF } from "@/hooks/useFetchWithCSRF";
import { AlertCircle, Lock, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [csrfError, setCsrfError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState<{ username: boolean; password: boolean }>({
    username: false,
    password: false,
  });
  const pathname = usePathname();

  // Use our auth context
  const { setUserAndToken, isLoading, error, clearError } = useAuth();

  // Use CSRF protection
  const { fetchWithCSRF, loading: csrfLoading, error: csrfHookError } = useFetchWithCSRF();

  // Update CSRF error when hook error changes
  useEffect(() => {
    if (csrfHookError) {
      setCsrfError(csrfHookError);
    }
  }, [csrfHookError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setCsrfError(null);

    // Check if CSRF token is still loading, but don't block the request
    if (csrfLoading) {
      console.log('CSRF token is still loading, proceeding with login anyway...');
    }

    // If there was a CSRF error, warn but proceed
    if (csrfHookError) {
      console.warn('CSRF error detected:', csrfHookError);
      setCsrfError(`Security warning: ${csrfHookError}. Attempting to log in anyway.`);
    }

    try {
      // Validate form data with Zod
      const validationResult = loginFormSchema.safeParse({
        username,
        password,
        rememberMe
      });

      if (!validationResult.success) {
        // Handle validation errors
        const errors: Record<string, string> = {};
        validationResult.error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        return;
      }

      // Clear validation errors
      setValidationErrors({});

      // Make login request with CSRF protection
      const response = await fetchWithCSRF('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store user and token in auth context
        setUserAndToken(data.user, data.token);
      } else {
        clearError();
        setCsrfError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setCsrfError('Network error. Please check your connection and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(209,221,209)] p-6 md:p-8">
      {/* Navigation Bar */}
      <nav className="bg-[#a9c7a9] rounded-2xl shadow-md p-4 md:p-6 mb-10 transition-all duration-300 hover:shadow-lg">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-xl md:text-2xl font-bold text-[#003300] mb-4 md:mb-0">
            Government Nutrition Program
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <NavLink href="/" isActive={pathname === "/"}>
              Home
            </NavLink>
            <NavLink href="/about" isActive={pathname === "/about"}>
              About Program
            </NavLink>
            <NavLink href="/gazette" isActive={pathname === "/gazette"}>
              Gazette
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl flex flex-col md:flex-row bg-white">
          {/* Left side - Image */}
          <div 
            className="w-full md:w-[35%] h-48 md:h-auto bg-[url('/images/login_page/image.jpg')] bg-cover bg-center"
            aria-hidden="true"
          ></div>
          
          {/* Right side - Login Form */}
          <div className="w-full md:w-[65%] p-6 md:p-10 bg-white">
            <div className="max-w-md mx-auto">
              <h1 className="text-2xl md:text-3xl font-bold text-[#003300] mb-6">Welcome Back</h1>
              <p className="text-gray-600 mb-8">Please sign in to access your account</p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1">
                  <label 
                    htmlFor="username" 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Username
                  </label>
                  <div className={`relative rounded-md shadow-sm transition-all duration-200 ${
                    validationErrors.username 
                      ? 'ring-2 ring-red-500' 
                      : isFocused.username 
                        ? 'ring-2 ring-green-500' 
                        : ''
                  }`}>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setIsFocused(prev => ({ ...prev, username: true }))}
                      onBlur={() => setIsFocused(prev => ({ ...prev, username: false }))}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none text-gray-900"
                      placeholder="Enter your username"
                      aria-invalid={!!validationErrors.username}
                      aria-describedby={validationErrors.username ? "username-error" : undefined}
                    />
                  </div>
                  {validationErrors.username && (
                    <p 
                      className="mt-2 text-sm text-red-600 flex items-center" 
                      id="username-error"
                    >
                      <AlertCircle size={16} className="mr-1" />
                      {validationErrors.username}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label 
                    htmlFor="password" 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password
                  </label>
                  <div className={`relative rounded-md shadow-sm transition-all duration-200 ${
                    validationErrors.password 
                      ? 'ring-2 ring-red-500' 
                      : isFocused.password 
                        ? 'ring-2 ring-green-500' 
                        : ''
                  }`}>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setIsFocused(prev => ({ ...prev, password: true }))}
                      onBlur={() => setIsFocused(prev => ({ ...prev, password: false }))}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none text-gray-900"
                      placeholder="Enter your password"
                      aria-invalid={!!validationErrors.password}
                      aria-describedby={validationErrors.password ? "password-error" : undefined}
                    />
                  </div>
                  {validationErrors.password && (
                    <p 
                      className="mt-2 text-sm text-red-600 flex items-center" 
                      id="password-error"
                    >
                      <AlertCircle size={16} className="mr-1" />
                      {validationErrors.password}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                  <div>
                    <Link 
                      href="/change_password" 
                      className="text-sm font-medium text-green-700 hover:text-green-800 transition-colors"
                    >
                      Change Password
                    </Link>
                  </div>
                </div>

                {(error || csrfError) && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start" role="alert">
                    <AlertCircle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
                    <span>{error || csrfError}</span>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`
                      w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-black
                      ${isLoading 
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-[#f8e58c] hover:bg-[#f5dc6c] active:bg-[#f0d24c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-200'
                      }
                    `}
                    aria-busy={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging in...
                      </>
                    ) : (
                      <>
                        Login
                        <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable NavLink component
function NavLink({ href, isActive, children }: { href: string; isActive: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className="group">
      <span 
        className={`
          inline-block py-2 px-4 rounded-full text-sm font-bold transition-all duration-300
          ${isActive 
            ? "bg-[rgb(241,163,208)] border-[3px] border-red-600 text-black transform scale-105" 
            : "bg-white text-black hover:bg-[rgb(199,150,150)]"
          }
        `}
      >
        {children}
      </span>
    </Link>
  );
}
