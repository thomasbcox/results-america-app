"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { Settings, Save, Database, Shield, Bell, Globe } from "lucide-react";

export default function AdminSettingsPage() {
  const { addToast } = useToast();
  const { confirm } = useConfirmDialog();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'Results America',
    siteDescription: 'Data-driven insights for state comparison',
    maintenanceMode: false,
    debugMode: false,
    emailNotifications: true,
    dataRetentionDays: 365,
    allowRegistrations: true,
    requireEmailVerification: true,
    maxFileUploadSize: 10,
    enableNotifications: true,
    enableAnalytics: false
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Settings saved successfully!'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    confirm({
      title: 'Confirm Reset',
      message: 'Are you sure you want to reset all settings to defaults?',
      confirmText: 'Reset',
      cancelText: 'Cancel',
      variant: 'warning',
      onConfirm: () => {
        setSettings({
          siteName: 'Results America',
          siteDescription: 'Data-driven insights for state comparison',
          maintenanceMode: false,
          debugMode: false,
          emailNotifications: true,
          dataRetentionDays: 365,
          allowRegistrations: true,
          requireEmailVerification: true,
          maxFileUploadSize: 10,
          enableNotifications: true,
          enableAnalytics: false
        });
        addToast({
          type: 'success',
          title: 'Settings Reset',
          message: 'Settings have been reset to defaults'
        });
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure system settings and preferences
        </p>
      </div>

      <div className="px-4 sm:px-0 space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Basic site configuration and branding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Input
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Authentication and security preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-gray-500">
                  Temporarily disable the site for maintenance
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow New Registrations</Label>
                <p className="text-sm text-gray-500">
                  Allow new users to create accounts
                </p>
              </div>
              <Switch
                checked={settings.allowRegistrations}
                onCheckedChange={(checked) => setSettings({...settings, allowRegistrations: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Email Verification</Label>
                <p className="text-sm text-gray-500">
                  Require users to verify their email address
                </p>
              </div>
              <Switch
                checked={settings.requireEmailVerification}
                onCheckedChange={(checked) => setSettings({...settings, requireEmailVerification: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Settings
            </CardTitle>
            <CardDescription>
              File upload and data management preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxFileUploadSize">Maximum File Upload Size (MB)</Label>
              <Input
                id="maxFileUploadSize"
                type="number"
                value={settings.maxFileUploadSize}
                onChange={(e) => setSettings({...settings, maxFileUploadSize: parseInt(e.target.value)})}
                min="1"
                max="100"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              System notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Notifications</Label>
                <p className="text-sm text-gray-500">
                  Send system notifications to users
                </p>
              </div>
              <Switch
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => setSettings({...settings, enableNotifications: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Analytics</Label>
                <p className="text-sm text-gray-500">
                  Collect usage analytics and metrics
                </p>
              </div>
              <Switch
                checked={settings.enableAnalytics}
                onCheckedChange={(checked) => setSettings({...settings, enableAnalytics: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={handleResetSettings}
          >
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
} 