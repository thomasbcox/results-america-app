"use client"
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Ranking {
  stateId: number
  stateName: string
  value: number
  rank: number
  percentile: number
}

interface RankingsData {
  statistic: any
  year: number
  order: 'asc' | 'desc'
  rankings: Ranking[]
  totalRankings: number
  hasMore: boolean
}

interface StateRankingsProps {
  statisticId: number
  year?: number
  order?: 'asc' | 'desc'
  className?: string
  preferenceDirection?: 'higher' | 'lower'
}

export default function StateRankings({ 
  statisticId, 
  year = 2022, 
  order = 'desc',
  className = '',
  preferenceDirection = 'higher'
}: StateRankingsProps) {
  const [rankingsData, setRankingsData] = useState<RankingsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    async function fetchRankings() {
      if (!statisticId) return

      try {
        setLoading(true)
        setError(null)

        // Determine the order based on preference direction
        const effectiveOrder = preferenceDirection === 'lower' ? 'asc' : 'desc'

        const response = await fetch(`/api/statistics/${statisticId}/rankings?year=${year}&order=${effectiveOrder}&limit=${showAll ? 100 : 3}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch rankings')
        }

        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch rankings')
        }

        setRankingsData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch rankings')
      } finally {
        setLoading(false)
      }
    }

    fetchRankings()
  }, [statisticId, year, order, showAll, preferenceDirection])

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 rounded mb-1"></div>
        <div className="h-3 bg-gray-200 rounded mb-1"></div>
        <div className="h-3 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        Error loading rankings: {error}
      </div>
    )
  }

  if (!rankingsData || rankingsData.rankings.length === 0) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        No ranking data available
      </div>
    )
  }

  const formatValue = (value: number, unit?: string) => {
    if (unit) {
      return `${value.toLocaleString()} ${unit}`
    }
    return value.toLocaleString()
  }

  const getStateAbbreviation = (stateName: string) => {
    const stateAbbreviations: Record<string, string> = {
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
    return stateAbbreviations[stateName] || stateName
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">
          {showAll ? 'All State Rankings:' : 
            preferenceDirection === 'higher' ? 'Top Performing States (Highest Values):' :
            preferenceDirection === 'lower' ? 'Top Performing States (Lowest Values):' :
            'State Rankings:'
          }
        </h4>
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show Top 3
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              View All
            </>
          )}
        </button>
      </div>

      {showAll ? (
        // Full rankings table
        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Rank</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">State</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rankingsData.rankings.map((ranking) => (
                <tr key={ranking.stateId} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-900 font-medium">#{ranking.rank}</td>
                  <td className="px-3 py-2 text-gray-900">
                    {ranking.stateName} /{getStateAbbreviation(ranking.stateName)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    {formatValue(ranking.value, rankingsData.statistic?.unit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Top 3 rankings list
        <div className="space-y-2">
          {rankingsData.rankings.slice(0, 3).map((ranking) => (
            <div key={ranking.stateId} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">#{ranking.rank}</span>
                <span className="text-gray-700">
                  {ranking.stateName} /{getStateAbbreviation(ranking.stateName)}
                </span>
              </div>
              <span className="text-gray-900 font-medium">
                {formatValue(ranking.value, rankingsData.statistic?.unit)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 