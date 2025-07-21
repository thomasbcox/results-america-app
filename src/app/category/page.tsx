"use client"
import { useState } from "react"
import { User, ArrowRight, GraduationCap, DollarSign, Shield, Building, Heart, TrendingUp, Eye } from "lucide-react"
import { useSelection } from "@/lib/context"

const CATEGORIES = [
  {
    id: "education",
    name: "Education",
    icon: GraduationCap,
    description: "Academic performance, graduation rates, and educational outcomes",
    measures: [
      "High School Graduation Rate", "College Readiness", "Student-Teacher Ratio",
      "Standardized Test Scores", "Early Childhood Education", "Higher Education Attainment"
    ]
  },
  {
    id: "economy",
    name: "Economy",
    icon: DollarSign,
    description: "Economic indicators, employment, and financial health",
    measures: [
      "Real GDP", "GDP Growth Rate", "Economic Diversity", "Business Competitiveness",
      "Household Income", "Affordable Housing", "Unemployment Rate", "Net Job Growth",
      "Income Inequality", "New Firms", "Venture Capital Investment", "Adult Poverty"
    ]
  },
  {
    id: "public-safety",
    name: "Public Safety",
    icon: Shield,
    description: "Crime rates, law enforcement, and community safety",
    measures: [
      "Violent Crime Rate", "Property Crime Rate", "Police Officers per Capita",
      "Recidivism Rate", "Emergency Response Time", "Community Policing"
    ]
  },
  {
    id: "environment",
    name: "Environment",
    icon: Building,
    description: "Environmental quality, sustainability, and natural resources",
    measures: [
      "Air Quality Index", "Water Quality", "Renewable Energy Usage",
      "Carbon Emissions", "Waste Management", "Protected Land Area"
    ]
  },
  {
    id: "health",
    name: "Health",
    icon: Heart,
    description: "Healthcare access, outcomes, and public health",
    measures: [
      "Life Expectancy", "Infant Mortality Rate", "Healthcare Access",
      "Mental Health Services", "Preventive Care", "Health Insurance Coverage"
    ]
  },
  {
    id: "government-efficiency",
    name: "Government Efficiency",
    icon: TrendingUp,
    description: "Government performance, efficiency, and service delivery",
    measures: [
      "Budget Efficiency", "Service Delivery Time", "Citizen Satisfaction",
      "Digital Services", "Infrastructure Investment", "Regulatory Efficiency"
    ]
  },
  {
    id: "government-transparency",
    name: "Government Transparency",
    icon: Eye,
    description: "Open government, accountability, and public access",
    measures: [
      "Public Records Access", "Financial Disclosure", "Meeting Transparency",
      "Whistleblower Protection", "Ethics Enforcement", "Public Participation"
    ]
  }
]

export default function CategorySelection() {
  const { selectedCategory, setSelectedCategory, user, signOut } = useSelection()
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  const getCategoryIcon = (icon: any) => {
    const IconComponent = icon
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
        <div className="flex items-center gap-2 text-sm text-gray-600">
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
          {CATEGORIES.map((category) => (
            <div key={category.id} className="relative">
              <button
                onClick={() => handleCategorySelect(category.id)}
                onMouseEnter={() => setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`w-full flex items-center justify-between p-4 rounded-md border transition-colors ${
                  selectedCategory === category.id
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
              {hoveredCategory === category.id && (
                <div className="absolute left-full top-0 ml-2 w-64 bg-white border border-gray-300 rounded-md p-3 shadow-lg z-10">
                  <h4 className="font-medium text-black mb-2">{category.name} Includes:</h4>
                  <ul className="text-sm text-black space-y-1">
                    {category.measures.map((measure, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-gray-400 mr-2">•</span>
                        {measure}
                      </li>
                    ))}
                  </ul>
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
        <p className="text-xs text-gray-500">
          © 2025 The Great American Report Card. All rights reserved.
        </p>
      </div>
    </div>
  )
} 