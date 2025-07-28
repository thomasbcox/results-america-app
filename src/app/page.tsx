"use client"
import { useState, useEffect } from "react"
import { useSelection } from "@/lib/context"
import { GraduationCap, Building2, Heart, DollarSign, TrendingUp, ShieldCheck, MapPin, BarChart3, Users, Star, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function LandingPage() {
  const { user, signIn, signOut } = useSelection()


  // Check if user is authenticated on page load (only once)
  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        try {
          console.log('🔍 Checking authentication on page load...')
          const response = await fetch('/api/auth/me')
          const data = await response.json()
          console.log('📡 /api/auth/me response:', data)
          
          if (response.ok) {
            if (data.success && data.data) {
              // User is authenticated on server but not in context
              const serverUser = data.data
              console.log('✅ User authenticated on server:', serverUser)
              await signIn(serverUser.email, serverUser.name)
            }
          } else {
            console.log('❌ User not authenticated on server:', data)
          }
          
          setAuthCheck({
            timestamp: new Date().toISOString(),
            response: data,
            status: response.status,
            ok: response.ok
          })
        } catch (error) {
          console.error('❌ Failed to check authentication:', error)
          setAuthCheck({
            timestamp: new Date().toISOString(),
            error: error.message,
            status: 'error'
          })
        }
      }
    }
    
    checkAuth()
  }, []) // Only run once on mount, not on every user change

  

  const handleSignOut = async () => {
    console.log('🚪 Signing out...')
    await signOut()
  }

  const features = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "State Comparisons",
      description: "Compare performance across multiple states with interactive visualizations"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Detailed Metrics",
      description: "Access comprehensive data on education, health, economy, and more"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Trend Analysis",
      description: "View 5-year trends to understand how states are improving or declining"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Citizen-Focused",
      description: "Data-driven insights that matter to American families and communities"
    }
  ]

  const categories = [
    { icon: <GraduationCap className="w-5 h-5" />, name: "Education", color: "bg-blue-100 text-blue-600" },
    { icon: <Building2 className="w-5 h-5" />, name: "Environment", color: "bg-orange-100 text-orange-600" },
    { icon: <Heart className="w-5 h-5" />, name: "Health", color: "bg-pink-100 text-pink-600" },
    { icon: <DollarSign className="w-5 h-5" />, name: "Economy", color: "bg-green-100 text-green-600" },
    { icon: <TrendingUp className="w-5 h-5" />, name: "Efficiency", color: "bg-purple-100 text-purple-600" },
    { icon: <ShieldCheck className="w-5 h-5" />, name: "Public Safety", color: "bg-red-100 text-red-600" }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white px-4 py-6 flex flex-col items-center border-b border-gray-200">
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
        
        {/* User actions */}
        <div className="flex gap-2 items-center">
          {user ? (
            <>
              <span className="px-4 py-2 text-sm text-gray-600">{user.email}</span>
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors flex items-center gap-1"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </Link>
              )}
              <button
                className="px-4 py-2 border border-blue-600 rounded text-blue-600 bg-white hover:bg-blue-50"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Sign in for enhanced features
              </Link>
            </>
          )}
        </div>

        
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <Star className="w-4 h-4 mr-1" />
              No account required
            </span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            The Great American Report Card
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Understand how your state is performing across education, safety, health, and more. 
            Compare states, track trends, and make informed decisions with data-driven insights.
            <strong className="text-blue-600"> Start exploring right now - no signup required!</strong>
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/states"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg flex items-center justify-center gap-2"
            >
              Start Comparing States
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/category"
              className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-lg"
            >
              Explore Categories
            </Link>
          </div>

          {/* Hero Image */}
          <div className="max-w-4xl mx-auto">
            <Image 
              src="/state-capitol-building.png" 
              alt="State Capitol Building"
              width={800}
              height={400}
              className="w-full h-64 object-cover rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-4 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Use Results America?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="px-4 py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Comprehensive Categories
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Our data covers all the metrics that matter most to American families and communities
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className={`w-10 h-10 ${category.color} rounded-full flex items-center justify-center mb-4`}>
                  {category.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-gray-600 text-sm">
                  {category.name === "Education" && "Student performance, graduation rates, teacher quality"}
                  {category.name === "Environment" && "Air quality, water quality, renewable energy"}
                  {category.name === "Health" && "Healthcare access, outcomes, insurance coverage"}
                  {category.name === "Economy" && "Jobs, income, housing, poverty, business growth"}
                  {category.name === "Efficiency" && "Government spending, infrastructure, services"}
                  {category.name === "Public Safety" && "Crime rates, emergency response, law enforcement"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Start Section */}
      <div className="px-4 py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            No account required. Start exploring state performance data right now.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/states"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg flex items-center justify-center gap-2"
            >
              Compare States Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/category"
              className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors text-lg"
            >
              Browse Categories
            </Link>
          </div>
        </div>
      </div>

      {/* Enhanced Features Section */}
      <div className="px-4 py-16 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Enhanced Features</h2>
          <p className="text-lg text-gray-600 mb-8">
            Sign in to unlock additional features and save your preferences
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Save Favorites</h3>
              <p className="text-gray-600 text-sm">Bookmark your favorite measures for quick access</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Progress</h3>
              <p className="text-gray-600 text-sm">Save your state selections and continue later</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalized Experience</h3>
              <p className="text-gray-600 text-sm">Get recommendations based on your interests</p>
            </div>
          </div>
          {!user && (
            <Link
              href="/auth/login"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
            >
              Sign in for Enhanced Features
            </Link>
          )}
        </div>
      </div>

      {/* Mission Section */}
      <div className="px-4 py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Star className="w-12 h-12 text-yellow-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-lg text-gray-600 mb-6">
            To provide citizens with transparent, data-driven insights into how their state is performing 
            across key metrics that matter most to American families.
          </p>
          <p className="text-lg text-gray-600 mb-8">
            We believe that informed citizens make better decisions, and better decisions lead to 
            stronger communities and a stronger America.
          </p>
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-6">
            <p className="text-yellow-800 font-semibold">
              Our goal: Get the app in the hands of at least 10 million U.S. voters.
            </p>
          </div>
        </div>
      </div>

      {/* Sponsorship */}
      <div className="px-4 py-12 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 mb-4">Brought to you by:</p>
          <div className="bg-blue-600 text-white px-8 py-4 rounded-lg inline-block">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded"></div>
              <span className="font-bold text-lg">WASHINGTON POLICY CENTER</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-8 text-center border-t border-gray-200">
        <p className="text-sm text-gray-600">
          © 2025 The Great American Report Card. All rights reserved.
        </p>
      </div>


    </div>
  )
}
