"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { UserCircle, FileText, Home, Info, LogOut, FileSpreadsheet, Loader2 } from "lucide-react"

type User = {
  id?: number
  username?: string
  role?: string
  name?: string
}

export default function VerificationOfficerDashboard() {
  const [user, setUser] = useState<User>({})
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)

    // --- Begin Example Authentication Check ---
    // This is a placeholder. Replace with your actual authentication logic.
    // try {
    //   const storedUser = localStorage.getItem('user');
    //   if (!storedUser) {
    //     router.push('/login');
    //     console.error("No user found, redirecting to login.");
    //     return;
    //   }
    //   const userData = JSON.parse(storedUser);
    //   if (userData.role !== 'verificationOfficer') {
    //     alert('Access Denied. Only Verification Officers can access this page.');
    //     router.push('/');
    //     console.error("User role not verificationOfficer, access denied.");
    //     return;
    //   }
    //   setUser(userData);
    // } catch (error) {
    //   console.error("Authentication error:", error);
    //   router.push('/login');
    // } finally {
    //   setLoading(false);
    // }
    // --- End Example Authentication Check ---

    return () => clearTimeout(timer)
  }, [])

  // Card data with improved structure
  const cardData = [
    {
      title: "Profile",
      description: "View and manage your user profile and account settings",
      icon: <UserCircle className="h-12 w-12" />,
      href: "/vo_dashboard/profile",
      ariaLabel: "View User Profile",
      styleKey: "profile",
    },
    {
      title: "Voucher",
      description: "Review, verify, and process nutrition program vouchers",
      icon: <FileText className="h-12 w-12" />,
      href: "/vo_dashboard/voucher",
      ariaLabel: "View and Process Vouchers",
      styleKey: "voucher",
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffbe6] flex flex-col justify-center items-center p-4">
        <Loader2 className="h-12 w-12 text-[#d0c670] animate-spin mb-4" />
        <p className="text-xl font-medium text-[#4A5568]">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffbe6] font-sans">
      {/* Header with Navigation */}
      <header className="bg-[rgb(244,237,174)] shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex flex-wrap items-center justify-between py-4">
            <div className="flex items-center flex-shrink-0">
              <span className="text-xl font-bold text-gray-800">Government Nutrition Program</span>
            </div>

            {/* Mobile menu button - would be implemented with state toggle */}
            <div className="block md:hidden">
              <button
                type="button"
                className="p-2 rounded-md text-gray-800 hover:bg-[#f0e68c] focus:outline-none focus:ring-2 focus:ring-[#d0c670]"
                aria-expanded="false"
              >
                <span className="sr-only">Open menu</span>
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <NavLink href="/" icon={<Home size={16} />} isActive={pathname === "/"}>
                Home
              </NavLink>
              <NavLink href="/about" icon={<Info size={16} />} isActive={pathname === "/about"}>
                About Program
              </NavLink>
              <NavLink href="/gazette" icon={<FileSpreadsheet size={16} />} isActive={pathname === "/gazette"}>
                Gazette
              </NavLink>
              <button
                onClick={() => router.push("/login")}
                className="inline-flex items-center py-2 px-4 bg-white hover:bg-red-50 text-red-600 rounded-full text-sm font-bold transition-all duration-200"
              >
                <LogOut size={16} className="mr-1" />
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Header with Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-[#d0c670]">
          <div className="flex items-center">
            <div className="bg-[#f0e68c] p-3 rounded-full mr-4">
              <UserCircle className="h-6 w-6 text-[#4A5568]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#4A5568]">Welcome to Verification Officer Dashboard</h1>
              <p className="text-gray-600">Verify and process nutrition program vouchers</p>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="bg-white rounded-xl shadow-md p-8 border-2 border-[#0070f3]">
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {cardData.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className={`group block p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-${
                  card.styleKey === "profile" ? "[#b2ebf2]" : "[#f8bbd0]"
                } bg-${card.styleKey === "profile" ? "[#e0f7fa]" : "[#fce4ec]"}`}
                aria-label={card.ariaLabel}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`mb-4 text-${
                      card.styleKey === "profile" ? "[#00796b]" : "[#c2185b]"
                    } transition-transform duration-300 group-hover:scale-110`}
                  >
                    {card.icon}
                  </div>
                  <h3
                    className={`text-xl font-semibold mb-3 text-${card.styleKey === "profile" ? "[#00796b]" : "[#c2185b]"}`}
                  >
                    {card.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{card.description}</p>
                  <span
                    className={`inline-flex items-center text-${
                      card.styleKey === "profile" ? "[#00796b]" : "[#c2185b]"
                    } font-medium`}
                  >
                    Access
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[rgb(244,237,174)] py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-center text-gray-700 text-sm">
            &copy; 2025 Government Nutrition Program. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

// Reusable NavLink component
function NavLink({
  href,
  icon,
  isActive,
  children,
}: {
  href: string
  icon?: React.ReactNode
  isActive: boolean
  children: React.ReactNode
}) {
  return (
    <Link href={href} className="group">
      <span
        className={`
          inline-flex items-center py-2 px-4 rounded-full text-sm font-bold transition-all duration-300
          ${
            isActive
              ? "bg-[#f0e68c] border border-[#d0c670] text-black transform scale-105"
              : "bg-white text-black hover:bg-[#f0e68c]"
          }
        `}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {children}
      </span>
    </Link>
  )
}
