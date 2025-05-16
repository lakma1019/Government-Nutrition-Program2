'use client'; // Use client directive as in the example HomePage

import Link from "next/link"; // Import Link if you want to add a "Back to Login" button

/**
 * Page to instruct users on how to recover their password.
 * Based on the provided HomePage.tsx UI style for colors and layout.
 */
export default function RecoverPasswordPage() {
  return (
    // Main container mimicking the body style of the example page
    // min-h-screen ensures it takes at least the full viewport height
    // bg-green-50 is a light background color from the example palette
    // flex items-center justify-center centers the content vertically and horizontally
    // py-12 adds some padding on top and bottom
    <div className="min-h-screen bg-green-50 flex items-center justify-center py-12">
      <div className="container mx-auto px-4">
        {/* Content box styled similarly to content blocks in the example */}
        {/* text-center centers the text within the box */}
        {/* bg-white is a clean background for the content */}
        {/* p-8 adds padding inside the box */}
        {/* rounded-lg adds rounded corners */}
        {/* shadow-md adds a subtle shadow */}
        {/* max-w-md mx-auto limits the width and centers the box on larger screens */}
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">

          {/* Page Title - using a similar font style and color from the example */}
          <h1 className="text-2xl md:text-3xl font-bold text-green-800 mb-4">
            Password Recovery
          </h1>

          {/* Main Message - using text styles from the example */}
          <p className="text-green-700 text-lg mb-6">
            To recover your password, please contact the administrator of the system.
          </p>

          {/* Optional: Provide a link back to the login page for user convenience */}
          {/* Styled as a simple link with hover effect */}
          <Link
            href="/login" // Assuming your login page is at /login
            className="inline-block text-green-600 hover:text-green-800 transition-colors underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}