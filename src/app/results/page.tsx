"use client"
import { useState } from "react"
import { User, ArrowRight, ArrowLeft, Share2, Download, Star } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts'
import { useSelection } from "@/lib/context"

// Mock data for Unemployment Rate comparison
const MOCK_DATA = {
  arizona: [
    { year: 2018, value: 4.8, national: 3.9 },
    { year: 2019, value: 4.8, national: 3.7 },
    { year: 2020, value: 8.2, national: 8.1 },
    { year: 2021, value: 5.3, national: 5.4 },
    { year: 2022, value: 3.7, national: 3.6 },
    { year: 2023, value: 3.7, national: 3.6 },
    { year: 2024, value: 3.7, national: 3.5 },
  ],
  connecticut: [
    { year: 2018, value: 3.9, national: 3.9 },
    { year: 2019, value: 3.6, national: 3.7 },
    { year: 2020, value: 8.0, national: 8.1 },
    { year: 2021, value: 6.5, national: 5.4 },
    { year: 2022, value: 4.0, national: 3.6 },
    { year: 2023, value: 3.5, national: 3.6 },
    { year: 2024, value: 3.2, national: 3.5 },
  ]
}

const TOP_PERFORMERS = [
  { name: "South Dakota", code: "SD" },
  { name: "Vermont", code: "VT" },
  { name: "North Dakota", code: "ND" },
]

export default function ResultsPage() {
  const { user, signOut } = useSelection()

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const stateValue = payload[0]?.value
      const nationalValue = payload[1]?.value
      const difference = stateValue - nationalValue
      
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-md shadow-lg">
          <p className="font-medium text-black">Year: {label}</p>
          <p className="text-gray-600">State: {stateValue?.toFixed(2)}%</p>
          <p className="text-gray-600">National: {nationalValue?.toFixed(2)}%</p>
          <p className="text-gray-600">Difference: {difference?.toFixed(2)}</p>
        </div>
      )
    }
    return null
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

      {/* Navigation bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <a
            href="/measure"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Selection
          </a>
          <div className="flex items-center gap-4">
            <span className="text-green-600 text-sm">Using real Supabase data</span>
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-700 text-sm">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-700 text-sm">
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Arizona Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Card header */}
            <div className="bg-yellow-400 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-6 bg-blue-600 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              </div>
              <h3 className="font-bold text-black">Arizona</h3>
            </div>
            
            {/* Card content */}
            <div className="p-4">
              <h4 className="text-lg font-semibold text-black mb-4">Unemployment Rate (%)</h4>
              
              {/* Action buttons */}
              <div className="flex gap-2 mb-4">
                <button className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-700 border border-gray-300 rounded">
                  <Share2 className="w-3 h-3" />
                  Share
                </button>
                <button className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-700 border border-gray-300 rounded">
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
              
              {/* Chart */}
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={MOCK_DATA.arizona}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis domain={[2, 10]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#3B82F6" />
                    <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} name="Arizona Trend" />
                    <Line type="monotone" dataKey="national" stroke="#EF4444" strokeWidth={2} name="National Trend" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              {/* State rank */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">State Rank:</span>
                <span className="bg-gray-200 px-3 py-1 rounded font-medium">#25</span>
              </div>
              
              {/* Top performers */}
              <div>
                <h5 className="text-sm font-medium text-black mb-2">Top Performing States:</h5>
                <div className="space-y-1">
                  {TOP_PERFORMERS.map((state, index) => (
                    <div key={state.code} className="text-sm text-gray-600">
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
                <span className="text-xs text-gray-500">RESULTS AMERICA</span>
              </div>
            </div>
          </div>

          {/* Connecticut Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Card header */}
            <div className="bg-yellow-400 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-6 bg-gray-400 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
              </div>
              <h3 className="font-bold text-black">Connecticut</h3>
            </div>
            
            {/* Card content */}
            <div className="p-4">
              <h4 className="text-lg font-semibold text-black mb-4">Unemployment Rate (%)</h4>
              
              {/* Action buttons */}
              <div className="flex gap-2 mb-4">
                <button className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-700 border border-gray-300 rounded">
                  <Share2 className="w-3 h-3" />
                  Share
                </button>
                <button className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-700 border border-gray-300 rounded">
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
              
              {/* Chart */}
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={MOCK_DATA.connecticut}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis domain={[2, 10]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#3B82F6" />
                    <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} name="Connecticut Trend" />
                    <Line type="monotone" dataKey="national" stroke="#EF4444" strokeWidth={2} name="National Trend" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              {/* State rank */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">State Rank:</span>
                <span className="bg-gray-200 px-3 py-1 rounded font-medium">#16</span>
              </div>
              
              {/* Top performers */}
              <div>
                <h5 className="text-sm font-medium text-black mb-2">Top Performing States:</h5>
                <div className="space-y-1">
                  {TOP_PERFORMERS.map((state, index) => (
                    <div key={state.code} className="text-sm text-gray-600">
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
                <span className="text-xs text-gray-500">RESULTS AMERICA</span>
              </div>
            </div>
          </div>
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