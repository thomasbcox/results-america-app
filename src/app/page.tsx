"use client"
import { useState } from "react"
import { useSelection } from "@/lib/context"
import { GraduationCap, Building2, Heart, DollarSign, TrendingUp, ShieldCheck } from "lucide-react"
import Image from "next/image"

export default function MainMenu() {
  const { user, signIn, signOut } = useSelection()
  const [showSignIn, setShowSignIn] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [status, setStatus] = useState<"idle"|"loading"|"sent"|"error">("idle")
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("about")

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

  const renderTabContent = () => {
    switch (activeTab) {
      case "about":
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-blue-600 rounded"></div>
              <h3 className="text-lg font-bold text-black">The Great American Report Card</h3>
            </div>
            <p className="text-black mb-3">A free app for both Apple and Android smartphones and tablets.</p>
            <p className="text-black mb-4">This tool allows citizens to track state performance across multiple categories with 5-year trend data. View detailed metrics and compare different states with easy-to-understand scorecards.</p>
            <a href="#" className="text-blue-600 underline">Our goal: Get the app in the hands of at least 10 million U.S. voters.</a>
          </div>
        )
      case "mission":
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-black mb-3">Our Mission</h3>
            <p className="text-black mb-3">To provide citizens with transparent, data-driven insights into how their state is performing across key metrics that matter most to American families.</p>
            <p className="text-black">We believe that informed citizens make better decisions, and better decisions lead to stronger communities and a stronger America.</p>
          </div>
        )
      case "categories":
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-black mb-4">Measures organized into these key categories:</h3>
            <div className="grid grid-cols-2 gap-6 mb-4">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-black font-medium">Education</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-black font-medium">Environment</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <Heart className="w-4 h-4 text-pink-600" />
                  </div>
                  <span className="text-black font-medium">Health</span>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-black font-medium">Economy</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-black font-medium">Efficiency</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-black font-medium">Public Safety</span>
                </div>
              </div>
            </div>
            <p className="text-black text-sm">The Economy category includes measures for jobs, income, housing, poverty, new business startups, and quality of life.</p>
          </div>
        )
      default:
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-black mb-4">Unknown Tab</h3>
            <p className="text-black">Please select a valid tab from the navigation above.</p>
          </div>
        )
    }
  }

  // Show sign-in form if no user is logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
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
          
          {/* Sign in/up buttons */}
          <div className="flex gap-2">
            <button
              className="px-4 py-2 border border-blue-600 rounded text-blue-600 bg-white hover:bg-blue-50"
              onClick={() => setShowSignIn(true)}
            >
              Sign in
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setShowSignIn(true)}
            >
              Sign up
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center px-4 py-6">
          {/* Hero image - much smaller and centered */}
          <div className="w-full max-w-2xl mb-8">
            <Image 
              src="/state-capitol-building.png" 
              alt="State Capitol Building"
              width={600}
              height={200}
              className="w-full h-48 object-cover rounded-lg shadow-lg"
            />
          </div>

          {/* Main title */}
          <h1 className="text-4xl font-bold text-black text-center mb-4">
            The Great American Report Card
          </h1>
          
          {/* Slogan */}
          <p className="text-xl text-blue-600 text-center mb-8 max-w-2xl">
            Understand How Your State Is Performing Across Education, Safety, Health, And More.
          </p>

          {/* Navigation tabs */}
          <div className="w-full max-w-2xl mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("about")}
                className={`flex-1 px-6 py-3 font-medium ${
                  activeTab === "about" 
                    ? "bg-blue-600 text-white" 
                    : "bg-white text-gray-600 hover:text-gray-800"
                }`}
              >
                About the App
              </button>
              <button
                onClick={() => setActiveTab("mission")}
                className={`flex-1 px-6 py-3 font-medium ${
                  activeTab === "mission" 
                    ? "bg-blue-600 text-white" 
                    : "bg-white text-gray-600 hover:text-gray-800"
                }`}
              >
                Our Mission
              </button>
              <button
                onClick={() => setActiveTab("categories")}
                className={`flex-1 px-6 py-3 font-medium ${
                  activeTab === "categories" 
                    ? "bg-blue-600 text-white" 
                    : "bg-white text-gray-600 hover:text-gray-800"
                }`}
              >
                Categories
              </button>
            </div>
          </div>

          {/* Tab content */}
          <div className="w-full max-w-2xl mb-8">
            {renderTabContent()}
          </div>

          {/* Sponsorship */}
          <div className="text-center mb-6">
            <p className="text-black mb-4">Brought to you by:</p>
            <div className="bg-blue-600 text-white px-6 py-3 rounded-lg inline-block">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white rounded"></div>
                <span className="font-bold">WASHINGTON POLICY CENTER</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-4 py-4 text-center">
          <p className="text-xs text-black">
            © 2025 The Great American Report Card. All rights reserved.
          </p>
        </div>

        {/* Sign-in Modal */}
        {showSignIn && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-black">Sign In</h2>
                <button
                  onClick={() => setShowSignIn(false)}
                  className="text-gray-600 hover:text-black"
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

  // Logged-in user view - show the original menu design
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
        <div className="flex items-center gap-2 text-sm text-black">
          <span>{user.email}</span>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-4 py-6">
        {/* Hero image */}
        <div className="w-full max-w-md mb-6">
          <Image 
            src="/state-capitol-building.png" 
            alt="State Capitol Building"
            width={600}
            height={200}
            className="w-full h-48 object-cover rounded-lg shadow-md"
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
          <a href="/states" className="block w-full bg-red-600 hover:bg-red-700 text-white font-medium py-4 px-6 rounded-md text-center transition-colors">
            State
          </a>
          <a href="/nation" className="block w-full bg-red-600 hover:bg-red-700 text-white font-medium py-4 px-6 rounded-md text-center transition-colors">
            Nation
          </a>
          <a href="/category" className="block w-full bg-red-600 hover:bg-red-700 text-white font-medium py-4 px-6 rounded-md text-center transition-colors">
            Category
          </a>
          <a href="/measure" className="block w-full bg-red-600 hover:bg-red-700 text-white font-medium py-4 px-6 rounded-md text-center transition-colors">
            Measure
          </a>
          <a href="/vital-few" className="block w-full bg-red-600 hover:bg-red-700 text-white font-medium py-4 px-6 rounded-md text-center transition-colors">
            Vital Few
          </a>
          <a href="/favorites" className="block w-full bg-red-600 hover:bg-red-700 text-white font-medium py-4 px-6 rounded-md text-center transition-colors">
            My Favorites
          </a>
        </div>

        {/* Slogan */}
        <div className="mt-8 text-center">
          <div className="w-6 h-6 text-red-600 mx-auto mb-2">★</div>
          <p className="text-red-600 font-medium text-sm">
            TALK IS CHEAP, RESULTS ARE PRICELESS
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white px-4 py-4 text-center">
        <p className="text-xs text-black">
          © 2025 The Great American Report Card. All rights reserved.
        </p>
      </div>
    </div>
  )
}
