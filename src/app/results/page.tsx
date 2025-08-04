"use client"
import { useState, useEffect } from "react"
import { useSelection } from "@/lib/context"
import { ClientOnly, useSafeContextValue } from "@/lib/utils/hydrationUtils"
import { Share2, Download } from "lucide-react"
import Link from "next/link"
import AuthStatus from "@/components/AuthStatus"
import ProgressIndicator from "@/components/ProgressIndicator"
import DataQualityIndicator from "@/components/DataQualityIndicator"
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

// Simple StateFlag component
const StateFlag = ({ stateName }: { stateName: string }) => {
  return (
    <div className="w-6 h-4 bg-blue-600 rounded flex items-center justify-center">
      <span className="text-white text-xs font-bold">{stateName.substring(0, 2).toUpperCase()}</span>
    </div>
  )
}

// Transform trend data for charts
const transformTrendDataForCharts = (trendData: any): any[] => {
  if (!trendData) return []
  return Object.entries(trendData).map(([year, value]) => ({
    year,
    value: Number(value),
    national: 75 // Mock national average
  }))
}

export default function ResultsPage() {
  const { selectedStates, selectedMeasure, selectedCategory } = useSelection()
  
  // Use safe context values to prevent hydration mismatches
  const safeSelectedStates = useSafeContextValue(selectedStates)
  const safeSelectedMeasure = useSafeContextValue(selectedMeasure)
  const safeSelectedCategory = useSafeContextValue(selectedCategory)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionValid, setSessionValid] = useState(false)
  const [trendData, setTrendData] = useState<Record<string, any>>({})
  const [measureDetails, setMeasureDetails] = useState<any>(null)

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; name: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-medium">{`Year: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: (entry as any).color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Fetch measure data
  useEffect(() => {
    async function fetchMeasureData() {
      if (!safeSelectedMeasure || !safeSelectedStates || safeSelectedStates.length === 0) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Mock API call - replace with real API
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock data
        const mockTrendData: Record<string, any> = {}
        safeSelectedStates.forEach(state => {
          mockTrendData[state.toLowerCase()] = {
            '2020': Math.floor(Math.random() * 100),
            '2021': Math.floor(Math.random() * 100),
            '2022': Math.floor(Math.random() * 100),
            '2023': Math.floor(Math.random() * 100)
          }
        })

        setTrendData(mockTrendData)
        setMeasureDetails({
          name: 'Sample Measure',
          unit: 'units',
          dataQuality: 'mock',
          provenance: 'Mock data for testing'
        })
        setSessionValid(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchMeasureData()
  }, [safeSelectedMeasure, safeSelectedStates])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-6 flex flex-col items-center">
        <div className="text-center mb-4">
          <div className="flex justify-center mb-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 text-red-600">★</div>
            ))}
          </div>
          <h1 className="text-3xl font-bold text-blue-900">RESULTS</h1>
          <h2 className="text-2xl font-semibold text-blue-700">AMERICA</h2>
        </div>
        <AuthStatus />
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/measure" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm">
              ← Back to Measures
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          <ClientOnly fallback={
            <div className="text-center py-8">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </div>
            </div>
          }>
            <div>
              {/* Session Recovery UI */}
              {!loading && !sessionValid && (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Session Expired</h2>
                    <p className="text-gray-600 mb-6">
                      Your session has expired. Please start over.
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Start Over
                    </Link>
                  </div>
                </div>
              )}

              {/* Loading state */}
              {loading && sessionValid && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading measure data...
                  </div>
                </div>
              )}

              {/* Error state */}
              {error && sessionValid && (
                <div className="text-center py-8">
                  <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Data</h3>
                    <p className="text-red-700 mb-4">{error}</p>
                    <ClientOnly fallback={<button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">Try Again</button>}>
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.location.reload()
                          }
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </ClientOnly>
                  </div>
                </div>
              )}

              {/* Main content when session is valid */}
              {!loading && !error && sessionValid && (
                <>
                  {/* Progress Indicator */}
                  <div className="mb-8">
                    <ProgressIndicator
                      steps={[
                        {
                          id: 'states',
                          label: 'States',
                          completed: !!(safeSelectedStates && safeSelectedStates.length > 0),
                          current: false
                        },
                        {
                          id: 'category',
                          label: 'Category',
                          completed: !!safeSelectedCategory,
                          current: false
                        },
                        {
                          id: 'measure',
                          label: 'Measure',
                          completed: !!safeSelectedMeasure,
                          current: false
                        },
                        {
                          id: 'results',
                          label: 'Results',
                          completed: Object.keys(trendData).length > 0,
                          current: true
                        }
                      ]}
                    />
                  </div>

                  {/* No data state */}
                  {Object.keys(trendData).length === 0 && (
                    <div className="text-center py-8">
                      <div className="max-w-md mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Data Available</h3>
                        <p className="text-yellow-700 mb-4">
                          No data is available for the selected measure and state combination.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Data display */}
                  {Object.keys(trendData).length > 0 && (
                    <>
                      <div className="text-center py-2 text-gray-600 mb-4">
                        <p className="text-sm">📊 Trend data from 2020-2023 (4 years)</p>
                      </div>
                      
                      <div className={`grid gap-6 ${
                        safeSelectedStates && safeSelectedStates.length === 1 ? 'grid-cols-1' :
                        safeSelectedStates && safeSelectedStates.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
                        safeSelectedStates && safeSelectedStates.length === 3 ? 'grid-cols-1 lg:grid-cols-3' :
                        'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4'
                      }`}>
                        {safeSelectedStates && safeSelectedStates.map((stateName) => (
                          <div key={stateName} className="bg-white rounded-lg shadow-md overflow-hidden">
                            {/* Card header */}
                            <div className="bg-yellow-400 px-4 py-3 flex items-center gap-3">
                              <StateFlag stateName={stateName} />
                            </div>
                            
                            {/* Card content */}
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-4">
                                <h4 className="text-lg font-semibold text-black">
                                  {measureDetails?.name || 'Loading...'} {measureDetails?.unit ? `(${measureDetails.unit})` : ''}
                                </h4>
                                <DataQualityIndicator
                                  dataQuality={measureDetails?.dataQuality || 'mock'}
                                  provenance={measureDetails?.provenance}
                                  sourceUrl={measureDetails?.sourceUrl}
                                  showBadge={true}
                                  showIcon={true}
                                  size="md"
                                />
                              </div>
                              
                              {/* Chart */}
                              <div className="h-64 mb-4">
                                <ResponsiveContainer width="100%" height="100%">
                                  <ComposedChart 
                                    data={transformTrendDataForCharts(trendData[stateName.toLowerCase()]) || []}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="year" />
                                    <YAxis />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} name="State Value" />
                                    <Line type="monotone" dataKey="national" stroke="#EF4444" strokeWidth={2} name="National Average" />
                                  </ComposedChart>
                                </ResponsiveContainer>
                              </div>
                              
                              {/* Card footer */}
                              <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                                <div className="flex justify-center mb-1">
                                  {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-3 h-3 text-blue-600">★</div>
                                  ))}
                                </div>
                                <span className="text-xs text-black">RESULTS AMERICA</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </ClientOnly>
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