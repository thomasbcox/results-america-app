"use client";
import { useState, useEffect, Suspense } from "react";
import { ArrowRight, Star } from "lucide-react";
import { useSelection } from "@/lib/context";
import { ClientOnly, useSafeContextValue } from "@/lib/utils/hydrationUtils";
import { useSearchParams } from "next/navigation";
import DataQualityIndicator from "@/components/DataQualityIndicator";
import AuthStatus from "@/components/AuthStatus";

interface Statistic {
  id: number;
  name: string;
  raNumber: string;
  description: string;
  unit: string;
  availableSince: string;
  categoryName: string;
  dataSourceName: string;
  hasData?: boolean;
  dataQuality?: 'mock' | 'real';
  provenance?: string;
}

function MeasureSelectionContent() {
  const { selectedMeasure, setSelectedMeasure, favorites, toggleFavorite, selectedStates } = useSelection();
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const measureParam = searchParams.get('measure');

  // Use safe context values to prevent hydration mismatches
  const safeSelectedMeasure = useSafeContextValue(selectedMeasure);
  const safeSelectedStates = useSafeContextValue(selectedStates);

  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStateWarning, setShowStateWarning] = useState(false);

  useEffect(() => {
    if (!safeSelectedStates || safeSelectedStates.length === 0) {
      setShowStateWarning(true);
    } else {
      setShowStateWarning(false);
    }
  }, [safeSelectedStates]);

  useEffect(() => {
    if (measureParam) {
      const measureId = parseInt(measureParam);
      if (!isNaN(measureId)) {
        setSelectedMeasure(measureId);
      }
    }
  }, [measureParam, category, setSelectedMeasure]);

  useEffect(() => {
    async function fetchStatistics() {
      try {
        const response = await fetch('/api/statistics?withAvailability=true');
        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }
        const result = await response.json();
        const data = result.data || [];
        const filteredData = category
          ? data.filter((stat: Statistic) => stat.categoryName === category)
          : data;
        setStatistics(filteredData);
        
        // If no statistics found, show a helpful message instead of error
        if (filteredData.length === 0) {
          setError('No measures available for this category. Please check back later or contact support.');
        }

      } catch (err) {
        console.error('Error fetching statistics:', err);
        // Provide a more helpful error message
        setError('Unable to load measures at this time. This may be due to missing data in the database. Please try again later or contact support.');
      } finally {
        setLoading(false);
      }
    }
    fetchStatistics();
  }, [category]);

  const handleMeasureSelect = (measureId: number, hasData: boolean) => {
    if (!hasData) return;
    setSelectedMeasure(measureId);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
        
        {/* User info - only show if user is logged in */}
        <AuthStatus />
      </div>
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a href="/category" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm">
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Categories
            </a>
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
            <span className="text-yellow-600 text-sm">Using mock data for demonstration</span>
          </div>
        </div>
      </div>
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
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
                <a href="/states" className="ml-auto px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm">Select States</a>
              </div>
            </div>
          )}
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
          {error && (
            <div className="text-center py-8">
              <div className="max-w-md mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Measures Available</h3>
                <p className="text-yellow-700 mb-4">{error}</p>
                <div className="space-y-2">
                  <ClientOnly fallback={<button className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors">Try Again</button>}>
                    <button onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.location.reload()
                      }
                    }} className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors">Try Again</button>
                  </ClientOnly>
                  <div className="text-sm text-yellow-600">
                    <p>This usually means the database needs to be populated with measure data.</p>
                    <p className="mt-2">Contact your administrator to load data via CSV import.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {statistics.map((statistic) => (
                <div
                  key={statistic.id}
                  className={`bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all cursor-pointer ${safeSelectedMeasure === statistic.id ? 'border-blue-500 shadow-lg' : 'border-transparent hover:border-gray-300'} ${!statistic.hasData ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => handleMeasureSelect(statistic.id, statistic.hasData || false)}
                >
                  <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm">{statistic.raNumber}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(statistic.id);
                      }}
                      className={`text-white hover:text-yellow-300 transition-colors ${favorites.includes(statistic.id) ? 'text-yellow-300' : ''}`}
                    >
                      <Star className="w-4 h-4" fill={favorites.includes(statistic.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-black">{statistic.name}</h4>
                      <DataQualityIndicator
                        dataQuality={statistic.dataQuality || 'mock'}
                        provenance={statistic.provenance}
                        sourceUrl={undefined}
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
                        <span className="text-black">{statistic.categoryName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Available:</span>
                        <span className="text-black">2020-2023 (4 years)</span>
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
          <ClientOnly fallback={<div className="mt-8 h-12"></div>}>
            {safeSelectedMeasure && !showStateWarning && (
              <div className="mt-8 text-center">
                <a href="/results" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  View Results
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </div>
            )}
          </ClientOnly>
        </div>
      </div>
      <div className="bg-white px-4 py-4 text-center">
        <p className="text-xs text-black">© 2025 The Great American Report Card. All rights reserved.</p>
      </div>
    </div>
  );
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
  );
} 