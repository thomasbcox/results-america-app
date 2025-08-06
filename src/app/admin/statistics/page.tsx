"use client"
import { useState, useEffect } from "react"
import { Edit2, Save, X, Search, Filter } from "lucide-react"
import AuthStatus from "@/components/AuthStatus"

interface Statistic {
  id: number
  name: string
  raNumber: string | null
  description: string | null
  unit: string
  categoryName: string
  dataSourceName: string | null
  preferenceDirection: 'higher' | 'lower' | 'neutral'
  isActive: number
}

interface Category {
  id: number
  name: string
}

export default function AdminStatisticsPage() {
  const [statistics, setStatistics] = useState<Statistic[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingPreference, setEditingPreference] = useState<'higher' | 'lower' | 'neutral'>('higher')

  useEffect(() => {
    fetchStatistics()
    fetchCategories()
  }, [])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/statistics')
      if (!response.ok) {
        throw new Error('Failed to fetch statistics')
      }
      const data = await response.json()
      if (data.success) {
        setStatistics(data.data)
      } else {
        throw new Error(data.message || 'Failed to fetch statistics')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const handleEdit = (statistic: Statistic) => {
    setEditingId(statistic.id)
    setEditingPreference(statistic.preferenceDirection)
  }

  const handleSave = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/statistics/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferenceDirection: editingPreference
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update statistic')
      }

      const data = await response.json()
      if (data.success) {
        // Update the local state
        setStatistics(prev => prev.map(stat => 
          stat.id === id 
            ? { ...stat, preferenceDirection: editingPreference }
            : stat
        ))
        setEditingId(null)
      } else {
        throw new Error(data.message || 'Failed to update statistic')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update statistic')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
  }

  const getPreferenceLabel = (direction: string) => {
    switch (direction) {
      case 'higher': return 'Higher is Better'
      case 'lower': return 'Lower is Better'
      case 'neutral': return 'Neutral'
      default: return direction
    }
  }

  const getPreferenceColor = (direction: string) => {
    switch (direction) {
      case 'higher': return 'text-green-600 bg-green-50'
      case 'lower': return 'text-red-600 bg-red-50'
      case 'neutral': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const filteredStatistics = statistics.filter(stat => {
    const matchesSearch = stat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stat.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stat.raNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || stat.categoryName === categories.find(c => c.id === selectedCategory)?.name
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Statistics Management</h1>
              <p className="text-gray-600 mt-2">Manage metric preference directions and other settings</p>
            </div>
            <AuthStatus />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="inline w-4 h-4 mr-1" />
                Search Statistics
              </label>
              <input
                type="text"
                placeholder="Search by name, description, or RA number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline w-4 h-4 mr-1" />
                Filter by Category
              </label>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Statistics Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Statistics ({filteredStatistics.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preference Direction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStatistics.map((statistic) => (
                  <tr key={statistic.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {statistic.name}
                        </div>
                        {statistic.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {statistic.description}
                          </div>
                        )}
                        {statistic.raNumber && (
                          <div className="text-xs text-gray-400">
                            RA #{statistic.raNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {statistic.categoryName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {statistic.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === statistic.id ? (
                        <select
                          value={editingPreference}
                          onChange={(e) => setEditingPreference(e.target.value as 'higher' | 'lower' | 'neutral')}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="higher">Higher is Better</option>
                          <option value="lower">Lower is Better</option>
                          <option value="neutral">Neutral</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPreferenceColor(statistic.preferenceDirection)}`}>
                          {getPreferenceLabel(statistic.preferenceDirection)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingId === statistic.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSave(statistic.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Save changes"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-900"
                            title="Cancel editing"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(statistic)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit preference direction"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStatistics.length === 0 && (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No statistics found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 