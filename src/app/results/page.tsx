"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { User, ArrowRight, ArrowLeft, Share2, Download, Star } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Legend } from 'recharts'
import { useSelection } from "@/lib/context"
import ProgressIndicator from "@/components/ProgressIndicator"
import type { MeasureData, ChartData, ChartDataPoint, StatePerformance, StatisticData } from "@/types/api"

// Helper function to transform API data for charts
const transformDataForCharts = (measureData: MeasureData | null, selectedStates: string[]): ChartData => {
  if (!measureData || !selectedStates.length) return {}
  
  const result: ChartData = {}
  
  selectedStates.forEach((stateName) => {
    const stateIndex = measureData.states.indexOf(stateName)
    if (stateIndex !== -1) {
      const stateValue = measureData.values[stateIndex]
      const nationalAverage = measureData.average
      
      // Since we only have 2023 data, create a single data point
      result[stateName.toLowerCase()] = [
        {
          year: 2023,
          value: stateValue,
          national: nationalAverage
        }
      ]
    }
  })
  
  return result
}

// Helper function to get top performers from the data
const getTopPerformers = (measureData: MeasureData | null, count: number = 3): StatePerformance[] => {
  if (!measureData) return []
  
  const stateValuePairs = measureData.states.map((state: string, index: number) => ({
    name: state,
    value: measureData.values[index]
  }))
  
  // Sort by value (assuming higher is better - this might need to be configurable)
  stateValuePairs.sort((a, b) => b.value - a.value)
  
  return stateValuePairs.slice(0, count).map((item) => ({
    name: item.name,
    code: getStateCode(item.name),
    value: item.value,
    rank: 0 // Will be calculated later
  }))
}

// Helper function to get state code from name
const getStateCode = (stateName: string) => {
  const stateMap: { [key: string]: string } = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
  }
  return stateMap[stateName] || stateName.substring(0, 2).toUpperCase()
}

