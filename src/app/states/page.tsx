"use client"
import { useState, useEffect } from "react"
import { ArrowLeft, X, User, ArrowRight } from "lucide-react"
import { useSelection } from "@/lib/context"
import Link from "next/link"
import Image from "next/image"

interface State {
  id: number;
  name: string;
  abbreviation: string;
}

export default function StateSelection() {
  const { selectedStates, setSelectedStates, user, signOut } = useSelection()
  const [showDropdown, setShowDropdown] = useState(false)
  const [states, setStates] = useState<State[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStates() {
      try {
        const response = await fetch('/api/states')
        if (!response.ok) {
          throw new Error('Failed to fetch states')
        }
        const data = await response.json()
        setStates(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch states')
      } finally {
        setLoading(false)
      }
    }
    
    fetchStates()
  }, [])

  const handleStateSelect = (state: string) => {
    if (selectedStates.includes(state)) {
      setSelectedStates(selectedStates.filter(s => s !== state))
    } else if (selectedStates.length < 4) {
      setSelectedStates([...selectedStates, state])
    }
    setShowDropdown(false)
  }

  const removeState = (state: string) => {
    setSelectedStates(selectedStates.filter(s => s !== state))
  }

  const clearAll = () => {
    setSelectedStates([])
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
        {/* US Map */}
        <div className="w-full max-w-md mb-6 relative">
          <Image 
            src="/us-map.svg" 
            alt="United States Map"
            width={400}
            height={250}
            className="w-full h-64 object-cover rounded-lg shadow-md"
            onError={(e) => {
              // Fallback to a placeholder if image doesn't exist
              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%236b7280' font-family='sans-serif' font-size='16'%3EUnited States Map%3C/text%3E%3C/svg%3E"
            }}
          />
          <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs font-medium text-black">
            STATES OF USA
          </div>
        </div>

        {/* Selection banner */}
        <div className="w-full max-w-md mb-6">
          <div className="bg-yellow-400 px-4 py-3 rounded-md">
            <h2 className="text-xl font-bold text-black text-center">SELECT STATES TO COMPARE</h2>
          </div>
        </div>

        {/* Instructions */}
        <div className="w-full max-w-md mb-6">
          <p className="text-black text-center text-sm">
            Choose one or more states you want to analyze, or leave empty to view all states
          </p>
        </div>

        {/* State selection */}
        <div className="w-full max-w-md mb-6">
          {loading && (
            <div className="text-center py-4">
              <p className="text-black">Loading states...</p>
            </div>
          )}
          
          {error && (
            <div className="text-center py-4">
              <p className="text-red-600">Error: {error}</p>
            </div>
          )}
          
          {!loading && !error && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full bg-white border border-gray-300 rounded-md px-4 py-3 text-left flex justify-between items-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <span className="text-black">
                  {selectedStates.length === 0 
                    ? "Select a state (maximum 4, or none for all states)"
                    : selectedStates[selectedStates.length - 1]
                  }
                </span>
                <div className="w-4 h-4 text-gray-600">▼</div>
              </button>

              {showDropdown && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto z-10">
                  {states.map((state) => (
                    <button
                      key={state.id}
                      onClick={() => handleStateSelect(state.name)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 text-black"
                    >
                      {state.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected states display */}
          {selectedStates.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedStates.map((state) => (
                  <div
                    key={state}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    <span>{state}</span>
                    <button
                      onClick={() => removeState(state)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-black">
                  {selectedStates.length} of 4 selected
                </span>
                <button
                  onClick={clearAll}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="w-full max-w-md flex gap-4">
          <Link
            href="/"
            className="flex-1 bg-white border border-gray-300 text-black font-medium py-3 px-6 rounded-md text-center hover:bg-gray-50 transition-colors"
          >
            Back
          </Link>
          <Link
            href="/category"
            className="flex-1 bg-blue-600 text-white font-medium py-3 px-6 rounded-md text-center hover:bg-blue-700 transition-colors"
          >
            Continue
          </Link>
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