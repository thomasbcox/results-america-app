"use client"
import { useState, useEffect, Suspense } from "react"
import { User, ArrowRight, Star, Clock } from "lucide-react"
import { useSelection } from "@/lib/context"
import { useSearchParams } from "next/navigation"
import DataQualityIndicator from "@/components/DataQualityIndicator"

interface Statistic {
  id: number;
  name: string;
  raNumber: string;
  description: string;
  unit: string;
  availableSince: string;
  category: string;
  source: string;
  sourceUrl: string;
  hasData?: boolean;
  dataQuality?: 'mock' | 'real';
  provenance?: string;
}

function MeasureSelectionContent() {
  const { selectedMeasure, setSelectedMeasure, favorites, toggleFavorite, user, signOut, selectedStates } = useSelection()
  const searchParams = useSearchParams()
  const category = searchParams.get('category')
  const measureParam = searchParams.get('measure')
  
  const [statistics, setStatistics] = useState<Statistic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showStateWarning, setShowStateWarning] = useState(false)

  // Check if states are selected
  useEffect(() => {
    if (!selectedStates || selectedStates.length === 0) {
      setShowStateWarning(true)
    } else {
      setShowStateWarning(false)
    }
  }, [selectedStates])

  // Set selected measure from URL parameter if provided
  useEffect(() => {
    console.log('Measure page - measureParam:', measureParam)
    console.log('Measure page - category:', category)
    if (measureParam) {
      const measureId = parseInt(measureParam)
      if (!isNaN(measureId)) {
        console.log('Setting selected measure from URL:', measureId)
        setSelectedMeasure(measureId)
      }
    }
  }, [measureParam, category, setSelectedMeasure])

  useEffect(() => {
    async function fetchStatistics() {
      try {
        console.log('Fetching statistics for category:', category)
        const response = await fetch('/api/statistics?withAvailability=true')
        if (!response.ok) {
          throw new Error('Failed to fetch statistics')
        }
        const data = await response.json()
        console.log('All statistics:', data.length)
        
        // Filter by category if specified
        const filteredData = category 
          ? data.filter((stat: Statistic) => {
              console.log(`Comparing "${stat.category}" with "${category}"`)
              return stat.category === category
            })
          : data
        
        console.log('Filtered statistics:', filteredData.length)
        console.log('Filtered data:', filteredData)
        setStatistics(filteredData)
      } catch (err) {
        console.error('Error fetching statistics:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch statistics')
      } finally {
        setLoading(false)
      }
    }
    
    fetchStatistics()
  }, [category])

  const handleMeasureSelect = (measureId: number, hasData: boolean) => {
    if (!hasData) {
      console.log('Measure has no data, cannot select:', measureId)
      return
    }
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

      {/* Navigation bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a
              href="/category"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Categories
            </a>
            
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>States</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>{category || 'Category'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-blue-600 font-medium">Measures</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-green-600 text-sm">Using real database data</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          {/* State warning */}
          {showStateWarning && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-yellow-900">No States Selected</h3>
                  <p className="text-yellow-700 text-sm">Please select at least one state before choosing a measure.</p>
                </div>
                <a
                  href="/states"
                  className="ml-auto px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm"
                >
                  Select States
                </a>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading measures...
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-8">
              <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Measures</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Measures grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statistics.map((statistic) => (
                <div
                  key={statistic.id}
                  className={`bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedMeasure === statistic.id
                      ? 'border-blue-500 shadow-lg'
                      : 'border-transparent hover:border-gray-300'
                  } ${!statistic.hasData ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => handleMeasureSelect(statistic.id, statistic.hasData || false)}
                >
                  {/* Card header */}
                  <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm">{statistic.raNumber}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(statistic.id)
                      }}
                      className={`text-white hover:text-yellow-300 transition-colors ${
                        favorites.includes(statistic.id) ? 'text-yellow-300' : ''
                      }`}
                    >
                      <Star className="w-4 h-4" fill={favorites.includes(statistic.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  
                  {/* Card content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-black">{statistic.name}</h4>
                      <DataQualityIndicator
                        dataQuality={statistic.dataQuality || 'mock'}
                        provenance={statistic.provenance}
                        sourceUrl={statistic.sourceUrl}
                        showBadge={true}
                        showIcon={true}
                        size="sm"
                      />
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">{statistic.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Unit:</span>
                        <span className="text-black font-medium">{statistic.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Category:</span>
                        <span className="text-black">{statistic.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Available:</span>
                        <span className="text-black">{statistic.availableSince}</span>
                      </div>
                    </div>
                    
                    {!statistic.hasData && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        No data available for selected states
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Continue button */}
          {selectedMeasure && !showStateWarning && (
            <div className="mt-8 text-center">
              <a
                href="/results"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View Results
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </div>
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

export default function MeasureSelection() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        </div>
      </div>
    }>
      <MeasureSelectionContent />
    </Suspense>
  )
} 