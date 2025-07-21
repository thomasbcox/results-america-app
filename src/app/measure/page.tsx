"use client"
import { useState } from "react"
import { User, ArrowRight, Star, Clock } from "lucide-react"
import { useSelection } from "@/lib/context"

// Mock data for Economy category measures
const ECONOMY_MEASURES = [
  { id: 8, name: "Real GDP", available: false },
  { id: 9, name: "GDP Growth Rate", available: false },
  { id: 10, name: "Economic Diversity", available: false },
  { id: 11, name: "Business Competitiveness", available: false },
  { id: 12, name: "Household Income", available: false },
  { id: 13, name: "Affordable Housing", available: false },
  { id: 14, name: "Unemployment Rate", available: true },
  { id: 15, name: "Net Job Growth", available: true },
  { id: 16, name: "Income Inequality", available: true },
  { id: 17, name: "New Firms", available: false },
  { id: 18, name: "Venture Capital Investment", available: false },
  { id: 19, name: "Adult Poverty", available: false },
  { id: 20, name: "Child Poverty", available: false },
  { id: 21, name: "Food Insecurity", available: false },
  { id: 22, name: "Homelessness", available: true },
]

export default function MeasureSelection() {
  const { selectedMeasure, setSelectedMeasure, favorites, toggleFavorite, user, signOut } = useSelection()

  const handleMeasureSelect = (measureId: number) => {
    setSelectedMeasure(measureId)
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

        {/* Measure banner */}
        <div className="w-full max-w-md mb-6">
          <div className="bg-yellow-400 px-4 py-3 rounded-md">
            <h2 className="text-xl font-bold text-black text-center">MEASURE</h2>
          </div>
        </div>

        {/* Instructions */}
        <div className="w-full max-w-md mb-6">
          <p className="text-black text-center text-sm">
            Choose a measure from the Economy category
          </p>
        </div>

        {/* Measure grid */}
        <div className="w-full max-w-md mb-6">
          <div className="grid grid-cols-1 gap-3">
            {ECONOMY_MEASURES.map((measure) => (
              <div
                key={measure.id}
                className={`relative p-4 rounded-md border cursor-pointer transition-colors ${
                  selectedMeasure === measure.id
                    ? 'bg-red-600 text-white border-red-600'
                    : measure.available
                    ? 'bg-white text-black border-gray-300 hover:bg-gray-50'
                    : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}
                onClick={() => measure.available && handleMeasureSelect(measure.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      selectedMeasure === measure.id
                        ? 'bg-white text-red-600'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {measure.id}
                    </div>
                    <span className="font-medium">{measure.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!measure.available && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Clock className="w-3 h-3" />
                        <span>Data unavailable</span>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(measure.id)
                      }}
                      className={`p-1 rounded ${
                        favorites.includes(measure.id)
                          ? 'text-yellow-500'
                          : 'text-gray-400 hover:text-yellow-500'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${favorites.includes(measure.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="w-full max-w-md flex gap-4">
          <a
            href="/category"
            className="flex-1 bg-white border border-gray-300 text-black font-medium py-3 px-6 rounded-md text-center hover:bg-gray-50 transition-colors"
          >
            Back
          </a>
          {selectedMeasure && (
            <a
              href={`/results?measure=${selectedMeasure}`}
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