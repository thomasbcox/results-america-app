"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, ArrowLeft, Share2, Download, Star } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Legend } from 'recharts'
import { useSelection } from "@/lib/context"
import ProgressIndicator from "@/components/ProgressIndicator"
import DataQualityIndicator from "@/components/DataQualityIndicator"
import AuthStatus from "@/components/AuthStatus"
import type { ChartData, ChartDataPoint, StatisticData } from "@/types/api"



// Helper function to transform trend data for charts
const transformTrendDataForCharts = (trendData: any): any[] => {
  if (!trendData || !trendData.trends || !Array.isArray(trendData.trends)) {
    console.log('transformTrendDataForCharts: Invalid data', { trendData })
    return []
  }
  
  return trendData.trends.map((trend: any) => ({
    year: trend.year,
    value: trend.value,
    national: trend.national || 0, // TODO: Get national average for each year
    change: trend.change,
    changePercent: trend.changePercent
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
  const { selectedStates, selectedMeasure, selectedCategory } = useSelection()
  const [trendData, setTrendData] = useState<{[key: string]: any}>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [measureDetails, setMeasureDetails] = useState<StatisticData | null>(null)
  const [sessionValid, setSessionValid] = useState(false)

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; name: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      console.log('Tooltip payload:', payload)
      
      // Find state value and national value from payload
      let stateValue: number | undefined
      let nationalValue: number | undefined
      
      payload.forEach((item) => {
        if (item.dataKey === 'value' && item.name === 'State Value') {
          stateValue = item.value
        } else if (item.dataKey === 'national' && item.name === 'National Average') {
          nationalValue = item.value
        }
      })
      
      // Fallback: if we can't identify by name, use first two values
      if (stateValue === undefined && nationalValue === undefined && payload.length >= 2) {
        stateValue = payload[0]?.value
        nationalValue = payload[1]?.value
      }
      
      const difference = (stateValue || 0) - (nationalValue || 0)
      const unit = measureDetails?.unit || '%'
      
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-md shadow-lg">
          <p className="font-medium text-black">Year: {label}</p>
          <p className="text-black">State: {stateValue?.toFixed(2) || 'N/A'}{unit}</p>
          <p className="text-black">National: {nationalValue?.toFixed(2) || 'N/A'}{unit}</p>
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
            const result = await measureResponse.json()
            const measure = result.data || result
            setMeasureDetails(measure)
          }
        }
        if (selectedMeasure && selectedStates && selectedStates.length > 0) {
          // Fetch trend data for all selected states
          const trendDataMap: {[key: string]: any} = {}
          
          for (const stateName of selectedStates) {
            // TODO: Get actual state ID mapping - for now using simple mapping
            const stateId = stateName === 'Alabama' ? 1 : 
                           stateName === 'Alaska' ? 2 :
                           stateName === 'Arizona' ? 3 :
                           stateName === 'Arkansas' ? 4 :
                           stateName === 'California' ? 5 :
                           stateName === 'Colorado' ? 6 :
                           stateName === 'Connecticut' ? 7 :
                           stateName === 'Delaware' ? 8 :
                           stateName === 'Florida' ? 9 :
                           stateName === 'Georgia' ? 10 :
                           stateName === 'Hawaii' ? 11 :
                           stateName === 'Idaho' ? 12 :
                           stateName === 'Illinois' ? 13 :
                           stateName === 'Indiana' ? 14 :
                           stateName === 'Iowa' ? 15 :
                           stateName === 'Kansas' ? 16 :
                           stateName === 'Kentucky' ? 17 :
                           stateName === 'Louisiana' ? 18 :
                           stateName === 'Maine' ? 19 :
                           stateName === 'Maryland' ? 20 :
                           stateName === 'Massachusetts' ? 21 :
                           stateName === 'Michigan' ? 22 :
                           stateName === 'Minnesota' ? 23 :
                           stateName === 'Mississippi' ? 24 :
                           stateName === 'Missouri' ? 25 :
                           stateName === 'Montana' ? 26 :
                           stateName === 'Nebraska' ? 27 :
                           stateName === 'Nevada' ? 28 :
                           stateName === 'New Hampshire' ? 29 :
                           stateName === 'New Jersey' ? 30 :
                           stateName === 'New Mexico' ? 31 :
                           stateName === 'New York' ? 32 :
                           stateName === 'North Carolina' ? 33 :
                           stateName === 'North Dakota' ? 34 :
                           stateName === 'Ohio' ? 35 :
                           stateName === 'Oklahoma' ? 36 :
                           stateName === 'Oregon' ? 37 :
                           stateName === 'Pennsylvania' ? 38 :
                           stateName === 'Rhode Island' ? 39 :
                           stateName === 'South Carolina' ? 40 :
                           stateName === 'South Dakota' ? 41 :
                           stateName === 'Tennessee' ? 42 :
                           stateName === 'Texas' ? 43 :
                           stateName === 'Utah' ? 44 :
                           stateName === 'Vermont' ? 45 :
                           stateName === 'Virginia' ? 46 :
                           stateName === 'Washington' ? 47 :
                           stateName === 'West Virginia' ? 48 :
                           stateName === 'Wisconsin' ? 49 :
                           stateName === 'Wyoming' ? 50 : 1
            
            const trendResponse = await fetch(`/api/aggregation?type=trend-data&statisticId=${selectedMeasure}&stateId=${stateId}`)
            if (trendResponse.ok) {
              const trendResult = await trendResponse.json()
              console.log(`Trend data response for ${stateName}:`, trendResult)
              const trend = trendResult.data || null
              console.log(`Extracted trend data for ${stateName}:`, trend)
              trendDataMap[stateName.toLowerCase()] = trend
            }
          }
          
          setTrendData(trendDataMap)
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
            {measureDetails?.dataQuality === 'real' ? (
              <span className="text-green-600 text-sm">Using real database data</span>
            ) : (
              <span className="text-yellow-600 text-sm">Using mock data for demonstration</span>
            )}
            
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
                      completed: Object.keys(trendData).length > 0,
                      current: true
                    }
                  ]}
                />
              </div>
              
              {Object.keys(trendData).length === 0 && (
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
              {Object.keys(trendData).length > 0 && (
                <div className="text-center py-2 text-gray-600 mb-4">
                  <p className="text-sm">📊 Trend data from 2020-2023 (4 years)</p>
                </div>
              )}
              <div className={`grid gap-6 ${
                selectedStates.length === 1 ? 'grid-cols-1' :
                selectedStates.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
                selectedStates.length === 3 ? 'grid-cols-1 lg:grid-cols-3' :
                'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4'
              }`}>
              
              {selectedStates.map((stateName, index) => (
                <div key={stateName} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Card header */}
                  <div className="bg-yellow-400 px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-6 bg-blue-600 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    </div>
                    <h3 className="font-bold text-black">{stateName}</h3>
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