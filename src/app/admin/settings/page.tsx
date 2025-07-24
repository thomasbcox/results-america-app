'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings as SettingsIcon, 
  RefreshCw, 
  Database,
  Shield,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface SystemSettings {
  cacheEnabled: boolean;
  cacheTTL: number;
  maxRequestsPerMinute: number;
  enableAnalytics: boolean;
  maintenanceMode: boolean;
  autoBackup: boolean;
  backupFrequency: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<SystemSettings>({
    cacheEnabled: true,
    cacheTTL: 3600,
    maxRequestsPerMinute: 1000,
    enableAnalytics: true,
    maintenanceMode: false,
    autoBackup: true,
    backupFrequency: 'daily'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleMaintenanceMode = async (enabled: boolean) => {
    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      
      if (response.ok) {
        setSettings(prev => ({ ...prev, maintenanceMode: enabled }));
        setMessage({ 
          type: 'success', 
          text: `Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully` 
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to toggle maintenance mode' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error toggling maintenance mode' });
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/clear-data', { method: 'POST' });
      if (response.ok) {
        setMessage({ type: 'success', text: 'All data cleared successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to clear data' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error clearing data' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-2">Configure system behavior and maintenance</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={handleSaveSettings} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Cache Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Cache Configuration
          </CardTitle>
          <CardDescription>
            Configure caching behavior for improved performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Caching</label>
              <p className="text-sm text-gray-500">Cache frequently accessed data</p>
            </div>
            <input
              type="checkbox"
              checked={settings.cacheEnabled}
              onChange={(e) => setSettings(prev => ({ ...prev, cacheEnabled: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cache TTL (seconds)
            </label>
            <input
              type="number"
              value={settings.cacheTTL}
              onChange={(e) => setSettings(prev => ({ ...prev, cacheTTL: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="60"
              max="86400"
            />
            <p className="text-sm text-gray-500 mt-1">Time to live for cached data (60-86400 seconds)</p>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Rate Limiting
          </CardTitle>
          <CardDescription>
            Configure request rate limits to prevent abuse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Requests Per Minute
            </label>
            <input
              type="number"
              value={settings.maxRequestsPerMinute}
              onChange={(e) => setSettings(prev => ({ ...prev, maxRequestsPerMinute: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="10"
              max="10000"
            />
            <p className="text-sm text-gray-500 mt-1">Maximum requests allowed per minute per IP</p>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <SettingsIcon className="h-5 w-5 mr-2" />
            Analytics & Monitoring
          </CardTitle>
          <CardDescription>
            Configure analytics and monitoring features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Analytics</label>
              <p className="text-sm text-gray-500">Track usage patterns and performance</p>
            </div>
            <input
              type="checkbox"
              checked={settings.enableAnalytics}
              onChange={(e) => setSettings(prev => ({ ...prev, enableAnalytics: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto Backup</label>
              <p className="text-sm text-gray-500">Automatically backup data</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoBackup}
              onChange={(e) => setSettings(prev => ({ ...prev, autoBackup: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          
          {settings.autoBackup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Backup Frequency
              </label>
              <select
                value={settings.backupFrequency}
                onChange={(e) => setSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Maintenance Mode
          </CardTitle>
          <CardDescription>
            Enable maintenance mode to restrict access during updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Maintenance Mode</p>
              <p className="text-sm text-gray-500">
                {settings.maintenanceMode 
                  ? 'System is in maintenance mode - only admins can access'
                  : 'System is running normally'
                }
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={settings.maintenanceMode ? "default" : "outline"}
                onClick={() => handleMaintenanceMode(true)}
                disabled={settings.maintenanceMode}
                className={settings.maintenanceMode ? "bg-orange-600 hover:bg-orange-700" : ""}
              >
                Enable
              </Button>
              <Button
                variant={!settings.maintenanceMode ? "default" : "outline"}
                onClick={() => handleMaintenanceMode(false)}
                disabled={!settings.maintenanceMode}
                className={!settings.maintenanceMode ? "bg-green-600 hover:bg-green-700" : ""}
              >
                Disable
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dangerous Actions */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center text-red-700">
            <Trash2 className="h-5 w-5 mr-2" />
            Dangerous Actions
          </CardTitle>
          <CardDescription className="text-red-600">
            These actions cannot be undone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
              <div>
                <h4 className="font-medium text-red-800">Clear All Data</h4>
                <p className="text-sm text-red-600">
                  Permanently delete all data points, statistics, and categories
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleClearAllData}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Data
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div>
                <h4 className="font-medium text-yellow-800">Reset to Default Settings</h4>
                <p className="text-sm text-yellow-600">
                  Reset all settings to their default values
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('Reset all settings to defaults?')) {
                    setSettings({
                      cacheEnabled: true,
                      cacheTTL: 3600,
                      maxRequestsPerMinute: 1000,
                      enableAnalytics: true,
                      maintenanceMode: false,
                      autoBackup: true,
                      backupFrequency: 'daily'
                    });
                    setMessage({ type: 'success', text: 'Settings reset to defaults' });
                  }
                }}
              >
                Reset Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Current system status and version</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Application</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Version: 1.0.0</div>
                <div>Environment: Production</div>
                <div>Node.js: 18.x</div>
                <div>Database: SQLite</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Status</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-green-600">Database: Connected</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-green-600">Cache: Active</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-green-600">API: Running</span>
                </div>
                <div className="flex items-center">
                  {settings.maintenanceMode ? (
                    <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  )}
                  <span className={settings.maintenanceMode ? "text-orange-600" : "text-green-600"}>
                    Maintenance: {settings.maintenanceMode ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 