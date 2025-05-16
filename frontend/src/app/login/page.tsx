"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log('Attempting to login with:', { username });

      // For testing purposes, use hardcoded credentials
      if (username === 'admin' && password === 'admin123') {
        console.log('Using hardcoded admin credentials');
        const userData = {
          id: 1,
          username: 'admin',
          role: 'admin',
          full_name: 'Admin User'
        };
        localStorage.setItem('user', JSON.stringify(userData));
        router.push('/admin_dashboard');
        return;
      }

      if (username === 'dataeo' && password === 'dataeo123') {
        console.log('Using hardcoded data entry officer credentials');
        const userData = {
          id: 2,
          username: 'dataeo',
          role: 'dataEntryOfficer',
          full_name: 'Data Entry Officer'
        };
        localStorage.setItem('user', JSON.stringify(userData));
        router.push('/DEO_login');
        return;
      }

      if (username === 'verifio' && password === 'verifio123') {
        console.log('Using hardcoded verification officer credentials');
        const userData = {
          id: 3,
          username: 'verifio',
          role: 'verificationOfficer',
          full_name: 'Verification Officer'
        };
        localStorage.setItem('user', JSON.stringify(userData));
        router.push('/VO_login');
        return;
      }

      // If not using hardcoded credentials, try to connect to the backend
      console.log('Backend URL:', 'http://localhost:3001/api/auth/login');

      // First check if we should use hardcoded credentials
      const useHardcodedCredentials = true; // Set to true to always use hardcoded credentials

      if (useHardcodedCredentials) {
        // Use hardcoded credentials directly
        if (username === 'admin' && password === 'admin123') {
          console.log('Using hardcoded admin credentials (skipping backend)');
          const userData = {
            id: 1,
            username: 'admin',
            role: 'admin',
            full_name: 'Admin User'
          };
          localStorage.setItem('user', JSON.stringify(userData));
          router.push('/admin_dashboard');
          return;
        } else if (username === 'dataeo' && password === 'dataeo123') {
          console.log('Using hardcoded data entry officer credentials (skipping backend)');
          const userData = {
            id: 2,
            username: 'dataeo',
            role: 'dataEntryOfficer',
            full_name: 'Data Entry Officer'
          };
          localStorage.setItem('user', JSON.stringify(userData));
          router.push('/DEO_login');
          return;
        } else if (username === 'verifio' && password === 'verifio123') {
          console.log('Using hardcoded verification officer credentials (skipping backend)');
          const userData = {
            id: 3,
            username: 'verifio',
            role: 'verificationOfficer',
            full_name: 'Verification Officer'
          };
          localStorage.setItem('user', JSON.stringify(userData));
          router.push('/VO_login');
          return;
        }
      }

      // If we get here, try to connect to the backend
      try {
        console.log('Attempting to connect to backend...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ username, password }),
          mode: 'cors',
          credentials: 'include',
          signal: controller.signal
        }).catch(error => {
          console.warn('Network error during fetch:', error);
          return null; // Return null to indicate fetch failed
        });

        // Clear the timeout since the request completed or failed
        clearTimeout(timeoutId);

        // If fetch failed (returned null), throw to skip to catch block
        if (!response) {
          throw new Error('Network request failed');
        }

        console.log('Response status:', response.status);

        let data;
        try {
          const responseText = await response.text();
          console.log('Response text:', responseText);

          if (responseText && !responseText.includes('<!DOCTYPE')) {
            data = JSON.parse(responseText);
            console.log('Response data:', data);
          } else {
            throw new Error('Invalid response format');
          }
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError);
          throw new Error('Failed to parse server response');
        }

        // Continue with the normal flow if we got a response
        if (data.success) {
          localStorage.setItem('user', JSON.stringify(data.user));

          if (data.user.role === 'admin') {
            router.push('/admin_dashboard');
          } else if (data.user.role === 'dataEntryOfficer') {
            router.push('/DEO_login');
          } else if (data.user.role === 'verificationOfficer') {
            router.push('/VO_login');
          } else {
            router.push('/');
          }
          return;
        } else {
          setError(data.message || 'Login failed');
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        // If we get here, the backend is not responding, so we'll use hardcoded credentials as fallback
        if (username === 'admin' && password === 'admin123') {
          console.log('Falling back to hardcoded admin credentials');
          const userData = {
            id: 1,
            username: 'admin',
            role: 'admin',
            full_name: 'Admin User'
          };
          localStorage.setItem('user', JSON.stringify(userData));
          router.push('/admin_dashboard');
          return;
        } else if (username === 'dataeo' && password === 'dataeo123') {
          console.log('Falling back to hardcoded data entry officer credentials');
          const userData = {
            id: 2,
            username: 'dataeo',
            role: 'dataEntryOfficer',
            full_name: 'Data Entry Officer'
          };
          localStorage.setItem('user', JSON.stringify(userData));
          router.push('/DEO_login');
          return;
        } else if (username === 'verifio' && password === 'verifio123') {
          console.log('Falling back to hardcoded verification officer credentials');
          const userData = {
            id: 3,
            username: 'verifio',
            role: 'verificationOfficer',
            full_name: 'Verification Officer'
          };
          localStorage.setItem('user', JSON.stringify(userData));
          router.push('/VO_login');
          return;
        } else {
          setError(`Network error: Unable to connect to the server. Please try again later.`);
          return;
        }
      }

      // This block is now handled inside the try-catch block above
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
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
            href="/login"
            className={`no-underline ${pathname === "/login" ? "" : ""}`}
          >
            <span className={`inline-block p-[5px_15px] ${pathname === "/login" ? "bg-[rgb(241,163,208)] border-[5px] border-red-600 text-black" : "bg-white text-black"} rounded-[20px] text-[14px] font-bold transition-all duration-200 hover:bg-[rgb(199,150,150)]`}>
              Login
            </span>
          </Link>
          <Link
            href="/gazette"
            className={`no-underline ${pathname === "/gazette" ? "" : ""}`}
          >
            <span className={`inline-block p-[5px_15px] ${pathname === "/gazette" ? "bg-[rgb(241,163,208)] border-[5px] border-red-600 text-black" : "bg-white text-black"} rounded-[20px] text-[14px] font-bold transition-all duration-200 hover:bg-[rgb(199,150,150)]`}>
              Gazett
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
                    className="w-full p-[10px] border-[3px] border-black rounded-[3px] text-[16px]"
                  />
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
                    className="w-full p-[10px] border-[3px] border-black rounded-[3px] text-[16px]"
                  />
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
                  className={`p-[10px] ${loading ? 'bg-[#ccc] cursor-not-allowed' : 'bg-[#f8e58c] hover:bg-[#f5dc6c] cursor-pointer'} border-[3px] border-black rounded-[8px] text-black font-bold text-[16px] w-full`}
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}