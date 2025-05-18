"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Users, UserPlus, UserCog, ClipboardList, LogOut, Home, FileText, ChevronRight } from "lucide-react"

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("")
  const pathname = usePathname()
  const router = useRouter()

  // Check if user is authenticated and is an admin on component mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem("user")
        if (!storedUser) {
          router.push("/login")
          return
        }

        const userData = JSON.parse(storedUser)

        // Check if user is an admin role
        if (userData.role !== "admin") {
          alert("Access denied. Only administrators can access this page.")
          router.push("/")
        } else {
          // Set user name for welcome message
          setUserName(userData.name || "Administrator")
        }
      } catch (error) {
        console.error("Authentication error:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("user")
    localStorage.removeItem("token")

    // Redirect to login page
    router.push("/login")
  }

  // Show loading state with animation
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#d6e9f3]">
        <div className="w-16 h-16 border-4 border-blue-400 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-xl text-blue-600 font-medium">Verifying credentials...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#d6e9f3] font-sans">
      {/* Navigation Bar */}
      <header className="bg-[#e6f0ff] shadow-lg">
        <div className="container mx-auto px-4">
          <nav className="flex flex-wrap items-center justify-between py-4">
            <div className="flex items-center">
              <span className="text-xl font-bold text-[#003300]">Government Nutrition Program</span>
            </div>

            <div className="flex items-center space-x-1 md:space-x-4">
              <NavLink href="/" icon={<Home size={18} />} isActive={pathname === "/"}>
                Home
              </NavLink>
              <NavLink href="/about" icon={<FileText size={18} />} isActive={pathname === "/about"}>
                About
              </NavLink>
              <NavLink href="/gazette" icon={<ClipboardList size={18} />} isActive={pathname === "/gazette"}>
                Gazette
              </NavLink>
              <button
                onClick={handleLogout}
                className="inline-flex items-center py-2 px-4 bg-white hover:bg-red-50 text-red-600 rounded-full text-sm font-medium transition-all duration-200"
              >
                <LogOut size={18} className="mr-1" />
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Header with Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <Users size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Welcome, {userName}</h1>
              <p className="text-gray-600">Admin Dashboard | Manage users and system settings</p>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <DashboardCard
            title="Add Users"
            description="Create new user accounts with different roles and permissions"
            icon={<UserPlus size={32} />}
            iconBgColor="bg-blue-100"
            iconTextColor="text-blue-600"
            buttonColor="bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push("/admin_dashboard/add_users")}
          />

          <DashboardCard
            title="Edit Users"
            description="Modify existing user accounts and update their information"
            icon={<UserCog size={32} />}
            iconBgColor="bg-green-100"
            iconTextColor="text-green-600"
            buttonColor="bg-green-600 hover:bg-green-700"
            onClick={() => router.push("/admin_dashboard/edit_users")}
          />

          <DashboardCard
            title="View Users Details"
            description="Browse and search through all registered user accounts"
            icon={<ClipboardList size={32} />}
            iconBgColor="bg-purple-100"
            iconTextColor="text-purple-600"
            buttonColor="bg-purple-600 hover:bg-purple-700"
            onClick={() => router.push("/admin_dashboard/view_users")}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#e6f0ff] py-4 mt-auto">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-600 text-sm">
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
          inline-flex items-center py-2 px-4 rounded-full text-sm font-medium transition-all duration-300
          ${
            isActive
              ? "bg-[rgb(241,163,208)] border-[3px] border-red-600 text-black transform scale-105"
              : "bg-white text-black hover:bg-[rgb(199,150,150)]"
          }
        `}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {children}
      </span>
    </Link>
  )
}

// Reusable Dashboard Card component
function DashboardCard({
  title,
  description,
  icon,
  iconBgColor,
  iconTextColor,
  buttonColor,
  onClick,
}: {
  title: string
  description: string
  icon: React.ReactNode
  iconBgColor: string
  iconTextColor: string
  buttonColor: string
  onClick: () => void
}) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:translate-y-[-4px] border border-gray-100">
      <div className={`${iconBgColor} ${iconTextColor} p-8 flex justify-center items-center`}>{icon}</div>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{description}</p>
        <button
          onClick={onClick}
          className={`w-full flex items-center justify-center px-4 py-2 ${buttonColor} text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {title}
          <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  )
}
