"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { loginFormSchema } from "@/schemas/auth";
import { z } from "zod";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const pathname = usePathname();

  // Use our auth context
  const { login, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

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

      // Call login from auth context
      await login(username, password);

    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="max-w-full min-h-[110vh] p-[30px_20px_20px] bg-[rgb(209,221,209)]">
      {/* Navigation Bar */}
      <nav className="flex justify-between items-center p-[15px_25px] mt-[15px] mb-[40px] bg-[#a9c7a9] rounded-[15px] shadow-[0_4px_10px_rgba(0,0,0,0.15)]">
        <div className="text-[20px] font-bold text-[#003300]">
          Government Nutrition Program
        </div>
        <div className="flex gap-[15px]">
          <Link
            href="/"
            className={`no-underline ${pathname === "/" ? "" : ""}`}
          >
            <span className={`inline-block p-[5px_15px] ${pathname === "/" ? "bg-[rgb(241,163,208)] border-[5px] border-red-600 text-black" : "bg-white text-black"} rounded-[20px] text-[14px] font-bold transition-all duration-200 hover:bg-[rgb(199,150,150)]`}>
              Home
            </span>
          </Link>
          <Link
            href="/about"
            className={`no-underline ${pathname === "/about" ? "" : ""}`}
          >
            <span className={`inline-block p-[5px_15px] ${pathname === "/about" ? "bg-[rgb(241,163,208)] border-[5px] border-red-600 text-black" : "bg-white text-black"} rounded-[20px] text-[14px] font-bold transition-all duration-200 hover:bg-[rgb(199,150,150)]`}>
              About Program
            </span>
          </Link>
          <Link
            href="/gazette"
            className={`no-underline ${pathname === "/gazette" ? "" : ""}`}
          >
            <span className={`inline-block p-[5px_15px] ${pathname === "/gazette" ? "bg-[rgb(241,163,208)] border-[5px] border-red-600 text-black" : "bg-white text-black"} rounded-[20px] text-[14px] font-bold transition-all duration-200 hover:bg-[rgb(199,150,150)]`}>
              Gazette
            </span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex justify-center items-center min-h-[calc(100vh-180px)]">
        <div className="w-[800px] h-[500px] bg-[url('/images/login_page/image.jpg')] bg-cover bg-center bg-no-repeat rounded-[5px] overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.2)] flex justify-end">
          <div className="w-[65%] flex justify-center items-center">
            <div className="w-[90%] p-[30px] flex flex-col justify-center bg-[rgba(255,255,255,0.8)] rounded-[5px]">
              <form onSubmit={handleSubmit}>
                <div className="mb-[20px]">
                  <label htmlFor="username" className="block mb-[5px] font-bold text-black">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className={`w-full p-[10px] border-[3px] ${validationErrors.username ? 'border-red-500' : 'border-black'} rounded-[3px] text-[16px]`}
                  />
                  {validationErrors.username && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.username}</p>
                  )}
                </div>

                <div className="mb-[20px]">
                  <label htmlFor="password" className="block mb-[5px] font-bold text-black">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`w-full p-[10px] border-[3px] ${validationErrors.password ? 'border-red-500' : 'border-black'} rounded-[3px] text-[16px]`}
                  />
                  {validationErrors.password && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
                  )}
                </div>

                <div className="flex justify-between items-center mb-[20px]">
                  <label className="flex items-center text-black">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="mr-1"
                    />
                    {" "}Remember me
                  </label>
                  <Link href="/forgot-password" className="no-underline text-black hover:underline">
                    Forgot password
                  </Link>
                </div>

                {error && (
                  <div className="bg-[#ffebee] text-[#d32f2f] p-[10px] rounded-[4px] mb-[15px] border border-[#f5c6cb] text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className={`p-[10px] ${isLoading ? 'bg-[#ccc] cursor-not-allowed' : 'bg-[#f8e58c] hover:bg-[#f5dc6c] cursor-pointer'} border-[3px] border-black rounded-[8px] text-black font-bold text-[16px] w-full`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}