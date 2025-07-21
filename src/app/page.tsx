"use client"
import { useState } from "react"
import { ArrowRight, Star, User } from "lucide-react"
import { useSelection } from "@/lib/context"

export default function MainMenu() {
  const { user, signIn, signOut } = useSelection()
  const [showSignIn, setShowSignIn] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [status, setStatus] = useState<"idle"|"loading"|"sent"|"error">("idle")
  const [error, setError] = useState("")

  const menuItems = [
    { name: "State", href: "/states" },
    { name: "Nation", href: "/nation" },
    { name: "Category", href: "/category" },
    { name: "Measure", href: "/measure" },
    { name: "Vital Few", href: "/vital-few" },
    { name: "My Favorites", href: "/favorites" },
  ]

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setError("")
    
    if (email.trim()) {
      try {
        const res = await fetch("/api/auth/magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), name: name.trim() })
        })
        
        if (res.ok) {
          setStatus("sent")
          // For demo purposes, sign in immediately
          signIn(email.trim(), name.trim() || undefined)
          setShowSignIn(false)
          setEmail("")
          setName("")
        } else {
          setStatus("error")
          setError("Failed to send magic link. Please try again.")
        }
      } catch (error) {
        setStatus("error")
        setError("Failed to send magic link. Please try again.")
      }
    }
  }

  const handleSignOut = () => {
    signOut()
  }

  // Show sign-in form if no user is logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-white px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-4 h-4 text-black">★</div>
                  ))}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-black">RESULTS</h1>
                  <h2 className="text-2xl font-bold text-black">AMERICA</h2>
                </div>
              </div>
              
              {/* Sign in/up buttons */}
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 border border-gray-300 rounded text-black bg-white hover:bg-gray-50"
                  onClick={() => setShowSignIn(true)}
                >
                  Sign in
                </button>
                <button
                  className="px-4 py-2 border border-gray-300 rounded text-black bg-white hover:bg-gray-50"
                  onClick={() => setShowSignIn(true)}
                >
                  Sign up
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="w-full h-64 relative overflow-hidden">
          <img
            src="/state-capitol-building.png"
            alt="State Capitol Building"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to a placeholder if image doesn't exist
              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%236b7280' font-family='sans-serif' font-size='16'%3EState Capitol Building%3C/text%3E%3C/svg%3E"
            }}
          />
          <div className="absolute top-4 right-4 bg-red-600 px-3 py-1 rounded-md shadow-lg">
            <span className="text-white font-bold text-sm">RESULTS AMERICA</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-left mb-6">
            <h3 className="text-2xl font-bold text-black mb-2">RESULTS AMERICA</h3>
            <h4 className="text-3xl font-bold text-black mb-4">MAIN MENU</h4>
            <h5 className="text-2xl font-bold text-black mb-2">The Great American Report Card</h5>
            <p className="text-lg text-gray-700 mb-6">
              Understand How Your State Is Performing Across Education, Safety, Health, And More.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-4 mb-8">
            <button className="px-6 py-3 bg-blue-500 text-white rounded-t-lg font-medium">
              About the App
            </button>
            <button className="px-6 py-3 text-black bg-white border border-gray-300 rounded-t-lg font-medium">
              Our Mission
            </button>
            <button className="px-6 py-3 text-black bg-white border border-gray-300 rounded-t-lg font-medium">
              Categories
            </button>
          </div>

          {/* About the App Content */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-600 rounded"></div>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-black mb-2">The Great American Report Card</h4>
                <p className="text-gray-600 mb-3">A free app for both Apple and Android smartphones and tablets.</p>
                <p className="text-gray-700 mb-4">
                  This tool allows citizens to track state performance across multiple categories with 5-year trend data. View detailed metrics and compare different states with easy-to-understand scorecards.
                </p>
                <p className="text-blue-600 underline font-medium">
                  Our goal: Get the app in the hands of at least 10 million U.S. voters.
                </p>
              </div>
            </div>
          </div>

          {/* Brought to you by section */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">Brought to you by:</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-blue-600 font-bold text-lg">WASHINGTON POLICY CENTER</span>
              <div className="w-6 h-6 bg-blue-600 rounded-sm"></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-xs text-gray-500">© 2025 The Great American Report Card. All rights reserved.</p>
          </div>
        </div>

        {/* Sign-in Modal */}
        {showSignIn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-black">Sign In</h2>
                <button
                  onClick={() => setShowSignIn(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-black mb-1">Name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-black mb-1">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black bg-white"
                    placeholder="you@example.com"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Sending..." : "Sign In"}
                </button>
                {status === "error" && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-6 flex flex-col items-center">
        {/* Logo */}
        <div className="text-center mb-4">
          <div className="flex justify-center mb-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 text-red-600">★</div>
            ))}
          </div>
          <h1 className="text-3xl font-bold text-blue-900">RESULTS</h1>
          <h2 className="text-2xl font-semibold text-blue-700">AMERICA</h2>
        </div>
        
        {/* User info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span>{user.email}</span>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
          >
            Sign out
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-4 py-6">
        {/* Hero image */}
        <div className="w-full max-w-md mb-6">
          <img 
            src="/state-capitol-building.png" 
            alt="State Capitol Building"
            className="w-full h-48 object-cover rounded-lg shadow-md"
            onError={(e) => {
              // Fallback to a placeholder if image doesn't exist
              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%236b7280' font-family='sans-serif' font-size='16'%3EState Capitol Building%3C/text%3E%3C/svg%3E"
            }}
          />
        </div>

        {/* Main menu banner */}
        <div className="w-full max-w-md mb-6">
          <div className="bg-yellow-400 px-4 py-3 rounded-md">
            <h2 className="text-xl font-bold text-black text-center">MAIN MENU</h2>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="w-full max-w-md space-y-3">
          {menuItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="block w-full bg-red-600 hover:bg-red-700 text-white font-medium py-4 px-6 rounded-md text-center transition-colors"
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Slogan */}
        <div className="mt-8 text-center">
          <Star className="w-6 h-6 text-red-600 fill-current mx-auto mb-2" />
          <p className="text-red-600 font-medium text-sm">
            TALK IS CHEAP, RESULTS ARE PRICELESS
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white px-4 py-4 text-center">
        <p className="text-xs text-gray-500">
          © 2025 The Great American Report Card. All rights reserved.
        </p>
      </div>
    </div>
  )
}
