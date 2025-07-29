"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { Users, UserCheck, UserX, Mail, Calendar, Shield } from "lucide-react";

interface User {
  id: number;
  email: string;
  role: string;
  isActive: number;
  emailVerified: number;
  createdAt: string;
  lastLoginAt?: string;
}

export default function AdminUsersPage() {
  const { addToast } = useToast();
  const { confirm } = useConfirmDialog();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        // The API returns { users: [...], pagination: {...} }
        setUsers(data.data?.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/promote`, {
        method: "POST",
      });
      if (response.ok) {
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to promote user:", error);
    }
  };

  const handleDeactivateUser = async (userId: number) => {
    confirm({
      title: 'Confirm Deactivation',
      message: 'Are you sure you want to deactivate this user?',
      confirmText: 'Deactivate',
      cancelText: 'Cancel',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/users/${userId}`, {
            method: "DELETE",
          });
          if (response.ok) {
            addToast({
              type: 'success',
              title: 'User Deactivated',
              message: 'User has been deactivated successfully'
            });
            fetchUsers(); // Refresh the list
          } else {
            const error = await response.json();
            addToast({
              type: 'error',
              title: 'Deactivation Failed',
              message: error.error || 'Unknown error'
            });
          }
        } catch (error) {
          console.error("Failed to deactivate user:", error);
          addToast({
            type: 'error',
            title: 'Deactivation Failed',
            message: 'Failed to deactivate user due to a network error'
          });
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      {/* Stats */}
      <div className="px-4 sm:px-0 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(user => user.role === 'admin').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(user => user.isActive === 1).length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Users List */}
      <div className="px-4 sm:px-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users
            </CardTitle>
            <CardDescription>
              Manage user accounts and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{user.email.split('@')[0]}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                      <Badge variant={user.isActive === 1 ? 'default' : 'destructive'}>
                        {user.isActive === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                      {user.emailVerified === 1 && (
                        <Badge variant="outline">Verified</Badge>
                      )}
                      <div className="flex space-x-1">
                        {user.role !== 'admin' && (
                          <Button
                            size="sm"
                            onClick={() => handlePromoteUser(user.id)}
                            className="flex items-center space-x-1"
                          >
                            <Shield className="h-3 w-3" />
                            <span>Promote</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeactivateUser(user.id)}
                        >
                          {user.isActive === 1 ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No users found</p>
                  <p className="text-sm">Users will appear here once they register</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 