"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Handle navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-green-50">
      {/* Navigation Bar */}
      <nav
        className={`fixed w-full z-20 transition-all duration-300 ${
          isScrolled ? "bg-green-800 shadow-lg py-2" : "bg-green-700 py-4"
        }`}
        aria-label="Main navigation"
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="text-white font-bold text-xl md:text-2xl">Government Nutrition Program</div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white focus:outline-none focus:ring-2 focus:ring-green-200 rounded-md p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop menu */}
          <ul className="hidden md:flex gap-8 text-white">
            <li>
              <Link
                href="/"
                className="hover:text-green-200 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-green-200 after:transition-all hover:after:w-full"
                aria-current="page"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="hover:text-green-200 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-green-200 after:transition-all hover:after:w-full"
              >
                About Program
              </Link>
            </li>
            <li>
              <Link
                href="/login"
                className="hover:text-green-200 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-green-200 after:transition-all hover:after:w-full"
              >
                Login
              </Link>
            </li>
            <li>
              <Link
                href="/gazette"
                className="hover:text-green-200 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-green-200 after:transition-all hover:after:w-full"
              >
                Gazette
              </Link>
            </li>
          </ul>
        </div>

        {/* Mobile menu */}
        <div
          id="mobile-menu"
          className={`md:hidden absolute w-full bg-green-800 transition-all duration-300 overflow-hidden ${
            mobileMenuOpen ? "max-h-64 shadow-lg" : "max-h-0"
          }`}
        >
          <ul className="flex flex-col text-white px-4 py-2 space-y-3">
            <li className="py-2 border-b border-green-700">
              <Link
                href="/"
                className="block hover:text-green-200 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
            </li>
            <li className="py-2 border-b border-green-700">
              <Link
                href="/about"
                className="block hover:text-green-200 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Program
              </Link>
            </li>
            <li className="py-2 border-b border-green-700">
              <Link
                href="/login"
                className="block hover:text-green-200 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            </li>
            <li className="py-2">
              <Link
                href="/gazette"
                className="block hover:text-green-200 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Gazette
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-28 md:pt-32 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <section className="mb-20">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-bold text-green-800 mb-6 leading-tight">
                Nutrition for Healthy Communities
              </h1>
              <p className="text-green-600 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                Providing nutrition assistance, education, and resources to promote healthier lives for all citizens.
              </p>
            </div>
          </section>

          {/* Our Programs Section */}
          <section className="mb-24" aria-labelledby="programs-heading">
            <h2 id="programs-heading" className="text-2xl md:text-3xl font-bold text-green-700 mb-8 text-center">
              Our Programs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="group overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 bg-white"
                >
                  <div className="relative h-64 md:h-72">
                    <Image
                      src={`/images/home_page/top_images/image${i}.jpg`}
                      alt={`Program Image ${i}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Latest Gazette Updates Section */}
          <section className="mb-24" aria-labelledby="gazette-heading">
            <div className="text-center mb-8">
              <h2 id="gazette-heading" className="text-2xl md:text-3xl font-bold text-green-700 mb-4">
                Latest Gazette Updates
              </h2>
              <p className="text-green-600 max-w-2xl mx-auto">
                Stay informed with the most recent government nutrition program notices and updates.
              </p>
            </div>

            {/* First animation row - left to right */}
            <div className="overflow-hidden mb-8 bg-green-100 rounded-xl py-8 px-4">
              <div className="flex whitespace-nowrap animate-[scroll_30s_linear_infinite] hover:pause">
                {[10, 11, 12, 13, 14, 15, 16].map((i) => (
                  <div key={i} className="inline-block mx-4 flex-shrink-0">
                    <Link
                      href={`/gazette/${i - 9}`}
                      className="block focus:outline-none focus:ring-2 focus:ring-green-500 rounded-xl"
                    >
                      <div className="relative w-72 h-52 rounded-xl overflow-hidden shadow-md transform transition-all duration-300 hover:shadow-xl hover:scale-105">
                        <Image
                          src={`/images/home_page/middle_images/image${i}.jpg`}
                          alt={`Gazette Image ${i}`}
                          fill
                          sizes="288px"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 to-transparent"></div>
                      </div>
                    </Link>
                  </div>
                ))}
                {/* Duplicate first few images for seamless looping */}
                {[10, 11, 12].map((i) => (
                  <div key={`dup-${i}`} className="inline-block mx-4 flex-shrink-0">
                    <Link
                      href={`/gazette/${i - 9}`}
                      className="block focus:outline-none focus:ring-2 focus:ring-green-500 rounded-xl"
                    >
                      <div className="relative w-72 h-52 rounded-xl overflow-hidden shadow-md transform transition-all duration-300 hover:shadow-xl hover:scale-105">
                        <Image
                          src={`/images/home_page/middle_images/image${i}.jpg`}
                          alt={`Gazette Image ${i}`}
                          fill
                          sizes="288px"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 to-transparent"></div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Second animation row - right to left */}
            <div className="overflow-hidden bg-green-100 rounded-xl py-8 px-4 mb-10">
              <div className="flex whitespace-nowrap animate-[scrollReverse_30s_linear_infinite] hover:pause">
                {[16, 15, 14, 13, 12, 11, 10].map((i) => (
                  <div key={`rev-${i}`} className="inline-block mx-4 flex-shrink-0">
                    <Link
                      href={`/gazette/${i - 9}`}
                      className="block focus:outline-none focus:ring-2 focus:ring-green-500 rounded-xl"
                    >
                      <div className="relative w-72 h-52 rounded-xl overflow-hidden shadow-md transform transition-all duration-300 hover:shadow-xl hover:scale-105">
                        <Image
                          src={`/images/home_page/middle_images/image${i}.jpg`}
                          alt={`Gazette Image ${i}`}
                          fill
                          sizes="288px"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 to-transparent"></div>
                      </div>
                    </Link>
                  </div>
                ))}
                {/* Duplicate last few images for seamless looping */}
                {[16, 15, 14].map((i) => (
                  <div key={`dup-rev-${i}`} className="inline-block mx-4 flex-shrink-0">
                    <Link
                      href={`/gazette/${i - 9}`}
                      className="block focus:outline-none focus:ring-2 focus:ring-green-500 rounded-xl"
                    >
                      <div className="relative w-72 h-52 rounded-xl overflow-hidden shadow-md transform transition-all duration-300 hover:shadow-xl hover:scale-105">
                        <Image
                          src={`/images/home_page/middle_images/image${i}.jpg`}
                          alt={`Gazette Image ${i}`}
                          fill
                          sizes="288px"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 to-transparent"></div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/gazette"
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-md transition-colors shadow-md transform hover:translate-y-[-2px]"
              >
                View All Gazette Notices
              </Link>
            </div>
          </section>

          {/* Program Initiatives Section */}
          <section className="mb-24" aria-labelledby="initiatives-heading">
            <h2 id="initiatives-heading" className="text-2xl md:text-3xl font-bold text-green-700 mb-8 text-center">
              Program Initiatives
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[5, 6, 7, 8, 9].map((i) => (
                <div
                  key={i}
                  className={`${i === 9 ? "sm:col-span-2 lg:col-span-1" : ""} group bg-white overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300`}
                >
                  <div className="relative h-72">
                    <Image
                      src={`/images/home_page/bottom_images/image${i}.jpg`}
                      alt={`Initiative Image ${i}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-green-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-green-800 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-xl font-bold mb-6 border-b border-green-700 pb-2">Government Nutrition Program</h3>
              <p className="text-green-200 mb-6 leading-relaxed">
                Promoting healthy communities through nutrition assistance and education. Together, we can build a
                healthier future for all citizens.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-green-200 hover:text-white transition-colors" aria-label="Facebook">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="text-green-200 hover:text-white transition-colors" aria-label="Twitter">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-green-200 hover:text-white transition-colors" aria-label="Instagram">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-6 border-b border-green-700 pb-2">Contact Us</h3>
              <address className="not-italic">
                <div className="flex items-start mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-3 text-green-200 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-green-200 mb-1">123 Nutrition Street</p>
                    <p className="text-green-200">Healthy City, HC 12345</p>
                  </div>
                </div>
                <div className="flex items-start mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-3 text-green-200 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-green-200">info@nutritionprogram.gov</p>
                </div>
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-3 text-green-200 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <p className="text-green-200">(555) 123-4567</p>
                </div>
              </address>
            </div>
          </div>
          <div className="border-t border-green-700 mt-10 pt-8 text-center text-green-200">
            <p>&copy; 2025 Government Nutrition Program. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Animation Keyframes */}
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-296px * 7 - 32px * 7)); }
        }

        @keyframes scrollReverse {
          0% { transform: translateX(calc(-296px * 7 - 32px * 7)); }
          100% { transform: translateX(0); }
        }

        .hover\\:pause:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
