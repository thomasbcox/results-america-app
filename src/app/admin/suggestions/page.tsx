"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { MessageSquare, CheckCircle, XCircle, Clock, Filter } from "lucide-react";

interface Suggestion {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSuggestionsPage() {
  const { addToast } = useToast();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchSuggestions();
  }, [statusFilter]);

  const fetchSuggestions = async () => {
    try {
      const url = statusFilter === 'all' 
        ? '/api/admin/suggestions'
        : `/api/admin/suggestions?status=${statusFilter}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (suggestionId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/suggestions/${suggestionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Status Updated',
          message: `Suggestion status updated to ${newStatus}`
        });
        fetchSuggestions(); // Refresh the list
      } else {
        const error = await response.json();
        addToast({
          type: 'error',
          title: 'Update Failed',
          message: error.error || 'Unknown error'
        });
      }
    } catch (error) {
      console.error("Failed to update suggestion status:", error);
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update status due to a network error'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      implemented: 'default'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      new_statistic: 'default',
      data_improvement: 'secondary',
      feature_request: 'outline',
      bug_report: 'destructive'
    };

    return (
      <Badge variant={variants[category] || 'outline'}>
        {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading suggestions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900">Suggestion Management</h1>
        <p className="mt-2 text-gray-600">
          Review and manage user suggestions for improvements
        </p>
      </div>

      {/* Stats */}
      <div className="px-4 sm:px-0 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Suggestions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suggestions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {suggestions.filter(s => s.status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {suggestions.filter(s => s.status === 'approved').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Implemented</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {suggestions.filter(s => s.status === 'implemented').length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filter */}
      <div className="px-4 sm:px-0 mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="implemented">Implemented</option>
          </select>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="px-4 sm:px-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              User Suggestions
            </CardTitle>
            <CardDescription>
              Review and manage user feedback and feature requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{suggestion.title}</h3>
                        {getStatusBadge(suggestion.status)}
                        {getCategoryBadge(suggestion.category)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                      <div className="text-xs text-gray-500">
                        <p>From: {suggestion.email}</p>
                        <p>Submitted: {new Date(suggestion.createdAt).toLocaleDateString()}</p>
                        {suggestion.updatedAt !== suggestion.createdAt && (
                          <p>Updated: {new Date(suggestion.updatedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {suggestion.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(suggestion.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(suggestion.id, 'rejected')}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {suggestion.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(suggestion.id, 'implemented')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark Implemented
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {suggestions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No suggestions found</p>
                  <p className="text-sm">
                    {statusFilter === 'all' 
                      ? 'Users will appear here once they submit suggestions'
                      : `No ${statusFilter} suggestions found`
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 