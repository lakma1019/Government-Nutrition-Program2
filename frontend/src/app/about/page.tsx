'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function AboutPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const pathname = usePathname();

  // Sample data for team members
  const teamMembers = [
    {
      name: 'Dr. Samantha Perera',
      role: 'Program Director',
      description: 'Leading the nutrition program with over 15 years of experience in public health initiatives.',
      image: '/images/home_page/middle_images/Dr.SamanthaPerera.jpg'
    },
    {
      name: 'Nimal Jayawardena',
      role: 'Operations Manager',
      description: 'Ensuring smooth day-to-day operations of the food supply chain across all participating schools.',
      image: '/images/home_page/middle_images/Nimal_Jayawardena.jpeg'
    },
    {
      name: 'Kumari Silva',
      role: 'Nutritionist',
      description: 'Developing balanced meal plans that meet the nutritional needs of growing children.',
      image: '/images/home_page/middle_images/Kumari_Silva.jpg'
    }
  ];

  // Sample data for program milestones
  const milestones = [
    {
      year: '2018',
      title: 'Program Inception',
      description: 'The School Children\'s Nutrition Program was established to address malnutrition in rural schools.'
    },
    {
      year: '2020',
      title: 'Digital Transformation',
      description: 'Began development of the digital platform to replace paper-based processes.'
    },
    {
      year: '2022',
      title: 'Full Implementation',
      description: 'Rolled out the digital system to all participating schools across the country.'
    },
    {
      year: '2023',
      title: 'Program Expansion',
      description: 'Extended the program to include more schools and additional nutritional components.'
    }
  ];

  // Base classes for nav links and section nav items
  const navLinkBaseClasses = "py-2 px-4 rounded transition-colors duration-300 hover:bg-white/10";
  const sectionNavItemBaseClasses = "py-2 px-6 rounded transition-all duration-300 mb-2 md:mb-0";


  return (
    <div className="w-full min-h-screen flex flex-col bg-slate-100 font-sans leading-relaxed text-gray-800">
      {/* Navigation Bar */}
      <nav className="flex justify-between items-center py-4 px-8 bg-blue-800 text-white">
        <div className="text-2xl font-bold">Government Nutrition Program</div>
        <div className="flex space-x-6">
          <Link href="/" className={`${navLinkBaseClasses} ${pathname === "/" ? "bg-white/10" : ""}`}>
            Home
          </Link>
          <Link href="/about" className={`${navLinkBaseClasses} ${pathname === "/about" ? "bg-white/10" : ""}`}>
            About Program
          </Link>
          <Link href="/login" className={`${navLinkBaseClasses} ${pathname === "/login" ? "bg-white/10" : ""}`}>
            Login
          </Link>
          <Link href="/gazette" className={`${navLinkBaseClasses} ${pathname === "/gazette" ? "bg-white/10" : ""}`}>
            Gazette
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-[400px] overflow-hidden">
        <Image
          src="/images/about_page/image4.jpg"
          alt="Government Food Supply Process Management System"
          fill
          priority
          className="absolute inset-0 bg-black bg-opacity-50 z-10 object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="relative z-10 flex flex-col items-center justify-center text-center text-white h-full px-8">
          <h1
            className="text-3xl md:text-[2.5rem] mb-4"
            style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}
          >
            Government Food Supply Process Management System
          </h1>
          <p
            className="text-lg md:text-[1.2rem] max-w-[800px] mx-auto"
            style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}
          >
            Enhancing nutrition for Sri Lanka's school children through digital innovation
          </p>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex justify-center flex-wrap md:flex-nowrap gap-2 bg-white p-4 shadow-md sticky top-0 z-10">
        <button
          className={`${sectionNavItemBaseClasses} ${activeSection === 'overview' ? 'bg-blue-800 text-white' : 'bg-transparent text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveSection('overview')}
        >
          Overview
        </button>
        <button
          className={`${sectionNavItemBaseClasses} ${activeSection === 'mission' ? 'bg-blue-800 text-white' : 'bg-transparent text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveSection('mission')}
        >
          Our Mission
        </button>
        <button
          className={`${sectionNavItemBaseClasses} ${activeSection === 'process' ? 'bg-blue-800 text-white' : 'bg-transparent text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveSection('process')}
        >
          The Process
        </button>
        <button
          className={`${sectionNavItemBaseClasses} ${activeSection === 'team' ? 'bg-blue-800 text-white' : 'bg-transparent text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveSection('team')}
        >
          Our Team
        </button>
        <button
          className={`${sectionNavItemBaseClasses} ${activeSection === 'milestones' ? 'bg-blue-800 text-white' : 'bg-transparent text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveSection('milestones')}
        >
          Milestones
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 max-w-[1200px] mx-auto w-full">
        {activeSection === 'overview' && (
          <div className="bg-white rounded-lg p-8 mb-8 shadow">
            <h2 className="text-blue-800 mb-6 text-[1.8rem] font-semibold">🥦 About the Program</h2>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 min-w-[300px]">
                <p className="text-justify mb-4">
                  The Government Food Supply Process Management System is a digital platform designed to enhance
                  the efficiency and transparency of Sri Lanka's School Children's Nutrition Program. This system
                  replaces the traditional manual process with a modern, computerized solution to streamline food
                  distribution and reporting in government schools.
                </p>
                <p className="text-justify mb-4">
                  Our platform connects all stakeholders in the food supply chain - from government officials and
                  suppliers to school administrators and nutrition officers - creating a seamless flow of information
                  and resources.
                </p>
                <p className="text-justify mb-4">
                  By digitizing the entire process, we've significantly reduced paperwork, minimized errors, and
                  accelerated the delivery of nutritious meals to thousands of school children across the country.
                </p>
              </div>
              <div className="flex-1 min-w-[300px] flex justify-center">
                <Image
                  src="/images/home_page/top_images/image1.jpg"
                  alt="Children enjoying nutritious meals"
                  width={400}
                  height={300}
                  className="rounded-lg object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'mission' && (
          <div className="bg-white rounded-lg p-8 mb-8 shadow">
            <h2 className="text-blue-800 mb-6 text-[1.8rem] font-semibold">🎯 Our Mission</h2>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 min-w-[300px] flex justify-center md:order-1 order-2">
                <Image
                  src="/images/home_page/top_images/image2.jpg"
                  alt="Our mission visualization"
                  width={400}
                  height={300}
                  className="rounded-lg object-cover"
                />
              </div>
              <div className="flex-1 min-w-[300px] md:order-2 order-1">
                <p className="text-justify mb-4">
                  To ensure every child receives nutritious meals without delays or discrepancies, while minimizing
                  administrative burden and reducing chances of fraud.
                </p>
                <h3 className="text-xl font-semibold text-blue-700 mb-2">Key Objectives:</h3>
                <ul className="list-disc pl-6">
                  <li className="mb-2">Improve the nutritional status of school children</li>
                  <li className="mb-2">Ensure timely and accurate delivery of food supplies</li>
                  <li className="mb-2">Enhance transparency and accountability in the distribution process</li>
                  <li className="mb-2">Reduce administrative workload for school staff</li>
                  <li className="mb-2">Provide real-time monitoring and reporting capabilities</li>
                  <li className="mb-2">Minimize food waste and optimize resource allocation</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'process' && (
          <div className="bg-white rounded-lg p-8 mb-8 shadow">
            <h2 className="text-blue-800 mb-6 text-[1.8rem] font-semibold">⚙️ The Process</h2>
            <div className="flex flex-col gap-6 mb-8">
              {[
                { num: 1, title: 'Planning & Allocation', desc: 'Nutritionists and program administrators plan balanced meals and allocate resources based on school enrollment data.' },
                { num: 2, title: 'Supplier Coordination', desc: 'Local suppliers are coordinated to provide fresh, quality ingredients according to the planned menu.' },
                { num: 3, title: 'Distribution', desc: 'Food supplies are distributed to schools with real-time tracking and verification.' },
                { num: 4, title: 'Preparation & Serving', desc: 'School staff prepare and serve nutritious meals to students according to guidelines.' },
                { num: 5, title: 'Monitoring & Reporting', desc: 'Digital attendance and consumption data is recorded, with automatic report generation for stakeholders.' }
              ].map(step => (
                <div key={step.num} className="flex gap-6 items-start">
                  <div className="bg-blue-800 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-[1.2rem] flex-shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="text-blue-800 font-semibold text-lg">{step.title}</h3>
                    <p className="text-justify">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Image
                src="/images/home_page/top_images/image4.jpg"
                alt="The nutrition program process"
                width={800}
                height={400}
                className="w-full h-auto rounded-lg object-cover"
              />
            </div>
          </div>
        )}

        {activeSection === 'team' && (
          <div className="bg-white rounded-lg p-8 mb-8 shadow">
            <h2 className="text-blue-800 mb-6 text-[1.8rem] font-semibold">👥 Our Team</h2>
            <p className="text-justify mb-8 text-[1.1rem] max-w-[800px] mx-auto">
              Our dedicated team of professionals works tirelessly to ensure the success of the School Children's Nutrition Program.
            </p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-8">
              {teamMembers.map((member, index) => (
                <div key={index} className="text-center bg-slate-50 p-6 rounded-lg shadow">
                  <div className="mb-4 inline-block"> {/* Added inline-block for centering image if it's smaller than container */}
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={200}
                      height={200}
                      className="rounded-full object-cover" // mx-auto for centering image if its div is wider
                    />
                  </div>
                  <h3 className="my-2 text-blue-800 text-xl font-semibold">{member.name}</h3>
                  <h4 className="my-2 text-slate-600 font-normal text-md">{member.role}</h4>
                  <p className="text-justify text-sm">{member.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'milestones' && (
          <div className="bg-white rounded-lg p-8 mb-8 shadow">
            <h2 className="text-blue-800 mb-6 text-[1.8rem] font-semibold">🏆 Program Milestones</h2>
            <div className="relative max-w-[800px] mx-auto">
              {/* The vertical line */}
              <div className="absolute top-0 bottom-0 w-1 bg-blue-800 left-[30px] md:left-[60px] transform -translate-x-1/2"></div>

              {milestones.map((milestone, index) => (
                <div key={index} className="relative pl-[calc(30px+1.5rem)] md:pl-[calc(60px+1.5rem)] mb-8">
                  {/* Dot on the line */}
                  <div className="absolute w-4 h-4 bg-blue-800 rounded-full top-1 left-[30px] md:left-[60px] transform -translate-x-1/2 border-2 border-white"></div>
                  {/* Year - absolutely positioned to the left of the dot/line */}
                  <div className="absolute top-0 left-0 w-[calc(30px+0.5rem)] md:w-[calc(60px+0.5rem)] text-right pr-4 font-bold text-blue-800">
                    {milestone.year}
                  </div>
                  {/* Content */}
                  <div className="bg-slate-50 p-6 rounded-lg shadow-sm">
                    <h3 className="text-blue-800 font-semibold text-lg">{milestone.title}</h3>
                    <p className="text-justify">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contact Section */}
      <div className="bg-blue-800 text-white py-12 px-8 text-center">
        <h2 className="text-3xl font-semibold mb-4">Contact Us</h2>
        <p className="max-w-[800px] mx-auto mb-8">For more information about the Government Food Supply Process Management System, please contact us:</p>
        <div className="flex justify-center flex-wrap gap-8 mt-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📧</span>
            <span>nutrition@gov.lk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📞</span>
            <span>+94 11 2345678</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📍</span>
            <span>Ministry of Education, Isurupaya, Battaramulla, Sri Lanka</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white text-center p-6 text-sm">
        <p>© 2023 Government Food Supply Process Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}