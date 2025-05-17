'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
// Image component is no longer needed for this dashboard page's direct content
import { usePathname } from 'next/navigation';

export default function VerificationOfficerDashboard() {
  // User state can be used by pages navigated to from here
  const [user, setUser] = useState<{id?: number; username?: string; role?: string}>({
    // id: 1, // Example, should be set from auth
    // username: 'verifio', // Example, should be set from auth
    // role: 'verificationOfficer' // Example, should be set from auth
  });
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  // const router = useRouter(); // Uncomment if needed for auth redirection

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500); // Shorter delay

    // --- Begin Example Authentication Check ---
    // This is a placeholder. Replace with your actual authentication logic.
    // try {
    //   const storedUser = localStorage.getItem('user');
    //   if (!storedUser) {
    //     // router.push('/login'); // Uncomment and import useRouter
    //     console.error("No user found, redirecting to login.");
    //     return;
    //   }
    //   const userData = JSON.parse(storedUser);
    //   if (userData.role !== 'verificationOfficer') {
    //     alert('Access Denied. Only Verification Officers can access this page.');
    //     // router.push('/'); // Redirect to home or another appropriate page
    //     console.error("User role not verificationOfficer, access denied.");
    //     return;
    //   }
    //   setUser(userData);
    // } catch (error) {
    //   console.error("Authentication error:", error);
    //   // router.push('/login');
    // } finally {
    //   setLoading(false);
    // }
    // --- End Example Authentication Check ---


    return () => clearTimeout(timer);
  }, []); // Add 'router' to dependency array if used in auth check

  if (loading) {
    return (
      <div className="container">
        <div className="loading-message">Loading...</div>
      </div>
    );
  }
  const cardData = [
    { title: "Profile", icon: "👤", href: "/vo_dashboard/profile", ariaLabel: "View User Profile", styleKey: "profile" },
    { title: "Voucher", icon: "📄", href: "/vo_dashboard/voucher", ariaLabel: "View and Process Vouchers", styleKey: "voucher" },
  ];

  return (
    <div className="container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="brand">Goverment Nutrition Program</div>
        <div className="nav-links">
          <Link href="/" className={`nav-link ${pathname === "/" ? "highlight" : ""}`}>
            <span className="link-text">Home</span>
          </Link>
          <Link href="/about" className={`nav-link ${pathname === "/about" ? "highlight" : ""}`}>
            <span className="link-text">About Program</span>
          </Link>
          <Link href="/" className={`nav-link ${pathname === "/" ? "highlight" : ""}`}>
            <span className="link-text">Logout</span>
          </Link>
          <Link href="/gazette" className={`nav-link ${pathname === "/gazette" ? "highlight" : ""}`}>
            <span className="link-text">Gazette</span>
          </Link>
        </div>
      </nav>

      {/* Welcome Header */}
      <div className="welcome-header">
        <h1>Welcome to Verification Officer Dashboard</h1>
      </div>

      {/* Main Content Area with Cards */}
      <div className="dashboard-main-area">
        <div className="card-grid">
          {cardData.map((card) => (
            <Link key={card.title} href={card.href} className={`dashboard-card card-${card.styleKey}`}>
              <div className="card-content">
                <span role="img" aria-label={card.ariaLabel} className="card-icon">
                  {card.icon}
                </span>
                <h3 className="card-title">{card.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 100%;
          min-height: 100vh;
          padding: 20px;
          background-color: #fffbe6; /* Light yellow background */
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; /* Common sans-serif font */
        }

        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 25px;
          margin-bottom: 20px;
          background-color:rgb(244, 237, 174); /* Khaki yellow for nav bar */
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        .brand {
          font-size: 20px;
          font-weight: bold;
          color: #333;
        }

        .nav-links {
          display: flex;
          gap: 15px;
        }

        .nav-link {
          text-decoration: none;
        }

        .link-text {
          display: inline-block;
          padding: 5px 15px;
          background-color: #ffffff;
          border-radius: 20px;
          color: #000000;
          font-size: 14px;
          font-weight: bold;
          transition: all 0.2s ease-in-out;
        }

        .nav-link.highlight .link-text,
        .nav-link:hover .link-text {
          background-color: #f0e68c; /* Darker yellow */
          border: 1px solid #d0c670; /* Complementary border */
        }

        .welcome-header {
          text-align: center;
          margin-bottom: 25px; /* Increased margin */
          color: #4A5568; /* Darker text for better readability */
        }
        .welcome-header h1 {
          font-size: 26px; /* Slightly larger */
          font-weight: 600; /* Semibold */
        }

        .dashboard-main-area {
          background-color: #ffffff;
          border-radius: 15px;
          padding: 25px; /* Increased padding */
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* Softer shadow */
          border: 2px solid #0070f3; /* Blue border as per user preference */
          margin-top: 20px;
        }

        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); /* Min card width */
          gap: 25px; /* Increased gap */
          justify-content: center;
        }
        /* Specific layout for 2 cards on medium screens */
        @media (min-width: 600px) and (max-width: 900px) {
            .card-grid {
                grid-template-columns: repeat(2, minmax(220px, 300px));
            }
        }
         /* Specific layout for 2 cards on larger screens, more centered */
        @media (min-width: 901px) {
            .card-grid {
                grid-template-columns: repeat(2, minmax(250px, 350px));
                max-width: 800px; /* Max width for the grid itself */
                margin-left: auto;
                margin-right: auto;
            }
        }


        .dashboard-card {
          display: block;
          padding: 25px; /* Increased padding */
          border-radius: 12px; /* More rounded corners */
          text-decoration: none;
          box-shadow: 0 4px 8px rgba(0,0,0,0.08);
          transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
          text-align: center;
          border-width: 1px;
          border-style: solid;
        }

        .dashboard-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 6px 14px rgba(0,0,0,0.12);
        }

        .card-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .card-icon {
          font-size: 48px; /* Larger icon */
          margin-bottom: 15px;
        }

        .card-title {
          font-size: 20px; /* Slightly larger title */
          font-weight: 600;
          margin: 0;
        }

        /* Visually distinct card styles */
        .card-profile {
          background-color: #e0f7fa; /* Lighter cyan */
          border-color: #b2ebf2; /* Cyan border */
        }
        .card-profile .card-icon, .card-profile .card-title {
          color: #00796b; /* Teal text */
        }

        .card-voucher {
          background-color: #fce4ec; /* Lighter pink */
          border-color: #f8bbd0; /* Pink border */
        }
        .card-voucher .card-icon, .card-voucher .card-title {
          color: #c2185b; /* Darker pink text */
        }

        .loading-message {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 24px; /* Larger loading text */
          color: #555;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .navbar {
            flex-direction: column;
            align-items: center; /* Center navbar items on mobile */
          }
          .brand {
            margin-bottom: 10px; /* Space between brand and links */
          }
          .nav-links {
            margin-top: 10px;
            flex-wrap: wrap;
            justify-content: center; /* Center nav links */
          }
          .welcome-header h1 {
            font-size: 22px; /* Adjust welcome header for mobile */
          }
          .dashboard-main-area {
            padding: 20px; /* Adjust padding for mobile */
          }
          .card-grid {
            grid-template-columns: 1fr; /* Stack cards on small screens */
            gap: 20px;
          }
          .card-icon {
            font-size: 40px;
          }
          .card-title {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}