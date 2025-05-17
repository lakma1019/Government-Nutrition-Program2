"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { passwordResetSchema } from "@/schemas/auth";
import { useFetchWithCSRF } from "@/hooks/useFetchWithCSRF";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [csrfError, setCsrfError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

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
    setCsrfError(null);
    setSuccessMessage(null);

    // Check if CSRF token is still loading, but don't block the request
    if (csrfLoading) {
      console.log('CSRF token is still loading, proceeding with password reset anyway...');
    }

    // If there was a CSRF error, warn but proceed
    if (csrfHookError) {
      console.warn('CSRF error detected:', csrfHookError);
      setCsrfError(`Security warning: ${csrfHookError}. Attempting to Change Password anyway.`);
    }

    try {
      // Validate form data with Zod
      const validationResult = passwordResetSchema.safeParse({
        username,
        oldPassword,
        newPassword,
        confirmPassword
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

      // Make password reset request with CSRF protection
      const response = await fetchWithCSRF('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          oldPassword, 
          newPassword 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMessage('Password reset successful! Redirecting to login page...');
        
        // Clear form
        setUsername("");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setCsrfError(data.message || 'Password reset failed');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setCsrfError('Network error. Please check your connection and try again.');
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
        <div className="w-[800px] h-[600px] bg-[url('/images/login_page/image.jpg')] bg-cover bg-center bg-no-repeat rounded-[5px] overflow-hidden shadow-[0_4px_8px_rgba(0,0,0,0.2)] flex justify-end">
          <div className="w-[65%] flex justify-center items-center">
            <div className="w-[90%] p-[30px] flex flex-col justify-center bg-[rgba(255,255,255,0.8)] rounded-[5px]">
              <h2 className="text-[24px] font-bold mb-[20px] text-center">Change Password</h2>
              <p className="mb-[20px] text-center text-[14px]">
                Enter your username, current password, and new password to change your password.
              </p>
              
              {successMessage && (
                <div className="bg-[#d4edda] text-[#155724] p-[10px] rounded-[4px] mb-[15px] border border-[#c3e6cb] text-center">
                  {successMessage}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-[15px]">
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

                <div className="mb-[15px]">
                  <label htmlFor="oldPassword" className="block mb-[5px] font-bold text-black">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="oldPassword"
                    name="oldPassword"
                    placeholder="Enter your current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    className={`w-full p-[10px] border-[3px] ${validationErrors.oldPassword ? 'border-red-500' : 'border-black'} rounded-[3px] text-[16px]`}
                  />
                  {validationErrors.oldPassword && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.oldPassword}</p>
                  )}
                </div>

                <div className="mb-[15px]">
                  <label htmlFor="newPassword" className="block mb-[5px] font-bold text-black">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className={`w-full p-[10px] border-[3px] ${validationErrors.newPassword ? 'border-red-500' : 'border-black'} rounded-[3px] text-[16px]`}
                  />
                  {validationErrors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.newPassword}</p>
                  )}
                </div>

                <div className="mb-[20px]">
                  <label htmlFor="confirmPassword" className="block mb-[5px] font-bold text-black">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`w-full p-[10px] border-[3px] ${validationErrors.confirmPassword ? 'border-red-500' : 'border-black'} rounded-[3px] text-[16px]`}
                  />
                  {validationErrors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.confirmPassword}</p>
                  )}
                </div>

                {csrfError && (
                  <div className="bg-[#ffebee] text-[#d32f2f] p-[10px] rounded-[4px] mb-[15px] border border-[#f5c6cb] text-center">
                    {csrfError}
                  </div>
                )}

                <button
                  type="submit"
                  className="p-[10px] bg-[#f8e58c] hover:bg-[#f5dc6c] cursor-pointer border-[3px] border-black rounded-[8px] text-black font-bold text-[16px] w-full"
                >
                  Change Password
                </button>

                <div className="mt-[15px] text-center">
                  <Link href="/login" className="no-underline text-black hover:underline">
                    Back to Login
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
