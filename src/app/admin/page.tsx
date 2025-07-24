'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3, 
  Users, 
  FileText,
  Globe,
  TrendingUp,
  Shield
} from 'lucide-react';

interface SystemStats {
  totalStates: number;
  totalCategories: number;
  totalStatistics: number;
  totalDataPoints: number;
  totalDataSources: number;
  totalImportSessions: number;
  lastImportDate?: string;
  cacheSize: number;
}

interface DataIntegrityCheck {
  orphanedDataPoints: number;
  missingSources: number;
  duplicateStates: number;
  duplicateCategories: number;
  issues: string[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [integrity, setIntegrity] = useState<DataIntegrityCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [cacheRebuilding, setCacheRebuilding] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  const fetchAdminData = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      setStats(data.stats);
      setIntegrity(data.integrity);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    setSeeding(true);
    try {
      const response = await fetch('/api/admin/seed', { method: 'POST' });
      const result = await response.json();
      if (response.ok) {
        setLastAction('Database seeded successfully');
        await fetchAdminData();
      } else {
        setLastAction(`Seeding failed: ${result.error}`);
      }
    } catch (error) {
      setLastAction(`Seeding error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleRebuildCache = async () => {
    setCacheRebuilding(true);
    try {
      const response = await fetch('/api/admin/cache', { method: 'POST' });
      const result = await response.json();
      if (response.ok) {
        setLastAction('Cache rebuilt successfully');
        await fetchAdminData();
      } else {
        setLastAction(`Cache rebuild failed: ${result.error}`);
      }
    } catch (error) {
      setLastAction(`Cache rebuild error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCacheRebuilding(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  const hasIssues = integrity && integrity.issues.length > 0;
  const totalIssues = integrity ? 
    integrity.orphanedDataPoints + integrity.missingSources + integrity.duplicateStates + integrity.duplicateCategories : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor system health and manage data</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={handleSeedDatabase} 
            disabled={seeding}
            className="bg-green-600 hover:bg-green-700"
          >
            {seeding ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Seeding...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Seed Database
              </>
            )}
          </Button>
          <Button 
            onClick={handleRebuildCache} 
            disabled={cacheRebuilding}
            variant="outline"
          >
            {cacheRebuilding ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Rebuilding...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Rebuild Cache
              </>
            )}
          </Button>
        </div>
      </div>

      {lastAction && (
        <Alert className={lastAction.includes('failed') || lastAction.includes('error') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertDescription className={lastAction.includes('failed') || lastAction.includes('error') ? 'text-red-800' : 'text-green-800'}>
            {lastAction}
          </AlertDescription>
        </Alert>
      )}

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">States</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStates || 0}</div>
            <p className="text-xs text-muted-foreground">Total states in database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCategories || 0}</div>
            <p className="text-xs text-muted-foreground">Data categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statistics</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStatistics || 0}</div>
            <p className="text-xs text-muted-foreground">Total metrics</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDataPoints?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Total data records</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Integrity Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Data Integrity Status
          </CardTitle>
          <CardDescription>
            System health and data consistency checks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasIssues ? (
            <div className="space-y-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700 font-medium">
                  {totalIssues} integrity issues detected
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {integrity.orphanedDataPoints > 0 && (
                  <Badge variant="destructive">
                    {integrity.orphanedDataPoints} orphaned data points
                  </Badge>
                )}
                {integrity.missingSources > 0 && (
                  <Badge variant="destructive">
                    {integrity.missingSources} missing sources
                  </Badge>
                )}
                {integrity.duplicateStates > 0 && (
                  <Badge variant="destructive">
                    {integrity.duplicateStates} duplicate states
                  </Badge>
                )}
                {integrity.duplicateCategories > 0 && (
                  <Badge variant="destructive">
                    {integrity.duplicateCategories} duplicate categories
                  </Badge>
                )}
              </div>
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h4 className="font-medium text-red-800 mb-2">Issues Found:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {integrity.issues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex items-center text-green-700">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">All data integrity checks passed</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Sources</CardTitle>
            <CardDescription>External data providers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDataSources || 0}</div>
            <p className="text-sm text-muted-foreground">Active data sources</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Sessions</CardTitle>
            <CardDescription>Data import history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalImportSessions || 0}</div>
            <p className="text-sm text-muted-foreground">
              Last import: {stats?.lastImportDate ? new Date(stats.lastImportDate).toLocaleDateString() : 'Never'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center"
              onClick={() => window.location.href = '/admin/users'}
            >
              <Users className="h-6 w-6 mb-2" />
              <span>User Management</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center"
              onClick={() => window.location.href = '/admin/data'}
            >
              <Database className="h-6 w-6 mb-2" />
              <span>Data Management</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center opacity-50 cursor-not-allowed"
              disabled
            >
              <BarChart3 className="h-6 w-6 mb-2" />
              <span>Usage Analytics</span>
              <Badge variant="secondary" className="text-xs mt-1">Coming Soon</Badge>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center"
              onClick={() => window.location.href = '/admin/settings'}
            >
              <Shield className="h-6 w-6 mb-2" />
              <span>System Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 