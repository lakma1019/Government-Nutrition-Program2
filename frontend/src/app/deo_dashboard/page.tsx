'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DataEntryOfficerDashboard() {
  const [user, setUser] = useState<{id?: number; username?: string; role?: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Check if user is authenticated and is a data entry officer
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          router.push('/login'); // Redirect to login if no user data
          return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData); // Set user data

        // Check if user's role is 'dataEntryOfficer'
        if (userData.role !== 'dataEntryOfficer') {
          alert('Access denied. Only Data Entry Officers can access this page.');
          router.push('/'); // Redirect to home or another page if not DEO
        }
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login'); // Redirect to login on auth error
      } finally {
        setLoading(false); // Stop loading once auth check is complete
      }
    };

    checkAuth();
  }, [router]); // Depend on router


  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-2xl text-purple-700">
        Loading...
      </div>
    );
  }

  // --- Tailwind Class Mapping ---
  // Container and general layout
  const containerClasses = "w-full min-h-screen p-5 bg-[#f8e6f3] font-sans flex flex-col";

  // Navigation Bar
  const navbarClasses = "flex justify-between items-center py-4 px-6 mb-5 bg-[#e6b3d9] rounded-lg shadow-md";
  const brandClasses = "text-xl font-bold text-gray-800";
  const navLinksClasses = "flex space-x-4";
  const navLinkBaseClasses = "inline-flex group";
  const linkTextBaseClasses = "inline-block py-1.5 px-4 bg-white rounded-full text-black text-sm font-bold transition-all duration-200 ease-in-out";
  const linkTextHoverClasses = "group-hover:bg-[#f0e0f0]";
  const linkTextHighlightClasses = "bg-[#f0e0f0] border-2 border-[#d070d0] !text-black";

  // Welcome Header
  const welcomeHeaderClasses = "text-center mb-5 py-2 bg-[#f8e6f3] rounded-lg";
  const welcomeHeaderH1Classes = "text-xl font-semibold text-gray-800";

  // Main Dashboard Area for Cards
  const dashboardMainAreaClasses = "bg-white rounded-xl shadow-lg border-2 border-purple-300 p-4 md:p-6 mt-5";

  // Card Grid Layout
  const cardGridClasses = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6";

  // Base styling for all cards (applied to Link component)
  const cardBaseClasses = "block p-4 md:p-6 rounded-lg shadow-md hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-300 ease-in-out transform hover:-translate-y-1";

  // Unique styles for each card for visual distinction
  const cardStyles = [
    `${cardBaseClasses} bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200 focus:ring-rose-500`,
    `${cardBaseClasses} bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200 focus:ring-sky-500`,
    `${cardBaseClasses} bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200 focus:ring-teal-500`,
    `${cardBaseClasses} bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 focus:ring-amber-500`,
    `${cardBaseClasses} bg-violet-50 hover:bg-violet-100 text-violet-800 border-violet-200 focus:ring-violet-500`,
    `${cardBaseClasses} bg-lime-50 hover:bg-lime-100 text-lime-800 border-lime-200 focus:ring-lime-500`,
    `${cardBaseClasses} bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 focus:ring-fuchsia-500`,
  ];

  // Styling for content within cards
  const cardContentClasses = "flex flex-col items-center text-center";
  const cardIconClasses = "text-3xl md:text-4xl mb-2 md:mb-3"; // Color inherited from cardStyle
  const cardTitleClasses = "text-md md:text-lg font-semibold"; // Color inherited from cardStyle

  const cardData = [
    { title: "Daily Data", icon: "📝", href: "/DEO_login/enter-daily-data", ariaLabel: "Daily Data Entry" },
    { title: "Contractors", icon: "👥", href: "/DEO_login/DEO_contractors", ariaLabel: "Manage Contractors" },
    { title: "Progress Report", icon: "📈", href: "/DEO_login/generate_progress_report", ariaLabel: "Generate Progress Report" },
    { title: "Voucher", icon: "📄", href: "/DEO_login/generate_voucher", ariaLabel: "Generate Voucher" },
    { title: "Reports", icon: "📊", href: "/DEO_login/reports", ariaLabel: "View Reports" },
    { title: "History", icon: "📜", href: "/DEO_login/history", ariaLabel: "View History" },
    { title: "Profile", icon: "👤", href: "/DEO_login/profile", ariaLabel: "View Profile" },
  ];

  return (
    <div className={containerClasses}>
      {/* Navigation Bar */}
      <nav className={navbarClasses}>
        <div className={brandClasses}>Goverment Nutrition Program</div>
        <div className={navLinksClasses}>
          <Link href="/" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses} ${pathname === "/" ? linkTextHighlightClasses : ""}`}>
              Home
            </span>
          </Link>
          <Link href="/about" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses} ${pathname === "/about" ? linkTextHighlightClasses : ""}`}>
              About Program
            </span>
          </Link>
          <Link href="/" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses} ${pathname === "/" ? linkTextHighlightClasses : ""}`}>
              Logout
            </span>
          </Link>
          <Link href="/gazette" className={navLinkBaseClasses}>
            <span className={`${linkTextBaseClasses} ${linkTextHoverClasses} ${pathname === "/gazette" ? linkTextHighlightClasses : ""}`}>
              Gazette
            </span>
          </Link>
        </div>
      </nav>

      {/* Welcome Header */}
      <div className={welcomeHeaderClasses}>
        <h1 className={welcomeHeaderH1Classes}>Welcome to Data Entry Officer Dashboard</h1>
      </div>

      {/* Main Content Area with Cards */}
      <div className={dashboardMainAreaClasses}>
        <div className={cardGridClasses}>
          {cardData.map((card, index) => (
            <Link key={card.title} href={card.href} className={cardStyles[index % cardStyles.length]}>
              <div className={cardContentClasses}>
                <span role="img" aria-label={card.ariaLabel} className={cardIconClasses}>
                  {card.icon}
                </span>
                <h3 className={cardTitleClasses}>{card.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}