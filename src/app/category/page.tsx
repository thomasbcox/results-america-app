"use client"
import { useState, useEffect } from "react"
import { User, ArrowRight, GraduationCap, DollarSign, ShieldCheck, Building2, Heart, TrendingUp, Eye } from "lucide-react"
import { useSelection } from "@/lib/context"

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
  statisticCount?: number;
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
  const { selectedCategory, setSelectedCategory, user, signOut } = useSelection()
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories?withStats=true')
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        const data = await response.json()
        setCategories(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories')
      } finally {
        setLoading(false)
      }
    }
    
    fetchCategories()
  }, [])

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  const getCategoryIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Eye
    return <IconComponent className="w-5 h-5" />
  }

  const handleSignOut = () => {
    signOut()
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
        <div className="flex items-center gap-2 text-sm text-black">
          <User className="w-4 h-4" />
          <span>{user?.email}</span>
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
            src="/state-capitol-building.jpg" 
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
              <p className="text-red-600">Error: {error}</p>
            </div>
          )}
          
          {!loading && !error && categories.map((category) => (
            <div key={category.id} className="relative">
              <button
                onClick={() => handleCategorySelect(category.name)}
                onMouseEnter={() => setHoveredCategory(category.name)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`w-full flex items-center justify-between p-4 rounded-md border transition-colors ${
                  selectedCategory === category.name
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-gray-100 text-black border-gray-300 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getCategoryIcon(category.icon)}
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="text-xs">i</div>
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
          {selectedCategory && (
            <a
              href={`/measure?category=${selectedCategory}`}
              className="flex-1 bg-blue-600 text-white font-medium py-3 px-6 rounded-md text-center hover:bg-blue-700 transition-colors"
            >
              Continue
            </a>
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