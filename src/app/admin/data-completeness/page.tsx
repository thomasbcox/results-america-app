'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  BarChart3, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database,
  TrendingUp,
  Eye,
  Search
} from 'lucide-react';

interface DataCompletenessReport {
  categories: CategoryCompleteness[];
  summary: CompletenessSummary;
  filters: CompletenessFilters;
}

interface CategoryCompleteness {
  id: number;
  name: string;
  metrics: MetricCompleteness[];
  totalMetrics: number;
  metricsWithData: number;
  coveragePercentage: number;
}

interface MetricCompleteness {
  id: number;
  name: string;
  raNumber: string | null;
  unit: string;
  years: YearCompleteness[];
  totalYears: number;
  yearsWithData: number;
  coveragePercentage: number;
}

interface YearCompleteness {
  year: number;
  productionStates: number;
  stagedStates: number;
  overlapStates: number;
  totalStates: number;
  coveragePercentage: number;
  hasOverlap: boolean;
}

interface CompletenessSummary {
  totalCategories: number;
  totalMetrics: number;
  totalYears: number;
  totalStates: number;
  categoriesWithData: number;
  metricsWithData: number;
  yearsWithData: number;
  overallCoveragePercentage: number;
}

interface CompletenessFilters {
  categoryId?: number;
  metricId?: number;
  year?: number;
  dataState?: 'production' | 'staged' | 'overlap' | 'incomplete';
  showIncompleteOnly?: boolean;
  showStagedOnly?: boolean;
}

