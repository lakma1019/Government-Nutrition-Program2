'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-green-50">
      {/* Navigation Bar */}
      <nav className={`fixed w-full z-10 transition-all duration-300 ${
        isScrolled ? "bg-green-800 shadow-md py-2" : "bg-green-700 py-4"
      }`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="text-white font-bold text-xl md:text-2xl">
            Government Nutrition Program
          </div>
          <ul className="flex gap-6 text-white">
            <li className="hover:text-green-200 transition-colors">
              <Link href="/">Home</Link>
            </li>
            <li className="hover:text-green-200 transition-colors">
              <Link href="/about">About Program</Link>
            </li>
            <li className="hover:text-green-200 transition-colors">
              <Link href="/login">Login</Link>
            </li>
            <li className="hover:text-green-200 transition-colors">
              <Link href="/gazette">Gazette</Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">
              Nutrition for Healthy Communities
            </h1>
            <p className="text-green-600 max-w-2xl mx-auto">
              Providing nutrition assistance, education, and resources to promote healthier lives for all citizens.
            </p>
          </div>

          {/* Upper Images Section - Images 1 to 4 */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-green-700 mb-6">Our Programs</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="relative h-64 md:h-72">
                    <Image
                      src={`/images/home_page/top_images/image${i}.jpg`}
                      alt={`Program Image ${i}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 bg-white">
                    <h3 className="font-semibold text-green-700">Program Title {i}</h3>
                    <p className="text-green-600 text-sm mt-1">Supporting healthier communities</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Middle Section - Gazette Images (10 to 16) with Animation */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-green-700 mb-6">Latest Gazette Updates</h2>

            {/* First animation row - left to right */}
            <div className="overflow-hidden mb-6 bg-green-100 rounded-lg py-6">
              <div className="flex whitespace-nowrap animate-[scroll_30s_linear_infinite]">
                {[10, 11, 12, 13, 14, 15, 16].map((i) => (
                  <div key={i} className="inline-block mx-4 flex-shrink-0">
                    <div className="relative w-64 h-48 rounded-lg overflow-hidden shadow-md">
                      <Image
                        src={`/images/home_page/middle_images/image${i}.jpg`}
                        alt={`Gazette Image ${i}`}
                        fill
                        sizes="256px"
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-green-800/70 p-3">
                        <p className="text-white text-sm">Gazette Notice #{i-9}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Duplicate first few images for seamless looping */}
                {[10, 11, 12].map((i) => (
                  <div key={`dup-${i}`} className="inline-block mx-4 flex-shrink-0">
                    <div className="relative w-64 h-48 rounded-lg overflow-hidden shadow-md">
                      <Image
                        src={`/images/home_page/middle_images/image${i}.jpg`}
                        alt={`Gazette Image ${i}`}
                        fill
                        sizes="256px"
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-green-800/70 p-3">
                        <p className="text-white text-sm">Gazette Notice #{i-9}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Second animation row - right to left */}
            <div className="overflow-hidden bg-green-100 rounded-lg py-6">
              <div className="flex whitespace-nowrap animate-[scrollReverse_30s_linear_infinite]">
                {[16, 15, 14, 13, 12, 11, 10].map((i) => (
                  <div key={`rev-${i}`} className="inline-block mx-4 flex-shrink-0">
                    <div className="relative w-64 h-48 rounded-lg overflow-hidden shadow-md">
                      <Image
                        src={`/images/home_page/middle_images/image${i}.jpg`}
                        alt={`Gazette Image ${i}`}
                        fill
                        sizes="256px"
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-green-800/70 p-3">
                        <p className="text-white text-sm">Gazette Notice #{i-9}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Duplicate last few images for seamless looping */}
                {[16, 15, 14].map((i) => (
                  <div key={`dup-rev-${i}`} className="inline-block mx-4 flex-shrink-0">
                    <div className="relative w-64 h-48 rounded-lg overflow-hidden shadow-md">
                      <Image
                        src={`/images/home_page/middle_images/image${i}.jpg`}
                        alt={`Gazette Image ${i}`}
                        fill
                        sizes="256px"
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-green-800/70 p-3">
                        <p className="text-white text-sm">Gazette Notice #{i-9}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mt-8">
              <Link href="/gazette" className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
                View All Gazette Notices
              </Link>
            </div>
          </section>

          {/* Lower Images Section - Images 5 to 9 */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-green-700 mb-6">Program Initiatives</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[5, 6, 7, 8, 9].map((i) => (
                <div key={i} className={`${i === 9 ? 'sm:col-span-2 lg:col-span-1' : ''} overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow`}>
                  <div className="relative h-64">
                    <Image
                      src={`/images/home_page/bottom_images/image${i}.jpg`}
                      alt={`Initiative Image ${i}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 bg-white">
                    <h3 className="font-semibold text-green-700">Initiative {i-4}</h3>
                    <p className="text-green-600 text-sm mt-1">
                      {i === 5 && "Fresh produce access program"}
                      {i === 6 && "Nutritional education for families"}
                      {i === 7 && "Sustainable food systems"}
                      {i === 8 && "Senior nutrition program"}
                      {i === 9 && "Community gardens initiative"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Call to Action */}
          <section className="bg-green-600 rounded-lg p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Join Our Program</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Learn more about our nutrition programs and how to qualify for assistance.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/eligibility" className="bg-white text-green-700 hover:bg-green-100 font-medium py-2 px-6 rounded-md transition-colors">
                Check Eligibility
              </Link>
              <Link href="/contact" className="bg-green-800 hover:bg-green-900 text-white font-medium py-2 px-6 rounded-md transition-colors">
                Contact Us
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-green-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Government Nutrition Program</h3>
              <p className="text-green-200">
                Promoting healthy communities through nutrition assistance and education.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/programs" className="text-green-200 hover:text-white transition-colors">Programs</Link></li>
                <li><Link href="/resources" className="text-green-200 hover:text-white transition-colors">Resources</Link></li>
                <li><Link href="/gazette" className="text-green-200 hover:text-white transition-colors">Gazette</Link></li>
                <li><Link href="/contact" className="text-green-200 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <p className="text-green-200 mb-2">123 Nutrition Street</p>
              <p className="text-green-200 mb-2">Healthy City, HC 12345</p>
              <p className="text-green-200">info@nutritionprogram.gov</p>
            </div>
          </div>
          <div className="border-t border-green-700 mt-8 pt-6 text-center text-green-200">
            <p>&copy; 2025 Government Nutrition Program. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Animation Keyframes */}
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-264px * 7 - 32px * 7)); }
        }

        @keyframes scrollReverse {
          0% { transform: translateX(calc(-264px * 7 - 32px * 7)); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}