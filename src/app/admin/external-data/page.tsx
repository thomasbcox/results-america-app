'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  RefreshCw, 
  Download,
  Upload,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  description: string;
  url: string;
  dataFormat: string;
  rateLimit: string;
  estimatedRecords: string;
}

interface ImportJob {
  id: string;
  source: string;
  statisticName: string;
  categoryName: string;
  years: number[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  totalRecords: number;
  importedRecords: number;
  errors: string[];
  startedAt?: string;
  completedAt?: string;
}

export default function ExternalDataImport() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<string | null>(null);

  const fetchDataSources = async () => {
    try {
      const response = await fetch('/api/admin/external-data?action=sources');
      const data = await response.json();
      setDataSources(data.sources || []);
    } catch (error) {
      console.error('Failed to fetch data sources:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchDataSources();
      setLoading(false);
    };
    loadData();
  }, []);

  const handleImport = async (sourceId: string) => {
    if (importing) return; // Prevent multiple simultaneous imports
    
    setImporting(sourceId);
    
    try {
      const response = await fetch('/api/admin/external-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: sourceId,
          action: 'import'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Add the new job to the list
        setImportJobs(prev => [data.job, ...prev]);
        
        // Show success message
        alert(`Import started successfully! Job ID: ${data.job.id}`);
      } else {
        alert(`Import failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please try again.');
    } finally {
      setImporting(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Running</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading external data sources...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">External Data Import</h1>
          <p className="text-gray-600 mt-2">Import data from government sources with 7 years of historical data</p>
        </div>
      </div>

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Available Data Sources
          </CardTitle>
          <CardDescription>
            Government data sources with multi-year historical data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dataSources.map((source) => (
              <div key={source.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{source.name}</h4>
                  <Badge variant="outline">{source.dataFormat}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{source.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    Rate Limit: {source.rateLimit}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Database className="h-3 w-3 mr-1" />
                    Est. Records: {source.estimatedRecords}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleImport(source.id)}
                    disabled={importing === source.id}
                    className="flex-1"
                  >
                    {importing === source.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Data
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(source.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Import Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <RefreshCw className="h-5 w-5 mr-2" />
            Import Jobs
          </CardTitle>
          <CardDescription>
            Track the status of your data import jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {importJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No import jobs yet. Start an import from the data sources above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {importJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <h4 className="font-medium text-gray-900">{job.statisticName}</h4>
                        <p className="text-sm text-gray-500">{job.source} • {job.categoryName}</p>
                      </div>
                    </div>
                    {getStatusBadge(job.status)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Years: {job.years.join(', ')}</span>
                      <span>Records: {job.importedRecords}/{job.totalRecords}</span>
                    </div>

                    {job.status === 'running' && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        ></div>
                      </div>
                    )}

                    {job.errors.length > 0 && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                        <h5 className="text-sm font-medium text-red-800 mb-2">Errors:</h5>
                        <ul className="text-xs text-red-700 space-y-1">
                          {job.errors.slice(0, 3).map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                          {job.errors.length > 3 && (
                            <li>• ... and {job.errors.length - 3} more errors</li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="flex justify-between text-xs text-gray-500">
                      {job.startedAt && (
                        <span>Started: {new Date(job.startedAt).toLocaleString()}</span>
                      )}
                      {job.completedAt && (
                        <span>Completed: {new Date(job.completedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Multi-Year Data:</strong> Each import includes 7 years of historical data (2017-2023)
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Automatic Setup:</strong> Categories, statistics, and data sources are created automatically
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>National Averages:</strong> National averages are calculated automatically for each year
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Rate Limits:</strong> Respects API rate limits to avoid overwhelming government servers
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Data Quality:</strong> Currently using simulated data. Replace with actual API calls for production
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 