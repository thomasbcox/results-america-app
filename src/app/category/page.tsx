"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { GraduationCap, DollarSign, ShieldCheck, Building2, Heart, TrendingUp, Eye } from "lucide-react"
import { useSelection } from "@/lib/context"
import AuthStatus from "@/components/AuthStatus"

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
  statisticCount?: number;
  hasData?: boolean;
}

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  'GraduationCap': GraduationCap,
  'DollarSign': DollarSign,
  'ShieldCheck': ShieldCheck,
  'Building2': Building2,
  'Heart': Heart,
  'TrendingUp': TrendingUp,
  'Eye': Eye,
}

export default function CategorySelection() {
  const { selectedCategory, setSelectedCategory, user } = useSelection()
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  console.log('CategorySelection - User:', user)
  console.log('CategorySelection - Selected category:', selectedCategory)

  useEffect(() => {
    async function fetchCategories() {
      try {
        console.log('Fetching categories...')
        const response = await fetch('/api/categories?withStats=true&withAvailability=true', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        console.log('Response status:', response.status)
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status}`)
        }
        const result = await response.json()
        console.log('Categories loaded:', result)
        // Extract the data array from the API response
        setCategories(result.data || [])
              } catch (err) {
          console.error('Error fetching categories:', err)
          setError(err instanceof Error ? err.message : 'Failed to fetch categories')
          
          // Retry up to 3 times
          if (retryCount < 3) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1)
              setLoading(true)
              setError(null)
            }, 1000)
          }
        } finally {
          setLoading(false)
        }
    }
    
    // Add a small delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      fetchCategories()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [retryCount])

  const handleCategorySelect = (categoryName: string, hasData: boolean) => {
    if (!hasData) {
      console.log('Category has no data, cannot select:', categoryName)
      return
    }
    console.log('Category selected:', categoryName)
    setSelectedCategory(categoryName)
  }

  const getCategoryIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Eye
    return <IconComponent className="w-5 h-5" />
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
        
        {/* User info - only show if user is logged in */}
        <AuthStatus />
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
              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%236b7280' font-family='sans-serif' font-size='16'%3EState Capitol Building%3C/text%3E%3C/svg%3E"
            }}
          />
        </div>

        {/* Category banner */}
        <div className="w-full max-w-md mb-6">
          <div className="bg-yellow-400 px-4 py-3 rounded-md">
            <h2 className="text-xl font-bold text-black text-center">CATEGORY</h2>
          </div>
        </div>

        {/* Instructions */}
        <div className="w-full max-w-md mb-6">
          <p className="text-black text-center text-sm">
            Choose a category to see state performance measures
          </p>
          {selectedCategory && (
            <p className="text-green-600 text-center text-sm mt-2 font-medium">
              ✓ Selected: {selectedCategory}
            </p>
          )}
          {!user && (
            <p className="text-blue-600 text-center text-xs mt-2">
              💡 Your selections will be saved for this session
            </p>
          )}
        </div>

        {/* Category buttons */}
        <div className="w-full max-w-md mb-6 space-y-3">
          {loading && (
            <div className="text-center py-4">
              <p className="text-black">Loading categories...</p>
            </div>
          )}
          
          {error && (
            <div className="text-center py-4">
              <p className="text-red-600 mb-2">Error: {error}</p>
              <button
                onClick={() => {
                  setRetryCount(0)
                  setLoading(true)
                  setError(null)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          )}
          
          {!loading && !error && categories.map((category) => (
            <div key={category.id} className="relative">
              <button
                onClick={() => handleCategorySelect(category.name, (category.statisticCount || 0) > 0)}
                onMouseEnter={() => setHoveredCategory(category.name)}
                onMouseLeave={() => setHoveredCategory(null)}
                disabled={(category.statisticCount || 0) === 0}
                className={`w-full flex items-center justify-between p-4 rounded-md border transition-colors ${
                  (category.statisticCount || 0) === 0
                    ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed opacity-60'
                    : selectedCategory === category.name
                    ? 'bg-red-600 text-white border-red-600 shadow-md cursor-pointer'
                    : 'bg-gray-100 text-black border-gray-300 hover:bg-gray-200 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getCategoryIcon(category.icon)}
                  <span className="font-medium">{category.name}</span>
                  {selectedCategory === category.name && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="text-xs opacity-60">i</div>
              </button>

              {/* Tooltip */}
              {hoveredCategory === category.name && (
                <div className="absolute left-full top-0 ml-2 w-64 bg-white border border-gray-300 rounded-md p-3 shadow-lg z-10">
                  <h4 className="font-medium text-black mb-2">{category.name} Includes:</h4>
                  <p className="text-sm text-black">{category.description}</p>
                  {category.statisticCount && (
                    <p className="text-sm text-gray-600 mt-2">
                      {category.statisticCount} measures available
                    </p>
                  )}
                  {(category.statisticCount || 0) === 0 && (
                    <p className="text-sm text-red-600 mt-2 font-medium">
                      ⚠️ No data available for this category
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="w-full max-w-md flex gap-4">
          <a
            href="/states"
            className="flex-1 bg-white border border-gray-300 text-black font-medium py-3 px-6 rounded-md text-center hover:bg-gray-50 transition-colors"
          >
            Back
          </a>
          {selectedCategory ? (
            <a
              href={`/measure?category=${encodeURIComponent(selectedCategory)}`}
              className="flex-1 bg-blue-600 text-white font-medium py-3 px-6 rounded-md text-center hover:bg-blue-700 transition-colors"
            >
              Continue
            </a>
          ) : (
            <button
              disabled
              className="flex-1 bg-gray-300 text-gray-500 font-medium py-3 px-6 rounded-md text-center cursor-not-allowed"
            >
              Continue
            </button>
          )}
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