'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2, 
  Eye, 
  Play, 
  Pause,
  RefreshCw,
  Database,
  FileText,
  AlertCircle
} from 'lucide-react';

interface ImportSession {
  id: number;
  name: string;
  description: string;
  dataSourceId: number | null;
  dataYear: number;
  recordCount: number;
  isActive: number;
  createdAt: string;
  updatedAt: string;
  importId: number | null;
  importName: string | null;
  sessionStatus: string; // New coherent status
  importUploadedAt: string | null;
  dataPointCount: number;
}

interface DataPoint {
  id: number;
  stateId: number;
  statisticId: number;
  value: number;
  year: number;
  stateName?: string;
  statisticName?: string;
  categoryName?: string;
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<ImportSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingSession, setUpdatingSession] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [showDataPointsModal, setShowDataPointsModal] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/import-sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      } else {
        setError('Failed to fetch import sessions');
      }
    } catch (error) {
      setError('Failed to fetch import sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSessionAction = async (sessionId: number, action: string) => {
    try {
      setUpdatingSession(sessionId);
      const response = await fetch('/api/admin/import-sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, action }),
      });

      if (response.ok) {
        // Refresh the sessions list
        await fetchSessions();
      } else {
        setError(`Failed to ${action} session`);
      }
    } catch (error) {
      setError(`Failed to ${action} session`);
    } finally {
      setUpdatingSession(null);
    }
  };

  const handleViewDataPoints = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/admin/import-sessions/${sessionId}/data-points`);
      if (response.ok) {
        const data = await response.json();
        setDataPoints(data.dataPoints);
        setSelectedSession(sessionId);
        setShowDataPointsModal(true);
      } else {
        setError('Failed to fetch data points');
      }
    } catch (error) {
      setError('Failed to fetch data points');
    }
  };

  const getStatusIcon = (sessionStatus: string) => {
    switch (sessionStatus) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'inactive':
        return <Pause className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'empty':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (sessionStatus: string) => {
    switch (sessionStatus) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'empty':
        return <Badge variant="outline">Empty</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Import Sessions</h1>
          <p className="text-gray-600 mt-2">
            Manage staged data and import sessions
          </p>
        </div>
        <Button onClick={fetchSessions} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Guide Section */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Session Status Guide</h3>
          
          {/* Status Definitions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium mb-3">Status Meanings</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span><strong>Active:</strong> Data visible to users in charts and comparisons</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Pause className="h-4 w-4 text-yellow-500" />
                  <span><strong>Inactive:</strong> Data imported but hidden from users</span>
                </div>
                <div className="flex items-center space-x-3">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span><strong>Failed:</strong> Import failed - no data was stored</span>
                </div>
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-4 w-4 text-gray-500" />
                  <span><strong>Empty:</strong> No data expected or imported</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Available Actions</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-3">
                  <Play className="h-4 w-4 text-green-500" />
                  <span><strong>Activate:</strong> Make data visible to users</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Pause className="h-4 w-4 text-yellow-500" />
                  <span><strong>Deactivate:</strong> Hide data from users (preserves data)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Trash2 className="h-4 w-4 text-red-500" />
                  <span><strong>Delete:</strong> Permanently remove data and session</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Data Point Information */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Data Point Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <p><strong>📊 Data Points:</strong> Actual count stored in database</p>
              </div>
              <div>
                <p><strong>📋 Expected:</strong> Expected count from import metadata</p>
              </div>
              <div>
                <p><strong>👁️ View:</strong> Click to inspect actual data rows</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-4" />
                <p>No import sessions found</p>
                <p className="text-sm">Import sessions will appear here after successful data imports</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(session.sessionStatus)}
                    <div>
                      <CardTitle className="text-lg">{session.name}</CardTitle>
                      <p className="text-sm text-gray-600">{session.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(session.sessionStatus)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Data Points</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-lg font-semibold">{session.dataPointCount}</p>
                      {session.dataPointCount > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDataPoints(session.id)}
                          className="h-6 px-2 text-xs"
                        >
                          View
                        </Button>
                      )}
                    </div>
                    {session.recordCount && session.recordCount !== session.dataPointCount && (
                      <p className="text-xs text-orange-600">
                        Expected: {session.recordCount}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Year</p>
                    <p className="text-lg font-semibold">{session.dataYear}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created</p>
                    <p className="text-sm">{new Date(session.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Session Status</p>
                    <p className="text-sm">{session.sessionStatus}</p>
                  </div>
                </div>



                <div className="flex flex-wrap gap-2">
                  {/* Show activate/deactivate buttons only for sessions with data */}
                  {(session.sessionStatus === 'active' || session.sessionStatus === 'inactive') && (
                    <>
                      {session.sessionStatus === 'active' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSessionAction(session.id, 'deactivate')}
                          disabled={updatingSession === session.id}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSessionAction(session.id, 'activate')}
                          disabled={updatingSession === session.id}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Activate
                        </Button>
                      )}
                    </>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const message = session.dataPointCount > 0 
                        ? `This will permanently delete ${session.dataPointCount} data points. Are you sure?`
                        : 'This will permanently delete this session. Are you sure?';
                      if (confirm(message)) {
                        handleSessionAction(session.id, 'delete');
                      }
                    }}
                    disabled={updatingSession === session.id}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Data Points Modal */}
      {showDataPointsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Data Points for Session {selectedSession}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDataPointsModal(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2">State</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Statistic</th>
                    <th className="text-left p-2">Year</th>
                    <th className="text-right p-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {dataPoints.map((point, index) => (
                    <tr key={point.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{point.stateName || `State ${point.stateId}`}</td>
                      <td className="p-2">{point.categoryName || 'N/A'}</td>
                      <td className="p-2">{point.statisticName || `Statistic ${point.statisticId}`}</td>
                      <td className="p-2">{point.year}</td>
                      <td className="p-2 text-right">{point.value.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              Showing {dataPoints.length} data points
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 