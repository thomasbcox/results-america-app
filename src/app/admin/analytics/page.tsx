'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  RefreshCw, 
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Download,
  Activity,
  Clock,
  Globe
} from 'lucide-react';

interface AnalyticsData {
  totalRequests: number;
  requestsToday: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
  averageResponseTime: number;
  cacheHitRate: number;
  topEndpoints: Array<{
    endpoint: string;
    requests: number;
    avgResponseTime: number;
  }>;
  topStates: Array<{
    state: string;
    requests: number;
  }>;
  topCategories: Array<{
    category: string;
    requests: number;
  }>;
  hourlyRequests: Array<{
    hour: number;
    requests: number;
  }>;
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const handleRefresh = () => {
    setLoading(true);
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading analytics...</span>
      </div>
    );
  }

  // Show coming soon message since analytics API doesn't exist yet
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor system usage and performance</p>
        </div>
      </div>

      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
        <p className="text-gray-600 mb-4">Advanced analytics and usage tracking will be available in a future update.</p>
        <Badge variant="secondary">Under Development</Badge>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor system usage and performance</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalRequests?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              All time requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.requestsToday?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              Requests in last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.averageResponseTime?.toFixed(2) || '0.00'}ms</div>
            <p className="text-xs text-muted-foreground">
              Average API response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.cacheHitRate?.toFixed(1) || '0.0'}%</div>
            <p className="text-xs text-muted-foreground">
              Cache efficiency
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>Top API Endpoints</CardTitle>
          <CardDescription>Most frequently accessed endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.topEndpoints?.map((endpoint, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{endpoint.endpoint}</h4>
                    <p className="text-sm text-gray-500">
                      {endpoint.avgResponseTime.toFixed(2)}ms avg response
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {endpoint.requests.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">requests</div>
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-gray-500">
                No endpoint data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top States and Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Top States
            </CardTitle>
            <CardDescription>Most viewed states</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.topStates?.map((state, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-green-600">{index + 1}</span>
                    </div>
                    <span className="font-medium text-gray-900">{state.state}</span>
                  </div>
                  <Badge variant="secondary">{state.requests.toLocaleString()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Top Categories
            </CardTitle>
            <CardDescription>Most viewed categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.topCategories?.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-purple-600">{index + 1}</span>
                    </div>
                    <span className="font-medium text-gray-900">{category.category}</span>
                  </div>
                  <Badge variant="secondary">{category.requests.toLocaleString()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Hourly Activity</CardTitle>
          <CardDescription>Request activity by hour</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between space-x-1">
            {analytics?.hourlyRequests?.map((hour, index) => {
              const maxRequests = analytics?.hourlyRequests ? Math.max(...analytics.hourlyRequests.map(h => h.requests)) : 0;
              const height = maxRequests > 0 ? (hour.requests / maxRequests) * 100 : 0;
              
              return (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div 
                    className="w-8 bg-blue-500 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-gray-500">{hour.hour}:00</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Alerts</CardTitle>
          <CardDescription>System health and performance issues</CardDescription>
        </CardHeader>
        <CardContent>
          {!analytics ? null : (() => {
            const a = analytics!;
            return (
              <div className="space-y-4">
                {a.averageResponseTime !== undefined && a.averageResponseTime > 1000 && (
                  <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-yellow-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-yellow-800">High Response Time</h4>
                      <p className="text-sm text-yellow-700">
                        Average response time is {a.averageResponseTime.toFixed(2)}ms, consider optimization
                      </p>
                    </div>
                  </div>
                )}
                {a.cacheHitRate !== undefined && a.cacheHitRate < 50 && (
                  <div className="flex items-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <Eye className="h-5 w-5 text-orange-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-orange-800">Low Cache Hit Rate</h4>
                      <p className="text-sm text-orange-700">
                        Cache hit rate is {a.cacheHitRate.toFixed(1)}%, consider improving caching strategy
                      </p>
                    </div>
                  </div>
                )}
                {a.requestsToday !== undefined && a.requestsToday > 10000 && (
                  <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <h4 className="font-medium text-green-800">High Traffic</h4>
                      <p className="text-sm text-green-700">
                        {a.requestsToday.toLocaleString()} requests today - excellent engagement!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
} 