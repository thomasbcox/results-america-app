"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, BarChart3, MessageSquare, Database, TrendingUp, Activity } from "lucide-react";
import Link from "next/link";

interface SystemStats {
  users: {
    total: number;
    active: number;
    admins: number;
  };
  suggestions: {
    total: number;
    pending: number;
  };
  data: {
    statistics: number;
    categories: number;
    dataPoints: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load admin dashboard</p>
          <Button onClick={fetchStats} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage users, suggestions, and system data
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 sm:px-0 mb-8">
        {/* Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.users.active} active, {stats.users.admins} admins
            </p>
          </CardContent>
        </Card>

        {/* Suggestions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suggestions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suggestions.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.suggestions.pending} pending review
            </p>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statistics</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.data.statistics}</div>
            <p className="text-xs text-muted-foreground">
              {stats.data.categories} categories
            </p>
          </CardContent>
        </Card>

        {/* Data Points Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.data.dataPoints}</div>
            <p className="text-xs text-muted-foreground">
              Total data records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 sm:px-0">
        {/* User Management */}
        <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user accounts, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/users">
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200">
                  <Users className="mr-2 h-4 w-4" />
                  View All Users
                </Button>
              </Link>
              <div className="text-sm text-gray-600">
                <p>Active users: {stats.users.active}</p>
                <p>Admin users: {stats.users.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suggestions Management */}
        <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Suggestions
            </CardTitle>
            <CardDescription>
              Review and manage user suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/suggestions">
                <Button className="w-full justify-start bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all duration-200">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Review Suggestions
                </Button>
              </Link>
              <div className="text-sm text-gray-600">
                <p>Total: {stats.suggestions.total}</p>
                <p>Pending: {stats.suggestions.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>
              Manage statistics, categories, and data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/data">
                <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md transition-all duration-200">
                  <Database className="mr-2 h-4 w-4" />
                  Manage Data
                </Button>
              </Link>
              <div className="text-sm text-gray-600">
                <p>Statistics: {stats.data.statistics}</p>
                <p>Categories: {stats.data.categories}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 px-4 sm:px-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest user registrations and suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Recent activity will appear here</p>
              <p className="text-sm">Coming soon...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 