export default function ResultsPage() {
  const { user, signOut, selectedStates, selectedMeasure, selectedCategory } = useSelection()
  const [measureData, setMeasureData] = useState<MeasureData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [measureDetails, setMeasureDetails] = useState<StatisticData | null>(null)
  const [sessionValid, setSessionValid] = useState(false)

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      const stateValue = payload[0]?.value
      const nationalValue = payload[1]?.value
      const difference = stateValue - nationalValue
      const unit = measureDetails?.unit || '%'
      
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-md shadow-lg">
          <p className="font-medium text-black">Year: {label}</p>
          <p className="text-black">State: {stateValue?.toFixed(2)}{unit}</p>
          <p className="text-black">National: {nationalValue?.toFixed(2)}{unit}</p>
          <p className="text-black">Difference: {difference?.toFixed(2)}{unit}</p>
        </div>
      )
    }
    return null
  }

  console.log('ResultsPage - Selected states:', selectedStates)
  console.log('ResultsPage - Selected measure:', selectedMeasure)
  console.log('ResultsPage - Selected category:', selectedCategory)

  // Validate session state
  useEffect(() => {
    const hasValidStates = selectedStates && selectedStates.length >= 1
    const hasValidMeasure = selectedMeasure && selectedMeasure > 0
    
    if (!hasValidStates || !hasValidMeasure) {
      setSessionValid(false)
      setLoading(false)
      return
    }
    
    setSessionValid(true)
  }, [selectedStates, selectedMeasure])

  useEffect(() => {
    async function fetchMeasureData() {
      try {
        setLoading(true)
        if (selectedMeasure) {
          const measureResponse = await fetch(`/api/statistics/${selectedMeasure}`)
          if (measureResponse.ok) {
            const measure = await measureResponse.json()
            setMeasureDetails(measure)
          }
        }
        if (selectedMeasure) {
          const dataResponse = await fetch(`/api/aggregation?type=statistic-comparison&statisticId=${selectedMeasure}`)
          if (dataResponse.ok) {
            const data = await dataResponse.json()
            console.log('Measure data:', data)
            console.log('Selected states:', selectedStates)
            setMeasureData(data)
          }
        }
      } catch (err) {
        console.error('Error fetching measure data:', err)
        setError('Failed to load measure data')
      } finally {
        setLoading(false)
      }
    }
    
    if (sessionValid) {
      fetchMeasureData()
    }
  }, [selectedMeasure, sessionValid])

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
              href={`/measure?category=${encodeURIComponent(selectedCategory || '')}&measure=${selectedMeasure || ''}`}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Selection
            </a>
            
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>States</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>{selectedCategory || 'Category'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-blue-600 font-medium">Results</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-green-600 text-sm">Using real database data</span>
            <button className="flex items-center gap-2 text-black hover:text-gray-700 text-sm">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button className="flex items-center gap-2 text-black hover:text-gray-700 text-sm">
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Session Recovery UI */}
          {!loading && !sessionValid && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 border border-gray-200">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Expired</h2>
                  <p className="text-gray-600 mb-6">
                                          It looks like your session has expired or some selections were lost. Let&apos;s get you back on track!
                  </p>
                </div>
                
                <div className="space-y-4">
                  {(!selectedStates || selectedStates.length === 0) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">Missing State Selection</h3>
                      <p className="text-blue-700 text-sm mb-3">You need to select at least one state to view results.</p>
                      <a
                        href="/states"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Select States
                      </a>
                    </div>
                  )}
                  
                  {(!selectedMeasure || selectedMeasure === 0) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-semibold text-green-900 mb-2">Missing Measure Selection</h3>
                      <p className="text-green-700 text-sm mb-3">You need to select a measure to view results.</p>
                      <a
                        href="/category"
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Select Category & Measure
                      </a>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Start Fresh</h3>
                    <p className="text-gray-700 text-sm mb-3">Or begin a new comparison from the beginning.</p>
                                            <Link
                          href="/"
                          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Start Over
                    </Link>
                  </div>
                </div>
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
                <div className="flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Data</h3>
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
                      completed: selectedStates && selectedStates.length > 0,
                      current: false
                    },
                    {
                      id: 'category',
                      label: 'Category',
                      completed: !!selectedCategory,
                      current: false
                    },
                    {
                      id: 'measure',
                      label: 'Measure',
                      completed: !!selectedMeasure,
                      current: false
                    },
                    {
                      id: 'results',
                      label: 'Results',
                      completed: !!measureData,
                      current: true
                    }
                  ]}
                />
              </div>
              
              {!measureData && (
                <div className="text-center py-8">
                  <div className="max-w-md mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Data Available</h3>
                    <p className="text-yellow-700 mb-4">
                      No data is available for the selected measure and state combination.
                    </p>
                    <div className="text-sm text-yellow-600 space-y-1">
                      <p>Selected states: {selectedStates?.join(', ') || 'None'}</p>
                      <p>Selected measure: {selectedMeasure || 'None'}</p>
                    </div>
                  </div>
                </div>
              )}
              {measureData && (
                <div className="text-center py-2 text-gray-600 mb-4">
                  <p className="text-sm">📊 Data from 2023 - Single year comparison</p>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* State 1 Card */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Card header */}
                <div className="bg-yellow-400 px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-6 bg-blue-600 rounded flex items-center justify-center">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  </div>
                  <h3 className="font-bold text-black">{selectedStates[0] || 'State 1'}</h3>
                </div>
                
                {/* Card content */}
                <div className="p-4">
                  <h4 className="text-lg font-semibold text-black mb-4">
                    {measureDetails?.name || 'Loading...'} {measureDetails?.unit ? `(${measureDetails.unit})` : ''}
                  </h4>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2 mb-4">
                    <button className="flex items-center gap-2 px-3 py-1 text-sm text-black hover:text-gray-700 border border-gray-300 rounded">
                      <Share2 className="w-3 h-3" />
                      Share
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1 text-sm text-black hover:text-gray-700 border border-gray-300 rounded">
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  </div>
                  
                  {/* Chart */}
                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={transformDataForCharts(measureData, selectedStates)[selectedStates[0]?.toLowerCase()] || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="value" fill="#3B82F6" name="State Value" />
                        <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} name="State Value" />
                        <Line type="monotone" dataKey="national" stroke="#EF4444" strokeWidth={2} name="National Average" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* State rank */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-black">State Rank:</span>
                    <span className="bg-gray-200 px-3 py-1 rounded font-medium">
                      #{measureData ? measureData.states.indexOf(selectedStates[0]) + 1 : 'N/A'}
                    </span>
                  </div>
                  
                  {/* Top performers */}
                  <div>
                    <h5 className="text-sm font-medium text-black mb-2">Top Performing States:</h5>
                    <div className="space-y-1">
                      {getTopPerformers(measureData, 3).map((state, index) => (
                        <div key={state.code} className="text-sm text-black">
                          {index + 1}. {state.name} /{state.code}
                        </div>
                      ))}
                    </div>
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

              {/* State 2 Card */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Card header */}
                <div className="bg-yellow-400 px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-6 bg-gray-400 rounded flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  </div>
                  <h3 className="font-bold text-black">{selectedStates[1] || 'State 2'}</h3>
                </div>
                
                {/* Card content */}
                <div className="p-4">
                  <h4 className="text-lg font-semibold text-black mb-4">
                    {measureDetails?.name || 'Loading...'} {measureDetails?.unit ? `(${measureDetails.unit})` : ''}
                  </h4>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2 mb-4">
                    <button className="flex items-center gap-2 px-3 py-1 text-sm text-black hover:text-gray-700 border border-gray-300 rounded">
                      <Share2 className="w-3 h-3" />
                      Share
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1 text-sm text-black hover:text-gray-700 border border-gray-300 rounded">
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  </div>
                  
                  {/* Chart */}
                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={transformDataForCharts(measureData, selectedStates)[selectedStates[1]?.toLowerCase()] || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="value" fill="#3B82F6" name="State Value" />
                        <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} name="State Value" />
                        <Line type="monotone" dataKey="national" stroke="#EF4444" strokeWidth={2} name="National Average" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* State rank */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-black">State Rank:</span>
                    <span className="bg-gray-200 px-3 py-1 rounded font-medium">
                      #{measureData ? measureData.states.indexOf(selectedStates[1]) + 1 : 'N/A'}
                    </span>
                  </div>
                  
                  {/* Top performers */}
                  <div>
                    <h5 className="text-sm font-medium text-black mb-2">Top Performing States:</h5>
                    <div className="space-y-1">
                      {getTopPerformers(measureData, 3).map((state, index) => (
                        <div key={state.code} className="text-sm text-black">
                          {index + 1}. {state.name} /{state.code}
                        </div>
                      ))}
                    </div>
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
            </div>
            </>
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