export default function DataCompletenessPage() {
  const [report, setReport] = useState<DataCompletenessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CompletenessFilters>({});
  const [activeTab, setActiveTab] = useState('overview');
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([]);
  const [statistics, setStatistics] = useState<Array<{id: number, name: string, categoryName: string}>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchMetric, setSearchMetric] = useState<string>('');

  useEffect(() => {
    loadReport();
  }, [filters]);

  useEffect(() => {
    loadCategories();
    loadStatistics();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
      if (filters.metricId) params.append('metricId', filters.metricId.toString());
      if (filters.year) params.append('year', filters.year.toString());
      if (filters.dataState) params.append('dataState', filters.dataState);
      if (filters.showIncompleteOnly) params.append('showIncompleteOnly', 'true');
      if (filters.showStagedOnly) params.append('showStagedOnly', 'true');

      const response = await fetch(`/api/admin/data-completeness?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setReport(result.data);
      } else {
        setError(result.error || 'Failed to load report');
      }
    } catch (err) {
      setError('Failed to load data completeness report');
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/admin/statistics');
      const result = await response.json();
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getOverlapIcon = (hasOverlap: boolean) => {
    return hasOverlap ? <AlertTriangle className="h-4 w-4 text-orange-500" /> : null;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading data completeness report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>No data available</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Data Completeness Report</h1>
        <p className="text-gray-600">
          Comprehensive view of data completeness and freshness across categories, metrics, years, and states
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Coverage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.summary.overallCoveragePercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {report.summary.metricsWithData} of {report.summary.totalMetrics} metrics have data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.summary.categoriesWithData}</div>
            <p className="text-xs text-muted-foreground">
              of {report.summary.totalCategories} categories have data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Years with Data</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.summary.yearsWithData}</div>
            <p className="text-xs text-muted-foreground">
              of {report.summary.totalYears} total years
            </p>
            {report.summary.yearsWithData > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Years present:</p>
                <div className="flex flex-wrap gap-1">
                  {Array.from(new Set(
                    report.categories.flatMap(cat => 
                      cat.metrics.flatMap(metric => 
                        metric.years
                          .filter(year => year.productionStates > 0 || year.stagedStates > 0)
                          .map(year => year.year)
                      )
                    )
                  )).sort().map(year => (
                    <Badge key={year} variant="outline" className="text-xs">
                      {year}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total States</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.summary.totalStates}</div>
            <p className="text-xs text-muted-foreground">
              states available for data coverage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="category-select">Category</Label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  const categoryId = e.target.value ? parseInt(e.target.value) : undefined;
                  setFilters(prev => ({ ...prev, categoryId }));
                }}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="metric-search">Search Metric</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="metric-search"
                  placeholder="Search metrics..."
                  value={searchMetric}
                  onChange={(e) => {
                    setSearchMetric(e.target.value);
                    // Find matching statistic and set filter
                    const matchingStat = statistics.find(stat => 
                      stat.name.toLowerCase().includes(e.target.value.toLowerCase())
                    );
                    setFilters(prev => ({ 
                      ...prev, 
                      metricId: matchingStat?.id 
                    }));
                  }}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button
              variant={filters.showIncompleteOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                showIncompleteOnly: !prev.showIncompleteOnly 
              }))}
            >
              Show Incomplete Only
            </Button>
            <Button
              variant={filters.showStagedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                showStagedOnly: !prev.showStagedOnly 
              }))}
            >
              Show Staged Only
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters({});
                setSelectedCategory('');
                setSearchMetric('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="overlap">Overlap Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {report.categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{category.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={category.coveragePercentage >= 90 ? "default" : "secondary"}>
                      {category.coveragePercentage}% coverage
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {category.metricsWithData}/{category.totalMetrics} metrics
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.metrics.map((metric) => (
                    <div key={metric.id} className="border-l-4 border-gray-200 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{metric.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {metric.raNumber && `RA-${metric.raNumber}`} • {metric.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={metric.coveragePercentage >= 90 ? "default" : "secondary"}>
                            {metric.coveragePercentage}%
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {metric.yearsWithData}/{metric.totalYears} years
                          </span>
                        </div>
                      </div>
                      
                      {/* Year breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {metric.years.map((year) => (
                          <div key={year.year} className="text-xs border rounded p-2">
                            <div className="font-medium">{year.year}</div>
                            <div className="flex items-center gap-1">
                              {year.productionStates > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  P: {year.productionStates}
                                </Badge>
                              )}
                              {year.stagedStates > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  S: {year.stagedStates}
                                </Badge>
                              )}
                              {getOverlapIcon(year.hasOverlap)}
                            </div>
                            <div className={`w-full h-1 mt-1 rounded ${getCoverageColor(year.coveragePercentage)}`}></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Data Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.categories.map((category) => (
                  <div key={category.id} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">{category.name}</h3>
                    <div className="space-y-3">
                      {category.metrics.map((metric) => (
                        <div key={metric.id} className="border-l-4 border-blue-200 pl-4">
                          <h4 className="font-medium">{metric.name}</h4>
                          <div className="text-sm text-muted-foreground mb-2">
                            {metric.raNumber && `RA-${metric.raNumber}`} • {metric.unit}
                          </div>
                          
                          <div className="space-y-2">
                            {metric.years.map((year) => (
                              <div key={year.year} className="flex items-center justify-between text-sm">
                                <span className="font-medium">{year.year}</span>
                                <div className="flex items-center gap-4">
                                  <span>Production: {year.productionStates}</span>
                                  <span>Staged: {year.stagedStates}</span>
                                  {year.hasOverlap && (
                                    <span className="text-orange-600 flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      Overlap: {year.overlapStates}
                                    </span>
                                  )}
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    year.coveragePercentage >= 90 ? 'bg-green-100 text-green-800' :
                                    year.coveragePercentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {year.coveragePercentage}% coverage
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overlap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staged vs Production Overlap</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This section shows where staged data exists for the same metric/state/year combination as production data.
                  Overlaps indicate potential data updates or conflicts that need attention.
                </AlertDescription>
              </Alert>
              
              <div className="mt-4 space-y-4">
                {report.categories.map((category) => (
                  <div key={category.id}>
                    <h3 className="font-semibold mb-2">{category.name}</h3>
                    <div className="space-y-2">
                      {category.metrics.map((metric) => {
                        const overlapYears = metric.years.filter(year => year.hasOverlap);
                        if (overlapYears.length === 0) return null;
                        
                        return (
                          <div key={metric.id} className="border rounded p-3 bg-orange-50">
                            <h4 className="font-medium">{metric.name}</h4>
                            <div className="text-sm text-muted-foreground mb-2">
                              {metric.raNumber && `RA-${metric.raNumber}`} • {metric.unit}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {overlapYears.map((year) => (
                                <Badge key={year.year} variant="outline" className="bg-orange-100">
                                  {year.year}: {year.overlapStates} overlaps
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 